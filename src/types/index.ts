export type UserRole = 'guest' | 'member' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  photoURL?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MediaType = 'pdf' | 'video' | 'website' | 'presentation' | 'document' | 'other';

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  educationLevel: string;
  mediaType: MediaType;
  url: string;
  fileUrl?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  status: 'published' | 'hidden';
  viewsCount: number;
  favoritesCount: number;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  resourceId: string;
  createdAt: string;
}

export type ReportReason = 'broken_link' | 'copyright' | 'inappropriate' | 'misleading' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ReportItem {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ModerationLogItem {
  id: string;
  action: string;
  targetId: string;
  targetType: 'resource' | 'user' | 'report' | 'settings';
  performedBy: string;
  performedByEmail: string;
  details: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  siteLogo?: string;
  siteDescription: string;
  announcement: string;
  announcementActive: boolean;
  categories: string[];
  educationLevels: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_CATEGORIES = [
  'วิทยาศาสตร์',
  'คณิตศาสตร์',
  'คอมพิวเตอร์และเทคโนโลยี',
  'ภาษาไทย',
  'ภาษาอังกฤษและภาษาต่างประเทศ',
  'สังคมศึกษา ศาสนา และวัฒนธรรม',
  'ศิลปะและดนตรี',
  'สุขศึกษาและพลศึกษา',
  'การงานอาชีพและธุรกิจ',
  'เตรียมสอบและแนะแนวการศึกษา'
];

export const DEFAULT_EDUCATION_LEVELS = [
  'ประถมศึกษา (ป.1 - ป.6)',
  'มัธยมศึกษาตอนต้น (ม.1 - ม.3)',
  'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
  'อาชีวศึกษา (ปวช. / ปวส.)',
  'อุดมศึกษา / มหาวิทยาลัย',
  'ครูและอาจารย์',
  'ประชาชนทั่วไป'
];

export const MEDIA_TYPE_LABELS: Record<MediaType, { label: string; icon: string; color: string }> = {
  pdf: { label: 'เอกสาร PDF', icon: 'FileText', color: 'bg-red-50 text-red-600 border-red-200' },
  video: { label: 'วิดีโอการสอน', icon: 'Video', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  website: { label: 'เว็บไซต์ / ลิงก์ภายนอก', icon: 'Globe', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  presentation: { label: 'สไลด์นำเสนอ', icon: 'Presentation', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  document: { label: 'ใบงาน / ชีทสรุป', icon: 'FileCode', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  other: { label: 'สื่ออื่นๆ', icon: 'Folder', color: 'bg-slate-50 text-slate-600 border-slate-200' },
};
