import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, CommonRequestFileRearrangementRequest, FileDet } from '@/generated';
import { AxiosPromise } from 'axios';
import { authApi, authDownApi } from '@/libs';

type ModalType = 'UPLOAD' | 'UPLOADS' | 'IMAGES' | 'PRIVACY' | 'FILES';

export interface HistoryType {
  histMenuNm: string;
  histMenuUri: string;
}

// export interface FilterData {
//   uri: string;
//   filterData: any;
// }
//
// export interface PartnerOption {
//   value: number;
//   label: string;
// }
interface CommonState {
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType, index?: number) => void;
  closeModal: (type: ModalType) => void;
  upMenuNm: string | undefined;
  setUpMenuNm: (upMenuNm: string) => void;
  menuNm: string | undefined;
  setMenuNm: (menuNm: string) => void;
  menuUpdYn: boolean;
  setMenuUpdYn: (menuUpdYn: boolean) => void;
  menuExcelYn: boolean;
  setMenuExcelYn: (menuExcelYn: boolean) => void;
  historyList: HistoryType[];
  setHistoryList: (historyList: HistoryType[]) => void;
}

interface CommonApiState {
  selectFileList: (fileId: number) => Promise<FileDet[]>;
  deleteFile: (commonRequest: any) => AxiosPromise<ApiResponse>;
  getFileUrl: (fileKey: string) => Promise<string>;
  getFileList: (fileId: number) => AxiosPromise<ApiResponse>;
  selectGridColumnState: (uri: string) => AxiosPromise<ApiResponse>;
  rearrangeFilesByStepsToMove: (commonRequestFileRearrangementRequest: CommonRequestFileRearrangementRequest) => AxiosPromise<ApiResponse>;
  uploadImageFiles: (commonRequestFileUploads: { fileId: number; uploadFiles: Array<File> }) => AxiosPromise<ApiResponse>;
  updateImageFile: (commonRequestFileUpdate: { fileId: number; fileSeq: number; uploadFile: File }) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<CommonState & CommonApiState, any> = (set, get, api) => {
  return {
    modalType: { type: 'UPLOAD', active: false },
    openModal: (type, index) => {
      set((state) => ({
        modalType: {
          type,
          active: true,
        },
        index: index,
      }));
    },
    closeModal: (type) => {
      set((state) => ({
        modalType: {
          type,
          active: false,
        },
      }));
    },
    upMenuNm: undefined,
    setUpMenuNm: (upMenuNm: string) => {
      set((state) => ({
        upMenuNm: upMenuNm,
      }));
    },
    menuNm: undefined,
    setMenuNm: (menuNm: string) => {
      set((state) => ({
        menuNm: menuNm,
      }));
    },
    menuUpdYn: false,
    setMenuUpdYn: (menuUpdYn: boolean) => {
      set((state) => ({
        menuUpdYn: menuUpdYn,
      }));
    },
    menuExcelYn: false,
    setMenuExcelYn: (menuExcelYn: boolean) => {
      set((state) => ({
        menuExcelYn: menuExcelYn,
      }));
    },
    // filterDataList: [],
    // setFilterDataList: (newFilterDataList: FilterData[]) => {
    //   set((state: { filterDataList: FilterData[] }) => {
    //     // 기존 데이터가 없는 경우 바로 대체
    //     if (state.filterDataList.length === 0) {
    //       return { filterDataList: newFilterDataList };
    //     }
    //     // 새 데이터로 기존 데이터 대체 또는 추가
    //     const updatedFilterDataList = newFilterDataList.reduce(
    //       (acc, newFilterData) => {
    //         const existingIndex = acc.findIndex((item) => item.uri === newFilterData.uri);
    //         if (existingIndex !== -1) {
    //           // 동일한 `uri`가 있으면 대체
    //           acc[existingIndex] = newFilterData;
    //         } else {
    //           // 없으면 추가
    //           acc.push(newFilterData);
    //         }
    //         return acc;
    //       },
    //       [...state.filterDataList],
    //     ); // 현재 상태 복사
    //
    //     return {
    //       filterDataList: updatedFilterDataList,
    //     };
    //   });
    // },
    /*downedFunctionKey: undefined,
    setDownedFunctionKey: (downedFunctionKey: string) => {
      set((state) => ({
        downedFunctionKey: downedFunctionKey,
      }));
    },*/
    historyList: [],
    setHistoryList: (historyList: HistoryType[]) => {
      set((state) => ({
        historyList: historyList,
      }));
    },
    selectFileList: async (fileId: number) => {
      return authApi.get(`/common/file/${fileId}`).then((res): FileDet[] => {
        if (res.data.resultCode === 200) {
          return res.data.body;
        } else {
          console.error(res.data);
          return [];
        }
      });
    },
    deleteFile: (commonRequest) => {
      return authApi.delete('/common/fileDeleteBySeqWithBuket/' + commonRequest.fileId + '/' + commonRequest.fileSeq, {});
    },
    getFileUrl: async (fileKey: string) => {
      if (!fileKey || fileKey.trim() === '') {
        return '';
      } else {
        return await authApi.get('/common/getFileUrl', { params: { fileKey: fileKey } }).then((res) => {
          if (res.data.resultCode === 200) {
            return res.data.body;
          } else {
            return '';
          }
        });
      }
    },
    getFileList: (fileId: number) => {
      return authApi.get(`/common/file/${fileId}`);
    },
    selectGridColumnState: (uri) => {
      return authApi.get('/common/grid-column', {
        params: {
          uri: uri,
        },
      });
    },
    rearrangeFilesByStepsToMove: (commonRequestFileRearrangementRequest) => {
      return authApi.patch('/common/rearrangeFilesByStepsToMove', commonRequestFileRearrangementRequest);
    },
    uploadImageFiles: (commonRequestFileUploads) => {
      const formData = new FormData();
      commonRequestFileUploads.uploadFiles.forEach((f) => {
        formData.append('uploadFiles', f); // 멀티 파일 추가
      });

      formData.append('fileId', commonRequestFileUploads.fileId.toString());

      return authApi.post('/common/imgfile/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    updateImageFile: (commonRequestFileUpdate) => {
      const formData = new FormData();
      formData.append('fileId', commonRequestFileUpdate.fileId.toString());
      formData.append('fileSeq', commonRequestFileUpdate.fileSeq.toString());
      formData.append('uploadFile', commonRequestFileUpdate.uploadFile);

      return authApi.patch('/common/imgfile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  };
};

export const useCommonStore = create<CommonState & CommonApiState>()(devtools(immer(initialStateCreator)));
