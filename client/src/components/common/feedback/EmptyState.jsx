import { Inbox } from 'lucide-react';

/**
 * EmptyState - Feedback saat data kosong / tidak ditemukan
 */
export default function EmptyState({
  title = "Tidak ada data",
  description = "Belum ada informasi yang tersedia untuk ditampilkan saat ini.",
  icon: Icon = Inbox,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center text-gray-500 gap-3 ${className}`}>
      <div className="p-3 bg-gray-100 rounded-2xl text-gray-400">
        <Icon size={28} />
      </div>
      <div className="max-w-xs">
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
      </div>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
