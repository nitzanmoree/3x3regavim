import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
    medal: 'medal',
    crown: 'crown',
    star: 'star',
    history: 'history',
    info: 'info',
    clock: 'clock',
    alertCircle: 'alert-circle'
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
.gold-card {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 2px solid var(--street-yellow);
  box-shadow: 0 0 20px rgba(255, 179, 0, 0.3);
  position: relative;
  overflow: hidden;
}
.gold-card::after {
  content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.05) 50%, transparent 55%);
  background-size: 200% 200%; animation: shine 3s infinite; pointer-events: none;
}
@keyframes shine { 0% { background-position: -100% -100%; } 100% { background-position: 100% 100%; } }

.rule-item {
  border-right: 4px solid var(--street-orange);
  padding-right: 1.5rem;
  background: rgba(255,255,255,0.02);
}
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
  const [hallOfFame, setHallOfFame] = useState([]);
  const [leagueStage, setLeagueStage] = useState('registration');
  const [leagueStartDate, setLeagueStartDate] = useState('');
  const [makeupDates, setMakeupDates] = useState('');
  
  // Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayers, setNewPlayers] = useState(['', '', '', '']);
  const [newHofYear, setNewHofYear] = useState(new Date().getFullYear().toString());

  // --- BROWSER TITLE & AUTH ---
  useEffect(() => {
    document.title = "StreetBall Regavim";
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- FIREBASE SYNC ---
  useEffect(() => {
    if (!user) return;

    const unsubTeams = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), (s) => {
      setTeams(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMatches = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (s) => {
      setMatches(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubHof = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hallOfFame'), (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setHallOfFame(data.sort((a, b) => b.year - a.year));
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

    return () => { unsubTeams(); unsubMatches(); unsubHof(); unsubMeta(); };
  }, [user]);

  // --- LOGIC: STANDINGS ---
  const standings = useMemo(() => {
    const stats = {};
    teams.forEach(t => stats[t.id] = { id: t.id, name: t.name, players: t.players, points: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 });
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

  // --- ACTIONS ---
  const showMessage = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const toggleAdmin = () => isAdminMode ? setIsAdminMode(false) : setShowLoginModal(true);
  
  const handleLogin = () => {
    if (adminUser === 'אדמין' && adminPass === '010608') { 
      setIsAdminMode(true); setShowLoginModal(false); setAdminUser(''); setAdminPass(''); showMessage('ברוך הבא מנהל');
    } else showMessage('פרטים שגויים');
  };

  const seedDatabase = async () => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    await batch.commit();
    setIsDBReady(true);
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return showMessage('הזן שם קבוצה');
    const validPlayers = newPlayers.filter(p => p.trim());
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', 't_' + Date.now()), { name: newTeamName, players: validPlayers });
    setNewTeamName(''); setNewPlayers(['','','','']); showMessage('קבוצה נוספה');
  };

  const updateScore = async (matchId, hS, aS) => {
    const h = parseInt(hS), a = parseInt(aS);
    if (isNaN(h) || isNaN(a)) return showMessage('הזן מספרים');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), { homeScore: h, awayScore: a, isPlayed: true });
    showMessage('תוצאה עודכנה');
  };

  const startFinalFour = async () => {
    const top4 = standings.slice(0, 4);
    if (top4.length < 4) return showMessage('צריך 4 קבוצות בטבלה');
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
    if (semis.length < 2) return showMessage('סיים חצאי גמר קודם');
    const s1 = semis.find(m => m.id === 'ff_s1'), s2 = semis.find(m => m.id === 'ff_s2');
    const winner1 = s1.homeScore > s1.awayScore ? s1.homeTeam : s1.awayTeam;
    const loser1 = s1.homeScore > s1.awayScore ? s1.awayTeam : s1.homeTeam;
    const winner2 = s2.homeScore > s2.awayScore ? s2.homeTeam : s2.awayTeam;
    const loser2 = s2.homeScore > s2.awayScore ? s2.awayTeam : s2.homeTeam;
    const batch = writeBatch(db);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', 'ff_final'), { id: 'ff_final', roundName: 'הגמר הגדול', roundIndex: 1002, homeTeam: winner1, awayTeam: winner2, homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: 'final' });
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', 'ff_3rd'), { id: 'ff_3rd', roundName: 'מקום 3-4', roundIndex: 1001, homeTeam: loser1, awayTeam: loser2, homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: '3rd' });
    await batch.commit();
  };

  const promoteToHof = async () => {
    const finalMatch = matches.find(m => m.id === 'ff_final');
    if (!finalMatch || !finalMatch.isPlayed) return;
    const winner = finalMatch.homeScore > finalMatch.awayScore ? finalMatch.homeTeam : finalMatch.awayTeam;
    const winnerData = teams.find(t => t.id === winner.id) || winner;
    const playersStr = Array.isArray(winnerData.players) ? winnerData.players.join(', ') : '';

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hallOfFame', 'h_' + Date.now()), {
      year: newHofYear,
      teamName: winnerData.name,
      players: playersStr
    });
    
    showMessage(`היסטוריה! ${winnerData.name} עלתה להיכל התהילה!`);
    setActiveTab('hallOfFame');
  };

  const deleteHof = async (id) => {
    if (window.confirm('למחוק מהיכל התהילה?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hallOfFame', id));
  };

  const resetSeasonOnly = async () => {
    if(!window.confirm('אזהרה: פעולה זו תמחק את כל הקבוצות והמשחקים של העונה הנוכחית כדי להתחיל עונה חדשה. היכל התהילה יישאר ללא שינוי. להמשיך?')) return;
    const batch = writeBatch(db);
    matches.forEach(m => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'matches', m.id)));
    teams.forEach(t => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'teams', t.id)));
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    await batch.commit();
    showMessage('העונה אופסה בהצלחה. היכל התהילה נשמר!');
    setActiveTab('standings');
  };

  if (!isDBReady) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-stencil text-2xl">טוען...</div>;

  const finalMatch = matches.find(m => m.id === 'ff_final');

  return (
    <div className="min-h-screen pb-20">
      <style>{customStyles}</style>
      <header className="pt-16 pb-12 bg-black border-b border-neutral-800 text-center relative">
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
          { id: 'hallOfFame', l: 'היכל התהילה' },
          { id: 'leagueRules', l: 'כללי הליגה' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tape px-6 py-4 font-bold text-lg ${activeTab === t.id ? 'active' : ''}`}>{t.l}</button>
        ))}
        <button onClick={toggleAdmin} className="px-6 py-4 text-neutral-500 hover:text-white flex items-center gap-2 border-l border-neutral-800 transition-colors">
          <Icon name="settings" size={16} /> {isAdminMode ? 'יציאה' : 'מנהל'}
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-4 mt-8">
        {/* LEAGUE RULES */}
        {activeTab === 'leagueRules' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Icon name="info" size={48} className="text-[var(--street-orange)] mb-4" />
              <h2 className="text-5xl font-stencil text-white tracking-widest uppercase">כללי הליגה</h2>
              <div className="h-1 w-24 bg-[var(--street-orange)] mx-auto mt-4"></div>
            </div>

            <div className="street-card p-8 space-y-6">
              <div className="rule-item">
                <h4 className="text-xl font-bold text-[var(--street-orange)] mb-2">הקדמה</h4>
                <p className="text-neutral-300 leading-relaxed">ברוכים הבאים לליגת הסטריטבול של רגבים 3 על 3. הליגה הוקמה במטרה לקדם את תרבות הכדורסל הקהילתית והתחרותית במגרש הביתי שלנו. אנו מצפים למשחק הוגן, ספורטיבי ומכבד בין כל המשתתפים.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rule-item">
                  <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Icon name="users" size={18} className="text-[var(--street-orange)]" /> רישום וסגל
                  </h4>
                  <ul className="text-neutral-400 text-sm space-y-2">
                    <li>• כל קבוצה רשאית לרשום עד 4 שחקנים בסגל.</li>
                    <li>• השתתפות בליגה מגילאי 16 ומעלה.</li>
                    <li>• בעת הרישום יש להזין שם פרטי ומשפחה מדויק.</li>
                  </ul>
                </div>

                <div className="rule-item">
                  <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Icon name="clock" size={18} className="text-[var(--street-orange)]" /> זמן ומהלך המשחק
                  </h4>
                  <ul className="text-neutral-400 text-sm space-y-2">
                    <li>• משך כל משחק: 20 דקות של זמן רץ.</li>
                    <li>• במקרה של שוויון: הארכה של 4 דקות נוספות.</li>
                    <li>• בכל שבוע ישוחק משחק מחזור אחד לכל קבוצה.</li>
                  </ul>
                </div>

                <div className="rule-item">
                  <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Icon name="star" size={18} className="text-[var(--street-orange)]" /> שיטת הניקוד וחוקים
                  </h4>
                  <ul className="text-neutral-400 text-sm space-y-2">
                    <li>• סל בתוך הקשת = 2 נקודות.</li>
                    <li>• סל מחוץ לקשת = 3 נקודות.</li>
                    <li>• אין זריקות עונשין.</li>
                    <li>• קבוצה שקלעה מתחילה את ההתקפה הבאה (Make it Take it).</li>
                  </ul>
                </div>

                <div className="rule-item">
                  <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Icon name="trophy" size={18} className="text-[var(--street-orange)]" /> טבלה ודירוג
                  </h4>
                  <ul className="text-neutral-400 text-sm space-y-2">
                    <li>• ניצחון = 2 נקודות | הפסד = 1 נקודה.</li>
                    <li>• שוויון בנקודות בטבלה יוכרע לפי הפרש סלים.</li>
                    <li>• 4 הראשונות בסוף העונה עולות לפיינל פור.</li>
                  </ul>
                </div>
              </div>

              <div className="rule-item border-none bg-orange-500/5 p-4 mt-8">
                <h4 className="text-lg font-bold text-[var(--street-orange)] mb-2 flex items-center gap-2">
                  <Icon name="alertCircle" size={18} /> חובת דיווח
                </h4>
                <p className="text-neutral-300 text-sm">לאחר כל משחק, קפטני הקבוצות מחויבים לעדכן את התוצאה באפליקציה באופן מיידי כדי לשמור על טבלה מעודכנת.</p>
              </div>
            </div>
          </div>
        )}

        {/* STANDINGS */}
        {activeTab === 'standings' && (
          <div className="street-card-light overflow-hidden rounded shadow-2xl animate-fade-in">
            <table className="w-full text-right">
              <thead className="bg-neutral-200 border-b-2 font-bold text-black">
                <tr><th className="p-4">מקום</th><th className="p-4">קבוצה</th><th className="p-4 text-center">נק'</th><th className="p-4 text-center">נצ'</th><th className="p-4 text-center">הפ'</th></tr>
              </thead>
              <tbody>
                {standings.map((t, i) => (
                  <tr key={t.id} className="border-b hover:bg-white transition-colors text-black">
                    <td className="p-4"><span className={`w-8 h-8 flex items-center justify-center rounded-sm font-bold ${i === 0 ? 'bg-[var(--street-orange)] text-white' : 'bg-neutral-800 text-white'}`}>{i+1}</span></td>
                    <td className="p-4 font-bold text-lg">{t.name}</td>
                    <td className="p-4 text-center font-black text-[var(--street-orange)] text-2xl">{t.points}</td>
                    <td className="p-4 text-center font-bold">{t.wins}</td>
                    <td className="p-4 text-center font-bold">{t.losses}</td>
                  </tr>
                ))}
                {standings.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-neutral-500 font-bold">אין נתונים בטבלה עדיין.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* PLAYOFFS */}
        {activeTab === 'playoffs' && (
           <div className="space-y-8 animate-fade-in">
           <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
             <h2 className="text-4xl font-stencil text-[var(--street-yellow)] uppercase tracking-widest">שלב הפיינל פור</h2>
             <div className="flex gap-3">
               {isAdminMode && leagueStage === 'regular' && <button onClick={startFinalFour} className="bg-white text-black px-6 py-2 font-black text-xs uppercase hover:bg-[var(--street-orange)] transition-colors">הפעל פיינל פור</button>}
               {isAdminMode && leagueStage === 'playoff' && matches.filter(m=>m.type==='playoff'&&m.stage==='semi'&&m.isPlayed).length===2 && !matches.find(m=>m.stage==='final') && <button onClick={createFinals} className="bg-[var(--street-yellow)] text-black px-6 py-2 font-black text-xs uppercase shadow-lg">צור משחקי הכרעה</button>}
             </div>
           </div>

           {finalMatch?.isPlayed && isAdminMode && (
             <div className="bg-neutral-900 border-2 border-[var(--street-yellow)] p-6 text-center mb-8 shadow-xl">
                <Icon name="crown" size={48} className="text-[var(--street-yellow)] mb-2" />
                <h3 className="text-2xl font-stencil text-white mb-4 uppercase">יש לנו אלופה!</h3>
                <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                  <div className="text-neutral-400 font-bold">שנת מחזור:</div>
                  <input type="text" value={newHofYear} onChange={e=>setNewHofYear(e.target.value)} className="bg-black border border-neutral-700 p-2 text-white w-24 text-center font-bold" />
                  <button onClick={promoteToHof} className="bg-[var(--street-yellow)] text-black font-black px-8 py-2 uppercase hover:bg-white transition-all">הכתר אלופה והעלה להיכל התהילה</button>
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {matches.filter(m=>m.type==='playoff').sort((a,b)=>a.roundIndex-b.roundIndex).map(m => (
                <div key={m.id} className={`street-card p-8 ${m.stage === 'final' ? 'border-[var(--street-yellow)] border-2 shadow-[0_0_30px_rgba(255,179,0,0.2)]' : 'border-neutral-700 opacity-90'}`}>
                  <div className={`text-xs font-black mb-4 uppercase tracking-widest ${m.stage === 'final' ? 'text-[var(--street-yellow)]' : 'text-neutral-500'}`}>{m.roundName}</div>
                  <div className="flex justify-between items-center text-center">
                    <div className="flex-1 font-black text-2xl uppercase tracking-tighter">{m.homeTeam.name}</div>
                    <div className="px-6">
                      {m.isPlayed ? <div className={`text-5xl font-black ${m.stage==='final'?'text-[var(--street-yellow)]':'text-[var(--street-orange)]'}`}>{m.homeScore} - {m.awayScore}</div> : <span className="font-stencil text-4xl text-neutral-800">VS</span>}
                    </div>
                    <div className="flex-1 font-black text-2xl uppercase tracking-tighter">{m.awayTeam.name}</div>
                  </div>
                  {!m.isPlayed && (
                    <div className="mt-8 flex justify-center items-center gap-4 border-t border-neutral-800 pt-6">
                      <input type="number" id={`h_${m.id}`} className="w-20 h-14 bg-black border-b-2 border-[var(--street-orange)] text-center text-4xl font-black text-white outline-none" placeholder="0" />
                      <button onClick={() => updateScore(m.id, document.getElementById(`h_${m.id}`).value, document.getElementById(`a_${m.id}`).value)} className="bg-[var(--street-orange)] text-black font-black px-8 py-3 uppercase hover:bg-white transition-colors">עדכן</button>
                      <input type="number" id={`a_${m.id}`} className="w-20 h-14 bg-black border-b-2 border-[var(--street-orange)] text-center text-4xl font-black text-white outline-none" placeholder="0" />
                    </div>
                  )}
                </div>
              ))}
              {matches.filter(m=>m.type==='playoff').length === 0 && <div className="col-span-full py-24 text-center text-neutral-600 font-stencil text-3xl border-2 border-dashed border-neutral-800 street-card uppercase tracking-widest">הפיינל פור טרם החל</div>}
           </div>
         </div>
        )}

        {activeTab === 'hallOfFame' && (
          <div className="space-y-12 animate-fade-in">
            <div className="text-center mb-12">
              <div className="inline-block p-4 border-4 border-[var(--street-yellow)] mb-6">
                <Icon name="crown" size={64} className="text-[var(--street-yellow)]" />
              </div>
              <h2 className="text-6xl font-stencil text-white tracking-[0.2em] uppercase">היכל התהילה</h2>
              <div className="bg-[var(--street-yellow)] text-black font-black px-6 py-1 inline-block mt-4 tracking-widest uppercase text-sm">Legendary Champions</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hallOfFame.map((winner) => (
                <div key={winner.id} className="gold-card p-10 rounded-lg text-center group transition-all hover:scale-105">
                  {isAdminMode && <button onClick={()=>deleteHof(winner.id)} className="absolute top-4 left-4 text-neutral-600 hover:text-red-500 z-10"><Icon name="x" size={18}/></button>}
                  <div className="text-[var(--street-yellow)] font-stencil text-4xl mb-2">{winner.year}</div>
                  <div className="w-16 h-1 bg-[var(--street-yellow)] opacity-30 mx-auto mb-8"></div>
                  <h3 className="text-5xl font-stencil text-white uppercase tracking-widest mb-6 group-hover:text-[var(--street-yellow)] transition-colors">{winner.teamName}</h3>
                  <div className="text-neutral-500 text-xs font-black leading-relaxed tracking-wider uppercase bg-black/40 py-3 px-4 rounded">
                    {winner.players}
                  </div>
                  <Icon name="medal" size={32} className="text-[var(--street-yellow)] opacity-10 absolute bottom-6 right-6" />
                </div>
              ))}
              {hallOfFame.length === 0 && <div className="col-span-full py-24 text-center text-neutral-600 font-stencil text-2xl border-2 border-dashed border-neutral-800 uppercase tracking-widest">ההיסטוריה טרם נכתבה</div>}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-10 animate-fade-in">
            <h2 className="text-4xl font-stencil text-[var(--street-orange)] border-b-2 border-neutral-800 pb-2 uppercase tracking-widest">העונה הסדירה</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.filter(m=>m.type==='regular').sort((a,b)=>a.roundIndex-b.roundIndex).map(m => (
                <div key={m.id} className={`street-card p-6 ${m.isPlayed ? 'opacity-50 border-neutral-800' : 'border-[var(--street-orange)]'}`}>
                  <div className="text-[10px] font-black text-neutral-500 mb-2 uppercase tracking-widest">{m.roundName} | {m.roundDates}</div>
                  <div className="flex justify-between items-center text-center">
                    <div className="flex-1 font-bold text-lg text-white uppercase">{m.homeTeam.name}</div>
                    <div className="px-4">
                      {m.isPlayed ? <div className="text-3xl font-black text-[var(--street-orange)]">{m.homeScore} - {m.awayScore}</div> : <span className="font-stencil text-2xl text-neutral-700">VS</span>}
                    </div>
                    <div className="flex-1 font-bold text-lg text-white uppercase">{m.awayTeam.name}</div>
                  </div>
                </div>
              ))}
              {matches.filter(m=>m.type==='regular').length === 0 && <div className="col-span-full py-20 text-center text-neutral-500 font-stencil text-2xl">לוח המשחקים טרם נוצר.</div>}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-8 animate-fade-in">
             {isAdminMode && leagueStage === 'registration' && (
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
                  <button onClick={handleAddTeam} className="bg-white text-black w-full font-black py-4 hover:bg-[var(--street-orange)] transition-colors uppercase tracking-widest">הוסף קבוצה</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teams.map(t => (
                <div key={t.id} className="street-card overflow-hidden group">
                  <div className="bg-neutral-900 p-8 text-center border-b-2 border-[var(--street-orange)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--street-orange)] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <h3 className="font-stencil text-4xl uppercase relative z-10 text-white tracking-widest">{t.name}</h3>
                  </div>
                  <div className="p-8 bg-black space-y-4">
                    {t.players?.map((p, i) => (
                      <div key={i} className="text-sm text-neutral-400 border-b border-neutral-900 pb-3 flex gap-4 font-black uppercase tracking-wider">
                        <span className="text-[var(--street-orange)]">#{i+1}</span> {p}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {teams.length === 0 && <div className="col-span-full py-20 text-center text-neutral-500 font-stencil text-2xl">אין קבוצות רשומות עדיין.</div>}
            </div>
          </div>
        )}
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border-2 border-[var(--street-orange)] p-12 max-w-sm w-full shadow-2xl relative">
             <button onClick={()=>setShowLoginModal(false)} className="absolute top-6 left-6 text-neutral-600 hover:text-white"><Icon name="x" size={24}/></button>
            <h3 className="text-4xl font-stencil text-[var(--street-orange)] mb-10 text-center tracking-widest uppercase">כניסת הנהלה</h3>
            <div className="space-y-6 mb-10">
              <input type="text" placeholder="שם משתמש" value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="w-full bg-black border border-neutral-800 p-4 text-white focus:border-[var(--street-orange)] outline-none font-bold text-lg" />
              <input type="password" placeholder="סיסמה" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} className="w-full bg-black border border-neutral-800 p-4 text-white focus:border-[var(--street-orange)] outline-none font-bold text-lg" dir="ltr" />
            </div>
            <button onClick={handleLogin} className="w-full bg-[var(--street-orange)] text-black font-black py-5 uppercase hover:bg-white transition-colors tracking-widest text-xl">התחבר למערכת</button>
          </div>
        </div>
      )}

      {/* ADMIN CONTROL FOR NEW SEASON RESET */}
      {isAdminMode && (
        <div className="fixed bottom-4 left-4 z-50 flex gap-2">
           <button 
            onClick={resetSeasonOnly} 
            className="bg-red-900/40 hover:bg-red-600 text-red-500 hover:text-white p-2 border border-red-900 transition-all text-xs font-bold px-4 flex items-center gap-2"
          >
            <Icon name="history" size={14} /> התחל עונה חדשה (נקה ליגה)
          </button>
        </div>
      )}

      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-[var(--street-orange)] text-black font-black px-10 py-5 shadow-2xl animate-bounce flex items-center gap-4 text-lg">
          <Icon name="check" size={24} />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}