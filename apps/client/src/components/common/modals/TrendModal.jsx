import Modal from './Modal';
import ModalTabNav from './ModalTabNav';
import ModalTabContent from './ModalTabContent';

/**
 * TrendModal — kerangka yang dipakai semua modal rincian tren (chart + tabel
 * riwayat): bungkus Modal, banner ringkasan, dan navigasi tab. Isi tiap tab
 * (chart, table, plus `extraContent` untuk tab tambahan) dan banner disuplai
 * pemanggil; kerangka tidak tahu domain.
 */
export default function TrendModal({
  isOpen,
  onClose,
  originRect,
  title,
  subtitle,
  banner,
  tabs,
  activeTab,
  onTabChange,
  slideClass,
  chart,
  table,
  extraContent,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton={true}
    >
      <div className="flex flex-col h-full space-y-4">
        {banner}
        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
          <div className="flex-1 min-h-0 overflow-x-hidden w-full">
            <div key={activeTab} className={`h-full ${slideClass}`}>
              <ModalTabContent activeTab={activeTab} content={{ chart, table, ...extraContent }} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
