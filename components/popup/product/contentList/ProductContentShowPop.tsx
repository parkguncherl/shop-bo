import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { ProductContentListResponseProductContent } from '../../../../generated';

interface ProductContentShowPopProps {
  open: boolean;
  data?: ProductContentListResponseProductContent;
  onClose: () => void;
}

/**
 * components/popup/product/contentList/ProductContentShowPop.tsx
 * Date: 2026/02/13
 * Author: park junsung
 * */
const ProductContentShowPop = ({ open, data, onClose }: ProductContentShowPopProps) => {
  /** 팝업 내부 local state */
  const [managedDataState, setManagedDataState] = useState<ProductContentListResponseProductContent | undefined>(undefined);

  useEffect(() => {
    setManagedDataState(data);
  }, [data]);

  useEffect(() => {
    console.log('managedDataState: ', managedDataState);
  }, [managedDataState]);

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title={'상품컨텐츠 미리보기'}
        onClose={onClose}
        footer={
          <PopupFooter>
            <button className="btn" onClick={onClose}>
              닫기
            </button>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div></div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ProductContentShowPop;
