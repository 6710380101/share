import React, { useState, useEffect, useMemo } from 'react';
import { 
  AuthProvider, 
  useAuth 
} from './contexts/AuthContext';
import { 
  SettingsProvider, 
  useSettings 
} from './contexts/SettingsContext';
import { 
  ToastProvider, 
  useToast 
} from './components/Toast';
import { Navbar } from './components/Navbar';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { SearchBar } from './components/SearchBar';
import { FilterSidebar } from './components/FilterSidebar';
import { Breadcrumb } from './components/Breadcrumb';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { PostResourceModal } from './components/PostResourceModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  fetchPublishedResources, 
  fetchUserFavoriteIds, 
  toggleFavorite, 
  deleteResource 
} from './services/resourceService';
import { ResourceItem } from './types';
import { testFirestoreConnection } from './firebase/config';
import { 
  BookOpen, 
  FolderSearch, 
  PlusCircle, 
  Bookmark, 
  Heart, 
  FileText, 
  AlertCircle, 
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, profile, isSuspended } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'home' | 'favorites' | 'my-resources' | 'admin'>('home');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedLevel, setSelectedLevel] = useState('ทั้งหมด');
  const [selectedMediaType, setSelectedMediaType] = useState('ทั้งหมด');

  // Resources state
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [reportingResource, setReportingResource] = useState<ResourceItem | null>(null);

  // Delete modal state
  const [resourceToDelete, setResourceToDelete] = useState<ResourceItem | null>(null);

  // Validate Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Load published resources
  const loadResources = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const items = await fetchPublishedResources({
        category: selectedCategory,
        educationLevel: selectedLevel,
        mediaType: selectedMediaType,
        searchTerm: searchTerm,
      });
      setResources(items);
    } catch (err: any) {
      console.error('Failed to load resources:', err);
      setErrorState('ไม่สามารถเชื่อมต่อฐานข้อมูล Cloud Firestore ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [selectedCategory, selectedLevel, selectedMediaType, searchTerm]);

  // Load user favorites
  useEffect(() => {
    if (user) {
      fetchUserFavoriteIds(user.uid)
        .then(ids => setUserFavorites(ids))
        .catch(err => console.warn('Could not load user favorites:', err));
    } else {
      setUserFavorites([]);
    }
  }, [user]);

  // Check URL param for shared resource (e.g. ?resId=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resId = urlParams.get('resId');
    if (resId && resources.length > 0) {
      const found = resources.find(r => r.id === resId);
      if (found) {
        setSelectedResource(found);
      }
    }
  }, [resources]);

  // Handle Favorite toggle
  const handleToggleFavorite = async (resourceId: string) => {
    if (!user) {
      setAuthMode('signin');
      setIsAuthOpen(true);
      showToast('กรุณาเข้าสู่ระบบเพื่อบันทึกรายการโปรด', 'info');
      return;
    }

    try {
      // Optimistic update
      const isCurrentlyFav = userFavorites.includes(resourceId);
      if (isCurrentlyFav) {
        setUserFavorites(prev => prev.filter(id => id !== resourceId));
        setResources(prev => prev.map(r => r.id === resourceId ? { ...r, favoritesCount: Math.max(0, (r.favoritesCount || 1) - 1) } : r));
        showToast('นำออกจากรายการโปรดแล้ว');
      } else {
        setUserFavorites(prev => [...prev, resourceId]);
        setResources(prev => prev.map(r => r.id === resourceId ? { ...r, favoritesCount: (r.favoritesCount || 0) + 1 } : r));
        showToast('บันทึกในรายการโปรดเรียบร้อยแล้ว');
      }

      await toggleFavorite(user.uid, resourceId);
    } catch (err) {
      showToast('ไม่สามารถบันทึกรายการโปรดได้', 'error');
    }
  };

  // Handle Resource Deletion
  const handleConfirmDelete = async () => {
    if (!resourceToDelete || !user) return;
    try {
      await deleteResource(resourceToDelete.id);
      setResources(prev => prev.filter(r => r.id !== resourceToDelete.id));
      if (selectedResource?.id === resourceToDelete.id) {
        setSelectedResource(null);
      }
      setResourceToDelete(null);
      showToast('ลบสื่อการเรียนรู้สำเร็จ');
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการลบสื่อ', 'error');
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('ทั้งหมด');
    setSelectedLevel('ทั้งหมด');
    setSelectedMediaType('ทั้งหมด');
    setSearchTerm('');
  };

  const hasActiveFilters = 
    selectedCategory !== 'ทั้งหมด' ||
    selectedLevel !== 'ทั้งหมด' ||
    selectedMediaType !== 'ทั้งหมด' ||
    searchTerm.trim() !== '';

  // Filtered views for Favorites and My Resources
  const displayedResources = useMemo(() => {
    if (currentTab === 'favorites') {
      return resources.filter(r => userFavorites.includes(r.id));
    }
    if (currentTab === 'my-resources') {
      return resources.filter(r => user && r.authorId === user.uid);
    }
    return resources;
  }, [resources, currentTab, userFavorites, user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-200 selection:text-blue-900">
      {/* Site Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'signin');
          setIsAuthOpen(true);
        }}
        onOpenPostModal={() => {
          setEditingResource(null);
          setIsPostModalOpen(true);
        }}
      />

      {/* Dynamic Announcement Banner */}
      <AnnouncementBanner />

      {/* Main Body */}
      <main className="flex-1 pb-16">
        {currentTab === 'home' && (
          <>
            {/* Hero Search Section */}
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              totalResults={displayedResources.length}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Breadcrumb Navigation */}
              <Breadcrumb
                items={[
                  { label: 'หน้าหลัก', onClick: () => handleResetFilters() },
                  { label: selectedCategory !== 'ทั้งหมด' ? selectedCategory : 'สื่อทั้งหมด', active: true },
                ]}
              />

              {/* Grid Layout: Sidebar & Content Area */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Filter Sidebar */}
                <div className="lg:col-span-1">
                  <FilterSidebar
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    selectedLevel={selectedLevel}
                    onSelectLevel={setSelectedLevel}
                    selectedMediaType={selectedMediaType}
                    onSelectMediaType={setSelectedMediaType}
                    onResetFilters={handleResetFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                </div>

                {/* Right Resources Cards Grid */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Results Header Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 font-heading">
                        {selectedCategory !== 'ทั้งหมด' ? selectedCategory : 'คลังสื่อการเรียนรู้'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        พบทั้งหมด <strong className="text-blue-600 font-semibold">{displayedResources.length}</strong> รายการ
                        {hasActiveFilters && ' (กรองตามเงื่อนไข)'}
                      </p>
                    </div>

                    <button
                      onClick={loadResources}
                      className="text-xs text-slate-500 hover:text-blue-600 flex items-center space-x-1 transition self-start sm:self-auto"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span>รีเฟรช</span>
                    </button>
                  </div>

                  {/* Error State */}
                  {errorState && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center space-x-3 text-xs">
                      <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                      <div className="flex-1">
                        <p className="font-semibold">{errorState}</p>
                        <p className="mt-0.5 text-rose-600">กรุณาตรวจสอบการตั้งค่า Firebase Console และสิทธิ์การเข้าถึง</p>
                      </div>
                      <button
                        onClick={loadResources}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-xl font-medium shrink-0 cursor-pointer"
                      >
                        ลองใหม่
                      </button>
                    </div>
                  )}

                  {/* Loading State */}
                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div
                          key={n}
                          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse space-y-4"
                        >
                          <div className="flex justify-between">
                            <div className="h-5 w-24 bg-slate-200 rounded-md"></div>
                            <div className="h-5 w-16 bg-slate-200 rounded-md"></div>
                          </div>
                          <div className="h-6 w-3/4 bg-slate-200 rounded-md"></div>
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-slate-200 rounded-md"></div>
                            <div className="h-3 w-5/6 bg-slate-200 rounded-md"></div>
                          </div>
                          <div className="h-8 w-full bg-slate-100 rounded-xl mt-4"></div>
                        </div>
                      ))}
                    </div>
                  ) : displayedResources.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                        <FolderSearch className="w-8 h-8 opacity-70" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800 font-heading">
                        ไม่พบสื่อการเรียนรู้ที่ตรงกับเงื่อนไข
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                        ลองปรับคำค้นหา หรือเปลี่ยนหมวดหมู่และระดับชั้น หรือเป็นคนแรกที่ร่วมแบ่งปันสื่อในหัวข้อนี้!
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {hasActiveFilters && (
                          <button
                            onClick={handleResetFilters}
                            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
                          >
                            ล้างตัวกรองทั้งหมด
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!user) {
                              setAuthMode('signin');
                              setIsAuthOpen(true);
                              return;
                            }
                            setEditingResource(null);
                            setIsPostModalOpen(true);
                          }}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center space-x-1.5 font-heading cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>แบ่งปันสื่อใหม่ทันที</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Cards Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {displayedResources.map((res) => (
                        <ResourceCard
                          key={res.id}
                          resource={res}
                          isFavorited={userFavorites.includes(res.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onOpenDetails={(r) => setSelectedResource(r)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB: FAVORITES */}
        {currentTab === 'favorites' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <Breadcrumb
              items={[
                { label: 'หน้าหลัก', onClick: () => setCurrentTab('home') },
                { label: 'รายการโปรดที่บันทึกไว้', active: true },
              ]}
            />

            <div className="mb-6">
              <div className="flex items-center space-x-2 text-rose-500 mb-1">
                <Bookmark className="w-5 h-5 fill-rose-500" />
                <h1 className="text-2xl font-bold font-heading text-slate-800">
                  รายการโปรดของฉัน ({displayedResources.length})
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                สื่อการเรียนรู้ที่คุณบันทึกไว้ ซิงค์ผ่านบัญชีผู้ใช้ สามารถเปิดอ่านได้ทุกอุปกรณ์
              </p>
            </div>

            {displayedResources.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 font-heading">
                  ยังไม่มีสื่อในรายการโปรด
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  คุณสามารถกดปุ่มรูปหัวใจบนการ์ดสื่อการเรียนรู้ใดก็ได้เพื่อบันทึกไว้ดูภายหลัง
                </p>
                <button
                  onClick={() => setCurrentTab('home')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  สำรวจคลังความรู้
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedResources.map((res) => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    isFavorited={true}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetails={(r) => setSelectedResource(r)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: MY RESOURCES */}
        {currentTab === 'my-resources' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <Breadcrumb
              items={[
                { label: 'หน้าหลัก', onClick: () => setCurrentTab('home') },
                { label: 'สื่อที่ฉันแบ่งปัน', active: true },
              ]}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <FileText className="w-5 h-5" />
                  <h1 className="text-2xl font-bold font-heading text-slate-800">
                    สื่อที่ฉันแบ่งปัน ({displayedResources.length})
                  </h1>
                </div>
                <p className="text-xs text-slate-500">
                  จัดการ แก้ไข หรือลบสื่อการเรียนรู้ที่คุณสร้างขึ้น
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingResource(null);
                  setIsPostModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition self-start sm:self-auto cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>โพสต์สื่อใหม่</span>
              </button>
            </div>

            {displayedResources.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 font-heading">
                  คุณยังไม่ได้แบ่งปันสื่อการเรียนรู้
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  มาร่วมเป็นส่วนหนึ่งของการศึกษาไทยด้วยการแบ่งปันสไลด์ ใบงาน หรือคลิปวิดีโอที่มีประโยชน์
                </p>
                <button
                  onClick={() => {
                    setEditingResource(null);
                    setIsPostModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition font-heading"
                >
                  เริ่มแบ่งปันสื่อแรกของคุณ
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedResources.map((res) => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    isFavorited={userFavorites.includes(res.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetails={(r) => setSelectedResource(r)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ADMIN DASHBOARD */}
        {currentTab === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <Breadcrumb
              items={[
                { label: 'หน้าหลัก', onClick: () => setCurrentTab('home') },
                { label: 'แผงควบคุมผู้ดูแลระบบ', active: true },
              ]}
            />
            <AdminDashboard />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">{settings.siteName}</span>
            <span className="text-slate-300">|</span>
            <span>แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษาไทย</span>
          </div>

          <p className="text-slate-400">
            ระบบเชื่อมต่อ Cloud Firestore & Firebase Auth ปลอดภัยตามมาตรฐานความปลอดภัย
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      <PostResourceModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setEditingResource(null);
        }}
        resourceToEdit={editingResource}
        onSuccess={() => {
          loadResources();
        }}
      />

      <ResourceDetailModal
        resource={selectedResource}
        isOpen={Boolean(selectedResource)}
        onClose={() => setSelectedResource(null)}
        isFavorited={selectedResource ? userFavorites.includes(selectedResource.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onOpenReport={(r) => setReportingResource(r)}
        onOpenEdit={(r) => {
          setSelectedResource(null);
          setEditingResource(r);
          setIsPostModalOpen(true);
        }}
        onDeleteResource={(r) => {
          setResourceToDelete(r);
        }}
      />

      <ReportModal
        resource={reportingResource}
        isOpen={Boolean(reportingResource)}
        onClose={() => setReportingResource(null)}
      />

      {/* Delete Confirmation Modal for Author */}
      {resourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold font-heading text-base">ยืนยันการลบสื่อ</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>"{resourceToDelete.title}"</strong> ออกจากระบบ? สื่อนี้จะไม่สามารถกู้คืนได้
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setResourceToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs"
              >
                ลบสื่อนี้ทันที
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <MainAppContent />
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
