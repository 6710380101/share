import React from 'react';
import { Filter, RotateCcw, Layers, GraduationCap, FileType, Check } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { MEDIA_TYPE_LABELS, MediaType } from '../types';

interface FilterSidebarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedLevel: string;
  onSelectLevel: (lvl: string) => void;
  selectedMediaType: string;
  onSelectMediaType: (type: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedLevel,
  onSelectLevel,
  selectedMediaType,
  onSelectMediaType,
  onResetFilters,
  hasActiveFilters,
}) => {
  const { settings } = useSettings();

  return (
    <aside className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2 text-slate-800 font-bold font-heading text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>ตัวกรองเนื้อหา</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ล้างตัวกรอง</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2.5">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>หมวดหมู่ความรู้</span>
        </div>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onSelectCategory('ทั้งหมด')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-left ${
              selectedCategory === 'ทั้งหมด'
                ? 'bg-blue-600 text-white font-medium shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>ทั้งหมดทุกหมวดหมู่</span>
            {selectedCategory === 'ทั้งหมด' && <Check className="w-3.5 h-3.5" />}
          </button>
          {settings.categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-left ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{cat}</span>
              {selectedCategory === cat && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Educational Level */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
          <span>ระดับการศึกษา</span>
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectLevel('ทั้งหมด')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-left ${
              selectedLevel === 'ทั้งหมด'
                ? 'bg-blue-600 text-white font-medium shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>ทุกระดับชั้น</span>
            {selectedLevel === 'ทั้งหมด' && <Check className="w-3.5 h-3.5" />}
          </button>
          {settings.educationLevels.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onSelectLevel(lvl)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-left ${
                selectedLevel === lvl
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{lvl}</span>
              {selectedLevel === lvl && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Media Types */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <FileType className="w-3.5 h-3.5 text-blue-600" />
          <span>ประเภทของสื่อ</span>
        </div>
        <div className="grid grid-cols-1 gap-1">
          <button
            type="button"
            onClick={() => onSelectMediaType('ทั้งหมด')}
            className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-left ${
              selectedMediaType === 'ทั้งหมด'
                ? 'bg-blue-600 text-white font-medium shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>ทุกประเภท</span>
            {selectedMediaType === 'ทั้งหมด' && <Check className="w-3.5 h-3.5" />}
          </button>
          {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((typeKey) => {
            const meta = MEDIA_TYPE_LABELS[typeKey];
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => onSelectMediaType(typeKey)}
                className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-left ${
                  selectedMediaType === typeKey
                    ? 'bg-blue-600 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{meta.label}</span>
                {selectedMediaType === typeKey && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
