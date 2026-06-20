import Postcode, { Address } from 'react-daum-postcode';
import ModalLayout from './ModalLayout';

interface Props {
  onClose: () => void;
  onComplete: (data: Address) => void;
}

export default function DaumPostCode({ onClose, onComplete }: Props) {
  return (
    <ModalLayout open={true} title={'주소찾기'} width={600} onClose={onClose} footer={null}>
      <Postcode onComplete={onComplete} onClose={onClose} style={{ height: 450 }} />
    </ModalLayout>
  );
}
