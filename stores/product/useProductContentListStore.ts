import { StateCreator } from 'zustand/esm';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PageObject } from '../../generated';

type ModalType = 'ADD_CONF';

interface ModalState {
  type: ModalType;
  active: boolean;
}

interface ProductContentListState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  modals: ModalState;
  openModal: (type: ModalType) => void;
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
  };
};

export const useProductContentListStore = create<ProductContentListStateOfAll>()(devtools(immer(initialStateCreator)));
