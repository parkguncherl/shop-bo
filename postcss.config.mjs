// Tailwind CSS v4 PostCSS 설정
// shadcn/ui 점진 도입을 위한 최소 구성. 기존 scss/less/antd 파이프라인에는 영향 없음.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
