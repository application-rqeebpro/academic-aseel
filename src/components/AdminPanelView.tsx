import React, { useState, useEffect } from 'react';
import { ActivationCode, StudentProfile, Subject, AdminSettings } from '../types';
import { 
  ShieldCheck, 
  KeyRound, 
  Users, 
  BookOpen, 
  Settings, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Lock, 
  Search, 
  MessageCircle, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  Copy,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  UserCheck,
  UserX,
  CreditCard,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminPanelViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectsUpdated?: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  isOpen,
  onClose,
  onSubjectsUpdated,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('mct_admin_token');
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin Change Password State
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminPassLoading, setAdminPassLoading] = useState(false);
  const [adminPassMsg, setAdminPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subject Management State
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectMsg, setSubjectMsg] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'students' | 'codes' | 'content' | 'settings' | 'guide'>('dashboard');

  // Dashboard Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingSubscriptions: 0,
    expiredSubscriptions: 0,
    totalCodes: 0,
    activeCodes: 0,
    totalRequests: 0,
    pendingRequests: 0,
  });

  // Codes State
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [newCodeCustom, setNewCodeCustom] = useState('');
  const [newPlanType, setNewPlanType] = useState<'monthly' | 'yearly'>('monthly');
  const [newDurationDays, setNewDurationDays] = useState(30);
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newCodeNotes, setNewCodeNotes] = useState('');
  const [codeSuccessMsg, setCodeSuccessMsg] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  // Requests State
  const [requests, setRequests] = useState<any[]>([]);

  // Students State
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Subjects & Lessons State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectEnglish, setNewSubjectEnglish] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [newSubjectSemester, setNewSubjectSemester] = useState<'الفصل الأول' | 'الفصل الثاني'>('الفصل الأول');

  // Settings State
  const [settings, setSettings] = useState<AdminSettings>({
    whatsappNumber: '785502919',
    monthlyPriceUSD: 20,
    yearlyPriceUSD: 200,
    exchangeRateYR: 535,
    academicYear: '2024 - 2025',
    announcementText: 'مرحبًا بكم في أكاديمية الميكاترونكس اليمنية!',
  });
  const [settingsSaveMsg, setSettingsSaveMsg] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem('mct_admin_token') || localStorage.getItem('mct_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleLogout = () => {
    localStorage.removeItem('mct_admin_token');
    setIsAuthenticated(false);
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/admin/requests', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCodes = async () => {
    try {
      const res = await fetch('/api/admin/codes', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/admin/students', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        if (data.subjects) setSubjects(data.subjects);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch data on authentication and when panel is opened
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadStats();
      loadRequests();
      loadCodes();
      loadStudents();
      loadSubjects();
      loadSettings();
    }
  }, [isOpen, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (res.status === 401) {
          throw new Error('كلمة المرور غير صحيحة. يرجى التأكد من كتابة كلمة المرور المعتمدة.');
        }
        throw new Error(text || 'فشل الاتصال بالخادم.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'كلمة المرور غير صحيحة');
      }

      localStorage.setItem('mct_admin_token', data.token);
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message || 'حدث خطأ أثناء تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeSuccessMsg('');
    setCodeLoading(true);

    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          code: newCodeCustom.trim() || undefined,
          planType: newPlanType,
          durationDays: Number(newDurationDays) || (newPlanType === 'yearly' ? 365 : 30),
          maxUses: Number(newMaxUses) || 1,
          expiresAt: newExpiryDate || undefined,
          notes: newCodeNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCodeSuccessMsg(`تم إنشاء كود التفعيل (${data.code.code}) بنجاح!`);
      setNewCodeCustom('');
      setNewCodeNotes('');
      loadCodes();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء الكود');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleToggleCode = async (code: string) => {
    try {
      await fetch(`/api/admin/codes/${code}/toggle`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      loadCodes();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCode = async (code: string) => {
    if (!confirm(`هل أنت متأكد من حذف كود التفعيل ${code}؟`)) return;
    try {
      await fetch(`/api/admin/codes/${code}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      loadCodes();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStudentStatusChange = async (userId: string, status: string) => {
    try {
      await fetch(`/api/admin/students/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status }),
      });
      loadStudents();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExtendStudent = async (userId: string, days: number = 30) => {
    try {
      await fetch(`/api/admin/students/${userId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ days }),
      });
      loadStudents();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/approve`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      if (res.ok) {
        alert('تمت الموافقة على الطلب وتفعيل الحساب بنجاح!');
        loadRequests();
        loadStudents();
        loadStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm('هل تريد بالتأكيد رفض هذا الطلب؟')) return;
    try {
      await fetch(`/api/admin/requests/${requestId}/reject`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      loadRequests();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaveMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettingsSaveMsg('تم حفظ وتطبيق الإعدادات بنجاح!');
        setTimeout(() => setSettingsSaveMsg(''), 3000);
      }
    } catch (e) {
      alert('فشل حفظ الإعدادات');
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`هل أنت متأكد من حذف حساب الطالب (${studentName}) نهائيًا؟`)) return;
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (res.ok) {
        loadStudents();
        loadStats();
      } else {
        const errData = await res.json();
        alert(errData.error || 'فشل حذف حساب الطالب.');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الاتصال بالخادم.');
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectMsg('');
    if (!newSubjectName.trim()) {
      setSubjectMsg('يرجى كتابة اسم المادة الدراسية.');
      return;
    }
    setSubjectLoading(true);
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          code: newSubjectCode.trim() || 'MCT',
          englishName: newSubjectEnglish.trim() || 'Engineering Subject',
          semester: newSubjectSemester,
          description: newSubjectDesc.trim() || 'مقرر دراسي في هندسة الميكاترونكس',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إضافة المادة.');
      setNewSubjectName('');
      setNewSubjectCode('');
      setNewSubjectEnglish('');
      setNewSubjectDesc('');
      setSubjectMsg('تمت إضافة المقرر الدراسي بنجاح!');
      loadSubjects();
      onSubjectsUpdated?.();
      setTimeout(() => setSubjectMsg(''), 3000);
    } catch (err: any) {
      setSubjectMsg(err.message || 'حدث خطأ أثناء إضافة المادة.');
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (!confirm(`هل أنت متأكد من حذف مادة (${subjectName}) وكافة الدروس التابعة لها؟`)) return;
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      if (res.ok) {
        loadSubjects();
        onSubjectsUpdated?.();
      } else {
        const err = await res.json();
        alert(err.error || 'فشل حذف المادة.');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ في الاتصال.');
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassMsg(null);
    if (!adminCurrentPass || !adminNewPass) {
      setAdminPassMsg({ type: 'error', text: 'يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة.' });
      return;
    }
    if (adminNewPass.length < 6) {
      setAdminPassMsg({ type: 'error', text: 'يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل.' });
      return;
    }
    if (adminNewPass !== adminConfirmPass) {
      setAdminPassMsg({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.' });
      return;
    }
    setAdminPassLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          currentPassword: adminCurrentPass,
          newPassword: adminNewPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة مرور المسؤول.');
      setAdminPassMsg({ type: 'success', text: 'تم تحديث كلمة مرور مدير الأكاديمية بنجاح!' });
      setAdminCurrentPass('');
      setAdminNewPass('');
      setAdminConfirmPass('');
    } catch (err: any) {
      setAdminPassMsg({ type: 'error', text: err.message || 'حدث خطأ أثناء تغيير كلمة المرور.' });
    } finally {
      setAdminPassLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`تم نسخ: ${text}`);
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.university && s.university.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                لوحة الإدارة المركزية | أكاديمية الميكاترونكس
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إدارة المستخدمين، الاشتراكات، أكواد التفعيل الآمنة، والمحتوى الأكاديمي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                تسجيل الخروج
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {!isAuthenticated ? (
          /* Login Screen */
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full space-y-6 text-center my-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-md">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                تسجيل دخول مسؤول المنصة
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                الوصول لهذه اللوحة محمي بالكامل ومخصص لإدارة الأكاديمية فقط
              </p>
            </div>

            {authError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور إدارة الأكاديمية..."
                  className="w-full px-4 py-3.5 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-center font-bold tracking-wider placeholder:tracking-normal focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'جاري التحقق الآمن...' : 'دخول لوحة التحكم'}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Views */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-60 bg-slate-50 dark:bg-slate-950/40 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 p-3 space-y-1 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1 md:gap-1">
              {[
                { id: 'dashboard', label: 'لوحة المعلومات', icon: TrendingUp, count: null },
                { id: 'requests', label: 'طلبات الاشتراك', icon: MessageCircle, count: stats.pendingRequests || null },
                { id: 'students', label: 'الطلاب والاشتراكات', icon: Users, count: stats.totalUsers || null },
                { id: 'codes', label: 'أكواد التفعيل', icon: KeyRound, count: stats.activeCodes || null },
                { id: 'content', label: 'المناهج والدروس', icon: BookOpen, count: null },
                { id: 'settings', label: 'إعدادات المنصة', icon: Settings, count: null },
                { id: 'guide', label: 'دليل الأمان والنشر', icon: HelpCircle, count: null },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.count !== null && tab.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-900 space-y-6">
              
              {/* TAB 1: DASHBOARD STATS */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      نظرة عامة على نشاط المنصة
                    </h3>
                    <button
                      onClick={() => { loadStats(); loadRequests(); loadStudents(); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>تحديث البيانات</span>
                    </button>
                  </div>

                  {/* 4 Key Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">إجمالي الطلاب</span>
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white">
                        {stats.totalUsers}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">طالب مسجل في المنصة</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">الاشتراكات النشطة</span>
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {stats.activeSubscriptions}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">وصول كامل لكافة المقررات</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">بانتظار التفعيل</span>
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                        {stats.pendingSubscriptions}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">بحاجة لتأكيد التحويل والدفع</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">أكواد التفعيل المتاحة</span>
                        <KeyRound className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                        {stats.activeCodes} / {stats.totalCodes}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">كود جاهز للتسليم</p>
                    </div>
                  </div>

                  {/* Quick Action Shortcuts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-right space-y-1 transition-all cursor-pointer bg-slate-50 dark:bg-slate-800/40"
                    >
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                        <span>فحص طلبات الواتساب ({stats.pendingRequests} معلقة)</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        تأكيد تحويلات الطلاب وتفعيل حساباتهم بنقرة واحدة
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab('codes')}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-right space-y-1 transition-all cursor-pointer bg-slate-50 dark:bg-slate-800/40"
                    >
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-500" />
                        <span>توليد كود تفعيل آمن جديد</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        إنشاء كود عشوائي مع تحديد الخطة والمدة وعدد الاستخدامات
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab('students')}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-right space-y-1 transition-all cursor-pointer bg-slate-50 dark:bg-slate-800/40"
                    >
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>إدارة حسابات واشتراكات الطلاب</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        تمديد المدة، التعليق، التفعيل، أو الاطلاع على بيانات الطالب
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: REQUESTS */}
              {activeTab === 'requests' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        طلبات الاشتراك الواردة من الطلاب
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        الطلاب الذين ضغطوا "التواصل عبر واتساب" وأرسلوا إشعار الرغبة في الاشتراك
                      </p>
                    </div>
                    <button
                      onClick={loadRequests}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {requests.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      لا توجد طلبات اشتراك مسجلة حاليًا
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{req.name}</span>
                              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                {req.phone}
                              </span>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                req.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {req.status === 'pending' ? 'بانتظار التأكيد' : 'تم التفعيل'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {req.university} • {req.studyLevel} • الخطة: <strong>{req.plan === 'yearly' ? 'سنوي' : 'شهري'}</strong> • {new Date(req.createdAt).toLocaleString('ar-YE')}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {req.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveRequest(req.id)}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>تأكيد الدفع وتفعيل</span>
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                                >
                                  رفض
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STUDENTS & SUBSCRIPTIONS */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        الطلاب والاشتراكات
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        متابعة حالات الحسابات، تمديد الفترات، وتفعيل أو تعليق الوصول
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="بحث بالاسم أو الهاتف..."
                        className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      لا يوجد طلاب مطابقون للبحث
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-3">الطالب</th>
                            <th className="p-3">الجامعة والمستوى</th>
                            <th className="p-3">الخطة</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3">المدة المتبقية</th>
                            <th className="p-3 text-center">إجراءات الإدارة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredStudents.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-3">
                                <div className="font-bold text-slate-900 dark:text-white">{st.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{st.phone}</div>
                              </td>
                              <td className="p-3">
                                <div>{st.university}</div>
                                <div className="text-[11px] text-slate-400">{st.studyLevel} • {st.major}</div>
                              </td>
                              <td className="p-3">
                                <span className="font-semibold">
                                  {st.subscriptionPlan === 'yearly' ? 'سنوي (365 يوم)' : 'شهري (30 يوم)'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  st.subscriptionStatus === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : st.subscriptionStatus === 'pending'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}>
                                  {st.subscriptionStatus === 'active' ? 'نشط ومفعل' : st.subscriptionStatus === 'pending' ? 'بانتظار التفعيل' : 'منتهي / معلق'}
                                </span>
                              </td>
                              <td className="p-3 font-bold font-mono">
                                {st.remainingDays} يوم
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {st.subscriptionStatus !== 'active' ? (
                                    <button
                                      onClick={() => handleStudentStatusChange(st.id, 'active')}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 cursor-pointer"
                                    >
                                      تفعيل
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleStudentStatusChange(st.id, 'suspended')}
                                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 cursor-pointer"
                                    >
                                      تعليق
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleExtendStudent(st.id, 30)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px] hover:bg-blue-200 cursor-pointer"
                                    title="تمديد 30 يوم إضافية"
                                  >
                                    +30 يوم
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(st.id, st.name)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                                    title="حذف حساب الطالب نهائيًا"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACTIVATION CODES */}
              {activeTab === 'codes' && (
                <div className="space-y-6">
                  
                  {/* Code Generator Card */}
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          إنشاء كود تفعيل آمن جديد
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400">توليد عشوائي مشفر من الخادم</span>
                    </div>

                    {codeSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{codeSuccessMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateCode} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          نوع الخطة
                        </label>
                        <select
                          value={newPlanType}
                          onChange={(e) => {
                            const val = e.target.value as 'monthly' | 'yearly';
                            setNewPlanType(val);
                            setNewDurationDays(val === 'yearly' ? 365 : 30);
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        >
                          <option value="monthly">شهري (30 يوم)</option>
                          <option value="yearly">سنوي (365 يوم)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          المدة بالأيام
                        </label>
                        <input
                          type="number"
                          value={newDurationDays}
                          onChange={(e) => setNewDurationDays(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          مرات الاستخدام
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newMaxUses}
                          onChange={(e) => setNewMaxUses(Number(e.target.value))}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          كود مخصص (اختياري)
                        </label>
                        <input
                          type="text"
                          value={newCodeCustom}
                          onChange={(e) => setNewCodeCustom(e.target.value.toUpperCase())}
                          placeholder="اتركه فارغًا لتوليد آمن"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={codeLoading}
                          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إنشاء الكود الآن</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Codes Table */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                      <span>قائمة أكواد التفعيل المسجلة ({codes.length})</span>
                      <button
                        onClick={loadCodes}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>تحديث</span>
                      </button>
                    </h4>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-3">الكود</th>
                            <th className="p-3">النوع والمدة</th>
                            <th className="p-3">الاستخدام</th>
                            <th className="p-3">المستخدم وتاريخ الاستخدام</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3 text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {codes.map((c) => (
                            <tr key={c.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {c.code}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(c.code)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="نسخ الكود"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="font-semibold">
                                  {c.planType === 'yearly' ? 'سنوي' : 'شهري'} ({c.durationDays} يوم)
                                </span>
                              </td>
                              <td className="p-3 font-mono">
                                {c.usedCount || (c.isUsed ? 1 : 0)} / {c.maxUses || 1}
                              </td>
                              <td className="p-3">
                                {c.usedByName ? (
                                  <div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{c.usedByName}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {c.usedAt ? new Date(c.usedAt).toLocaleDateString('ar-YE') : '-'}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">لم يُستخدم بعد</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.isActive !== false && !c.isUsed
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {c.isActive === false ? 'معطل' : c.isUsed ? 'مُستخدم' : 'نشط متاح'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleToggleCode(c.code)}
                                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
                                  >
                                    {c.isActive === false ? 'تفعيل' : 'تعطيل'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCode(c.code)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                    title="حذف الكود"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 5: CURRICULUM */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        المقررات والمناهج الدراسية
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        إضافة وإدارة المواد والدروس المتاحة لطلاب السنة الأولى
                      </p>
                    </div>
                  </div>

                  {subjectMsg && (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 text-blue-800 dark:text-blue-200 text-xs flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{subjectMsg}</span>
                    </div>
                  )}

                  {/* Add New Subject Form */}
                  <form onSubmit={handleAddSubject} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        إضافة مقرر دراسي جديد
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          اسم المادة بالعربية
                        </label>
                        <input
                          type="text"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="مثال: الدوائر الكهربائية 1"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رمز المادة (Code)
                        </label>
                        <input
                          type="text"
                          value={newSubjectCode}
                          onChange={(e) => setNewSubjectCode(e.target.value)}
                          placeholder="مثال: MCT111"
                          dir="ltr"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          الاسم بالإنجليزية
                        </label>
                        <input
                          type="text"
                          value={newSubjectEnglish}
                          onChange={(e) => setNewSubjectEnglish(e.target.value)}
                          placeholder="Electric Circuits I"
                          dir="ltr"
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          الفصل الدراسي
                        </label>
                        <select
                          value={newSubjectSemester}
                          onChange={(e) => setNewSubjectSemester(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        >
                          <option value="الفصل الأول">الفصل الأول</option>
                          <option value="الفصل الثاني">الفصل الثاني</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        وصف المادة وأهدافها
                      </label>
                      <input
                        type="text"
                        value={newSubjectDesc}
                        onChange={(e) => setNewSubjectDesc(e.target.value)}
                        placeholder="نبذة عن المقرر وما يتعلمه الطالب..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={subjectLoading || !newSubjectName.trim()}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{subjectLoading ? 'جاري الإضافة...' : 'حفظ وإضافة المادة'}</span>
                    </button>
                  </form>

                  {/* Subjects List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map((subj) => (
                      <div
                        key={subj.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                            {subj.code}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{subj.semester}</span>
                            <button
                              onClick={() => handleDeleteSubject(subj.id, subj.name)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                              title="حذف المادة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          {subj.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {subj.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-8 max-w-xl">
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        إعدادات الأكاديمية والأسعار
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        تعديل رقم واتساب التحويل، أسعار الاشتراكات، وسعر الصرف
                      </p>
                    </div>

                    {settingsSaveMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{settingsSaveMsg}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رقم واتساب الإدارة المعتمد للتحويل
                        </label>
                        <input
                          type="text"
                          value={settings.whatsappNumber}
                          onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                          dir="ltr"
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            سعر الاشتراك الشهري ($)
                          </label>
                          <input
                            type="number"
                            value={settings.monthlyPriceUSD}
                            onChange={(e) => setSettings({ ...settings, monthlyPriceUSD: Number(e.target.value) })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            سعر الاشتراك السنوي ($)
                          </label>
                          <input
                            type="number"
                            value={settings.yearlyPriceUSD}
                            onChange={(e) => setSettings({ ...settings, yearlyPriceUSD: Number(e.target.value) })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رسالة الإعلان وشريط التنبيه
                        </label>
                        <textarea
                          rows={3}
                          value={settings.announcementText}
                          onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        حفظ وتطبيق الإعدادات
                      </button>
                    </div>
                  </form>

                  {/* Change Admin Password Section */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>تغيير كلمة مرور مدير الأكاديمية</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        قم بتحديث كلمة المرور بانتظام لحماية لوحة الإدارة بأمان تام
                      </p>
                    </div>

                    {adminPassMsg && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-bold ${
                        adminPassMsg.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-200'
                      }`}>
                        {adminPassMsg.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{adminPassMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangeAdminPassword} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          كلمة المرور الحالية
                        </label>
                        <input
                          type="password"
                          value={adminCurrentPass}
                          onChange={(e) => setAdminCurrentPass(e.target.value)}
                          placeholder="كلمة مرور المدير الحالية..."
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            كلمة المرور الجديدة
                          </label>
                          <input
                            type="password"
                            value={adminNewPass}
                            onChange={(e) => setAdminNewPass(e.target.value)}
                            placeholder="6 خانات على الأقل..."
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            تأكيد كلمة المرور الجديدة
                          </label>
                          <input
                            type="password"
                            value={adminConfirmPass}
                            onChange={(e) => setAdminConfirmPass(e.target.value)}
                            placeholder="أعد كتابة كلمة المرور..."
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={adminPassLoading || !adminCurrentPass || !adminNewPass}
                        className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{adminPassLoading ? 'جاري التحديث المشفر...' : 'تحديث كلمة مرور الإدارة'}</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 7: GUIDE */}
              {activeTab === 'guide' && (
                <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl">
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
                    <h4 className="font-extrabold text-indigo-900 dark:text-indigo-200 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>معايير الأمان المطبقة في أكاديمية الميكاترونكس اليمنية:</span>
                    </h4>
                    <p className="text-xs">
                      تم الانتقال بالكامل من Prototype إلى نظام إنتاجي آمن وحقيقي:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <h5 className="font-bold text-slate-900 dark:text-white mb-1">1. إخفاء الأكواد وحماية الواجهة الأمامية:</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        لا توجد أي أكواد تفعيل داخل كود JavaScript، HTML، أو واجهة الزائر. التحقق يتم حصرًا من جانب الخادم (Server Side).
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <h5 className="font-bold text-slate-900 dark:text-white mb-1">2. أمان مصادقة JWT والتحكم بالصلاحيات (RBAC):</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        يتم تشفير وتوقيع جلسات الطلاب والمدير بواسطة JWT عبر توكنات آمنة، مع حماية مسارات API عبر Middleware للتحقق من حالة الاشتراك النشط.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <h5 className="font-bold text-slate-900 dark:text-white mb-1">3. دورة حياة الاشتراك والتفعيل:</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        الطالب يسجل بياناته ويبقى حسابه في حالة (بانتظار التفعيل) حتى يقوم المدير بالموافقة على الطلب أو تسليم كود تفعيل صالح للاستخدام مرة واحدة.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
