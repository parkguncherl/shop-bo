// types/konva-fix.d.ts
import 'react-konva';

/** Stage 에 child 속성 부재한 관계로 다음과 같이 확장 */
declare module 'react-konva' {
  interface StageProps {
    children?: React.ReactNode;
  }
}
