import { lazy, Suspense, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Button from '../../../components/common/ui/Button';
import HeaderAcademicYearFilter from '../../../components/common/filters/HeaderAcademicYearFilter';
import { getModalOriginRectFromEvent } from '../../../utils/uiHelpers';

const MbkmDataQualityModal = lazy(() => import('./modals/MbkmDataQualityModal'));

/** Pemilih tahun ajaran header + tombol panel Kualitas Data. */
export default function MbkmHeaderExtra(props) {
  const [originRect, setOriginRect] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  // Tetap ter-mount setelah dibuka pertama kali supaya animasi tutup terlihat.
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <>
      <HeaderAcademicYearFilter {...props} />
      <Button
        variant="outline"
        size="sm"
        icon={ShieldCheck}
        onClick={(event) => {
          setOriginRect(getModalOriginRectFromEvent(event));
          setIsOpen(true);
          setHasOpened(true);
        }}
      >
        Kualitas Data
      </Button>
      {hasOpened && (
        <Suspense fallback={null}>
          <MbkmDataQualityModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            originRect={originRect}
          />
        </Suspense>
      )}
    </>
  );
}
