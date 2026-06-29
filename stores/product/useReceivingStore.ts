import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { StateCreator } from 'zustand/esm';
import { authApi } from '../../libs';
import { AxiosPromise } from 'axios';

type ModalType = 'RECEIVING_ADD' | 'RECEIVING_MOD' | 'RECEIVING_DEL';

interface ModalState {
  type: ModalType;
  active: boolean;
  stored_temporary?: unknown;
}

interface ReceivingState {
  modals: ModalState;
  openModal: (type: ModalType, stored_temp?: unknown) => void;
  closeModal: (type: ModalType) => void;
}

interface ReceivingApiState {
  insertReceiving: (req: any) => AxiosPromise<any>;
  updateReceiving: (req: any) => AxiosPromise<any>;
  updateReceivingIfExist: (req: any) => AxiosPromise<any>;
  deleteReceiving: (req: any) => AxiosPromise<any>;
}

type ReceivingStateOfAll = ReceivingState & ReceivingApiState;

const initialStateCreator: StateCreator<ReceivingStateOfAll> = (set) => ({
  modals: { type: 'RECEIVING_ADD', active: false },

  openModal: (type, stored_temp) =>
    set((state) => {
      state.modals = { type, active: true, stored_temporary: stored_temp };
    }),

  closeModal: (type) =>
    set((state) => {
      if (state.modals.type === type) {
        state.modals = { ...state.modals, active: false, stored_temporary: undefined };
      }
    }),

  insertReceiving: (req) => authApi.put('/receiving/insertReceiving', req),
  updateReceiving: (req) => authApi.patch('/receiving/updateReceiving', req),
  updateReceivingIfExist: (req) => authApi.patch('/receiving/updateReceivingIfExist', req),
  deleteReceiving: (req) => authApi.delete('/receiving/deleteReceiving', { data: req }),
});

export const useReceivingStore = create<ReceivingStateOfAll>()(
  devtools(
    immer(initialStateCreator),
    { name: 'useReceivingStore' }
  )
);
