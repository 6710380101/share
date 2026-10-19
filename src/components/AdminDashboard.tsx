import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Users, 
  Settings, 
  Clock, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Plus, 
  RefreshCw, 
  Search,
  ExternalLink,
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { 
  fetchReports, 
  updateReportStatus, 
  fetchAllResourcesForAdmin, 
  updateResource, 
  deleteResource,
  fetchAllUsers,
  updateUserRoleOrStatus,
  fetchModerationLogs
} from '../services/resourceService';
import { ResourceItem, ReportItem, ModerationLogItem, UserProfile } from '../types';
import { useToast } from './Toast';

export const AdminDashboard: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'reports' | 'resources' | 'users' | 'settings' | 'logs'>('reports');
  const [loading, setLoading] = useState(false);

  // Data states
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ModerationLogItem[]>([]);

  // Filter & Search states
  const [resourceSearch, setResourceSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Settings form states
  const [siteName, setSiteName] = useState(settings.siteName);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [announcementActive, setAnnouncementActive] = useState(settings.announcementActive);
  const [categories, setCategories] = useState<string[]>(settings.categories);
  const [newCatInput, setNewCatInput] = useState('');

  // Delete confirmation modal state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; title: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        const reps = await fetchReports();
        setReports(reps);
      } else if (activeTab === 'resources') {
        const res = await fetchAllResourcesForAdmin();
        setResources(res);
      } else if (activeTab === 'users') {
        const usrs = await fetchAllUsers();
        setUsersList(usrs);
      } else if (activeTab === 'logs') {
        const lgs = await fetchModerationLogs();
        setLogs(lgs);
      }
    } catch (err: any) {
      showToast('โหลดข้อมูลไม่สำเร็จ: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    setSiteName(settings.siteName);
    setSiteDescription(settings.siteDescription);
    setAnnouncement(settings.announcement);
    setAnnouncementActive(settings.announcementActive);
    setCategories(settings.categories);
  }, [settings]);

  // Handle report resolution
  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    if (!user) return;
    try {
      await updateReportStatus(reportId, status, user.uid);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      showToast(status === 'resolved' ? 'ทำเครื่องหมายว่าตรวจสอบแล้ว' : 'ปฏิเสธรายงานแล้ว');
    } catch (err: any) {
      showToast('ไม่สามารถอัปเดตรายงานได้', 'error');
    }
  };

  // Toggle resource status (published <-> hidden)
  const handleToggleResourceStatus = async (item: ResourceItem) => {
    if (!user) return;
    const newStatus = item.status === 'published' ? 'hidden' : 'published';
    try {
      await updateResource(
        item.id,
        { status: newStatus },
        { performedBy: user.uid, email: user.email || '', reason: `Set status to ${newStatus}` }
      );
      setResources(prev => prev.map(r => r.id === item.id ? { ...r, status: newStatus } : r));
      showToast(newStatus === 'hidden' ? 'ซ่อนสื่อจากสาธารณะแล้ว' : 'เปิดเผยแพร่สื่อตามปกติแล้ว');
    } catch (err: any) {
      showToast('ไม่สามารถเปลี่ยนสถานะได้', 'error');
    }
  };

  // Confirm delete resource
  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget || !user) return;
    try {
      await deleteResource(deleteConfirmTarget.id, {
        performedBy: user.uid,
        email: user.email || '',
        reason: `Admin deleted resource: ${deleteConfirmTarget.title}`
      });
      setResources(prev => prev.filter(r => r.id !== deleteConfirmTarget.id));
      setDeleteConfirmTarget(null);
      showToast('ลบสื่อการเรียนรู้ออกจากฐานข้อมูลสำเร็จ');
    } catch (err: any) {
      showToast('ลบสื่อไม่สำเร็จ', 'error');
    }
  };

  // Update user role
  const handleChangeRole = async (targetUser: UserProfile, newRole: string) => {
    if (!user) return;
    try {
      await updateUserRoleOrStatus(targetUser.uid, { role: newRole }, { uid: user.uid, email: user.email || '' });
      setUsersList(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, role: newRole as any } : u));
      showToast(`เปลี่ยนบทบาทของ ${targetUser.displayName} เป็น ${newRole} เรียบร้อยแล้ว`);
    } catch (err: any) {
      showToast('เปลี่ยนบทบาทไม่สำเร็จ', 'error');
    }
  };

  // Toggle user suspension
  const handleToggleSuspension = async (targetUser: UserProfile) => {
    if (!user) return;
    const nextStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateUserRoleOrStatus(targetUser.uid, { status: nextStatus }, { uid: user.uid, email: user.email || '' });
      setUsersList(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, status: nextStatus } : u));
      showToast(nextStatus === 'suspended' ? `ระงับบัญชี ${targetUser.displayName} แล้ว` : `ปลดระงับบัญชี ${targetUser.displayName} แล้ว`);
    } catch (err: any) {
      showToast('เปลี่ยนสถานะบัญชีไม่สำเร็จ', 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        siteName: siteName.trim(),
        siteDescription: siteDescription.trim(),
        announcement: announcement.trim(),
        announcementActive,
        categories,
      });
      showToast('บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว');
    } catch (err: any) {
      showToast('บันทึกการตั้งค่าไม่สำเร็จ', 'error');
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showToast('หมวดหมู่นี้มีอยู่แล้ว', 'info');
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCatInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) {
      showToast('ต้องมีหมวดหมู่อย่างน้อย 1 หมวด', 'error');
      return;
    }
    setCategories(categories.filter(c => c !== catToRemove));
  };

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    r.authorName.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    r.category.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const filteredUsers = usersList.filter(u => 
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 text-xs font-medium mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>ศูนย์ควบคุมผู้ดูแลระบบ (Admin Console)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">
            การจัดการระบบและดูแลเนื้อหา
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            ตรวจสอบรายงานเนื้อหา จัดการสื่อ ควบคุมสิทธิ์สมาชิก และปรับแต่งการตั้งค่าเว็บไซต์
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold backdrop-blur-md transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>รายงานเนื้อหา ({reports.filter(r => r.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'resources'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>สื่อทั้งหมดในระบบ</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการสมาชิก & สิทธิ์</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>ตั้งค่าเว็บไซต์</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>บันทึกการกระทำ</span>
        </button>
      </div>

      {/* TAB 1: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-heading">
                รายการรายงานเนื้อหาที่รอตรวจสอบ
              </h2>
              <p className="text-xs text-slate-500">
                ตรวจสอบข้อร้องเรียนจากสมาชิกและดำเนินการ ซ่อน หรือ ลบ สื่อที่ผิดระเบียบ
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs">กำลังโหลดรายงาน...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium text-slate-600">ไม่มีรายงานปัญหาในขณะนี้</p>
              <p className="text-xs text-slate-400">ชุมชนการเรียนรู้ดำเนินไปอย่างเรียบร้อย</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className={`p-4 rounded-2xl border transition ${
                    rep.status === 'pending'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        rep.status === 'pending'
                          ? 'bg-amber-200 text-amber-900'
                          : rep.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {rep.status === 'pending' ? 'รอตรวจสอบ' : rep.status === 'resolved' ? 'แก้ไขแล้ว' : 'ปฏิเสธ'}
                      </span>
                      <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                        {rep.reason}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rep.createdAt).toLocaleString('th-TH')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    สื่อ: {rep.resourceTitle || rep.resourceId}
                  </h3>

                  {rep.details && (
                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 mb-3">
                      <strong>รายละเอียดจากผู้รายงาน ({rep.reporterEmail}):</strong> {rep.details}
                    </p>
                  )}

                  {rep.status === 'pending' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'resolved')}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ตรวจสอบแล้ว (เสร็จสิ้น)</span>
                      </button>

                      <button
                        onClick={() => handleResolveReport(rep.id, 'dismissed')}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-medium transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ไม่พบความผิด (ยกเลิก)</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmTarget({ id: rep.resourceId, title: rep.resourceTitle })}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-medium transition ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบสื่อนี้</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL RESOURCES */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-heading">
                จัดการคลังสื่อทั้งหมด ({resources.length} รายการ)
              </h2>
              <p className="text-xs text-slate-500">
                สามารถเปลี่ยนสถานะเผยแพร่ / ซ่อน หรือลบสื่อการเรียนรู้ออกจากระบบ
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="ค้นหาชื่อสื่อ หรือผู้โพสต์..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">ชื่อเรื่อง</th>
                  <th className="p-3">หมวดหมู่</th>
                  <th className="p-3">ผู้แบ่งปัน</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3">เข้าชม</th>
                  <th className="p-3 text-right rounded-r-xl">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 max-w-xs">
                      <p className="font-bold text-slate-800 truncate">{res.title}</p>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1 mt-0.5"
                      >
                        <span className="truncate max-w-[200px]">{res.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {res.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-700">{res.authorName}</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        res.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {res.status === 'published' ? 'เผยแพร่' : 'ซ่อนอยู่'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{res.viewsCount || 0}</td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleToggleResourceStatus(res)}
                        className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          res.status === 'published'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title={res.status === 'published' ? 'ซ่อนสื่อ' : 'เผยแพร่'}
                      >
                        {res.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => setDeleteConfirmTarget({ id: res.id, title: res.title })}
                        className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs transition cursor-pointer"
                        title="ลบสื่อ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS & RBAC */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-heading">
                จัดการสมาชิกและการกำหนดสิทธิ์ (RBAC)
              </h2>
              <p className="text-xs text-slate-500">
                ตั้งค่าบทบาท (สมาชิก / ผู้ตรวจสอบ / แอดมิน) หรือระงับบัญชีผู้ใช้งาน
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อหรืออีเมลสมาชิก..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">ผู้ใช้งาน</th>
                  <th className="p-3">อีเมล</th>
                  <th className="p-3">บทบาท</th>
                  <th className="p-3">สถานะบัญชี</th>
                  <th className="p-3 text-right rounded-r-xl">จัดการสิทธิ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((usr) => (
                  <tr key={usr.uid} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-semibold text-slate-800">
                      {usr.displayName || 'ไม่มีชื่อแสดง'}
                    </td>
                    <td className="p-3 text-slate-600">{usr.email}</td>
                    <td className="p-3">
                      <select
                        value={usr.role || 'member'}
                        onChange={(e) => handleChangeRole(usr, e.target.value)}
                        className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-1 outline-none font-medium text-slate-700"
                      >
                        <option value="member">สมาชิกทั่วไป (Member)</option>
                        <option value="moderator">ผู้ตรวจสอบเนื้อหา (Moderator)</option>
                        <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        usr.status === 'suspended'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {usr.status === 'suspended' ? 'ถูกระงับ' : 'ปกติ'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleSuspension(usr)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          usr.status === 'suspended'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {usr.status === 'suspended' ? 'ปลดระงับบัญชี' : 'ระงับบัญชี'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SITE SETTINGS */}
      {activeTab === 'settings' && isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 font-heading">
              การตั้งค่าเว็บไซต์ (Site Settings)
            </h2>
            <p className="text-xs text-slate-500">
              แก้ไขชื่อเว็บไซต์ คำอธิบาย แถบประกาศ และหมวดหมู่ความรู้ได้ทันทีโดยไม่ต้องแก้โค้ด
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อเว็บไซต์ (Site Name) *
              </label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                คำอธิบายเว็บไซต์ (Site Description)
              </label>
              <textarea
                rows={3}
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  แถบข้อความประกาศด้านบนสุด (Announcement Banner)
                </label>
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementActive}
                    onChange={(e) => setAnnouncementActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>แสดงแถบประกาศ</span>
                </label>
              </div>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="ระบุข้อความประกาศ..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Categories Manager */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จัดการหมวดหมู่วิชา / ความรู้
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="เพิ่มชื่อหมวดหมู่ใหม่ เช่น ดนตรีสากล, AI..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มหมวดหมู่</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-xl border border-slate-200"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-md flex items-center space-x-2 font-heading cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่าเว็บไซต์</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: MODERATION AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 font-heading">
              บันทึกประวัติการกระทำของผู้ดูแล (Audit Logs)
            </h2>
            <p className="text-xs text-slate-500">
              ประวัติการซ่อนสื่อ ลบสื่อ หรือปรับเปลี่ยนบทบาทสมาชิกในระบบ
            </p>
          </div>

          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ยังไม่มีประวัติการดำเนินงาน
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 mr-2">[{log.action}]</span>
                    <span className="text-slate-600">{log.details}</span>
                    <span className="text-slate-400 block text-[11px] mt-0.5">
                      ดำเนินการโดย: {log.performedByEmail} ({log.targetType}: {log.targetId})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 ml-4">
                    {new Date(log.createdAt).toLocaleString('th-TH')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold font-heading text-base">ยืนยันการลบสื่อถาวร</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              คุณต้องการลบสื่อ <strong className="text-slate-900">"{deleteConfirmTarget.title}"</strong> ออกจากฐานข้อมูลจริงใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs"
              >
                ลบสื่อทันที
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
