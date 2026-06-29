import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  PageResponsePartnerResponsePaging,
  PartnerResponsePaging,
  PartnerRequestCreate,
  PartnerRequestDelete,
  PartnerRequestUpdate,
  PageObject,
  PartnerRequestFilterForList,
} from '../generated';
type PartnerControllerApiSelectPartnerPagingRequest = any;
type PartnerResponseSelect = any;
import { AxiosPromise } from 'axios';
import { authApi, authDownApi } from '../libs';
import { StateCreator } from 'zustand';

type ModalType = 'ADD' | 'MOD';

/** 파트너 페이징 필터 */
export type PartnerPagingFilter = Pick<PartnerControllerApiSelectPartnerPagingRequest, any>;

interface PartnerState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedPartner: PartnerResponsePaging | undefined;
  setSelectedPartner: (partner: PartnerResponsePaging) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}

interface PartnerApiState {
  selectPartnerPaging: (filter: PartnerPagingFilter) => AxiosPromise<PageResponsePartnerResponsePaging>;
  selectPartnerList: (requestFilterForList?: PartnerRequestFilterForList) => AxiosPromise<ApiResponse>;
  insertPartner: (partnerRequest: PartnerRequestCreate) => AxiosPromise<ApiResponse>;
  updatePartner: (partnerRequest: PartnerRequestUpdate) => AxiosPromise<ApiResponse>;
  deletePartner: (partnerRequest: PartnerRequestDelete) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<PartnerState & PartnerApiState, any> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 20,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    selectedPartner: undefined,
    setSelectedPartner: (partner) => {
      set((state) => ({
        selectedPartner: partner,
      }));
    },
    modalType: { type: 'ADD', active: false },
    openModal: (type) => {
      set((state) => ({
        modalType: {
          type,
          active: true,
        },
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
    selectPartnerPaging: (filter) => {
      return authApi.get('/partner/paging', {
        params: {
          ...filter,
          ...get().paging,
        },
      });
    },
    selectPartnerList: (requestFilterForList) => {
      return authApi.get('/partner/list', {
        params: {
          ...requestFilterForList,
        },
      });
    },
    insertPartner: (partnerRequest) => {
      return authApi.post('/partner', partnerRequest);
    },
    updatePartner: (partnerRequest) => {
      return authApi.put('/partner', partnerRequest);
    },
    deletePartner: (partnerRequest) => {
      return authApi.delete('/partner', {
        data: partnerRequest,
      });
    },
  };
};

export const usePartnerStore = create<PartnerState & PartnerApiState>()(devtools(immer(initialStateCreator)));
