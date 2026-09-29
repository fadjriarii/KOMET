/** Renders exactly one modal tab from a keyed content map. */
export default function ModalTabContent({ activeTab, content }) {
  return content?.[activeTab] || null;
}
