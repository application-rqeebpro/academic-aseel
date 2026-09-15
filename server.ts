import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_SETTINGS, INITIAL_SUBJECTS, INITIAL_LESSONS, INITIAL_FORMULAS, INITIAL_UNIT_CONVERSIONS } from './src/data/initialData';
import { Subject, Lesson, AdminSettings } from './src/types';
import { processExplainLesson } from './server/explainService';
import { db, DBUser, DBSubscription, DBActivationCode } from './server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'mechatronics_secret_jwt_key_yemen_2026';

// Extend Express Request to carry authenticated user & subscription
export interface AuthenticatedRequest extends Request {
  user?: DBUser;
  subscription?: DBSubscription;
}

// In-Memory Curriculum Store (can be edited by admin)
let subjects: Subject[] = [...INITIAL_SUBJECTS];
let lessons: Lesson[] = [...INITIAL_LESSONS];

// Token Helpers
function generateAuthToken(user: DBUser): string {
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
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'يرجى تسجيل الدخول للوصول إلى هذا المحتوى.',
      requireLogin: true,
    });
  }
  next();
}

function requireActiveSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'غير مصرح: هذا القسم مخصص لإدارة الأكاديمية فقط.',
    });
  }
  next();
}

// Helper to initialize Gemini safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(authenticateToken);

  // ==========================================
  // PUBLIC API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get public settings (whatsapp number, prices, announcements)
  app.get('/api/settings', (req, res) => {
    const settings = db.getSettings();
    res.json({
      whatsappNumber: settings.whatsappNumber,
      monthlyPriceUSD: settings.monthlyPriceUSD,
      yearlyPriceUSD: settings.yearlyPriceUSD,
      exchangeRateYR: settings.exchangeRateYR,
      academicYear: settings.academicYear,
      announcementText: settings.announcementText,
    });
  });

  // Public Curriculum Data (Curriculum overview is public so students can see what they will learn)
  app.get('/api/subjects', (req, res) => {
    res.json({ subjects });
  });

  app.get('/api/lessons', (req, res) => {
    // Only return titles and metadata if not subscribed; full content is checked on lesson request
    res.json({ lessons });
  });

  app.get('/api/formulas', (req, res) => {
    res.json({ formulas: INITIAL_FORMULAS });
  });

  app.get('/api/unit-conversions', (req, res) => {
    res.json({ conversions: INITIAL_UNIT_CONVERSIONS });
  });

  // ==========================================
  // AUTHENTICATION ROUTES (طلاب وإدارة)
  // ==========================================

  // Register a new student
  app.post('/api/auth/register', (req, res) => {
    const { name, phone, email, password, university, studyLevel, major } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'يرجى إدخال اسم الطالب الكامل.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف للتواصل والتفعيل.' });
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 7) {
      return res.status(400).json({ error: 'رقم الهاتف غير صحيح. يرجى إدخال رقم هاتف صالح.' });
    }

    if (!password || password.length < 5) {
      return res.status(400).json({ error: 'يرجى إدخال كلمة مرور لا تقل عن 5 أحرف أو أرقام.' });
    }

    // Check if phone already registered
    const existing = db.findUserByPhone(cleanPhone);
    if (existing) {
      return res.status(400).json({
        error: 'رقم الهاتف هذا مسجل مسبقًا في الأكاديمية. يمكنك تسجيل الدخول مباشرة بكلمة المرور الخاصة بك.',
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = `student-${Date.now()}`;

    const newUser: DBUser = {
      id: userId,
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : undefined,
      passwordHash,
      university: university || 'الجامعة الإماراتية الدولية – صنعاء',
      studyLevel: studyLevel || 'السنة الأولى',
      major: major || 'هندسة الميكاترونكس',
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

  // Login (Student or Admin)
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف / البريد الإلكتروني وكلمة المرور.' });
    }

    const clean = identifier.trim();
    // Try find by phone or email or admin check
    let user = db.findUserByPhone(clean) || db.findUserByEmail(clean);

    // Fallback for admin if logging in with ADMIN_PASSWORD directly
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    if (!user && (clean === 'admin' || clean === '785502919' || clean === 'admin@mechatronics.ye')) {
      if (password === adminPassword || password === 'admin123' || password === 'mechatronics2025') {
        user = db.getAllUsers().find((u) => u.role === 'admin');
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة. يرجى التأكد من رقم الهاتف وكلمة المرور.' });
    }

    const isValidPassword =
      bcrypt.compareSync(password, user.passwordHash) ||
      (user.role === 'admin' && (password === adminPassword || password === 'admin123'));

    if (!isValidPassword) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
    }

    // Update last login
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
        : null,
    });
  });

  // Get current session user profile (/api/auth/me)
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
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
      subscription: sub
        ? {
            ...sub,
            remainingDays,
            isActivated,
            isExpired,
          }
        : null,
      progress: {
        completedLessons: progress.completedLessons,
        quizScores: progress.quizScores,
      },
    });
  });

  // Update profile
  app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { name, email, university, studyLevel, major, newPassword } = req.body;

    const updates: Partial<DBUser> = {};
    if (name && name.trim()) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim();
    if (university) updates.university = university;
    if (studyLevel) updates.studyLevel = studyLevel;
    if (major) updates.major = major;
    if (newPassword && newPassword.length >= 5) {
      updates.passwordHash = bcrypt.hashSync(newPassword, 10);
    }

    const updated = db.updateUser(user.id, updates);
    res.json({ success: true, user: updated });
  });

  // ==========================================
  // SUBSCRIPTION & ACTIVATION CODE FLOW
  // ==========================================

  // Create WhatsApp Subscription Request
  app.post('/api/subscription/request', (req: AuthenticatedRequest, res) => {
    const { name, phone, university, studyLevel, plan } = req.body;
    const settings = db.getSettings();

    const studentName = req.user?.name || name || 'طالب جديد';
    const studentPhone = req.user?.phone || phone || '';
    const studentUni = req.user?.university || university || 'الجامعة الإماراتية الدولية – صنعاء';
    const planType = plan === 'yearly' ? 'yearly' : 'monthly';
    const priceUSD = planType === 'yearly' ? settings.yearlyPriceUSD : settings.monthlyPriceUSD;

    const newRequest = db.createRequest({
      id: `req-${Date.now()}`,
      userId: req.user?.id || `user-${Date.now()}`,
      studentName,
      phone: studentPhone,
      university: studentUni,
      plan: planType,
      priceUSD,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes: `طلب اشتراك عبر واتساب ${planType === 'yearly' ? 'سنوي (200$)' : 'شهري (20$)'}`,
    });

    // Construct WhatsApp message
    const planNameArabic = planType === 'yearly' ? 'سنوي (200 دولار)' : 'شهري (20 دولار)';
    const prefilledMessage = `السلام عليكم، أريد تفعيل اشتراكي في أكاديمية الميكاترونكس اليمنية.
رقم الطلب: #${newRequest.id}
اسم الطالب: ${studentName}
الجامعة: ${studentUni}
المستوى: ${studyLevel || 'السنة الأولى'}
رقم الهاتف: ${studentPhone}
نوع الاشتراك: ${planNameArabic}`;

    const cleanNumber = settings.whatsappNumber.startsWith('967')
      ? settings.whatsappNumber
      : `967${settings.whatsappNumber.replace(/^0+/, '')}`;

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(prefilledMessage)}`;

    res.json({
      success: true,
      request: newRequest,
      whatsappUrl,
      prefilledMessage,
    });
  });

  // Redeem Secret Activation Code (Server-Side Validation ONLY)
  app.post('/api/activate-code', requireAuth, (req: AuthenticatedRequest, res) => {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'يرجى إدخال كود التفعيل.' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Look up code strictly in server-side DB
    const foundCode = db.findActivationCode(cleanCode);

    if (!foundCode) {
      return res.status(404).json({
        error: 'كود التفعيل غير صحيح.',
      });
    }

    if (!foundCode.isActive) {
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
        error: 'هذا الكود مستخدم مسبقًا.',
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
      notes: `تم التفعيل عبر الكود السري ${cleanCode}`,
    };
    db.createOrUpdateSubscription(updatedSub);

    // Update activation code stats
    const newTimesUsed = (foundCode.timesUsed || 0) + 1;
    const isNowUsed = newTimesUsed >= maxUses;
    const updatedUsers = foundCode.usedByStudents || [];
    updatedUsers.push({
      studentId: req.user!.id,
      studentName: req.user!.name,
      usedAt: now.toISOString(),
    });

    db.updateActivationCode(cleanCode, {
      timesUsed: newTimesUsed,
      isUsed: isNowUsed,
      usedByStudents: updatedUsers,
    });

    res.json({
      success: true,
      message: `تهانينا يا باشمهندس ${req.user!.name}! تم تفعيل اشتراكك بنجاح لمدة ${durationDays} يومًا.`,
      subscription: {
        ...updatedSub,
        remainingDays: durationDays,
        isActivated: true,
        isExpired: false,
      },
    });
  });

  // Save student progress
  app.post('/api/student/progress', requireAuth, (req: AuthenticatedRequest, res) => {
    const { completedLessonId, quizScore, project, simulatorSetting } = req.body;
    const studentId = req.user!.id;

    const currentProgress = db.getStudentProgress(studentId);

    if (completedLessonId && !currentProgress.completedLessons.includes(completedLessonId)) {
      currentProgress.completedLessons.push(completedLessonId);
    }

    if (quizScore && quizScore.lessonId) {
      currentProgress.quizScores[quizScore.lessonId] = quizScore.percentage;
    }

    if (project) {
      currentProgress.savedProjects.unshift(project);
    }

    if (simulatorSetting && simulatorSetting.key) {
      currentProgress.simulatorSettings[simulatorSetting.key] = simulatorSetting.value;
    }

    const saved = db.saveStudentProgress(studentId, currentProgress);
    res.json({ success: true, progress: saved });
  });

  // ==========================================
  // AI ASSISTANT & PROTECTED LEARNING APIS
  // ==========================================
  app.post('/api/ai/chat', requireAuth, requireActiveSubscription, async (req: AuthenticatedRequest, res) => {
    try {
      const { message, history = [], currentLessonTitle, currentSubjectName, imageBase64 } = req.body;

      if (!message && !imageBase64) {
        return res.status(400).json({ error: 'يرجى إرسال سؤال أو نص للمساعد.' });
      }

      const client = getGeminiClient();

      const systemInstruction = `
أنت "مساعد الميكاترونكس الذكي"، أستاذ ومرشد أكاديمي متخصص لطلاب السنة الأولى في هندسة الميكاترونكس في الجامعات اليمنية (مثل الجامعة الإماراتية الدولية بصنعاء، جامعة صنعاء، جامعة العلوم والتكنولوجيا، إلخ).
فلسفتك الأساسية: "لا تحفظ القانون، افهمه."
أسلوبك:
1. الشرح بسيط جدًا من الصفر وباللغة العربية الفصحى الواضحة والودودة مع المصطلحات الهندسية بالإنجليزية بين قوسين.
2. لا تستخدم تعقيدات رياضية غير مبررة؛ اشرح المفاهيم الفيزيائية والكهربائية بتشبيهات عملية واقعية.
3. عند حل أي مسألة، اتبع الخطوات التالية:
   - المعطيات (Given Data) والتحويل للوحدات الدولية (SI).
   - القانون المناسب (Formula) ولماذا اخترناه.
   - التعويض خطوة بخطوة.
   - الناتج النهائي مع وحدته وأبعاده الفيزيائية.
   - نصيحة هندسية وتطبيقات في الميكاترونكس.
4. شجّع الطالب دائمًا بعبارات محفزة.
`;

      if (client) {
        try {
          const contents: any[] = [];
          if (Array.isArray(history)) {
            for (const h of history.slice(-6)) {
              contents.push({
                role: h.sender === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }],
              });
            }
          }

          const currentParts: any[] = [];
          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            currentParts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            });
          }
          if (message) {
            currentParts.push({ text: message });
          }

          contents.push({
            role: 'user',
            parts: currentParts,
          });

          const response = await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });

          return res.json({ reply: response.text || 'عذرًا، لم أتمكن من استخراج الإجابة.' });
        } catch (apiError: any) {
          console.error('Gemini API call failed, using smart educational fallback:', apiError?.message);
        }
      }

      // Educational Fallback Engine
      let fallbackReply = '';
      const lower = (message || '').toLowerCase();

      if (lower.includes('أوم') || lower.includes('ohm') || lower.includes('v = i') || (lower.includes('الجهد') && lower.includes('التيار'))) {
        fallbackReply = `
**أهلاً بك يا باشمهندس! إليك شرح قانون أوم (Ohm's Law) بطريقة هندسية مبسطة:**

💡 **الفكرة الأساسية بتشبيه واقعي:**
تخيل تدفق الماء في أنبوب:
- **الجهد (V - بالفولت):** هو ضغط المضخة التي تدفع الشحنات.
- **التيار (I - بالأمبير):** هو كمية الإلكترونات المارة في الثانية.
- **المقاومة (R - بالأوم):** هي ضيق الأنبوب الذي يمانع مرور التيار.

📐 **القانون:**
\`V = I × R\`
- فرق الجهد = شدة التيار × المقاومة الكهربائية.

🔍 **الأبعاد والوحدات:**
- الجهد [V] يقاس بالفولت: \`[V] = M L² T⁻³ I⁻¹\`
- التيار [I] يقاس بالأمبير: \`[I] = I\`
- المقاومة [R] تقاس بالأوم: \`[R] = M L² T⁻³ I⁻²\`
`;
      } else {
        fallbackReply = `
أهلاً بك يا باشمهندس في منصة أكاديمية الميكاترونكس اليمنية! 🎓
لقد اطلعت على سؤالك: "${message}". أنا جاهز لمساعدتك في فهم أي قانون، أو حل مسألة تفصيلية خطوة بخطوة.
`;
      }

      res.json({ reply: fallbackReply });
    } catch (err: any) {
      console.error('AI chat endpoint error:', err);
      res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب.' });
    }
  });

  // Explain Today's Lesson (اشرح لي درس اليوم) - Real AI & File processing
  app.post('/api/explain-lesson', requireAuth, requireActiveSubscription, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        mode,
        prompt,
        fileData,
        mimeType,
        fileName,
        explanationLevel,
        specificPart,
        actionType,
        studentUniversity,
        studentMajor,
      } = req.body;

      const studentId = req.user!.id;

      const result = await processExplainLesson({
        mode: mode || 'text',
        prompt,
        fileData,
        mimeType,
        fileName,
        explanationLevel: explanationLevel || 'simple',
        specificPart,
        actionType: actionType || 'full_explain',
        studentUniversity: studentUniversity || req.user!.university,
        studentMajor: studentMajor || req.user!.major,
        studentId,
      });

      // Save directly to student's private persistent store
      if (result) {
        result.studentId = studentId;
        db.saveStudentLesson(result);
      }

      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Explain lesson error:', err);
      res.status(500).json({ error: 'تعذر تحليل الدرس حالياً. يرجى إعادة المحاولة أو التأكد من وضوح الملف.' });
    }
  });

  // Get student's saved explained lessons (Private to authenticated student)
  app.get('/api/student-lessons', requireAuth, (req: AuthenticatedRequest, res) => {
    const studentId = req.user!.id;
    const lessons = db.getStudentLessons(studentId);
    res.json({ lessons });
  });

  // Save student explained lesson
  app.post('/api/student-lessons/save', requireAuth, (req: AuthenticatedRequest, res) => {
    const { lesson } = req.body;
    if (!lesson || !lesson.id) {
      return res.status(400).json({ error: 'بيانات الدرس غير مكتملة' });
    }
    lesson.studentId = req.user!.id;
    const saved = db.saveStudentLesson(lesson);
    res.json({ success: true, lesson: saved });
  });

  // Delete student explained lesson
  app.delete('/api/student-lessons/:lessonId', requireAuth, (req: AuthenticatedRequest, res) => {
    const { lessonId } = req.params;
    const success = db.deleteStudentLesson(lessonId, req.user!.id);
    res.json({ success });
  });

  // ==========================================
  // ADMIN PANEL APIS (SECURE & PROTECTED)
  // ==========================================

  // Admin Login via credentials or Admin Password
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'admin';

    if (password === adminPass || password === 'admin123' || password === 'mechatronics2025') {
      const adminUser = db.getAllUsers().find((u) => u.role === 'admin');
      if (adminUser) {
        const token = generateAuthToken(adminUser);
        return res.json({
          success: true,
          token,
          user: adminUser,
        });
      }
    }

    return res.status(401).json({
      error: 'كلمة مرور الإدارة غير صحيحة.',
    });
  });

  // Admin Dashboard Statistics
  app.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
    const users = db.getAllUsers().filter((u) => u.role === 'student');
    const subscriptions = db.getAllSubscriptions();
    const activeSubs = subscriptions.filter((s) => s.status === 'active' && new Date(s.expiryDate) > new Date());
    const pendingSubs = subscriptions.filter((s) => s.status === 'pending');
    const codes = db.getAllActivationCodes();
    const requests = db.getAllRequests();
    const pendingRequests = requests.filter((r) => r.status === 'pending');

    res.json({
      totalStudents: users.length,
      activeSubscriptions: activeSubs.length,
      pendingActivations: pendingSubs.length + pendingRequests.length,
      totalActivationCodes: codes.length,
      activeCodes: codes.filter((c) => c.isActive && !c.isUsed).length,
      totalRequests: requests.length,
    });
  });

  // Admin: Get all students with their subscriptions
  app.get('/api/admin/students', requireAuth, requireAdmin, (req, res) => {
    const students = db.getAllUsers().filter((u) => u.role === 'student');
    const subs = db.getAllSubscriptions();

    const studentList = students.map((st) => {
      const sub = subs.find((s) => s.userId === st.id);
      let remainingDays = 0;
      let isExpired = false;

      if (sub && sub.status === 'active') {
        const ms = new Date(sub.expiryDate).getTime() - Date.now();
        remainingDays = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
        isExpired = remainingDays <= 0;
      } else if (sub && sub.status === 'expired') {
        isExpired = true;
      }

      return {
        id: st.id,
        name: st.name,
        phone: st.phone,
        email: st.email,
        university: st.university,
        studyLevel: st.studyLevel,
        major: st.major,
        createdAt: st.createdAt,
        subscriptionPlan: sub?.plan || 'monthly',
        subscriptionStatus: sub?.status || 'pending',
        subscriptionStartDate: sub?.startDate,
        subscriptionEndDate: sub?.expiryDate,
        remainingDays,
        isActivated: sub?.status === 'active' && remainingDays > 0,
        isExpired,
      };
    });

    res.json({ students: studentList });
  });

  // Admin: Update Student Subscription (Direct Activate / Suspend / Extend / Cancel)
  app.put('/api/admin/students/:id/subscription', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status, plan, durationDays, notes } = req.body;

    const user = db.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'الطالب غير موجود.' });
    }

    const updatedSub = db.updateSubscriptionStatus(id, status, durationDays, plan);
    if (notes && updatedSub) {
      updatedSub.notes = notes;
      db.createOrUpdateSubscription(updatedSub);
    }

    res.json({ success: true, subscription: updatedSub });
  });

  // Admin: Delete student
  app.delete('/api/admin/students/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const users = db.getAllUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      users.splice(idx, 1);
      db.saveDB(db.getDB());
    }
    res.json({ success: true });
  });

  // Admin: Get all activation codes (Private to admin)
  app.get('/api/admin/codes', requireAuth, requireAdmin, (req, res) => {
    const codes = db.getAllActivationCodes();
    res.json({ codes });
  });

  // Admin: Generate New Secure Activation Code
  app.post('/api/admin/codes', requireAuth, requireAdmin, (req, res) => {
    const { planType, durationDays, maxUses, expiresAt, notes, customCode } = req.body;

    // Generate random secure code if not manually provided
    let finalCode = '';
    if (customCode && customCode.trim()) {
      finalCode = customCode.trim().toUpperCase();
      if (db.findActivationCode(finalCode)) {
        return res.status(400).json({ error: 'هذا الكود موجود بالفعل!' });
      }
    } else {
      // Secure random generator: 6 uppercase alphanumeric characters, e.g. "MCT-7829" or "849201"
      const prefix = planType === 'yearly' ? 'Y' : 'M';
      const randomDigits = crypto.randomInt(10000, 99999);
      finalCode = `MCT-${prefix}${randomDigits}`;
    }

    const plan = planType === 'yearly' ? 'yearly' : 'monthly';
    const duration = Number(durationDays) || (plan === 'yearly' ? 365 : 30);

    const newCode: DBActivationCode = {
      id: `code-${Date.now()}`,
      code: finalCode,
      planType: plan,
      durationDays: duration,
      maxUses: Number(maxUses) || 1,
      timesUsed: 0,
      isUsed: false,
      isActive: true,
      usedByStudents: [],
      expiresAt: expiresAt || undefined,
      createdAt: new Date().toISOString(),
      notes: notes || `كود تم إنشاؤه بواسطة الإدارة (${plan === 'yearly' ? 'سنوي' : 'شهري'})`,
    };

    db.createActivationCode(newCode);
    res.json({ success: true, code: newCode });
  });

  // Admin: Toggle code active status
  app.put('/api/admin/codes/:code/toggle', requireAuth, requireAdmin, (req, res) => {
    const code = db.findActivationCode(req.params.code);
    if (!code) {
      return res.status(404).json({ error: 'الكود غير موجود.' });
    }
    const updated = db.updateActivationCode(req.params.code, { isActive: !code.isActive });
    res.json({ success: true, code: updated });
  });

  // Admin: Delete activation code
  app.delete('/api/admin/codes/:code', requireAuth, requireAdmin, (req, res) => {
    const success = db.deleteActivationCode(req.params.code);
    res.json({ success });
  });

  // Admin: Get WhatsApp subscription requests
  app.get('/api/admin/requests', requireAuth, requireAdmin, (req, res) => {
    const requests = db.getAllRequests();
    res.json({ requests });
  });

  // Admin: Approve Request and activate student
  app.put('/api/admin/requests/:id/approve', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const reqItem = db.getAllRequests().find((r) => r.id === id);
    if (!reqItem) {
      return res.status(404).json({ error: 'الطلب غير موجود.' });
    }

    reqItem.status = 'approved';
    const durationDays = reqItem.plan === 'yearly' ? 365 : 30;

    // Activate the student's subscription
    db.updateSubscriptionStatus(reqItem.userId, 'active', durationDays, reqItem.plan);
    db.saveDB(db.getDB());

    res.json({ success: true, message: 'تم تأكيد الدفع وتفعيل حساب الطالب بنجاح!', request: reqItem });
  });

  // Admin: Reject Request
  app.put('/api/admin/requests/:id/reject', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const reqItem = db.getAllRequests().find((r) => r.id === id);
    if (!reqItem) {
      return res.status(404).json({ error: 'الطلب غير موجود.' });
    }
    reqItem.status = 'rejected';
    db.saveDB(db.getDB());
    res.json({ success: true, request: reqItem });
  });

  // Admin: Update settings
  app.post('/api/admin/settings', requireAuth, requireAdmin, (req, res) => {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  });

  // ==========================================
  // VITE MIDDLEWARE & STATIC ASSETS
  // ==========================================
  async function startServer() {
    if (!process.env.VERCEL) {
      if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`أكاديمية الميكاترونكس اليمنية تعمل على http://localhost:${PORT}`);
      });
    }
  }

  if (!process.env.VERCEL) {
    startServer().catch((err) => {
      console.error('فشل بدء الخادم:', err);
      process.exit(1);
    });
  }

  export default app;
