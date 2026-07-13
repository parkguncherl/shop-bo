import React, { useEffect, useRef, useState } from 'react';
import { Menu, MenuRequestCreate } from '@/generated';
import { PopupContent, PopupFooter, PopupLayout } from '../../index';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { Input, toastError, toastSuccess } from '@/components';
import { useMenuStore } from '@/stores';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import FormInput from '../../../form/FormInput';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '@/libs';
import Loading from '../../../Loading';

interface Props {
  data: Menu;
  callback?: () => void;
}

export const MenuAddPop = ({ data, callback }: Props) => {
  const menuUriTitle = data.upMenuCd === 'TOP' ? 'ICO' : 'URI';
  const el = useRef<HTMLDListElement | null>(null);
  const {
    watch,
    handleSubmit,
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<MenuRequestCreate>({
    resolver: yupResolver(YupSchema.MenuRequest({ upMenuCd: data.upMenuCd, menuUriTitle })), // 완료
    defaultValues: data,
    mode: 'onSubmit',
  });

  const queryClient = useQueryClient();
  const [menu, setMenu] = useState<Menu>({});
  const [modalType, closeModal, selectedMenu] = useMenuStore((s) => [s.modalType, s.closeModal, s.selectedMenu]);
  const [insertMenu] = useMenuStore((s) => [s.insertMenu]);

  /** 신규 */
  const { mutate: insertMenuMutate, isPending } = useMutation({
    mutationFn: insertMenu,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['/menu/leftMenu'] }),
            queryClient.invalidateQueries({ queryKey: ['/auth/check/menu'] }),
            queryClient.invalidateQueries({ queryKey: ['/menu/paging'] }),
            queryClient.invalidateQueries({ queryKey: ['/menu/top'] }),
          ]);
          closeModal('ADD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  // 페이지 열때 초기화
  useEffect(() => {
    menu.menuCd = '';
    menu.menuNm = '';
    menu.menuEngNm = '';
    menu.menuUri = '';
    menu.menuOrder = 0;
    setMenu(menu);
  }, []);

  const onValid: SubmitHandler<MenuRequestCreate> = (data) => {
    insertMenuMutate(data);
  };

  useEffect(() => {
    return () => {
      clearErrors(); // 에러 메세지 초기화
    };
  }, []);

  return (
    <dl ref={el}>
      <form>
        <PopupLayout
          width={500}
          isEscClose={false}
          open={modalType.type === 'ADD' && modalType.active}
          title={'신규 메뉴 생성'}
          onClose={() => closeModal('ADD')}
          footer={
            <PopupFooter>
              <div className={'btnArea'}>
                <button className={'btn btnPurple'} onClick={handleSubmit(onValid)}>
                  저장
                </button>
                <button className={'btn'} onClick={() => closeModal('ADD')}>
                  닫기
                </button>
              </div>
            </PopupFooter>
          }
        >
          <PopupContent>
            <PopupSearchBox>
              <PopupSearchType className={'type_1'}>
                <Input title={'상위코드'} disable={true} value={data.upMenuCd} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <Input title={'상위코드명'} disable={true} value={data.upMenuCd === 'TOP' ? 'TOP' : data.upMenuNm} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestCreate> control={control} name={'menuCd'} label={'코드'} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestCreate> control={control} name={'menuNm'} label={'이름'} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestCreate> control={control} name={'menuEngNm'} label={'영문명'} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestCreate> control={control} name={'menuUri'} label={menuUriTitle} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<MenuRequestCreate> control={control} name={'menuOrder'} label={'순서'} required={true} />
              </PopupSearchType>
            </PopupSearchBox>
          </PopupContent>
          {isPending && <Loading />}
        </PopupLayout>
      </form>
    </dl>
  );
};
