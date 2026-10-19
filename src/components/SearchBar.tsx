import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  totalResults: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  totalResults
}) => {
  const { settings } = useSettings();
  const popularCategories = settings.categories.slice(0, 5);

  return (
    <div className="relative bg-gradient-to-b from-blue-900 via-blue-800 to-sky-900 text-white pt-10 pb-14 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-lg mb-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-3xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-sky-200 border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-sky-300" />
          <span>ศูนย์รวมสื่อการสอนและแหล่งเรียนรู้ฟรีสำหรับทุกคน</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
          ค้นหาและแบ่งปันความรู้ที่คุณต้องการ
        </h1>

        <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto font-normal">
          เข้าถึงสื่อการเรียนรู้คุณภาพ ใบงาน สไลด์ วิดีโอ และคู่มือการสอน จากนักเรียน นักศึกษา และครูทั่วประเทศ
        </p>

        {/* Big Search Input */}
        <div className="pt-2">
          <div className="relative flex items-center max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-1.5 focus-within:ring-4 focus-within:ring-sky-400/40 transition">
            <Search className="w-5 h-5 ml-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อเรื่อง, คำอธิบาย, หมวดหมู่ หรือแท็ก เช่น แคลคูลัส, Python..."
              className="w-full px-3 py-2.5 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 mr-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              className="hidden sm:inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition shadow-xs font-heading shrink-0"
            >
              ค้นหา
            </button>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-blue-200 mr-1">หมวดยอดนิยม:</span>
          {popularCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(selectedCategory === cat ? 'ทั้งหมด' : cat)}
              className={`px-3 py-1 rounded-full border transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-blue-900 border-white font-semibold shadow-xs'
                  : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
