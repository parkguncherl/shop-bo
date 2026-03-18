import React, { useEffect, useRef, useState } from 'react';
import { PopupContent } from '../PopupContent';
import { PopupFooter } from '../PopupFooter';
import { PopupLayout } from '../PopupLayout';
import { Search } from '../../content';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { formatDateWithDay, GridSetting } from '../../../libs/ag-grid';
import { ColDef, GridApi } from 'ag-grid-community';
import { PartnerCodeResponseLowerSelect } from '../../../generated';
import { ConfirmModal } from '../../ConfirmModal';
import useFilters from '../../../hooks/useFilters';
import TunedGrid, { TunedGridRef } from '../../grid/TunedGrid';
import { usePausedEventQueue } from '../../../customFn/pausedEventsQueue';
import {usePartnerCodeStore} from "../../../stores/usePartnerCodeStore";
import {useSession} from "next-auth/react";

interface Props {
  partnerCodeUpper: string;
  activated: boolean;
  title: string;
  codeName: string;
  onCloseRequestEmerged: () => void;
}

// todo 현재 조건부 랜더링 대신 open close 동작에 전적으로 의지하도록 변경됨, 이로 인한 부조화 발생할 시 useEffect 적절히 활용하여 대처
export const PartnerCodePop = ({ partnerCodeUpper, activated, title, codeName, onCloseRequestEmerged }: Props) => {
  const session = useSession();
  const [gridRowData, setGridRowData] = useState<PartnerCodeResponseLowerSelect[] | undefined>();
  const gridRef = useRef<TunedGridRef<PartnerCodeResponseLowerSelect>>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmModal2, setConfirmModal2] = useState(false);
  const queryClient = useQueryClient();
  const { selectLowerPartnerCodeByCodeUpper, savePartnerCode, deletePartnerCode } = usePartnerCodeStore();
  const { runWhenReady, setReady } = usePausedEventQueue();
  const [filters, onChangeFilters] = useFilters({
    searchKeyword: '',
  });

  /** 하위코드 목록 조회 */
  const {
    data: rowData,
    isSuccess: isPartnerCodeSuccess,
    refetch: partnerCodesRefetch,
  } = useQuery({
    queryKey: ['/partnerCode/lowerCodeList/', partnerCodeUpper],
    queryFn: () => selectLowerPartnerCodeByCodeUpper(partnerCodeUpper, filters.searchKeyword),
    enabled: true,
  });

  useEffect(() => {
    if (isPartnerCodeSuccess) {
      const { resultCode, body, resultMessage } = rowData.data;
      if (resultCode == 200) {
        setGridRowData(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isPartnerCodeSuccess, rowData]);

  /** 코드 수정 **/
  const { mutate: savePartnerCodeMutate } = useMutation(savePartnerCode, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({
            queryKey: ['/partnerCode/lowerCodeList/'],
          });
          await partnerCodesRefetch();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 코드 수정 */
  const { mutate: deletePartnerCodeMutate } = useMutation(deletePartnerCode, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await partnerCodesRefetch();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const [columnDefs] = useState<ColDef<PartnerCodeResponseLowerSelect>[]>([
    {
      headerName: 'No',
      field: 'no',
      sortable: true,
      width: 60,
      editable: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: codeName,
      field: 'codeNm',
      sortable: true,
      width: 100,
      editable: true,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: '등록자',
      field: 'updNm',
      sortable: true,
      width: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: '등록일자',
      field: 'updTm',
      sortable: true,
      width: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: formatDateWithDay,
    },
  ]);

  /** 저장 이벤트 */
  const onSaveClick = async () => {
    const gridApi = gridRef.current?.api;
    if (gridApi) {
      gridApi.stopEditing(false);
      const selectedRows = gridApi.getSelectedRows();
      console.log('selectedRows ==>', selectedRows);
      if (selectedRows.length > 0) {
        savePartnerCodeMutate({
          createType: 'NO_CODECD_AUTO_INCREMENT',
          partnerCodeLowerSelectList: selectedRows,
        });
      } else {
        toastError('선택된 행이 없습니다.');
      }
    }
  };

  /** 추가 이벤트 */
  const addRowPartnerCode = async () => {
    const newData: PartnerCodeResponseLowerSelect = {
      codeUpper: partnerCodeUpper,
      codeCd: '',
      codeNm: '',
    };
    if (gridRowData) {
      if (gridRowData.filter((rowData) => rowData.id == undefined).length == 0) {
        setGridRowData([...gridRowData, newData]);

        runWhenReady<GridApi, void>({
          id: 'gotoBottom',
          fn: (gridRefsApi) => {
            // 추가된 최하단 행으로 자동 포커싱
            gridRefsApi.ensureIndexVisible(gridRowData.length);
            gridRefsApi.setFocusedCell(gridRowData.length, 'codeNm');
          },
          delayed: true, // 기존 참조를 사용하지 않음
        });
      } else {
        toastError('한번에 하나의 행만 추가 가능합니다.');
      }
      // setTimeout(() => {
      //   const api = gridRef.current?.api;
      //   if (api) {
      //     const lastRowIndex = gridRowData.length - 1;
      //     api.ensureIndexVisible(lastRowIndex); // 스크롤 이동
      //     api.setFocusedCell(lastRowIndex, 'codeCd'); // 포커스 셀 지정(필드명은 필요에 맞게)
      //   }
      // }, 0);
    } else {
      setGridRowData([newData]);
    }
  };

  /** 삭제 이벤트 */
  const deleteRowPartnerCode = async () => {
    const gridApi = gridRef.current?.api;
    const focusedCell = gridApi?.getFocusedCell();
    if (focusedCell && focusedCell.rowIndex && gridRowData) {
      if (gridRowData[focusedCell.rowIndex] && gridRowData[focusedCell.rowIndex].id) {
        // db 에 저장된값 삭제
        deletePartnerCodeMutate({
          id: gridRowData[focusedCell.rowIndex].id as number,
        });
      } else {
        // 그냥 추가된값 삭제
        setGridRowData(() => gridRowData.filter((row, index) => index !== focusedCell.rowIndex));
      }
    }
  };

  return (
    <PopupLayout
      width={800}
      isEscClose={true}
      open={activated}
      title={title}
      onClose={() => {
        onCloseRequestEmerged();
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div>
              {/*
              <button className="btn add" title="등록">
                등록
              </button>
*/}
              <div className="btnArea right" style={{ marginBottom: '3px' }}>
                <button className="btn btnWhite" title="추가하기" data-tooltip-id="my-tooltip" onClick={addRowPartnerCode}>
                  추가하기
                </button>
                <button className="btn btnWhite" title="삭제하기" data-tooltip-id="my-tooltip" onClick={() => setConfirmModal(true)}>
                  삭제하기
                </button>
              </div>
              <button className="btn edit" title="저장하기" onClick={onSaveClick}>
                저장하기
              </button>
            </div>
            <div>
              <button className="btn" title="닫기" onClick={onCloseRequestEmerged}>
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <Search className="type_1">
          <Search.Input
            title={title + ' 검색'}
            name={'searchKeyword'}
            placeholder={title + ' 입력'}
            value={filters.searchKeyword}
            onChange={onChangeFilters}
            onEnter={() => {
              partnerCodesRefetch();
            }}
          />
        </Search>
        <TunedGrid<PartnerCodeResponseLowerSelect>
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={gridRowData}
          rowSelection={{
            mode: 'singleRow',
            enableClickSelection: true,
          }}
          className={'scmLowerBottom check'}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          singleClickEdit={true}
          onRowDataUpdated={(event) => {
            setReady({
              id: 'gotoBottom',
              obj: event.api,
            });
          }}
        />
      </PopupContent>
      <ConfirmModal title={'선택된 행을 삭제하시겠습니까?'} open={confirmModal} onConfirm={deleteRowPartnerCode} onClose={() => setConfirmModal(false)} />
      <ConfirmModal title={'선택된 행을 삭제하시겠습니까?'} open={confirmModal2} onConfirm={deleteRowPartnerCode} onClose={() => setConfirmModal2(false)} />
    </PopupLayout>
  );
};
