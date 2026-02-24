import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';

// --- ICONS SETUP (Using CDN for reliability) ---
const Icon = ({ name, size = 24, className = '' }) => {
  const iconMap = {
    settings: 'settings',
    check: 'check',
    x: 'x',
    trophy: 'trophy',
    'calendar-days': 'calendar-days',
    play: 'play',
    'shield-alert': 'shield-alert',
    users: 'users',
    image: 'image',
    camera: 'camera'
  };
  return (
    <img 
      src={`https://api.iconify.design/lucide:${iconMap[name] || name}.svg?color=currentColor`} 
      alt={name}
      width={size} 
      height={size} 
      className={className} 
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
};

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyBN6D88ea-zQMiXdugKRcFmtuIELzDYmgA",
  authDomain: "streetballregavim.firebaseapp.com",
  projectId: "streetballregavim",
  storageBucket: "streetballregavim.firebasestorage.app",
  messagingSenderId: "260898231051",
  appId: "1:260898231051:web:ed3ff0cf234bf140aa880e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "streetballregavim";

// --- CSS STYLES ---
const customStyles = `
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700;900&family=Karantina:wght@400;700&display=swap');
:root { --street-orange: #ff5722; --street-yellow: #ffb300; --dark-asphalt: #121212; --light-concrete: #e0e0e0; }
body { background-color: var(--dark-asphalt); background-image: linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.95)), url("https://www.transparenttextures.com/patterns/concrete-wall.png"); background-attachment: fixed; color: #fff; font-family: 'Heebo', sans-serif; direction: rtl; overflow-x: hidden; }
.font-stencil { font-family: 'Karantina', system-ui; letter-spacing: 1.5px; }
.street-card { background-color: #1a1a1a; border: 2px solid #333; box-shadow: 4px 4px 0px var(--street-orange); transition: all 0.2s; position: relative; }
.street-card-light { background-color: var(--light-concrete); color: #000; border: 2px solid #000; box-shadow: 4px 4px 0px #000; position: relative; }
.tape { background: #2a2a2a; color: #888; border-bottom: 3px solid transparent; transition: 0.2s; cursor: pointer; text-transform: uppercase; }
.tape.active { background: #111; color: var(--street-orange); border-bottom: 3px solid var(--street-orange); }
.polaroid { background: #fff; padding: 8px 8px 32px 8px; border: 1px solid #ddd; box-shadow: 4px 4px 10px rgba(0,0,0,0.5); }
.caution-bg { background: repeating-linear-gradient(45deg, var(--street-yellow), var(--street-yellow) 10px, #000 10px, #000 20px); }
`;

export default function App() {
  const [user, setUser] = useState(null);
  const [isDBReady, setIsDBReady] = useState(false);
  const [activeTab, setActiveTab] = useState('standings');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [leagueStage, setLeagueStage] = useState('registration');
  const [leagueStartDate, setLeagueStartDate] = useState('');
  const [makeupDates, setMakeupDates] = useState('');
  
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayers, setNewPlayers] = useState(['', '', '', '']);

  // --- ACTIONS ---
  const showMessage = (msg) => { 
    setNotification(msg); 
    setTimeout(() => setNotification(null), 3000); 
  };

  const seedDatabase = async () => {
    const batch = writeBatch(db);
    const mockTeams = [
      { id: 't1', name: 'אריות האספלט', players: ['יוסי כהן', 'אבי לוי', 'דני רון', 'אורן זיו'] },
      { id: 't2', name: 'כרישי הפארק', players: ['רון שחר', 'עומר אדם', 'גיא זוארץ', 'טל מוסרי'] },
      { id: 't3', name: 'מלכי הסל', players: ['עידן חביב', 'יניב קטן', 'אלון חזן', 'חיים רביבו'] },
      { id: 't4', name: 'צלפי רגבים', players: ['משה פרץ', 'דודו אהרון', 'ליאור נרקיס', 'אייל גולן'] }
    ];
    
    mockTeams.forEach(t => {
      const tRef = doc(db, 'artifacts', appId, 'public', 'data', 'teams', t.id);
      batch.set(tRef, t);
    });

    const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state');
    batch.set(metaRef, { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    
    await batch.commit();
    setIsDBReady(true);
    showMessage('הגדרות ראשוניות נטענו בהצלחה');
  };

  // --- AUTH ---
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- FIREBASE SYNC ---
  useEffect(() => {
    if (!user) return;
    const unsubTeams = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), (s) => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMatches = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (s) => setMatches(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubGallery = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), (s) => setGallery(s.docs.map(d => d.data()).sort((a,b) => b.createdAt - a.createdAt).map(i => i.url)));
    const unsubMeta = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), (ds) => {
      if (ds.exists()) {
        const d = ds.data();
        setLeagueStage(d.leagueStage || 'registration');
        setLeagueStartDate(d.leagueStartDate || '');
        setMakeupDates(d.makeupDates || '');
        setIsDBReady(true);
      } else { 
        // If meta doesn't exist, we seed the database with initial teams
        seedDatabase(); 
      }
    });
    return () => { unsubTeams(); unsubMatches(); unsubGallery(); unsubMeta(); };
  }, [user]);

  // --- CORE LOGIC: STANDINGS ---
  const standings = useMemo(() => {
    const stats = {};
    teams.forEach(t => stats[t.id] = { id: t.id, name: t.name, points: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 });
    matches.filter(m => m.isPlayed && m.type === 'regular').forEach(m => {
      const hId = m.homeTeam.id, aId = m.awayTeam.id;
      if (!stats[hId] || !stats[aId]) return;
      const hS = parseInt(m.homeScore), aS = parseInt(m.awayScore);
      stats[hId].pf += hS; stats[hId].pa += aS;
      stats[aId].pf += aS; stats[aId].pa += hS;
      if (hS > aS) { stats[hId].wins += 1; stats[hId].points += 2; stats[aId].losses += 1; stats[aId].points += 1; }
      else { stats[aId].wins += 1; stats[aId].points += 2; stats[hId].losses += 1; stats[hId].points += 1; }
    });
    return Object.values(stats).map(s => ({ ...s, diff: s.pf - s.pa })).sort((a, b) => b.points - a.points || b.diff - a.diff);
  }, [teams, matches]);

  const toggleAdmin = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogin = () => {
    if (adminUser === 'אדמין' && adminPass === '010608') { 
      setIsAdminMode(true); 
      setShowLoginModal(false); 
      setAdminUser(''); 
      setAdminPass(''); 
      showMessage('שלום אדמין'); 
    } else { 
      showMessage('פרטים שגויים'); 
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return showMessage('הזן שם קבוצה');
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', 't_' + Date.now()), { name: newTeamName, players: newPlayers.filter(p => p.trim()) });
    setNewTeamName(''); setNewPlayers(['','','','']); showMessage('קבוצה נוספה');
  };

  const handleDeleteTeam = async (id) => {
    if (window.confirm('האם למחוק את הקבוצה?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', id));
      showMessage('קבוצה נמחקה');
    }
  };

  const updateScore = async (matchId, hS, aS) => {
    const h = parseInt(hS), a = parseInt(aS);
    if (isNaN(h) || isNaN(a)) return showMessage('הזן מספרים');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), { homeScore: h, awayScore: a, isPlayed: true });
    showMessage('תוצאה עודכנה');
  };

  const startFinalFour = async () => {
    const top4 = standings.slice(0, 4);
    if (top4.length < 4) return showMessage('צריך לפחות 4 קבוצות בטבלה כדי להתחיל פיינל פור');
    const batch = writeBatch(db);
    const s1 = { id: 'ff_s1', roundName: 'חצי גמר (1 נגד 4)', roundIndex: 1000, homeTeam: top4[0], awayTeam: top4[3], homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: 'semi' };
    const s2 = { id: 'ff_s2', roundName: 'חצי גמר (2 נגד 3)', roundIndex: 1000, homeTeam: top4[1], awayTeam: top4[2], homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: 'semi' };
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', s1.id), s1);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', s2.id), s2);
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'playoff' });
    await batch.commit(); setActiveTab('playoffs');
  };

  const createFinals = async () => {
    const semis = matches.filter(m => m.type === 'playoff' && m.stage === 'semi' && m.isPlayed);
    if (semis.length < 2) return showMessage('יש לסיים את שני משחקי חצי הגמר קודם');
    const s1 = semis.find(m => m.id === 'ff_s1'), s2 = semis.find(m => m.id === 'ff_s2');
    const w1 = s1.homeScore > s1.awayScore ? s1.homeTeam : s1.awayTeam;
    const l1 = s1.homeScore > s1.awayScore ? s1.awayTeam : s1.homeTeam;
    const w2 = s2.homeScore > s2.awayScore ? s2.homeTeam : s2.awayTeam;
    const l2 = s2.homeScore > s2.awayScore ? s2.awayTeam : s2.homeTeam;
    const batch = writeBatch(db);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', 'ff_final'), { id: 'ff_final', roundName: 'הגמר הגדול', roundIndex: 1002, homeTeam: w1, awayTeam: w2, homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: 'final' });
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', 'ff_3rd'), { id: 'ff_3rd', roundName: 'משחק על מקום 3', roundIndex: 1001, homeTeam: l1, awayTeam: l2, homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: '3rd' });
    await batch.commit();
    showMessage('משחקי הגמר נוצרו');
  };

  const resetLeague = async () => {
    if(!window.confirm('זה ימחוק את כל נתוני המשחקים! בטוח?')) return;
    const batch = writeBatch(db);
    matches.forEach(m => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'matches', m.id)));
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    await batch.commit(); showMessage('הליגה אופסה');
  };

  if (!isDBReady) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-stencil text-2xl">מחבר למגרש...</div>;

  return (
    <div className="min-h-screen pb-20">
      <style>{customStyles}</style>
      <header className="pt-16 pb-12 bg-black border-b border-neutral-800 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/brick-wall-dark.png')]"></div>
        <h1 className="font-stencil text-6xl md:text-8xl text-white uppercase relative z-10">סטריטבול <span className="text-[var(--street-orange)]">רגבים</span></h1>
        <div className="bg-[var(--street-orange)] text-black font-bold px-6 py-1 inline-block mt-4 relative z-10">3X3 OFFICIAL LEAGUE</div>
      </header>

      <nav className="max-w-6xl mx-auto sticky top-0 z-50 bg-[#111] border-b border-neutral-800 flex flex-wrap justify-center shadow-xl">
        {[
          { id: 'standings', l: 'טבלה' },
          { id: 'schedule', l: 'לוח משחקים' },
          { id: 'playoffs', l: 'פיינל פור' },
          { id: 'teams', l: 'קבוצות' },
          { id: 'gallery', l: 'גלריה' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tape px-6 py-4 font-bold text-lg ${activeTab === t.id ? 'active' : ''}`}>{t.l}</button>
        ))}
        <button onClick={toggleAdmin} className="px-6 py-4 text-neutral-500 hover:text-white flex items-center gap-2 border-l border-neutral-800 transition-colors">
          <Icon name="settings" size={16} /> {isAdminMode ? 'יציאה' : 'מנהל'}
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-4 mt-8">
        {activeTab === 'standings' && (
          <div className="street-card-light overflow-hidden rounded shadow-2xl">
            <table className="w-full text-right">
              <thead className="bg-neutral-200 border-b-2 font-bold">
                <tr><th className="p-4">מקום</th><th className="p-4">קבוצה</th><th className="p-4 text-center">נק'</th><th className="p-4 text-center">נצ'</th><th className="p-4 text-center">הפ'</th></tr>
              </thead>
              <tbody>
                {standings.map((t, i) => (
                  <tr key={t.id} className="border-b hover:bg-white transition-colors">
                    <td className="p-4"><span className={`w-8 h-8 flex items-center justify-center rounded-sm font-bold ${i === 0 ? 'bg-[var(--street-orange)] text-white' : 'bg-neutral-800 text-white'}`}>{i+1}</span></td>
                    <td className="p-4 font-bold text-lg">{t.name}</td>
                    <td className="p-4 text-center font-black text-[var(--street-orange)] text-2xl">{t.points}</td>
                    <td className="p-4 text-center">{t.wins}</td><td className="p-4 text-center">{t.losses}</td>
                  </tr>
                ))}
                {standings.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-neutral-500 font-bold">אין נתונים בטבלה עדיין.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h2 className="text-4xl font-stencil tracking-widest uppercase text-[var(--street-orange)]">לוח משחקים</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.filter(m=>m.type==='regular').sort((a,b)=>a.roundIndex-b.roundIndex).map(m => (
                <div key={m.id} className="street-card p-6 border-[var(--street-orange)]">
                  <div className="text-xs font-bold text-neutral-500 mb-2 uppercase">{m.roundName} | {m.roundDates}</div>
                  <div className="flex justify-between items-center text-center">
                    <div className="flex-1 font-bold text-xl">{m.homeTeam.name}</div>
                    <div className="px-4">{m.isPlayed ? <div className="text-2xl font-black text-[var(--street-orange)]">{m.homeScore} - {m.awayScore}</div> : <span className="font-stencil text-2xl text-neutral-700">VS</span>}</div>
                    <div className="flex-1 font-bold text-xl">{m.awayTeam.name}</div>
                  </div>
                  {!m.isPlayed && <div className="mt-4 flex justify-center gap-2">
                    <input type="number" id={`h_${m.id}`} className="w-16 bg-black border border-neutral-800 text-center text-xl font-bold" placeholder="0" />
                    <button onClick={() => updateScore(m.id, document.getElementById(`h_${m.id}`).value, document.getElementById(`a_${m.id}`).value)} className="bg-[var(--street-orange)] text-black px-6 py-2 text-sm font-black uppercase">עדכן</button>
                    <input type="number" id={`a_${m.id}`} className="w-16 bg-black border border-neutral-800 text-center text-xl font-bold" placeholder="0" />
                  </div>}
                </div>
              ))}
              {matches.filter(m=>m.type==='regular').length === 0 && (
                <div className="col-span-full py-20 text-center text-neutral-500 font-stencil text-2xl street-card">
                  לוח המשחקים טרם נוצר.
                  {isAdminMode && <div className="mt-4 text-sm text-neutral-400 font-sans">כנס לניהול כדי להגריל משחקים.</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'playoffs' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h2 className="text-4xl font-stencil text-[var(--street-yellow)]">פיינל פור</h2>
              <div className="flex gap-2">
                {isAdminMode && leagueStage === 'regular' && <button onClick={startFinalFour} className="bg-white text-black px-4 py-2 font-bold text-sm uppercase">הפעל פיינל פור</button>}
                {isAdminMode && leagueStage === 'playoff' && matches.filter(m=>m.type==='playoff'&&m.stage==='semi'&&m.isPlayed).length===2 && !matches.find(m=>m.stage==='final') && <button onClick={createFinals} className="bg-[var(--street-yellow)] text-black px-4 py-2 font-bold text-sm uppercase">צור גמרים</button>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.filter(m=>m.type==='playoff').sort((a,b)=>a.roundIndex-b.roundIndex).map(m => (
                <div key={m.id} className="street-card p-8 border-[var(--street-yellow)] shadow-[0_0_20px_rgba(255,179,0,0.2)]">
                  <div className="text-xs font-bold text-[var(--street-yellow)] mb-2 uppercase">{m.roundName}</div>
                  <div className="flex justify-between items-center text-center">
                    <div className="flex-1 font-black text-2xl">{m.homeTeam.name}</div>
                    <div className="px-6">{m.isPlayed ? <div className="text-4xl font-black text-[var(--street-yellow)]">{m.homeScore} - {m.awayScore}</div> : <span className="font-stencil text-3xl">VS</span>}</div>
                    <div className="flex-1 font-black text-2xl">{m.awayTeam.name}</div>
                  </div>
                  {!m.isPlayed && <div className="mt-6 flex justify-center gap-4">
                    <input type="number" id={`h_${m.id}`} className="w-20 bg-black border-b-2 border-neutral-800 text-center text-3xl font-bold" />
                    <button onClick={() => updateScore(m.id, document.getElementById(`h_${m.id}`).value, document.getElementById(`a_${m.id}`).value)} className="bg-[var(--street-yellow)] text-black px-8 py-2 font-black">עדכן</button>
                    <input type="number" id={`a_${m.id}`} className="w-20 bg-black border-b-2 border-neutral-800 text-center text-3xl font-bold" />
                  </div>}
                </div>
              ))}
              {matches.filter(m=>m.type==='playoff').length === 0 && (
                <div className="col-span-full py-20 text-center text-neutral-500 font-stencil text-2xl street-card border-dashed">
                  הפיינל פור טרם החל.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-8">
            {isAdminMode && (
              <div className="street-card p-6 mb-8 border-[var(--street-orange)]">
                <h3 className="font-stencil text-2xl mb-4 text-white uppercase tracking-widest">רישום קבוצה חדשה</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="שם הקבוצה" value={newTeamName} onChange={e=>setNewTeamName(e.target.value)} className="bg-black border border-neutral-800 p-4 w-full text-white font-bold" />
                  <div className="grid grid-cols-2 gap-2">
                    {[0,1,2,3].map(i => (
                      <input key={i} type="text" placeholder={`שם שחקן ${i+1}`} value={newPlayers[i]} onChange={e => {
                        const updated = [...newPlayers];
                        updated[i] = e.target.value;
                        setNewPlayers(updated);
                      }} className="bg-black border border-neutral-800 p-3 text-sm text-white" />
                    ))}
                  </div>
                  <button onClick={handleAddTeam} className="bg-white text-black w-full font-black py-4 hover:bg-[var(--street-orange)] transition-colors uppercase tracking-widest">הוסף קבוצה למערכת</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teams.map(t => (
                <div key={t.id} className="street-card overflow-hidden group">
                  {isAdminMode && <button onClick={()=>handleDeleteTeam(t.id)} className="absolute top-2 left-2 text-neutral-700 hover:text-red-500 z-20 transition-colors"><Icon name="x" size={20}/></button>}
                  <div className="bg-neutral-900 p-6 text-center border-b-2 border-[var(--street-orange)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--street-orange)] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <h3 className="font-stencil text-3xl uppercase relative z-10 text-white tracking-widest">{t.name}</h3>
                  </div>
                  <div className="p-6 bg-black space-y-3">
                    {t.players?.map((p, i) => <div key={i} className="text-sm text-neutral-400 border-b border-neutral-900 pb-2 flex gap-3 font-bold"><span className="text-[var(--street-orange)]">#{i+1}</span> {p}</div>)}
                    {(!t.players || t.players.length === 0) && <div className="text-xs text-neutral-600">אין שחקנים רשומים</div>}
                  </div>
                </div>
              ))}
              {teams.length === 0 && <div className="col-span-full py-20 text-center text-neutral-500 font-stencil text-2xl street-card border-dashed">אין קבוצות רשומות עדיין.</div>}
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h2 className="text-4xl font-stencil text-white tracking-widest">גלריה</h2>
              <label className="bg-white text-black px-6 py-2 font-bold cursor-pointer hover:bg-neutral-200 uppercase text-sm flex items-center gap-2 transition-all">
                <Icon name="camera" size={18} /> העלה רגעים מהמגרש
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {gallery.length === 0 ? <div className="col-span-full py-20 text-center text-neutral-500 font-stencil text-2xl street-card">הגלריה ריקה.</div> : gallery.map((img, i) => (
                <div key={i} className="polaroid aspect-square transform hover:rotate-1 transition-transform cursor-pointer">
                  <img src={img} alt="מגרש" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border-2 border-[var(--street-orange)] p-10 max-w-sm w-full shadow-2xl relative">
             <button onClick={()=>setShowLoginModal(false)} className="absolute top-4 left-4 text-neutral-600 hover:text-white"><Icon name="x" size={24}/></button>
            <h3 className="text-3xl font-stencil text-[var(--street-orange)] mb-8 text-center tracking-widest uppercase">כניסת הנהלה</h3>
            <div className="space-y-4 mb-8">
              <input type="text" placeholder="שם משתמש" value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="w-full bg-black border border-neutral-800 p-4 text-white focus:border-[var(--street-orange)] outline-none font-bold" />
              <input type="password" placeholder="סיסמה" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} className="w-full bg-black border border-neutral-800 p-4 text-white focus:border-[var(--street-orange)] outline-none font-bold" dir="ltr" />
            </div>
            <button onClick={handleLogin} className="w-full bg-[var(--street-orange)] text-black font-black py-4 uppercase hover:bg-white transition-colors tracking-widest text-lg">התחבר</button>
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-[var(--street-orange)] text-black font-black px-8 py-4 shadow-2xl animate-bounce flex items-center gap-3">
          <Icon name="check" size={20} />
          <span>{notification}</span>
        </div>
      )}

      {/* ADMIN RESET BUTTON (Visible in Admin Mode) */}
      {isAdminMode && (
        <div className="fixed bottom-4 left-4 z-50">
          <button onClick={resetLeague} className="bg-red-900/30 hover:bg-red-600 text-red-500 hover:text-white p-2 border border-red-900 transition-all text-xs font-bold px-4">איפוס ליגה מלא</button>
        </div>
      )}
    </div>
  );
}