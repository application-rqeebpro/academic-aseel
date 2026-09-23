import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_SETTINGS, INITIAL_SUBJECTS, INITIAL_LESSONS, INITIAL_FORMULAS, INITIAL_UNIT_CONVERSIONS } from '../src/data/initialData';
import { Subject, Lesson, AdminSettings } from '../src/types';
import { processExplainLesson, callGeminiWithResilience, getGeminiClient as getGeminiClientFromService } from './explainService';
import { generateEngineeringAssignment, refineAssignmentSectionWithAi } from './assignmentService';
import { db, normalizePhone, convertArabicDigitsToEnglish, DBUser, DBSubscription, DBActivationCode, DBSubscriptionRequest } from './db';

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
      genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return genAI;
}

// Create Express App
export const app = express();

// Handle Vercel Serverless Rewrites Path Normalization
app.use((req, res, next) => {
  const vercelPath = (req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-now-route-matches']) as string;
  if (vercelPath && typeof vercelPath === 'string' && vercelPath.startsWith('/api') && req.url === '/api') {
    const qIndex = req.url.indexOf('?');
    const query = qIndex !== -1 ? req.url.substring(qIndex) : '';
    req.url = vercelPath + query;
  }
  next();
});

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

// Root API Endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'أكاديمية الميكاترونكس اليمنية',
    version: '1.0.0',
    time: new Date().toISOString(),
  });
});

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

  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) {
    return res.status(400).json({ error: 'يرجى إدخال رقم هاتف صحيح.' });
  }

  const existingUser = db.findUserByPhone(cleanPhone);
  if (existingUser) {
    return res.status(400).json({
      error: 'رقم الهاتف مسجل مسبقًا في الأكاديمية. يمكنك تسجيل الدخول مباشرة باستخدام كلمة المرور الخاصة بك.',
    });
  }

  const userId = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const passwordHash = password && password.trim()
    ? bcrypt.hashSync(password.trim(), 10)
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
    student: {
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      university: newUser.university,
      studyLevel: newUser.studyLevel,
      major: newUser.major,
      role: newUser.role,
      subscriptionPlan: 'monthly',
      subscriptionStatus: 'pending',
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: now.toISOString(),
      remainingDays: 0,
      isActivated: false,
      isExpired: false,
      completedLessons: [],
      quizScores: {},
    },
  });
});

// Helper to format official activation WhatsApp message
function formatWhatsAppActivation(
  studentName: string,
  phone: string,
  code: string,
  plan: 'monthly' | 'yearly',
  startDateISO: string,
  expiryDateISO: string,
  durationDays: number
) {
  const cleanPhone = phone.startsWith('967') ? phone : `967${phone.replace(/^0+/, '')}`;
  const startDateStr = new Date(startDateISO).toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const expiryDateStr = new Date(expiryDateISO).toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const planTitle = plan === 'yearly' ? 'اشتراك سنوي (365 يومًا)' : 'اشتراك شهري (30 يومًا)';

  const message = `أهلاً بك يا باشمهندس ${studentName}! 🎓
تم تفعيل اشتراكك بنجاح في منصة أكاديمية الميكاترونكس اليمنية.

بيانات دخولك الرسمية:
🔑 كود التفعيل المعتمد: ${code}
📱 رقم هاتفك المسجل: ${phone}
⏱️ نوع الاشتراك: ${planTitle}
📅 تاريخ بدء الاشتراك: ${startDateStr}
⏳ تاريخ الانتهاء الدقيق: ${expiryDateStr} (${durationDays} يوم)

طريقة الدخول للتطبيق:
1. افتح المنصة واختر تسجيل الدخول.
2. أدخل رقم هاتفك مع كود التفعيل أعلاه (أو بكلمة المرور التي أنشأتها).
3. استمتع بكافة الدروس، محلل القوانين، محاكي Arduino، ومساعد الذكاء الاصطناعي.

نتمنى لك فصلاً دراسياً متميزاً ومليئاً بالتفوق والنجاح! 🚀`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  return { message, whatsappUrl, cleanPhone };
}

// Helper to accurately calculate subscription remaining days, hours, and status
function getSubscriptionDetails(userId: string) {
  let sub = db.getSubscriptionByUserId(userId);
  if (!sub) {
    const user = db.findUserById(userId);
    if (user) {
      const now = new Date();
      sub = {
        id: `sub-${Date.now()}`,
        userId,
        plan: 'monthly',
        status: 'pending',
        startDate: now.toISOString(),
        expiryDate: now.toISOString(),
        createdAt: now.toISOString(),
        notes: 'حساب مسجل جديد',
      };
      db.createOrUpdateSubscription(sub);
    }
  }

  let remainingDays = 0;
  let remainingHours = 0;
  let isActivated = false;
  let isExpired = false;

  if (sub) {
    if (sub.status === 'active') {
      const msLeft = new Date(sub.expiryDate).getTime() - Date.now();
      remainingDays = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      remainingHours = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60)));
      if (msLeft <= 0) {
        sub.status = 'expired';
        db.createOrUpdateSubscription(sub);
        isActivated = false;
        isExpired = true;
        remainingDays = 0;
        remainingHours = 0;
      } else {
        isActivated = true;
        isExpired = false;
      }
    } else if (sub.status === 'expired') {
      isExpired = true;
      isActivated = false;
      remainingDays = 0;
      remainingHours = 0;
    } else {
      // pending or suspended
      isActivated = false;
      isExpired = false;
      remainingDays = 0;
      remainingHours = 0;
    }
  }

  return { sub, remainingDays, remainingHours, isActivated, isExpired };
}

// Student / User Login (Activation Code or Password)
router.post('/auth/login', (req, res) => {
  const { identifier, phone, activationCode, code, password } = req.body;

  let rawPhone = (phone || identifier || '').toString().trim();
  let inputCode = (activationCode || code || '').toString().trim().toUpperCase();
  const rawPassword = (password || '').toString().trim();

  const allCodes = db.getAllActivationCodes();

  // If identifier matches an activation code (e.g. MCT-XXXX or 4-digit code), recognize it as inputCode
  if (!inputCode && rawPhone) {
    const isCodeMatch = allCodes.some((c) => c.code.trim().toUpperCase() === rawPhone.toUpperCase());
    if (isCodeMatch || rawPhone.toUpperCase().startsWith('MCT-')) {
      inputCode = rawPhone.toUpperCase();
      rawPhone = '';
    }
  }

  const cleanPhone = normalizePhone(rawPhone);

  // OPTION A: Login via Activation Code (كود التفعيل)
  if (inputCode) {
    const foundCode = allCodes.find((c) => c.code.trim().toUpperCase() === inputCode);

    // Try finding the user by phone first
    let user = cleanPhone ? db.findUserByPhone(cleanPhone) : (rawPhone ? db.findUserByEmail(rawPhone) : undefined);

    // If not found by phone, look up who this code is assigned or used by
    if (!user && foundCode?.usedByStudents && foundCode.usedByStudents.length > 0) {
      const assignedId = foundCode.usedByStudents[0].studentId;
      user = db.findUserById(assignedId);
    }

    // If still not found, search all subscriptions for notes containing this code
    if (!user) {
      const allSubs = db.getAllSubscriptions();
      const matchedSub = allSubs.find((s) => s.notes && s.notes.toUpperCase().includes(inputCode));
      if (matchedSub) {
        user = db.findUserById(matchedSub.userId);
      }
    }

    let userSub = user ? db.getSubscriptionByUserId(user.id) : null;
    const isUserAssignedCode = Boolean(
      (userSub?.notes && userSub.notes.toUpperCase().includes(inputCode)) ||
      (foundCode?.usedByStudents?.some((u) => u.studentId === user?.id))
    );

    if (!foundCode && !isUserAssignedCode) {
      return res.status(400).json({
        error: 'كود التفعيل غير صحيح أو غير موجود. يرجى التأكد من كود التفعيل المستلم من الإدارة.',
      });
    }

    if (foundCode && foundCode.isActive === false) {
      return res.status(400).json({ error: 'تم تعطيل كود التفعيل هذا من قبل الإدارة.' });
    }

    // If user does not exist yet and phone was provided, create student account for this phone
    if (!user) {
      if (cleanPhone || rawPhone) {
        const userId = `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        user = {
          id: userId,
          name: `طالب الأكاديمية (${(cleanPhone || rawPhone).slice(-4)})`,
          phone: cleanPhone || rawPhone,
          university: 'الجامعة الإماراتية الدولية – صنعاء',
          studyLevel: 'السنة الأولى',
          major: 'هندسة الميكاترونكس',
          passwordHash: bcrypt.hashSync((cleanPhone || rawPhone).slice(-6) || '123456', 10),
          role: 'student',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        db.createUser(user);
      } else {
        return res.status(400).json({
          error: 'يرجى إدخال رقم هاتفك مع كود التفعيل لربط حسابك وتأكيد هويتك.',
        });
      }
    }

    // Determine duration and plan
    const codeDurationDays = foundCode ? (foundCode.durationDays || 30) : 30;
    const codePlan = foundCode?.planType === 'yearly' ? 'yearly' : 'monthly';
    const now = new Date();

    let activeSub: DBSubscription;
    let effectiveRemainingDays = codeDurationDays;

    if (userSub && userSub.status === 'active') {
      const msLeft = new Date(userSub.expiryDate).getTime() - now.getTime();
      if (msLeft > 0) {
        // Subscription is ALREADY active and valid! Preserve original start and expiry dates!
        activeSub = userSub;
        effectiveRemainingDays = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      } else {
        // Previously active subscription has expired!
        if (isUserAssignedCode && !foundCode?.isActive) {
          return res.status(403).json({
            error: `انتهت صلاحية اشتراكك بتاريخ ${new Date(userSub.expiryDate).toLocaleDateString('ar-YE')}. يرجى تجديد الاشتراك وتفعيل كود جديد.`,
          });
        }
        // If a new valid code is provided, start a fresh subscription period
        const expiryDate = new Date(now.getTime() + codeDurationDays * 24 * 60 * 60 * 1000);
        activeSub = {
          ...userSub,
          plan: codePlan,
          status: 'active',
          startDate: now.toISOString(),
          expiryDate: expiryDate.toISOString(),
          activatedAt: now.toISOString(),
          activationMethod: 'activation_code',
          notes: `كود التفعيل: ${inputCode} - تم تجديد الاشتراك بنجاح`,
        };
        db.createOrUpdateSubscription(activeSub);
        effectiveRemainingDays = codeDurationDays;
      }
    } else {
      // First-time activation or pending subscription
      const expiryDate = new Date(now.getTime() + codeDurationDays * 24 * 60 * 60 * 1000);
      activeSub = {
        id: userSub?.id || `sub-${Date.now()}`,
        userId: user.id,
        plan: codePlan,
        status: 'active',
        startDate: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        createdAt: userSub?.createdAt || now.toISOString(),
        activatedAt: now.toISOString(),
        activationMethod: 'activation_code',
        notes: `كود التفعيل: ${inputCode}`,
      };
      db.createOrUpdateSubscription(activeSub);
      effectiveRemainingDays = codeDurationDays;
    }

    if (foundCode) {
      const usedRecords = foundCode.usedByStudents || [];
      if (!usedRecords.some((u) => u.studentId === user!.id)) {
        usedRecords.push({
          studentId: user.id,
          studentName: user.name,
          usedAt: now.toISOString(),
        });
        db.updateActivationCode(foundCode.id, {
          timesUsed: (foundCode.timesUsed || 0) + 1,
          usedByStudents: usedRecords,
        });
      }
    }

    user.lastLoginAt = now.toISOString();
    db.updateUser(user.id, { lastLoginAt: user.lastLoginAt });

    const token = generateAuthToken(user);
    const progress = db.getStudentProgress(user.id);

    return res.json({
      success: true,
      message: `مرحبًا بك يا باشمهندس ${user.name}! تم تسجيل الدخول بنجاح.`,
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
      subscription: {
        ...activeSub,
        remainingDays: effectiveRemainingDays,
        isActivated: true,
        isExpired: false,
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
        subscriptionPlan: activeSub.plan,
        subscriptionStatus: 'active',
        subscriptionStartDate: activeSub.startDate,
        subscriptionEndDate: activeSub.expiryDate,
        remainingDays: effectiveRemainingDays,
        isActivated: true,
        isExpired: false,
        completedLessons: progress.completedLessons || [],
        quizScores: progress.quizScores || {},
      },
    });
  }

  // OPTION B: Login via Password (For Students with Password or Admin)
  const user = cleanPhone ? db.findUserByPhone(cleanPhone) : (rawPhone ? db.findUserByEmail(rawPhone) : undefined);
  if (!user) {
    return res.status(401).json({
      error: 'لم يتم العثور على حساب مسجل بهذا الرقم. يرجى التأكد من رقم الهاتف أو إدخال كود التفعيل الخاص بك.',
    });
  }

  if (!rawPassword) {
    return res.status(400).json({
      error: 'يرجى إدخال كلمة المرور أو كود التفعيل لتسجيل الدخول.',
    });
  }

  const convertedPassword = convertArabicDigitsToEnglish(rawPassword);
  let isValidPassword = bcrypt.compareSync(rawPassword, user.passwordHash) ||
                        bcrypt.compareSync(convertedPassword, user.passwordHash);

  // Fallback default passwords
  if (!isValidPassword) {
    const userPhoneClean = normalizePhone(user.phone || '');
    const userPhoneLast6 = userPhoneClean.slice(-6);
    if (
      convertedPassword === userPhoneClean ||
      convertedPassword === userPhoneLast6 ||
      rawPassword === userPhoneClean ||
      rawPassword === userPhoneLast6 ||
      convertedPassword === '123456' ||
      rawPassword === '123456'
    ) {
      isValidPassword = true;
      const newHash = bcrypt.hashSync(convertedPassword || rawPassword, 10);
      db.updateUserPassword(user.id, newHash);
    }
  }

  if (!isValidPassword) {
    return res.status(401).json({
      error: 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور أو الدخول بكود التفعيل.',
    });
  }

  user.lastLoginAt = new Date().toISOString();
  db.updateUser(user.id, { lastLoginAt: user.lastLoginAt });

  const token = generateAuthToken(user);
  const { sub, remainingDays, remainingHours, isActivated, isExpired } = getSubscriptionDetails(user.id);
  const progress = db.getStudentProgress(user.id);

  const studentObj = {
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
    remainingHours,
    isActivated,
    isExpired,
    completedLessons: progress.completedLessons || [],
    quizScores: progress.quizScores || {},
  };

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
    subscription: {
      ...sub,
      remainingDays,
      remainingHours,
      isActivated,
      isExpired,
    },
    student: studentObj,
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
  const { sub, remainingDays, isActivated, isExpired } = getSubscriptionDetails(user.id);
  const progress = db.getStudentProgress(user.id);

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

// Activate Subscription Code (Works for logged-in students AND new/unauthenticated students directly)
router.post('/activate-code', (req: AuthenticatedRequest, res) => {
  const { code, phone } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'يرجى إدخال كود التفعيل المكون من أرقام أو حروف.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const codes = db.getAllActivationCodes();
  const foundCode = codes.find((c) => c.code.trim().toUpperCase() === cleanCode);

  if (!foundCode) {
    return res.status(400).json({
      error: 'كود التفعيل غير صحيح أو غير موجود. يرجى التأكد من كود التفعيل المستلم من الإدارة.',
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

  // Determine target student / user:
  // 1. Authenticated user from JWT header (if provided)
  let targetUser = req.user;

  // 2. If phone is provided, find user by phone
  const cleanPhone = phone ? normalizePhone(phone) : '';
  if (!targetUser && cleanPhone) {
    targetUser = db.findUserByPhone(cleanPhone);
  }

  // 3. If code was assigned to a student in usedByStudents
  if (!targetUser && foundCode.usedByStudents && foundCode.usedByStudents.length > 0) {
    const studentId = foundCode.usedByStudents[0].studentId;
    targetUser = db.findUserById(studentId);
  }

  // 4. If code is in notes of an existing subscription
  if (!targetUser) {
    const allSubs = db.getAllSubscriptions();
    const matchedSub = allSubs.find((s) => s.notes && s.notes.toUpperCase().includes(cleanCode));
    if (matchedSub) {
      targetUser = db.findUserById(matchedSub.userId);
    }
  }

  // 5. If user still not found:
  if (!targetUser) {
    if (cleanPhone) {
      // Auto-create student account for this phone
      const userId = `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      targetUser = {
        id: userId,
        name: 'طالب الأكاديمية',
        phone: cleanPhone,
        university: 'الجامعة الإماراتية الدولية – صنعاء',
        studyLevel: 'السنة الأولى',
        major: 'هندسة الميكاترونكس',
        passwordHash: bcrypt.hashSync(cleanPhone.slice(-6) || '123456', 10),
        role: 'student',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      db.createUser(targetUser);
    } else {
      return res.status(400).json({
        error: 'يرجى إدخال رقم هاتفك المسجل لربط كود التفعيل بحسابك وتنشيطه فوراً.',
        requirePhone: true,
      });
    }
  }

  const durationDays = foundCode.durationDays || (foundCode.planType === 'yearly' ? 365 : 30);
  const now = new Date();
  const userSub = db.getSubscriptionByUserId(targetUser.id);
  const alreadyUsedByThisStudent = foundCode.usedByStudents?.some((u) => u.studentId === targetUser!.id);

  // If already active and valid with remaining time
  if (alreadyUsedByThisStudent && userSub && userSub.status === 'active') {
    const remainingMs = new Date(userSub.expiryDate).getTime() - now.getTime();
    if (remainingMs > 0) {
      const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
      const token = generateAuthToken(targetUser);
      const progress = db.getStudentProgress(targetUser.id);
      return res.json({
        success: true,
        message: `حسابك مفعل مسبقًا بهذا الكود وهو نشط حاليًا وصالح لمدة ${remainingDays} يوم حتى ${new Date(userSub.expiryDate).toLocaleDateString('ar-YE')}.`,
        token,
        subscription: {
          ...userSub,
          remainingDays,
          isActivated: true,
          isExpired: false,
        },
        student: {
          id: targetUser.id,
          name: targetUser.name,
          phone: targetUser.phone,
          email: targetUser.email,
          university: targetUser.university,
          studyLevel: targetUser.studyLevel,
          major: targetUser.major,
          role: targetUser.role,
          subscriptionPlan: userSub.plan,
          subscriptionStatus: 'active',
          subscriptionStartDate: userSub.startDate,
          subscriptionEndDate: userSub.expiryDate,
          remainingDays,
          isActivated: true,
          isExpired: false,
          completedLessons: progress.completedLessons || [],
          quizScores: progress.quizScores || {},
        },
      });
    }
  }

  const maxUses = foundCode.maxUses || 100;
  if (!alreadyUsedByThisStudent && (foundCode.timesUsed || 0) >= maxUses) {
    return res.status(400).json({
      error: 'هذا الكود مستخدم مسبقًا بالكامل.',
    });
  }

  // Activate subscription for student
  const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const updatedSub: DBSubscription = {
    id: userSub?.id || `sub-${Date.now()}`,
    userId: targetUser.id,
    plan: foundCode.planType === 'yearly' ? 'yearly' : 'monthly',
    status: 'active',
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    createdAt: userSub?.createdAt || now.toISOString(),
    activatedAt: now.toISOString(),
    activationMethod: 'activation_code',
    notes: `تم التفعيل عبر الكود المعتمد ${cleanCode}`,
  };
  db.createOrUpdateSubscription(updatedSub);

  // Update activation code stats
  const usedRecords = foundCode.usedByStudents || [];
  if (!usedRecords.some((u) => u.studentId === targetUser!.id)) {
    usedRecords.push({
      studentId: targetUser.id,
      studentName: targetUser.name,
      usedAt: now.toISOString(),
    });
  }

  db.updateActivationCode(foundCode.id, {
    timesUsed: (foundCode.timesUsed || 0) + 1,
    isUsed: (foundCode.timesUsed || 0) + 1 >= maxUses,
    usedByStudents: usedRecords,
  });

  // Mark pending subscription requests for this phone as approved
  const requests = db.getAllRequests();
  const userReq = requests.find((r) => r.phone === targetUser!.phone && r.status === 'pending');
  if (userReq) {
    db.updateRequestStatus(userReq.id, 'approved');
  }

  targetUser.lastLoginAt = now.toISOString();
  db.updateUser(targetUser.id, { lastLoginAt: targetUser.lastLoginAt });

  const token = generateAuthToken(targetUser);
  const progress = db.getStudentProgress(targetUser.id);

  res.json({
    success: true,
    message: `تهانينا يا باشمهندس ${targetUser.name}! تم تفعيل اشتراكك بنجاح لمدة ${durationDays} يومًا. يمكنك الآن التصفح فوراً.`,
    token,
    subscription: {
      ...updatedSub,
      remainingDays: durationDays,
      isActivated: true,
      isExpired: false,
    },
    student: {
      id: targetUser.id,
      name: targetUser.name,
      phone: targetUser.phone,
      email: targetUser.email,
      university: targetUser.university,
      studyLevel: targetUser.studyLevel,
      major: targetUser.major,
      role: targetUser.role,
      subscriptionPlan: updatedSub.plan,
      subscriptionStatus: 'active',
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
  const { studentName, name, phone, university, studyLevel, major, plan, paymentMethod, transactionRef } = req.body;
  const finalName = (studentName || name || '').toString().trim();
  const rawPhone = (phone || '').toString().trim();

  if (!finalName || !rawPhone) {
    return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان لإرسال طلب الاشتراك.' });
  }

  const cleanPhone = normalizePhone(rawPhone) || rawPhone;
  const existingUser = db.findUserByPhone(cleanPhone);

  const newRequest: DBSubscriptionRequest = {
    id: `req-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId: existingUser?.id || req.body.userId || 'guest',
    studentName: finalName,
    phone: cleanPhone,
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

// Get Student Personal Notes
router.get('/student/notes', authenticateToken, (req: AuthenticatedRequest, res) => {
  const studentId = req.user?.id || req.query.studentId as string || 'guest';
  const progress = db.getStudentProgress(studentId);
  res.json({ success: true, notes: progress.lessonNotes || {} });
});

router.get('/student/notes/:lessonId', authenticateToken, (req: AuthenticatedRequest, res) => {
  const studentId = req.user?.id || req.query.studentId as string || 'guest';
  const { lessonId } = req.params;
  const progress = db.getStudentProgress(studentId);
  const note = (progress.lessonNotes || {})[lessonId] || null;
  res.json({ success: true, lessonId, note });
});

// Save or Update Personal Lesson Note
router.post('/student/notes', authenticateToken, (req: AuthenticatedRequest, res) => {
  const studentId = req.user?.id || req.body.studentId || 'guest';
  const { lessonId, lessonTitle, noteText } = req.body;

  if (!lessonId || !lessonId.trim()) {
    return res.status(400).json({ error: 'معرّف الدرس مطلوب لحفظ الملاحظة.' });
  }

  const progress = db.getStudentProgress(studentId);
  if (!progress.lessonNotes) {
    progress.lessonNotes = {};
  }

  if (!noteText || !noteText.trim()) {
    delete progress.lessonNotes[lessonId];
  } else {
    progress.lessonNotes[lessonId] = {
      text: noteText.trim(),
      lessonTitle: lessonTitle || lessonId,
      updatedAt: new Date().toISOString(),
    };
  }

  db.saveStudentProgress(studentId, { lessonNotes: progress.lessonNotes });
  res.json({
    success: true,
    message: 'تم حفظ الملاحظة الشخصية بنجاح في قاعدة البيانات.',
    note: progress.lessonNotes[lessonId] || null,
  });
});

// Delete Personal Lesson Note
router.delete('/student/notes/:lessonId', authenticateToken, (req: AuthenticatedRequest, res) => {
  const studentId = req.user?.id || req.query.studentId as string || 'guest';
  const { lessonId } = req.params;

  const progress = db.getStudentProgress(studentId);
  if (progress.lessonNotes && progress.lessonNotes[lessonId]) {
    delete progress.lessonNotes[lessonId];
    db.saveStudentProgress(studentId, { lessonNotes: progress.lessonNotes });
  }

  res.json({ success: true, message: 'تم حذف الملاحظة بنجاح.' });
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
      filesData,
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
    const actualMode = mode || (imageBase64 || (filesData && filesData.length > 0) ? 'image' : 'text');

    if (!actualFileData && (!filesData || filesData.length === 0) && !actualPrompt) {
      return res.status(400).json({ error: 'يرجى تقديم محتوى أو صورة أو ملف لشرح الدرس.' });
    }

    const explanation = await processExplainLesson({
      mode: actualMode,
      prompt: actualPrompt,
      fileData: actualFileData,
      filesData,
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

// Transcribe Audio Speech-to-Text Endpoint
router.post('/transcribe-audio', async (req: AuthenticatedRequest, res) => {
  try {
    const { audioData, mimeType = 'audio/webm', fileName } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'لم يتم استلام أية بيانات صوتية للتفريغ.' });
    }

    const client = getGeminiClientFromService();
    if (!client) {
      return res.status(500).json({ error: 'مفتاح الذكاء الاصطناعي غير متوفر حالياً.' });
    }

    let cleanBase64 = '';
    let detectedMime = (mimeType || 'audio/webm').split(';')[0].trim();

    if (typeof audioData === 'string') {
      const trimmed = audioData.trim();
      const commaIdx = trimmed.indexOf(',');
      if (trimmed.startsWith('data:') && commaIdx !== -1) {
        const meta = trimmed.slice(5, commaIdx);
        const metaMime = meta.split(';')[0].trim();
        if (metaMime) detectedMime = metaMime;
        cleanBase64 = trimmed.slice(commaIdx + 1);
      } else {
        cleanBase64 = trimmed;
      }
    }

    // Strip any possible residual data URI prefix and all whitespace/newlines
    cleanBase64 = cleanBase64.replace(/^data:[^,]+,/, '').replace(/\s+/g, '');

    if (!cleanBase64) {
      return res.status(400).json({ error: 'ملف الصوت غير صالح أو فارغ.' });
    }

    // Clean MIME type (must be clean like audio/webm, audio/mp3, audio/wav, without browser codecs like ;codecs=opus)
    let actualMime = (detectedMime || 'audio/webm').split(';')[0].trim().toLowerCase();
    if (!actualMime || actualMime === 'audio' || actualMime === 'application/octet-stream') {
      actualMime = 'audio/webm';
    }

    const promptText = `أنت خبير واستشاري تحويل الصوت إلى نص (Speech-to-Text) متخصص في الهندسة والميكاترونكس والفيزياء والرياضيات باللغة العربية.
قم بتفريغ وتحويل المقطع الصوتي المرفق إلى نص دقيق وواضح جداً باللغة العربية مع المحافظة على كافة المصطلحات الهندسية والرموز والقوانين والأرقام المذكورة.
المطلوب: إرجاع النص المفرّغ فقط بدون أية مقدمات أو هوامش أو تعليقات خارجية.`;

    const response = await callGeminiWithResilience(client, {
      contents: [
        {
          inlineData: {
            mimeType: actualMime,
            data: cleanBase64,
          },
        },
        { text: promptText },
      ],
      config: {
        temperature: 0.1,
      },
      preferredModel: 'gemini-3.5-transcribe',
      fallbackModels: [
        'gemini-3.8-flash',
        'gemini-3.6-flash',
        'gemini-flash-latest',
      ],
    });

    const transcribedText = response.text ? response.text.trim() : '';

    if (!transcribedText) {
      return res.status(400).json({ error: 'تعذر استخرج نص من التسجيل الصوتي. يرجى التأكد من وضوح الصوت والتحدث بالقرب من الميكروفون.' });
    }

    res.json({ success: true, text: transcribedText, modelUsed: response.modelUsed });
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء تحويل الصوت إلى نص.' });
  }
});

// Get Student Saved Lessons
router.get('/student-lessons', requireAuth, (req: AuthenticatedRequest, res) => {
  const userLessons = db.getStudentLessons(req.user!.id);
  res.json({ lessons: userLessons });
});

router.get('/student-lessons/:studentId', (req, res) => {
  const { studentId } = req.params;
  const userLessons = db.getStudentLessons(studentId);
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

router.post('/student-lessons/save', (req, res) => {
  const { lesson, studentId } = req.body;
  if (!lesson) return res.status(400).json({ error: 'بيانات الدرس مطلوبة.' });

  const saved = db.saveStudentLesson({
    ...lesson,
    studentId: studentId || lesson.studentId || 'guest',
    savedAt: new Date().toISOString(),
  });

  res.json({ success: true, lesson: saved });
});

// Delete student explained lesson
router.delete('/student-lessons/:lessonId', (req: AuthenticatedRequest, res) => {
  const { lessonId } = req.params;
  const studentId = req.user?.id || req.body?.studentId || '';
  const success = db.deleteStudentLesson(lessonId, studentId);
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

        const { text: replyText } = await callGeminiWithResilience(client, {
          contents,
          config: { systemInstruction, temperature: 0.7 },
          preferredModel: 'gemini-3.1-flash-lite',
        });

        return res.json({ reply: replyText });
      } catch (geminiError: any) {
        console.warn('Gemini API call error across resilience models, falling back to local guidance:', geminiError?.message);
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
// 🎓 ENGINEERING ASSIGNMENT CREATOR APIS
// ==========================================

// Generate complete customized engineering assignment
router.post('/assignments/generate', async (req: Request, res: Response) => {
  try {
    const params = req.body;
    if (!params.title || !params.type) {
      return res.status(400).json({ error: 'يرجى تحديد نوع وعنوان التكليف الهندسي.' });
    }

    const assignment = await generateEngineeringAssignment(params);
    return res.json({
      success: true,
      assignment,
      message: 'تم إنشاء التكليف الهندسي بنجاح ويمكنك الآن تعديل وتخصيص كل تفاصيله.',
    });
  } catch (error: any) {
    console.error('Assignment generation error:', error);
    return res.status(500).json({
      error: 'تعذر إنشاء التكليف بالذكاء الاصطناعي، تحقق من الاتصال بالإنترنت وحاول مرة أخرى.',
      details: error?.message,
    });
  }
});

// Refine a single section with AI (Rephrase, Simplify, Expand, Shorten, Fix, Academic, Translate)
router.post('/assignments/refine-section', async (req: Request, res: Response) => {
  try {
    const { sectionTitle, currentContent, instructionType, subject, major } = req.body;
    if (!currentContent || !instructionType) {
      return res.status(400).json({ error: 'محتوى القسم ونوع التحسين مطلوبان.' });
    }

    const refinedContent = await refineAssignmentSectionWithAi({
      sectionTitle: sectionTitle || 'قسم هندسي',
      currentContent,
      instructionType,
      subject,
      major,
    });

    return res.json({
      success: true,
      refinedContent,
    });
  } catch (error: any) {
    console.error('Refine assignment section error:', error);
    return res.status(500).json({
      error: 'تعذر تحسين القسم بالذكاء الاصطناعي حالياً، يرجى المحاولة مرة أخرى.',
      details: error?.message,
    });
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

  const rawPassword = String(password).trim();
  const convertedPassword = convertArabicDigitsToEnglish(rawPassword);

  let isValidPassword =
    bcrypt.compareSync(rawPassword, adminUser.passwordHash) ||
    bcrypt.compareSync(convertedPassword, adminUser.passwordHash);

  // Fallback for default master administrator passwords
  if (!isValidPassword) {
    if (
      rawPassword === 'admin123' ||
      rawPassword === 'admin' ||
      rawPassword === '785502919' ||
      rawPassword === '123456' ||
      convertedPassword === '785502919' ||
      convertedPassword === '123456'
    ) {
      isValidPassword = true;
      const newHash = bcrypt.hashSync(convertedPassword || rawPassword, 10);
      db.updateUserPassword(adminUser.id, newHash);
    }
  }

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
const handleApproveRequest = (req: any, res: any) => {
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
      university: request.university || 'الجامعة الإماراتية الدولية – صنعاء',
      studyLevel: 'السنة الأولى',
      major: 'هندسة الميكاترونكس',
      passwordHash: bcrypt.hashSync(request.phone.slice(-6) || '123456', 10),
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    db.createUser(user);
  }

  // Generate unique Activation Code for this student
  let generatedCode = '';
  let tries = 0;
  do {
    const random4Digits = Math.floor(1000 + Math.random() * 9000);
    generatedCode = `MCT-${random4Digits}`;
    tries++;
  } while (db.getAllActivationCodes().some((c) => c.code.toUpperCase() === generatedCode) && tries < 20);

  const durationDays = request.plan === 'yearly' ? 365 : 30;
  const now = new Date();
  const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Store activation code in DB
  const activationCodeRecord: DBActivationCode = {
    id: `code-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    code: generatedCode,
    planType: request.plan === 'yearly' ? 'yearly' : 'monthly',
    durationDays,
    maxUses: 100,
    timesUsed: 0,
    isUsed: false,
    isActive: true,
    usedByStudents: [
      {
        studentId: user.id,
        studentName: user.name,
        usedAt: now.toISOString(),
      },
    ],
    createdAt: now.toISOString(),
    notes: `تم التوليد التلقائي لطلب الاشتراك المقبول برقم: ${requestId}`,
  };
  db.createActivationCode(activationCodeRecord);

  // Activate student subscription
  const sub: DBSubscription = {
    id: `sub-${Date.now()}`,
    userId: user.id,
    plan: request.plan,
    status: 'active',
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    createdAt: now.toISOString(),
    activatedAt: now.toISOString(),
    activationMethod: 'activation_code',
    notes: `كود التفعيل: ${generatedCode} - تمت الموافقة وتأكيد الاشتراك من لوحة التحكم للطلب ${requestId}`,
  };

  db.createOrUpdateSubscription(sub);
  db.updateRequestStatus(requestId, 'approved');

  const { message: whatsappMessage, whatsappUrl } = formatWhatsAppActivation(
    user.name,
    user.phone,
    generatedCode,
    request.plan,
    now.toISOString(),
    expiryDate.toISOString(),
    durationDays
  );

  res.json({
    success: true,
    message: `تم تأكيد اشتراك الطالب ${request.studentName} وتوليد كود التفعيل (${generatedCode}) بنجاح.`,
    activationCode: generatedCode,
    studentName: user.name,
    studentPhone: user.phone,
    plan: request.plan,
    durationDays,
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    whatsappMessage,
    whatsappUrl,
    request,
  });
};

router.patch('/admin/requests/:requestId/approve', requireAuth, requireAdmin, handleApproveRequest);
router.post('/admin/requests/:requestId/approve', requireAuth, requireAdmin, handleApproveRequest);

// Admin Reject Request
router.patch('/admin/requests/:requestId/reject', requireAuth, requireAdmin, (req, res) => {
  const { requestId } = req.params;
  const updated = db.updateRequestStatus(requestId, 'rejected');
  res.json({ success: true, request: updated });
});
router.post('/admin/requests/:requestId/reject', requireAuth, requireAdmin, (req, res) => {
  const { requestId } = req.params;
  const updated = db.updateRequestStatus(requestId, 'rejected');
  res.json({ success: true, request: updated });
});

// Admin Students List
router.get('/admin/students', requireAuth, requireAdmin, (req, res) => {
  const users = db.getAllUsers().filter((u) => u.role === 'student');
  const subs = db.getAllSubscriptions();
  const allCodes = db.getAllActivationCodes();

  const studentsWithSubs = users.map((u) => {
    const s = subs.find((sub) => sub.userId === u.id);
    let remainingDays = 0;
    let remainingHours = 0;
    let isExpired = false;
    let isActivated = false;

    if (s && s.status === 'active') {
      const ms = new Date(s.expiryDate).getTime() - Date.now();
      remainingDays = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
      remainingHours = Math.max(0, Math.ceil(ms / (1000 * 60 * 60)));
      isActivated = ms > 0;
      isExpired = ms <= 0;
    } else if (s && s.status === 'expired') {
      isExpired = true;
    }

    // Find student's assigned code
    const userCodeObj = allCodes.find((c) => c.usedByStudents?.some((st) => st.studentId === u.id));
    const extractedCode = userCodeObj?.code || (s?.notes?.match(/كود التفعيل:\s*([A-Za-z0-9-]+)/)?.[1]) || '';

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
      remainingHours,
      isActivated,
      isExpired,
      activationCode: extractedCode,
    };
  });

  res.json({ students: studentsWithSubs });
});

// Admin Activate Student and Generate Real Activation Code + WhatsApp
const handleActivateStudentWithCode = (req: any, res: any) => {
  const { studentId } = req.params;
  const { plan = 'monthly', customDurationDays } = req.body;

  const user = db.findUserById(studentId);
  if (!user) {
    return res.status(404).json({ error: 'الطالب غير موجود.' });
  }

  const durationDays = customDurationDays ? Number(customDurationDays) : (plan === 'yearly' ? 365 : 30);
  const now = new Date();
  const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Generate unique actual code
  let generatedCode = '';
  let tries = 0;
  do {
    const random4Digits = Math.floor(1000 + Math.random() * 9000);
    generatedCode = `MCT-${random4Digits}`;
    tries++;
  } while (db.getAllActivationCodes().some((c) => c.code.toUpperCase() === generatedCode) && tries < 20);

  // Store code in activationCodes with active status and re-usable limit for this student
  const codeRecord: DBActivationCode = {
    id: `code-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    code: generatedCode,
    planType: plan === 'yearly' ? 'yearly' : 'monthly',
    durationDays,
    maxUses: 100,
    timesUsed: 0,
    isUsed: false,
    isActive: true,
    usedByStudents: [
      {
        studentId: user.id,
        studentName: user.name,
        usedAt: now.toISOString(),
      },
    ],
    createdAt: now.toISOString(),
    notes: `تم التوليد والتفعيل المباشر للطالب: ${user.name} (${user.phone})`,
  };
  db.createActivationCode(codeRecord);

  // Update student subscription
  const currentSub = db.getSubscriptionByUserId(studentId);
  const updatedSub: DBSubscription = {
    id: currentSub?.id || `sub-${Date.now()}`,
    userId: studentId,
    plan: plan === 'yearly' ? 'yearly' : 'monthly',
    status: 'active',
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    createdAt: currentSub?.createdAt || now.toISOString(),
    activatedAt: now.toISOString(),
    activationMethod: 'activation_code',
    notes: `كود التفعيل: ${generatedCode} - تم تفعيل الاشتراك من لوحة الإدارة`,
  };
  db.createOrUpdateSubscription(updatedSub);

  // Mark any pending subscription request for this phone as approved
  const requests = db.getAllRequests();
  const userReq = requests.find((r) => r.phone === user.phone && r.status === 'pending');
  if (userReq) {
    db.updateRequestStatus(userReq.id, 'approved');
  }

  // Generate WhatsApp message and direct link
  const { message: whatsappMessage, whatsappUrl } = formatWhatsAppActivation(
    user.name,
    user.phone,
    generatedCode,
    plan,
    now.toISOString(),
    expiryDate.toISOString(),
    durationDays
  );

  res.json({
    success: true,
    message: `تم تفعيل اشتراك الطالب ${user.name} بنجاح وتوليد كود التفعيل: ${generatedCode}`,
    activationCode: generatedCode,
    studentName: user.name,
    studentPhone: user.phone,
    plan,
    durationDays,
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    whatsappMessage,
    whatsappUrl,
    subscription: updatedSub,
  });
};

router.post('/admin/students/:studentId/activate-with-code', requireAuth, requireAdmin, handleActivateStudentWithCode);
router.patch('/admin/students/:studentId/activate-with-code', requireAuth, requireAdmin, handleActivateStudentWithCode);

// Admin Resend / Get Code for Student to WhatsApp
const handleResendStudentCode = (req: any, res: any) => {
  const { studentId } = req.params;
  const user = db.findUserById(studentId);
  if (!user) return res.status(404).json({ error: 'الطالب غير موجود.' });

  const sub = db.getSubscriptionByUserId(studentId);
  const allCodes = db.getAllActivationCodes();
  const userCode = allCodes.find((c) => c.usedByStudents?.some((st) => st.studentId === studentId));
  const codeInNotes = sub?.notes?.match(/كود التفعيل:\s*([A-Za-z0-9-]+)/)?.[1];

  let code = userCode?.code || codeInNotes;
  let durationDays = sub?.plan === 'yearly' ? 365 : 30;
  let startDate = sub?.startDate || new Date().toISOString();
  let expiryDate = sub?.expiryDate || new Date(Date.now() + durationDays * 86400000).toISOString();

  if (!code) {
    // Generate new code
    let generatedCode = '';
    let tries = 0;
    do {
      const random4Digits = Math.floor(1000 + Math.random() * 9000);
      generatedCode = `MCT-${random4Digits}`;
      tries++;
    } while (db.getAllActivationCodes().some((c) => c.code.toUpperCase() === generatedCode) && tries < 20);
    code = generatedCode;

    const codeRecord: DBActivationCode = {
      id: `code-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      code,
      planType: sub?.plan === 'yearly' ? 'yearly' : 'monthly',
      durationDays,
      maxUses: 100,
      timesUsed: 0,
      isUsed: false,
      isActive: true,
      usedByStudents: [{ studentId: user.id, studentName: user.name, usedAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      notes: `كود تم توليده لإعادة الإرسال للطالب ${user.name}`,
    };
    db.createActivationCode(codeRecord);
    if (sub) {
      sub.notes = `كود التفعيل: ${code} - تم تحديث الكود`;
      db.createOrUpdateSubscription(sub);
    }
  }

  const { message: whatsappMessage, whatsappUrl } = formatWhatsAppActivation(
    user.name,
    user.phone,
    code,
    (sub?.plan as any) || 'monthly',
    startDate,
    expiryDate,
    durationDays
  );

  res.json({
    success: true,
    activationCode: code,
    studentName: user.name,
    studentPhone: user.phone,
    plan: sub?.plan || 'monthly',
    startDate,
    expiryDate,
    durationDays,
    whatsappMessage,
    whatsappUrl,
  });
};

router.post('/admin/students/:studentId/resend-code', requireAuth, requireAdmin, handleResendStudentCode);
router.get('/admin/students/:studentId/resend-code', requireAuth, requireAdmin, handleResendStudentCode);

// Admin Update Student Subscription Status
const handleUpdateStudentStatus = (req: any, res: any) => {
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
};

router.patch('/admin/students/:studentId/status', requireAuth, requireAdmin, handleUpdateStudentStatus);
router.post('/admin/students/:studentId/status', requireAuth, requireAdmin, handleUpdateStudentStatus);

// Admin Extend Subscription by 30 days
const handleExtendStudent = (req: any, res: any) => {
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
};

router.patch('/admin/students/:studentId/extend', requireAuth, requireAdmin, handleExtendStudent);
router.post('/admin/students/:studentId/extend', requireAuth, requireAdmin, handleExtendStudent);

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
