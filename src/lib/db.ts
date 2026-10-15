import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectMongo, UserModel, mongoDocToUserRecord } from './mongodb';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  solved: number[];
  starred: number[];
  notes: Record<number, string>;
  atcoderSolved?: string[];
  atcoderStarred?: string[];
  atcoderNotes?: Record<string, string>;
  leetcodeUsername?: string;
  leetcodeRating?: number;
  leetcodeBadge?: string;
  leetcodeAvatar?: string;
  leetcodeRanking?: number;
}

// Local JSON File Database Fallback (Serverless Safe: /tmp or In-Memory)
const isServerless = !!(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  (process.env.PWD && process.env.PWD.includes('/var/task'))
);

const DATA_DIR = isServerless ? '/tmp/data' : path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BUNDLED_FILE = path.join(process.cwd(), 'data', 'users.json');

// In-memory global store so read-only filesystems (Vercel / Lambda) never fail
let memoryUsers: UserRecord[] = (global as any).__memoryUsers || [];
(global as any).__memoryUsers = memoryUsers;

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      if (fs.existsSync(BUNDLED_FILE)) {
        try {
          const bundledContent = fs.readFileSync(BUNDLED_FILE, 'utf8');
          fs.writeFileSync(USERS_FILE, bundledContent);
          return;
        } catch (e) {}
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
  } catch (e) {
    // Suppress EROFS errors completely
  }
}

export function getAllLocalUsers(): UserRecord[] {
  if (memoryUsers.length === 0) {
    try {
      if (fs.existsSync(BUNDLED_FILE)) {
        const bundled = JSON.parse(fs.readFileSync(BUNDLED_FILE, 'utf8') || '[]');
        if (Array.isArray(bundled) && bundled.length > 0) {
          memoryUsers = bundled;
          (global as any).__memoryUsers = memoryUsers;
        }
      }
    } catch (e) {}
  }

  ensureDataFile();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed) && parsed.length >= memoryUsers.length) {
        memoryUsers = parsed;
        (global as any).__memoryUsers = memoryUsers;
      }
    }
  } catch (e) {}

  return memoryUsers;
}

export function getAllUsers(): UserRecord[] {
  return getAllLocalUsers();
}

function saveLocalUsers(users: UserRecord[]) {
  // Always update in-memory cache first so operations succeed immediately
  memoryUsers = users;
  (global as any).__memoryUsers = memoryUsers;

  try {
    ensureDataFile();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    // Safely ignore EROFS in read-only environments
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_lc_salt_2026').digest('hex');
}

export function generateToken(user: UserRecord): string {
  const payload = JSON.stringify({ id: user.id, email: user.email, time: Date.now() });
  return Buffer.from(payload).toString('base64');
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.email) {
      return { id: parsed.id, email: parsed.email };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const cleanEmail = email.trim().toLowerCase();
  const mongo = await connectMongo();
  if (mongo) {
    try {
      const doc = await UserModel.findOne({ email: cleanEmail });
      if (doc) return mongoDocToUserRecord(doc);
    } catch (e) {
      console.warn('Mongo findUserByEmail error, checking local store:', e);
    }
  }

  const users = getAllLocalUsers();
  return users.find((u) => u.email.toLowerCase() === cleanEmail);
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  const mongo = await connectMongo();
  if (mongo) {
    try {
      const query = mongoose.isValidObjectId(id)
        ? { $or: [{ userId: id }, { _id: id }] }
        : { userId: id };
      const doc = await UserModel.findOne(query);
      if (doc) return mongoDocToUserRecord(doc);
    } catch (e) {
      console.warn('Mongo findUserById error, checking local store:', e);
    }
  }

  const users = getAllLocalUsers();
  return users.find((u) => u.id === id);
}

export async function findUserByIdentifier(identifier: string): Promise<UserRecord | undefined> {
  const clean = identifier.trim().toLowerCase();
  const mongo = await connectMongo();
  if (mongo) {
    try {
      const doc = await UserModel.findOne({
        $or: [
          { email: clean },
          { leetcodeUsername: { $regex: new RegExp(`^${clean}$`, 'i') } },
          { name: { $regex: new RegExp(`^${clean}$`, 'i') } },
          { userId: clean },
        ],
      });
      if (doc) return mongoDocToUserRecord(doc);
    } catch (e) {
      console.warn('Mongo findUserByIdentifier error, checking local store:', e);
    }
  }

  const users = getAllLocalUsers();
  return users.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.leetcodeUsername?.toLowerCase() === clean ||
      u.name.toLowerCase() === clean ||
      u.id === clean
  );
}

export async function findUserByLeetcodeUsername(username: string): Promise<UserRecord | undefined> {
  const clean = username.trim().toLowerCase();
  const mongo = await connectMongo();
  if (mongo) {
    try {
      const doc = await UserModel.findOne({
        leetcodeUsername: { $regex: new RegExp(`^${clean}$`, 'i') },
      });
      if (doc) return mongoDocToUserRecord(doc);
    } catch (e) {
      console.warn('Mongo findUserByLeetcodeUsername error:', e);
    }
  }

  const users = getAllLocalUsers();
  return users.find((u) => u.leetcodeUsername?.toLowerCase() === clean);
}

export async function createUser(name: string, email: string, password: string): Promise<UserRecord> {
  const cleanEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('User already exists with this email');
  }

  const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  const userObj: UserRecord = {
    id: newId,
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    createdAt: now,
    solved: [],
    starred: [],
    notes: {},
    atcoderSolved: [],
    atcoderStarred: [],
    atcoderNotes: {},
  };

  const mongo = await connectMongo();
  if (mongo) {
    try {
      const doc = await UserModel.create({
        userId: newId,
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        solved: [],
        starred: [],
        notes: {},
        atcoderSolved: [],
        atcoderStarred: [],
        atcoderNotes: {},
      });
      return mongoDocToUserRecord(doc);
    } catch (e) {
      console.warn('Mongo createUser error, falling back to local save:', e);
    }
  }

  const users = getAllLocalUsers();
  users.push(userObj);
  saveLocalUsers(users);
  return userObj;
}

export async function updateUserProgress(
  id: string,
  progress: {
    solved?: number[];
    starred?: number[];
    notes?: Record<number, string>;
    atcoderSolved?: string[];
    atcoderStarred?: string[];
    atcoderNotes?: Record<string, string>;
  }
): Promise<UserRecord> {
  const mongo = await connectMongo();
  if (mongo) {
    try {
      const query = mongoose.isValidObjectId(id)
        ? { $or: [{ userId: id }, { _id: id }] }
        : { userId: id };

      const existingDoc = await UserModel.findOne(query);
      if (existingDoc) {
        if (progress.solved !== undefined) {
          existingDoc.solved = Array.from(new Set(progress.solved));
        }
        if (progress.starred !== undefined) {
          existingDoc.starred = Array.from(new Set(progress.starred));
        }
        if (progress.notes !== undefined) {
          existingDoc.notes = { ...(existingDoc.notes || {}), ...progress.notes };
          existingDoc.markModified('notes');
        }
        if (progress.atcoderSolved !== undefined) {
          existingDoc.atcoderSolved = Array.from(new Set(progress.atcoderSolved));
        }
        if (progress.atcoderStarred !== undefined) {
          existingDoc.atcoderStarred = Array.from(new Set(progress.atcoderStarred));
        }
        if (progress.atcoderNotes !== undefined) {
          existingDoc.atcoderNotes = { ...(existingDoc.atcoderNotes || {}), ...progress.atcoderNotes };
          existingDoc.markModified('atcoderNotes');
        }

        const saved = await existingDoc.save();
        return mongoDocToUserRecord(saved);
      }
    } catch (e) {
      console.warn('Mongo updateUserProgress error, falling back to local save:', e);
    }
  }

  const users = getAllLocalUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error('User not found');
  }

  if (progress.solved !== undefined) {
    users[index].solved = Array.from(new Set(progress.solved));
  }
  if (progress.starred !== undefined) {
    users[index].starred = Array.from(new Set(progress.starred));
  }
  if (progress.notes !== undefined) {
    users[index].notes = { ...users[index].notes, ...progress.notes };
  }
  if (progress.atcoderSolved !== undefined) {
    users[index].atcoderSolved = Array.from(new Set(progress.atcoderSolved));
  }
  if (progress.atcoderStarred !== undefined) {
    users[index].atcoderStarred = Array.from(new Set(progress.atcoderStarred));
  }
  if (progress.atcoderNotes !== undefined) {
    users[index].atcoderNotes = { ...(users[index].atcoderNotes || {}), ...progress.atcoderNotes };
  }

  saveLocalUsers(users);
  return users[index];
}

export async function loginOrCreateLeetcodeUser(data: {
  username: string;
  password?: string;
  realName?: string;
  avatar?: string;
  rating?: number;
  badge?: string;
  ranking?: number;
  mergeSolved?: number[];
  mergeStarred?: number[];
  mergeNotes?: Record<number, string>;
}): Promise<UserRecord> {
  const cleanUsername = data.username.toLowerCase();
  const mongo = await connectMongo();

  if (mongo) {
    try {
      let doc = await UserModel.findOne({ leetcodeUsername: cleanUsername });

      if (doc) {
        if (data.password && data.password.trim()) {
          doc.passwordHash = hashPassword(data.password);
        }
        doc.name = data.realName || doc.name || data.username;
        if (data.avatar) doc.leetcodeAvatar = data.avatar;
        if (data.rating) doc.leetcodeRating = Math.round(data.rating);
        if (data.badge) doc.leetcodeBadge = data.badge;
        if (data.ranking) doc.leetcodeRanking = data.ranking;

        if (data.mergeSolved && data.mergeSolved.length > 0) {
          doc.solved = Array.from(new Set([...(doc.solved || []), ...data.mergeSolved]));
        }
        if (data.mergeStarred && data.mergeStarred.length > 0) {
          doc.starred = Array.from(new Set([...(doc.starred || []), ...data.mergeStarred]));
        }
        if (data.mergeNotes && Object.keys(data.mergeNotes).length > 0) {
          doc.notes = { ...(doc.notes || {}), ...data.mergeNotes };
          doc.markModified('notes');
        }

        const saved = await doc.save();
        return mongoDocToUserRecord(saved);
      } else {
        const newDoc = await UserModel.create({
          userId: 'lc_' + cleanUsername,
          name: data.realName || data.username,
          email: `${cleanUsername}@leetcode.user`,
          passwordHash: data.password && data.password.trim() ? hashPassword(data.password) : '',
          solved: data.mergeSolved || [],
          starred: data.mergeStarred || [],
          notes: data.mergeNotes || {},
          leetcodeUsername: data.username,
          leetcodeRating: data.rating ? Math.round(data.rating) : undefined,
          leetcodeBadge: data.badge,
          leetcodeAvatar: data.avatar,
          leetcodeRanking: data.ranking,
        });
        return mongoDocToUserRecord(newDoc);
      }
    } catch (e) {
      console.warn('Mongo loginOrCreateLeetcodeUser error, falling back to local:', e);
    }
  }

  const users = getAllLocalUsers();
  const index = users.findIndex((u) => u.leetcodeUsername?.toLowerCase() === cleanUsername);

  if (index !== -1) {
    const user = users[index];
    if (data.password && data.password.trim()) {
      user.passwordHash = hashPassword(data.password);
    }
    user.name = data.realName || user.name || data.username;
    if (data.avatar) user.leetcodeAvatar = data.avatar;
    if (data.rating) user.leetcodeRating = Math.round(data.rating);
    if (data.badge) user.leetcodeBadge = data.badge;
    if (data.ranking) user.leetcodeRanking = data.ranking;

    if (data.mergeSolved && data.mergeSolved.length > 0) {
      user.solved = Array.from(new Set([...(user.solved || []), ...data.mergeSolved]));
    }
    if (data.mergeStarred && data.mergeStarred.length > 0) {
      user.starred = Array.from(new Set([...(user.starred || []), ...data.mergeStarred]));
    }
    if (data.mergeNotes && Object.keys(data.mergeNotes).length > 0) {
      user.notes = { ...(user.notes || {}), ...data.mergeNotes };
    }

    saveLocalUsers(users);
    return user;
  }

  const newUser: UserRecord = {
    id: 'lc_' + cleanUsername,
    name: data.realName || data.username,
    email: `${cleanUsername}@leetcode.user`,
    passwordHash: data.password && data.password.trim() ? hashPassword(data.password) : '',
    createdAt: new Date().toISOString(),
    solved: data.mergeSolved || [],
    starred: data.mergeStarred || [],
    notes: data.mergeNotes || {},
    leetcodeUsername: data.username,
    leetcodeRating: data.rating ? Math.round(data.rating) : undefined,
    leetcodeBadge: data.badge,
    leetcodeAvatar: data.avatar,
    leetcodeRanking: data.ranking,
  };

  users.push(newUser);
  saveLocalUsers(users);
  return newUser;
}
