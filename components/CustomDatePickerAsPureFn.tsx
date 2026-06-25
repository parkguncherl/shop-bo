import React, { useEffect, useRef, useState, useImperativeHandle, useMemo } from 'react';
import { DatePicker, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ko'; // 한국어 로케일 추가
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toastError } from './ToastMessage';
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
  value: string | [string | null, string | null] | null;
  disable?: boolean;
  onChange: (name: string | undefined, value: string | undefined) => void;
  onEnter?: () => void;
  placeholder?: string;
  required?: boolean;
  format?: string;
  className?: string;
  selectType?: DatePickerSelectType;
  maxDays?: number;
  defaultType?: DatePickerSelectType;
  disabled?: boolean; // 디스에이블 여부 date타입만 적용 20250326
  ref?: React.Ref<CustomNewDatePickerRefInterface>;

  onOpenChange?: ((open: boolean) => void) | undefined;
}

// 이하 해당 영역에서 사용할 상수
const BASE_OPTIONS: { value: DatePickerSelectType; label: string }[] = [
  { value: 'type', label: '입력' },
  { value: 'today', label: '일자' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
  { value: 'year', label: '1년' },
];

const CustomDatePickerAsPureFn = ({
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
  maxDays,
  selectType,
  className,
  defaultType,
  disabled,
  ref,
  onOpenChange,
}: Props) => {
  const today = dayjs(new Date());

  /** 참조 */
  const datePickerRef = useRef<React.ComponentRef<typeof DatePicker>>(null);
  const isKeyboardTriggered = useRef(false); // 참인 경우 키보드로 인한 동기화 동작이 발생한 직후

  const [open, setOpen] = useState(false);
  const [dropDownValue, setDropDownValue] = useState<DatePickerSelectType>(defaultType || 'type');
  const [panelMode, setPanelMode] = useState(dropDownValue);

  const selectedDate = (value: null | string | [string | null, string | null]): Dayjs | null => {
    if (type === 'date') {
      // value가 유효한 날짜 형식인지 체크하고 dayjs로 변환
      if (!Array.isArray(value)) {
        const parsedDate = dayjs(value);
        if (parsedDate.isValid()) {
          return parsedDate;
        } else {
          return null; // 유효하지 않으면 null
        }
      }
    }
    return null;
  };
  const rangeDate = (value: null | string | [string | null, string | null]): [Dayjs | null, Dayjs | null] => {
    if (type === 'range') {
      // 'range' 타입일 때는 value가 배열 형태인지 확인
      if (Array.isArray(value)) {
        const startDate = dayjs(value[0]);
        const endDate = dayjs(value[1]);
        if (startDate.isValid() && endDate.isValid()) {
          return [startDate, endDate];
        } else {
          return [null, null]; // 유효하지 않으면 [null, null]
        }
      }
    }
    return [null, null];
  };

  const handleInitDatePicker = (type: DatePickerSelectType, startDate: Dayjs, endDate: Dayjs) => {
    setOpen(false);
    setDropDownValue(type);

    onChange(startName, undefined);
    onChange(endName, undefined);
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

  /** selectType 인자가 주어진 경우 options 는 단일하게 고정됨 */
  const options = useMemo(
    () => BASE_OPTIONS.filter((option) => (selectType != undefined ? selectType == option.value : true)), // 한가지만 선택해야 되는경우
    [selectType],
  );

  /**
   * 변경하고자 하는 날짜를 인자로서 전달하는 경우 이후 동작, 분기 관할
   * range 타입의 경우 요청 시점에 배열을 전부 채우지 아니하는 경우 콜백이 호출되지 않음(비록 start, end 중 하나만 동기화하길 희망할지라도 나머지 영역을 기존 value로 채움으로서 길이 2인 배열로 구성하여야)
   * */
  const onChangeCommonHandler = ({ date }: { date: Dayjs | [Dayjs | null, Dayjs | null] | null }) => {
    if (type === 'range') {
      if (Array.isArray(date) && date.length === 2) {
        onChange(startName, date[0]?.format('YYYY-MM-DD'));
        onChange(endName, date[1]?.format('YYYY-MM-DD'));
      } else {
        console.error('range 유형 하에서 올바른 값이 전달되지 않음');
      }
    } else if (type === 'date') {
      // value가 유효한 날짜 형식인지 체크하고 dayjs로 변환
      if (!Array.isArray(date)) {
        onChange(name, date?.format('YYYY-MM-DD'));
      } else {
        onChange(name, undefined); // 유효하지 않으면 undefined 으로 설정
      }
    }
  };

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
    setPanelMode(dropDownValue); // 초기 dropDownValue를 panelMode에 반영
  }, [dropDownValue]);

  // 날짜 변경 핸들러
  const handleOnDateChange = (date: Dayjs | null, _: string | null) => {
    if (!isKeyboardTriggered.current) {
      // 키보드로 인한 동기화로 인한 호출이 아닌 경우 한정으로 호출됨을 보장
      onChangeCommonHandler({ date: date });
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

  /** 날짜 범위 계산 (주, 월, 연) */
  const handleOnRangeChange = (date: Dayjs | null, rangeType: DatePickerSelectType) => {
    if (!date) {
      onChangeCommonHandler({ date: [null, null] });
      return;
    }

    const datesAsDefValues = settingDefaultValue(rangeType, date);
    const startDate = datesAsDefValues[0];
    const endDate = datesAsDefValues[1];

    // maxDays 제한 체크
    if (maxDays && endDate.diff(startDate, 'day') + 1 > maxDays) {
      toastError(`최대 ${maxDays}일까지만 선택할 수 있어요`);
      return;
    }

    onChangeCommonHandler({ date: [startDate, endDate] });

    if (onChange) {
      if (type === 'date') {
        onChange(name, startDate.format('YYYY-MM-DD'));
      }
    }
  };

  const handleOnUnboundedRangeChange = (dates: [Dayjs | null, Dayjs | null] | null, _: [string, string]) => {
    onChangeCommonHandler({ date: dates });
  };

  // todo tempRange 와 함께 컨펌 동작은 제거하는 걸 고려하기
  // const handleConfirm = () => {
  //   onChangeCommonHandler(tempRange); // tempRange 값으로 dispatch
  //
  //   setOpen(false);
  // };

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
      onChangeCommonHandler({ date: null });
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
        onChangeCommonHandler({ date: dayjs(firstInput).add(addAndMinus, type) });
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
      onChangeCommonHandler({ date: dayjs(firstInput) });
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

    const rangeDates = rangeDate(value);

    const fromDateValue = rangeDates[0];
    const toDateValue = rangeDates[1];

    if (e.key == 'Delete') {
      e.preventDefault();
      if (target === inputs[0]) {
        onChangeCommonHandler({ date: [null, toDateValue] });
      } else if (target === inputs[1]) {
        onChangeCommonHandler({ date: [fromDateValue, null] });
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
        onChangeCommonHandler({ date: [dayjs(firstInput).add(addAndMinus, type), dayjs(secondInput)] });
      } else if (target === inputs[1]) {
        onChangeCommonHandler({ date: [dayjs(firstInput), dayjs(secondInput).add(addAndMinus, type)] });
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
        onChangeCommonHandler({ date: [dayjs(firstInput), dayjs(secondInput)] });
      } else if (target === inputs[0] && firstInput.length === 8) {
        const firstDay = firstInput.substring(0, 8);
        if (Utils.isValidDate(firstDay)) {
          onChangeCommonHandler({ date: [dayjs(firstDay), toDateValue] });

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
          onChangeCommonHandler({ date: [fromDateValue, dayjs(secondDay)] });
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

    const dateStatus = selectedDate(value);
    const rangeDateStatus = rangeDate(value);

    switch (types) {
      case 'date': {
        if (dateStatus == null) return;
        // 하루 이동
        newDate = direction === 'prev' ? dateStatus.subtract(1, 'day') : dateStatus.add(1, 'day');

        onChangeCommonHandler({ date: newDate });
        return;
      }

      case 'today': {
        if (!rangeDateStatus[0] || !rangeDateStatus[1]) return;
        // 일자
        startDate = direction === 'prev' ? rangeDateStatus[0].subtract(1, 'day') : rangeDateStatus[0].add(1, 'day');
        endDate = direction === 'prev' ? rangeDateStatus[1].subtract(1, 'day') : rangeDateStatus[1].add(1, 'day');
        break;
      }

      case 'week': {
        if (!rangeDateStatus[0] || !rangeDateStatus[1]) return;
        // 주간 이동
        startDate =
          direction === 'prev'
            ? rangeDateStatus[0].subtract(1, 'week').startOf('week').add(1, 'day')
            : rangeDateStatus[0].add(1, 'week').startOf('week').add(1, 'day');
        endDate = startDate.endOf('week').add(1, 'day');
        break;
      }

      case 'month': {
        if (!rangeDateStatus[0] || !rangeDateStatus[1]) return;
        // 월간 이동
        startDate = direction === 'prev' ? rangeDateStatus[0].subtract(1, 'month').startOf('month') : rangeDateStatus[0].add(1, 'month').startOf('month');
        endDate = startDate.endOf('month');
        break;
      }

      case 'year': {
        if (!rangeDateStatus[0] || !rangeDateStatus[1]) return;
        // 연간 이동
        startDate = direction === 'prev' ? rangeDateStatus[0].subtract(1, 'year').startOf('year') : rangeDateStatus[0].add(1, 'year').startOf('year');
        endDate = startDate.endOf('year');
        break;
      }

      case 'type': {
        if (!rangeDateStatus[0] || !rangeDateStatus[1]) return;
        // 사용자가 선택한 기간만큼 이동
        const rangeDiff = rangeDateStatus[1].diff(rangeDateStatus[0], 'day'); // 기간 차이 계산
        startDate =
          direction === 'prev'
            ? rangeDateStatus[0].subtract(rangeDiff + 1, 'day') // 기존 기간만큼 이동
            : rangeDateStatus[0].add(rangeDiff + 1, 'day');
        endDate = startDate.add(rangeDiff, 'day');
        break;
      }

      default:
        return;
    }

    // 주/월/년 이동 시 범위 상태 업데이트
    onChangeCommonHandler({ date: [startDate, endDate] });
  };

  // 결과날짜 클릭시 달력띄우기
  const handleResultClick = () => {
    const rangeDateStatus = rangeDate(value);

    if (dropDownValue === 'type' && rangeDateStatus[0] && rangeDateStatus[1]) {
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
    if (startDate && endDate) {
      onChangeCommonHandler({ date: [dayjs(startDate), dayjs(endDate)] });
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
                    value={!Array.isArray(value) ? dayjs(value) : undefined}
                    name={name}
                    onChange={handleOnDateChange}
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
                value={selectedDate(value)}
                name={name}
                onChange={handleOnDateChange}
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
                    value={rangeDate(value)} // [startDate, endDate] 배열로 전달
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
                      setOpen(isOpen);
                    }}
                    onChange={handleOnUnboundedRangeChange}
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
                        if (!Array.isArray(value) || value.length !== 2) return currentDate.date();
                        const [startDate, endDate] = rangeDate(value);
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
                    value={selectedDate(value)}
                    name={name}
                    onChange={(date) => handleOnRangeChange(date, dropDownValue)}
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
                  {rangeDate(value)[0] && rangeDate(value)[1] ? (
                    <>
                      {panelMode === 'today' ? (
                        <span className={'resultDate'} onClick={handleResultClick}>
                          <span>{(rangeDate(value) as [Dayjs, Dayjs])[0].format(format)}</span>
                        </span>
                      ) : (
                        <span className={'resultDate'} onClick={handleResultClick}>
                          <span>{(rangeDate(value) as [Dayjs, Dayjs])[0].format(format)}</span> <em>~</em>{' '}
                          <span>{(rangeDate(value) as [Dayjs, Dayjs])[1].format(format)}</span>
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
export default CustomDatePickerAsPureFn;
