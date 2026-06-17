'use client';

import React, { useEffect, useState } from 'react';
import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import { ProductContentListResponseProductContent } from '../../../../generated';
import { useCommonStore } from '../../../../stores';
import { RegExpression } from '../../../../libs/const';
import { toastError, toastSuccess } from '../../../ToastMessage';

interface Props {
  open: boolean;
  onClose: () => void;
  productContentData?: Partial<ProductContentListResponseProductContent>;
}

interface PreviewElement {
  type: 'text' | 'image';
  content?: string;
  url?: string;
}

const ProductContentPreviewPop = ({ open, onClose, productContentData }: Props) => {
  const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);
  const [elements, setElements] = useState<PreviewElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!open || !productContentData?.newsContents) {
      setElements([]);
      return;
    }

    const parse = async () => {
      setLoading(true);
      const parts = (productContentData.newsContents || '').split(RegExpression.ProductContent.carriageReturn).filter((v) => v !== '');
      const result: PreviewElement[] = [];

      const fileDetList = productContentData.fileId ? await selectFileList(productContentData.fileId) : [];

      for (const part of parts) {
        const imgMatches = [...part.matchAll(RegExpression.ProductContent.imgToken)];
        if (imgMatches.length > 0) {
          const fileName = imgMatches[0][1];
          const fileDet = fileDetList.find((f) => f.fileNm === fileName);
          if (fileDet?.sysFileNm) {
            const url = await getFileUrl(fileDet.sysFileNm);
            result.push({ type: 'image', url });
          }
        } else {
          result.push({ type: 'text', content: part });
        }
      }

      setElements(result);
      setLoading(false);
    };

    parse();
  }, [open, productContentData]);

  const handleInstagramPost = async () => {
    const imageUrls = elements.filter((el) => el.type === 'image' && el.url).map((el) => el.url as string);
    if (imageUrls.length === 0) {
      toastError('게시할 이미지가 없습니다.');
      return;
    }

    const textParts = elements.filter((el) => el.type === 'text' && el.content).map((el) => el.content as string);
    const caption = [productContentData?.newsTitle, productContentData?.newsSubTitle, ...textParts].filter(Boolean).join('\n\n');

    setPosting(true);
    try {
      const res = await fetch('/api/instagram/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls, caption }),
      });
      const data = await res.json();
      if (data.success) {
        toastSuccess('인스타그램에 게시되었습니다.');
      } else {
        toastError(data.error || '게시 실패');
      }
    } catch {
      toastError('게시 중 오류가 발생했습니다.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <PopupLayout
      width={420}
      open={open}
      isEscClose={true}
      title={'모바일 미리보기'}
      onClose={onClose}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left">
              <button
                className={posting ? 'btn' : 'btn btn_blue'}
                disabled={posting || loading}
                onClick={handleInstagramPost}
              >
                {posting ? '게시 중...' : '인스타그램 게시'}
              </button>
            </div>
            <div className="right">
              <button className="btn" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          {/* 모바일 폰 프레임 */}
          <div style={phoneFrameStyle}>
            {/* 노치 */}
            <div style={notchStyle}>
              <div style={notchDotStyle} />
            </div>
            {/* 스크롤 영역 */}
            <div style={scrollAreaStyle}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <p style={{ color: '#888', fontSize: 13 }}>불러오는 중...</p>
                </div>
              ) : (
                <>
                  {/* 제목 영역 */}
                  <div style={titleAreaStyle}>
                    <h2 style={titleStyle}>{productContentData?.newsTitle || ''}</h2>
                    {productContentData?.newsSubTitle && (
                      <p style={subTitleStyle}>{productContentData.newsSubTitle}</p>
                    )}
                    <div style={dividerStyle} />
                  </div>
                  {/* 본문 */}
                  {elements.map((el, idx) =>
                    el.type === 'image' ? (
                      <div key={idx} style={imgWrapperStyle}>
                        <img src={el.url} alt="" style={imgStyle} />
                      </div>
                    ) : (
                      <div key={idx} style={textWrapperStyle}>
                        <p style={textStyle}>{el.content}</p>
                      </div>
                    ),
                  )}
                </>
              )}
            </div>
            {/* 홈 버튼 */}
            <div style={homeBarStyle}>
              <div style={homeBarInnerStyle} />
            </div>
          </div>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

const phoneFrameStyle: React.CSSProperties = {
  width: 360,
  height: 720,
  borderRadius: 20,
  border: '3px solid #ccc',
  backgroundColor: '#fff',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  position: 'relative',
};

const notchStyle: React.CSSProperties = {
  width: '100%',
  height: 20,
  backgroundColor: '#f5f5f5',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexShrink: 0,
  borderBottom: '1px solid #eee',
};

const notchDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: '#bbb',
};

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  backgroundColor: '#fff',
};

const titleAreaStyle: React.CSSProperties = {
  padding: '20px 16px 12px',
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#111',
  margin: 0,
  lineHeight: 1.4,
};

const subTitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#888',
  margin: '6px 0 0',
};

const dividerStyle: React.CSSProperties = {
  marginTop: 12,
  borderBottom: '1px solid #eee',
};

const imgWrapperStyle: React.CSSProperties = {
  width: '100%',
};

const imgStyle: React.CSSProperties = {
  width: '100%',
  display: 'block',
};

const textWrapperStyle: React.CSSProperties = {
  padding: '10px 16px',
};

const textStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#333',
  lineHeight: 1.7,
  margin: 0,
  whiteSpace: 'pre-wrap',
};

const homeBarStyle: React.CSSProperties = {
  height: 22,
  backgroundColor: '#f5f5f5',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexShrink: 0,
  borderTop: '1px solid #eee',
};

const homeBarInnerStyle: React.CSSProperties = {
  width: 80,
  height: 3,
  borderRadius: 2,
  backgroundColor: '#bbb',
};

export default ProductContentPreviewPop;
