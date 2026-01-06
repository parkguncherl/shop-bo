import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import React, { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  CellClickedEvent,
  CellKeyDownEvent,
  ColDef,
  Column,
  ColumnHeaderClickedEvent,
  ColumnMovedEvent,
  ColumnVisibleEvent,
  FullWidthCellKeyDownEvent,
  GetContextMenuItemsParams,
  type GridOptions,
  GridReadyEvent,
  IRowNode,
  MenuItemDef,
  RowSelectionOptions,
  SortChangedEvent,
} from 'ag-grid-community';
import { AG_GRID_LOCALE_KO, GridSetting, withCommonKeyboardSuppress } from '../../libs/ag-grid';
import { useCommonStore } from '../../stores';
import { GridResponse } from '../../generated';

export interface selectedRowCopiedEvent<P> {
  copiedRowNodes: IRowNode<P>[];
}

export interface copiedRowPastedEvent<P> {
  eventTriggeredRowIndex: number | null;
  pastedRowNodes: IRowNode<P>[];
}

export type clickSelectionConfig = {
  colField: string; // 적용 대상 컬럼
  withoutDeselection: boolean; // 타 행 선택해제 없이 선택될지 여부
  selectAllByHeaderClick?: boolean; // 헤더 클릭할 경우 전체선택할지 여부
};
export type extendedRowSelectionOptions<P> = RowSelectionOptions<P> & {
  // 기본 설정과 겹치는 영역이 존재할 시 이하 정의된 확장 설정이 우선
  clickSelectionConfigByPerCol?: clickSelectionConfig[]; // 유효한 값이 주어질 시 rowSelection 일부 속성 잠금, selection 동작은 api를 통해 명시적으로 통제함
};

export interface TunedGridApi<P> {
  onReachEachSide?: (event: 'T' | 'B') => void;
  onSelectedRowCopied?: (event: selectedRowCopiedEvent<P>) => void;
  onCopiedRowNodePasted?: (event: copiedRowPastedEvent<P>) => void;
  onWheel?: (event: any) => void;
  ref?: React.Ref<AgGridReact>;
}
//GridOptions<TData>.rowSelection
export interface TunedGridOptions<P> extends GridOptions<P> {
  columnDefs: ColDef<P>[]; // 컬럼 정의 제공을 의무화하는 차원에서 재정의
  colIndexForSuppressKeyEvent?: number; // 인자 제공할 경우 다중 선택 사용 시 해당 인덱스의 컬럼으로 포커싱 후 이후 동작을 진행함
  preventPersonalizedColumnSetting?: boolean; // 개인화된 컬럼 셋팅 비활성 여부, true 값을 명시적으로 제공해야만 비활성화
  gridId?: string;
  className?: string;
  rowData?: P[];
  gridOptions?: GridOptions<P>;
  savedPrevClickedNodeCnt?: number; // 이전에 클릭된 행(node)들 중 저장될 행의 개수(2 이상의 값을 할당하여야)
  enableBrowserTooltips?: boolean;
  rowSelection?: extendedRowSelectionOptions<P>;
}

type excludedTypes = 'columnDefs';
type TunedGridProps<P> = Omit<AgGridReactProps<P>, excludedTypes> & TunedGridOptions<P> & TunedGridApi<P>; // 추후 일부 api를 노출하지 않고자 할 때 Omit key에 해당 타입 지정

/**
 * keyForBeingPressed 인자로 들어온 키에 해당하는 키가 눌린 상태로 화살표 이동할 시 다중 행 선택이 이루어짐
 * ArrowDown, ArrowUp 키는 본 요소 내부에서 사용되므로 외부에서 이벤트 리스너를 던질 시 유의하여야 함
 * */
const TunedGrid = <P,>({ ref, ...props }: TunedGridProps<P>) => {
  const [selectGridColumnState, updateGridColumnState, initGridColumnState] = useCommonStore((s) => [
    s.selectGridColumnState,
    s.updateGridColumnState,
    s.initGridColumnState,
  ]);

  /** 최초에는 ref 훅을 할당받으나 forward 형식으로 주어진 ref 가 존재할 시 해당 ref 를 할당한다. */
  let innerRef = useRef<AgGridReact>(null);
  if (ref != null) {
    innerRef = ref as RefObject<AgGridReact>; // 외부에서 전달된 ref 를 사용하기 위해 타입 단언
  }
  /** 컬럼 정의는 상태로서 관리됨 */
  const [columnDefs, setColumnDefs] = useState<ColDef<P>[]>(props.columnDefs || []);

  /** 인자로 들어온 키 목록 중 그리드에서 눌려있는 키 목록을 상태로서 관리 */
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);

  const [firstRender, setFirstRender] = useState(true);
  const isLoadingRef = useRef(false);
  //const [prevClickedNodeList, setPrevClickedNodeList] = useState<IRowNode[]>([]);

  /** 본 페이지에서 사용되는 클립보드(복사 이후 사용하기 위해 임시 저장되는 값) 상태 관리 */
  const [copiedRowNode, setCopiedRowNode] = useState<IRowNode[]>([]);

  //props.rowSelection.clickSelectionConfigByPerCol
  /** cell click 이벤트를 외부 값과 동기화 */
  const onCellClicked = useCallback(
    (event: CellClickedEvent<P>) => {
      if (props.onCellClicked) {
        props.onCellClicked(event);
      }
      if (
        props.rowSelection?.mode == 'multiRow' && // 다중선택 옵션이 주어지지 않을 경우 이하 동작 미시행
        props.rowSelection?.clickSelectionConfigByPerCol &&
        props.rowSelection?.clickSelectionConfigByPerCol.length > 0
      ) {
        // clickSelectionConfigByPerCol 이 유효하게 주어진 경우 이하 동작 수행
        const clickSelectionConfigList = props.rowSelection?.clickSelectionConfigByPerCol as clickSelectionConfig[];
        if (
          clickSelectionConfigList.filter((value) => value.colField == event.column.getColDef().field).length > 0 &&
          clickSelectionConfigList.filter((value) => value.colField == event.column.getColDef().field)[0].withoutDeselection
        ) {
          // deselect 없이 단일 선택
          event.node.setSelected(!event.node.isSelected());
        } else {
          event.api.deselectAll();
          event.node.setSelected(!event.node.isSelected());
        }
      }
    },
    [props.onCellClicked, props.rowSelection],
  );

  const onColumnHeaderClicked = useCallback(
    (event: ColumnHeaderClickedEvent<P, any>) => {
      if (props.onColumnHeaderClicked) {
        props.onColumnHeaderClicked(event);
      }
      if (
        props.rowSelection?.mode == 'multiRow' && // 다중선택 옵션이 주어지지 않을 경우 이하 동작 미시행
        props.rowSelection?.clickSelectionConfigByPerCol &&
        props.rowSelection?.clickSelectionConfigByPerCol.length > 0
      ) {
        const clickSelectionConfigList = props.rowSelection?.clickSelectionConfigByPerCol as clickSelectionConfig[];
        if (
          clickSelectionConfigList.filter((value) => value.colField == (event.column as Column).getColDef().field).length > 0 &&
          clickSelectionConfigList.filter((value) => value.colField == (event.column as Column).getColDef().field)[0].withoutDeselection
        ) {
          if (event.api.getSelectedNodes().length > 0) {
            event.api.deselectAll();
          } else {
            event.api.selectAll();
          }
        }
        // for (let i = 0; i < clickSelectionConfigList.length; i++) {
        //   console.log((event.column as Column).getColDef().field);
        // }
      }
    },
    [props.onColumnHeaderClicked, props.rowSelection?.clickSelectionConfigByPerCol],
  );

  /** coldef 상태 동기화할 시 사용할 함수를 역시 외부 값과 동기화 */
  // const synchronizedColDef = useCallback<P>(
  //   (colDefs: ColDef<P>[]): ColDef<P>[] => {
  //     if (props.rowSelection?.clickSelectionConfigByPerCol && props.rowSelection?.clickSelectionConfigByPerCol.length > 0) {
  //       const clickSelectionConfigList = props.rowSelection?.clickSelectionConfigByPerCol as clickSelectionConfig[];
  //       for (let i = 0; i < clickSelectionConfigList.length; i++) {
  //         for (let j = 0; j < colDefs.length; j++) {
  //           if (clickSelectionConfigList[i].colField == colDefs[j].field) {
  //             colDefs[j] = { ...colDefs[j], sortable: !clickSelectionConfigList[i].selectAllByHeaderClick };
  //           }
  //         }
  //       }
  //     }
  //   },
  //   [props.rowSelection?.clickSelectionConfigByPerCol],
  // );

  useEffect(() => {
    if (props.columnDefs && !firstRender) {
      if (!props.preventPersonalizedColumnSetting && props.gridId) {
        selectGridColumnState(props.gridId).then((result) => {
          const { resultCode, body } = result.data;
          if (resultCode === 200 && body) {
            const GridResponse = body as GridResponse;
            if (GridResponse.columnState) {
              const savedColumns = JSON.parse(GridResponse.columnState) as ColDef<P>[];

              // 원본 컬럼(props.columnDefs)을 기준으로 저장된 설정을 병합
              const mergedColumns = props.columnDefs.map((origCol) => {
                const savedCol = savedColumns.find((sc) => sc.field === origCol.field);
                return savedCol
                  ? {
                      ...origCol, // 원본 컬럼 (cellRenderer 포함)
                      ...savedCol, // 저장된 설정 (width, order 등)
                      cellRenderer: origCol.cellRenderer, // cellRenderer는 원본 유지
                      cellStyle: origCol.cellStyle, // cellStyle도 원본 유지
                    }
                  : origCol;
              });
              setColumnDefs(mergedColumns);
            }
          }
        });
      } else {
        setColumnDefs(props.columnDefs);
      }
    }
  }, [props.columnDefs]);

  useEffect(() => {
    if (isLoadingRef.current) {
      isLoadingRef.current = !!props.loading;
    }
  }, [props.loading]);

  const onGridReady = (event: GridReadyEvent) => {
    setFirstRender(false);
    if (!props.preventPersonalizedColumnSetting && props.gridId) {
      selectGridColumnState(props.gridId).then((result) => {
        const { resultCode, body } = result.data;
        // console.log('result.data>>', result.data);
        if (resultCode === 200 && body) {
          const GridResponse = body as GridResponse;
          if (GridResponse.columnState) {
            const savedColumns = JSON.parse(GridResponse.columnState) as ColDef<P>[];
            const mergedColumns = props.columnDefs.map((origCol) => {
              const savedCol = savedColumns.find((sc) => sc.field === origCol.field);
              return savedCol ? { ...origCol, ...savedCol } : origCol;
            });
            setColumnDefs(mergedColumns);
            // console.log('머지', mergedColumns);
          }
        }
      });
    }
    /** 저장된 컬럼 정보 fetch 이후 콜백 호출 */
    if (props.onGridReady) {
      props.onGridReady(event);
    }
  };

  /** 컨텍스트 메뉴(팝업창) 관리 */
  // const getContextMenuItems = (params: GetContextMenuItemsParams) => {
  //   const customMenuItem: MenuItemDef[] = [
  //     {
  //       name: '그리드컬럼 설정 초기화',
  //       action: () => {
  //         initGridColumnState({
  //           uri: props.gridId,
  //           columnState: JSON.stringify(props.columnDefs),
  //         }).then((result) => {
  //           if (result.data.resultCode === 200) {
  //             innerRef.current?.api.resetColumnState();
  //           }
  //         });
  //       },
  //       cssClasses: ['blue', 'bold'],
  //       icon: '<span class="ag-icon ico_refresh"></span>',
  //     },
  //     {
  //       name: '엑셀다운로드',
  //       action: () => {
  //         innerRef.current?.api.exportDataAsExcel();
  //       },
  //       cssClasses: ['blue', 'bold'],
  //       icon: '<span class="ag-icon ico_refresh"></span>',
  //     },
  //   ];
  //
  //   // separator를 MenuItemDef로 정의 (타입 단언 사용)
  //   const separatorItem = {
  //     name: '',
  //     separator: true,
  //   } as MenuItemDef;
  //
  //   return [
  //     separatorItem,
  //     ...customMenuItem, // 전개연산자 사용하여 펼쳐줘야 함
  //   ];
  // };

  const defaultGridOption: GridOptions = {
    rowHeight: 28,
    //localeText: AG_CHARTS_LOCALE_KO_KR,
    //getContextMenuItems: getContextMenuItems,
  };

  /** 컨트롤 키 press 가 발생할 시 일부 설정을 고정하여 연관 동작의 원할한 실행을 가능토록 하는 상수 */
  const rowSelectionOptionInCtrlInterrupt: RowSelectionOptions<P, any, any> = {
    mode: 'multiRow',
    checkboxes: false, // 기본적으로 체크박스 비활성화
    headerCheckbox: false, // 헤더 체크박스 안 보이게
    enableClickSelection: true,
    enableSelectionWithoutKeys: true,
  };

  // 기존 키에 관한 정보 저장(여기서는 arrowDown, arrowUp)
  const prevEventKey = useRef<string | undefined>(undefined);

  const onKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    /** 눌린 키 목록 최신화(목록에서 제거) */
    setPressedKeys((keyList) => {
      if (event.key == 'Shift') {
        /** 인자의 첫번째 키에서 손을 뗀 경우 */
        prevEventKey.current = undefined;
        setColumnDefs((prevColumnDefs) => {
          for (let i = 0; i < prevColumnDefs.length; i++) {
            prevColumnDefs[i].suppressKeyboardEvent = () => {
              // 키보드 기본 동작 억제 설정 초기화
              return false;
            };
          }
          return [...prevColumnDefs];
        });
      }

      return keyList.filter((key) => key != event.key); // 키 목록에서 해당 키 제거;
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    /** 눌린 키 목록 최신화(목록에 추가) */
    setPressedKeys((keyList) => {
      if (!keyList.includes(event.key)) {
        keyList.push(event.key); // 기존 키 목록에 해당 키가 포함되지 않은 경우에만 pressedKeys 상태에 해당 키가 추가된다.

        if (event.key == 'Shift') {
          setColumnDefs((prevColumnDefs) => {
            for (let i = 0; i < prevColumnDefs.length; i++) {
              prevColumnDefs[i].suppressKeyboardEvent = (params) => {
                const key = params.event.key;
                // key 클릭 상태에서만 화살표 키 기본 동작을 억제함으로서 본 컬럼에서 화살표 키를 사용해 다음 행으로 이동이 가능하도록 함
                return key === 'ArrowDown' || key === 'ArrowUp';
              };
            }
            return [...prevColumnDefs];
          });
        }
      }
      return [...keyList];
    });
  };

  const onSortChanged = (event: SortChangedEvent<P, any>) => {
    // 정렬 발생할 시 prevClickedNodeList 초기화

    if (props.onSortChanged) {
      props.onSortChanged(event);
    }
  };

  const onColumnMoved = (event: ColumnMovedEvent) => {
    if (event.finished && !props.preventPersonalizedColumnSetting && props.gridId) {
      const currentColumns = event.api.getColumnDefs();
      if (currentColumns) {
        // undefined 체크 추가
        const serializableColumns = JSON.stringify(event.api.getColumnDefs());
        updateGridColumnState({
          uri: props.gridId,
          columnState: serializableColumns,
        });
      }
    }
  };

  const onColumnVisible = (event: ColumnVisibleEvent) => {
    if (!props.preventPersonalizedColumnSetting && props.gridId) {
      const currentColumns = event.api.getColumnDefs();
      if (currentColumns) {
        // undefined 체크 추가
        const serializableColumns = JSON.stringify(event.api.getColumnDefs());
        updateGridColumnState({
          uri: props.gridId,
          columnState: serializableColumns,
        });
      }
    }
  };

  const MultiChoiceFn = (
    keyDownEvent: CellKeyDownEvent | FullWidthCellKeyDownEvent,
    prevEventKey: React.MutableRefObject<string | undefined>,
    targetColId?: string,
  ) => {
    const clickedRowIndex = keyDownEvent.rowIndex || 0;
    const gridDataLength = keyDownEvent.api.getDisplayedRowCount() || 0;

    /** 키보드 이벤트 및 하위 요소들 */
    const keyBoardEvent = keyDownEvent.event as KeyboardEvent;
    const key = keyBoardEvent.key;
    const rowNode = keyDownEvent.node;

    const focusedCell = keyDownEvent.api.getFocusedCell();
    if ((key == 'ArrowDown' || key == 'ArrowUp') && keyBoardEvent.shiftKey) {
      if (targetColId && keyDownEvent.api.getFocusedCell()?.column.getColId() != targetColId) {
        /** targetColId 가 인자로 존재할 시 해당 colId 에 해당하는 영역으로 포커싱, 이 동작 직후 다중 선택 가능 */
        keyDownEvent?.api.setFocusedCell(keyDownEvent.rowIndex as number, targetColId);
      } else {
        /** 여기서부터 본 다중선택 영역 */
        if (prevEventKey.current == key && focusedCell) {
          /** 기존 키와 동일한 키가 사용됨(방향 동일), 최초 선택이 아닌 경우이므로 focusedCell 값 존재 */
          const conditionForArrowDown = clickedRowIndex + 1 < gridDataLength; // 클릭된 행의 인덱스 + 1(다음 행으로 이동하므로 1을 추가하여 보정) 이 데이터 배열의 길이보다 작아야 한다(초과 시 그리드 영역을 벗어남)
          const conditionForArrowUp = clickedRowIndex != 0; // 클릭된 행의 인덱스가 0이면 안 된다(작을 경우 역시 그리드 영역을 벗어나므로)
          if (key == 'ArrowDown' ? conditionForArrowDown : conditionForArrowUp) {
            keyDownEvent.api.setFocusedCell(key == 'ArrowDown' ? clickedRowIndex + 1 : clickedRowIndex - 1, targetColId || focusedCell.column.getColId()); // 각각 화살표 키 방향에 해당하는 쪽으로 포커싱 이동
            keyDownEvent.api.forEachNodeAfterFilterAndSort((rowNodeInFor, indexInFor) => {
              if (indexInFor == (key == 'ArrowDown' ? clickedRowIndex + 1 : clickedRowIndex - 1)) {
                rowNodeInFor.setSelected(!rowNodeInFor.isSelected());
              }
            });
          }
        } else {
          /** 기존 키와 다른 키가 사용됨(방향이 변경되었거나 최초 선택) */
          rowNode.setSelected(!rowNode.isSelected());
          if (focusedCell) {
            keyDownEvent.api.setFocusedCell(clickedRowIndex, targetColId || focusedCell.column.getColId()); // 해당 행 포커싱(동작 일관성 유지)
          }
        }
        prevEventKey.current = key; // 동기화
      }
    }
  };

  const onCellKeyDown = useCallback(
    (
      event: CellKeyDownEvent<P, any> | FullWidthCellKeyDownEvent<P, any>,
      columnDefs: ColDef<P, any>[],
      colIndexForSuppressKeyEvent: number | undefined,
      rowData: P[] | undefined,
    ) => {
      // 기존 innerRef.current 사용 영역들은 전달된 keydownEvent 값으로 대체됨
      const keyBoardEvent = event.event as KeyboardEvent;
      const targetColId = colIndexForSuppressKeyEvent
        ? columnDefs[colIndexForSuppressKeyEvent].colId || columnDefs[colIndexForSuppressKeyEvent].field
        : undefined;
      if (keyBoardEvent.key == 'ArrowDown' || keyBoardEvent.key == 'ArrowUp') {
        /** 복수의 행 선택을 처리하는 함수 */
        MultiChoiceFn(event, prevEventKey, targetColId);
        if (pressedKeys.find((key) => key == 'Shift') != undefined && pressedKeys.find((key) => key == 'Control') != undefined) {
          /** Shift, Control 키가 모두 눌린 상태에서 화살표 키를 사용한 경우 */
          if (event.rowIndex) {
            const rowIndex = event.rowIndex;
            /** 필터링과 정렬(소팅)이 이루어진 노드를 순환 */
            event.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
              if (keyBoardEvent.key == 'ArrowDown' ? index >= rowIndex : index <= rowIndex) {
                rowNode.setSelected(true);
              }
            });
          }
        }
      } else {
        if (keyBoardEvent.code == 'KeyA' && pressedKeys.find((key) => key == 'Control') != undefined) {
          // ctrl + 'A'
          if (rowData != undefined) {
            // client 영역에서 전체 로드되지 않는 경우(예: dataSource 사용) 전체선택 비활성화
            //innerRef.current?.api.selectAllFiltered(); // ctrl + a(A) => 전체선택
            // 1. rowNode들을 가져와서 필터링된 노드만 선택
            event.api.forEachNodeAfterFilter((node) => {
              node.setSelected(true);
            });
          }
        } else if (keyBoardEvent.code == 'KeyD' && pressedKeys.find((key) => key == 'Control') != undefined) {
          // ctrl + 'D'
          if (rowData != undefined) {
            // client 영역에서 전체 로드되지 않는 경우(예: dataSource 사용) 전체선택해제 비활성화
            event.api.deselectAll(); // ctrl + d(D) => 전체선택해제
          }
        } else if (keyBoardEvent.code == 'KeyC' && pressedKeys.find((key) => key == 'Control') != undefined) {
          // ctrl + c
          if (event.api.getSelectedNodes().length != 0) {
            // 본 영역은 그리드 api 와 별도로 동작한다(기존 그리드의 동작을 억제하지 않는 방식), 하나 이상의 행 선택
            // 셀 선택은 그리드 api 를 통하여 처리
            if (props.onSelectedRowCopied) {
              props.onSelectedRowCopied({ copiedRowNodes: event.api.getSelectedNodes() });
            }
            setCopiedRowNode(event.api.getSelectedNodes());
          }
        } else if (keyBoardEvent.code == 'KeyV' && pressedKeys.find((key) => key == 'Control') != undefined) {
          if (copiedRowNode.length != 0) {
            if (props.onCopiedRowNodePasted) {
              props.onCopiedRowNodePasted({ pastedRowNodes: copiedRowNode, eventTriggeredRowIndex: event.rowIndex });
            }
            setCopiedRowNode([]);
          }
        }
      }
      if (props.onCellKeyDown) {
        /** 외부에서 할당한 리스너 */
        props.onCellKeyDown(event);
      }
    },
    [pressedKeys, props.onCellKeyDown, props.onSelectedRowCopied, props.onCopiedRowNodePasted],
  );

  const gridComponents = {
    ...props.components,
    NUMBER_COMMA: GridSetting.CellRenderer.NUMBER_COMMA,
    PERCENTAGE: GridSetting.CellRenderer.PERCENTAGE,
  };

  return (
    <div className={`ag-theme-alpine ${props.className}`} onWheel={props.onWheel} onKeyDown={onKeyDown} onKeyUp={onKeyUp} tabIndex={-1}>
      <AgGridReact<P>
        {...props}
        columnDefs={columnDefs.map(withCommonKeyboardSuppress)} // React 상태컬럼 방향키로 헤더까지 안올라가게 수정 2025-08-27
        headerHeight={props.headerHeight ? props.headerHeight : 35}
        onGridReady={onGridReady}
        rowData={props.rowData}
        gridOptions={{
          ...defaultGridOption,
          ...props.gridOptions,
        }}
        onColumnHeaderClicked={onColumnHeaderClicked}
        components={gridComponents}
        onCellKeyDown={(event) => {
          onCellKeyDown(event, props.columnDefs, props.colIndexForSuppressKeyEvent, props.rowData);
        }}
        loading={isLoadingRef.current}
        ref={ref}
        onCellClicked={onCellClicked}
        onSortChanged={onSortChanged}
        rowSelection={
          pressedKeys.includes('Control') // Control(컨트롤(ctrl)) 키 누른 경우 별도로 지정한 옵션값으로 변경함
            ? rowSelectionOptionInCtrlInterrupt
            : (typeof props.rowSelection == 'object' // RowSelectionOptions 타입의 인자가 전달된 경우
                ? props.rowSelection.mode == 'multiRow' // 다중 선택인 경우와 단일 선택인 경우 사용 가능한 옵션이 다른 관계로 분기
                  ? {
                      // 다중선택 case
                      ...props.rowSelection,
                      checkboxes: false, // 기본적으로 체크박스 비활성화
                      headerCheckbox: false, // 다중 선택인 경우는 헤더 체크박스도 비활성화
                      enableClickSelection:
                        props.rowSelection.clickSelectionConfigByPerCol && props.rowSelection.clickSelectionConfigByPerCol.length > 0
                          ? false // clickSelectionConfigByPerCol 이 유효하게 주어진 경우 설정을 '잠금'
                          : props.rowSelection.enableClickSelection,
                    }
                  : {
                      // 단일선택 case
                      ...props.rowSelection,
                      checkboxes: false, // 기본적으로 체크박스 비활성화
                      enableClickSelection:
                        props.rowSelection.clickSelectionConfigByPerCol && props.rowSelection.clickSelectionConfigByPerCol.length > 0
                          ? false // clickSelectionConfigByPerCol 이 유효하게 주어진 경우 설정을 '잠금'
                          : props.rowSelection.enableClickSelection,
                    }
                : props.rowSelection) || 'multiple' // 그 외에는 인자로 받은 값 사용 혹은 기본값 사용
        } // Ctrl 키를 누른 상태에서 요구되는 별도 동작에 대처하고자 다음과 같이 처리함
        onColumnMoved={onColumnMoved}
        onColumnVisible={onColumnVisible}
        onBodyScroll={(e) => {
          if (props.rowData && props.rowData.length > 0 && e.api.getVerticalPixelRange().bottom == (defaultGridOption.rowHeight || 24) * props.rowData.length) {
            /** rowData 가 주어진 경우 */
            if (props.onReachEachSide) {
              props.onReachEachSide('B');
            }
          }
          if (props.onBodyScroll) {
            /** 최상단 도달 시의 이벤트는 현재 미지원 */
            props.onBodyScroll(e);
          }
        }}
        localeText={AG_GRID_LOCALE_KO}
        autoSizeStrategy={{
          type: 'fitCellContents',
        }}
        //enableBrowserTooltips={props.enableBrowserTooltips === undefined ? true : props.enableBrowserTooltips} // todo 커스텀 툴팁을 써야 하는경우
        // tooltipShowDelay={100}
        // tooltipHideDelay={50000}
        stopEditingWhenCellsLoseFocus={true}
      />
    </div>
  );
};

export default TunedGrid;
