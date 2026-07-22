export const Placeholder = {
  Default: '검색어를 입력하세요.',
  Select: '선택하세요.',
  Input: '입력하세요.',
  File: '파일을 선택하세요.',
  PhoneNo: '-를 제외한 숫자만 입력하세요.',
};

// 정규표현식 모음
export const RegExpression = {
  ProductContent: {
    imgToken: /<<IMG\|([^>]+)>>/g, // <<IMG|image_title>>, 최초 캡처 그룹에서 파일명 추출 가능
    carriageReturn: /\\n/g, // '\\n' → 문자열 \n
  },
};

// 요구되는 값에 맞추어 포매팅 수행하는 함수(혹은 그러한 역할을 하는 무언가)의 모음
export const Formatter = {
  ProductContent: {
    CarriageReturn: (content: string) => content + '\\n', // 명시적 캐리지 리턴 추가
    ImgToken: (fileName: string) => `<<IMG|${fileName}>>`, // 텍스트 데이터에 사용되는 표준 이미지 토큰
  },
};

// 표준색상 팔레트 (화이트/그레이/블랙 + 다양한 색상)
export const STNDR_COLOR_PALETTE = [
  '#FFFFFF',
  '#F5F5F5',
  '#E0E0E0',
  '#BDBDBD',
  '#9E9E9E',
  '#757575',
  '#424242',
  '#000000',
  '#F44336',
  '#E91E63',
  '#FF5252',
  '#FF4081',
  '#D50000',
  '#C2185B',
  '#9C27B0',
  '#673AB7',
  '#7C4DFF',
  '#B388FF',
  '#6200EA',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#40C4FF',
  '#0091EA',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#69F0AE',
  '#00C853',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#FFD740',
  '#FF6D00',
  '#795548',
  '#8D6E63',
  '#607D8B',
  '#90A4AE',
];

export const AlertMessage = { RequiredParams: '검색조건을 1개 이상 입력하세요.', LastDataHasBeenReached: '더 이상 데이터가 존재하지 않습니다.' };

/** 인증번호 입력 대기 시간 (ms) */
export const Otp = { duration: 180000 };

export const DEFAULT_ADD_HOURE = 6;

const telRegionNos = ['010', '02', '031', '032', '033', '041', '042', '043', '044', '051', '052', '053', '054', '055', '061', '062', '063', '064'];

export const LOCAL_STORAGE_HISTORY = 'shopMenuHistoryList';
export const LOCAL_STORAGE_GUBUN = 'shopGubun';
export const LOCAL_STORAGE_WMS_HISTORY = 'shopWmsMenuHistoryList';

export const PARTNER_CODE = {
  categories: { code: 'P0001', name: '카테고리' },
  orderQuestion: { code: 'P0002', name: '주문질의응답' },
  fit: { code: 'P0003', name: '잘맞는지' },
  bodySize: { code: 'P0004', name: '신체사이즈' },
  weight: { code: 'P0005', name: '몸무게' },
  domae: { code: 'P0006', name: '협력업체' },
};

export const DefaultOptions = {
  // 전체
  Total: [
    {
      key: 'T',
      value: 'T',
      label: '문자',
    },
    {
      key: 'N',
      value: 'N',
      label: '숫자',
    },
    {
      key: 'J',
      value: 'J',
      label: 'json',
    },
  ],
  // TOP
  Top: [
    {
      key: 'TOP',
      value: 'TOP',
      label: 'TOP',
    },
  ],
  // 선택
  Select: [
    {
      key: '',
      value: '',
      label: '선택',
    },
  ],
  // 선택, 사용, 미사용
  UseYn: [
    {
      key: '',
      value: '',
      label: '선택',
    },
    {
      key: 'Y',
      value: 'Y',
      label: '사용',
    },
    {
      key: 'N',
      value: 'N',
      label: '미사용',
    },
  ],
  // 사용, 미사용
  BaseUseYn: [
    {
      key: 'Y',
      value: 'Y',
      label: '사용',
    },
    {
      key: 'N',
      value: 'N',
      label: '미사용',
    },
  ],
  // 연결, 미연결
  RelationYn: [
    {
      key: 'Y',
      value: 'Y',
      label: '연결',
    },
    {
      key: 'N',
      value: 'N',
      label: '미연결',
    },
  ],
  // 지역번호
  TelRegionNo: telRegionNos.map((v) => ({
    key: v,
    value: v,
    label: v,
  })),
  BankRelationCnt: [
    {
      key: '0',
      value: '0',
      label: '미연결',
    },
    {
      key: '1',
      value: '1',
      label: '1개',
    },
    {
      key: '2',
      value: '2',
      label: '2개',
    },
    {
      key: '3',
      value: '3',
      label: '3개 이상',
    },
  ],
  DashboardRefreshInterval: [
    {
      key: 0,
      value: 0,
      label: '자동업데이트',
    },
  ],
  // 전국
  TotalRegion: [
    {
      key: '',
      value: '',
      label: '전국',
    },
  ],
  AttributeType: [
    {
      key: 1,
      value: 'N',
      label: '숫자',
    },
    {
      key: 2,
      value: 'T',
      label: '문자',
    },
    {
      key: 3,
      value: 'D',
      label: '날짜',
    },
    {
      key: 4,
      value: 'J',
      label: 'json',
    },
  ],
  AttributeCatalog: [
    {
      key: 1,
      value: 'S',
      label: '단일',
    },
    {
      key: 2,
      value: 'M',
      label: '다중',
    },
  ],
  DeleteYn: [
    {
      key: 1,
      value: 'N',
      label: '유지',
    },
    {
      key: 2,
      value: 'Y',
      label: '삭제',
    },
  ],
};
