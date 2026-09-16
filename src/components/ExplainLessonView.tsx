import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  PenTool, 
  FileCode, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Bookmark, 
  Copy, 
  Share2, 
  RefreshCw, 
  Calculator, 
  Layers, 
  Zap, 
  Scale, 
  Ruler, 
  Binary, 
  ChevronRight, 
  ExternalLink, 
  Printer, 
  Check, 
  X, 
  BookOpen, 
  Clock, 
  Calendar, 
  Trash2, 
  Lightbulb, 
  ArrowRight,
  Sliders,
  Send,
  Atom,
  Eye,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  StudentProfile, 
  ExplainLessonResult, 
  ExplainSourceType, 
  ExplainLevel,
  ExplainQuizQuestion
} from '../types';
import { ExplainFourteenSections } from './ExplainFourteenSections';

interface ExplainLessonViewProps {
  student: StudentProfile;
  onNavigateToTool: (tabId: string, contextData?: any) => void;
  onOpenAiChat: (prompt: string) => void;
  initialLessonToOpen?: ExplainLessonResult | null;
}

export const ExplainLessonView: React.FC<ExplainLessonViewProps> = ({
  student,
  onNavigateToTool,
  onOpenAiChat,
  initialLessonToOpen = null,
}) => {
  // Input states
  const [sourceType, setSourceType] = useState<ExplainSourceType>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [explanationLevel, setExplanationLevel] = useState<ExplainLevel>('simple');
  const [dragActive, setDragActive] = useState(false);

  // Analysis & Progress states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ExplainLessonResult | null>(initialLessonToOpen);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History states
  const [savedLessons, setSavedLessons] = useState<ExplainLessonResult[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Interactive modes
  const [showStudySheet, setShowStudySheet] = useState(false);
  const [showExplainPartModal, setShowExplainPartModal] = useState(false);
  const [customPartText, setCustomPartText] = useState('');
  const [partAction, setPartAction] = useState<'explain' | 'simplify' | 'example' | 'solve' | 'verify'>('explain');
  const [isPartLoading, setIsPartLoading] = useState(false);
  const [partResultText, setPartResultText] = useState<string | null>(null);

  // Quiz interactive state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | number | boolean>>({});
  const [revealedQuiz, setRevealedQuiz] = useState<Record<string, boolean>>({});

  // Active view tab inside analysis
  const [activeTab, setActiveTab] = useState<'explanation' | 'formulas' | 'example' | 'quiz' | 'tools'>('explanation');
  const [copySuccess, setCopySuccess] = useState(false);

  // PDF page mode & selection
  const [pdfMode, setPdfMode] = useState<'all' | 'page'>('all');
  const [pdfPageNumber, setPdfPageNumber] = useState('');

  // Presentation View Mode: 'stream' (Ordered 1-14 single flow) vs 'tabs'
  const [viewMode, setViewMode] = useState<'stream' | 'tabs'>('stream');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  // Progress message sequence
  const PROGRESS_STAGES = [
    'جاري قراءة المحتوى وفحص البيانات...',
    'جاري استخراج المفاهيم الهندسية والمصطلحات...',
    'جاري تحليل القوانين والأبعاد الفيزيائية والوحدات...',
    'جاري تبسيط الشرح لطالب سنة أولى ميكاترونكس...',
    'جاري إعداد الأمثلة المحلولة والاختبار التجريبي...',
    'تم تجهيز شرح الدرس بنجاح!',
  ];

  // Load student saved lessons from localStorage & API on mount
  useEffect(() => {
    loadSavedLessons();
  }, [student.id]);

  const loadSavedLessons = async () => {
    try {
      const localKey = `mct_explained_lessons_${student.id}`;
      const localData = localStorage.getItem(localKey);
      let localList: ExplainLessonResult[] = localData ? JSON.parse(localData) : [];

      // Fetch from server
      try {
        const res = await fetch(`/api/student-lessons/${student.id}`);
        if (res.ok) {
          const serverData = await res.json();
          if (serverData.lessons && serverData.lessons.length > 0) {
            // merge without duplicates
            const map = new Map<string, ExplainLessonResult>();
            localList.forEach((l) => map.set(l.id, l));
            serverData.lessons.forEach((l: ExplainLessonResult) => map.set(l.id, l));
            localList = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
        }
      } catch (err) {
        // use local
      }

      setSavedLessons(localList);
      localStorage.setItem(localKey, JSON.stringify(localList));
    } catch (e) {
      console.warn('Failed to load saved lessons', e);
    }
  };

  const saveLessonToHistory = async (lesson: ExplainLessonResult) => {
    try {
      const localKey = `mct_explained_lessons_${student.id}`;
      const existing = savedLessons.filter((l) => l.id !== lesson.id);
      const updated = [lesson, ...existing];
      setSavedLessons(updated);
      localStorage.setItem(localKey, JSON.stringify(updated));

      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2500);

      // Persist to server
      fetch('/api/student-lessons/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson, studentId: student.id }),
      }).catch(() => {});
    } catch (e) {
      console.error('Error saving lesson:', e);
    }
  };

  const deleteLessonFromHistory = async (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const localKey = `mct_explained_lessons_${student.id}`;
      const updated = savedLessons.filter((l) => l.id !== lessonId);
      setSavedLessons(updated);
      localStorage.setItem(localKey, JSON.stringify(updated));

      fetch(`/api/student-lessons/${lessonId}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch (e) {
      console.error('Error deleting lesson', e);
    }
  };

  // Handle File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);

    // Generate preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setFilePreview('pdf-document');
    } else if (file.type.startsWith('video/')) {
      setFilePreview('video-file');
    } else {
      setFilePreview('generic-file');
    }
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      processSelectedFile(droppedFile);
    }
  };

  // Start Lesson Analysis
  const handleAnalyzeLesson = async (customAction?: string, customLevel?: ExplainLevel) => {
    // Validate inputs
    if (sourceType === 'text' && !textInput.trim()) {
      setErrorMsg('يرجى كتابة أو لصق نص الدرس أو السؤال أولاً.');
      return;
    }
    if (sourceType !== 'text' && !selectedFile && !textInput.trim()) {
      setErrorMsg('يرجى رفع ملف أو صورة أو كتابة النص المطلوب شرحه.');
      return;
    }

    setIsAnalyzing(true);
    setProgressStage(0);
    setErrorMsg(null);

    // Progress ticker
    const interval = setInterval(() => {
      setProgressStage((prev) => {
        if (prev < PROGRESS_STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    try {
      let fileData: string | undefined;
      let mimeType: string | undefined;

      if (selectedFile) {
        mimeType = selectedFile.type || (sourceType === 'pdf' ? 'application/pdf' : 'image/jpeg');
        fileData = await readFileAsBase64(selectedFile);
      }

      const payload = {
        mode: sourceType,
        prompt: textInput,
        fileData,
        mimeType,
        fileName: selectedFile?.name || (textInput ? 'مقتطف نصي' : 'درس جامعي'),
        explanationLevel: customLevel || explanationLevel,
        actionType: customAction || 'full_explain',
        specificPart: customPartText || undefined,
        pdfPageChoice: pdfMode === 'page' && pdfPageNumber ? pdfPageNumber : undefined,
        studentUniversity: student.university,
        studentMajor: student.major,
        studentId: student.id,
      };

      const response = await fetch('/api/explain-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearInterval(interval);
      setProgressStage(PROGRESS_STAGES.length - 1);

      if (!response.ok) {
        throw new Error('حدث خطأ في الخادم أثناء تحليل الدرس.');
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('لم يتم استخراج شرح متكامل. يرجى التأكد من وضوح الملف والمحاولة ثانية.');
      }

      const result: ExplainLessonResult = {
        ...data.result,
        filePreviewUrl: filePreview?.startsWith('data:image') ? filePreview : undefined,
      };

      setAnalysisResult(result);
      saveLessonToHistory(result);

      // Reset quiz
      setQuizAnswers({});
      setRevealedQuiz({});

      // Scroll to results smoothly
      setTimeout(() => {
        resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      console.error('Error analyzing lesson:', err);
      setErrorMsg(err.message || 'تعذر تحليل الدرس حالياً. يرجى المحاولة لاحقاً.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Button "لم أفهم" (Simplify more)
  const handleDidNotUnderstand = async () => {
    if (!analysisResult) return;
    setExplanationLevel('simple');
    await handleAnalyzeLesson('did_not_understand', 'simple');
  };

  // Button 1: "بسّط لي أكثر" (Simplify even more with everyday analogies)
  const handleSimplifyMore = async () => {
    if (!analysisResult) return;
    setExplanationLevel('simple');
    await handleAnalyzeLesson('simplify', 'simple');
  };

  // Button 2: "اشرح هذه النقطة" (Open deep-dive modal on any specific point)
  const handleOpenExplainPoint = (pointText?: string) => {
    if (pointText) setCustomPartText(pointText);
    setPartAction('explain');
    setPartResultText(null);
    setShowExplainPartModal(true);
  };

  // Button 3: "أعطني مثالًا" (Generate an additional practical solved problem)
  const handleRequestMoreExamples = async () => {
    if (!analysisResult) return;
    setIsAnalyzing(true);
    try {
      const payload = {
        mode: 'text',
        prompt: `المطلوب: توليد مثال تطبيقي ومسألة جديدة تماماً ومحلولة بالتفصيل لطالب سنة أولى ميكاترونكس حول درس: "${analysisResult.lessonTitle}".
المطلوب: نص المسألة، المعطيات، المطلوب، القانون، خطوات الحل بالتفصيل، والناتج النهائي بالوحدة الدولية وتفسير النتيجة.`,
        lessonTitle: analysisResult.lessonTitle,
        explanationLevel: 'simple',
        actionType: 'example',
        studentUniversity: student.university,
        studentMajor: student.major,
        studentId: student.id,
      };
      const res = await fetch('/api/explain-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        const resData = data.result || data.explanation;
        if (resData?.solvedExample) {
          setAnalysisResult((prev) => prev ? ({
            ...prev,
            solvedExample: {
              ...resData.solvedExample,
              isGenerated: true,
            },
          }) : null);
          setTimeout(() => {
            document.getElementById('section-9')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Button 4: "اختبرني" (Scroll directly to Section 14: Quick Quiz)
  const handleTestMe = () => {
    document.getElementById('section-14')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handle Level switch
  const handleSwitchLevel = (lvl: ExplainLevel) => {
    setExplanationLevel(lvl);
    handleAnalyzeLesson('full_explain', lvl);
  };

  // Handle specific part explanation
  const handleExplainSpecificPart = async () => {
    if (!customPartText.trim()) return;
    setIsPartLoading(true);
    setPartResultText(null);

    try {
      const actionLabels = {
        explain: 'اشرح هذا الجزء بأسلوب سهل ومباشر',
        simplify: 'بسّط هذا المفهوم إلى أقصى درجة ممكنة مع مثال ملموس',
        example: 'أعطني مثالاً حسابياً وتطبيقياً خطوة بخطوة على هذا الجزء',
        solve: 'حل هذه المسألة تفصيلياً مع كتابة القوانين والتعويض والناتج بوحدته',
        verify: 'تحقق من صحة هذا القانون وأبعاده الفيزيائية ووحداته الدولية',
      };

      const promptMsg = `الطالب في السنة الأولى ميكاترونكس يسأل عن هذا الجزء من الدرس:
"${customPartText}"
المطلوب منه: ${actionLabels[partAction]}
اشرح باللغة العربية الواضحة بأسلوب هندسي مبسط.`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptMsg,
          currentLessonTitle: analysisResult?.lessonTitle || 'درس ميكاترونكس',
          currentSubjectName: analysisResult?.subjectName || 'السنة الأولى',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPartResultText(data.reply || 'تم تجهيز الشرح بنجاح.');
      } else {
        setPartResultText('تعذر الحصول على شرح في الوقت الحالي.');
      }
    } catch (e) {
      setPartResultText('حدث خطأ أثناء الشرح.');
    } finally {
      setIsPartLoading(false);
    }
  };

  // Copy summary to clipboard
  const handleCopySummary = () => {
    if (!analysisResult) return;
    const text = `📚 ${analysisResult.lessonTitle} (${analysisResult.subjectName})
💡 الفكرة ببساطة:
${analysisResult.simpleIdea}

🎯 أهم المفاهيم:
${analysisResult.coreTakeaways.map((p, i) => `${i + 1}. ${p}`).join('\n')}

📐 القوانين:
${analysisResult.formulas.map((f) => `• ${f.equation}: ${f.meaning}`).join('\n')}

🧠 الخلاصة:
${analysisResult.summaryPoints.join('\n')}

منصة أكاديمية الميكاترونكس اليمنية 🎓`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-blue-800/40">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 top-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>مدرسك الجامعي الذكي والخاص</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>اشرح لي درس اليوم</span>
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                سنة أولى ميكاترونكس
              </span>
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
              🎓 <strong>ماذا درست اليوم في الجامعة؟</strong> ارفع السبورة أو صورتك من الدفتر أو ملزمتك أو اكتب السؤال وسأشرحه لك بطريقة سهلة ومختصرة خالية من التعقيد.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm w-full sm:w-auto justify-center"
            >
              <Bookmark className="w-4 h-4 text-amber-300" />
              <span>سجل دروسي ({savedLessons.length})</span>
            </button>

            {analysisResult && (
              <button
                onClick={() => setShowStudySheet(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md w-full sm:w-auto justify-center"
              >
                <FileCheck className="w-4 h-4" />
                <span>ورقة مذاكرة ليلة الامتحان</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Upload and Input Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Source Type Switcher */}
        <div className="space-y-3">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            اختر طريقة إرسال محتوى الدرس:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            
            <button
              type="button"
              onClick={() => {
                setSourceType('image');
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                sourceType === 'image'
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">📷 صورة</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">سبورة، دفتر، مسألة، دائرة</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceType('pdf');
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                sourceType === 'pdf'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">📄 ملف PDF</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">ملزمة، سلايدات، فصل</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceType('text');
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                sourceType === 'text'
                  ? 'border-cyan-600 bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">📝 كتابة النص</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">سؤال، قانون، لصق شرح</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceType('video');
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                sourceType === 'video'
                  ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">🎥 فيديو المحاضرة</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">مقطع للمحاضرة أو شرح</span>
              </div>
            </button>

          </div>
        </div>

        {/* Dynamic Upload / Text Input Box */}
        {sourceType !== 'text' ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept={
                sourceType === 'image'
                  ? 'image/*'
                  : sourceType === 'pdf'
                  ? 'application/pdf'
                  : sourceType === 'video'
                  ? 'video/*'
                  : '*/*'
              }
              className="hidden"
            />
            {sourceType === 'image' && (
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            )}

            {selectedFile ? (
              <div className="space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    الحجم: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                {filePreview && filePreview.startsWith('data:image') && (
                  <div className="max-w-xs mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                    <img src={filePreview} alt="معاينة الملف" className="w-full max-h-48 object-cover" />
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    تغيير الملف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                {/* PDF Page Selection Options */}
                {sourceType === 'pdf' && (
                  <div className="mt-3 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-3 text-right">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                      📄 خيارات شرح ملف الـ PDF:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        pdfMode === 'all'
                          ? 'bg-white dark:bg-slate-900 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="pdfMode"
                          checked={pdfMode === 'all'}
                          onChange={() => setPdfMode('all')}
                          className="text-blue-600"
                        />
                        <span>🔘 شرح الملف كاملًا</span>
                      </label>

                      <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        pdfMode === 'page'
                          ? 'bg-white dark:bg-slate-900 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="pdfMode"
                          checked={pdfMode === 'page'}
                          onChange={() => setPdfMode('page')}
                          className="text-blue-600"
                        />
                        <span>🔘 اختر صفحة/قسمًا محددًا</span>
                      </label>
                    </div>

                    {pdfMode === 'page' && (
                      <div className="pt-1 flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          رقم الصفحة أو المقطع:
                        </label>
                        <input
                          type="text"
                          value={pdfPageNumber}
                          onChange={(e) => setPdfPageNumber(e.target.value)}
                          placeholder="مثال: صفحة 4 أو صفحات 3-5"
                          className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                    اسحب الملف وأفلته هنا، أو اضغط للاختيار من جهازك
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {sourceType === 'image'
                      ? 'ندعم: صور السبورة، الدفتر، الكتاب، الملازم، والدوائر الكهربائية (JPG, PNG, WEBP)'
                      : sourceType === 'pdf'
                      ? 'ندعم: الملازم وسلايدات المحاضرات وفصول الكتب (PDF)'
                      : 'ندعم: مقاطع الفيديو ومحاضرات الزوم أو القاعات (MP4, MOV)'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>تحديد ملف من الجهاز</span>
                  </button>

                  {sourceType === 'image' && (
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>التقاط صورة بالهاتف مباشرة</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Text Input area (Always available or when text mode is active) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {sourceType === 'text' ? 'اكتب أو الصق نص الدرس أو المسألة:' : 'ملاحظات أو سؤال إضافي على الملف المرفوع (اختياري):'}
          </label>
          <div className="relative">
            <textarea
              rows={sourceType === 'text' ? 5 : 2}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                sourceType === 'text'
                  ? 'مثال: اشرح لي قانون نيوتن الثاني وكيف نطبقه لحساب تسارع ذراع الروبوت، مع مثال رقمي ووحدات القياس...'
                  : 'مثال: ركز على شرح المسألة الأخيرة في الصفحة، أو اشرح كيفية توصيل المقاومات في الصورة...'
              }
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Explanation Level Selection */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">مستوى الشرح المفضل:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'simple' as ExplainLevel, label: '🟢 مبسط جداً', desc: 'من الصفر مع تشبيهات' },
              { id: 'medium' as ExplainLevel, label: '🔵 متوسط', desc: 'مستوى جامعي' },
              { id: 'advanced' as ExplainLevel, label: '🟣 متقدم', desc: 'تطبيقات هندسية' },
              { id: 'short' as ExplainLevel, label: '🟡 اختصر أكثر', desc: 'ملخص سريع' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setExplanationLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  explanationLevel === lvl.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={lvl.desc}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Analyze Action Button */}
        <button
          type="button"
          onClick={() => handleAnalyzeLesson()}
          disabled={isAnalyzing}
          className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg ${
            isAnalyzing
              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-600/20 hover:scale-[1.005]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{PROGRESS_STAGES[progressStage] || 'جاري التحليل...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>تحليل وشرح الدرس الآن 🚀</span>
            </>
          )}
        </button>

        {/* Progress Stages Bar during analysis */}
        {isAnalyzing && (
          <div className="space-y-2 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 animate-pulse">
            <div className="flex justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
              <span>{PROGRESS_STAGES[progressStage]}</span>
              <span>{Math.round(((progressStage + 1) / PROGRESS_STAGES.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${((progressStage + 1) / PROGRESS_STAGES.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Analysis Results View */}
      {analysisResult && (
        <div ref={resultsTopRef} className="space-y-6 scroll-mt-20">
          
          {/* Result Card Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    📚 {analysisResult.subjectName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                    مستوى الشرح: {analysisResult.explanationLevel === 'simple' ? '🟢 مبسط' : analysisResult.explanationLevel === 'medium' ? '🔵 متوسط' : analysisResult.explanationLevel === 'advanced' ? '🟣 متقدم' : '🟡 مختصر'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(analysisResult.createdAt).toLocaleDateString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  📖 {analysisResult.lessonTitle}
                </h2>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => saveLessonToHistory(analysisResult)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSavedFeedback
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{isSavedFeedback ? 'تم الحفظ بنجاح!' : '⭐ حفظ الدرس'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copySuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copySuccess ? 'تم النسخ' : '📋 نسخ الملخص'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowStudySheet(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>📄 ورقة مذاكرة</span>
                </button>

                <button
                  type="button"
                  onClick={handleDidNotUnderstand}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>❓ لم أفهم</span>
                </button>
              </div>
            </div>

            {/* Clarification Warning if image was blurry */}
            {analysisResult.clarificationNotice && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">تنبيه أمانة علمية:</h4>
                  <p className="mt-0.5">{analysisResult.clarificationNotice}</p>
                </div>
              </div>
            )}

            {/* Quick Level Switchers */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                🔄 تبديل مستوى الشرح بضغطة زر:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchLevel('simple')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    analysisResult.explanationLevel === 'simple' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  🟢 شرح مبسط
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchLevel('medium')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    analysisResult.explanationLevel === 'medium' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  🔵 شرح متوسط
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchLevel('advanced')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    analysisResult.explanationLevel === 'advanced' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  🟣 شرح متقدم
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchLevel('short')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    analysisResult.explanationLevel === 'short' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  🟡 اختصر أكثر
                </button>
              </div>
            </div>

            {/* View Mode & Quick Navigation Index */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-950 border border-blue-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">نمط التدريس:</span>
                <div className="inline-flex p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('stream')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'stream'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-blue-600'
                    }`}
                  >
                    📋 التدريس الشامل (الـ 14 خطوة)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('tabs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'tabs'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-blue-600'
                    }`}
                  >
                    📑 تبويبات الأقسام
                  </button>
                </div>
              </div>

              {/* Quick Jump Index for the 14 sections */}
              {viewMode === 'stream' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-[11px] font-bold">
                  {[
                    { id: 'section-1', label: '1. العنوان' },
                    { id: 'section-2', label: '2. ببساطة' },
                    { id: 'section-3', label: '3. الأفكار' },
                    { id: 'section-4', label: '4. المفاهيم' },
                    { id: 'section-5', label: '5. المصطلحات' },
                    { id: 'section-6', label: '6. القوانين' },
                    { id: 'section-7', label: '7. الوحدات' },
                    { id: 'section-8', label: '8. الأبعاد' },
                    { id: 'section-9', label: '9. المسألة' },
                    { id: 'section-10', label: '10. الملاحظات' },
                    { id: 'section-11', label: '11. التذكر' },
                    { id: 'section-12', label: '12. الخلاصة' },
                    { id: 'section-13', label: '13. الجدارات' },
                    { id: 'section-14', label: '14. الاختبار' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-600 dark:text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stream Mode: Render 14 Ordered Sections */}
            {viewMode === 'stream' ? (
              <ExplainFourteenSections
                analysisResult={analysisResult}
                quizAnswers={quizAnswers}
                setQuizAnswers={setQuizAnswers}
                revealedQuiz={revealedQuiz}
                setRevealedQuiz={setRevealedQuiz}
                onOpenExplainPoint={handleOpenExplainPoint}
                onNavigateToTool={onNavigateToTool}
                onSimplifyMore={handleSimplifyMore}
                onRequestMoreExamples={handleRequestMoreExamples}
                onTestMe={handleTestMe}
              />
            ) : (
              <>
                {/* Navigation Tabs for Sections */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 gap-2">
                  {[
                    { id: 'explanation', label: '💡 الشرح والمفاهيم' },
                    { id: 'formulas', label: `📐 القوانين والوحدات (${analysisResult.formulas.length})` },
                    { id: 'example', label: '🧮 مثال محلول' },
                    { id: 'quiz', label: `📝 اختبر نفسك (${analysisResult.quiz.length})` },
                    { id: 'tools', label: `🛠️ أدوات مقترحة (${analysisResult.suggestedTools.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

            {/* SECTION 1: Explanation & Core Concepts */}
            {activeTab === 'explanation' && (
              <div className="space-y-6">
                
                {/* 💡 الفكرة ببساطة */}
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base sm:text-lg text-blue-900 dark:text-blue-200 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <span>الفكرة ببساطة</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPartText(analysisResult.simpleIdea);
                        setShowExplainPartModal(true);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      اشرح بتشبيه آخر
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {analysisResult.simpleIdea}
                  </p>
                </div>

                {/* 🎯 ماذا يجب أن أفهم؟ */}
                {analysisResult.coreTakeaways && analysisResult.coreTakeaways.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-xs">
                        🎯
                      </span>
                      <span>ماذا يجب أن أفهم من هذا الدرس؟</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysisResult.coreTakeaways.map((point, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3"
                        >
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-black text-xs shrink-0 flex items-center justify-center mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 📌 المصطلحات المهمة */}
                {analysisResult.terms && analysisResult.terms.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center text-xs">
                        📌
                      </span>
                      <span>المصطلحات الهندسية المهمة</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {analysisResult.terms.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-slate-900 dark:text-white text-sm">
                              {t.term}
                            </h4>
                            {t.englishTerm && (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300" dir="ltr">
                                {t.englishTerm}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {t.meaning}
                          </p>
                          {t.practicalAnalogy && (
                            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                              💡 <strong>تشبيه:</strong> {t.practicalAnalogy}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ⚠️ الأخطاء الشائعة */}
                {analysisResult.commonMistakes && analysisResult.commonMistakes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center text-xs">
                        ⚠️
                      </span>
                      <span>أخطاء شائعة يقع فيها طلاب السنة الأولى (فخاخ الامتحانات)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysisResult.commonMistakes.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2"
                        >
                          <div className="font-bold text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
                            <X className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>الخطأ: {m.mistake}</span>
                          </div>
                          <div className="font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>التصحيح: {m.correction}</span>
                          </div>
                          {m.why && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 pr-6">
                              السبب: {m.why}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🧠 الخلاصة */}
                {analysisResult.summaryPoints && analysisResult.summaryPoints.length > 0 && (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🧠 خلاصة الدرس السريعة:</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {analysisResult.summaryPoints.map((pt, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Electrical Circuit Analysis Card if present */}
                {analysisResult.circuitAnalysis?.hasCircuit && (
                  <div className="p-5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/50 space-y-3">
                    <h3 className="font-extrabold text-sm sm:text-base text-cyan-900 dark:text-cyan-200 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-cyan-500" />
                      <span>تحليل الدائرة الكهربائية المكتشفة بالصورة</span>
                    </h3>
                    {analysisResult.circuitAnalysis.circuitType && (
                      <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                        نوع الدائرة: {analysisResult.circuitAnalysis.circuitType}
                      </p>
                    )}
                    {analysisResult.circuitAnalysis.components && analysisResult.circuitAnalysis.components.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {analysisResult.circuitAnalysis.components.map((c, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs border border-cyan-100 dark:border-cyan-900">
                            <span className="text-slate-400 block text-[10px]">{c.label}</span>
                            <span className="font-black text-slate-900 dark:text-white block">{c.type}</span>
                            <span className="font-mono text-cyan-600 dark:text-cyan-400 text-[11px]">{c.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {analysisResult.circuitAnalysis.analysisSummary && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {analysisResult.circuitAnalysis.analysisSummary}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigateToTool('circuits')}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>فتح هذه الدائرة في مختبر الدوائر الكهربائية</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: Formulas, Units & Dimensions */}
            {activeTab === 'formulas' && (
              <div className="space-y-6">
                
                {/* 📐 القوانين */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-500" />
                    <span>القوانين المستخرجة وتفكيك الرموز</span>
                  </h3>

                  {analysisResult.formulas.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="font-mono text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400" dir="ltr">
                          {f.equation}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomPartText(f.equation);
                            setShowExplainPartModal(true);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold self-start sm:self-auto"
                        >
                          تحقق أو حل مسألة بهذا القانون
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {f.meaning}
                      </p>

                      {/* Symbols breakdown */}
                      {f.symbols && f.symbols.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                          <span className="text-xs font-bold text-slate-500 block mb-2">تفكيك رموز القانون:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {f.symbols.map((sym, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-black text-blue-600 text-sm" dir="ltr">
                                    {sym.symbol}
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {sym.name}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>الوحدة: {sym.unit}</span>
                                  {sym.dimension && <span className="font-mono" dir="ltr">[{sym.dimension}]</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 📏 الوحدات الدولية SI */}
                {analysisResult.units && analysisResult.units.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-emerald-500" />
                      <span>جدول الوحدات الدولية (SI Units) للدرس</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {analysisResult.units.map((u, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-xs"
                        >
                          <span className="text-[11px] text-slate-500 block">{u.quantity}</span>
                          <span className="font-black text-sm text-slate-900 dark:text-white block">{u.unitName}</span>
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 block" dir="ltr">
                            {u.unitSymbol}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🔬 الأبعاد الفيزيائية Dimensional Analysis */}
                {analysisResult.dimensions && analysisResult.dimensions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Atom className="w-5 h-5 text-purple-500" />
                      <span>تحليل الأبعاد الفيزيائية [M, L, T, I]</span>
                    </h3>
                    <div className="space-y-3">
                      {analysisResult.dimensions.map((d, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="font-bold text-sm text-purple-900 dark:text-purple-200">
                              {d.quantity}
                            </span>
                            <span className="font-mono font-black text-sm text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-purple-200 dark:border-purple-800" dir="ltr">
                              {d.dimensionStr}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {d.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: Solved Example */}
            {activeTab === 'example' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-500" />
                    <span>مسألة ومثال محلول خطوة بخطوة</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    analysisResult.solvedExample?.isGenerated
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {analysisResult.solvedExample?.isGenerated ? '💡 مثال تعليمي إضافي' : '📄 من ملف الطالب مباشرة'}
                  </span>
                </div>

                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5">
                  
                  {/* Problem statement */}
                  <div className="space-y-2">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-wider block">نص المسألة:</span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      {analysisResult.solvedExample?.problem}
                    </p>
                  </div>

                  {/* Given data & Required */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-500 block">المعطيات (Given):</span>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                        {(analysisResult.solvedExample?.given || []).map((g, idx) => (
                          <li key={idx}>{g}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-500 block">المطلوب (Required):</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {analysisResult.solvedExample?.required}
                      </p>
                      {analysisResult.solvedExample?.formulaUsed && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-blue-600 font-mono" dir="ltr">
                          Formula: {analysisResult.solvedExample.formulaUsed}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">خطوات الحل التفصيلية:</span>
                    <div className="space-y-2.5">
                      {(analysisResult.solvedExample?.steps || []).map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3"
                        >
                          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs shrink-0 flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Answer */}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">الناتج النهائي (Final Answer):</span>
                      <span className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-100">
                        {analysisResult.solvedExample?.finalAnswer}
                      </span>
                    </div>
                  </div>

                  {/* Engineering Note */}
                  {analysisResult.solvedExample?.note && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300">
                      💡 <strong>نصيحة مهندس:</strong> {analysisResult.solvedExample.note}
                    </div>
                  )}
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPartText('أعطني مثالاً حسابياً جديداً ومختلفاً بمستويات مختلفة عن نفس الدرس');
                      setPartAction('example');
                      setShowExplainPartModal(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>توليد مثال وحل مسألة إضافية</span>
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 4: Interactive Quiz */}
            {activeTab === 'quiz' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-500" />
                    <span>اختبر نفسك في مفاهيم درس اليوم</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {analysisResult.quiz.length} أسئلة قصيرة وسريعة
                  </span>
                </div>

                <div className="space-y-4">
                  {analysisResult.quiz.map((q, idx) => {
                    const selected = quizAnswers[q.id];
                    const isRevealed = revealedQuiz[q.id];
                    const isCorrect = String(selected).trim() === String(q.correctAnswer).trim();

                    return (
                      <div
                        key={q.id || idx}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-black text-xs shrink-0 flex items-center justify-center mt-0.5">
                              {idx + 1}
                            </span>
                            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                              {q.question}
                            </h4>
                          </div>
                        </div>

                        {/* Options */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selected === opt;
                              const isThisCorrect = opt === q.correctAnswer;

                              let btnClasses = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 text-slate-800 dark:text-slate-200';
                              if (isRevealed) {
                                if (isThisCorrect) {
                                  btnClasses = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold';
                                } else if (isThisSelected && !isCorrect) {
                                  btnClasses = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 line-through';
                                }
                              } else if (isThisSelected) {
                                btnClasses = 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold';
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={isRevealed}
                                  onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                  className={`p-3 rounded-xl border text-right text-xs sm:text-sm transition-all cursor-pointer ${btnClasses}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Check Answer Button & Explanation */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {!isRevealed ? (
                            <button
                              type="button"
                              disabled={selected === undefined}
                              onClick={() => setRevealedQuiz((prev) => ({ ...prev, [q.id]: true }))}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                selected !== undefined
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              تحقق من إجابتي
                            </button>
                          ) : (
                            <div className="w-full space-y-2">
                              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              }`}>
                                {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                                <span>{isCorrect ? 'إجابة صحيحة وممتازة! أحسنت يا باشمهندس.' : `إجابة غير دقيقة. الإجابة الصحيحة هي: "${q.correctAnswer}"`}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pr-2">
                                💡 <strong>التفسير:</strong> {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 5: Suggested Tools on the Platform */}
            {activeTab === 'tools' && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-indigo-500" />
                  <span>أدوات المنصة الموصى بها لهذا الدرس</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analysisResult.suggestedTools.map((tool, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          {tool.title}
                        </h4>
                        <span className="text-xs text-slate-400">{tool.subtitle}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {tool.reason}
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigateToTool(tool.toolId, { lessonTitle: analysisResult.lessonTitle })}
                        className="w-full py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>فتح الأداة وتجربة الحسابات الآن</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}

          </div>

          {/* Persistent Interactive 4 Action Buttons Bar (Always accessible) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-600/30 text-blue-400">🤖</span>
              <div>
                <span className="font-black text-sm block">المدرس الذكي جاهز لمساعدتك في أي لحظة:</span>
                <span className="text-xs text-slate-400 block">اضغط على أي زر أدناه للتفاعل الفوري مع محتوى هذا الدرس</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleSimplifyMore}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بسّط لي أكثر</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenExplainPoint()}
                className="px-3.5 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>اشرح هذه النقطة</span>
              </button>

              <button
                type="button"
                onClick={handleRequestMoreExamples}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>أعطني مثالاً</span>
              </button>

              <button
                type="button"
                onClick={handleTestMe}
                className="px-3.5 py-2.5 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>اختبرني</span>
              </button>
            </div>
          </div>

          {/* Section: Select Specific Part to Explain */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>هل تحتاج للتركيز على قانون أو جزء محدد فقط؟</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                حدد أي فقرة أو مسألة واطلب: اشرح، بسّط، أعطني مثالاً، أو تحقق من القانون.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomPartText('');
                setShowExplainPartModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shrink-0 transition-all cursor-pointer"
            >
              شرح جزء محدد من الدرس
            </button>
          </div>
        </div>
      )}

      {/* 4. MODAL: Study Sheet / Cheat Sheet (ورقة مذاكرة ليلة الامتحان) */}
      {showStudySheet && analysisResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    ورقة مذاكرة ليلة الاختبار 📄
                  </h3>
                  <p className="text-xs text-slate-500">
                    ملخص مكثف ومنظم للمراجعة السريعة قبل امتحانات الفصل
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStudySheet(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 print:p-0">
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                <ReactMarkdown>
                  {analysisResult.studySheetMarkdown || `
# ورقة مذاكرة سريعة: ${analysisResult.lessonTitle}
**المادة:** ${analysisResult.subjectName} | **المستوى:** السنة الأولى هندسة ميكاترونكس

---
### 💡 الفكرة الأساسية:
${analysisResult.simpleIdea}

### 🎯 أهم المفاهيم:
${analysisResult.coreTakeaways.map((p, i) => `- **${i + 1}.** ${p}`).join('\n')}

### 📐 جدول القوانين ووحدات القياس:
| القانون | المعنى | الوحدات الدولية |
| :--- | :--- | :--- |
${analysisResult.formulas.map((f) => `| \`${f.equation}\` | ${f.meaning} | SI Units |`).join('\n')}

### ⚠️ فخاخ شائعة تجنبها:
${analysisResult.commonMistakes.map((m) => `- ❌ **الخطأ:** ${m.mistake}\n  - ✅ **التصحيح:** ${m.correction}`).join('\n')}

### 🧠 ملخص ليلة الامتحان:
${analysisResult.summaryPoints.map((s) => `- ${s}`).join('\n')}
                  `}
                </ReactMarkdown>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة أو حفظ PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(analysisResult.studySheetMarkdown || '');
                  alert('تم نسخ ورقة المذاكرة إلى الحافظة!');
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ النص كاملاً</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Explain Specific Part */}
      {showExplainPartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                شرح جزء أو قانون محدد 🎯
              </h3>
              <button
                type="button"
                onClick={() => setShowExplainPartModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                الصق النص أو القانون أو المسألة التي تريد التركيز عليها:
              </label>
              <textarea
                rows={3}
                value={customPartText}
                onChange={(e) => setCustomPartText(e.target.value)}
                placeholder="اكتب هنا القانون أو الفقرة..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Quick Chips from Current Lesson */}
            {analysisResult && (analysisResult.formulas?.length > 0 || analysisResult.conceptExplanations?.length > 0) && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">اختر نقطة أو قانوناً من الدرس بضغطة زر:</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {analysisResult.formulas?.map((f, i) => (
                    <button
                      key={`f-${i}`}
                      type="button"
                      onClick={() => setCustomPartText(`قانون: ${f.equation} (${f.meaning})`)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      {f.equation}
                    </button>
                  ))}
                  {analysisResult.conceptExplanations?.map((c, i) => (
                    <button
                      key={`c-${i}`}
                      type="button"
                      onClick={() => setCustomPartText(`مفهوم: ${c.concept}`)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      {c.concept}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ماذا تريد من المعلم الذكي أن يفعل؟
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'explain', label: 'اشرح' },
                  { id: 'simplify', label: 'بسّط أكثر' },
                  { id: 'example', label: 'أعطني مثالاً' },
                  { id: 'solve', label: 'حل المسألة' },
                  { id: 'verify', label: 'تحقق من القانون' },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setPartAction(act.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      partAction === act.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {partResultText && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                <ReactMarkdown>{partResultText}</ReactMarkdown>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExplainPartModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={handleExplainSpecificPart}
                disabled={isPartLoading || !customPartText.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {isPartLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>ابدأ الشرح</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Student Explained Lessons History (سجل دروسي التي شرحتها) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  سجل دروسي التي شرحتها ({savedLessons.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {savedLessons.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Bookmark className="w-10 h-10 mx-auto stroke-1" />
                  <p className="text-sm font-bold">لم تقم بحفظ أي درس بعد.</p>
                  <p className="text-xs">أي درس تقوم بتحليله سيظهر هنا تلقائياً لتتمكن من الرجوع إليه في أي وقت.</p>
                </div>
              ) : (
                savedLessons.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      setAnalysisResult(l);
                      setShowHistoryModal(false);
                      resultsTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {l.subjectName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(l.createdAt).toLocaleDateString('ar-YE')}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {l.lessonTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {l.simpleIdea}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => deleteLessonFromHistory(l.id, e)}
                        className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 cursor-pointer"
                        title="حذف من السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
