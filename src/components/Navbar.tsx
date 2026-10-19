import React, { useState } from 'react';
import { 
  BookOpen, 
  PlusCircle, 
  Bookmark, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  FolderPlus,
  Send,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from './Toast';

interface NavbarProps {
  currentTab: 'home' | 'favorites' | 'my-resources' | 'admin';
  onSelectTab: (tab: 'home' | 'favorites' | 'my-resources' | 'admin') => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenPostModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenPostModal
}) => {
  const { user, profile, isAdmin, isModerator, isSuspended, signOut, resendVerificationEmail } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const handleResendVerification = async () => {
    try {
      setResendingVerification(true);
      await resendVerificationEmail();
      showToast('ส่งอีเมลยืนยันตัวตนเรียบร้อยแล้ว');
    } catch (err: any) {
      showToast(err.message || 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('ออกจากระบบเรียบร้อยแล้ว');
      setUserDropdownOpen(false);
      onSelectTab('home');
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return <span className="text-[11px] px-2 py-0.5 font-semibold bg-rose-100 text-rose-700 rounded-full border border-rose-200">ผู้ดูแลระบบ (Admin)</span>;
    }
    if (isModerator) {
      return <span className="text-[11px] px-2 py-0.5 font-semibold bg-amber-100 text-amber-700 rounded-full border border-amber-200">ผู้ตรวจสอบเนื้อหา</span>;
    }
    return <span className="text-[11px] px-2 py-0.5 font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200">สมาชิก (Member)</span>;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Email verification reminder strip if logged in but not verified */}
      {user && !user.emailVerified && (
        <div className="bg-amber-500 text-white text-xs px-4 py-1.5 flex items-center justify-between font-medium">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>อีเมลของคุณยังไม่ได้ยืนยันตัวตน กรุณาตรวจสอบกล่องจดหมาย ({user.email})</span>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={resendingVerification}
            className="underline hover:text-amber-100 ml-2 text-xs font-semibold shrink-0 cursor-pointer"
          >
            {resendingVerification ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันอีกครั้ง'}
          </button>
        </div>
      )}

      {/* Account Suspended Banner */}
      {isSuspended && (
        <div className="bg-rose-600 text-white text-xs px-4 py-1.5 flex items-center justify-center font-medium">
          <AlertTriangle className="w-3.5 h-3.5 mr-2 shrink-0" />
          <span>บัญชีของคุณถูกระงับการใช้งานชั่วคราว จึงไม่สามารถโพสต์สื่อหรือแก้ไขข้อมูลได้</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold font-heading text-slate-800 tracking-tight block leading-tight">
                {settings.siteName || 'คลังปัญญา'}
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                แหล่งรวบรวมสื่อการเรียนรู้
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'home'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              คลังความรู้
            </button>

            {user && (
              <>
                <button
                  onClick={() => onSelectTab('favorites')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    currentTab === 'favorites'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>รายการโปรด</span>
                </button>

                <button
                  onClick={() => onSelectTab('my-resources')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    currentTab === 'my-resources'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>สื่อที่ฉันแบ่งปัน</span>
                </button>
              </>
            )}

            {isModerator && (
              <button
                onClick={() => onSelectTab('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentTab === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>แผงควบคุมผู้ดูแล</span>
              </button>
            )}
          </nav>

          {/* Action Buttons & User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Post Resource Button */}
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth('signin');
                  showToast('กรุณาเข้าสู่ระบบก่อนโพสต์สื่อความรู้', 'info');
                  return;
                }
                if (isSuspended) {
                  showToast('บัญชีของคุณถูกระงับ จึงไม่สามารถสร้างโพสต์ได้', 'error');
                  return;
                }
                onOpenPostModal();
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white text-sm font-medium rounded-xl shadow-xs hover:shadow-md transition cursor-pointer font-heading"
            >
              <PlusCircle className="w-4 h-4" />
              <span>แบ่งปันสื่อใหม่</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition"
                >
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={profile.displayName}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {profile?.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left hidden lg:block">
                    <span className="text-xs font-semibold text-slate-800 block leading-tight max-w-[120px] truncate">
                      {profile?.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isAdmin ? 'แอดมิน' : isModerator ? 'ผู้ตรวจสอบ' : 'สมาชิก'}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {profile?.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate mb-2">
                        {user.email}
                      </p>
                      <div>{getRoleBadge()}</div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          onSelectTab('my-resources');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>สื่อที่ฉันแบ่งปัน</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectTab('favorites');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                      >
                        <Bookmark className="w-4 h-4 text-amber-500" />
                        <span>รายการโปรดที่บันทึกไว้</span>
                      </button>

                      {isModerator && (
                        <button
                          onClick={() => {
                            onSelectTab('admin');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 font-medium flex items-center space-x-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>แผงควบคุมระบบ (Admin)</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 transition"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-1.5 text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-xl transition"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth('signin');
                  return;
                }
                onOpenPostModal();
              }}
              className="p-2 bg-blue-600 text-white rounded-lg text-xs"
              title="โพสต์สื่อใหม่"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            <button
              onClick={() => { onSelectTab('home'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                currentTab === 'home' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              คลังความรู้
            </button>
            {user && (
              <>
                <button
                  onClick={() => { onSelectTab('favorites'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                    currentTab === 'favorites' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>รายการโปรด</span>
                </button>
                <button
                  onClick={() => { onSelectTab('my-resources'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                    currentTab === 'my-resources' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>สื่อที่ฉันแบ่งปัน</span>
                </button>
              </>
            )}
            {isModerator && (
              <button
                onClick={() => { onSelectTab('admin'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                  currentTab === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>แผงควบคุมระบบ (Admin)</span>
              </button>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 px-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    {profile?.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{profile?.displayName}</div>
                    <div className="text-[10px] text-slate-500">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  className="w-full mt-2 py-2 px-3 text-left text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { onOpenAuth('signin'); setMobileMenuOpen(false); }}
                  className="w-full py-2 text-center text-sm font-medium border border-slate-200 rounded-xl"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => { onOpenAuth('signup'); setMobileMenuOpen(false); }}
                  className="w-full py-2 text-center text-sm font-medium bg-blue-600 text-white rounded-xl"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
