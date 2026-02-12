import { AxiosPromise } from 'axios';
import { StateCreator } from 'zustand/esm';
import { authApi } from '../../libs';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, ProductContentsRequestInsertProductContents } from '../../generated';

type ModalType = 'ADD_CONF';

interface ModalState {
  type: ModalType;
  active: boolean;
}

interface ProductContentsState {
  modals: ModalState;
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface ProductContentsApiState {
  insertProductContents: (productContentsRequestInsertProductContents: ProductContentsRequestInsertProductContents) => AxiosPromise<ApiResponse>;
}

type FabricStateOfAll = ProductContentsState & ProductContentsApiState;

const initialStateCreator: StateCreator<FabricStateOfAll, any> = (set, get, api) => {
  return {
    modals: { type: 'ADD_CONF', active: false },
    openModal: (type) => {
      set((state) => ({
        modals: {
          type,
          active: true,
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

export const useProductContentsStore = create<FabricStateOfAll>()(devtools(immer(initialStateCreator)));
