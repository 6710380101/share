import React, { useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Heart, 
  Share2, 
  AlertTriangle, 
  Eye, 
  Calendar, 
  User as UserIcon, 
  FileText, 
  Video, 
  Globe, 
  Tag, 
  Edit3, 
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { ResourceItem, MEDIA_TYPE_LABELS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { incrementResourceView } from '../services/resourceService';
import { useToast } from './Toast';

interface ResourceDetailModalProps {
  resource: ResourceItem | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenReport: (resource: ResourceItem) => void;
  onOpenEdit: (resource: ResourceItem) => void;
  onDeleteResource: (resource: ResourceItem) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  isFavorited,
  onToggleFavorite,
  onOpenReport,
  onOpenEdit,
  onDeleteResource,
}) => {
  const { user, isModerator } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && resource) {
      incrementResourceView(resource.id);
    }
  }, [isOpen, resource?.id]);

  if (!isOpen || !resource) return null;

  const isAuthor = user && user.uid === resource.authorId;
  const canManage = isAuthor || isModerator;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'long',
      }).format(date);
    } catch {
      return '';
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/?resId=${resource.id}`);
      showToast('คัดลอกลิงก์สื่อการเรียนรู้ไปยังคลิปบอร์ดแล้ว');
    }
  };

  const getYoutubeEmbed = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = resource.mediaType === 'video' ? getYoutubeEmbed(resource.url) : null;
  const mediaMeta = MEDIA_TYPE_LABELS[resource.mediaType] || MEDIA_TYPE_LABELS.other;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border ${mediaMeta.color}`}>
              {mediaMeta.label}
            </span>
            <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
              {resource.educationLevel}
            </span>
            {resource.status === 'hidden' && (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                ถูกซ่อนโดยผู้ดูแล
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading leading-snug">
            {resource.title}
          </h2>

          {/* Author and Date Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                {resource.authorName?.charAt(0) || <UserIcon className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-semibold text-slate-800 block">{resource.authorName}</span>
                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 mr-0.5" />
                  <span>เผยแพร่เมื่อ {formatDate(resource.createdAt)}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-slate-500">
                <Eye className="w-4 h-4 text-slate-400" />
                <span>เข้าชม {resource.viewsCount || 0} ครั้ง</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-500">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>บันทึก {resource.favoritesCount || 0} คน</span>
              </span>
            </div>
          </div>

          {/* Video Preview if YouTube */}
          {youtubeId && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-inner bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={resource.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              รายละเอียดเนื้อหา
            </h4>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              {resource.description}
            </div>
          </div>

          {/* Category & Tags */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              หมวดหมู่และคำสำคัญ
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-xl">
                {resource.category}
              </span>
              {resource.tags?.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl"
                >
                  <Tag className="w-3 h-3 mr-1 text-slate-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Direct link card */}
          {resource.url && (
            <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="overflow-hidden">
                <span className="text-xs font-semibold text-blue-900 block mb-0.5">
                  ลิงก์ไฟล์หรือเว็บไซต์ต้นทาง
                </span>
                <span className="text-xs text-blue-600 truncate block max-w-md">
                  {resource.url}
                </span>
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition shadow-sm hover:shadow-md shrink-0 font-heading"
              >
                <span>เปิดดูสื่อการเรียนรู้</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleFavorite(resource.id)}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                isFavorited
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
              <span>{isFavorited ? 'บันทึกแล้ว' : 'บันทึกรายการโปรด'}</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">แชร์</span>
            </button>

            {user && (
              <button
                onClick={() => onOpenReport(resource)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white text-slate-600 border border-slate-200 hover:text-amber-600 hover:bg-amber-50 rounded-xl text-xs font-medium transition"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>รายงานเนื้อหา</span>
              </button>
            )}
          </div>

          {canManage && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenEdit(resource)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-xl text-xs font-semibold transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>แก้ไขสื่อ</span>
              </button>
              <button
                onClick={() => onDeleteResource(resource)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-semibold transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบ</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
