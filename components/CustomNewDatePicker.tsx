import React, { useEffect, useRef, useState, useImperativeHandle, useReducer, useMemo } from 'react';
import { DatePicker, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko'; // 한국어 로케일 추가
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toastError } from './ToastMessage';
import { useSession } from 'next-auth/react';
import { Utils } from '../libs/utils';
// 플러그인 등록
dayjs.extend(utc);
dayjs.extend(timezone);
// 기본 타임존을 한국(KST)으로 설정
dayjs.tz.setDefault('Asia/Seoul');
dayjs.extend(weekday); // weekday 플러그인 확장
dayjs.locale('ko'); // 기본 한국어 로케일 사용

import weekday from 'dayjs/plugin/weekday';
import useUpdateEffect from '../customHook/useUpdateEffect'; // week 시작일 설정

export type DatePickerSelectType = 'today' | 'week' | 'month' | 'year' | 'decade' | 'type';

export interface CustomNewDatePickerRefInterface {
  initDatePicker: (type: DatePickerSelectType, startDate: Dayjs, endDate: Dayjs) => void;
  datePickerFocus: () => void;
}

interface Props {
  title?: string;
  type?: 'date' | 'range';
  name?: string;
  startName?: string;
  endName?: string;
  value?: string | string[];
  disable?: boolean;
  onChange?: (name: string | undefined, value: string | undefined) => void;
  onEnter?: () => void;
  placeholder?: string;
  required?: boolean;
  //filters?: object;
  format?: string;
  defaultValue?: string;
  //onClick?: () => void;
  className?: string;
  selectType?: DatePickerSelectType;
  maxDays?: number;
  defaultType?: DatePickerSelectType;
  //initDatePicker?: (selectedType: DatePickerSelectType, startDate: Dayjs, endDate: Dayjs) => void;
  disabled?: boolean; // 디스에이블 여부 date타입만 적용 20250326
  ref?: React.Ref<CustomNewDatePickerRefInterface>;

  onOpenChange?: ((open: boolean) => void) | undefined;
}

// 이하 리듀서 타입
interface DateStatus {
  selectedDate: Dayjs | null;
  rangeDate: [Dayjs | null, Dayjs | null];
  type: 'date' | 'range';

  // todo action 이 아닌 State 에는 payload 를 통하여 동기화되는 값에 따라 역시 동기화되어야 하는 상태를 추가 가능
}
type DateStatusAction =
  | {
      type: 'sync_by_value';
      payload: {
        value: Dayjs | [Dayjs | null, Dayjs | null] | null;
        type?: 'date' | 'range';
      };
    }
  | {
      type: 'sync_type';
      payload: {
        // selectedDate?: Dayjs | null;
        // rangeDate?: [Dayjs | null, Dayjs | null];
        type?: 'date' | 'range';
      }; // {key: value} 꼴로 요구되는 값 전달
    };

/** 컨텐츠 요소 상태 관리 리듀서 */
function DateStatusManagementReducerFn(state: DateStatus, action: DateStatusAction): DateStatus {
  if (action.type == 'sync_by_value') {
    if (state.type == 'date') {
      if (Array.isArray(action.payload.value)) {
        console.error('dispatch 시점에 요청한 동작에서 요구하는 데이터가 적절히 전달되지 못함');
        return state; // default
      }
      // todo

      if (state.selectedDate?.isSame(action.payload.value)) {
        return state; // 동일한 경우 동기화 생략
      }

      return {
        ...state,
        selectedDate: action.payload.value,
      };
    } else if (state.type == 'range') {
      if (!(Array.isArray(action.payload.value) && action.payload.value.length == 2)) {
        // 배열로 전달되었으나 길이가 2가 아닌 경우
        console.error('dispatch 시점에 요청한 동작에서 요구하는 데이터가 적절히 전달되지 못함');
        return state; // default
      }

      // todo

      // console.log(
      //   'action.payload.value.map((date, index) => date?.isSame(state.rangeDate[index])): ',
      //   action.payload.value.map((date, index) => date?.isSame(state.rangeDate[index])),
      //   action.payload.value.map((date, index) => date?.isSame(state.rangeDate[index])).includes(false),
      // );
      if (!action.payload.value.map((date, index) => (date == null ? false : date.isSame(state.rangeDate[index]))).includes(false)) {
        return state; // 동일한 경우 동기화 생략
      }

      if (Array.isArray(action.payload.value)) {
        return {
          ...state,
          rangeDate: action.payload.value,
        };
      }

      return {
        ...state,
        rangeDate: [action.payload.value as dayjs.Dayjs, action.payload.value as dayjs.Dayjs], // 앞뒤 요소를 value(동일 일자) 로 동기화
      };
    } else {
      console.error('유효하지 않은 type');
      return state; // default
    }
  } else if (action.type == 'sync_type') {
    if (!(action.payload.type == 'date' || action.payload.type == 'range')) {
      console.error('dispatch 시점에 요청한 동작에서 요구하는 데이터가 적절히 전달되지 못함');
      return state; // default
    }

    // todo

    return {
      ...state,
      type: action.payload.type,
    };
  } else {
    console.error('유효하지 않은 action type');
    return state; // default
  }
}

// 이하 해당 영역에서 사용할 상수
const BASE_OPTIONS: { value: DatePickerSelectType; label: string }[] = [
  { value: 'type', label: '입력' },
  { value: 'today', label: '일자' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
  { value: 'year', label: '1년' },
];

const CustomNewDatePicker = ({
  title,
  startName,
  endName,
  placeholder,
  value,
  name,
  onChange,
  onEnter,
  type = 'date', // 기본 단일일자(date)
  required = false,
  //filters,
  format = 'YYYY-MM-DD (ddd)',
  defaultValue,
  //onClick,
  maxDays,
  selectType,
  className,
  defaultType,
  //autoFocus = false,
  //initDatePicker,
  //upperComponentIsOpened,
  disabled,
  ref,
  onOpenChange,
}: Props) => {
  const today = dayjs(new Date());

  /** 참조 */
  const datePickerRef = useRef<React.ComponentRef<typeof DatePicker>>(null);
  const isKeyboardTriggered = useRef(false); // 참인 경우 키보드로 인한 동기화 동작이 발생한 직후

  /** 이하 지역 상태는 반드시 배열의 불변성을 유지할 것 */
  const [dateStatus, dispatchDateStatus] = useReducer(DateStatusManagementReducerFn, {
    selectedDate: null,
    rangeDate: [null, null],
    type: type,
  });

  const [tempRange, setTempRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]); // RangePicker 사용 시 날짜 영역 선택 후 동기화 이전 상태를 임시로 저장하는 local state

  const [open, setOpen] = useState(false);
  const [dropDownValue, setDropDownValue] = useState<DatePickerSelectType>(defaultType || 'type');
  const [panelMode, setPanelMode] = useState(dropDownValue);

  const handleInitDatePicker = (type: DatePickerSelectType, startDate: Dayjs, endDate: Dayjs) => {
    setOpen(false);
    setDropDownValue(type);

    dispatchDateStatus({ type: 'sync_by_value', payload: { value: [startDate, endDate] } });

    setTempRange([null, null]);
  };

  useImperativeHandle(ref, () => ({
    initDatePicker: handleInitDatePicker, // useImperativeHandle을 사용하여 외부에서 handleInitDatePicker 호출 가능하게 설정
    datePickerFocus: () => {
      datePickerRef.current?.focus();
    }, // type == 'date' 인 경우 한정으로 사용 가능
  }));

  const daySelectArray = [
    [0, 4],
    [5, 7],
    [8, 10],
  ];

  // const options2 = [
  //   { value: 'type', label: '입력' },
  //   { value: 'today', label: '일자' },
  //   { value: 'week', label: '주간' },
  //   { value: 'month', label: '월간' },
  //   { value: 'year', label: '1년' },
  // ].filter((option) => (selectType == defaultType ? defaultType == option.value : true)); // 한가지만 선택해야 되는경우

  /** selectType 인자가 주어진 경우 options 는 단일하게 고정됨 */
  const options = useMemo(
    //() => BASE_OPTIONS.filter((option) => (selectType == defaultType ? defaultType == option.value : true)), // 한가지만 선택해야 되는경우
    () => BASE_OPTIONS.filter((option) => (selectType != undefined ? selectType == option.value : true)), // 한가지만 선택해야 되는경우
    [selectType],
  );

  const moveSelection = (inPositons: number, input: HTMLInputElement) => {
    if (input) {
      input.focus();
      input.setSelectionRange(daySelectArray[inPositons][0], daySelectArray[inPositons][1]);
    }
  };

  /** 이하 4개의 useEffect hook 은 외부 값에 따른 수동 동기화를 처리하는 영역 */
  useEffect(() => {
    setOpen(false);
    if (defaultType) {
      setDropDownValue(defaultType);
    }
  }, [defaultType]);

  useEffect(() => {
    // 외부 type 상태 변경 시 동기화
    dispatchDateStatus({ type: 'sync_type', payload: { type: type || 'date' } });
  }, [type]);

  useEffect(() => {
    if (dateStatus.type === 'range') {
      // 'range' 타입일 때는 value가 배열 형태인지 확인
      if (Array.isArray(value) && value.length === 2) {
        const startDate = dayjs(value[0]);
        const endDate = dayjs(value[1]);
        if (startDate.isValid() && endDate.isValid()) {
          dispatchDateStatus({ type: 'sync_by_value', payload: { value: [startDate, endDate] } });

          setTempRange([startDate, endDate]);
        } else {
          dispatchDateStatus({ type: 'sync_by_value', payload: { value: [null, null] } }); // 유효하지 않으면 [null, null]
        }
      } else {
        dispatchDateStatus({ type: 'sync_by_value', payload: { value: [null, null] } }); // value가 배열이 아니면 초기화
      }
    } else if (dateStatus.type === 'date') {
      // value가 유효한 날짜 형식인지 체크하고 dayjs로 변환
      const parsedDate = dayjs((value as string) || defaultValue);
      if (parsedDate.isValid()) {
        dispatchDateStatus({ type: 'sync_by_value', payload: { value: parsedDate } });
      } else {
        dispatchDateStatus({ type: 'sync_by_value', payload: { value: null } }); // 유효하지 않으면 null로 설정
      }
    }
  }, [value]);

  useEffect(() => {
    setPanelMode(dropDownValue); // 초기 dropDownValue를 panelMode에 반영
  }, [dropDownValue]);

  /** 이하 둘은 리듀서 상태 변경에 따른 외부 콜백 호출 영역 */
  useUpdateEffect(() => {
    // 오리지널은 useEffect hook 이나 최초 랜더링 시점에 불필요히 동작하여 콜백의 취지를 훼손하는걸 방지하고자 이리 처리함
    if (onChange) {
      onChange(name, dateStatus.selectedDate == null ? undefined : dateStatus.selectedDate.format('YYYY-MM-DD'));
      isKeyboardTriggered.current = false; // 동기화(해제)
    }
  }, [dateStatus.selectedDate]);

  useUpdateEffect(() => {
    // 오리지널은 useEffect hook 이나 최초 랜더링 시점에 불필요히 동작하여 콜백의 취지를 훼손하는걸 방지하고자 이리 처리함
    if (!dateStatus.rangeDate.includes(null) && onChange) {
      if (dateStatus.rangeDate && dateStatus.rangeDate[0] && dateStatus.rangeDate[1]) {
        onChange(startName, dateStatus.rangeDate[0]?.format('YYYY-MM-DD'));
        onChange(endName, dateStatus.rangeDate[1]?.format('YYYY-MM-DD'));
      }
    }
  }, [dateStatus.rangeDate]);

  // 날짜 변경 핸들러
  const handleOnChange = (date: Dayjs | null, dateString: string | null) => {
    if (!isKeyboardTriggered.current) {
      // 키보드로 인한 동기화로 인한 호출이 아닌 경우 한정으로 호출됨을 보장
      dispatchDateStatus({ type: 'sync_by_value', payload: { value: !date ? null : date } }); // 선택된 날짜 설정
    }
  };

  /** 주어진 날짜에 해당하는 주, 월, 연에 해당하는 range 반환 */
  const settingDefaultValue = (rangeType: DatePickerSelectType, day: Dayjs | null): [Dayjs, Dayjs] => {
    const settingDay = day ? day : today;
    if (rangeType === 'week') {
      const startDate = settingDay.startOf('week').add(1, 'day'); // 월요일
      const endDate = settingDay.endOf('week').add(1, 'day'); // 일요일
      return [startDate, endDate];
    } else if (rangeType === 'month') {
      const startDate = settingDay.startOf('month');
      const endDate = settingDay.endOf('month');
      return [startDate, endDate];
    } else if (rangeType === 'year') {
      const startDate = settingDay.startOf('year');
      const endDate = settingDay.endOf('year');
      return [startDate, endDate];
    } else if (rangeType === 'today') {
      // "일자"일 때는 일자 ~ 일자로 처리
      const startDate = settingDay;
      const endDate = settingDay;
      return [startDate, endDate];
    } else {
      // type
      const startDate = settingDay;
      const endDate = settingDay;
      return [startDate, endDate];
    }
  };

  // 날짜 범위 계산 (주, 월, 연)
  const handleRangeChange = (date: Dayjs | null, rangeType: DatePickerSelectType) => {
    if (!date) {
      dispatchDateStatus({ type: 'sync_by_value', payload: { value: [null, null] } });
      return;
    }

    const startDate: Dayjs = settingDefaultValue(rangeType, date)[0];
    const endDate: Dayjs = settingDefaultValue(rangeType, date)[1];

    // maxDays 제한 체크
    if (maxDays && endDate.diff(startDate, 'day') + 1 > maxDays) {
      toastError(`최대 ${maxDays}일까지만 선택할 수 있어요`);
      return;
    }

    dispatchDateStatus({ type: 'sync_by_value', payload: { value: [startDate, endDate] } });

    if (onChange) {
      if (type === 'date') {
        onChange(name, startDate.format('YYYY-MM-DD'));
      }
    }
  };

  const onCalendarChange = (
    dates: [Dayjs | null, Dayjs | null],
    _: [string, string],
    info: {
      range?: 'start' | 'end';
    },
  ) => {
    if (dates && dates[0] && dates[1] && tempRange[0] && tempRange[1]) {
      const newBornDay = findNewDay(info.range || 'start', tempRange[0], tempRange[1], dates);
      if (!newBornDay) {
        return;
      }

      if (Utils.isSameDay(tempRange[0], tempRange[1])) {
        const rangeDates = Utils.firstMinDay(newBornDay!, tempRange[1]);
        setTempRange(rangeDates);
      } else {
        setTempRange([newBornDay, newBornDay]);
      }
    }
  };

  const findNewDay = (range: 'start' | 'end' | undefined, targetDay: Dayjs, targetDay2: Dayjs, mainDays: [Dayjs | null, Dayjs | null]) => {
    if (targetDay && targetDay2 && mainDays && mainDays[0] && mainDays[1]) {
      const isDifFirstValue = Utils.isDiffDay(targetDay, mainDays[0]) && Utils.isDiffDay(targetDay2, mainDays[0]);
      const isDifSecoundValue = Utils.isDiffDay(targetDay, mainDays[1]) && Utils.isDiffDay(targetDay2, mainDays[1]);

      if (isDifSecoundValue && isDifFirstValue) {
        if (range == 'end') {
          return mainDays[1];
        } else {
          return mainDays[0];
        }
      }

      if (Utils.isSameDay(mainDays[0], mainDays[1])) {
        return mainDays[0];
      }

      if (isDifFirstValue) {
        return mainDays[0];
      }

      if (isDifSecoundValue) {
        return mainDays[1];
      }

      if (isDifSecoundValue && isDifFirstValue) {
        if (range == 'end') {
          return mainDays[1];
        }
      }

      if (Utils.isSameDay(targetDay, targetDay2)) {
        if (range == 'end') {
          return mainDays[1];
        }
      }
    }

    return null;
  };

  const handleConfirm = () => {
    dispatchDateStatus({ type: 'sync_by_value', payload: { value: tempRange } }); // tempRange 값으로 dispatch

    setOpen(false);
  };

  const nowPosition = (inPositon: number) => {
    for (let i = 0; i < daySelectArray.length; i++) {
      if (daySelectArray[i][0] <= inPositon && inPositon <= daySelectArray[i][1]) {
        return i;
      }
    }
    return 0;
  };

  // 키 이벤트 처리(on type 'date')
  const handleKeyDownToday = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLInputElement;
    const selectionStart = target.selectionStart;
    if (selectionStart === null) {
      return;
    }

    const inputs = target.closest('.ant-picker')?.querySelectorAll('.ant-picker-input input') as NodeListOf<HTMLInputElement>;
    const firstInput = inputs[0].value.substring(0, 10); // 시작 날짜 input

    if (e.key == 'Delete') {
      dispatchDateStatus({ type: 'sync_by_value', payload: { value: null } });
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setOpen(false);
      if (target instanceof HTMLInputElement) {
        const selectionEnd = target.selectionEnd || 0;
        const strPos = [4, 7, 10].includes(selectionEnd) ? nowPosition(selectionStart) + 1 : nowPosition(selectionStart); // 날짜를 구분하는 '-' 영역에 포커싱되지 않도록 1을 증감
        if (strPos < 3) {
          moveSelection(strPos, target);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setOpen(false);
      if (target instanceof HTMLInputElement) {
        const selectionEnd = target.selectionEnd || 0;
        const strPos = [4, 7, 10].includes(selectionEnd) ? nowPosition(selectionStart) - 1 : nowPosition(selectionStart); // 날짜를 구분하는 '-' 영역에 포커싱되지 않도록 1을 차감
        if (-1 < strPos && strPos < 3) {
          moveSelection(strPos, target);
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(false);
      const addAndMinus = e.key === 'ArrowUp' ? 1 : -1;
      const strPos = nowPosition(selectionStart);
      const type = strPos == 0 ? 'year' : strPos == 1 ? 'month' : 'day';
      if (target === inputs[0]) {
        isKeyboardTriggered.current = true; // 동기화
        dispatchDateStatus({ type: 'sync_by_value', payload: { value: dayjs(firstInput).add(addAndMinus, type) } });
      }

      setTimeout(() => {
        moveSelection(strPos, target);
      }, 100);
    } else if (e.key === 'Enter') {
      e.preventDefault();

      if (onEnter) {
        onEnter();
      }

      setOpen(false);
      isKeyboardTriggered.current = true; // 동기화
      dispatchDateStatus({ type: 'sync_by_value', payload: { value: dayjs(firstInput) } });
    }
  };

  // 키 이벤트 처리(on type 'range')
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLInputElement;
    const selectionStart = target.selectionStart;
    if (selectionStart === null) {
      return;
    }

    const inputs = target.closest('.ant-picker')?.querySelectorAll('.ant-picker-input input') as NodeListOf<HTMLInputElement>;
    if (inputs == undefined) {
      return;
    }

    if (!inputs || inputs.length < 2) return;

    const firstInput = inputs[0].value.substring(0, 10); // 시작 날짜 input
    const secondInput = inputs[1].value.substring(0, 10); // 종료 날짜 input

    if (e.key == 'Delete') {
      e.preventDefault();
      if (target === inputs[0]) {
        dispatchDateStatus({ type: 'sync_by_value', payload: { value: [null, dateStatus.rangeDate[1]] } });
      } else if (target === inputs[1]) {
        dispatchDateStatus({ type: 'sync_by_value', payload: { value: [dateStatus.rangeDate[0], null] } });
      }
      setOpen(false);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setOpen(false);
      if (target instanceof HTMLInputElement) {
        const selectionEnd = target.selectionEnd || 0;
        const strPos = [4, 7, 10].includes(selectionEnd) ? nowPosition(selectionStart) + 1 : nowPosition(selectionStart); // 날짜를 구분하는 '-' 영역에 포커싱되지 않도록 1을 증감
        if (strPos < 3) {
          moveSelection(strPos, target);
        } else {
          if (target === inputs[0]) {
            inputs[1].focus();
            moveSelection(0, inputs[1]);
          }
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setOpen(false);
      if (target instanceof HTMLInputElement) {
        const selectionEnd = target.selectionEnd || 0;
        const strPos = [4, 7, 10].includes(selectionEnd) ? nowPosition(selectionStart) - 1 : nowPosition(selectionStart); // 날짜를 구분하는 '-' 영역에 포커싱되지 않도록 1을 차감
        if (-1 < strPos && strPos < 3) {
          moveSelection(strPos, target);
        } else {
          if (target === inputs[1]) {
            inputs[0].focus();
            moveSelection(2, inputs[0]);
          }
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(false);
      const addAndMinus = e.key === 'ArrowUp' ? 1 : -1;
      const strPos = nowPosition(selectionStart);
      const type = strPos == 0 ? 'year' : strPos == 1 ? 'month' : 'day';
      if (target === inputs[0]) {
        dispatchDateStatus({ type: 'sync_by_value', payload: { value: [dayjs(firstInput).add(addAndMinus, type), dayjs(secondInput)] } });
      } else if (target === inputs[1]) {
        dispatchDateStatus({ type: 'sync_by_value', payload: { value: [dayjs(firstInput), dayjs(secondInput).add(addAndMinus, type)] } });
      }

      setTimeout(() => {
        moveSelection(strPos, target);
      }, 100);
    } else if (e.key === 'Enter') {
      e.preventDefault();

      if (onEnter) {
        onEnter();
      }

      if (Utils.isValidDate(firstInput) && Utils.isValidDate(secondInput) && firstInput.length > 8 && secondInput.length > 8) {
        dispatchDateStatus({ type: 'sync_by_value', payload: { value: [dayjs(firstInput), dayjs(secondInput)] } });
      } else if (target === inputs[0] && firstInput.length === 8) {
        const firstDay = firstInput.substring(0, 8);
        if (Utils.isValidDate(firstDay)) {
          dispatchDateStatus({ type: 'sync_by_value', payload: { value: [dayjs(firstDay), dateStatus.rangeDate[1]] } });

          setTimeout(() => {
            inputs[1].focus();
            setOpen(false);
          }, 100);
        } else {
          toastError('첫번째 [' + firstDay + '] 날짜 입력이 잘못되었습니다.');
        }
      } else if (target === inputs[1] && secondInput.length === 8) {
        const secondDay = secondInput.substring(0, 8);
        if (Utils.isValidDate(secondDay)) {
          dispatchDateStatus({ type: 'sync_by_value', payload: { value: [dateStatus.rangeDate[0], dayjs(secondDay)] } });
          setOpen(false);
        } else {
          toastError('두번째 [' + secondDay + ']날짜 입력이 잘못되었습니다.');
        }
      }
    }
  };

  // 이전, 다음 버튼
  const handleClickPrevNext = (types: string, direction: string) => {
    let newDate;
    let startDate: Dayjs;
    let endDate: Dayjs;

    switch (types) {
      case 'date': {
        if (!dateStatus.selectedDate) return;
        // 하루 이동
        newDate = direction === 'prev' ? dateStatus.selectedDate.subtract(1, 'day') : dateStatus.selectedDate.add(1, 'day');

        dispatchDateStatus({ type: 'sync_by_value', payload: { value: newDate } });
        return;
      }

      case 'today': {
        if (!dateStatus.rangeDate[0] || !dateStatus.rangeDate[1]) return;
        // 일자
        startDate = direction === 'prev' ? dateStatus.rangeDate[0].subtract(1, 'day') : dateStatus.rangeDate[0].add(1, 'day');
        endDate = direction === 'prev' ? dateStatus.rangeDate[1].subtract(1, 'day') : dateStatus.rangeDate[1].add(1, 'day');
        break;
      }

      case 'week': {
        if (!dateStatus.rangeDate[0] || !dateStatus.rangeDate[1]) return;
        // 주간 이동
        startDate =
          direction === 'prev'
            ? dateStatus.rangeDate[0].subtract(1, 'week').startOf('week').add(1, 'day')
            : dateStatus.rangeDate[0].add(1, 'week').startOf('week').add(1, 'day');
        endDate = startDate.endOf('week').add(1, 'day');
        break;
      }

      case 'month': {
        if (!dateStatus.rangeDate[0] || !dateStatus.rangeDate[1]) return;
        // 월간 이동
        startDate =
          direction === 'prev' ? dateStatus.rangeDate[0].subtract(1, 'month').startOf('month') : dateStatus.rangeDate[0].add(1, 'month').startOf('month');
        endDate = startDate.endOf('month');
        break;
      }

      case 'year': {
        if (!dateStatus.rangeDate[0] || !dateStatus.rangeDate[1]) return;
        // 연간 이동
        startDate = direction === 'prev' ? dateStatus.rangeDate[0].subtract(1, 'year').startOf('year') : dateStatus.rangeDate[0].add(1, 'year').startOf('year');
        endDate = startDate.endOf('year');
        break;
      }

      case 'type': {
        if (!dateStatus.rangeDate[0] || !dateStatus.rangeDate[1]) return;
        // 사용자가 선택한 기간만큼 이동
        const rangeDiff = dateStatus.rangeDate[1].diff(dateStatus.rangeDate[0], 'day'); // 기간 차이 계산
        startDate =
          direction === 'prev'
            ? dateStatus.rangeDate[0].subtract(rangeDiff + 1, 'day') // 기존 기간만큼 이동
            : dateStatus.rangeDate[0].add(rangeDiff + 1, 'day');
        endDate = startDate.add(rangeDiff, 'day');
        break;
      }

      default:
        return;
    }

    // 주/월/년 이동 시 범위 상태 업데이트
    dispatchDateStatus({
      type: 'sync_by_value',
      payload: { value: [startDate, endDate] },
    });
  };

  // 결과날짜 클릭시 달력띄우기
  const handleResultClick = () => {
    //if (dropDownValue === 'range' && dateStatus.rangeDate[0] && dateStatus.rangeDate[1]) {
    if (dropDownValue === 'type' && dateStatus.rangeDate[0] && dateStatus.rangeDate[1]) {
      setOpen(true);
    } else {
      if (dropDownValue === 'year') {
        setPanelMode('year');
      } else if (dropDownValue === 'month') {
        setPanelMode('month');
      } else if (dropDownValue === 'week') {
        setPanelMode('week');
      } else if (dropDownValue === 'today') {
        setPanelMode('today');
      } else if (dropDownValue === 'decade') {
        setPanelMode('decade');
      }

      setTimeout(() => {
        setOpen(true);
      }, 100);
    }
  };

  // 드롭다운 변경시
  const handleOnChangeSelectedType = (sel: DatePickerSelectType) => {
    setDropDownValue(sel); // 드롭다운 값 변경
    // 기본값 설정
    const startDate: Dayjs = settingDefaultValue(sel, null)[0];
    const endDate: Dayjs = settingDefaultValue(sel, null)[1];
    //if (startDate && endDate && sel != 'date') { todo
    if (startDate && endDate) {
      dispatchDateStatus({
        type: 'sync_by_value',
        payload: { value: [dayjs(startDate), dayjs(endDate)] },
      });
      setTempRange([dayjs(startDate), dayjs(endDate)]);
    }
  };

  return (
    <div className={`datePickerBox ${!(type === 'date') ? 'range' : ''}`}>
      {type === 'date' ? (
        <>
          {title ? (
            <dl className={className}>
              <dt>
                <label>{title}</label>
                {required && <span className="req">*</span>}
              </dt>
              <dd>
                <div className="formBox border">
                  <DatePicker
                    ref={datePickerRef}
                    value={dateStatus.selectedDate}
                    name={name}
                    onChange={handleOnChange}
                    format={format}
                    placeholder={placeholder}
                    suffixIcon={null}
                    allowClear={false}
                    open={open}
                    onOpenChange={(isOpen) => {
                      if (onOpenChange) onOpenChange(isOpen);
                      setOpen(isOpen);
                    }}
                    onKeyDown={handleKeyDownToday}
                    needConfirm
                    panelRender={(panel) => (
                      // <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                      //   {panel}
                      // </div>
                      <div>{panel}</div>
                    )}
                    disabled={disabled}
                  />
                  <button
                    className={'left'}
                    onClick={() => {
                      handleClickPrevNext('date', 'prev');
                    }}
                    disabled={disabled}
                  >
                    왼쪽
                  </button>
                  <button
                    className={'right'}
                    onClick={() => {
                      handleClickPrevNext('date', 'next');
                    }}
                    disabled={disabled}
                  >
                    오른쪽
                  </button>
                </div>
              </dd>
            </dl>
          ) : (
            <div className={`formBox ${className}`}>
              <DatePicker
                ref={datePickerRef}
                value={dateStatus.selectedDate}
                name={name}
                onChange={handleOnChange}
                format={format}
                onOpenChange={(isOpen) => {
                  if (onOpenChange) onOpenChange(isOpen);
                  setOpen(isOpen);
                }}
                onKeyDown={handleKeyDownToday}
                placeholder={placeholder}
                needConfirm
                suffixIcon={null}
                allowClear={false}
                open={open}
                disabled={disabled}
              />
              <button
                className={'left'}
                onClick={() => {
                  handleClickPrevNext('date', 'prev');
                }}
                disabled={disabled}
              >
                왼쪽
              </button>
              <button
                className={'right'}
                onClick={() => {
                  handleClickPrevNext('date', 'next');
                }}
                disabled={disabled}
              >
                오른쪽
              </button>
            </div>
          )}
        </>
      ) : (
        // type === 'range'
        <dl className={className}>
          {title && (
            <dt className="rangeTitle">
              <label>{title}</label>
              {required && <span className="req">*</span>}
            </dt>
          )}
          {options.length == 1 ? (
            <dt>
              <label>{options[0].label}</label>
              {required && <span className="req">*</span>}
            </dt>
          ) : (
            <dt>
              <Select
                value={dropDownValue}
                onChange={handleOnChangeSelectedType}
                variant="borderless"
                classNames={{
                  popup: {
                    root: 'dateDropDown', // popupClassName={'dateDropDown'} 대용
                  },
                }}
              >
                {options.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>{' '}
            </dt>
          )}
          <dd>
            <div className={`formBox ${dropDownValue === 'type' ? 'type' : ''} border`}>
              {dropDownValue === 'type' ? (
                // "직접입력" 선택 시 범위 선택기 사용
                <>
                  <DatePicker.RangePicker
                    value={dateStatus.rangeDate} // [startDate, endDate] 배열로 전달
                    name={name}
                    format={{ format: 'YYYY-MM-DD (ddd)' }}
                    onKeyDown={handleKeyDown}
                    open={open}
                    onClick={(e) => {
                      if (open) {
                        if (e.target instanceof HTMLInputElement) {
                          const input: HTMLInputElement = e.target;
                          const selectionStart = input.selectionStart || 0;
                          console.log('park input selectionStart', selectionStart, input);
                          if (0 <= selectionStart && selectionStart <= 4) {
                            moveSelection(0, input);
                          } else if (5 <= selectionStart && selectionStart <= 7) {
                            moveSelection(1, input);
                          } else if (8 <= selectionStart) {
                            moveSelection(2, input);
                          }
                        }
                      }
                    }}
                    onOpenChange={(isOpen) => {
                      if (onOpenChange) onOpenChange(isOpen);
                      setOpen(true);
                    }}
                    renderExtraFooter={() => (
                      <div className={'typeBox'}>
                        <button onClick={handleConfirm}>확인</button>
                      </div>
                    )}
                    onCalendarChange={onCalendarChange}
                    suffixIcon={null}
                    allowClear={false}
                    panelRender={(panel) => (
                      // <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                      //   {panel}
                      // </div>
                      <div>{panel}</div>
                    )}
                    cellRender={(currentDate) => {
                      if (typeof currentDate == 'object') {
                        if (!dateStatus.rangeDate || dateStatus.rangeDate.length !== 2) return currentDate.date();
                        const [startDate, endDate] = tempRange;
                        const isStart = startDate?.isSame(currentDate, 'day');
                        const isEnd = endDate?.isSame(currentDate, 'day');
                        const isInRange = currentDate.isAfter(startDate, 'day') && currentDate.isBefore(endDate, 'day');

                        return (
                          <div
                            className={`ant-picker-cell-inner
                              ${isStart ? 'start-date' : ''}
                              ${isInRange ? 'in-range-date' : ''}
                              ${isEnd ? 'end-date' : ''}`}
                          >
                            <span>{currentDate.date()}</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className={`ant-picker-cell-inner`}>
                            <span>{currentDate}</span>
                          </div>
                        );
                      }
                    }}
                    // dateRender={(currentDate) => {
                    //   if (!dateStatus.rangeDate || dateStatus.rangeDate.length !== 2) return currentDate.date();
                    //   const [startDate, endDate] = tempRange;
                    //   const isStart = startDate?.isSame(currentDate, 'day');
                    //   const isEnd = endDate?.isSame(currentDate, 'day');
                    //   const isInRange = currentDate.isAfter(startDate, 'day') && currentDate.isBefore(endDate, 'day');
                    //
                    //   return (
                    //     <div
                    //       className={`ant-picker-cell-inner
                    //           ${isStart ? 'start-date' : ''}
                    //           ${isInRange ? 'in-range-date' : ''}
                    //           ${isEnd ? 'end-date' : ''}`}
                    //     >
                    //       <span>{currentDate.date()}</span>
                    //     </div>
                    //   );
                    // }}
                  />
                  <button
                    className={'left'}
                    onClick={() => {
                      handleClickPrevNext('type', 'prev');
                    }}
                  >
                    왼쪽
                  </button>
                  <button
                    className={'right'}
                    onClick={() => {
                      handleClickPrevNext('type', 'next');
                    }}
                  >
                    오른쪽
                  </button>
                </>
              ) : (
                // 직접입력(type) 이외
                <>
                  <DatePicker
                    value={dateStatus.selectedDate}
                    name={name}
                    onChange={(date) => handleRangeChange(date, dropDownValue)}
                    format={format}
                    picker={dropDownValue === 'week' ? 'week' : dropDownValue === 'month' ? 'month' : dropDownValue === 'year' ? 'year' : 'date'}
                    inputReadOnly
                    open={open}
                    onOpenChange={(isOpen) => {
                      if (onOpenChange) onOpenChange(isOpen);
                      setOpen(isOpen);
                    }}
                    onKeyDown={handleKeyDownToday}
                    needConfirm
                    suffixIcon={null}
                    allowClear={false}
                    onPanelChange={(date, mode) => {
                      setPanelMode(mode); // 현재 패널 모드를 업데이트
                    }}
                    cellRender={(currentValue) => {
                      const current = dayjs(currentValue);
                      const now = dayjs();

                      let isToday: boolean;
                      let displayText: string;

                      switch (panelMode) {
                        case 'decade': {
                          const startDecade = Math.floor(current.year() / 10) * 10;
                          const endDecade = startDecade + 9;
                          displayText = `${startDecade} - ${endDecade}`;
                          isToday = now.year() >= startDecade && now.year() <= endDecade;
                          break;
                        }
                        case 'year':
                          displayText = current.format('YYYY');
                          isToday = current.isSame(now, 'year');
                          break;
                        case 'month':
                          displayText = current.format('MMM');
                          isToday = current.isSame(now, 'month');
                          break;
                        case 'week':
                          displayText = current.format('D');
                          isToday = current.isSame(now, 'day');
                          break;
                        default:
                          displayText = current.format('D');
                          isToday = current.isSame(now, 'day');
                          break;
                      }

                      return (
                        <div className={`ant-picker-cell-inner ${isToday ? 'ant-picker-cell-today' : ''} ${panelMode === 'decade' ? 'decade' : ''}`}>
                          {displayText}
                        </div>
                      );
                    }}
                  />
                  {dateStatus.rangeDate[0] && dateStatus.rangeDate[1] ? (
                    <>
                      {panelMode === 'today' ? (
                        <span className={'resultDate'} onClick={handleResultClick}>
                          <span>{dateStatus.rangeDate[0].format(format)}</span>
                        </span>
                      ) : (
                        <span className={'resultDate'} onClick={handleResultClick}>
                          <span>{dateStatus.rangeDate[0].format(format)}</span> <em>~</em> <span>{dateStatus.rangeDate[1].format(format)}</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={'resultDate'} onClick={handleResultClick}>
                      <strong>날짜선택</strong>
                    </span>
                  )}
                  <button
                    className={'left'}
                    onClick={() => {
                      handleClickPrevNext(dropDownValue, 'prev');
                    }}
                  >
                    왼쪽
                  </button>
                  <button
                    className={'right'}
                    onClick={() => {
                      handleClickPrevNext(dropDownValue, 'next');
                    }}
                  >
                    오른쪽
                  </button>
                </>
              )}
            </div>
          </dd>
        </dl>
      )}
    </div>
  );
};
export default CustomNewDatePicker;
