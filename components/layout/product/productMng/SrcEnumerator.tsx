import React from 'react';

interface SrcElement {
  fileSrc?: string;
}

interface SrcEnumeratorProps {
  srcElements?: SrcElement[];
}

const SrcEnumerator = ({ srcElements }: SrcEnumeratorProps) => {
  return (
    <div className={'srcEnumerator'}>
      <div className={'upper'}>
        <div className={'header'}>
          <div className={'gridBoxInfo'}>dd</div>
        </div>
        <div className={'main'}></div>
      </div>
      <div className={'bottom'}>
        <div className="btnArea between">
          <div className="left"></div>
          <div className="right">
            <button
              className={'btn btn_blue'}
              onClick={() => {
                // todo
              }}
            >
              {'업로드'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SrcEnumerator;
