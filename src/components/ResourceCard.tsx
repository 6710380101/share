import React from 'react';
import { 
  FileText, 
  Video, 
  Globe, 
  Presentation, 
  FileCode, 
  Folder, 
  Eye, 
  Heart, 
  Share2, 
  Calendar, 
  User as UserIcon,
  ExternalLink
} from 'lucide-react';
import { ResourceItem, MEDIA_TYPE_LABELS, MediaType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface ResourceCardProps {
  resource: ResourceItem;
  isFavorited: boolean;
  onToggleFavorite: (resourceId: string) => void;
  onOpenDetails: (resource: ResourceItem) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorited,
  onToggleFavorite,
  onOpenDetails,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 mr-1" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 mr-1" />;
      case 'website':
        return <Globe className="w-3.5 h-3.5 mr-1" />;
      case 'presentation':
        return <Presentation className="w-3.5 h-3.5 mr-1" />;
      case 'document':
        return <FileCode className="w-3.5 h-3.5 mr-1" />;
      default:
        return <Folder className="w-3.5 h-3.5 mr-1" />;
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      }).format(date);
    } catch {
      return '';
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/?resId=${resource.id}`);
      showToast('คัดลอกลิงก์สื่อการเรียนรู้ไปยังคลิปบอร์ดแล้ว');
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบเพื่อบันทึกรายการโปรด', 'info');
      return;
    }
    onToggleFavorite(resource.id);
  };

  const mediaMeta = MEDIA_TYPE_LABELS[resource.mediaType] || MEDIA_TYPE_LABELS.other;

  return (
    <div
      onClick={() => onOpenDetails(resource)}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
    >
      {/* Top Media & Level Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${mediaMeta.color}`}
          >
            {getMediaIcon(resource.mediaType)}
            <span>{mediaMeta.label}</span>
          </span>

          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg truncate max-w-[140px]">
            {resource.educationLevel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition font-heading line-clamp-2 mb-2 leading-snug">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {resource.description}
        </p>

        {/* Category & Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
            #{resource.category}
          </span>
          {resource.tags?.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1.5 truncate max-w-[130px]">
          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
            {resource.authorName?.charAt(0) || <UserIcon className="w-3 h-3" />}
          </div>
          <span className="truncate text-slate-700 font-medium">{resource.authorName}</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="flex items-center space-x-1 text-slate-400 text-[11px]" title="จำนวนผู้เข้าชม">
            <Eye className="w-3.5 h-3.5" />
            <span>{resource.viewsCount || 0}</span>
          </span>

          <button
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorited
                ? 'text-rose-500 bg-rose-50'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'
            }`}
            title={isFavorited ? 'ยกเลิกรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="แชร์ลิงก์นี้"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
