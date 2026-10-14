import { NextResponse } from 'next/server';
import { findUserByEmail, hashPassword, generateToken, updateUserProgress } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, mergeSolved, mergeStarred, mergeNotes } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.passwordHash !== hashPassword(password)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Optional merge guest progress into existing account
    if (mergeSolved || mergeStarred || mergeNotes) {
      const mergedSolved = Array.from(new Set([...(user.solved || []), ...(mergeSolved || [])]));
      const mergedStarred = Array.from(new Set([...(user.starred || []), ...(mergeStarred || [])]));
      const mergedNotes = { ...(user.notes || {}), ...(mergeNotes || {}) };
      updateUserProgress(user.id, {
        solved: mergedSolved,
        starred: mergedStarred,
        notes: mergedNotes,
      });
      user.solved = mergedSolved;
      user.starred = mergedStarred;
      user.notes = mergedNotes;
    }

    const token = generateToken(user);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        solved: user.solved,
        starred: user.starred,
        notes: user.notes,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
