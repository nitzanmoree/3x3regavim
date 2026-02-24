import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';

// --- ICONS SETUP (Using CDN SVGs) ---
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
  
  // Data State
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [leagueStage, setLeagueStage] = useState('registration');
  const [leagueStartDate, setLeagueStartDate] = useState('');
  const [makeupDates, setMakeupDates] = useState('');
  
  // Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayers, setNewPlayers] = useState(['', '', '', '']);

  // --- AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth Error", e);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- FIREBASE REAL-TIME SYNC ---
  useEffect(() => {
    if (!user) return;

    const unsubTeams = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), (s) => {
      setTeams(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMatches = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (s) => {
      setMatches(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubGallery = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), (s) => {
      setGallery(s.docs.map(d => d.data()).sort((a,b) => b.createdAt - a.createdAt).map(i => i.url));
    });

    const unsubMeta = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), (ds) => {
      if (ds.exists()) {
        const d = ds.data();
        setLeagueStage(d.leagueStage || 'registration');
        setLeagueStartDate(d.leagueStartDate || '');
        setMakeupDates(d.makeupDates || '');
        setIsDBReady(true);
      } else {
        seedDatabase();
      }
    });

    return () => { unsubTeams(); unsubMatches(); unsubGallery(); unsubMeta(); };
  }, [user]);

  // --- CORE LOGIC: STANDINGS ---
  const standings = useMemo(() => {
    const stats = {};
    teams.forEach(t => {
      stats[t.id] = { id: t.id, name: t.name, points: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 };
    });

    matches.filter(m => m.isPlayed && m.type === 'regular').forEach(m => {
      const hId = m.homeTeam.id;
      const aId = m.awayTeam.id;
      if (!stats[hId] || !stats[aId]) return;

      const hS = m.homeScore;
      const aS = m.awayScore;

      stats[hId].pf += hS; stats[hId].pa += aS;
      stats[aId].pf += aS; stats[aId].pa += hS;

      if (hS > aS) {
        stats[hId].wins += 1; stats[hId].points += 2;
        stats[aId].losses += 1; stats[aId].points += 1;
      } else {
        stats[aId].wins += 1; stats[aId].points += 2;
        stats[hId].losses += 1; stats[hId].points += 1;
      }
    });

    return Object.values(stats).map(s => ({ ...s, diff: s.pf - s.pa }))
      .sort((a, b) => b.points - a.points || b.diff - a.diff || b.pf - a.pf);
  }, [teams, matches]);

  // --- ADMIN ACTIONS ---
  const seedDatabase = async () => {
    const batch = writeBatch(db);
    const mock = [
      { id: 't1', name: 'אריות האספלט', players: ['יוסי כהן', 'אבי לוי', 'דני רון', 'אורן זיו'] },
      { id: 't2', name: 'כרישי הפארק', players: ['רון שחר', 'עומר אדם', 'גיא זוארץ', 'טל מוסרי'] },
      { id: 't3', name: 'מלכי הסל', players: ['עידן חביב', 'יניב קטן', 'אלון חזן', 'חיים רביבו'] },
      { id: 't4', name: 'צלפי רגבים', players: ['משה פרץ', 'דודו אהרון', 'ליאור נרקיס', 'אייל גולן'] }
    ];
    mock.forEach(t => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'teams', t.id), t));
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    await batch.commit();
    setIsDBReady(true);
  };

  const handleLogin = () => {
    if (adminUser === 'אדמין' && adminPass === '010608') {
      setIsAdminMode(true);
      setShowLoginModal(false);
      setAdminUser(''); setAdminPass('');
      showMessage('ברוך הבא, מנהל');
    } else {
      showMessage('פרטים שגויים');
    }
  };

  const showMessage = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const toggleAdmin = () => { if (isAdminMode) setIsAdminMode(false); else setShowLoginModal(true); };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return showMessage('שם קבוצה חסר');
    const validPlayers = newPlayers.filter(p => p.trim());
    if (validPlayers.length === 0) return showMessage('שחקנים חסרים');
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', 't_' + Date.now()), { name: newTeamName, players: validPlayers });
    setNewTeamName(''); setNewPlayers(['','','','']); showMessage('קבוצה נוספה');
  };

  const handleDeleteTeam = async (id) => {
    if (window.confirm('למחוק קבוצה?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', id));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    showMessage('מעלה...');
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gallery', 'img_' + Date.now() + Math.random()), { url: ev.target.result, createdAt: Date.now() });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSchedule = async () => {
    if (teams.length < 2 || !leagueStartDate) return showMessage('בחר תאריך וודא שיש קבוצות');
    const start = new Date(leagueStartDate);
    const firstSun = new Date(start); firstSun.setDate(start.getDate() - start.getDay());
    const fmt = (d) => `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear().toString().slice(-2)}`;
    const getWk = (sun, off) => {
      const s = new Date(sun); s.setDate(s.getDate() + off * 7);
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return `${fmt(s)} - ${fmt(e)}`;
    };

    let tms = [...teams];
    if (tms.length % 2 !== 0) tms.push({ id: 'bye', name: 'מנוחה' });
    const rounds = tms.length - 1;
    const half = tms.length / 2;
    let newM = [];
    let idxs = Array.from({ length: tms.length }, (_, i) => i);
    idxs.shift();

    for (let r = 0; r < rounds; r++) {
      let currIdxs = [0, ...idxs];
      for (let i = 0; i < half; i++) {
        let h = tms[currIdxs[i]], a = tms[currIdxs[tms.length - 1 - i]];
        if (h.id !== 'bye' && a.id !== 'bye') {
          newM.push({ id: `m_${r}_${h.id}_${a.id}`, roundName: `מחזור ${r+1}`, roundDates: getWk(firstSun, r), roundIndex: r, homeTeam: h, awayTeam: a, homeScore: '', awayScore: '', isPlayed: false, type: 'regular' });
        }
      }
      idxs.push(idxs.shift());
    }

    const batch = writeBatch(db);
    newM.forEach(m => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', m.id), m));
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'regular', leagueStartDate, makeupDates: getWk(firstSun, rounds) });
    await batch.commit(); 
    setActiveTab('schedule'); showMessage('לוח משחקים נוצר');
  };

  const updateScore = async (matchId, hS, aS) => {
    const h = parseInt(hS), a = parseInt(aS);
    if (isNaN(h) || isNaN(a)) return showMessage('הזן מספרים');
    if (h === a) return showMessage('אין תיקו בסטריטבול');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), { homeScore: h, awayScore: a, isPlayed: true });
    showMessage('תוצאה עודכנה');
  };

  const moveToMakeup = async (matchId) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), { roundName: 'מחזור השלמה', roundDates: makeupDates, roundIndex: 999 });
    showMessage('הועבר להשלמות');
  };

  const startFinalFour = async () => {
    if (standings.length < 4) return showMessage("צריך לפחות 4 קבוצות");
    const top4 = standings.slice(0, 4);
    const semi1 = { id: 'ff_s1', roundName: 'חצי גמר (1 נגד 4)', roundDates: 'פיינל פור', roundIndex: 1000, homeTeam: top4[0], awayTeam: top4[3], homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: 'semi' };
    const semi2 = { id: 'ff_s2', roundName: 'חצי גמר (2 נגד 3)', roundDates: 'פיינל פור', roundIndex: 1000, homeTeam: top4[1], awayTeam: top4[2], homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: 'semi' };
    
    const batch = writeBatch(db);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', semi1.id), semi1);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', semi2.id), semi2);
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'playoff' });
    await batch.commit(); 
    setActiveTab('playoffs'); showMessage('פיינל פור החל!');
  };

  const createFinals = async () => {
    const semis = matches.filter(m => m.type === 'playoff' && m.stage === 'semi' && m.isPlayed);
    if (semis.length < 2) return showMessage('עדכן תוצאות חצאי גמר קודם');
    
    const s1 = semis.find(m => m.id === 'ff_s1');
    const s2 = semis.find(m => m.id === 'ff_s2');
    
    const w1 = s1.homeScore > s1.awayScore ? s1.homeTeam : s1.awayTeam;
    const l1 = s1.homeScore > s1.awayScore ? s1.awayTeam : s1.homeTeam;
    const w2 = s2.homeScore > s2.awayScore ? s2.homeTeam : s2.awayTeam;
    const l2 = s2.homeScore > s2.awayScore ? s2.awayTeam : s2.homeTeam;

    const batch = writeBatch(db);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', 'ff_final'), { id: 'ff_final', roundName: 'הגמר הגדול', roundDates: 'הכרעה', roundIndex: 1002, homeTeam: w1, awayTeam: w2, homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: 'final' });
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', 'ff_3rd'), { id: 'ff_3rd', roundName: 'מקום 3-4', roundDates: 'הכרעה', roundIndex: 1001, homeTeam: l1, awayTeam: l2, homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: '3rd' });
    await batch.commit(); 
    showMessage('משחקי הגמר נוצרו');
  };

  const resetLeague = async () => {
    if(!window.confirm('זה ימחוק הכל! בטוח?')) return;
    const batch = writeBatch(db);
    matches.forEach(m => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'matches', m.id)));
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    await batch.commit(); showMessage('הליגה אופסה');
  };

  // --- UI GROUPS ---
  const regularM = matches.filter(m => m.type === 'regular');
  const playoffM = matches.filter(m => m.type === 'playoff');
  const grouped = regularM.reduce((acc, m) => {
    if (!acc[m.roundName]) acc[m.roundName] = { d: m.roundDates, m: [], i: m.roundIndex };
    acc[m.roundName].m.push(m); return acc;
  }, {});
  const sortedRounds = Object.keys(grouped).sort((a,b) => grouped[a].i - grouped[b].i);

  if (!isDBReady) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-stencil text-2xl">מחבר למגרש...</div>;

  return (
    <div className="min-h-screen pb-20">
      <style>{customStyles}</style>
      
      {/* HEADER */}
      <header className="relative pt-16 pb-12 bg-black border-b border-neutral-800 text-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/brick-wall-dark.png')]"></div>
        <h1 className="font-stencil text-6xl md:text-8xl text-white uppercase relative z-10">סטריטבול <span className="text-[var(--street-orange)]">רגבים</span></h1>
        <div className="bg-[var(--street-orange)] text-black font-bold px-6 py-1 inline-block mt-4 relative z-10">3X3 OFFICIAL LEAGUE</div>
      </header>

      {/* NAV */}
      <nav className="max-w-6xl mx-auto sticky top-0 z-50 bg-[#111] border-b border-neutral-800 flex flex-wrap justify-center shadow-2xl">
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

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto p-4 mt-8">
        
        {/* STANDINGS */}
        {activeTab === 'standings' && (
          <div className="street-card-light overflow-hidden rounded shadow-2xl">
            <table className="w-full text-right">
              <thead className="bg-neutral-200 border-b-2 border-neutral-300 font-bold">
                <tr><th className="p-4">מקום</th><th className="p-4">קבוצה</th><th className="p-4 text-center">נק'</th><th className="p-4 text-center">נצ'</th><th className="p-4 text-center">הפ'</th><th className="p-4 text-center">הפרש</th></tr>
              </thead>
              <tbody>
                {standings.map((t, i) => (
                  <tr key={t.id} className="border-b border-neutral-300 hover:bg-white transition-colors">
                    <td className="p-4"><span className={`w-8 h-8 flex items-center justify-center rounded-sm font-bold ${i === 0 ? 'bg-[var(--street-orange)] text-white' : 'bg-neutral-800 text-white'}`}>{i+1}</span></td>
                    <td className="p-4 font-bold text-lg">{t.name}</td>
                    <td className="p-4 text-center text-2xl font-black text-[var(--street-orange)]">{t.points}</td>
                    <td className="p-4 text-center font-bold">{t.wins}</td>
                    <td className="p-4 text-center font-bold">{t.losses}</td>
                    <td className="p-4 text-center text-neutral-500" dir="ltr">{t.diff > 0 ? `+${t.diff}` : t.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-12">
            {sortedRounds.length === 0 ? <div className="text-center py-20 text-neutral-500 font-stencil text-2xl">טרם נוצר לוח משחקים</div> : sortedRounds.map(r => (
              <div key={r} className="space-y-4">
                <h3 className="text-3xl font-stencil text-[var(--street-orange)] border-b border-neutral-800 pb-2 flex items-baseline gap-4">
                  {r} <span className="text-sm font-bold text-neutral-500">{grouped[r].d}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {grouped[r].m.map(m => (
                    <div key={m.id} className={`street-card p-5 rounded ${m.isPlayed ? 'opacity-60' : 'border-[var(--street-orange)]'}`}>
                      <div className="flex justify-between items-center text-center">
                        <div className="flex-1 font-bold text-lg">{m.homeTeam.name}</div>
                        <div className="px-6">
                          {m.isPlayed ? <div className="bg-black text-[var(--street-orange)] px-4 py-1 border border-neutral-700 font-black text-xl">{m.homeScore} - {m.awayScore}</div> : <span className="font-stencil text-2xl text-neutral-600">VS</span>}
                        </div>
                        <div className="flex-1 font-bold text-lg">{m.awayTeam.name}</div>
                      </div>
                      {!m.isPlayed && (
                        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-3">
                          <div className="flex justify-center items-center gap-4">
                            <input type="number" id={`h_${m.id}`} className="w-16 h-10 bg-black border border-neutral-700 text-center text-xl" placeholder="0" />
                            <span className="text-xs font-bold text-neutral-500">תוצאה</span>
                            <input type="number" id={`a_${m.id}`} className="w-16 h-10 bg-black border border-neutral-700 text-center text-xl" placeholder="0" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateScore(m.id, document.getElementById(`h_${m.id}`).value, document.getElementById(`a_${m.id}`).value)} className="flex-1 bg-neutral-800 hover:bg-[var(--street-orange)] py-2 text-sm font-bold transition-all">עדכן תוצאה</button>
                            {isAdminMode && <button onClick={() => moveToMakeup(m.id)} className="px-3 bg-neutral-900 border border-neutral-700 text-xs text-neutral-400">דחה</button>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PLAYOFFS */}
        {activeTab === 'playoffs' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h2 className="text-4xl font-stencil text-white tracking-widest">שלב הפיינל פור</h2>
              <div className="flex gap-2">
                {isAdminMode && leagueStage === 'regular' && <button onClick={startFinalFour} className="bg-white text-black px-6 py-2 font-bold text-sm uppercase">הפעל פיינל פור</button>}
                {isAdminMode && leagueStage === 'playoff' && playoffM.filter(m=>m.stage==='semi'&&m.isPlayed).length === 2 && !playoffM.find(m=>m.stage==='final') && <button onClick={createFinals} className="bg-[var(--street-yellow)] text-black px-6 py-2 font-bold text-sm uppercase shadow-lg">צור משחקי גמר</button>}
              </div>
            </div>
            {leagueStage !== 'playoff' ? <div className="text-center py-24 street-card">
              <div className="flex justify-center mb-4"><Icon name="shield-alert" size={60} className="text-neutral-700" /></div>
              <p className="text-neutral-500 font-stencil text-3xl">הפיינל פור טרם החל.</p>
              <p className="text-neutral-600 text-sm mt-2">המנהל יפעיל את השלב בסיום העונה הסדירה.</p>
            </div> : (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {playoffM.sort((a,b)=>a.roundIndex-b.roundIndex).map(m => (
                    <div key={m.id} className="street-card p-8 border-[var(--street-orange)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-[var(--street-orange)] text-black text-[10px] font-black px-3 py-1 uppercase">{m.roundName}</div>
                      <div className="flex justify-between items-center text-center text-xl mt-4">
                        <div className="flex-1 font-black text-2xl">{m.homeTeam.name}</div>
                        <div className="px-6">
                          {m.isPlayed ? <div className="text-5xl font-black text-[var(--street-orange)] shadow-orange-500/20 drop-shadow-xl">{m.homeScore} - {m.awayScore}</div> : <span className="font-stencil text-4xl text-neutral-700">VS</span>}
                        </div>
                        <div className="flex-1 font-black text-2xl">{m.awayTeam.name}</div>
                      </div>
                      {!m.isPlayed && (
                        <div className="mt-8 flex justify-center items-center gap-4 border-t border-neutral-800 pt-6">
                          <input type="number" id={`h_${m.id}`} className="w-20 h-14 bg-black border-b-2 border-[var(--street-orange)] text-center text-4xl font-black" />
                          <button onClick={() => updateScore(m.id, document.getElementById(`h_${m.id}`).value, document.getElementById(`a_${m.id}`).value)} className="bg-[var(--street-orange)] px-8 py-3 font-black text-black hover:bg-white transition-colors">עדכן</button>
                          <input type="number" id={`a_${m.id}`} className="w-20 h-14 bg-black border-b-2 border-[var(--street-orange)] text-center text-4xl font-black" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEAMS */}
        {activeTab === 'teams' && (
          <div className="space-y-8">
            {isAdminMode && leagueStage === 'registration' && (
              <div className="street-card p-6 bg-neutral-900/50 mb-8">
                <h3 className="text-xl font-bold mb-4">רישום קבוצה חדשה</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="שם הקבוצה" value={newTeamName} onChange={e=>setNewTeamName(e.target.value)} className="bg-black border border-neutral-700 p-3" />
                  <div className="grid grid-cols-2 gap-2">
                    {[0,1,2,3].map(i => <input key={i} type="text" placeholder={`שחקן ${i+1}`} value={newPlayers[i]} onChange={e => { const p=[...newPlayers]; p[i]=e.target.value; setNewPlayers(p); }} className="bg-black border border-neutral-700 p-2 text-sm" />)}
                  </div>
                </div>
                <button onClick={handleAddTeam} className="w-full mt-4 bg-white text-black font-bold py-3 hover:bg-[var(--street-orange)] transition-colors">+ הוסף קבוצה</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teams.map(t => (
                <div key={t.id} className="street-card overflow-hidden group">
                  {isAdminMode && leagueStage === 'registration' && <button onClick={()=>handleDeleteTeam(t.id)} className="absolute top-2 left-2 text-red-500 z-20"><Icon name="x" size={20}/></button>}
                  <div className="bg-neutral-900 p-5 text-center border-b-2 border-[var(--street-orange)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--street-orange)] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <h3 className="font-stencil text-3xl uppercase relative z-10">{t.name}</h3>
                  </div>
                  <div className="p-6 bg-black space-y-3">
                    {t.players.map((p, i) => <div key={i} className="text-sm text-neutral-300 border-b border-neutral-800 pb-2 flex gap-3"><span className="text-[var(--street-orange)] font-bold">#{i+1}</span> {p}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h2 className="text-4xl font-stencil text-white tracking-widest">קיר התהילה</h2>
              <label className="bg-white text-black px-6 py-2 font-bold cursor-pointer hover:bg-neutral-200 uppercase text-sm flex items-center gap-2 transition-all">
                <Icon name="camera" size={18} /> העלה רגע מהמגרש
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {gallery.length === 0 ? <div className="col-span-full py-20 text-center text-neutral-600 font-stencil text-2xl">הקיר עדיין ריק. מחכים לתמונות שלכם!</div> : gallery.map((u, i) => (
                <div key={i} className="polaroid aspect-square transform hover:rotate-2 transition-transform duration-300 cursor-zoom-in">
                  <img src={u} className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700" alt="Streetball" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border-2 border-[var(--street-orange)] p-10 max-w-sm w-full shadow-[0_0_50px_rgba(255,87,34,0.3)]">
            <h3 className="text-3xl font-stencil text-[var(--street-orange)] mb-8 text-center tracking-widest uppercase">כניסת הנהלה</h3>
            <div className="space-y-4 mb-8">
              <input type="text" placeholder="שם משתמש" value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="w-full bg-black border border-neutral-800 p-4 text-white focus:border-[var(--street-orange)] outline-none" />
              <input type="password" placeholder="סיסמה" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} className="w-full bg-black border border-neutral-800 p-4 text-white focus:border-[var(--street-orange)] outline-none" dir="ltr" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleLogin} className="flex-1 bg-[var(--street-orange)] text-black font-black py-4 uppercase hover:bg-white transition-colors">התחבר</button>
              <button onClick={()=>setShowLoginModal(false)} className="px-6 text-neutral-500 font-bold hover:text-white transition-colors">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CONTROL PANEL - REGISTRATION */}
      {isAdminMode && activeTab === 'standings' && leagueStage === 'registration' && (
        <div className="max-w-6xl mx-auto px-4 mt-12">
          <div className="street-card p-8 border-[var(--street-yellow)] bg-black/80 flex flex-col items-center text-center">
            <Icon name="trophy" size={48} className="text-[var(--street-orange)] mb-4" />
            <h4 className="text-4xl font-stencil text-white mb-2">מוכנים להזניק את העונה?</h4>
            <p className="text-neutral-400 mb-6">ישנן {teams.length} קבוצות רשומות. בחר תאריך פתיחה לייצור הלו"ז.</p>
            <div className="w-full max-w-xs mb-6">
              <input type="date" value={leagueStartDate} onChange={e=>setLeagueStartDate(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 p-3 text-white" />
            </div>
            <button onClick={generateSchedule} className="bg-[var(--street-orange)] text-black font-black px-12 py-4 text-xl hover:bg-white transition-all shadow-xl">צור לוח משחקים והתחל ליגה!</button>
          </div>
        </div>
      )}

      {/* ADMIN RESET */}
      {isAdminMode && (
        <div className="fixed bottom-4 left-4 z-50">
          <button onClick={resetLeague} className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white p-2 border border-red-900 transition-all text-xs">איפוס ליגה (סכנה!)</button>
        </div>
      )}

      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-[var(--street-orange)] text-black font-black px-8 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-bounce">
          <Icon name="check" size={20} />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}