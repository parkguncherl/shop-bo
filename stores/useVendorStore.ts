import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AxiosPromise } from 'axios';
import { authApi } from '@/libs';

// 협력업체 아이템 타입
export type VendorItem = {
  id: number;
  partnerId?: number;
  partnerNm: string;
  location?: string;
  phoneNo?: string;
  phoneNo2?: string;
  kakaoId?: string;
  etcInfo?: string;
  creUser?: string;
  creTm?: string;
  updUser?: string;
  updTm?: string;
};

// 협력업체 검색 필터 타입
export type VendorFilter = {
  partnerNm: string;
  phoneNo: string;
};

// 협력업체 등록/수정 요청 타입
export type VendorCreateRequest = {
  partnerNm: string;
  location?: string | null;
  phoneNo?: string | null;
  phoneNo2?: string | null;
  kakaoId?: string | null;
  etcInfo?: string | null;
};

export type VendorUpdateRequest = VendorCreateRequest & { id: number };

// UI 상태
interface VendorUiState {
  filters: VendorFilter;
  setFilters: (name: keyof VendorFilter, value: string) => void;
  resetFilters: () => void;

  selectedVendor: VendorItem | null;
  setSelectedVendor: (vendor: VendorItem | null) => void;

  addOpen: boolean;
  modOpen: boolean;
  delOpen: boolean;
  setAddOpen: (open: boolean) => void;
  setModOpen: (open: boolean) => void;
  setDelOpen: (open: boolean) => void;
}

// API 상태
interface VendorApiState {
  fetchVendors: (filters: VendorFilter) => AxiosPromise<any>;
  createVendor: (request: VendorCreateRequest) => AxiosPromise<any>;
  updateVendor: (request: VendorUpdateRequest) => AxiosPromise<any>;
  deleteVendor: (id: number) => AxiosPromise<any>;
}

const DEFAULT_FILTERS: VendorFilter = { partnerNm: '', phoneNo: '' };

const initialStateCreator: StateCreator<VendorUiState & VendorApiState, any> = (set) => ({
  filters: { ...DEFAULT_FILTERS },
  setFilters: (name, value) => {
    set((state) => ({ filters: { ...state.filters, [name]: value } }));
  },
  resetFilters: () => {
    set(() => ({ filters: { ...DEFAULT_FILTERS } }));
  },

  selectedVendor: null,
  setSelectedVendor: (vendor) => {
    set(() => ({ selectedVendor: vendor }));
  },

  addOpen: false,
  modOpen: false,
  delOpen: false,
  setAddOpen: (open) => {
    set(() => ({ addOpen: open }));
  },
  setModOpen: (open) => {
    set(() => ({ modOpen: open }));
  },
  setDelOpen: (open) => {
    set(() => ({ delOpen: open }));
  },

  fetchVendors: (filters) =>
    authApi.get('/partnerVendorMng/list', {
      params: {
        pageRowCount: 1000,
        curPage: 1,
        'filter.partnerNm': filters.partnerNm || undefined,
        'filter.phoneNo': filters.phoneNo || undefined,
      },
    }),
  createVendor: (request) => authApi.post('/partnerVendorMng/create', request),
  updateVendor: (request) => authApi.put('/partnerVendorMng/update', request),
  deleteVendor: (id) => authApi.delete(`/partnerVendorMng/${id}`),
});

export const useVendorStore = create<VendorUiState & VendorApiState>()(devtools(immer(initialStateCreator)));
