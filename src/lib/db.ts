import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
}

export function getAllUsers(): UserRecord[] {
  ensureDataFile();
  try {
    const content = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (e) {
    return [];
  }
}

function saveUsers(users: UserRecord[]) {
  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
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

export function findUserByEmail(email: string): UserRecord | undefined {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): UserRecord | undefined {
  const users = getAllUsers();
  return users.find((u) => u.id === id);
}

export function createUser(name: string, email: string, password: string): UserRecord {
  const users = getAllUsers();
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('User already exists with this email');
  }

  const newUser: UserRecord = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    solved: [],
    starred: [],
    notes: {},
    atcoderSolved: [],
    atcoderStarred: [],
    atcoderNotes: {},
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUserProgress(
  id: string,
  progress: {
    solved?: number[];
    starred?: number[];
    notes?: Record<number, string>;
    atcoderSolved?: string[];
    atcoderStarred?: string[];
    atcoderNotes?: Record<string, string>;
  }
): UserRecord {
  const users = getAllUsers();
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

  saveUsers(users);
  return users[index];
}

export function findUserByLeetcodeUsername(username: string): UserRecord | undefined {
  const users = getAllUsers();
  return users.find((u) => u.leetcodeUsername?.toLowerCase() === username.toLowerCase());
}

export function findUserByIdentifier(identifier: string): UserRecord | undefined {
  const clean = identifier.trim().toLowerCase();
  const users = getAllUsers();
  return users.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.leetcodeUsername?.toLowerCase() === clean ||
      u.name.toLowerCase() === clean
  );
}

export function loginOrCreateLeetcodeUser(data: {
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
}): UserRecord {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.leetcodeUsername?.toLowerCase() === data.username.toLowerCase());

  if (index !== -1) {
    const user = users[index];
    // If a password was provided, update/set it
    if (data.password && data.password.trim()) {
      user.passwordHash = hashPassword(data.password);
    }

    // Update existing user's LeetCode stats
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

    saveUsers(users);
    return user;
  }

  // Create new user for this LeetCode account
  const newUser: UserRecord = {
    id: 'lc_' + data.username.toLowerCase(),
    name: data.realName || data.username,
    email: `${data.username.toLowerCase()}@leetcode.user`,
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
  saveUsers(users);
  return newUser;
}


