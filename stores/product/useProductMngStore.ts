import { StateCreator } from 'zustand/esm';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  ProductMngRequestDeleteCategoryProduct,
  ProductMngRequestDeleteProduct,
  ProductMngRequestDeleteProductDet,
  ProductMngRequestInsertProduct,
  ProductMngRequestInsertProductDet,
  ProductMngRequestUpdateCategoryProduct,
  ProductMngRequestUpdateProduct,
  ProductMngRequestUpdateProductDet,
  ProductMngRequestInsertCategoryProduct,
  ProductMngRequestUpdateCategoryProductSeq,
} from '../../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../../libs';

type ModalType = 'IMG_UPLOAD' | 'PROD_INFO_ADD' | 'PROD_MOD' | 'PROD_DET_INFO' | 'PROD_DEL' | 'PROD_BY_CATEGORY' | 'IMG_EDIT';

interface ModalState {
  type: ModalType;
  active: boolean;
  stored_temporary?: unknown;
}

interface ProductMngState {
  // paging: PageObject;
  // setPaging: (pagingInfo: PageObject | undefined) => void;
  modals: ModalState;
  openModal: (type: ModalType, stored_temp?: unknown) => void;
  closeModal: (type: ModalType) => void;
}

interface ProductMngApiState {
  insertProductInfo: (insertProductInfoRequest: ProductMngRequestInsertProduct) => AxiosPromise<ApiResponse>;
  insertProductDet: (insertProductDetRequest: ProductMngRequestInsertProductDet) => AxiosPromise<ApiResponse>;
  updateProduct: (updateProductRequest: ProductMngRequestUpdateProduct) => AxiosPromise<ApiResponse>;
  updateProductDet: (updateProductDetRequest: ProductMngRequestUpdateProductDet) => AxiosPromise<ApiResponse>;
  deleteProduct: (deleteProductRequest: ProductMngRequestDeleteProduct) => AxiosPromise<ApiResponse>;
  deleteProductDet: (deleteProductDetRequest: ProductMngRequestDeleteProductDet) => AxiosPromise<ApiResponse>;

  insertCategoryProduct: (insertCategoryProductRequest: ProductMngRequestInsertCategoryProduct) => AxiosPromise<ApiResponse>;
  updateCategoryProduct: (updateCategoryProductRequest: ProductMngRequestUpdateCategoryProduct) => AxiosPromise<ApiResponse>;
  deleteCategoryProduct: (deleteCategoryProductRequest: ProductMngRequestDeleteCategoryProduct) => AxiosPromise<ApiResponse>;

  updateCategoryProductSeq: (productMngRequestUpdateCategoryProductSeq: ProductMngRequestUpdateCategoryProductSeq) => AxiosPromise<ApiResponse>;
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
    insertProductDet: (insertProductDetRequest) => {
      return authApi.put('/productMng/insertProductDet', insertProductDetRequest);
    },
    updateProduct: (updateProductRequest) => {
      return authApi.patch('/productMng/updateProduct', updateProductRequest);
    },
    updateProductDet: (updateProductDetRequest) => {
      return authApi.patch('/productMng/updateProductDet', updateProductDetRequest);
    },
    deleteProduct: (deleteProductRequest) => {
      return authApi.patch('/productMng/deleteProduct', deleteProductRequest);
    },
    deleteProductDet: (deleteProductDetRequest) => {
      return authApi.patch('/productMng/deleteProductDet', deleteProductDetRequest);
    },

    insertCategoryProduct: (deleteProductDetRequest) => {
      return authApi.patch('/productMng/insertCategoryProduct', deleteProductDetRequest);
    },
    updateCategoryProduct: (deleteProductDetRequest) => {
      return authApi.patch('/productMng/updateCategoryProduct', deleteProductDetRequest);
    },
    deleteCategoryProduct: (deleteProductDetRequest) => {
      return authApi.patch('/productMng/deleteCategoryProduct', deleteProductDetRequest);
    },

    updateCategoryProductSeq: (productMngRequestUpdateCategoryProductSeq) => {
      return authApi.patch('/productMng/updateCategoryProductSeq', productMngRequestUpdateCategoryProductSeq);
    },
  };
};

export const useProductMngStore = create<ProductMngStateOfAll>()(devtools(immer(initialStateCreator)));
