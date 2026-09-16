export type StudyLevel = 
  | 'السنة الأولى'
  | 'السنة الثانية'
  | 'السنة الثالثة'
  | 'السنة الرابعة'
  | 'السنة الخامسة'
  | 'أخرى';

export type UniversityOption =
  | 'الجامعة الإماراتية الدولية – صنعاء'
  | 'جامعة صنعاء'
  | 'جامعة العلوم والتكنولوجيا'
  | 'الجامعة اليمنية'
  | 'جامعة المستقبل'
  | 'جامعة الملكة أروى'
  | 'جامعة أخرى';

export type UserRole = 'student' | 'admin';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'suspended';

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  email?: string;
  university: string;
  studyLevel: StudyLevel;
  major: string;
  role: UserRole;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  university: string;
  studyLevel: StudyLevel;
  major: string;
  role?: UserRole;
  subscriptionPlan?: 'monthly' | 'yearly';
  subscriptionStatus?: SubscriptionStatus;
  activationCode?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  remainingDays: number;
  isActivated: boolean;
  isExpired: boolean;
  completedLessons: string[];
  quizScores: Record<string, number>; // lessonId -> percentage score
}

export interface ActivationCode {
  id?: string;
  code: string;
  planType: 'monthly' | 'yearly' | 'custom';
  durationDays: number;
  maxUses?: number;
  timesUsed?: number;
  usedCount?: number;
  isUsed: boolean;
  isActive?: boolean;
  usedByName?: string;
  usedByStudentName?: string;
  usedByStudents?: Array<{
    studentId: string;
    studentName: string;
    usedAt: string;
  }>;
  usedAt?: string;
  expiresAt?: string;
  createdAt: string;
  notes?: string;
}

export interface SubscriptionRequest {
  id: string;
  userId: string;
  studentName: string;
  phone: string;
  university: string;
  plan: 'monthly' | 'yearly';
  priceUSD: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  notes?: string;
}

export interface FormulaSymbol {
  symbol: string;
  name: string;
  unit: string;
  unitSymbol: string;
  dimension: string; // e.g. M, L, T^-2
  description: string;
}

export interface FormulaAnalysis {
  id: string;
  formulaLatex: string;
  formulaText: string;
  name: string;
  subject: string;
  meaning: string;
  whyWeUseIt: string;
  whenToUse: string;
  whenNotToUse: string;
  symbols: FormulaSymbol[];
  dimensionsAnalysis: {
    lhsDimension: string;
    rhsDimension: string;
    verificationExplanation: string;
    isBalanced: boolean;
  };
  simpleExample: {
    problem: string;
    given: Record<string, string>;
    steps: string[];
    result: string;
  };
  engineeringExample: {
    applicationTitle: string;
    description: string;
    practicalTakeaway: string;
  };
}

export interface SolvedExample {
  id: string;
  title: string;
  difficulty: 'سهل' | 'متوسط' | 'تطبيقي متقدم';
  question: string;
  givenData: string[];
  required: string;
  formulaUsed?: string;
  steps: {
    stepNumber: number;
    description: string;
    formula?: string;
    calculation?: string;
    result?: string;
  }[];
  finalAnswer: string;
  engineeringTip?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'calculation' | 'conceptual';
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation: string;
}

export interface Lesson {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  readingTimeMinutes: number;
  // 15 Comprehensive Sections required:
  simpleExplanation: string; // 2. شرح مبسط جدًا من الصفر
  coreConcept: string;       // 3. الفكرة الأساسية
  terms: { term: string; definition: string; practicalAnalogy?: string }[]; // 4. المصطلحات
  formulas: FormulaAnalysis[]; // 5, 6, 7, 8, 9. القوانين، تحليلها، الرموز، الوحدات، الأبعاد
  solvedExamples: SolvedExample[]; // 10, 11. أمثلة محلولة وخطوات الحل
  commonMistakes: { mistake: string; correction: string; why: string }[]; // 12. أخطاء شائعة
  practiceQuestions: { question: string; hint: string; answer: string }[]; // 13. أسئلة تدريبية
  quiz: QuizQuestion[]; // 14. اختبار قصير
  summary: string[]; // 15. ملخص الدرس
}

export interface Subject {
  id: string;
  name: string;
  englishName: string;
  code: string;
  icon: string;
  color: string;
  description: string;
  year: 'السنة الأولى' | 'السنة الثانية';
  semester: 'الفصل الأول' | 'الفصل الثاني';
  universities?: string[]; // applicable universities or empty for all
  lessonsCount?: number;
}

export interface UnitConversion {
  id: string;
  category: 'طول' | 'زمن' | 'كتلة' | 'قوة' | 'طاقة وشغل' | 'قدرة' | 'كهرباء' | 'ضغط' | 'تردد';
  fromUnit: string;
  toUnit: string;
  factor: number;
  symbolFrom: string;
  symbolTo: string;
  dimension: string;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
  relatedTopic?: string;
}

export interface AdminSettings {
  whatsappNumber: string;
  monthlyPriceUSD: number;
  yearlyPriceUSD: number;
  exchangeRateYR: number; // Yemeni Rial approximate
  academicYear: string;
  announcementText: string;
}

export type ExplainSourceType = 'image' | 'pdf' | 'video' | 'text' | 'file';
export type ExplainLevel = 'simple' | 'medium' | 'advanced' | 'short';

export interface ExplainTerm {
  term: string;
  englishTerm?: string;
  meaning: string;
  practicalAnalogy?: string;
  isAdditionalNote?: boolean;
}

export interface ExplainConceptItem {
  concept: string;
  conceptEn?: string;
  simplifiedExplanation?: string;
  explanation?: string;
  scientificDefinition?: string;
  practicalAnalogy?: string;
  isAdditionalNote?: boolean;
}

export interface ExplainFormula {
  equation: string;
  meaning: string;
  whenToUse?: string;
  symbols: {
    symbol: string;
    name: string;
    unit: string;
    dimension?: string;
  }[];
}

export interface ExplainUnit {
  quantity: string;
  unitName: string;
  unitSymbol: string;
  notes?: string;
}

export interface ExplainDimension {
  quantity: string;
  formula: string;
  dimensionStr: string;
  explanation: string;
}

export interface ExplainSolvedExample {
  problem: string;
  given: string[];
  required: string;
  formulaUsed: string;
  steps: string[];
  calculation?: string;
  unit?: string;
  finalAnswer: string;
  whyThisResult?: string;
  isGenerated: boolean;
  note?: string;
}

export interface ExplainImportantNote {
  note?: string;
  point?: string;
  explanation?: string;
  type?: 'warning' | 'tip' | 'exam';
  dangerLevel?: 'high' | 'medium' | 'low';
  isAdditionalNote?: boolean;
}

export interface ExplainCommonMistake {
  mistake: string;
  correction: string;
  why: string;
}

export interface ExplainQuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'true_false' | 'calculation' | 'conceptual';
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation: string;
}

export interface ExplainSuggestedTool {
  toolId: string; // 'circuits' | 'math' | 'units' | 'formulas' | 'torque' | 'gears' | 'oee' | 'robot'
  title: string;
  subtitle: string;
  icon: string;
  reason: string;
}

export interface ExplainLessonResult {
  id: string;
  studentId?: string;
  lessonTitle: string;
  subjectName: string;
  sourceType: ExplainSourceType;
  fileName?: string;
  filePreviewUrl?: string;
  createdAt: string;
  explanationLevel: ExplainLevel;
  simpleIdea: string; // 💡 الدرس ببساطة: ما هو؟ ماذا يعني؟ لماذا ندرسه؟ أين يستخدم؟
  coreTakeaways: string[]; // 🎯 أهم الأفكار
  conceptExplanations?: ExplainConceptItem[]; // 📖 شرح المفاهيم بأسلوب مبسط ثم التعريف العلمي
  terms: ExplainTerm[]; // 📌 المصطلحات المهمة بالعربي والإنجليزي
  formulas: ExplainFormula[]; // 📐 القوانين والمعادلات كاملة مع الرموز ومتى تستخدم
  units: ExplainUnit[]; // 📏 الوحدات الدولية
  dimensions: ExplainDimension[]; // 🔬 الأبعاد الفيزيائية
  solvedExample: ExplainSolvedExample; // 🧮 الأمثلة والمسائل خطوة بخطوة وتفسير النتيجة
  importantNotes?: ExplainImportantNote[]; // ⚠️ الملاحظات والتنبيهات المهمة
  memoryAids?: string[]; // 🧠 كيف أتذكر الدرس؟
  summaryPoints: string[]; // 📝 الخلاصة المركزة (تقرأ في دقيقة أو دقيقتين)
  learningObjectives?: string[]; // 🎓 ماذا يجب أن أعرف بعد الدرس؟
  quiz: ExplainQuizQuestion[]; // 🧪 اختبار سريع وتفاعلي
  commonMistakes: ExplainCommonMistake[];
  suggestedTools: ExplainSuggestedTool[];
  circuitAnalysis?: {
    hasCircuit: boolean;
    circuitType?: string;
    components?: { type: string; value: string; label: string }[];
    analysisSummary?: string;
  };
  clarificationNotice?: string;
  isImageBlurry?: boolean;
  videoSupportNotice?: string;
  studySheetMarkdown?: string;
  sections?: { id: string; title: string; summary: string }[];
  originalContentSample?: string;
  pdfPageChoice?: { mode: 'full' | 'pages'; selectedPages?: string };
}


