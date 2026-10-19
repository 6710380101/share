import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { ResourceItem, ReportReason } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { submitReport } from '../services/resourceService';
import { useToast } from './Toast';

interface ReportModalProps {
  resource: ResourceItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'broken_link', label: 'ลิงก์เสีย / ไฟล์ถูกลบ / ไม่สามารถเข้าถึงได้' },
  { key: 'copyright', label: 'ละเมิดลิขสิทธิ์ / นำผลงานผู้อื่นมาเผยแพร่โดยไม่ได้รับอนุญาต' },
  { key: 'inappropriate', label: 'เนื้อหาไม่เหมาะสม / รุนแรง / ลามกอนาจาร' },
  { key: 'misleading', label: 'ข้อมูลบิดเบือน / เป็นเท็จ / โฆษณาหรือสแปม' },
  { key: 'other', label: 'เหตุผลอื่นๆ' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  resource,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reason, setReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบก่อนส่งรายงาน', 'error');
      return;
    }

    try {
      setLoading(true);
      await submitReport({
        resourceId: resource.id,
        resourceTitle: resource.title,
        reporterId: user.uid,
        reporterEmail: user.email || '',
        reason,
        details: details.trim(),
      });
      showToast('ส่งรายงานเนื้อหาไปยังผู้ดูแลระบบเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลชุมชน');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'ส่งรายงานไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-200" />
            <h3 className="text-lg font-bold font-heading">รายงานเนื้อหาที่ไม่เหมาะสม</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <span className="text-xs text-slate-500">สื่อที่ต้องการรายงาน:</span>
            <p className="text-sm font-bold text-slate-800 line-clamp-2 mt-0.5">
              {resource.title}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              สาเหตุที่รายงาน *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ระบุจุดที่พบปัญหา เช่น หน้าที่เสีย หรือลิงก์ที่ถูกลบ..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              maxLength={1000}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl transition flex items-center space-x-1.5 shadow-sm font-heading cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งรายงาน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
