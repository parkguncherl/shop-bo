import React from 'react';
import { PopupContent, PopupFooter, PopupLayout } from '../../index';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { Label } from '../../../index';
import { useContactState } from '../../../../stores';
import { isEmpty } from 'lodash';

export const AccessLogDeatilPop = () => {
  const [modalType, closeModal, selectContact] = useContactState((s) => [s.modalType, s.closeModal, s.selectContact]);

  return (
    <PopupLayout
      width={600}
      isEscClose={true}
      open={modalType.type === 'DETAIL' && modalType.active}
      title={'로그상세조회'}
      onClose={() => closeModal('DETAIL')}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={() => closeModal('DETAIL')}>
              {'닫기'}
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_1'}>
            <Label title={'ID(e-mail)'} value={selectContact?.loginId} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={'이름'} value={selectContact?.userNm} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={'권한'} value={selectContact?.authNm} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label
              title={'소속'}
              value={
                (isEmpty(selectContact?.belongNm) ? '-' : selectContact?.belongNm) + ' / ' + (isEmpty(selectContact?.deptNm) ? '-' : selectContact?.deptNm)
              }
            />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={'URI'} value={selectContact?.uri} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={'거래명'} value={selectContact?.uriNm} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={'접속 IP'} value={selectContact?.contactIp} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={'거래일시'} value={selectContact?.creTm} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={'입력 Param'} value={selectContact?.inputParamCntn} />
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </PopupLayout>
  );
};
