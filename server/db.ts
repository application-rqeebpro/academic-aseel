import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import bundledDbSeed from '../data/mechatronics_db.json';
import { MONTHLY_CODES_SEED, YEARLY_CODES_SEED } from './seedCodes';

export interface DBUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  passwordHash: string;
  university: string;
  studyLevel: string;
  major: string;
  role: 'student' | 'admin';
  createdAt: string;
  lastLoginAt?: string;
}

export type CodeStatus = 'unused' | 'used' | 'suspended' | 'expired';

export interface DBSubscription {
  id: string;
  userId: string;
  studentId?: string;
  phone?: string;
  code?: string;
  type?: 'monthly' | 'yearly';
  plan: 'monthly' | 'yearly';
  status: 'pending' | 'active' | 'expired' | 'suspended';
  startDate: string;
  expiryDate: string;
  createdAt: string;
  activatedAt?: string;
  activationMethod?: 'admin_direct' | 'activation_code' | 'whatsapp' | 'manual';
  notes?: string;
}

export interface DBActivationCode {
  id: string;
  code: string;
  type: 'monthly' | 'yearly';
  planType: 'monthly' | 'yearly' | 'custom';
  status: CodeStatus;
  durationDays: number;
  priceUSD: number;
  phone?: string;
  studentName?: string;
  studentId?: string;
  activatedAt?: string;
  expiresAt?: string;
  createdAt: string;
  activatedBy?: 'student' | 'admin' | 'manual';
  maxUses: number;
  timesUsed: number;
  isUsed: boolean;
  isActive: boolean;
  usedByStudents: Array<{
    studentId: string;
    studentName: string;
    phone?: string;
    usedAt: string;
  }>;
  notes?: string;
}

export interface DBSubscriptionRequest {
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

export interface DBPasswordResetToken {
  id: string;
  userId: string;
  phone: string;
  code: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface DBStudentProgress {
  studentId: string;
  completedLessons: string[];
  quizScores: Record<string, number>;
  lessonNotes?: Record<string, {
    text: string;
    lessonTitle?: string;
    updatedAt: string;
  }>;
  savedProjects: any[];
  simulatorSettings: Record<string, any>;
  updatedAt: string;
}

export interface DBSchema {
  users: DBUser[];
  subscriptions: DBSubscription[];
  activationCodes: DBActivationCode[];
  subscriptionRequests: DBSubscriptionRequest[];
  passwordResetTokens?: DBPasswordResetToken[];
  studentProgress: Record<string, DBStudentProgress>;
  studentLessons: any[];
  settings: {
    whatsappNumber: string;
    monthlyPriceUSD: number;
    yearlyPriceUSD: number;
    exchangeRateYR: number;
    academicYear: string;
    announcementText: string;
  };
}

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mechatronics_db.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const sourceFile = path.join(process.cwd(), 'data', 'mechatronics_db.json');
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, DB_FILE);
    } else if (bundledDbSeed) {
      fs.writeFileSync(DB_FILE, JSON.stringify(bundledDbSeed, null, 2), 'utf-8');
    }
  }
} catch (e) {
  console.warn('Storage directory initialization warning:', e);
}

function getDefaultDB(): DBSchema {
  const adminPasswordHash = process.env.ADMIN_PASSWORD
    ? bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10)
    : '$2b$10$8zzAtKZqsqrnXQoHtifRheHTtyv06090GnMF8mzMsfnzl5OyOKeNq';

  const initialAdmin: DBUser = {
    id: 'user-admin-1',
    name: 'مدير الأكاديمية',
    phone: '785502919',
    email: 'admin@mechatronics.ye',
    passwordHash: adminPasswordHash,
    university: 'أكاديمية الميكاترونكس اليمنية',
    studyLevel: 'السنة الأولى',
    major: 'إدارة المنصة والهندسة',
    role: 'admin',
    createdAt: new Date().toISOString(),
  };

  const ownerCodes: DBActivationCode[] = [
    {
      id: 'code-7820',
      code: '7820',
      planType: 'yearly',
      durationDays: 365,
      maxUses: 10,
      timesUsed: 0,
      isUsed: false,
      isActive: true,
      usedByStudents: [],
      createdAt: new Date().toISOString(),
      notes: 'كود أكاديمي سنوي معتمد من مالك المنصة',
    },
    {
      id: 'code-7829',
      code: '7829',
      planType: 'yearly',
      durationDays: 365,
      maxUses: 10,
      timesUsed: 0,
      isUsed: false,
      isActive: true,
      usedByStudents: [],
      createdAt: new Date().toISOString(),
      notes: 'كود أكاديمي سنوي معتمد من مالك المنصة',
    },
    {
      id: 'code-7782',
      code: '7782',
      planType: 'yearly',
      durationDays: 365,
      maxUses: 10,
      timesUsed: 0,
      isUsed: false,
      isActive: true,
      usedByStudents: [],
      createdAt: new Date().toISOString(),
      notes: 'كود أكاديمي سنوي معتمد من مالك المنصة',
    },
    {
      id: 'code-7735',
      code: '7735',
      planType: 'yearly',
      durationDays: 365,
      maxUses: 10,
      timesUsed: 0,
      isUsed: false,
      isActive: true,
      usedByStudents: [],
      createdAt: new Date().toISOString(),
      notes: 'كود أكاديمي سنوي معتمد من مالك المنصة',
    },
    {
      id: 'code-mct-2191',
      code: 'MCT-2191',
      planType: 'yearly',
      durationDays: 365,
      maxUses: 5,
      timesUsed: 0,
      isUsed: false,
      isActive: true,
      usedByStudents: [],
      createdAt: new Date().toISOString(),
      notes: 'كود تفعيل سنوي رسمي',
    },
  ];

  return {
    users: [initialAdmin],
    subscriptions: [],
    activationCodes: ownerCodes,
    subscriptionRequests: [],
    passwordResetTokens: [],
    studentProgress: {},
    studentLessons: [],
    settings: {
      whatsappNumber: process.env.WHATSAPP_NUMBER || '785502919',
      monthlyPriceUSD: 20,
      yearlyPriceUSD: 200,
      exchangeRateYR: 530,
      academicYear: '2024 - 2025',
      announcementText: 'مرحبًا بكم في أكاديمية الميكاترونكس اليمنية – الفصل الدراسي الأول 2024 - 2025',
    },
  };
}

function ensureReadyCodesSeeded(data: DBSchema): boolean {
  if (!data.activationCodes) {
    data.activationCodes = [];
  }

  let modified = false;
  const existingMap = new Map<string, DBActivationCode>();
  for (const c of data.activationCodes) {
    if (c.code) {
      existingMap.set(c.code.trim().toUpperCase(), c);
    }
  }

  // 1. Seed Monthly Codes (AS-)
  for (const code of MONTHLY_CODES_SEED) {
    const key = code.trim().toUpperCase();
    if (!existingMap.has(key)) {
      const newRecord: DBActivationCode = {
        id: `code-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        code,
        type: 'monthly',
        planType: 'monthly',
        status: 'unused',
        durationDays: 30,
        priceUSD: 20,
        maxUses: 1,
        timesUsed: 0,
        isUsed: false,
        isActive: true,
        usedByStudents: [],
        createdAt: '2026-09-23T00:00:00.000Z',
        notes: 'كود اشتراك شهري معتمد (30 يومًا)',
      };
      data.activationCodes.push(newRecord);
      existingMap.set(key, newRecord);
      modified = true;
    }
  }

  // 2. Seed Yearly Codes (AB-)
  for (const code of YEARLY_CODES_SEED) {
    const key = code.trim().toUpperCase();
    if (!existingMap.has(key)) {
      const newRecord: DBActivationCode = {
        id: `code-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        code,
        type: 'yearly',
        planType: 'yearly',
        status: 'unused',
        durationDays: 365,
        priceUSD: 200,
        maxUses: 1,
        timesUsed: 0,
        isUsed: false,
        isActive: true,
        usedByStudents: [],
        createdAt: '2026-09-23T00:00:00.000Z',
        notes: 'كود اشتراك سنوي معتمد (سنة كاملة)',
      };
      data.activationCodes.push(newRecord);
      existingMap.set(key, newRecord);
      modified = true;
    }
  }

  // 3. Normalize all codes
  const now = new Date();
  for (const c of data.activationCodes) {
    if (!c.type) {
      if (c.code.toUpperCase().startsWith('AS-')) c.type = 'monthly';
      else if (c.code.toUpperCase().startsWith('AB-')) c.type = 'yearly';
      else c.type = c.planType === 'yearly' ? 'yearly' : 'monthly';
      modified = true;
    }
    if (!c.planType) {
      c.planType = c.type;
      modified = true;
    }
    if (!c.priceUSD) {
      c.priceUSD = c.type === 'yearly' ? 200 : 20;
      modified = true;
    }
    if (!c.durationDays) {
      c.durationDays = c.type === 'yearly' ? 365 : 30;
      modified = true;
    }
    if (c.maxUses === undefined) {
      c.maxUses = 1;
      modified = true;
    }
    if (!c.status) {
      if (c.isActive === false) {
        c.status = 'suspended';
      } else if (c.expiresAt && new Date(c.expiresAt) < now) {
        c.status = 'expired';
      } else if (c.isUsed || (c.timesUsed && c.timesUsed > 0) || (c.usedByStudents && c.usedByStudents.length > 0)) {
        c.status = 'used';
      } else {
        c.status = 'unused';
      }
      modified = true;
    }
    if (c.status === 'used' && !c.isUsed) {
      c.isUsed = true;
      modified = true;
    }
    if (c.status === 'unused' && c.isUsed) {
      c.isUsed = false;
      c.timesUsed = 0;
      modified = true;
    }
    if (c.status === 'suspended' && c.isActive) {
      c.isActive = false;
      modified = true;
    }
  }

  return modified;
}

let cachedDB: DBSchema | null = null;

export function getDB(): DBSchema {
  if (cachedDB) {
    return cachedDB;
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      cachedDB = JSON.parse(raw);
      if (cachedDB) {
        const changed = ensureReadyCodesSeeded(cachedDB);
        if (changed) saveDB(cachedDB);
        return cachedDB;
      }
    } catch (e) {
      console.error('Error reading DB file, initializing default:', e);
    }
  }

  if (bundledDbSeed && typeof bundledDbSeed === 'object') {
    cachedDB = JSON.parse(JSON.stringify(bundledDbSeed));
    ensureReadyCodesSeeded(cachedDB!);
    saveDB(cachedDB!);
    return cachedDB!;
  }

  cachedDB = getDefaultDB();
  ensureReadyCodesSeeded(cachedDB);
  saveDB(cachedDB);
  return cachedDB;
}

export function saveDB(data: DBSchema): void {
  cachedDB = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write DB file:', err);
  }
}

// Convert Eastern Arabic / Persian numerals to Western digits (0-9)
export function convertArabicDigitsToEnglish(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

// Helper phone normalizer for Yemeni numbers (+967, 00967, 077..., etc.)
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const converted = convertArabicDigitsToEnglish(phone.toString().trim());
  let digits = converted.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00967')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('967') && digits.length > 9) {
    digits = digits.slice(3);
  }
  while (digits.startsWith('0') && digits.length > 1) {
    digits = digits.slice(1);
  }
  return digits;
}

// Helper Repository Functions
export const db = {
  // Users
  findUserById(id: string): DBUser | undefined {
    return getDB().users.find((u) => u.id === id);
  },
  findUserByPhone(phone: string): DBUser | undefined {
    const clean = normalizePhone(phone);
    if (!clean) return undefined;
    return getDB().users.find((u) => normalizePhone(u.phone) === clean);
  },
  findUserByEmail(email: string): DBUser | undefined {
    if (!email) return undefined;
    return getDB().users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  },
  createUser(user: DBUser): DBUser {
    const data = getDB();
    data.users.push(user);
    saveDB(data);
    return user;
  },
  updateUser(id: string, updates: Partial<DBUser>): DBUser | null {
    const data = getDB();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    saveDB(data);
    return data.users[idx];
  },
  getAllUsers(): DBUser[] {
    return getDB().users;
  },
  deleteUser(id: string): boolean {
    const data = getDB();
    const initLen = data.users.length;
    data.users = data.users.filter((u) => u.id !== id);
    saveDB(data);
    return data.users.length !== initLen;
  },

  // Password Reset & Profile Update
  createPasswordReset(userId: string, phone: string): { code: string; token: string; expiresAt: string } {
    const data = getDB();
    if (!data.passwordResetTokens) {
      data.passwordResetTokens = [];
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    const resetItem: DBPasswordResetToken = {
      id: `pr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId,
      phone: phone.replace(/[^0-9]/g, ''),
      code,
      token,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    };

    data.passwordResetTokens.unshift(resetItem);
    saveDB(data);
    return { code, token, expiresAt };
  },

  verifyAndConsumePasswordReset(phone: string, code: string): string | null {
    const data = getDB();
    if (!data.passwordResetTokens) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const item = data.passwordResetTokens.find(
      (r) => !r.used && r.phone === cleanPhone && r.code.trim() === code.trim() && new Date(r.expiresAt) > new Date()
    );
    if (!item) return null;
    item.used = true;
    saveDB(data);
    return item.userId;
  },

  updateUserPassword(userId: string, newPasswordHash: string): boolean {
    const data = getDB();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return false;
    user.passwordHash = newPasswordHash;
    saveDB(data);
    return true;
  },

  getDB,
  saveDB,

  // Subscriptions
  getSubscriptionByUserId(userId: string): DBSubscription | undefined {
    return getDB().subscriptions.find((s) => s.userId === userId);
  },
  getAllSubscriptions(): DBSubscription[] {
    return getDB().subscriptions;
  },
  createOrUpdateSubscription(sub: DBSubscription): DBSubscription {
    const data = getDB();
    const idx = data.subscriptions.findIndex((s) => s.userId === sub.userId);
    if (idx >= 0) {
      data.subscriptions[idx] = sub;
    } else {
      data.subscriptions.push(sub);
    }
    saveDB(data);
    return sub;
  },
  updateSubscriptionStatus(
    userId: string,
    status: 'pending' | 'active' | 'expired' | 'suspended',
    durationDays?: number,
    plan?: 'monthly' | 'yearly'
  ): DBSubscription | null {
    const data = getDB();
    const idx = data.subscriptions.findIndex((s) => s.userId === userId);
    const now = new Date();
    if (idx === -1) {
      // Create new
      const days = durationDays || 30;
      const newSub: DBSubscription = {
        id: `sub-${Date.now()}`,
        userId,
        plan: plan || 'monthly',
        status,
        startDate: now.toISOString(),
        expiryDate: new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
        activatedAt: status === 'active' ? now.toISOString() : undefined,
        activationMethod: 'admin_direct',
      };
      data.subscriptions.push(newSub);
      saveDB(data);
      return newSub;
    }

    const current = data.subscriptions[idx];
    current.status = status;
    if (plan) current.plan = plan;

    if (status === 'active') {
      const days = durationDays || (current.plan === 'yearly' ? 365 : 30);
      current.startDate = now.toISOString();
      current.expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      current.activatedAt = now.toISOString();
    }

    saveDB(data);
    return current;
  },

  // Activation Codes
  findActivationCode(code: string): DBActivationCode | undefined {
    if (!code) return undefined;
    const clean = code.trim().toUpperCase();
    return getDB().activationCodes.find((c) => c.code.trim().toUpperCase() === clean);
  },
  findActivationCodeByPhone(phone: string): DBActivationCode | undefined {
    const clean = normalizePhone(phone);
    if (!clean) return undefined;
    return getDB().activationCodes.find((c) => c.phone && normalizePhone(c.phone) === clean);
  },
  getAllActivationCodes(): DBActivationCode[] {
    return getDB().activationCodes;
  },
  createActivationCode(codeRecord: DBActivationCode): DBActivationCode {
    const data = getDB();
    data.activationCodes.unshift(codeRecord);
    saveDB(data);
    return codeRecord;
  },
  batchCreateActivationCodes(newCodes: DBActivationCode[]): DBActivationCode[] {
    const data = getDB();
    data.activationCodes.unshift(...newCodes);
    saveDB(data);
    return newCodes;
  },
  updateActivationCode(code: string, updates: Partial<DBActivationCode>): DBActivationCode | null {
    const data = getDB();
    const clean = code.trim().toUpperCase();
    const idx = data.activationCodes.findIndex((c) => c.code.trim().toUpperCase() === clean);
    if (idx === -1) return null;
    data.activationCodes[idx] = { ...data.activationCodes[idx], ...updates };
    saveDB(data);
    return data.activationCodes[idx];
  },
  deleteActivationCode(code: string): boolean {
    const data = getDB();
    const clean = code.trim().toUpperCase();
    const initialLen = data.activationCodes.length;
    data.activationCodes = data.activationCodes.filter((c) => c.code.trim().toUpperCase() !== clean);
    saveDB(data);
    return data.activationCodes.length !== initialLen;
  },
  getSubscriptionByPhone(phone: string): DBSubscription | undefined {
    const clean = normalizePhone(phone);
    if (!clean) return undefined;
    const user = db.findUserByPhone(clean);
    return getDB().subscriptions.find((s) => (user && s.userId === user.id) || (s.phone && normalizePhone(s.phone) === clean));
  },

  // Subscription Requests (WhatsApp)
  getAllRequests(): DBSubscriptionRequest[] {
    return getDB().subscriptionRequests;
  },
  createRequest(req: DBSubscriptionRequest): DBSubscriptionRequest {
    const data = getDB();
    data.subscriptionRequests.unshift(req);
    saveDB(data);
    return req;
  },
  updateRequestStatus(requestId: string, status: 'pending' | 'approved' | 'rejected'): DBSubscriptionRequest | null {
    const data = getDB();
    const req = data.subscriptionRequests.find((r) => r.id === requestId);
    if (!req) return null;
    req.status = status;
    saveDB(data);
    return req;
  },

  // Student Lessons (Explained Lessons)
  getStudentLessons(studentId: string): any[] {
    return getDB().studentLessons.filter((l) => l.studentId === studentId);
  },
  saveStudentLesson(lesson: any): any {
    const data = getDB();
    const idx = data.studentLessons.findIndex((l) => l.id === lesson.id);
    if (idx >= 0) {
      data.studentLessons[idx] = lesson;
    } else {
      data.studentLessons.unshift(lesson);
      if (data.studentLessons.length > 500) {
        data.studentLessons = data.studentLessons.slice(0, 500);
      }
    }
    saveDB(data);
    return lesson;
  },
  deleteStudentLesson(lessonId: string, studentId?: string): boolean {
    const data = getDB();
    const initialLen = data.studentLessons.length;
    data.studentLessons = data.studentLessons.filter((l) => {
      if (studentId) {
        return !(l.id === lessonId && l.studentId === studentId);
      }
      return l.id !== lessonId;
    });
    saveDB(data);
    return data.studentLessons.length !== initialLen;
  },

  // Student Progress
  getStudentProgress(studentId: string): DBStudentProgress {
    const data = getDB();
    if (!data.studentProgress[studentId]) {
      data.studentProgress[studentId] = {
        studentId,
        completedLessons: [],
        quizScores: {},
        lessonNotes: {},
        savedProjects: [],
        simulatorSettings: {},
        updatedAt: new Date().toISOString(),
      };
      saveDB(data);
    }
    if (!data.studentProgress[studentId].lessonNotes) {
      data.studentProgress[studentId].lessonNotes = {};
    }
    return data.studentProgress[studentId];
  },
  saveStudentProgress(studentId: string, updates: Partial<DBStudentProgress>): DBStudentProgress {
    const data = getDB();
    const current = this.getStudentProgress(studentId);
    data.studentProgress[studentId] = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDB(data);
    return data.studentProgress[studentId];
  },

  // Settings
  getSettings() {
    return getDB().settings;
  },
  updateSettings(updates: Partial<DBSchema['settings']>) {
    const data = getDB();
    data.settings = { ...data.settings, ...updates };
    saveDB(data);
    return data.settings;
  },
};
