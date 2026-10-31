import { supabaseAdmin } from '../../lib/supabase-server';
import { NextRequest } from 'next/server';

export async function requireUser(req:NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if(!token) throw new Error('Sign in required');
  const admin = supabaseAdmin();
  const {data,error} = await admin.auth.getUser(token);
  if(error || !data.user) throw new Error('Invalid or expired session');
  return {admin,user:data.user};
}
export function jsonError(error:unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return Response.json({error:message},{status:400});
}
