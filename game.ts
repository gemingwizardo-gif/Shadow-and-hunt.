export const HEAD_START_SECONDS = 180;
export const MATCH_SECONDS = 1800;
export const PING_SECONDS = 180;
export const ZONE_STEP_SECONDS = 600;
export const CAPTURE_METRES = 30;

export function distanceMetres(a: {lat:number; lng:number}, b: {lat:number; lng:number}) {
  const R = 6371000, rad = (n:number) => n * Math.PI / 180;
  const dLat = rad(b.lat-a.lat), dLng = rad(b.lng-a.lng);
  const x = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

export function matchState(startedAt: string, now = Date.now()) {
  const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const remaining = Math.max(0, MATCH_SECONDS - elapsed);
  return {
    elapsed,
    remaining,
    huntersReleased: elapsed >= HEAD_START_SECONDS,
    zoneLevel: Math.floor(elapsed / ZONE_STEP_SECONDS),
    finished: remaining === 0
  };
}
