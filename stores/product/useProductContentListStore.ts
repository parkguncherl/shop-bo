import { StateCreator } from 'zustand/esm';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, PageObject, ProductContentListResponseProductContent, ProductContentsRequestInsertProductContents } from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';

type ModalType = 'SHOW' | 'ADD' | 'DEL_CONF';

interface ModalState {
  type: ModalType;
  active: boolean;
  stored_temporary?: Partial<ProductContentListResponseProductContent>;
}

interface ProductContentListState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  modals: ModalState;
  openModal: (type: ModalType, stored_temp?: Partial<ProductContentListResponseProductContent>) => void;
  closeModal: (type: ModalType) => void;
}

interface ProductContentListApiState {
  insertProductContents: (productContentsRequestInsertProductContents: ProductContentsRequestInsertProductContents) => AxiosPromise<ApiResponse>;
}

type ProductContentListStateOfAll = ProductContentListState & ProductContentListApiState;

const initialStateCreator: StateCreator<ProductContentListStateOfAll> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 50,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    modals: { type: 'SHOW', active: false, stored_temporary: undefined },
    openModal: (type, stored_temp) => {
      set((state) => ({
        modals: {
          type,
          active: true,
          stored_temporary: stored_temp,
        },
      }));
    },
    closeModal: (type) => {
      set((state) => ({
        modals: {
          type,
          active: false,
          stored_temporary: undefined,
        },
      }));
    },
    insertProductContents: async (insertFabricDatas_request) => {
      const formData = new FormData();
      if (insertFabricDatas_request.commonRequestFileUploads?.uploadFiles && insertFabricDatas_request.commonRequestFileUploads.uploadFiles.length > 0) {
        for (let i = 0; i < insertFabricDatas_request.commonRequestFileUploads.uploadFiles.length; i++) {
          formData.append('files', insertFabricDatas_request.commonRequestFileUploads.uploadFiles[i]);
        }
        insertFabricDatas_request.commonRequestFileUploads.uploadFiles = undefined; // 본 요청 객체의 파일 목록은 무효화
      }
      formData.append('main', new Blob([JSON.stringify(insertFabricDatas_request)], { type: 'application/json' })); // 파일을
      return authApi.put('/productContents/insertProductContents', formData); // Blob 형태로 전송하여 백앤드 차원에서 이를 다시 프론트와 동기화된 dto로 변환, 이하 처리
    },
  };
};

export const useProductContentListStore = create<ProductContentListStateOfAll>()(devtools(immer(initialStateCreator)));
