import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import React, { useEffect, useRef } from 'react';
import { FileDet } from '../../generated';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export interface ImgPreviewFileDet extends FileDet {
  url: string;
}
export interface ImgPreviewBoxProps {
  open: boolean;
  resized?: boolean;
  onReSizeReq?: () => void;
  fileDetList?: ImgPreviewFileDet[];
}

const ImgPreviewBox = ({ open, resized, onReSizeReq, fileDetList = [] }: ImgPreviewBoxProps) => {
  const swiperRef = useRef<SwiperRef | null>(null);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      swiperRef.current?.swiper?.update(); // 컴포넌트가 마운트될 시점 뒤에 실행되도록 보장
    }, 450); // transition 0.4s 보다 약간 크게

    return () => clearTimeout(timer);
  }, [open, resized, fileDetList.length]);

  return (
    <div className={`productImgBox ${open ? 'on' : ''} ${resized ? 'onSize' : ''}`} onDoubleClick={onReSizeReq}>
      <button className={`imgResizeBtn ${resized ? 'small' : 'big'}`} onClick={onReSizeReq}></button>
      {open && fileDetList.length > 0 ? (
        <>
          <Swiper
            modules={[Navigation, Pagination]}
            navigation={{
              nextEl: '.imgBoxNext',
              prevEl: '.imgBoxPrev',
            }}
            ref={swiperRef}
            slidesPerView={1}
            key={fileDetList[0].url}
            observer
            observeParents
            pagination={{ clickable: true }}
          >
            <div className={'wrap'}>
              {fileDetList.map((item, index) => (
                <SwiperSlide key={item.id}>
                  <img src={item.url} alt="상품 이미지" />
                </SwiperSlide>
              ))}
            </div>
          </Swiper>
          <div className={'imgBoxBtn'}>
            <button className={'imgBoxPrev'}></button>
            <button className={'imgBoxNext'}></button>
          </div>
        </>
      ) : (
        <div className="noImage">저장된 이미지가 없습니다</div>
      )}
    </div>
  );
};

export default ImgPreviewBox;
