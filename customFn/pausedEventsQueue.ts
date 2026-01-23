import { useCallback, useRef } from 'react';

type Obj = {
  id: string;
  once?: boolean; // 리소스의 묵시적 덮어씀 동작을 불허할지 여부, true 인 경우 해당 리소스는 unSetReady 호출하여 명시적으로 제거 후 재 할당하여야 한다.
  obj: unknown;
};
type QueuingReq<P, R> = {
  id: string;
  fn: QueuedFn<P, R>;
  delayed?: boolean /** true 로 설정할 시 runWhenReady 호출 시점에 리소스가 존재하더라도 queued 상태로 대기, 이후 신규 리소스 할당 시(setReady 호출 시) 실행. 재차 호출되는 영역에서 신규 리소스가 이후 시점에 사용 가능할 때 유용. 해당 값을 동적으로 설정하는 건 사용자의 책임 */;
};
type QueuedFn<P, R> = (props: P) => R | Promise<R>;
type Task = {
  id: string;
  run: (obj: unknown) => any | Promise<any>;
  resolve: (v: any) => void;
  reject: (e: unknown) => void;
};

/**
 * 파일명: pausedEventsQueue.ts
 * 설명: 컴포넌트 단위 영역에서 특정 시점에 콜백을 실행하는데 필요한 값이 준비되지 못하였을 시(컴포넌트 마운트 시점의 참조 등) 실행 대기 Queue 에 적치할수 있도록 지원하는 코드,
 *      이후 준비될 시 주어진 함수 호출하여 적치된 콜백 실행.
 *      사용자는 필요할 때 콜백을 runWhenReady 에 id, 지연 여부를 명시하여 호출하고 이에 필요한(id로 대응되는) 리소스의 적절한 설정, 갱신의 책임만을 가짐(by setReady or unSetReady).
 *      콜백은 동일 id로 다수 등록하는 것도 가능하나 등록 시점에 해당 콜백이 참조하는 지역변수 및 race condition 은 사용자가 관리하여야
 *      적치된 콜백은 대응되는 리소스가 존재하는 시점에 호출과 동시에 제거됨, 이에 반해 리소스는 별도 갱신이 없을 시 영속됨
 * 작성자: Junsung Park
 * 작성일: 2025-10-28
 * 수정이력:
 *   - 2025-10-28: 초기 작성
 *   - 2025-10-29: 지연 실행 기능(delayed) 추가
 */
export function usePausedEventQueue() {
  const preparedObjRef = useRef<Obj[]>([]); // 준비된 리소스 목록
  const queueRef = useRef<Task[]>([]); // 적치된 작업(콜백) 목록

  /**
   * 리소스를 받아들여 적치 및 해당 리소스가 필요한 적치된 콜백이 존재할 시 트리거하는 함수
   * id는 본 리소스가 필요한 등록된 콜백 식별을 위한 식별자, obj는 실 리소스
   * 이때 트리거된 적치된 콜백은 적치 배열에서 제거됨
   * unSetReady 호출 이전까지 특정 id에 대응하는 리소스는 덮어쓰여지거나 영속됨
   * */
  const setReady = useCallback((passed: Obj): void => {
    /**
     * 본 영역은 주어진 리소스를 바탕으로 기존 queue 를 동기화하는 영역
     * 주어진 id에 대응하는 기존 리소스 존재하며 덮어씀 허용될 시 주어진 리소스로 override
     * */
    if (preparedObjRef.current.filter((prepared) => prepared.id == passed.id).length != 0) {
      // 기존 리소스 존재
      if (preparedObjRef.current.filter((prepared) => prepared.id == passed.id)[0].once) {
        // 기존 리소스 할당 시점에 덮어씀을 불허한 상황에서 중복되는 리소스 포함하려 시도하는 중일 시(배포 환경 아닌 경우 한정)
        if (process.env.NODE_ENV != 'production') {
          console.error(
            '{customFn/pausedEventsQueue.ts} ',
            '경고: 이미 적치된 리소스를 동일한 id 로 재 할당하려 시도하는 중입니다. 내부적으로 가드 구조를 가지고 있어 오동작이 방지되나 성능상의 손실이 일부 발생할 여지가 있으니 리소스를 변경하고자 할시 unSetReady 호출 이후 시점에서 다시 시도하십시요.',
          );
        }
        return; // 중단 시점
      } else {
        // 기존 리소스 제거
        preparedObjRef.current = preparedObjRef.current.filter((prepared) => prepared.id != passed.id);
      }
    }
    preparedObjRef.current.push(passed); // 추후 runWhenReady 호출 시 사용될 리소스 적치

    /**
     * 대응되는 콜백 검사 후 실행하는 영역
     * 동일 id로 대응되는 모든 콜백을 일제히 실행함
     * */
    for (let i = 0; i < queueRef.current.length; i++) {
      // 해당 리소스에 대응하는 적치된 콜백이 존재하는지 검사
      if (queueRef.current[i].id == passed.id) {
        try {
          Promise.resolve(queueRef.current[i].run(passed.obj)).then(queueRef.current[i].resolve, queueRef.current[i].reject); // id에 대응되는 함수 존재 시 즉시 실행
          queueRef.current = queueRef.current.filter((queued) => queued.id != passed.id); // 호출된 콜백은 적치 목록에서 제거
        } catch (e) {
          queueRef.current[i].reject(e);
        }
      }
    }
  }, []);

  /** 삭제할 리소스에 대응하는 id를 전달하여 해당 리소스 제거*/
  const unSetReady = useCallback((targetId: string) => {
    preparedObjRef.current = preparedObjRef.current.filter((prepared) => prepared.id != targetId);
  }, []);

  /**
   * 실행하고자 하는 함수를 본 콜백을 통해 호출 혹은 적치(이미 적치되어 있을 시 단순 호출과 유사하도록 구성)
   * delayed true 인 경우 기존에 적치된 값은 무시하며 추후 setReady 를 통하여 대응되는 값이 재할당될 시 해당 id에 대응되는 콜백을 실행함
   * 본 메서드를 통해 적치된 콜백은 호출되는 시점에서 제거됨
   * 신규 적치를 보장하여 호출 영역에서의 지역 변수가 일관되게 사용됨을 보장
   * */
  const runWhenReady = useCallback(<P, R>(passed: QueuingReq<P, R>) => {
    /**
     * delayed 설정이 부재한 경우 한정으로 기존의 적치된 값 존재할 시 대기 없이 주어진 함수를 즉시 실행하는 영역
     * */
    if (passed.delayed != true) {
      // delayed 요청 존재할 시 기존의 적치된 값을 기반으로 실행하지 않음 --> 신규 적치로 인한 setReady 호출 시 실행됨
      for (let i = 0; i < preparedObjRef.current.length; i++) {
        if (preparedObjRef.current[i].id == passed.id) {
          /** 이미 필요한 값이 적치되어 있을 시 즉시 실행,
           *  이 시점에는 설령 이전에 동일한 id 로 콜백을 다수 할당하였을지라도 이전에 적치된 값(해당 시점에 발견된 값 이전에 적치된 임의의 값)으로 인하여 기존에 해당 id에 대응하는 콜백들은 전부 처리되었으리라 가정 가능 */
          return new Promise<R>((resolve, reject) => {
            try {
              resolve(passed.fn(preparedObjRef.current[i].obj as P)); // id에 따라 값의 타입이 자명해지므로 단언 처리
            } catch (e) {
              reject(e);
            }
          });
        }
      }
    }

    /**
     * 아직 필요한 값이 적치되지 않은 상태인 경우 콜백 함수 신규 적치
     * 이때 하나의 id로 여러 콜백을 등록하는 것도 가능하나 해당 시점에 참조하는 지역변수, race condition 등 고려하여야
     * */
    // if (queueRef.current.filter((queued) => queued.id == passed.id).length != 0) {
    //   // 기존 콜백이 존재할 시 삭제(호출 시점의 지역변수 동기화)
    //   queueRef.current = queueRef.current.filter((queued) => queued.id != passed.id);
    // }
    // 신규 적치
    return new Promise<R>((resolve, reject) => {
      queueRef.current.push({
        id: passed.id,
        run: (x) => passed.fn(x as P),
        resolve,
        reject,
      });
    });
  }, []);

  return { runWhenReady, setReady, unSetReady }; // unSetReady 는 사용하는 컴포넌트의 구조 분해 영역에서 명시하지 않음으로서 사용하지 않을 수 있음(optional)
}
