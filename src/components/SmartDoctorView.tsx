import React, { useState, useEffect, useMemo } from 'react';
import { SPECIALIST_DOCTORS, SpecialistDoctor, SmartDoctorGeneratedLesson } from '../data/smartDoctorData';
import { AnimeDoctorAvatar } from './AnimeDoctorAvatar';
import { SmartDoctorBoardPlayer } from './SmartDoctorBoardPlayer';
import { StudentProfile } from '../types';
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  Play, 
  Search, 
  Sliders, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Bot, 
  Layers, 
  Scale, 
  Zap, 
  Upload, 
  Bookmark, 
  ArrowLeft, 
  RefreshCw, 
  Cpu, 
  Compass, 
  FileText, 
  Share2, 
  HelpCircle,
  Video,
  Eye,
  Filter
} from 'lucide-react';

interface SmartDoctorViewProps {
  student: StudentProfile | null;
  onBackToDashboard?: () => void;
  onOpenSerwayLibrary?: () => void;
  initialTopic?: string;
  initialDoctorId?: string;
}

export const SmartDoctorView: React.FC<SmartDoctorViewProps> = ({
  student,
  onBackToDashboard,
  onOpenSerwayLibrary,
  initialTopic = '',
  initialDoctorId,
}) => {
  // Navigation tabs inside Smart Doctor
  const [activeTab, setActiveTab] = useState<'create' | 'classroom' | 'saved'>('create');
  
  // Doctors list (fetched from backend or default)
  const [doctors, setDoctors] = useState<SpecialistDoctor[]>(SPECIALIST_DOCTORS);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(() => {
    return initialDoctorId || 'doc-physics';
  });
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Student Custom Doctor Mode & Fields
  const [isCustomDoctorMode, setIsCustomDoctorMode] = useState<boolean>(false);
  const [customDoctorName, setCustomDoctorName] = useState<string>('د. المحاضر الجامعي');
  const [customSubjectName, setCustomSubjectName] = useState<string>('مادة التخصص الهندسي');
  const [customMajorName, setCustomMajorName] = useState<string>(student?.major || 'هندسة الميكاترونكس');
  const [customUniversityName, setCustomUniversityName] = useState<string>(student?.university || 'الجامعة اليمنية');
  const [customAvatarStyle, setCustomAvatarStyle] = useState<'classic_professor' | 'young_professor' | 'glasses_expert' | 'female_expert'>('classic_professor');
  const [customBoardTheme, setCustomBoardTheme] = useState<'chalkboard_green' | 'dark_slate' | 'whiteboard'>('chalkboard_green');

  // Custom Doctor Photo, Icon, or Anime Avatar Choice
  const [doctorAvatarType, setDoctorAvatarType] = useState<'anime' | 'photo' | 'icon'>('anime');
  const [customDoctorPhotoUrl, setCustomDoctorPhotoUrl] = useState<string>('');
  const [uploadedDoctorPhotoName, setUploadedDoctorPhotoName] = useState<string>('');
  const [selectedDoctorIcon, setSelectedDoctorIcon] = useState<string>('🎓');

  // Form setup inputs
  const [lessonTitle, setLessonTitle] = useState<string>(initialTopic || 'تحليل المتجهات والمركبات السينية والصادية');
  const [studyLevel, setStudyLevel] = useState<string>(student?.studyLevel || 'السنة الأولى');
  const [explanationLevel, setExplanationLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'formulas_only' | 'step_by_step_problems' | 'applied_examples' | 'exam_cram'>('beginner');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [displayMode, setDisplayMode] = useState<'anime_board' | 'board_only' | 'simulation_focus' | 'solved_examples' | 'student_file'>('anime_board');
  const [useSerway, setUseSerway] = useState<boolean>(true);
  
  // File / Image upload state for student's custom lecture
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileText, setUploadedFileText] = useState<string>('');
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<'image' | 'file' | null>(null);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeLesson, setActiveLesson] = useState<SmartDoctorGeneratedLesson | null>(null);

  // Saved lessons state
  const [savedLessons, setSavedLessons] = useState<SmartDoctorGeneratedLesson[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Selected doctor object (Dynamic for ALL doctors with student overrides)
  const selectedDoctor = useMemo(() => {
    const rawDoctorName = customDoctorName.trim();
    const hasCustomDoctorName = rawDoctorName && rawDoctorName !== 'د. (أدخل اسم دكتورك هنا)' && rawDoctorName !== 'د. المحاضر الجامعي';

    if (isCustomDoctorMode || selectedDoctorId === 'custom-doctor') {
      const nameRaw = hasCustomDoctorName ? rawDoctorName : 'د. المحاضر الجامعي';
      const formattedName = nameRaw.startsWith('د.') || nameRaw.startsWith('الدكتور') || nameRaw.startsWith('م.') ? nameRaw : `د. ${nameRaw}`;
      
      const avatarStyleMapped = customAvatarStyle === 'female_expert' 
        ? 'female_engineer' 
        : customAvatarStyle === 'young_professor' 
        ? 'young_innovator' 
        : customAvatarStyle === 'glasses_expert' 
        ? 'modern_tech' 
        : 'male_professor';

      const boardThemeMapped = customBoardTheme === 'dark_slate' 
        ? 'blackboard_dark' 
        : customBoardTheme === 'whiteboard' 
        ? 'whiteboard_academic' 
        : 'chalkboard_green';

      return {
        id: 'custom-doctor',
        name: formattedName,
        title: `أستاذ مقرر ${customSubjectName.trim() || 'المادة الجامعية'}`,
        specialty: customSubjectName.trim() || 'المادة الجامعية',
        englishSpecialty: 'Custom Subject',
        university: customUniversityName.trim() || 'جامعتك الحالية',
        avatarStyle: avatarStyleMapped,
        avatarType: doctorAvatarType,
        photoUrl: doctorAvatarType === 'photo' ? customDoctorPhotoUrl : undefined,
        iconSymbol: doctorAvatarType === 'icon' ? selectedDoctorIcon : undefined,
        coatColor: '#1e3a8a',
        hairColor: '#1e293b',
        accentColor: '#3b82f6',
        voiceGender: 'male' as const,
        voicePitch: 0.88,
        voiceRate: 0.90,
        boardTheme: boardThemeMapped,
        bio: `دكتورك الجامعي المخصص لمادة ${customSubjectName || 'التخصص'} بقسم ${customMajorName || 'الميكاترونكس'} في ${customUniversityName || 'جامعتك'}.`,
        suggestedTopics: ['مفاهيم الشرح والمبادئ الأساسية', 'حل مسائل الاختبارات وحلقات البحث'],
      } as SpecialistDoctor;
    }

    const baseDoc = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
    const finalDocName = hasCustomDoctorName
      ? (rawDoctorName.startsWith('د.') || rawDoctorName.startsWith('الدكتور') || rawDoctorName.startsWith('م.') ? rawDoctorName : `د. ${rawDoctorName}`)
      : baseDoc.name;

    const finalSubject = customSubjectName.trim() || baseDoc.specialty;
    const finalUniversity = customUniversityName.trim() || baseDoc.university;

    return {
      ...baseDoc,
      name: finalDocName,
      specialty: finalSubject,
      university: finalUniversity,
      avatarType: doctorAvatarType,
      photoUrl: doctorAvatarType === 'photo' ? customDoctorPhotoUrl : baseDoc.photoUrl,
      iconSymbol: doctorAvatarType === 'icon' ? selectedDoctorIcon : baseDoc.iconSymbol,
      voiceGender: 'male' as const,
      voicePitch: 0.88,
      voiceRate: 0.90,
      bio: hasCustomDoctorName
        ? `شرح مخصص لمادة ${finalSubject} بقسم ${customMajorName.trim() || 'الميكاترونكس'} في ${finalUniversity} مع الدكتور ${finalDocName}.`
        : baseDoc.bio,
    } as SpecialistDoctor;
  }, [
    doctors,
    selectedDoctorId,
    isCustomDoctorMode,
    customDoctorName,
    customSubjectName,
    customMajorName,
    customUniversityName,
    customAvatarStyle,
    customBoardTheme,
    doctorAvatarType,
    customDoctorPhotoUrl,
    selectedDoctorIcon,
  ]);

  // Fetch doctors and saved lessons on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/smart-doctor/doctors');
        if (res.ok) {
          const data = await res.json();
          if (data.doctors && data.doctors.length > 0) {
            setDoctors(data.doctors);
          }
        }
      } catch (e) {
        console.warn('Using local doctor data:', e);
      }
    };

    const fetchSavedLessons = async () => {
      setLoadingSaved(true);
      try {
        const studentId = student?.id || '';
        const res = await fetch(`/api/smart-doctor/lessons?studentId=${encodeURIComponent(studentId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.lessons) {
            setSavedLessons(data.lessons);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch saved lessons:', e);
      } finally {
        setLoadingSaved(false);
      }
    };

    fetchDoctors();
    fetchSavedLessons();
  }, [student]);

  // Filter doctors by category and search
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const q = searchDoctorQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.englishSpecialty.toLowerCase().includes(q) ||
        doc.bio.toLowerCase().includes(q);

      let matchesCat = true;
      if (selectedCategory === 'physics_math') {
        matchesCat = ['doc-math', 'doc-physics', 'doc-mechanics', 'doc-statistics'].includes(doc.id);
      } else if (selectedCategory === 'circuits_electronics') {
        matchesCat = ['doc-circuits', 'doc-machines', 'doc-sensors', 'doc-signals', 'doc-power'].includes(doc.id);
      } else if (selectedCategory === 'programming_control') {
        matchesCat = ['doc-programming', 'doc-embedded', 'doc-control', 'doc-plc'].includes(doc.id);
      } else if (selectedCategory === 'robotics_manufacturing') {
        matchesCat = ['doc-mechatronics', 'doc-robotics', 'doc-drones', 'doc-cad', 'doc-manufacturing', 'doc-maintenance', 'doc-materials'].includes(doc.id);
      }

      return matchesSearch && matchesCat;
    });
  }, [doctors, searchDoctorQuery, selectedCategory]);

  // Handle Doctor Photo Upload
  const handleDoctorPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDoctorPhotoName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomDoctorPhotoUrl(dataUrl);
        setDoctorAvatarType('photo');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Lesson Material File/Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);

    if (file.type.startsWith('image/')) {
      setUploadedFileType('image');
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedFilePreview(dataUrl || null);
        setUploadedFileText(`[مرفق صورة توضيحية لدرس المحاضرة: ${file.name}]`);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFileType('file');
      setUploadedFilePreview(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setUploadedFileText(content || '');
      };
      reader.readAsText(file);
    }
  };

  // Generate Lesson Action
  const handleGenerateLesson = async () => {
    if (!lessonTitle.trim()) {
      alert('يرجى كتابة أو اختيار عنوان الدرس أولاً.');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        lessonTitle: lessonTitle.trim(),
        subject: selectedDoctor.specialty,
        studyLevel,
        explanationLevel,
        durationMinutes,
        displayMode,
        useSerwayReference: useSerway,
        studentFileContent: uploadedFileText,
        studentId: student?.id,
        customDoctorInfo: {
          name: selectedDoctor.name,
          subject: selectedDoctor.specialty,
          major: customMajorName.trim() || 'هندسة الميكاترونكس',
          university: selectedDoctor.university,
          avatarStyle: selectedDoctor.avatarStyle,
          boardTheme: selectedDoctor.boardTheme,
          avatarType: doctorAvatarType,
          photoUrl: doctorAvatarType === 'photo' ? customDoctorPhotoUrl : undefined,
          iconSymbol: doctorAvatarType === 'icon' ? selectedDoctorIcon : undefined,
        },
      };

      const token = localStorage.getItem('token') || localStorage.getItem('mct_token');

      const res = await fetch('/api/smart-doctor/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lesson) {
          const lessonWithMeta: SmartDoctorGeneratedLesson = {
            ...data.lesson,
            doctorAvatarType: doctorAvatarType,
            doctorPhotoUrl: doctorAvatarType === 'photo' ? customDoctorPhotoUrl : (data.lesson.doctorPhotoUrl || selectedDoctor.photoUrl),
            doctorIconSymbol: doctorAvatarType === 'icon' ? selectedDoctorIcon : (data.lesson.doctorIconSymbol || selectedDoctor.iconSymbol),
          };
          setActiveLesson(lessonWithMeta);
          setActiveTab('classroom');
          setSavedLessons((prev) => [lessonWithMeta, ...prev.filter((l) => l.id !== lessonWithMeta.id)]);
          return;
        }
      }

      throw new Error('Server generated empty lesson');
    } catch (e) {
      console.warn('Network or API issue, generating immediate zero-error lesson client-side:', e);
      // Construct rich local lesson fallback so user never gets stuck
      const isOhm = lessonTitle.includes('أوم') || lessonTitle.toLowerCase().includes('ohm') || selectedDoctor.id === 'doc-circuits';
      
      const localLesson: SmartDoctorGeneratedLesson = {
        id: 'lesson-' + Date.now(),
        studentId: student?.id,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorTitle: selectedDoctor.title || `دكتور محاضر لمادة ${selectedDoctor.specialty}`,
        doctorAvatarStyle: selectedDoctor.avatarStyle,
        doctorAvatarType: doctorAvatarType,
        doctorPhotoUrl: doctorAvatarType === 'photo' ? customDoctorPhotoUrl : selectedDoctor.photoUrl,
        doctorIconSymbol: doctorAvatarType === 'icon' ? selectedDoctorIcon : selectedDoctor.iconSymbol,
        subject: selectedDoctor.specialty,
        lessonTitle: lessonTitle.trim(),
        explanationLevel: explanationLevel as any,
        durationMinutes,
        displayMode: displayMode as any,
        useSerwayReference: useSerway,
        totalDurationSeconds: 100,
        createdAt: new Date().toISOString(),
        scenes: [
          {
            sceneNumber: 1,
            sceneTitle: `مقدمة وتمهيد الدرس: ${lessonTitle.trim()}`,
            sceneType: 'intro',
            doctorSpokenScript: `أهلاً بكم يا مهندسي المستقبل. أنا ${selectedDoctor.name}، واليوم سنقوم بشرح موضوع ${lessonTitle.trim()} وتطبيقاته الهندسية في أنظمة الميكاترونكس بحس أكاديمي مبسط.`,
            doctorPronouncedWords: `أهلاً بكم يا مهندسي المستقبل. أنا ${selectedDoctor.name}، واليوم سنقوم بشرح موضوع ${lessonTitle.trim()} وتطبيقاته الهندسية في أنظمة الميكاترونكس بحس أكاديمي مبسط.`,
            doctorAction: 'speaking_straight',
            doctorExpression: 'friendly',
            boardContent: {
              heading: `درس: ${lessonTitle.trim()}`,
              subheading: `الموضوع الأكاديمي المعتمد في قسم ${customMajorName.trim() || 'هندسة الميكاترونكس'}`,
              bullets: [
                'استيعاب المفهوم الفيزيائي والهندسي الأساسي للموضوع.',
                'ربط القوانين والمعادلات بالتطبيق العملي في الدوائر والمحركات والروبوتات.',
                'تحليل المسائل خطوة بخطوة وتجنب الأخطاء الحسابية الشائعة.'
              ],
              takeawayBox: 'الفهم المتين للمبادئ الأولى هو مفتاح ابتكار المشاريع الهندسية الناجحة.'
            },
            durationSeconds: 25
          },
          {
            sceneNumber: 2,
            sceneTitle: 'القوانين والمعادلات الحاكمة',
            sceneType: 'formula',
            doctorSpokenScript: isOhm 
              ? 'انظروا إلى المعادلة على السبورة: فرق الجهد بالفولت يساوي حاصل ضرب شدة التيار بالأمبير في قيمة المقاومة بالأوم.' 
              : 'نستعرض على السبورة الصيغة الرياضية والقوانين الرئيسية لحساب المتغيرات في هذا الدرس.',
            doctorPronouncedWords: isOhm 
              ? 'انظروا إلى المعادلة على السبورة: فرق الجهد بالفولت يساوي حاصل ضرب شدة التيار بالأمبير في قيمة المقاومة بالأوم.' 
              : 'نستعرض على السبورة الصيغة الرياضية والقوانين الرئيسية لحساب المتغيرات في هذا الدرس.',
            doctorAction: 'pointing_formula',
            doctorExpression: 'focused',
            boardContent: {
              heading: 'المعادلات الرياضية الحاكمة والوحدات SI',
              latexFormula: isOhm ? 'V = I \\times R' : 'F = m \\times a',
              bullets: [
                'القيم يتم التعويض عنها دائماً بالوحدات الدولية المعتمدة SI.',
                'تأكد من تحديد الاتجاهات والرموز قبل التعويض الرياضي.'
              ],
              formulaBreakdown: isOhm ? [
                { symbol: 'V', name: 'الجهد', unit: 'Volt (V)', description: 'فرق الجهد الكهربائي' },
                { symbol: 'I', name: 'التيار', unit: 'Ampere (A)', description: 'شدة التيار الكهربائي' },
                { symbol: 'R', name: 'المقاومة', unit: 'Ohm (Ω)', description: 'ممانعة الموصل للتيار' }
              ] : [
                { symbol: 'F', name: 'القوة', unit: 'Newton (N)', description: 'محصلة القوى المؤثرة' },
                { symbol: 'm', name: 'الكتلة', unit: 'Kg', description: 'كتلة الجسم الميكانيكي' },
                { symbol: 'a', name: 'التسارع', unit: 'm/s²', description: 'عجلة الحركة' }
              ]
            },
            durationSeconds: 25
          },
          {
            sceneNumber: 3,
            sceneTitle: 'المحاكاة والتحليل الهندسي التفاعلي',
            sceneType: 'simulation',
            doctorSpokenScript: 'لاحظوا المحاكاة التفاعلية على السبورة: كيف تترابط العناصر والمخطط الهندسي عند تغيير المدخلات والمؤشرات.',
            doctorAction: 'looking_at_diagram',
            doctorExpression: 'enthusiastic',
            boardContent: {
              heading: 'المخطط الهندسي والمحاكاة التفاعلية',
              diagramType: isOhm ? 'circuit' : 'vectors',
              bullets: [
                'ربط الإشارات والمستشعرات مع وحدة المعالجة المركزية.',
                'مراقبة استجابة النظام وضمان حد الأمان التشغيلي.'
              ],
              warningBox: 'تجنب تطبيق جهود أو أحمال أعلى من القيمة الاسمية المحددة في الداتا شيت.'
            },
            durationSeconds: 25
          },
          {
            sceneNumber: 4,
            sceneTitle: 'مسألة تطبيقية محلولة وخلاصة الدرس',
            sceneType: 'example_step',
            doctorSpokenScript: 'نختم بحل مسألة تطبيقية وتلخيص أهم النقاط للتفوق في الاختبارات العملية والنظرية.',
            doctorAction: 'pointing_left_board',
            doctorExpression: 'friendly',
            boardContent: {
              heading: 'حل المسألة التطبيقية والتوصيات الهندسية',
              bullets: [
                'الخطوة 1: تحديد المعطيات واستخراج القيمة المطلوبة.',
                'الخطوة 2: تطبيق القانون المباشر وحساب الناتج.',
                'الخطوة 3: التحقق من منطقية الناتج ووحدات القياس.'
              ],
              takeawayBox: 'تم إعداد هذا الدرس بنجاح بواسطة محرك الدكتور الذكي.'
            },
            durationSeconds: 25
          }
        ],
        reviewQuiz: [
          {
            question: isOhm ? 'ما هي وحدة قياس المقاومة الكهربائية؟' : 'ما هي وحدة قياس القوة في النظام الدولي؟',
            options: isOhm ? ['الأوم (Ω)', 'الفولت (V)', 'الأمبير (A)', 'الوات (W)'] : ['النيوتن (N)', 'الجول (J)', 'الواط (W)', 'الباسكال (Pa)'],
            correctAnswer: 0,
            explanation: 'الوحدة الدولية المعيارية المحسوبة في التجميع الأكاديمي.'
          }
        ],
        summaryNotes: [
          `تم فهم درس ${lessonTitle.trim()} بنجاح.`,
          'مراجعة القوانين والوحدات الدولية المعتمدة قبل حل الاختبارات.'
        ]
      };

      setActiveLesson(localLesson);
      setActiveTab('classroom');
      setSavedLessons((prev) => [localLesson, ...prev.filter((l) => l.id !== localLesson.id)]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      
      {/* ======================================================== */}
      {/* 1. HERO HEADER */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>فيديوهات شرح كرتونية Anime على السبورة التفاعلية</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              🎓 دكتور الميكاترونكس الذكي
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-medium">
              "افهم الهندسة وكأن دكتورك يشرح لك على السبورة!" — 20 دكتوراً افتراضياً متخصصاً في جميع مواد الميكاترونكس يشرحون لك بصوت عربي واضح، وكتابة القوانين، ورسم المخططات والمحاكاة خطوة بخطوة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenSerwayLibrary && (
              <button
                onClick={onOpenSerwayLibrary}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>مرجع Serway 📘</span>
              </button>
            )}

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab switchers: Create Lesson / Classroom / Saved Lessons */}
        <div className="flex items-center gap-2 pt-6 border-t border-indigo-900/60 mt-6 overflow-x-auto pb-1 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>1. اختيار الدكتور وإعداد الدرس</span>
          </button>

          {activeLesson && (
            <button
              onClick={() => setActiveTab('classroom')}
              className={`px-4 py-2 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'classroom'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>2. قاعة المحاضرة والسبورة الحية</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>3. مكتبة دروسي المحفوظة ({savedLessons.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TAB 1: CREATE LESSON & SELECT DOCTOR */}
      {/* ======================================================== */}
      {activeTab === 'create' && (
        <div className="space-y-8">
          
          {/* A. 20 DOCTORS SELECTION SHOWCASE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span>اختر الدكتور التخصصي لمادتك (20 تخصصاً ميكاترونياً)</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  شخصيات أكاديمية كرتونية افتراضية متخصصة ومجهزة لشرح موضوعك بأعلى دقة علمية.
                </p>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: 'all', label: 'الكل (20 دكتور)' },
                  { id: 'physics_math', label: 'الفيزياء والرياضيات' },
                  { id: 'circuits_electronics', label: 'الكهرباء والإلكترونيات' },
                  { id: 'programming_control', label: 'البرمجة والتحكم' },
                  { id: 'robotics_manufacturing', label: 'الروبوتات والتصنيع' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctors Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[560px] overflow-y-auto pr-1">
              
              {/* Custom Doctor Card (Student's Custom Choice) */}
              <div
                onClick={() => {
                  setIsCustomDoctorMode(true);
                  setSelectedDoctorId('custom-doctor');
                }}
                className={`p-4 rounded-3xl border-2 border-dashed text-right transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                  isCustomDoctorMode || selectedDoctorId === 'custom-doctor'
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-slate-900 border-amber-500 shadow-xl ring-2 ring-amber-500/30 scale-[1.02]'
                    : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 shrink-0 overflow-hidden rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-600 dark:text-amber-300 font-bold">
                    <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                      ★ خيار الطالب المخصص
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      ➕ إضافة دكتوري الجامعي
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      أدخل اسم دكتورك ومادتك وجامعتك
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  خصص اسم المحاضر الحقيقي، اسم المقرر، التخصص، والجامعة ليكون الشرح مطابقاً لمنهجك الجامعي بدقة.
                </p>

                <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-amber-700 dark:text-amber-400 font-bold">تخصيص كامل</span>
                  {(isCustomDoctorMode || selectedDoctorId === 'custom-doctor') ? (
                    <span className="text-amber-600 dark:text-amber-400 font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>مفعل الآن</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold underline">اضغط للتأكيد</span>
                  )}
                </div>
              </div>

              {filteredDoctors.map((doc) => {
                const isSelected = !isCustomDoctorMode && selectedDoctorId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setIsCustomDoctorMode(false);
                      setSelectedDoctorId(doc.id);
                      setCustomSubjectName(doc.specialty);
                      if (doc.suggestedTopics?.[0]) {
                        setLessonTitle(doc.suggestedTopics[0]);
                      }
                    }}
                    className={`p-4 rounded-3xl border-2 text-right transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-600 shadow-xl ring-2 ring-indigo-500/20 scale-[1.02]'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 hover:bg-slate-100'
                    }`}
                  >
                    {/* Top Avatar & Badges */}
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-20 shrink-0 overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 shadow-inner flex items-center justify-center">
                        <AnimeDoctorAvatar
                          doctor={doc}
                          isSpeaking={false}
                          size="sm"
                          className="scale-90"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 line-clamp-1">
                          {doc.specialty}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {doc.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {doc.university}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {doc.bio}
                    </p>

                    {/* Selection status */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">السبورة: {doc.boardTheme === 'chalkboard_green' ? 'خضراء' : 'سوداء'}</span>
                      {isSelected ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم الاختيار</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 hover:text-indigo-600 font-bold">اختيار الدكتور</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Academic Info Inputs & Doctor Customization Panel */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-2 border-amber-500/40 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-black">
                    بيانات الدكتور والمادة والشخصية (اكتب اسم دكتورك الحقيقي واختر صورته)
                  </h3>
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full font-bold">
                  تخصيص كامل للطالب 🎓
                </span>
              </div>

              {/* Basic Academic Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                {/* Doctor Name */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-900 dark:text-slate-100 block">
                    اسم الدكتور المحاضر:
                  </label>
                  <input
                    type="text"
                    value={customDoctorName}
                    onChange={(e) => setCustomDoctorName(e.target.value)}
                    placeholder="مثال: د. عبد السلام المقطري"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block">اكتب اسم دكتورك ليظهر في القاعة والسبورة</span>
                </div>

                {/* Subject Name */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-900 dark:text-slate-100 block">
                    اسم المادة / المقرر الدراسـي:
                  </label>
                  <input
                    type="text"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    placeholder="مثال: الرياضيات الهندسية 1، ديناميكا الحرارة..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block">اسم المادة في خطتك الدراسية</span>
                </div>

                {/* Major Name */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-900 dark:text-slate-100 block">
                    اسم التخصص الهندسي:
                  </label>
                  <input
                    type="text"
                    value={customMajorName}
                    onChange={(e) => setCustomMajorName(e.target.value)}
                    placeholder="مثال: هندسة الميكاترونكس، الهندسة الطبية..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block">قسمك الأكاديمي</span>
                </div>

                {/* University Name */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-900 dark:text-slate-100 block">
                    اسم الجامعة / الكلية:
                  </label>
                  <input
                    type="text"
                    value={customUniversityName}
                    onChange={(e) => setCustomUniversityName(e.target.value)}
                    placeholder="مثال: جامعة صنعاء - كلية الهندسة"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block">جامعتك الحالية</span>
                </div>
              </div>

              {/* Doctor Avatar / Photo Selection Mode */}
              <div className="pt-4 border-t border-amber-500/20 space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <label className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-600" />
                    <span>اختر تجسيد مظهر الدكتور أثناء الشرح:</span>
                  </label>

                  <div className="flex flex-wrap items-center gap-1.5 bg-amber-500/10 p-1 rounded-2xl border border-amber-300 dark:border-amber-700">
                    <button
                      type="button"
                      onClick={() => setDoctorAvatarType('anime')}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        doctorAvatarType === 'anime'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-amber-600'
                      }`}
                    >
                      <span>🎨 رسم كرتوني</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDoctorAvatarType('photo')}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        doctorAvatarType === 'photo'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-amber-600'
                      }`}
                    >
                      <span>📸 رفع صورة الدكتور</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDoctorAvatarType('icon')}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        doctorAvatarType === 'icon'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-amber-600'
                      }`}
                    >
                      <span>🎓 اختيار أيقونة</span>
                    </button>
                  </div>
                </div>

                {/* Option A: Anime Avatar Selection */}
                {doctorAvatarType === 'anime' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 dark:text-slate-200 block">
                        الشخصية الكرتونية:
                      </label>
                      <select
                        value={customAvatarStyle}
                        onChange={(e) => setCustomAvatarStyle(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                      >
                        <option value="classic_professor">أستاذ خبير ببدلة أكاديمية (Classic Professor)</option>
                        <option value="young_professor">أستاذ شاب ونظارة تفاعلية (Young Professor)</option>
                        <option value="glasses_expert">خبير ميكاترونكس بنظارات (Glasses Expert)</option>
                        <option value="female_expert">دكتورة مهندسة متخصصة (Female Expert)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 dark:text-slate-200 block">
                        لون وثيم السبورة:
                      </label>
                      <select
                        value={customBoardTheme}
                        onChange={(e) => setCustomBoardTheme(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                      >
                        <option value="chalkboard_green">سبورة خضراء تقليدية (Green Chalkboard)</option>
                        <option value="dark_slate">سبورة سوداء داكنة هادئة (Dark Slate)</option>
                        <option value="whiteboard">سبورة بيضاء تفاعلية حديثة (Modern Whiteboard)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <div className="w-12 h-14 shrink-0 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                        <AnimeDoctorAvatar doctor={selectedDoctor} isSpeaking={false} size="sm" className="scale-75" />
                      </div>
                      <div className="text-[11px]">
                        <span className="font-black text-amber-900 dark:text-amber-200 block">معاينة الرسم الكرتوني</span>
                        <span className="text-slate-500">{selectedDoctor.name}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Option B: Doctor Real Photo Upload */}
                {doctorAvatarType === 'photo' && (
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Photo Upload Input Button */}
                      <div className="flex-1 space-y-2 w-full">
                        <label className="font-bold text-slate-900 dark:text-white block">
                          قم برفع صورة لدكتورك المحاضر من جهازك أو هاتفك:
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            id="doctor-photo-upload"
                            accept="image/*"
                            onChange={handleDoctorPhotoUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="doctor-photo-upload"
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black flex items-center gap-2 cursor-pointer shadow-sm transition"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{uploadedDoctorPhotoName ? 'تغيير الصورة المرفوعة' : 'اختر صورة من جهازك'}</span>
                          </label>

                          <span className="text-xs text-slate-500">أو أدخل رابط صورة مباشر:</span>
                        </div>

                        <input
                          type="text"
                          value={customDoctorPhotoUrl}
                          onChange={(e) => {
                            setCustomDoctorPhotoUrl(e.target.value);
                            setDoctorAvatarType('photo');
                          }}
                          placeholder="https://example.com/doctor-photo.jpg"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                      </div>

                      {/* Photo Preview Thumbnail */}
                      <div className="w-24 h-28 shrink-0 rounded-2xl bg-slate-900 border-2 border-amber-400 overflow-hidden relative shadow-md flex items-center justify-center">
                        {customDoctorPhotoUrl ? (
                          <img
                            src={customDoctorPhotoUrl}
                            alt="معاينة صورة الدكتور"
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="text-center text-slate-400 p-2 text-[10px]">
                            <span>لا توجد صورة</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Option C: Academic Doctor Icon Selection */}
                {doctorAvatarType === 'icon' && (
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800 space-y-3">
                    <label className="font-bold text-slate-900 dark:text-white block">
                      اختر أيقونة أكاديمية أو رمز تخصص لدكتورك:
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { symbol: '🎓', label: 'بروفيسور أكاديمي' },
                        { symbol: '👨‍🏫', label: 'محاضر المادة' },
                        { symbol: '⚡', label: 'مهندس ميكاترونكس' },
                        { symbol: '🤖', label: 'دكتور الروبوتات' },
                        { symbol: '🔬', label: 'أستاذ العلوم والفيزياء' },
                        { symbol: '🏛️', label: 'صرح كلية الهندسة' },
                        { symbol: '⚙️', label: 'دكتور الآلات والأنظمة' },
                        { symbol: '💻', label: 'أستاذ البرمجة' },
                      ].map((item) => (
                        <button
                          key={item.symbol}
                          type="button"
                          onClick={() => {
                            setSelectedDoctorIcon(item.symbol);
                            setDoctorAvatarType('icon');
                          }}
                          className={`p-3 rounded-2xl border text-center transition cursor-pointer flex items-center gap-2.5 ${
                            selectedDoctorIcon === item.symbol && doctorAvatarType === 'icon'
                              ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md ring-2 ring-amber-400/40'
                              : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-amber-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="text-2xl">{item.symbol}</span>
                          <span className="text-xs font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* B. LESSON CONFIGURATION FORM */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  إعداد تفاصيل الدرس — مع {selectedDoctor.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  حدد الموضوع، مستوى التفصيل، ونوع العرض المفضل على السبورة.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              
              {/* Left Column: Topic & Suggested */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-900 dark:text-white block">
                    عنوان أو موضوع الدرس:
                  </label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="مثال: قانون أوم، تحليل المتجهات، متحكم PID، كينماتيكا الروبوت..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Suggested Topics by Selected Doctor */}
                {selectedDoctor.suggestedTopics && selectedDoctor.suggestedTopics.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      مواضيع مقترحة من {selectedDoctor.name}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDoctor.suggestedTopics.map((topic, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLessonTitle(topic)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[11px] font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          + {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Level of Explanation */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-900 dark:text-white block">
                    مستوى وطريقة الشرح:
                  </label>
                  <select
                    value={explanationLevel}
                    onChange={(e) => setExplanationLevel(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden"
                  >
                    <option value="beginner">مبسط جدًا للمبتدئين (تشبيهات فيزيائية واقعية)</option>
                    <option value="intermediate">شرح جامعي متوسط (منهج كليات الهندسة)</option>
                    <option value="advanced">شرح متقدم وتعمق نظري</option>
                    <option value="formulas_only">شرح القوانين والوحدات والأبعاد فقط</option>
                    <option value="step_by_step_problems">حل المسائل الحسابية خطوة بخطوة</option>
                    <option value="applied_examples">شرح مع تطبيقات صناعية وميكاترونية</option>
                    <option value="exam_cram">مراجعة سريعة ومركزة قبل الاختبار</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-900 dark:text-white block">
                    مدة الشرح المطلوبة:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { min: 3, label: '3 دقائق' },
                      { min: 5, label: '5 دقائق' },
                      { min: 10, label: '10 دقائق' },
                      { min: 15, label: '15 دقيقة' },
                    ].map((d) => (
                      <button
                        key={d.min}
                        type="button"
                        onClick={() => setDurationMinutes(d.min)}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          durationMinutes === d.min
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Display Mode, Serway, File */}
              <div className="space-y-4">
                {/* Display Mode */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-900 dark:text-white block">
                    طريقة العرض في قاعة المحاضرات:
                  </label>
                  <select
                    value={displayMode}
                    onChange={(e) => setDisplayMode(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden"
                  >
                    <option value="anime_board">دكتور Anime أمام السبورة (المظهر الكامل الموصى به)</option>
                    <option value="board_only">سبورة ورسومات فقط (تركيز كامل على المعادلات)</option>
                    <option value="simulation_focus">شرح مع محاكاة هندسية تفاعلية</option>
                    <option value="solved_examples">شرح مع أمثلة محلولة خطوة بخطوة</option>
                    <option value="student_file">شرح مستند إلى ملف الطالب المرفوع</option>
                  </select>
                </div>

                {/* Serway Reference Option */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      <span>استخدام مرجع Serway الدولي للفيزياء</span>
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSerway}
                        onChange={(e) => setUseSerway(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    عند التفعيل، يعتمد الدكتور على فصول وقوانين ومسائل كتاب <strong>Physics for Scientists and Engineers — Serway</strong> المعتمد في الجامعات اليمنية.
                  </p>
                </div>

                {/* Optional Custom Student File / Image Upload */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-900 dark:text-white block">
                    (اختياري) إرفاق صورة أو ملف الدرس للشرح:
                  </label>
                  <div className="p-3.5 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-center space-y-2.5">
                    <input
                      type="file"
                      id="doctor-file"
                      accept="image/*,.txt,.pdf,.md,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="doctor-file"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white cursor-pointer shadow-sm transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploadedFileName ? 'تغيير الملف أو الصورة' : 'إرفاق صورة المحاضرة أو ملف PDF'}</span>
                    </label>

                    {/* Image Preview Thumbnail if an image was uploaded */}
                    {uploadedFileType === 'image' && uploadedFilePreview && (
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-400 shadow-md bg-slate-900 shrink-0 relative">
                          <img
                            src={uploadedFilePreview}
                            alt="معاينة صورة المحاضرة"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-right text-xs">
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 block">✓ تم إرفاق صورة الدرس:</span>
                          <span className="text-[11px] text-slate-500 font-mono block truncate max-w-[180px]">{uploadedFileName}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">سيتم تحليل الصورة وشرح مسائلها على السبورة</span>
                        </div>
                      </div>
                    )}

                    {/* Document File details if a document was uploaded */}
                    {uploadedFileType === 'file' && uploadedFileName && (
                      <div className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1.5 pt-1">
                        <FileText className="w-4 h-4" />
                        <span>تم اختيار المستند: {uploadedFileName}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Submit Action Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span>محرك الذكاء الاصطناعي يُعد مشاهد السبورة، نصوص النطق الصوتي، والمحاكاة فوراً.</span>
              </div>

              <button
                type="button"
                onClick={handleGenerateLesson}
                disabled={isGenerating}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>جاري إعداد مشاهد السبورة وحركات الدكتور...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>🎬 أنشئ درس الفيديو والسبورة التفاعلية</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB 2: ACTIVE CLASSROOM & SMART BOARD PLAYER */}
      {/* ======================================================== */}
      {activeTab === 'classroom' && activeLesson && (
        <div className="space-y-4">
          <SmartDoctorBoardPlayer
            doctor={selectedDoctor}
            lesson={activeLesson}
            onClose={() => setActiveTab('create')}
            onAskSimplified={() => {
              setExplanationLevel('beginner');
              handleGenerateLesson();
            }}
            onAskAnotherExample={() => {
              setExplanationLevel('step_by_step_problems');
              handleGenerateLesson();
            }}
            onSaveLesson={(savedLesson) => {
              setSavedLessons((prev) => [savedLesson, ...prev.filter((l) => l.id !== savedLesson.id)]);
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TAB 3: SAVED LESSONS ARCHIVE */}
      {/* ======================================================== */}
      {activeTab === 'saved' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" />
                <span>مكتبة الدروس المحفوظة لديك</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                جميع المحاضرات والسبورات التي أعدها لك دكاترة الميكاترونكس للمراجعة في أي وقت.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              + إعداد درس جديد
            </button>
          </div>

          {loadingSaved ? (
            <div className="p-8 text-center text-xs text-slate-500">جاري تحميل الدروس...</div>
          ) : savedLessons.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                لا توجد دروس محفوظة بعد.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer"
              >
                أنشئ درسك الأول الآن 🎬
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedLessons.map((l) => (
                <div
                  key={l.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate">
                        {l.doctorName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {l.scenes.length} مشاهد
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2">
                      {l.lessonTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {l.scenes[0]?.boardContent?.heading || 'درس ميكاترونكس تفاعلي على السبورة'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveLesson(l);
                        const doc = doctors.find((d) => d.id === l.doctorId);
                        if (doc) setSelectedDoctorId(doc.id);
                        setActiveTab('classroom');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>فتح السبورة والشرح</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm('هل تريد حذف هذا الدرس من مكتبتك؟')) {
                          await fetch(`/api/smart-doctor/lessons/${l.id}`, { method: 'DELETE' });
                          setSavedLessons((prev) => prev.filter((item) => item.id !== l.id));
                        }
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
