import { NextResponse } from 'next/server';
import withLogging from '@/lib/requestLogger';

export const GET = withLogging(async () => {
  return NextResponse.json({ success: true, message: 'Welcome Admin! You have full access.' });
});