import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Link as LinkIcon, FileText, AlertCircle, Check } from 'lucide-react';
import { ResourceItem, MediaType, MEDIA_TYPE_LABELS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { createResource, updateResource } from '../services/resourceService';
import { useToast } from './Toast';

interface PostResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceToEdit?: ResourceItem | null;
  onSuccess: (resourceId: string) => void;
}

export const PostResourceModal: React.FC<PostResourceModalProps> = ({
  isOpen,
  onClose,
  resourceToEdit,
  onSuccess,
}) => {
  const { user, profile, isModerator } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('pdf');
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (resourceToEdit) {
      setTitle(resourceToEdit.title);
      setDescription(resourceToEdit.description);
      setCategory(resourceToEdit.category);
      setEducationLevel(resourceToEdit.educationLevel);
      setMediaType(resourceToEdit.mediaType);
      setUrl(resourceToEdit.url);
      setTagsInput(resourceToEdit.tags?.join(', ') || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory(settings.categories[0] || 'คอมพิวเตอร์และเทคโนโลยี');
      setEducationLevel(settings.educationLevels[0] || 'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)');
      setMediaType('pdf');
      setUrl('');
      setTagsInput('');
    }
    setErrorMsg('');
  }, [isOpen, resourceToEdit, settings]);

  if (!isOpen) return null;

  const validateUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user || !profile) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนทำการแบ่งปันสื่อ');
      return;
    }

    if (profile.status === 'suspended') {
      setErrorMsg('บัญชีของคุณถูกระงับ ไม่สามารถโพสต์สื่อได้');
      return;
    }

    if (title.trim().length < 3) {
      setErrorMsg('ชื่อเรื่องต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (description.trim().length < 5) {
      setErrorMsg('คำอธิบายต้องมีความยาวอย่างน้อย 5 ตัวอักษร');
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl || !validateUrl(trimmedUrl)) {
      setErrorMsg('กรุณากรอก URL ลิงก์ที่ถูกต้อง (เช่น https://drive.google.com/... หรือ https://...)');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 8);

    try {
      setSubmitting(true);

      if (resourceToEdit) {
        // Edit flow
        await updateResource(
          resourceToEdit.id,
          {
            title: title.trim(),
            description: description.trim(),
            category,
            educationLevel,
            mediaType,
            url: trimmedUrl,
            tags: parsedTags,
          },
          isModerator && resourceToEdit.authorId !== user.uid
            ? { performedBy: user.uid, email: user.email || '', reason: 'Edited by moderator' }
            : undefined
        );
        showToast('แก้ไขข้อมูลสื่อการเรียนรู้สำเร็จ');
        onSuccess(resourceToEdit.id);
        onClose();
      } else {
        // Create flow
        const newId = await createResource({
          title: title.trim(),
          description: description.trim(),
          category,
          educationLevel,
          mediaType,
          url: trimmedUrl,
          authorId: user.uid,
          authorName: profile.displayName || user.email?.split('@')[0] || 'สมาชิก',
          authorEmail: user.email || '',
          status: 'published',
          tags: parsedTags,
        });
        showToast('เผยแพร่สื่อการเรียนรู้สำเร็จแล้ว ขอบคุณที่ร่วมแบ่งปัน');
        onSuccess(newId);
        onClose();
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg(err.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-sky-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-heading">
              {resourceToEdit ? 'แก้ไขสื่อการเรียนรู้' : 'แบ่งปันสื่อการเรียนรู้ใหม่'}
            </h3>
            <p className="text-xs text-blue-100 mt-1">
              ร่วมสร้างสรรค์คลังความรู้เพื่อนักเรียน นักศึกษา และครูอาจารย์ไทย
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start p-3.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อเรื่อง / หัวข้อสื่อการเรียนรู้ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรคณิตศาสตร์ ม.ปลาย หรือ คู่มือการเขียนโค้ด Python เบื้องต้น"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              คำอธิบายเนื้อหาและจุดเด่น *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุเนื้อหาโดยสังเขป เหมาะกับใคร วิธีนำไปใช้ หรือสารบัญเนื้อหา..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              maxLength={3000}
            />
          </div>

          {/* Category & Level Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมวดหมู่วิชา / หัวข้อ *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              >
                {settings.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ระดับการศึกษาเป้าหมาย *
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              >
                {settings.educationLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Media Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              ประเภทของสื่อการเรียนรู้ *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((typeKey) => {
                const meta = MEDIA_TYPE_LABELS[typeKey];
                const isSelected = mediaType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setMediaType(typeKey)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{meta.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* URL / Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ลิงก์สื่อ (Google Drive, YouTube, Canva, หรือเว็บไซต์) *
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              แนบลิงก์ที่เปิดสิทธิ์สาธารณะ เช่น Google Drive, Canva, OneDrive, หรือ YouTube เพื่อให้ผู้อื่นเข้าถึงได้
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              แท็กคำค้นหา (คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="เช่น ข้อสอบ, สรุป, O-NET, ม.6, โปรแกรมมิ่ง"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-sm transition"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-md hover:shadow-lg disabled:opacity-60 flex items-center space-x-2 font-heading cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{resourceToEdit ? 'บันทึกการแก้ไข' : 'เผยแพร่สู่คลังปัญญา'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
