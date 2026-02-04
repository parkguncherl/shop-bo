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
      return authApi.put('/productContents/insertProductContents', insertFabricDatas_request);
    },
  };
};

export const useProductContentsStore = create<FabricStateOfAll>()(devtools(immer(initialStateCreator)));
