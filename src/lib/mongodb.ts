import mongoose from 'mongoose';
import { UserRecord } from './db';

const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI || '';
const MONGO_URI = rawUri.trim();

interface CachedMongo {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
  failed: boolean;
  lastAttempt: number;
}

let cached: CachedMongo = (global as any).__mongo;
if (!cached) {
  cached = (global as any).__mongo = { conn: null, promise: null, failed: false, lastAttempt: 0 };
}

export async function isMongoAvailable(): Promise<boolean> {
  if (!MONGO_URI) return false;
  try {
    const conn = await connectMongo();
    return !!conn && conn.connection.readyState === 1;
  } catch (err) {
    return false;
  }
}

export async function connectMongo(): Promise<typeof mongoose | null> {
  if (!MONGO_URI) {
    return null;
  }

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // If failed recently (within 10s), don't keep blocking requests
  const now = Date.now();
  if (cached.failed && now - cached.lastAttempt < 10000) {
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 4000,
    };

    cached.lastAttempt = now;
    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((m) => {
        console.log('✅ Connected to MongoDB successfully!');
        cached.failed = false;
        return m;
      })
      .catch((err) => {
        console.warn('⚠️ MongoDB connection warning:', err.message);
        cached.failed = true;
        cached.promise = null;
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.conn = null;
    cached.promise = null;
    cached.failed = true;
    return null;
  }
}

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, default: '' },
    solved: { type: [Number], default: [] },
    starred: { type: [Number], default: [] },
    notes: { type: mongoose.Schema.Types.Mixed, default: {} },
    atcoderSolved: { type: [String], default: [] },
    atcoderStarred: { type: [String], default: [] },
    atcoderNotes: { type: mongoose.Schema.Types.Mixed, default: {} },
    leetcodeUsername: { type: String, index: true, sparse: true },
    leetcodeRating: { type: Number },
    leetcodeBadge: { type: String },
    leetcodeAvatar: { type: String },
    leetcodeRanking: { type: Number },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

export function mongoDocToUserRecord(doc: any): UserRecord {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj.userId || obj._id.toString(),
    name: obj.name,
    email: obj.email,
    passwordHash: obj.passwordHash || '',
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
    solved: Array.isArray(obj.solved) ? obj.solved : [],
    starred: Array.isArray(obj.starred) ? obj.starred : [],
    notes: obj.notes || {},
    atcoderSolved: Array.isArray(obj.atcoderSolved) ? obj.atcoderSolved : [],
    atcoderStarred: Array.isArray(obj.atcoderStarred) ? obj.atcoderStarred : [],
    atcoderNotes: obj.atcoderNotes || {},
    leetcodeUsername: obj.leetcodeUsername,
    leetcodeRating: obj.leetcodeRating,
    leetcodeBadge: obj.leetcodeBadge,
    leetcodeAvatar: obj.leetcodeAvatar,
    leetcodeRanking: obj.leetcodeRanking,
  };
}

