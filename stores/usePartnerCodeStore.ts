import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { StateCreator } from 'zustand';
import {
  ApiResponse,
  ApiResponseListCodeDropDown,
  ApiResponseListPartnerCodeDropDown,
  ApiResponseListPartnerCodeResponseLowerSelect,
  PageObject,
  PartnerCodeDropDown,
  PartnerCodeRequestCreate,
  PartnerCodeRequestDelete,
  PartnerCodeRequestSoftDelete,
  PartnerCodeResponseLowerSelect,
  PartnerCodeResponsePaging,
} from '../generated';

type ModalType = 'PARTNER_CODE_OPEN';

interface ModalState {
  type: ModalType;
  active: boolean;
  stored_temporary?: Partial<PartnerCodeResponsePaging>;
}

interface PartnerCodeState {
  modals: ModalState;
  openModal: (type: ModalType, stored_temp?: Partial<PartnerCodeResponsePaging>) => void;
  closeModal: (type: ModalType) => void;
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedPartnerCode: PartnerCodeResponseLowerSelect[] | undefined;
  setSelectedPartnerCode: (code: PartnerCodeResponseLowerSelect[]) => void;
  updatePartnerCodeItem: (id: number, updateData: PartnerCodeResponseLowerSelect) => void;
  partnerCodeDropDown: PartnerCodeDropDown | undefined;
}

interface PartnerCodeApiState {
  selectDropdownByPartnerCodeUpper: () => AxiosPromise<ApiResponseListCodeDropDown>;
  savePartnerCode: (codeRequest: PartnerCodeRequestCreate) => AxiosPromise<ApiResponse>;
  deletePartnerCode: (codeRequest: PartnerCodeRequestDelete) => AxiosPromise<ApiResponse>;
  updatePartnerCodeToDeletedStatus: (codeRequests: PartnerCodeRequestSoftDelete) => AxiosPromise<ApiResponse>;
  selectLowerPartnerCodeByCodeUpper: (codeUpper: string, searchKeyWord: string) => AxiosPromise<ApiResponseListPartnerCodeResponseLowerSelect>;
  selectPartnerCodeDropdown: (codeUpper: string) => AxiosPromise<ApiResponseListPartnerCodeDropDown>; // 코드 콤보용
}

const initialStateCreator: StateCreator<PartnerCodeState & PartnerCodeApiState, any> = (set, get, api) => {
  return {
    modals: { type: 'PARTNER_CODE_OPEN', active: false, stored_temporary: undefined },
    openModal: (type: any, stored_temp: any) => {
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
    selectedPartnerCode: undefined,
    setSelectedPartnerCode: (code) => {
      set((state) => ({
        selectedPartnerCode: code,
      }));
    },
    partnerCodeDropDown: undefined,
    updatePartnerCodeItem: (id, updateData) => {
      set((state) => ({
        selectedPartnerCode: state.selectedPartnerCode?.map((item) => (item.id === id ? { ...item, ...updateData } : item)),
      }));
    },
    selectDropdownByPartnerCodeUpper: () => {
      return authApi.get('/partnerCode/dropdown', {
        params: {
          ...get().partnerCodeDropDown,
        },
      });
    },
    savePartnerCode: (codeRequest) => {
      return authApi.post('/partnerCode', codeRequest);
    },
    deletePartnerCode: (codeRequest) => {
      return authApi.delete('/partnerCode', {
        data: codeRequest,
      });
    },
    updatePartnerCodeToDeletedStatus: (codeRequests: PartnerCodeRequestSoftDelete) => {
      return authApi.put('/partnerCode/update-status', codeRequests);
    },
    selectLowerPartnerCodeByCodeUpper: (codeUpper: string, searchKeyWord: string) => {
      return authApi.get('/partnerCode/lowerCodeList', {
        params: {
          codeUpper: codeUpper,
          searchKeyword: searchKeyWord,
        },
      });
    },
    selectPartnerCodeDropdown: (codeUpper: string, searchKeyWord?: string) => {
      return authApi.get('/partnerCode/dropdown', {
        params: { codeUpper: codeUpper, searchKeyWord: searchKeyWord },
      });
    },
  };
};

export const usePartnerCodeStore = create<PartnerCodeState & PartnerCodeApiState>()(devtools(immer(initialStateCreator)));
