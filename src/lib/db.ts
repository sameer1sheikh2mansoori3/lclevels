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
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUserProgress(
  id: string,
  progress: { solved?: number[]; starred?: number[]; notes?: Record<number, string> }
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

  saveUsers(users);
  return users[index];
}
