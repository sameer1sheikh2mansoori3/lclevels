import { NextResponse } from 'next/server';
import { verifyToken, updateUserProgress } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { solved, starred, notes, atcoderSolved, atcoderStarred, atcoderNotes } = body;

    const updatedUser = updateUserProgress(payload.id, {
      solved,
      starred,
      notes,
      atcoderSolved,
      atcoderStarred,
      atcoderNotes,
    });

    return NextResponse.json({
      success: true,
      solved: updatedUser.solved,
      starred: updatedUser.starred,
      notes: updatedUser.notes,
      atcoderSolved: updatedUser.atcoderSolved || [],
      atcoderStarred: updatedUser.atcoderStarred || [],
      atcoderNotes: updatedUser.atcoderNotes || {},
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

