import { NextResponse } from 'next/server';
import { createUser, findUserByEmail, generateToken, updateUserProgress } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, initialSolved, initialStarred, initialNotes } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const user = createUser(name, email, password);

    // Merge any initial progress from guest session
    if (
      (initialSolved && initialSolved.length > 0) ||
      (initialStarred && initialStarred.length > 0) ||
      (initialNotes && Object.keys(initialNotes).length > 0)
    ) {
      updateUserProgress(user.id, {
        solved: initialSolved || [],
        starred: initialStarred || [],
        notes: initialNotes || {},
      });
      user.solved = initialSolved || [];
      user.starred = initialStarred || [];
      user.notes = initialNotes || {};
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
