import { StateCreator } from 'zustand/esm';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PageObject, ProductContentListResponseProductContent } from '../../generated';

type ModalType = '';

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

interface ProductMngApiState {}

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
    modals: { type: '', active: false, stored_temporary: undefined },
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
  };
};

export const useProductMngStore = create<ProductMngStateOfAll>()(devtools(immer(initialStateCreator)));
