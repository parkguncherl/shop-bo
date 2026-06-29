// rc-select is not directly installed; re-export BaseSelectRef from @rc-component/select
// which is installed as an antd dependency
declare module 'rc-select' {
  export { BaseSelectRef } from '@rc-component/select';
  export * from '@rc-component/select';
}
