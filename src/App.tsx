import React, { useState, useEffect } from 'react';
import { StudentProfile, Subject, Lesson, ExplainLessonResult } from './types';
import { INITIAL_SUBJECTS, INITIAL_LESSONS } from './data/initialData';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { WelcomeView } from './components/WelcomeView';
import { RegistrationView } from './components/RegistrationView';
import { SubscriptionView } from './components/SubscriptionView';
import { PaymentInstructionsView } from './components/PaymentInstructionsView';
import { ActivationCodeView } from './components/ActivationCodeView';
import { DashboardView } from './components/DashboardView';
import { SubjectsView } from './components/SubjectsView';
import { LessonDetailView } from './components/LessonDetailView';
import { ExplainLessonView } from './components/ExplainLessonView';
import { FormulaAnalyzerView } from './components/FormulaAnalyzerView';
import { UnitConverterView } from './components/UnitConverterView';
import { CircuitsHelperView } from './components/CircuitsHelperView';
import { MathHelperView } from './components/MathHelperView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AdminPanelView } from './components/AdminPanelView';
import { LoginModal } from './components/LoginModal';
import { StudentProfileModal } from './components/StudentProfileModal';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('mct_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  // Student State
  const [student, setStudent] = useState<StudentProfile | null>(() => {
    const saved = localStorage.getItem('mct_student');
    return saved ? JSON.parse(saved) : null;
  });

  // Onboarding / Active flow step: 'welcome' | 'registration' | 'plans' | 'payment' | 'code' | 'dashboard'
  const [onboardingStep, setOnboardingStep] = useState<string>(() => {
    const savedToken = localStorage.getItem('mct_auth_token');
    const savedStudent = localStorage.getItem('mct_student');
    if (savedToken || savedStudent) return 'dashboard';
    return 'welcome';
  });

  // Temporary staging data for registration
  const [regData, setRegData] = useState<{
    name: string;
    phone: string;
    university: string;
    studyLevel: any;
    major: string;
    email?: string;
  }>({
    name: '',
    phone: '',
    university: 'الجامعة الإماراتية الدولية – صنعاء',
    studyLevel: 'السنة الأولى',
    major: 'هندسة الميكاترونكس',
  });

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // Navigation tab for logged-in student
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Curriculum content state
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedExplainedLesson, setSelectedExplainedLesson] = useState<ExplainLessonResult | null>(null);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInitialTopic, setAiInitialTopic] = useState('');

  // Settings
  const [whatsappNumber, setWhatsappNumber] = useState('785502919');
  const [monthlyPriceUSD, setMonthlyPriceUSD] = useState(20);
  const [yearlyPriceUSD, setYearlyPriceUSD] = useState(200);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mct_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Persist student profile changes
  useEffect(() => {
    if (student) {
      localStorage.setItem('mct_student', JSON.stringify(student));
    } else {
      localStorage.removeItem('mct_student');
    }
  }, [student]);

  // Check URL hash for admin entry point (#admin or /admin)
  useEffect(() => {
    const checkAdminHash = () => {
      if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
        setIsAdminOpen(true);
      }
    };
    checkAdminHash();
    window.addEventListener('hashchange', checkAdminHash);
    return () => window.removeEventListener('hashchange', checkAdminHash);
  }, []);

  // Validate authenticated session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('mct_auth_token');
      if (!token) return;

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.student) {
            setStudent(data.student);
            setOnboardingStep('dashboard');
          }
        } else if (res.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('mct_auth_token');
          localStorage.removeItem('mct_student');
          setStudent(null);
          setOnboardingStep('welcome');
        }
      } catch (e) {
        console.warn('Auth check skipped (offline or network error)', e);
      }
    };

    checkAuth();
  }, []);

  // Fetch settings & subjects from backend
  const fetchSettingsAndSubjects = async () => {
    try {
      const sRes = await fetch('/api/settings');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.whatsappNumber) setWhatsappNumber(sData.whatsappNumber);
        if (sData.monthlyPriceUSD) setMonthlyPriceUSD(sData.monthlyPriceUSD);
        if (sData.yearlyPriceUSD) setYearlyPriceUSD(sData.yearlyPriceUSD);
      }

      const subjRes = await fetch('/api/subjects');
      if (subjRes.ok) {
        const subjData = await subjRes.json();
        if (subjData.subjects && subjData.subjects.length > 0) {
          setSubjects(subjData.subjects);
        }
      }
    } catch (e) {
      console.warn('Backend server offline, using local data', e);
    }
  };

  useEffect(() => {
    fetchSettingsAndSubjects();
  }, []);

  // Handlers
  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleStartRegistration = () => {
    setOnboardingStep('registration');
  };

  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (loggedInStudent: StudentProfile, token: string) => {
    setStudent(loggedInStudent);
    localStorage.setItem('mct_auth_token', token);
    localStorage.setItem('mct_student', JSON.stringify(loggedInStudent));
    setIsLoginModalOpen(false);
    setOnboardingStep('dashboard');
    setActiveTab('dashboard');
  };

  const handleRegistrationProceed = (data: {
    name: string;
    phone: string;
    university: string;
    studyLevel: any;
    major: string;
    email?: string;
  }) => {
    setRegData(data);
    setOnboardingStep('plans');
  };

  const handleSelectPlan = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setOnboardingStep('payment');
  };

  const handleActivationSuccess = (activatedStudent: StudentProfile) => {
    setStudent(activatedStudent);
    localStorage.setItem('mct_student', JSON.stringify(activatedStudent));
    setOnboardingStep('dashboard');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (confirm('هل تريد بالتأكيد تسجيل الخروج من حسابك؟')) {
      setStudent(null);
      localStorage.removeItem('mct_auth_token');
      localStorage.removeItem('mct_student');
      setOnboardingStep('welcome');
      setSelectedSubjectId(null);
      setSelectedLessonId(null);
      setSelectedExplainedLesson(null);
    }
  };

  const handleOpenAiWithTopic = (topic: string) => {
    if (!student || !student.isActivated) {
      alert('ميزة المساعد الذكي متاحة للمشتركين بعد تفعيل الحساب.');
      return;
    }
    setAiInitialTopic(topic);
    setIsAiModalOpen(true);
  };

  const handleMarkLessonComplete = async (lessonId: string, quizScore?: number) => {
    if (!student) return;

    const updatedCompleted = student.completedLessons?.includes(lessonId)
      ? student.completedLessons
      : [...(student.completedLessons || []), lessonId];

    const updatedQuizScores = { ...student.quizScores };
    if (quizScore !== undefined) {
      updatedQuizScores[lessonId] = quizScore;
    }

    const updatedStudent: StudentProfile = {
      ...student,
      completedLessons: updatedCompleted,
      quizScores: updatedQuizScores,
    };

    setStudent(updatedStudent);

    // Sync with backend API
    try {
      const token = localStorage.getItem('mct_auth_token');
      await fetch('/api/student/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studentId: student.id,
          completedLessonId: lessonId,
          quizScore: quizScore !== undefined ? { lessonId, percentage: quizScore } : undefined,
        }),
      });
    } catch (e) {
      console.warn('Sync failed', e);
    }
  };

  // Find currently active lesson object
  const activeLesson = lessons.find((l) => l.id === selectedLessonId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-600 selection:text-white">
      
      {/* Top Header */}
      <Header
        student={student}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAiModal={() => {
          if (!student || !student.isActivated) {
            alert('يرجى تفعيل اشتراكك لاستخدام مساعد الذكاء الاصطناعي.');
            return;
          }
          setAiInitialTopic('');
          setIsAiModalOpen(true);
        }}
        onOpenExplainLesson={() => {
          if (!student || !student.isActivated) {
            alert('يرجى تفعيل اشتراكك للوصول إلى ميزة اشرح لي درس اليوم.');
            return;
          }
          setActiveTab('explain');
          setSelectedLessonId(null);
          setSelectedExplainedLesson(null);
        }}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleStartRegistration}
        onOpenActivation={() => setOnboardingStep('code')}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
        onNavigateHome={() => {
          if (student) {
            setOnboardingStep('dashboard');
            setActiveTab('dashboard');
            setSelectedSubjectId(null);
            setSelectedLessonId(null);
            setSelectedExplainedLesson(null);
          } else {
            setOnboardingStep('welcome');
          }
        }}
      />

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ========================================================= */}
        {/* VISITOR & ONBOARDING VIEWS (When not logged in or in onboarding) */}
        {/* ========================================================= */}
        {!student && (
          <div>
            {onboardingStep === 'welcome' && (
              <WelcomeView
                onRegister={handleStartRegistration}
                onLogin={handleOpenLogin}
                subjects={subjects}
                monthlyPriceUSD={monthlyPriceUSD}
                yearlyPriceUSD={yearlyPriceUSD}
              />
            )}

            {onboardingStep === 'registration' && (
              <RegistrationView
                onProceedToPlans={handleRegistrationProceed}
                onBack={() => setOnboardingStep('welcome')}
                onOpenLogin={handleOpenLogin}
              />
            )}

            {onboardingStep === 'plans' && (
              <SubscriptionView
                monthlyPriceUSD={monthlyPriceUSD}
                yearlyPriceUSD={yearlyPriceUSD}
                onSelectPlan={handleSelectPlan}
                onBack={() => setOnboardingStep('registration')}
              />
            )}

            {onboardingStep === 'payment' && (
              <PaymentInstructionsView
                studentData={regData}
                selectedPlan={selectedPlan}
                whatsappNumber={whatsappNumber}
                onProceedToCodeEntry={() => setOnboardingStep('code')}
                onBack={() => setOnboardingStep('plans')}
              />
            )}

            {onboardingStep === 'code' && (
              <ActivationCodeView
                onActivationSuccess={handleActivationSuccess}
                onBack={() => setOnboardingStep('payment')}
                whatsappNumber={whatsappNumber}
              />
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* LOGGED IN STUDENT PORTAL (Dashboard & Features) */}
        {/* ========================================================= */}
        {student && (
          <div>
            {/* Direct Activation Code Entry Screen (if requested by student) */}
            {onboardingStep === 'code' ? (
              <ActivationCodeView
                onActivationSuccess={handleActivationSuccess}
                onBack={() => setOnboardingStep('dashboard')}
                whatsappNumber={whatsappNumber}
              />
            ) : selectedLessonId && activeLesson ? (
              /* If a lesson is specifically opened, show LessonDetailView */
              <LessonDetailView
                lesson={activeLesson}
                onBack={() => setSelectedLessonId(null)}
                onOpenAiForLesson={(lessonTitle) => handleOpenAiWithTopic(`اشرح لي درس "${lessonTitle}" والمسائل المتعلقة به`)}
                onMarkComplete={handleMarkLessonComplete}
                isCompleted={student.completedLessons?.includes(activeLesson.id) || false}
                savedQuizScore={student.quizScores?.[activeLesson.id]}
              />
            ) : selectedLessonId && !activeLesson ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-slate-700 dark:text-slate-300 font-bold">الدرس المطلوب غير متوفر حاليًا أو قيد التحديث.</p>
                <button
                  onClick={() => setSelectedLessonId(null)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer transition-all"
                >
                  العودة للدروس
                </button>
              </div>
            ) : (
              /* Main Student Navigation Tabs */
              <div>
                
                {/* 1. Dashboard Tab */}
                {activeTab === 'dashboard' && (
                  <DashboardView
                    student={student}
                    subjects={subjects}
                    onNavigateToTab={(tab) => {
                      if (tab === 'ai') {
                        handleOpenAiWithTopic('');
                      } else {
                        setActiveTab(tab);
                        setSelectedExplainedLesson(null);
                      }
                    }}
                    onSelectSubject={(subjectId) => {
                      setSelectedSubjectId(subjectId);
                      setActiveTab('subjects');
                    }}
                    onRenewSubscription={() => {
                      const cleanNumber = whatsappNumber.startsWith('967') ? whatsappNumber : `967${whatsappNumber.replace(/^0+/, '')}`;
                      const msg = `السلام عليكم إدارة الأكاديمية، أنا الطالب ${student.name}، أريد تجديد اشتراكي.`;
                      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    onOpenActivation={() => setOnboardingStep('code')}
                    onOpenProfile={() => setIsProfileModalOpen(true)}
                    onOpenSavedLesson={(lesson) => {
                      setSelectedExplainedLesson(lesson);
                      setActiveTab('explain');
                      setSelectedLessonId(null);
                    }}
                    whatsappNumber={whatsappNumber}
                  />
                )}

                {/* 2. Explain Lesson Tab ("اشرح لي درس اليوم") */}
                {activeTab === 'explain' && (
                  <ExplainLessonView
                    student={student}
                    onNavigateToTool={(toolId) => {
                      if (['circuits', 'formulas', 'units', 'math'].includes(toolId)) {
                        setActiveTab(toolId as any);
                      } else if (toolId === 'ai') {
                        handleOpenAiWithTopic('');
                      } else {
                        setActiveTab('formulas');
                      }
                    }}
                    onOpenAiChat={(topic) => handleOpenAiWithTopic(topic)}
                    initialLessonToOpen={selectedExplainedLesson}
                  />
                )}

                {/* 3. Subjects Tab */}
                {activeTab === 'subjects' && (
                  <SubjectsView
                    subjects={subjects}
                    lessons={lessons}
                    selectedSubjectId={selectedSubjectId}
                    onSelectSubject={(subjId) => setSelectedSubjectId(subjId)}
                    onSelectLesson={(lessonId) => {
                      if (!student.isActivated) {
                        alert('حسابك في انتظار التفعيل. يرجى إدخال كود التفعيل للوصول إلى محتوى الدروس.');
                        return;
                      }
                      setSelectedLessonId(lessonId);
                    }}
                    completedLessons={student.completedLessons || []}
                  />
                )}

                {/* 4. Formula Analyzer Tab */}
                {activeTab === 'formulas' && (
                  <FormulaAnalyzerView
                    onAskAi={(formulaName) => handleOpenAiWithTopic(formulaName)}
                  />
                )}

                {/* 5. Unit Converter Tab */}
                {activeTab === 'units' && <UnitConverterView />}

                {/* 6. Circuits Lab Tab */}
                {activeTab === 'circuits' && <CircuitsHelperView />}

                {/* 7. Math Helper Tab */}
                {activeTab === 'math' && <MathHelperView />}

              </div>
            )}

          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (Visible only for logged in students) */}
      {student && (
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'ai') {
              handleOpenAiWithTopic('');
            } else {
              setActiveTab(tab);
              setSelectedLessonId(null);
              if (tab !== 'explain') {
                setSelectedExplainedLesson(null);
              }
            }
          }}
        />
      )}

      {/* Student Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onOpenRegister={() => {
          setIsLoginModalOpen(false);
          setOnboardingStep('registration');
        }}
        whatsappNumber={whatsappNumber}
      />

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialTopic={aiInitialTopic}
        currentLessonTitle={activeLesson?.title}
        currentSubjectName={subjects.find((s) => s.id === activeLesson?.subjectId)?.name}
      />

      {/* Student Profile & Settings Modal */}
      {student && (
        <StudentProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          student={student}
          onUpdateStudent={(updated) => {
            setStudent(updated);
            localStorage.setItem('mct_student', JSON.stringify(updated));
          }}
          onOpenActivation={() => {
            setIsProfileModalOpen(false);
            setOnboardingStep('code');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Admin Panel Modal */}
      <AdminPanelView
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onSubjectsUpdated={() => fetchSettingsAndSubjects()}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-700 dark:text-slate-300">
            أكاديمية الميكاترونكس اليمنية © {new Date().getFullYear()} – "افهم الميكاترونكس بطريقة سهلة"
          </p>
          <p>
            مخصصة لطلاب السنة الأولى في الجامعة الإماراتية الدولية بصنعاء وبقية الجامعات اليمنية | للتفعيل والتواصل عبر واتساب: <span className="font-mono font-bold text-blue-600 dark:text-blue-400" dir="ltr">{whatsappNumber}</span>
          </p>
          <div className="pt-1 flex items-center justify-center gap-4 text-[11px]">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:underline cursor-pointer"
            >
              بوابة إدارة المنصة (Admin)
            </button>
            <span>•</span>
            <button
              onClick={handleOpenLogin}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:underline cursor-pointer"
            >
              دخول الطلاب
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
