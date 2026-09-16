import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_SETTINGS, INITIAL_SUBJECTS, INITIAL_LESSONS, INITIAL_FORMULAS, INITIAL_UNIT_CONVERSIONS } from '../src/data/initialData';
import { Subject, Lesson, AdminSettings } from '../src/types';
import { processExplainLesson } from './explainService';
import { db, DBUser, DBSubscription, DBActivationCode, DBSubscriptionRequest } from './db';

const JWT_SECRET = process.env.JWT_SECRET || '7829';

// Extend Express Request to carry authenticated user & subscription
export interface AuthenticatedRequest extends Request {
  user?: DBUser;
  subscription?: DBSubscription;
}

// In-Memory Curriculum Store (can be edited by admin)
let subjects: Subject[] = [...INITIAL_SUBJECTS];
let lessons: Lesson[] = [...INITIAL_LESSONS];

// Token Helpers
export function generateAuthToken(user: DBUser): string {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Authentication Middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.findUserById(decoded.id);
    if (user) {
      req.user = user;
      const sub = db.getSubscriptionByUserId(user.id);
      if (sub) {
        // Auto-check expiry
        if (sub.status === 'active' && new Date(sub.expiryDate) < new Date()) {
          sub.status = 'expired';
          db.createOrUpdateSubscription(sub);
        }
        req.subscription = sub;
      }
    }
  } catch (err) {
    // Invalid or expired token
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'يرجى تسجيل الدخول للوصول إلى هذا المحتوى.',
      requireLogin: true,
    });
  }
  next();
}

export function requireActiveSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'يرجى تسجيل الدخول للوصول إلى المحتوى.',
      requireLogin: true,
    });
  }

  if (req.user.role === 'admin') {
    return next(); // Admin always has full access
  }

  const sub = req.subscription || db.getSubscriptionByUserId(req.user.id);

  if (!sub || sub.status === 'pending') {
    return res.status(403).json({
      error: 'حسابك مسجل وهو حاليًا في انتظار تأكيد الدفع والتفعيل من الإدارة. يرجى التواصل عبر واتساب لتأكيد الاشتراك أو إدخال كود التفعيل.',
      subscriptionStatus: 'pending',
    });
  }

  if (sub.status === 'expired' || new Date(sub.expiryDate) < new Date()) {
    return res.status(403).json({
      error: 'انتهت صلاحية اشتراكك، يرجى التجديد للوصول إلى المحتوى التعليمي والمختبر.',
      subscriptionStatus: 'expired',
    });
  }

  if (sub.status === 'suspended') {
    return res.status(403).json({
      error: 'تم تعليق هذا الحساب مؤقتًا. يرجى مراجعة إدارة الأكاديمية.',
      subscriptionStatus: 'suspended',
    });
  }

  if (sub.status !== 'active') {
    return res.status(403).json({
      error: 'هذا المحتوى متاح للمشتركين فقط.',
      subscriptionStatus: 'inactive',
    });
  }

  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'هذه العملية تتطلب صلاحيات إدارة الأكاديمية.',
    });
  }
  next();
}

// Lazy Gemini API Client Initialization
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY && !genAI) {
    try {
      genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return genAI;
}

// Create Express App
export const app = express();

// CORS Headers & Options Preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(authenticateToken);

// Setup an API router so routes work both on /api/... and /...
const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'mechatronics-academy' });
});

// Student Registration
router.post('/auth/register', (req, res) => {
  const { name, phone, email, university, studyLevel, major, password } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان للتسجيل.' });
  }

  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
  const existingUser = db.findUserByPhone(cleanPhone);
  if (existingUser) {
    return res.status(400).json({
      error: 'رقم الهاتف مسجل مسبقًا في الأكاديمية. يمكنك تسجيل الدخول مباشرة.',
    });
  }

  const userId = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const passwordHash = password
    ? bcrypt.hashSync(password, 10)
    : bcrypt.hashSync(cleanPhone.slice(-6) || '123456', 10);

  const newUser: DBUser = {
    id: userId,
    name: name.trim(),
    phone: cleanPhone,
    email: email ? email.trim() : undefined,
    university: university || 'الجامعة الإماراتية الدولية – صنعاء',
    studyLevel: studyLevel || 'السنة الأولى',
    major: major || 'هندسة الميكاترونكس',
    passwordHash,
    role: 'student',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  db.createUser(newUser);

  // Create initial pending subscription
  const now = new Date();
  const newSubscription: DBSubscription = {
    id: `sub-${Date.now()}`,
    userId,
    plan: 'monthly',
    status: 'pending',
    startDate: now.toISOString(),
    expiryDate: now.toISOString(),
    createdAt: now.toISOString(),
    activationMethod: 'whatsapp',
    notes: 'حساب مسجل جديد في انتظار تأكيد الدفع والتفعيل',
  };
  db.createOrUpdateSubscription(newSubscription);

  const token = generateAuthToken(newUser);

  res.json({
    success: true,
    message: 'تم إنشاء حساب الطالب بنجاح!',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      university: newUser.university,
      studyLevel: newUser.studyLevel,
      major: newUser.major,
      role: newUser.role,
    },
    subscription: {
      ...newSubscription,
      remainingDays: 0,
      isActivated: false,
      isExpired: false,
    },
  });
});

// Student / User Login
router.post('/auth/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف أو البريد الإلكتروني وكلمة المرور.' });
  }

  const clean = identifier.trim();
  const cleanDigits = clean.replace(/[^0-9]/g, '');
  const user = db.findUserByPhone(cleanDigits) || db.findUserByEmail(clean);

  if (!user) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة. يرجى التأكد من رقم الهاتف أو البريد الإلكتروني.' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
  }

  user.lastLoginAt = new Date().toISOString();
  db.updateUser(user.id, { lastLoginAt: user.lastLoginAt });

  const token = generateAuthToken(user);
  const sub = db.getSubscriptionByUserId(user.id);

  let remainingDays = 0;
  let isActivated = false;
  let isExpired = false;

  if (sub && sub.status === 'active') {
    const msLeft = new Date(sub.expiryDate).getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    isActivated = remainingDays > 0;
    isExpired = remainingDays <= 0;
  } else if (sub && sub.status === 'expired') {
    isExpired = true;
  }

  res.json({
    success: true,
    message: `مرحبًا بك يا باشمهندس ${user.name}`,
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      university: user.university,
      studyLevel: user.studyLevel,
      major: user.major,
      role: user.role,
    },
    subscription: sub
      ? {
          ...sub,
          remainingDays,
          isActivated,
          isExpired,
        }
      : undefined,
  });
});

// Forgot Password - Initiate recovery
router.post('/auth/forgot-password', (req, res) => {
  const { phone, email } = req.body;
  if (!phone && !email) {
    return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف المسجل لاستعادة كلمة المرور.' });
  }

  const cleanPhone = phone ? phone.trim().replace(/[^0-9]/g, '') : '';
  let user = cleanPhone ? db.findUserByPhone(cleanPhone) : null;
  if (!user && email) {
    user = db.findUserByEmail(email.trim());
  }

  if (!user) {
    return res.status(404).json({
      error: 'لم يتم العثور على حساب مسجل بهذا الرقم. يرجى التأكد من كتابة الرقم بشكل صحيح أو إنشاء حساب جديد.',
    });
  }

  const { code, token, expiresAt } = db.createPasswordReset(user.id, user.phone);

  res.json({
    success: true,
    message: 'تم إنشاء رمز التحقق لاستعادة الحساب بنجاح.',
    phone: user.phone,
    recoveryToken: token,
    recoveryCode: code,
    expiresAt,
  });
});

// Reset Password - Verify code and set new password
router.post('/auth/reset-password', (req, res) => {
  const { phone, recoveryCode, newPassword } = req.body;

  if (!phone || !recoveryCode || !newPassword) {
    return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف، رمز التحقق، وكلمة المرور الجديدة.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور الجديدة من 4 خانات على الأقل.' });
  }

  const userId = db.verifyAndConsumePasswordReset(phone, recoveryCode);
  if (!userId) {
    return res.status(400).json({
      error: 'رمز التحقق غير صحيح أو انتهت صلاحيته (صلاحية الرمز 15 دقيقة). يرجى طلب رمز جديد.',
    });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.updateUserPassword(userId, newHash);

  res.json({
    success: true,
    message: 'تم تعيين كلمة المرور الجديدة بنجاح! يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.',
  });
});

// Student Profile Edit
router.put('/student/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { name, university, studyLevel, major, email } = req.body;
  const user = req.user!;

  const updates: Partial<DBUser> = {};
  if (name && name.trim()) updates.name = name.trim();
  if (university && university.trim()) updates.university = university.trim();
  if (studyLevel) updates.studyLevel = studyLevel;
  if (major && major.trim()) updates.major = major.trim();
  if (email !== undefined) updates.email = email ? email.trim() : undefined;

  const updated = db.updateUser(user.id, updates);

  res.json({
    success: true,
    message: 'تم تحديث البيانات الشخصية بنجاح.',
    user: {
      id: updated!.id,
      name: updated!.name,
      phone: updated!.phone,
      email: updated!.email,
      university: updated!.university,
      studyLevel: updated!.studyLevel,
      major: updated!.major,
      role: updated!.role,
    },
  });
});

// Student Change Password
router.post('/student/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'يجب ألا تقل كلمة المرور الجديدة عن 4 أحرف أو أرقام.' });
  }

  const user = req.user!;
  const isValid = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.updateUserPassword(user.id, newHash);

  res.json({
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح.',
  });
});

// Current User Profile & Subscription Status
router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const sub = db.getSubscriptionByUserId(user.id);
  const progress = db.getStudentProgress(user.id);

  let remainingDays = 0;
  let isActivated = false;
  let isExpired = false;

  if (sub && sub.status === 'active') {
    const msLeft = new Date(sub.expiryDate).getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    isActivated = remainingDays > 0;
    isExpired = remainingDays <= 0;
  } else if (sub && sub.status === 'expired') {
    isExpired = true;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      university: user.university,
      studyLevel: user.studyLevel,
      major: user.major,
      role: user.role,
    },
    student: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      university: user.university,
      studyLevel: user.studyLevel,
      major: user.major,
      role: user.role,
      subscriptionPlan: sub?.plan || 'monthly',
      subscriptionStatus: sub?.status || 'pending',
      subscriptionStartDate: sub?.startDate,
      subscriptionEndDate: sub?.expiryDate,
      remainingDays,
      isActivated,
      isExpired,
      completedLessons: progress.completedLessons || [],
      quizScores: progress.quizScores || {},
    },
    subscription: sub
      ? {
          ...sub,
          remainingDays,
          isActivated,
          isExpired,
        }
      : null,
  });
});

// Activate Subscription Code
router.post('/activate-code', requireAuth, (req: AuthenticatedRequest, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'يرجى إدخال كود التفعيل المكون من أرقام أو حروف.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const codes = db.getAllActivationCodes();
  const foundCode = codes.find((c) => c.code.trim().toUpperCase() === cleanCode);

  if (!foundCode) {
    return res.status(400).json({
      error: 'كود التفعيل غير صحيح أو غير موجود. يرجى التأكد من الكود المرسل لك من إدارة الأكاديمية.',
    });
  }

  if (foundCode.isActive === false) {
    return res.status(400).json({
      error: 'تم تعطيل هذا الكود من قبل إدارة الأكاديمية.',
    });
  }

  if (foundCode.expiresAt && new Date(foundCode.expiresAt) < new Date()) {
    return res.status(400).json({
      error: 'انتهت صلاحية هذا الكود.',
    });
  }

  const maxUses = foundCode.maxUses || 1;
  if (foundCode.timesUsed >= maxUses) {
    return res.status(400).json({
      error: 'هذا الكود مستخدم مسبقًا بالكامل.',
    });
  }

  // Check if this student already used this code
  const alreadyUsedByStudent = foundCode.usedByStudents?.some((u) => u.studentId === req.user!.id);
  if (alreadyUsedByStudent) {
    return res.status(400).json({
      error: 'لقد استخدمت هذا الكود مسبقًا على حسابك.',
    });
  }

  // Activate subscription for student
  const durationDays = foundCode.durationDays || (foundCode.planType === 'yearly' ? 365 : 30);
  const now = new Date();
  const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const updatedSub: DBSubscription = {
    id: `sub-${Date.now()}`,
    userId: req.user!.id,
    plan: foundCode.planType === 'yearly' ? 'yearly' : 'monthly',
    status: 'active',
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    createdAt: now.toISOString(),
    activatedAt: now.toISOString(),
    activationMethod: 'activation_code',
    notes: `تم التفعيل عبر الكود المعتمد ${cleanCode}`,
  };
  db.createOrUpdateSubscription(updatedSub);

  // Update activation code stats
  const updatedTimesUsed = (foundCode.timesUsed || 0) + 1;
  const isNowUsed = updatedTimesUsed >= maxUses;

  const usedRecords = foundCode.usedByStudents || [];
  usedRecords.push({
    studentId: req.user!.id,
    studentName: req.user!.name,
    usedAt: now.toISOString(),
  });

  db.updateActivationCode(foundCode.id, {
    timesUsed: updatedTimesUsed,
    isUsed: isNowUsed,
    usedByStudents: usedRecords,
  });

  const progress = db.getStudentProgress(req.user!.id);

  res.json({
    success: true,
    message: `تهانينا يا باشمهندس ${req.user!.name}! تم تفعيل اشتراكك بنجاح لمدة ${durationDays} يومًا.`,
    subscription: {
      ...updatedSub,
      remainingDays: durationDays,
      isActivated: true,
      isExpired: false,
    },
    student: {
      id: req.user!.id,
      name: req.user!.name,
      phone: req.user!.phone,
      email: req.user!.email,
      university: req.user!.university,
      studyLevel: req.user!.studyLevel,
      major: req.user!.major,
      role: req.user!.role,
      subscriptionPlan: updatedSub.plan,
      subscriptionStatus: updatedSub.status,
      subscriptionStartDate: updatedSub.startDate,
      subscriptionEndDate: updatedSub.expiryDate,
      remainingDays: durationDays,
      isActivated: true,
      isExpired: false,
      completedLessons: progress.completedLessons || [],
      quizScores: progress.quizScores || {},
    },
  });
});

// Submit Subscription Request (WhatsApp Flow)
router.post('/subscription-request', (req, res) => {
  const { studentName, phone, university, studyLevel, major, plan, paymentMethod, transactionRef } = req.body;

  if (!studentName || !phone) {
    return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان لإرسال طلب الاشتراك.' });
  }

  const newRequest: DBSubscriptionRequest = {
    id: `req-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId: req.body.userId || 'guest',
    studentName: studentName.trim(),
    phone: phone.trim(),
    university: university || 'الجامعة الإماراتية الدولية – صنعاء',
    plan: plan === 'yearly' ? 'yearly' : 'monthly',
    priceUSD: plan === 'yearly' ? 200 : 20,
    status: 'pending',
    createdAt: new Date().toISOString(),
    notes: `${major || 'ميكاترونكس'} - ${studyLevel || 'السنة الأولى'} - طريقة الدفع: ${paymentMethod || 'كريمي'}${transactionRef ? ' - الحوالة: ' + transactionRef : ''}`,
  };

  db.createRequest(newRequest);

  res.json({
    success: true,
    message: 'تم تسجيل طلب الاشتراك بنجاح. تواصل معنا عبر واتساب لإتمام التفعيل.',
    requestId: newRequest.id,
  });
});

// Public Subjects List
router.get('/subjects', (req, res) => {
  res.json({ subjects, lessons });
});

// Update Student Progress
router.post('/student/progress', requireAuth, (req: AuthenticatedRequest, res) => {
  const studentId = req.user!.id;
  const { completedLessonId, quizScore, simulatorSetting } = req.body;

  const currentProgress = db.getStudentProgress(studentId);

  if (completedLessonId && !currentProgress.completedLessons.includes(completedLessonId)) {
    currentProgress.completedLessons.push(completedLessonId);
  }

  if (quizScore && quizScore.lessonId && typeof quizScore.percentage === 'number') {
    currentProgress.quizScores[quizScore.lessonId] = quizScore.percentage;
  }

  if (simulatorSetting && simulatorSetting.key) {
    currentProgress.simulatorSettings[simulatorSetting.key] = simulatorSetting.value;
  }

  const saved = db.saveStudentProgress(studentId, currentProgress);
  res.json({ success: true, progress: saved });
});

// Explain Lesson Engine
router.post('/explain-lesson', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    if (user && user.role === 'student') {
      const sub = req.subscription || db.getSubscriptionByUserId(user.id);
      if (sub && (sub.status === 'expired' || sub.status === 'suspended')) {
        return res.status(403).json({
          error: 'انتهت صلاحية اشتراكك، يرجى التجديد لاستخدام خدمة الشرح الذكي.',
          subscriptionStatus: sub.status,
        });
      }
    }

    const {
      mode = 'text',
      prompt = '',
      fileData,
      mimeType,
      fileName,
      explanationLevel = 'simple',
      actionType = 'full_explain',
      specificPart = '',
      studentUniversity,
      studentMajor,
      studentId,
      lessonTitle,
      textContent,
      imageBase64,
      pdfPageChoice,
    } = req.body;

    const actualFileData = fileData || imageBase64;
    const actualPrompt = prompt || textContent || (lessonTitle ? `عنوان الدرس: ${lessonTitle}` : '');
    const actualMode = mode || (imageBase64 ? 'image' : 'text');

    if (!actualFileData && !actualPrompt) {
      return res.status(400).json({ error: 'يرجى تقديم محتوى أو صورة أو ملف لشرح الدرس.' });
    }

    const explanation = await processExplainLesson({
      mode: actualMode,
      prompt: actualPrompt,
      fileData: actualFileData,
      mimeType,
      fileName: fileName || (lessonTitle ? `${lessonTitle}` : undefined),
      explanationLevel,
      actionType,
      specificPart,
      studentUniversity: studentUniversity || user?.university || 'الجامعة الإماراتية الدولية – صنعاء',
      studentMajor: studentMajor || user?.major || 'هندسة الميكاترونكس',
      studentId: studentId || user?.id,
      pdfPageChoice,
    });

    if (user?.id) {
      try {
        db.saveStudentLesson({
          ...explanation,
          studentId: user.id,
          savedAt: new Date().toISOString(),
        });
      } catch (e) {
        // silent
      }
    }

    res.json({ success: true, result: explanation, explanation });
  } catch (error: any) {
    console.error('Error processing explain-lesson:', error);
    res.status(500).json({
      error: 'حدث خطأ أثناء تحليل الدرس وتوليد الشرح. يرجى المحاولة مرة أخرى.',
      details: error?.message,
    });
  }
});

// Get Student Saved Lessons
router.get('/student-lessons', requireAuth, (req: AuthenticatedRequest, res) => {
  const userLessons = db.getStudentLessons(req.user!.id);
  res.json({ lessons: userLessons });
});

// Save Student Explained Lesson
router.post('/student-lessons', requireAuth, (req: AuthenticatedRequest, res) => {
  const { lesson } = req.body;
  if (!lesson) return res.status(400).json({ error: 'بيانات الدرس مطلوبة.' });

  const saved = db.saveStudentLesson({
    ...lesson,
    studentId: req.user!.id,
    savedAt: new Date().toISOString(),
  });

  res.json({ success: true, lesson: saved });
});

// Delete student explained lesson
router.delete('/student-lessons/:lessonId', requireAuth, (req: AuthenticatedRequest, res) => {
  const { lessonId } = req.params;
  const success = db.deleteStudentLesson(lessonId, req.user!.id);
  res.json({ success });
});

// AI Chat endpoint
router.post('/ai/chat', async (req: AuthenticatedRequest, res) => {
  try {
    const { message, history = [], currentLessonTitle, currentSubjectName, imageBase64 } = req.body;

    if (!message && !imageBase64) {
      return res.status(400).json({ error: 'يرجى إرسال سؤال أو نص للمساعد.' });
    }

    const client = getGeminiClient();

    const systemInstruction = `
أنت "مساعد الميكاترونكس الذكي"، أستاذ ومرشد أكاديمي متخصص لطلاب السنة الأولى في هندسة الميكاترونكس في الجامعات اليمنية (مثل الجامعة الإماراتية الدولية بصنعاء، جامعة صنعاء، جامعة العلوم والتكنولوجيا، إلخ).
فلسفتك الأساسية: "لا تحفظ القانون، افهمه."
1. الشرح بسيط جدًا من الصفر وباللغة العربية الفصحى الواضحة والودودة مع المصطلحات الهندسية بالإنجليزية.
2. اشرح المفاهيم الفيزيائية والكهربائية بتشبيهات عملية واقعية.
3. عند حل أي مسألة، اتبع: المعطيات والوحدات الدولية (SI)، القانون المناسب (Formula)، التعويض خطوة بخطوة، والناتج النهائي.
`;

    if (client) {
      try {
        const contents: any[] = [];
        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            if (item.sender === 'user') {
              contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.sender === 'ai') {
              contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
          }
        }

        const currentParts: any[] = [];
        if (imageBase64) {
          currentParts.push({
            inlineData: {
              data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
              mimeType: 'image/jpeg',
            },
          });
        }
        currentParts.push({
          text: `السياق الحالي: مادة ${currentSubjectName || 'ميكاترونكس عام'} - درس ${currentLessonTitle || 'مبادئ عامة'}.\nسؤال الطالب: ${message || 'اشرح هذه المسألة بالتفصيل خطوة بخطوة'}`,
        });

        contents.push({ role: 'user', parts: currentParts });

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: { systemInstruction, temperature: 0.7 },
        });

        return res.json({ reply: response.text });
      } catch (geminiError: any) {
        console.warn('Gemini API call error, falling back to local guidance:', geminiError?.message);
      }
    }

    // Local Educational Response Fallback
    const localReply = `أهلاً بك يا باشمهندس ${req.user?.name || ''}!
بخصوص سؤالك عن "${message || 'المسألة الميكاترونية'}":
1. **الفكرة الهندسية الأساسية:** تعتمد هذه المنظومة على التناغم بين العناصر الكهربائية والميكانيكية.
2. **الخطوة الأولى:** تأكد من كتابة المعطيات وتحويل كافة القيم إلى الوحدات الدولية القياسية (SI Units).
3. **القانون الحاكم:** اختر القانون المناسب للمعطيات المتاحة وعوض خطوة بخطوة.
💡 *نصيحة مهندس:* تذكر دائمًا التحقق من صحة الوحدات الفيزيائية في الناتج النهائي!`;

    return res.json({ reply: localReply });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'حدث خطأ في معالجة المحادثة.', details: error?.message });
  }
});

// ==========================================
// ADMIN PANEL APIS (SECURE & ROLE PROTECTED)
// ==========================================

// Admin Login
router.post('/admin/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'يرجى إدخال كلمة مرور المسؤول.' });
  }

  const clean = identifier ? String(identifier).trim() : '';
  const users = db.getAllUsers();
  
  // Find admin user
  let adminUser = users.find(
    (u) => u.role === 'admin' && (!clean || u.phone === clean || u.email?.toLowerCase() === clean.toLowerCase() || u.name === clean)
  );

  if (!adminUser) {
    // If no specific match, grab the system admin
    adminUser = users.find((u) => u.role === 'admin');
  }

  if (!adminUser) {
    return res.status(401).json({ error: 'لم يتم العثور على حساب مسؤول مسجل في قاعدة البيانات.' });
  }

  const isValidPassword = bcrypt.compareSync(password, adminUser.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({
      error: 'كلمة المرور غير صحيحة. يرجى التأكد من كتابة كلمة المرور المعتمدة الخاصة بلوحة الإدارة.',
    });
  }

  adminUser.lastLoginAt = new Date().toISOString();
  db.updateUser(adminUser.id, { lastLoginAt: adminUser.lastLoginAt });

  const token = generateAuthToken(adminUser);
  return res.json({
    success: true,
    message: 'تم تسجيل دخول المسؤول بنجاح.',
    token,
    user: {
      id: adminUser.id,
      name: adminUser.name,
      phone: adminUser.phone,
      email: adminUser.email,
      role: 'admin',
    },
  });
});

// Admin Verify Token / Session
router.get('/admin/verify', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    user: {
      id: req.user!.id,
      name: req.user!.name,
      phone: req.user!.phone,
      email: req.user!.email,
      role: req.user!.role,
    },
  });
});

// Admin Change Own Password
router.post('/admin/change-password', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور الجديدة من 6 خانات أو أكثر.' });
  }

  const admin = req.user!;
  const isValid = bcrypt.compareSync(currentPassword, admin.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.updateUserPassword(admin.id, newHash);

  res.json({
    success: true,
    message: 'تم تحديث كلمة مرور مدير الأكاديمية بنجاح!',
  });
});

// Admin Subject Management
router.post('/admin/subjects', requireAuth, requireAdmin, (req, res) => {
  const { name, icon, description, category, semester } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال اسم المادة الدراسية.' });
  }

  const newSubject: Subject = {
    id: `subj-${Date.now()}`,
    name: name.trim(),
    englishName: req.body.englishName || 'Mechatronics Subject',
    code: req.body.code || 'MCT-101',
    icon: icon || 'Cpu',
    color: req.body.color || 'from-blue-600 to-indigo-600',
    description: description?.trim() || '',
    year: 'السنة الأولى',
    semester: (semester === 'الفصل الثاني' || semester === 2) ? 'الفصل الثاني' : 'الفصل الأول',
    lessonsCount: 0,
  };

  subjects.push(newSubject);
  res.json({ success: true, subject: newSubject, subjects });
});

router.put('/admin/subjects/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = subjects.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'المادة غير موجودة.' });

  subjects[idx] = {
    ...subjects[idx],
    ...req.body,
  };

  res.json({ success: true, subject: subjects[idx], subjects });
});

router.delete('/admin/subjects/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  subjects = subjects.filter((s) => s.id !== id);
  lessons = lessons.filter((l) => l.subjectId !== id);
  res.json({ success: true, message: 'تم حذف المادة والدروس التابعة لها بنجاح.', subjects });
});

// Admin Lesson Management
router.post('/admin/lessons', requireAuth, requireAdmin, (req, res) => {
  const { title, subjectId, description, duration, readingTimeMinutes } = req.body;
  if (!title || !subjectId) {
    return res.status(400).json({ error: 'عنوان الدرس والمادة التابع لها مطلوبان.' });
  }

  const newLesson: Lesson = {
    id: `less-${Date.now()}`,
    subjectId,
    title: title.trim(),
    order: lessons.filter((l) => l.subjectId === subjectId).length + 1,
    readingTimeMinutes: Number(readingTimeMinutes) || 20,
    simpleExplanation: description || 'شرح الدرس مبسط باللغة العربية والإنجليزية.',
    coreConcept: title.trim(),
    terms: [],
    formulas: [],
    solvedExamples: [],
    commonMistakes: [],
    practiceQuestions: [],
    quiz: [],
    summary: ['ملخص النقاط الأساسية في الدرس'],
  };

  lessons.push(newLesson);

  const subIdx = subjects.findIndex((s) => s.id === subjectId);
  if (subIdx >= 0) {
    subjects[subIdx].lessonsCount = lessons.filter((l) => l.subjectId === subjectId).length;
  }

  res.json({ success: true, lesson: newLesson, lessons });
});

router.put('/admin/lessons/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = lessons.findIndex((l) => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'الدرس غير موجود.' });

  lessons[idx] = {
    ...lessons[idx],
    ...req.body,
  };

  res.json({ success: true, lesson: lessons[idx], lessons });
});

router.delete('/admin/lessons/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const target = lessons.find((l) => l.id === id);
  lessons = lessons.filter((l) => l.id !== id);

  if (target) {
    const subIdx = subjects.findIndex((s) => s.id === target.subjectId);
    if (subIdx >= 0) {
      subjects[subIdx].lessonsCount = lessons.filter((l) => l.subjectId === target.subjectId).length;
    }
  }

  res.json({ success: true, message: 'تم حذف الدرس بنجاح.', lessons });
});

// Admin Delete Student
router.delete('/admin/students/:studentId', requireAuth, requireAdmin, (req, res) => {
  const { studentId } = req.params;
  const deleted = db.deleteUser(studentId);
  res.json({ success: deleted, message: 'تم حذف حساب الطالب بنجاح.' });
});

// Admin Dashboard Statistics
router.get('/admin/stats', requireAuth, requireAdmin, (req, res) => {
  const users = db.getAllUsers().filter((u) => u.role === 'student');
  const subscriptions = db.getAllSubscriptions();
  const activeSubs = subscriptions.filter((s) => s.status === 'active' && new Date(s.expiryDate) > new Date());
  const pendingSubs = subscriptions.filter((s) => s.status === 'pending');
  const expiredSubs = subscriptions.filter((s) => s.status === 'expired' || (s.status === 'active' && new Date(s.expiryDate) <= new Date()));
  const codes = db.getAllActivationCodes();
  const activeCodes = codes.filter((c) => c.isActive !== false && (!c.maxUses || (c.timesUsed || 0) < c.maxUses));
  const requests = db.getAllRequests();
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  res.json({
    totalStudents: users.length,
    activeSubscriptions: activeSubs.length,
    pendingActivations: pendingSubs.length + pendingRequests.length,
    totalCodes: codes.length,
    activeCodes: activeCodes.length,
    totalRequests: requests.length,
    pendingRequests: pendingRequests.length,
    expiredSubscriptions: expiredSubs.length,
  });
});

// Admin Codes List
router.get('/admin/codes', requireAuth, requireAdmin, (req, res) => {
  const codes = db.getAllActivationCodes();
  res.json({ codes });
});

// Admin Create Activation Code
router.post('/admin/codes', requireAuth, requireAdmin, (req, res) => {
  const { code: customCode, planType, durationDays, maxUses, expiresAt, notes } = req.body;

  const generatedCode = customCode ? customCode.trim().toUpperCase() : 'MCT-' + crypto.randomInt(1000, 9999);
  const days = Number(durationDays) || (planType === 'yearly' ? 365 : 30);
  const max = Number(maxUses) || 1;

  const newCode: DBActivationCode = {
    id: `code-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    code: generatedCode,
    planType: planType === 'yearly' ? 'yearly' : 'monthly',
    durationDays: days,
    maxUses: max,
    timesUsed: 0,
    isUsed: false,
    isActive: true,
    usedByStudents: [],
    expiresAt: expiresAt || undefined,
    createdAt: new Date().toISOString(),
    notes: notes || 'كود تم توليده من لوحة الإدارة',
  };

  db.createActivationCode(newCode);

  res.json({
    success: true,
    message: `تم توليد كود التفعيل "${generatedCode}" بنجاح!`,
    code: newCode,
  });
});

// Admin Delete Activation Code
router.delete('/admin/codes/:codeId', requireAuth, requireAdmin, (req, res) => {
  const { codeId } = req.params;
  const success = db.deleteActivationCode(codeId);
  res.json({ success });
});

// Admin Toggle Code Status
router.patch('/admin/codes/:codeId/toggle', requireAuth, requireAdmin, (req, res) => {
  const { codeId } = req.params;
  const codes = db.getAllActivationCodes();
  const target = codes.find((c) => c.id === codeId);
  if (!target) return res.status(404).json({ error: 'الكود غير موجود.' });

  const updated = db.updateActivationCode(codeId, { isActive: !target.isActive });
  res.json({ success: true, code: updated });
});

// Admin Requests List
router.get('/admin/requests', requireAuth, requireAdmin, (req, res) => {
  const requests = db.getAllRequests();
  res.json({ requests });
});

// Admin Approve Request
router.patch('/admin/requests/:requestId/approve', requireAuth, requireAdmin, (req, res) => {
  const { requestId } = req.params;
  const requests = db.getAllRequests();
  const request = requests.find((r) => r.id === requestId);
  if (!request) return res.status(404).json({ error: 'الطلب غير موجود.' });

  let user = db.findUserByPhone(request.phone);
  if (!user) {
    user = {
      id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name: request.studentName,
      phone: request.phone,
      university: request.university,
      studyLevel: 'السنة الأولى',
      major: 'هندسة الميكاترونكس',
      passwordHash: bcrypt.hashSync(request.phone.slice(-6) || '123456', 10),
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    db.createUser(user);
  }

  const durationDays = request.plan === 'yearly' ? 365 : 30;
  const now = new Date();
  const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const sub: DBSubscription = {
    id: `sub-${Date.now()}`,
    userId: user.id,
    plan: request.plan,
    status: 'active',
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    createdAt: now.toISOString(),
    activatedAt: now.toISOString(),
    activationMethod: 'admin_direct',
    notes: `تمت الموافقة وتأكيد الدفع من لوحة الإدارة للطلب ${requestId}`,
  };

  db.createOrUpdateSubscription(sub);
  db.updateRequestStatus(requestId, 'approved');

  res.json({ success: true, message: `تم تفعيل اشتراك الطالب ${request.studentName} بنجاح.` });
});

// Admin Reject Request
router.patch('/admin/requests/:requestId/reject', requireAuth, requireAdmin, (req, res) => {
  const { requestId } = req.params;
  const updated = db.updateRequestStatus(requestId, 'rejected');
  res.json({ success: true, request: updated });
});

// Admin Students List
router.get('/admin/students', requireAuth, requireAdmin, (req, res) => {
  const users = db.getAllUsers().filter((u) => u.role === 'student');
  const subs = db.getAllSubscriptions();

  const studentsWithSubs = users.map((u) => {
    const s = subs.find((sub) => sub.userId === u.id);
    let remainingDays = 0;
    let isExpired = false;
    let isActivated = false;

    if (s && s.status === 'active') {
      const ms = new Date(s.expiryDate).getTime() - Date.now();
      remainingDays = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
      isActivated = remainingDays > 0;
      isExpired = remainingDays <= 0;
    } else if (s && s.status === 'expired') {
      isExpired = true;
    }

    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      university: u.university,
      studyLevel: u.studyLevel,
      major: u.major,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      subscriptionPlan: s?.plan || 'monthly',
      subscriptionStatus: s?.status || 'pending',
      subscriptionStartDate: s?.startDate,
      subscriptionEndDate: s?.expiryDate,
      remainingDays,
      isActivated,
      isExpired,
    };
  });

  res.json({ students: studentsWithSubs });
});

// Admin Update Student Subscription Status
router.patch('/admin/students/:studentId/status', requireAuth, requireAdmin, (req, res) => {
  const { studentId } = req.params;
  const { status, plan, durationDays } = req.body;

  const currentSub = db.getSubscriptionByUserId(studentId);
  const now = new Date();
  const days = Number(durationDays) || (plan === 'yearly' ? 365 : 30);
  const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const updatedSub: DBSubscription = {
    id: currentSub?.id || `sub-${Date.now()}`,
    userId: studentId,
    plan: plan || currentSub?.plan || 'monthly',
    status: status || 'active',
    startDate: currentSub?.startDate || now.toISOString(),
    expiryDate: status === 'active' ? expiryDate.toISOString() : currentSub?.expiryDate || now.toISOString(),
    createdAt: currentSub?.createdAt || now.toISOString(),
    activatedAt: status === 'active' ? now.toISOString() : currentSub?.activatedAt,
    activationMethod: 'admin_direct',
    notes: 'تحديث يدوي من لوحة الإدارة',
  };

  db.createOrUpdateSubscription(updatedSub);
  res.json({ success: true, subscription: updatedSub });
});

// Admin Extend Subscription by 30 days
router.patch('/admin/students/:studentId/extend', requireAuth, requireAdmin, (req, res) => {
  const { studentId } = req.params;
  const { days = 30 } = req.body;

  const currentSub = db.getSubscriptionByUserId(studentId);
  const baseTime = currentSub?.expiryDate && new Date(currentSub.expiryDate) > new Date()
    ? new Date(currentSub.expiryDate).getTime()
    : Date.now();

  const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000);

  const updatedSub: DBSubscription = {
    id: currentSub?.id || `sub-${Date.now()}`,
    userId: studentId,
    plan: currentSub?.plan || 'monthly',
    status: 'active',
    startDate: currentSub?.startDate || new Date().toISOString(),
    expiryDate: newExpiry.toISOString(),
    createdAt: currentSub?.createdAt || new Date().toISOString(),
    activatedAt: new Date().toISOString(),
    activationMethod: 'admin_direct',
    notes: `تم تمديد الاشتراك ${days} يومًا من لوحة الإدارة`,
  };

  db.createOrUpdateSubscription(updatedSub);
  res.json({ success: true, subscription: updatedSub });
});

// Admin Settings
router.get('/admin/settings', (req, res) => {
  const settings = db.getSettings();
  res.json(settings);
});

router.get('/settings', (req, res) => {
  const settings = db.getSettings();
  res.json(settings);
});

router.post('/admin/settings', requireAuth, requireAdmin, (req, res) => {
  const { whatsappNumber, monthlyPriceUSD, yearlyPriceUSD, exchangeRateYR, announcementText } = req.body;

  const current = db.getSettings();
  const updated = db.updateSettings({
    whatsappNumber: whatsappNumber || current.whatsappNumber,
    monthlyPriceUSD: monthlyPriceUSD !== undefined ? Number(monthlyPriceUSD) : current.monthlyPriceUSD,
    yearlyPriceUSD: yearlyPriceUSD !== undefined ? Number(yearlyPriceUSD) : current.yearlyPriceUSD,
    exchangeRateYR: exchangeRateYR !== undefined ? Number(exchangeRateYR) : current.exchangeRateYR,
    announcementText: announcementText !== undefined ? announcementText : current.announcementText,
  });

  res.json({ success: true, settings: updated });
});

// Mount router on both /api and root / so all rewrites match seamlessly
app.use('/api', router);
app.use('/', router);

export default app;
