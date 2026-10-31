import { NextRequest } from 'next/server';
import { requireUser, jsonError } from '../../_auth';

// Deliberately returns roster data only. Exact GPS coordinates stay server-side.
export async function GET(req: NextRequest) {
  try {
    const { admin, user } = await requireUser(req);
    const roomId = req.nextUrl.searchParams.get('roomId');
    if (!roomId) throw new Error('Room ID is required');
    const { data: me } = await admin.from('players').select('id,role,status').eq('room_id', roomId).eq('user_id', user.id).maybeSingle();
    if (!me || me.status === 'left') throw new Error('You are not an active member of this room');
    const [{ data: room, error: roomError }, { data: players, error: playersError }] = await Promise.all([
      admin.from('rooms').select('id,code,status,host_id,started_at,created_at').eq('id', roomId).single(),
      admin.from('players').select('id,user_id,role,status,display_name,updated_at').eq('room_id', roomId).neq('status', 'left').order('created_at')
    ]);
    if (roomError) throw roomError;
    if (playersError) throw playersError;
    return Response.json({ room, players, myRole: me.role });
  } catch (e) { return jsonError(e); }
}
