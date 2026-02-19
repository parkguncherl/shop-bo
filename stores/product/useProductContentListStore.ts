import { StateCreator } from 'zustand/esm';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PageObject, ProductContentListResponseProductContent } from '../../generated';

type ModalType = 'SHOW' | 'ADD';

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

interface ProductContentListApiState {}

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
  };
};

export const useProductContentListStore = create<ProductContentListStateOfAll>()(devtools(immer(initialStateCreator)));
