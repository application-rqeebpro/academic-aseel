import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import bundledDbSeed from '../data/mechatronics_db.json';
import { MONTHLY_CODES_SEED, YEARLY_CODES_SEED } from './seedCodes';

const { Pool } = pg;

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
  type?: 'monthly' | 'yearly';
  planType: 'monthly' | 'yearly' | 'custom';
  status?: CodeStatus;
  durationDays: number;
  priceUSD?: number;
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

const DB_STORE_KEY = 'mct_academy_database';

// Cloud Provider Setup - Neon PostgreSQL via DATABASE_URL
let neonPool: InstanceType<typeof Pool> | null = null;
let cloudProvider: 'neon-postgres' | 'local-file' = 'local-file';
let lastCloudSyncAt: string | null = null;
let cloudSyncError: string | null = null;
let isSyncingToCloud = false;
let pendingCloudSave = false;
let isHydratedFromNeon = false;

// Neon PostgreSQL connection using DATABASE_URL (or POSTGRES_URL)
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (dbUrl) {
  try {
    neonPool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    cloudProvider = 'neon-postgres';
    console.log('[DB] Neon PostgreSQL configured as primary cloud database (DATABASE_URL).');
  } catch (err) {
    console.warn('[DB] Failed to initialize Neon PostgreSQL pool:', err);
  }
} else if (process.env.NODE_ENV === 'production') {
  console.warn('[DB ALERT] DATABASE_URL is not set! Please configure DATABASE_URL in Vercel Environment Variables for permanent Neon PostgreSQL storage.');
}

let cachedDB: DBSchema | null = null;

// Write local JSON file backup (only in development or fallback)
function saveLocalFile(data: DBSchema): void {
  // In production with Neon, do not write to transient filesystem
  if (process.env.NODE_ENV === 'production' && neonPool) {
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    // Gracefully handle read-only environments
  }
}

// Hydrate DB from Neon PostgreSQL
export async function syncFromCloud(): Promise<boolean> {
  if (!neonPool) return false;
  try {
    // Ensure all tables exist in Neon PostgreSQL
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS mct_kv_store (
        key VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS mct_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        university TEXT,
        study_level TEXT,
        major TEXT,
        role TEXT NOT NULL DEFAULT 'student',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS mct_activation_codes (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        type TEXT,
        plan_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unused',
        duration_days INT NOT NULL DEFAULT 30,
        price_usd NUMERIC NOT NULL DEFAULT 20,
        phone TEXT,
        student_name TEXT,
        student_id TEXT,
        activated_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        activated_by TEXT,
        max_uses INT NOT NULL DEFAULT 1,
        times_used INT NOT NULL DEFAULT 0,
        is_used BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        used_by_students JSONB DEFAULT '[]'::jsonb,
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS mct_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        phone TEXT,
        code TEXT,
        plan TEXT NOT NULL,
        status TEXT NOT NULL,
        start_date TIMESTAMPTZ NOT NULL,
        expiry_date TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        activated_at TIMESTAMPTZ,
        activation_method TEXT,
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS mct_subscription_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        student_name TEXT,
        phone TEXT,
        university TEXT,
        plan TEXT,
        price_usd NUMERIC,
        status TEXT,
        created_at TIMESTAMPTZ,
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS mct_student_progress (
        student_id TEXT PRIMARY KEY,
        completed_lessons JSONB DEFAULT '[]'::jsonb,
        quiz_scores JSONB DEFAULT '{}'::jsonb,
        lesson_notes JSONB DEFAULT '{}'::jsonb,
        saved_projects JSONB DEFAULT '[]'::jsonb,
        simulator_settings JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS mct_settings (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const res = await neonPool.query(
      'SELECT data FROM mct_kv_store WHERE key = $1 LIMIT 1',
      [DB_STORE_KEY]
    );

    if (res.rows && res.rows.length > 0 && res.rows[0].data) {
      cachedDB = res.rows[0].data as DBSchema;
      ensureReadyCodesSeeded(cachedDB);
      saveLocalFile(cachedDB);
      lastCloudSyncAt = new Date().toISOString();
      cloudSyncError = null;
      isHydratedFromNeon = true;
      console.log(`[DB] Successfully loaded database from Neon PostgreSQL (${cachedDB.users?.length || 0} users, ${cachedDB.activationCodes?.length || 0} codes).`);
      
      // Perform background non-destructive relational sync
      syncRelationalTables(cachedDB).catch(() => {});
      return true;
    } else {
      // First-time seed into Neon PostgreSQL
      const initial = getDB();
      await neonPool.query(
        `INSERT INTO mct_kv_store (key, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = NOW();`,
        [DB_STORE_KEY, JSON.stringify(initial)]
      );
      lastCloudSyncAt = new Date().toISOString();
      isHydratedFromNeon = true;
      console.log('[DB] Seeded initial database into Neon PostgreSQL.');
      
      // Perform initial relational migration
      syncRelationalTables(initial).catch(() => {});
      return true;
    }
  } catch (err: any) {
    cloudSyncError = err.message || String(err);
    console.warn('[DB] Neon PostgreSQL sync warning (using local/in-memory cache):', cloudSyncError);
  }
  return false;
}

// Synchronize entities into relational tables without losing any data
export async function syncRelationalTables(data: DBSchema): Promise<void> {
  if (!neonPool) return;
  try {
    // 1. Sync users
    for (const u of data.users) {
      await neonPool.query(
        `INSERT INTO mct_users (id, name, phone, email, password_hash, university, study_level, major, role, created_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           university = EXCLUDED.university,
           study_level = EXCLUDED.study_level,
           major = EXCLUDED.major,
           role = EXCLUDED.role,
           last_login_at = EXCLUDED.last_login_at;`,
        [
          u.id, u.name, u.phone, u.email || null, u.passwordHash,
          u.university || null, u.studyLevel || null, u.major || null,
          u.role || 'student', u.createdAt || new Date().toISOString(), u.lastLoginAt || null
        ]
      );
    }

    // 2. Sync subscriptions
    for (const s of data.subscriptions) {
      await neonPool.query(
        `INSERT INTO mct_subscriptions (id, user_id, phone, code, plan, status, start_date, expiry_date, created_at, activated_at, activation_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           phone = EXCLUDED.phone,
           code = EXCLUDED.code,
           plan = EXCLUDED.plan,
           status = EXCLUDED.status,
           start_date = EXCLUDED.start_date,
           expiry_date = EXCLUDED.expiry_date,
           activated_at = EXCLUDED.activated_at,
           activation_method = EXCLUDED.activation_method,
           notes = EXCLUDED.notes;`,
        [
          s.id, s.userId, s.phone || null, s.code || null, s.plan || 'monthly', s.status || 'pending',
          s.startDate || new Date().toISOString(), s.expiryDate || new Date().toISOString(),
          s.createdAt || new Date().toISOString(), s.activatedAt || null,
          s.activationMethod || null, s.notes || null
        ]
      );
    }

    // 3. Sync activation codes
    for (const c of data.activationCodes) {
      await neonPool.query(
        `INSERT INTO mct_activation_codes (
           id, code, type, plan_type, status, duration_days, price_usd, phone,
           student_name, student_id, activated_at, expires_at, created_at, activated_by,
           max_uses, times_used, is_used, is_active, used_by_students, notes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           type = EXCLUDED.type,
           plan_type = EXCLUDED.plan_type,
           status = EXCLUDED.status,
           duration_days = EXCLUDED.duration_days,
           price_usd = EXCLUDED.price_usd,
           phone = EXCLUDED.phone,
           student_name = EXCLUDED.student_name,
           student_id = EXCLUDED.student_id,
           activated_at = EXCLUDED.activated_at,
           expires_at = EXCLUDED.expires_at,
           max_uses = EXCLUDED.max_uses,
           times_used = EXCLUDED.times_used,
           is_used = EXCLUDED.is_used,
           is_active = EXCLUDED.is_active,
           used_by_students = EXCLUDED.used_by_students,
           notes = EXCLUDED.notes;`,
        [
          c.id, c.code, c.type || c.planType || 'monthly', c.planType || 'monthly',
          c.status || (c.isUsed ? 'used' : 'unused'), c.durationDays || 30, c.priceUSD || 20,
          c.phone || null, c.studentName || null, c.studentId || null,
          c.activatedAt || null, c.expiresAt || null, c.createdAt || new Date().toISOString(),
          c.activatedBy || null, c.maxUses || 1, c.timesUsed || 0,
          Boolean(c.isUsed), Boolean(c.isActive !== false),
          JSON.stringify(c.usedByStudents || []), c.notes || null
        ]
      );
    }

    // 4. Sync Settings
    if (data.settings) {
      await neonPool.query(
        `INSERT INTO mct_settings (id, data, updated_at)
         VALUES ('main_settings', $1, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
        [JSON.stringify(data.settings)]
      );
    }
  } catch (err) {
    console.warn('[DB] Relational tables sync error:', err);
  }
}

// Asynchronously persist database to Neon PostgreSQL
export async function syncToCloud(data: DBSchema): Promise<void> {
  if (!neonPool) return;
  if (isSyncingToCloud) {
    pendingCloudSave = true;
    return;
  }

  isSyncingToCloud = true;
  try {
    await neonPool.query(
      `INSERT INTO mct_kv_store (key, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = NOW();`,
      [DB_STORE_KEY, JSON.stringify(data)]
    );
    lastCloudSyncAt = new Date().toISOString();
    cloudSyncError = null;

    // Asynchronously update relational rows in Neon
    syncRelationalTables(data).catch(() => {});
  } catch (err: any) {
    cloudSyncError = err.message || String(err);
    console.error('[DB] Failed to sync changes to Neon PostgreSQL:', cloudSyncError);
  } finally {
    isSyncingToCloud = false;
    if (pendingCloudSave) {
      pendingCloudSave = false;
      if (cachedDB) {
        syncToCloud(cachedDB).catch(() => {});
      }
    }
  }
}

// Initial background sync from Neon if configured
if (neonPool) {
  syncFromCloud().catch((e) => {
    console.warn('[DB] Initial background cloud load failed, using local seed:', e);
  });
}

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
  saveLocalFile(data);
  if (neonPool) {
    syncToCloud(data).catch((err) => {
      console.warn('[DB] Background Neon PostgreSQL save warning:', err);
    });
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
    if (neonPool) {
      neonPool.query(
        `INSERT INTO mct_users (id, name, phone, email, password_hash, university, study_level, major, role, created_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           university = EXCLUDED.university,
           study_level = EXCLUDED.study_level,
           major = EXCLUDED.major,
           role = EXCLUDED.role,
           last_login_at = EXCLUDED.last_login_at;`,
        [
          user.id, user.name, user.phone, user.email || null, user.passwordHash,
          user.university || null, user.studyLevel || null, user.major || null,
          user.role || 'student', user.createdAt || new Date().toISOString(), user.lastLoginAt || null
        ]
      ).catch((e) => console.warn('[DB] User direct write error:', e));
    }
    return user;
  },
  updateUser(id: string, updates: Partial<DBUser>): DBUser | null {
    const data = getDB();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    saveDB(data);
    if (neonPool) {
      const u = data.users[idx];
      neonPool.query(
        `UPDATE mct_users SET name = $1, email = $2, university = $3, study_level = $4, major = $5, last_login_at = $6 WHERE id = $7;`,
        [u.name, u.email || null, u.university || null, u.studyLevel || null, u.major || null, u.lastLoginAt || null, id]
      ).catch((e) => console.warn('[DB] User direct update error:', e));
    }
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
    if (neonPool) {
      neonPool.query('DELETE FROM mct_users WHERE id = $1;', [id]).catch((e) => console.warn('[DB] User delete error:', e));
      neonPool.query('DELETE FROM mct_subscriptions WHERE user_id = $1;', [id]).catch(() => {});
    }
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
    if (neonPool) {
      neonPool.query(
        `INSERT INTO mct_subscriptions (id, user_id, phone, code, plan, status, start_date, expiry_date, created_at, activated_at, activation_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           phone = EXCLUDED.phone,
           code = EXCLUDED.code,
           plan = EXCLUDED.plan,
           status = EXCLUDED.status,
           start_date = EXCLUDED.start_date,
           expiry_date = EXCLUDED.expiry_date,
           activated_at = EXCLUDED.activated_at,
           activation_method = EXCLUDED.activation_method,
           notes = EXCLUDED.notes;`,
        [
          sub.id, sub.userId, sub.phone || null, sub.code || null, sub.plan || 'monthly', sub.status || 'pending',
          sub.startDate || new Date().toISOString(), sub.expiryDate || new Date().toISOString(),
          sub.createdAt || new Date().toISOString(), sub.activatedAt || null,
          sub.activationMethod || null, sub.notes || null
        ]
      ).catch((e) => console.warn('[DB] Sub write error:', e));
    }
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
    if (neonPool) {
      neonPool.query(
        `INSERT INTO mct_activation_codes (
           id, code, type, plan_type, status, duration_days, price_usd, phone,
           student_name, student_id, activated_at, expires_at, created_at, activated_by,
           max_uses, times_used, is_used, is_active, used_by_students, notes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           type = EXCLUDED.type,
           plan_type = EXCLUDED.plan_type,
           status = EXCLUDED.status,
           duration_days = EXCLUDED.duration_days,
           price_usd = EXCLUDED.price_usd,
           phone = EXCLUDED.phone,
           student_name = EXCLUDED.student_name,
           student_id = EXCLUDED.student_id,
           activated_at = EXCLUDED.activated_at,
           expires_at = EXCLUDED.expires_at,
           max_uses = EXCLUDED.max_uses,
           times_used = EXCLUDED.times_used,
           is_used = EXCLUDED.is_used,
           is_active = EXCLUDED.is_active,
           used_by_students = EXCLUDED.used_by_students,
           notes = EXCLUDED.notes;`,
        [
          codeRecord.id, codeRecord.code, codeRecord.type || codeRecord.planType || 'monthly', codeRecord.planType || 'monthly',
          codeRecord.status || (codeRecord.isUsed ? 'used' : 'unused'), codeRecord.durationDays || 30, codeRecord.priceUSD || 20,
          codeRecord.phone || null, codeRecord.studentName || null, codeRecord.studentId || null,
          codeRecord.activatedAt || null, codeRecord.expiresAt || null, codeRecord.createdAt || new Date().toISOString(),
          codeRecord.activatedBy || null, codeRecord.maxUses || 1, codeRecord.timesUsed || 0,
          Boolean(codeRecord.isUsed), Boolean(codeRecord.isActive !== false),
          JSON.stringify(codeRecord.usedByStudents || []), codeRecord.notes || null
        ]
      ).catch((e) => console.warn('[DB] Code direct write error:', e));
    }
    return codeRecord;
  },
  batchCreateActivationCodes(newCodes: DBActivationCode[]): DBActivationCode[] {
    const data = getDB();
    data.activationCodes.unshift(...newCodes);
    saveDB(data);
    for (const codeRecord of newCodes) {
      this.createActivationCode(codeRecord);
    }
    return newCodes;
  },
  updateActivationCode(code: string, updates: Partial<DBActivationCode>): DBActivationCode | null {
    const data = getDB();
    const clean = code.trim().toUpperCase();
    const idx = data.activationCodes.findIndex((c) => c.code.trim().toUpperCase() === clean);
    if (idx === -1) return null;
    data.activationCodes[idx] = { ...data.activationCodes[idx], ...updates };
    saveDB(data);
    if (neonPool) {
      const c = data.activationCodes[idx];
      neonPool.query(
        `UPDATE mct_activation_codes
         SET is_used = $1, status = $2, phone = $3, student_name = $4, student_id = $5,
             activated_at = $6, times_used = $7, used_by_students = $8
         WHERE UPPER(code) = $9;`,
        [
          Boolean(c.isUsed), c.status || (c.isUsed ? 'used' : 'unused'), c.phone || null,
          c.studentName || null, c.studentId || null, c.activatedAt || null,
          c.timesUsed || 1, JSON.stringify(c.usedByStudents || []), clean
        ]
      ).catch((e) => console.warn('[DB] Code direct update error:', e));
    }
    return data.activationCodes[idx];
  },
  deleteActivationCode(code: string): boolean {
    const data = getDB();
    const clean = code.trim().toUpperCase();
    const initialLen = data.activationCodes.length;
    data.activationCodes = data.activationCodes.filter((c) => c.code.trim().toUpperCase() !== clean);
    saveDB(data);
    if (neonPool) {
      neonPool.query('DELETE FROM mct_activation_codes WHERE UPPER(code) = $1;', [clean]).catch((e) => console.warn('[DB] Code direct delete error:', e));
    }
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

  // Storage and Cloud DB Status (Neon PostgreSQL)
  getStorageStatus() {
    const current = getDB();
    return {
      provider: cloudProvider,
      isCloudActive: Boolean(neonPool),
      cloudProviderName: cloudProvider === 'neon-postgres' ? 'Neon PostgreSQL (Cloud Database)' : 'Local Storage (Dev Fallback)',
      lastCloudSyncAt,
      cloudSyncError,
      totalUsers: current.users.length,
      totalSubscriptions: current.subscriptions.length,
      totalCodes: current.activationCodes.length,
      totalRequests: current.subscriptionRequests.length,
    };
  },
  isCloudConfigured() {
    return Boolean(neonPool);
  },
  isHydrated() {
    return isHydratedFromNeon;
  },
  syncFromCloud,
  syncToCloud,
};
