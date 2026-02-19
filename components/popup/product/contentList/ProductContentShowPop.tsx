import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { FileDet, ProductContentListResponseProductContent } from '../../../../generated';
import { useCommonStore } from '../../../../stores';

interface ProductContentShowPopProps {
  open: boolean;
  productContentData?: ProductContentListResponseProductContent;
  onClose: () => void;
}
interface extendedFileDet extends FileDet {
  fileUrl?: string;
}

/**
 * components/popup/product/contentList/ProductContentShowPop.tsx
 * desc: 상품컨텐츠 출력 팝업
 * Date: 2026/02/13
 * Author: park junsung
 * */
const ProductContentShowPop = ({ open, productContentData, onClose }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);

  /** 팝업 내부 local state */
  const [managedDataState, setManagedDataState] = useState<ProductContentListResponseProductContent | undefined>(undefined);
  const [managedFileDetState, setManagedFileDetState] = useState<extendedFileDet[]>([]);

  useEffect(() => {
    setManagedDataState(productContentData);
    if (productContentData) {
      if (productContentData.fileId) {
        selectFileList(productContentData.fileId).then((fileDetList) => {
          // const updatedFileDetStateList = fileDetList.map(async (fileDet) => {
          //   return {
          //     ...fileDet,
          //     fileUrl: fileDet.sysFileNm ? await getFileUrl(fileDet.sysFileNm) : undefined,
          //   };
          // });
          // // todo 마저 진행
          // setManagedFileDetState(updatedFileDetStateList); // 저장 시점에 이미 중복 파일은 부재하리라 기대하며 이하 작성
        });
      }
    }
  }, [productContentData]);

  useEffect(() => {
    if (managedFileDetState.length > 0) {
      // todo
    }
  }, [managedFileDetState]);

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
