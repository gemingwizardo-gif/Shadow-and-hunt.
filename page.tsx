'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../lib/supabase-browser';

type Profile = { id:string; email?:string };
type Room = { id:string; code:string; status:string; host_id:string; started_at:string|null; created_at:string };
type Player = { id:string; user_id:string; role:string; status:string; display_name:string; updated_at:string|null };

export default function Home() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [user,setUser] = useState<Profile|null>(null);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [name,setName] = useState('Player');
  const [roomCode,setRoomCode] = useState('');
  const [room,setRoom] = useState<Room|null>(null);
  const [players,setPlayers] = useState<Player[]>([]);
  const [role,setRole] = useState<'hunter'|'shadow'>('shadow');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('Sign in to create or join a match.');
  const [position,setPosition] = useState<{lat:number;lng:number}|null>(null);
  const [remaining,setRemaining] = useState(1800);

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setUser(data.user as Profile|null));
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e,session) => setUser(session?.user as Profile|null ?? null));
    return () => subscription.unsubscribe();
  },[supabase]);

  async function api(path:string, body:unknown) {
    const {data:{session}} = await supabase.auth.getSession();
    const res = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token ?? ''}`},body:JSON.stringify(body)});
    const json = await res.json();
    if(!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  }

  async function auth(kind:'signup'|'login') {
    setBusy(true);
    const result = kind==='signup'
      ? await supabase.auth.signUp({email,password})
      : await supabase.auth.signInWithPassword({email,password});
    setBusy(false);
    if(result.error) setMessage(result.error.message);
    else setMessage(kind==='signup'?'Check your email if confirmation is enabled, then sign in.':'Signed in.');
  }

  async function createRoom() {
    setBusy(true);
    try { const r = await api('/api/rooms/create',{displayName:name,role}); setRoom(r.room); setRoomCode(r.room.code); setMessage('Room created. Share the code with friends.'); }
    catch(e) { setMessage((e as Error).message); }
    setBusy(false);
  }
  async function joinRoom() {
    setBusy(true);
    try { const r = await api('/api/rooms/join',{code:roomCode,displayName:name,role}); setRoom(r.room); setMessage('Joined the room.'); }
    catch(e) { setMessage((e as Error).message); }
    setBusy(false);
  }
  async function loadRoom() {
    if(!room) return;
    const {data:{session}} = await supabase.auth.getSession();
    const res = await fetch(`/api/rooms/state?roomId=${encodeURIComponent(room.id)}`, {headers:{Authorization:`Bearer ${session?.access_token ?? ''}`}, cache:'no-store'});
    const json = await res.json();
    if(!res.ok) throw new Error(json.error || 'Could not refresh room');
    setPlayers((json.players||[]) as Player[]);
    if(json.room) setRoom(json.room as Room);
  }
  useEffect(() => {
    if(!room) return;
    loadRoom().catch(e=>setMessage(e.message));
    const id=setInterval(()=>loadRoom().catch(()=>{}),5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[room?.id]);
  useEffect(() => {
    if(!room?.started_at) return;
    const tick = () => setRemaining(Math.max(0,1800-Math.floor((Date.now()-new Date(room.started_at!).getTime())/1000)));
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[room?.started_at]);

  async function startMatch() {
    try { await api('/api/rooms/start',{roomId:room?.id}); await loadRoom(); setMessage('Match started! Shadows have a 3-minute head start.'); }
    catch(e) { setMessage((e as Error).message); }
  }
  function shareLocation() {
    if(!navigator.geolocation) { setMessage('Geolocation is not supported by this browser.'); return; }
    setMessage('Requesting location permission…');
    navigator.geolocation.watchPosition(async p => {
      const pos={lat:p.coords.latitude,lng:p.coords.longitude}; setPosition(pos);
      try { await api('/api/location/update',{roomId:room?.id,...pos,accuracy:p.coords.accuracy}); }
      catch(e) { setMessage((e as Error).message); }
    },e=>setMessage(e.message),{enableHighAccuracy:true,maximumAge:5000,timeout:15000});
  }
  async function capture(targetUserId:string) {
    try { await api('/api/capture',{roomId:room?.id,targetUserId}); setMessage('Capture validated.'); await loadRoom(); }
    catch(e) { setMessage((e as Error).message); }
  }
  async function leave() { await api('/api/rooms/leave',{roomId:room?.id}); setRoom(null); setPlayers([]); setMessage('You left the room.'); }

  const me = players.find(p=>p.user_id===user?.id);
  const elapsed = room?.started_at ? Math.floor((Date.now()-new Date(room.started_at).getTime())/1000) : 0;
  const huntersReleased = elapsed >= 180;
  const fmt=(s:number)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return <main className="shell">
    <header><a className="brand" href="#"><span className="mark">◈</span> SHADOW<span>HUNT</span></a><span className="live">● LIVE MANHUNT</span></header>
    <section className="hero"><div className="eyebrow">REAL WORLD. REAL PLAYERS. ONE SURVIVOR.</div><h1>DON'T GET<br/><em>CAUGHT.</em></h1><p>A real-world GPS manhunt. Build a crew, pick your side, and outsmart the city.</p></section>
    <div className="notice">{message}</div>
    {!user ? <section className="panel auth"><div><div className="eyebrow">PLAYER ACCESS</div><h2>Enter the hunt</h2><p>Create an account or sign in to play.</p></div>
      <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <input placeholder="Password (min. 6 characters)" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
      <div className="actions"><button disabled={busy} onClick={()=>auth('login')}>SIGN IN</button><button className="secondary" disabled={busy} onClick={()=>auth('signup')}>CREATE ACCOUNT</button></div>
    </section> : <section className="panel">
      <div className="paneltop"><div><div className="eyebrow">PLAYER CONTROL</div><h2>Welcome, hunter.</h2></div><button className="tiny secondary" onClick={()=>supabase.auth.signOut()}>SIGN OUT</button></div>
      <label>Display name<input value={name} onChange={e=>setName(e.target.value)} maxLength={24}/></label>
      <label>Choose your side<select value={role} onChange={e=>setRole(e.target.value as 'hunter'|'shadow')}><option value="shadow">SHADOW — Hide & survive</option><option value="hunter">HUNTER — Track & capture</option></select></label>
      {!room ? <><div className="actions"><button disabled={busy} onClick={createRoom}>CREATE A MATCH</button></div><div className="join"><input placeholder="6-CHARACTER ROOM CODE" value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} maxLength={6}/><button className="secondary" disabled={busy||roomCode.length!==6} onClick={joinRoom}>JOIN</button></div></> :
      <div className="game">
        <div className="roomhead"><div><div className="eyebrow">ROOM CODE</div><strong>{room.code}</strong></div><div className="timer">{room.started_at?fmt(remaining):'LOBBY'}</div></div>
        <div className="map"><div className="mapgrid"></div><div className="maplabel">GPS FIELD MAP</div><div className="mapcenter">◎</div><div className="mapfoot">{position?`GPS ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`:'Enable location to share your position'}</div></div>
        <div className="actions"><button onClick={shareLocation}>SHARE GPS LOCATION</button>{room.status==='lobby'&&room.host_id===user.id&&<button className="secondary" onClick={startMatch}>START MATCH</button>}</div>
        <div className="eyebrow roster">PLAYERS · {players.length}</div>
        {players.map(p=><div className="player" key={p.id}><span className={p.role==='hunter'?'hunterdot':'shadowdot'}></span><b>{p.display_name}</b><span>{p.role.toUpperCase()}</span><small>{p.status}</small>{me?.role==='hunter'&&p.role==='shadow'&&p.status==='active'&&huntersReleased&&<button className="tiny" onClick={()=>capture(p.user_id)}>TAG</button>}</div>)}
        <p className="muted">Shadows get 3 minutes. Match lasts 30 minutes. Keep location sharing on only while playing.</p>
        <button className="secondary full" onClick={leave}>LEAVE ROOM</button>
      </div>}
    </section>}
    <section className="rules"><div className="eyebrow">THE RULES</div><div className="rulegrid"><article><b>03:00</b><span>Shadow head start</span></article><article><b>03:00</b><span>Location ping cadence</span></article><article><b>10:00</b><span>Zone shrink interval</span></article><article><b>30:00</b><span>Match duration</span></article></div></section>
    <footer>PLAY SMART. STAY IN PUBLIC AREAS. NEVER ENTER PRIVATE PROPERTY OR RUN INTO TRAFFIC.</footer>
  </main>;
}
