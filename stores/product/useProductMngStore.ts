import { StateCreator } from 'zustand/esm';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, ProductContentListResponseProductContent, ProductMngRequestInsertProduct, ProductMngRequestUpdateProduct } from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';

type ModalType = 'IMG_UPLOAD' | 'PROD_INFO_ADD' | 'PROD_DET_INFO_ADD' | 'PROD_MOD' | 'PROD_DET_INFO';

interface ModalState {
  type: ModalType;
  active: boolean;
  stored_temporary?: Partial<ProductContentListResponseProductContent>;
}

interface ProductMngState {
  // paging: PageObject;
  // setPaging: (pagingInfo: PageObject | undefined) => void;
  modals: ModalState;
  openModal: (type: ModalType, stored_temp?: Partial<ProductContentListResponseProductContent>) => void;
  closeModal: (type: ModalType) => void;
}

interface ProductMngApiState {
  insertProductInfo: (insertProductInfoRequest: ProductMngRequestInsertProduct) => AxiosPromise<ApiResponse>;
  updateProduct: (updateProductRequest: ProductMngRequestUpdateProduct) => AxiosPromise<ApiResponse>;
}

type ProductMngStateOfAll = ProductMngState & ProductMngApiState;

const initialStateCreator: StateCreator<ProductMngStateOfAll> = (set, get, api) => {
  return {
    // paging: {
    //   curPage: 1,
    //   pageRowCount: 50,
    // },
    // setPaging: (pageObject) => {
    //   set((state) => ({
    //     paging: {
    //       ...state.paging,
    //       ...pageObject,
    //     },
    //   }));
    // },
    modals: { type: 'IMG_UPLOAD', active: false, stored_temporary: undefined },
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
    insertProductInfo: (insertProductInfoRequest) => {
      return authApi.put('/productMng/insertProductInfo', insertProductInfoRequest);
    },
    updateProduct: (updateProductRequest) => {
      return authApi.patch('/productMng/updateProduct', updateProductRequest);
    },
  };
};

export const useProductMngStore = create<ProductMngStateOfAll>()(devtools(immer(initialStateCreator)));
