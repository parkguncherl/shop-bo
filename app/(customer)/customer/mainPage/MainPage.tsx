'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '../../../../components';
import {
  ProductMngRequestProductDetInfoFilter,
  ProductMngRequestProductInfoFilter,
  ProductMngResponseProductDetInfo,
  ProductMngResponseProductInfo,
} from '../../../../generated';
import { CellClickedEvent, ColDef, ICellEditorParams } from 'ag-grid-community';
import { TableHeader, toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import TunedGrid from '../../../../components/grid/TunedGrid';
import useFilters from '../../../../hooks/useFilters';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';
import { PARTNER_CODE, Placeholder } from '../../../../libs/const';
import { Utils } from '../../../../libs/utils';
import SrcEnumerator, { SrcElement, SrcEnumeratorProps } from '../../../../components/layout/product/productMng/SrcEnumerator';
import { FileUploadPop } from '../../../../components/popup/common';
import ProductInfoAddPop from '../../../../components/popup/product/productMng/ProductInfoAddPop';
import ProductModPop from '../../../../components/popup/product/productMng/ProductModPop';
import ProductDetInfoPop from '../../../../components/popup/product/productMng/ProductDetInfoPop';
import { usePartnerCodeStore } from '../../../../stores/usePartnerCodeStore';
import { PartnerCodePop } from '../../../../components/popup/system/PartnerCodePop';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import ProductForEachCategoryPop from '../../../../components/popup/product/productMng/ProductForEachCategoryPop';

/** 메인페이지 */
const MainPage = () => {
  return <div></div>;
};

export default MainPage;
