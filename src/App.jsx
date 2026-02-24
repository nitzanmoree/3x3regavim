import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, writeBatch, addDoc } from 'firebase/firestore';

// --- ICONS SETUP ---
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
    alertCircle: 'alert-circle',
    userPlus: 'user-plus',
    clipboard: 'clipboard-list',
    lock: 'lock',
    award: 'award'
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

// --- CSS STYLES (Street Art & Mature UI) ---
const customStyles = `
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700;900&family=Karantina:wght@400;700&display=swap');

:root {
  --street-orange: #ff5722;
  --street-orange-dark: #e64a19;
  --street-yellow: #ffb300;
  --dark-asphalt: #0f0f0f;
  --concrete: #1e1e1e;
}

body {
  background-color: var(--dark-asphalt);
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(255, 87, 34, 0.05) 0%, transparent 40%),
    url("https://www.transparenttextures.com/patterns/asphalt.png");
  color: #fff;
  font-family: 'Heebo', sans-serif;
  direction: rtl;
  overflow-x: hidden;
}

.font-stencil { 
  font-family: 'Karantina', system-ui; 
  letter-spacing: 2px;
}

/* Header Graffiti Style */
.header-graffiti {
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(15,15,15,1)),
              url("https://www.transparenttextures.com/patterns/concrete-wall-2.png");
  border-bottom: 3px solid #222;
  position: relative;
  overflow: hidden;
}

.graffiti-text {
  text-shadow: 
    3px 3px 0px var(--street-orange),
    -1px -1px 0px #fff,
    6px 6px 12px rgba(0,0,0,0.8);
  filter: drop-shadow(0 0 10px rgba(255, 87, 34, 0.3));
}

.splatter {
  position: absolute;
  pointer-events: none;
  opacity: 0.15;
}

/* Refined Cards */
.street-card {
  background: var(--concrete);
  border: 1px solid #333;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  transition: all 0.3s ease;
}

.street-card:hover {
  border-color: var(--street-orange);
  transform: translateY(-4px);
}

.tape {
  background: #1a1a1a;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: 0.3s;
  cursor: pointer;
}
.tape.active {
  color: var(--street-orange);
  border-bottom: 2px solid var(--street-orange);
  background: rgba(255, 87, 34, 0.05);
}

/* Hall of Fame Gold */
.gold-card {
  background: linear-gradient(135deg, #151515 0%, #222 100%);
  border: 1px solid var(--street-yellow);
  box-shadow: 0 0 25px rgba(255, 179, 0, 0.1);
}

/* Rules Style - The one you liked */
.rule-block {
  border-right: 4px solid var(--street-orange);
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 1.5rem;
}

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
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
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [leagueStage, setLeagueStage] = useState('registration');
  const [leagueStartDate, setLeagueStartDate] = useState('');
  const [makeupDates, setMakeupDates] = useState('');
  
  // Form States (League Registration)
  const [regTeamName, setRegTeamName] = useState('');
  const [regPlayers, setRegPlayers] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    }, (err) => console.error(err));

    const unsubMatches = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (s) => {
      setMatches(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));

    const unsubHof = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hallOfFame'), (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setHallOfFame(data.sort((a, b) => b.year - a.year));
    }, (err) => console.error(err));

    const unsubPending = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registrationRequests'), (s) => {
      setPendingRegistrations(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));

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
    }, (err) => console.error(err));

    return () => { unsubTeams(); unsubMatches(); unsubHof(); unsubMeta(); unsubPending(); };
  }, [user]);

  // --- LOGIC: STANDINGS ---
  const standings = useMemo(() => {
    const stats = {};
    teams.forEach(t => stats[t.id] = { id: t.id, name: t.name, players: t.players, points: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 });
    
    matches.filter(m => m.isPlayed && m.type === 'regular').forEach(m => {
      const hId = m.homeTeam.id, aId = m.awayTeam.id;
      if (!stats[hId] || !stats[aId]) return;
      
      const hS = parseInt(m.homeScore) || 0;
      const aS = parseInt(m.awayScore) || 0;

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

    return Object.values(stats)
      .map(s => ({ ...s, diff: s.pf - s.pa }))
      .sort((a, b) => b.points - a.points || b.diff - a.diff);
  }, [teams, matches]);

  // --- ACTIONS ---
  const showMessage = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const toggleAdmin = () => isAdminMode ? setIsAdminMode(false) : setShowLoginModal(true);
  
  const handleLogin = () => {
    if (adminUser === 'אדמין' && adminPass === '010608') { 
      setIsAdminMode(true); setShowLoginModal(false); setAdminUser(''); setAdminPass(''); showMessage('ברוך הבא, מנהל');
    } else showMessage('פרטים שגויים');
  };

  const seedDatabase = async () => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    await batch.commit();
    setIsDBReady(true);
  };

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    if (leagueStage !== 'registration') return showMessage('הרישום לעונה זו סגור');
    const players = regPlayers.filter(p => p.trim());
    if (players.length < 3) return showMessage('מינימום 3 שחקנים לקבוצה');

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'registrationRequests'), {
        name: regTeamName,
        players: players,
        createdAt: Date.now()
      });
      showMessage('בקשת רישום נשלחה לאישור מנהל');
      setRegTeamName(''); setRegPlayers(['', '', '', '']);
      setActiveTab('standings');
    } catch (err) { showMessage('שגיאה בשליחת הבקשה'); }
    setIsSubmitting(false);
  };

  const approveRegistration = async (request) => {
    const batch = writeBatch(db);
    const newTeamId = 't_' + Date.now();
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'teams', newTeamId), { name: request.name, players: request.players });
    batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'registrationRequests', request.id));
    await batch.commit();
    showMessage(`הקבוצה ${request.name} אושרה לליגה!`);
  };

  const rejectRegistration = async (id) => {
    if (window.confirm('למחוק את בקשת הרישום?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registrationRequests', id));
      showMessage('הבקשה הוסרה');
    }
  };

  const updateScore = async (matchId, hS, aS) => {
    const h = parseInt(hS), a = parseInt(aS);
    if (isNaN(h) || isNaN(a)) return showMessage('הזן מספרים תקינים');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), { homeScore: h, awayScore: a, isPlayed: true });
    showMessage('תוצאה עודכנה בהצלחה');
  };

  const startFinalFour = async () => {
    const top4 = standings.slice(0, 4);
    if (top4.length < 4) return showMessage('צריך 4 קבוצות בטבלה לפיינל פור');
    const batch = writeBatch(db);
    const s1 = { id: 'ff_s1', roundName: 'חצי גמר (1-4)', roundIndex: 1000, homeTeam: top4[0], awayTeam: top4[3], homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: 'semi' };
    const s2 = { id: 'ff_s2', roundName: 'חצי גמר (2-3)', roundIndex: 1000, homeTeam: top4[1], awayTeam: top4[2], homeScore: '', awayScore: '', isPlayed: false, type: 'playoff', stage: 'semi' };
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', s1.id), s1);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', s2.id), s2);
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'playoff' });
    await batch.commit(); setActiveTab('playoffs');
  };

  const createFinals = async () => {
    const semis = matches.filter(m => m.type === 'playoff' && m.stage === 'semi' && m.isPlayed);
    if (semis.length < 2) return showMessage('עדכן תוצאות חצאי גמר קודם');
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
    const fm = matches.find(m => m.id === 'ff_final');
    if (!fm || !fm.isPlayed) return;
    const winner = fm.homeScore > fm.awayScore ? fm.homeTeam : fm.awayTeam;
    const winnerData = teams.find(t => t.id === winner.id) || winner;
    const playersStr = Array.isArray(winnerData.players) ? winnerData.players.join(', ') : '';
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hallOfFame', 'h_' + Date.now()), { year: newHofYear, teamName: winnerData.name, players: playersStr });
    showMessage(`${winnerData.name} נכנסה להיכל התהילה!`);
    setActiveTab('hallOfFame');
  };

  const resetSeasonOnly = async () => {
    if(!window.confirm('זה ינקה את העונה הנוכחית. היכל התהילה יישמר. להמשיך?')) return;
    const batch = writeBatch(db);
    matches.forEach(m => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'matches', m.id)));
    teams.forEach(t => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'teams', t.id)));
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    await batch.commit();
    showMessage('העונה אופסה. היכל התהילה נשמר!');
    setActiveTab('standings');
  };

  if (!isDBReady) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-stencil text-2xl animate-pulse">מחבר למגרש...</div>;

  const finalMatch = matches.find(m => m.id === 'ff_final');

  return (
    <div className="min-h-screen pb-20">
      <style>{customStyles}</style>

      {/* HEADER - STREET ART STYLE */}
      <header className="header-graffiti pt-20 pb-16 px-4 text-center">
        <svg className="splatter top-4 left-10 w-24 h-24" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="var(--street-orange)" filter="blur(20px)"/></svg>
        <svg className="splatter bottom-0 right-20 w-40 h-40" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="var(--street-orange)" filter="blur(30px)"/></svg>
        
        <div className="relative z-10">
          <div className="inline-block border-y-4 border-white py-2 px-8 mb-4">
            <h1 className="font-stencil text-7xl md:text-9xl text-white uppercase graffiti-text leading-tight">
              סטריטבול <span className="text-[var(--street-orange)]">רגבים</span>
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-px w-12 bg-neutral-700"></div>
            <span className="bg-white text-black font-black px-4 py-0.5 tracking-widest uppercase text-sm">3x3 Pro League</span>
            <div className="h-px w-12 bg-neutral-700"></div>
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="max-w-6xl mx-auto sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-neutral-800 flex flex-wrap justify-center shadow-xl">
        {[
          { id: 'standings', l: 'טבלה', i: 'award' },
          { id: 'schedule', l: 'לוח משחקים', i: 'calendar-days' },
          { id: 'playoffs', l: 'פיינל פור', i: 'trophy' },
          { id: 'teams', l: 'קבוצות', i: 'users' },
          { id: 'registration', l: 'רישום', i: 'userPlus' },
          { id: 'hallOfFame', l: 'היכל התהילה', i: 'crown' },
          { id: 'leagueRules', l: 'כללים', i: 'info' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tape px-5 py-4 font-bold text-base flex items-center gap-2 ${activeTab === t.id ? 'active' : ''}`}>
            <Icon name={t.i} size={16} /> {t.l}
          </button>
        ))}
        <button onClick={toggleAdmin} className="px-6 py-4 text-neutral-500 hover:text-white flex items-center gap-2 border-l border-neutral-800 transition-colors">
          <Icon name="settings" size={16} /> {isAdminMode ? 'יציאה' : 'מנהל'}
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-4 mt-10">
        
        {/* STANDINGS */}
        {activeTab === 'standings' && (
          <div className="animate-fade-in">
            <div className="flex items-baseline justify-between mb-6 border-b border-neutral-800 pb-2">
               <h2 className="text-4xl font-stencil text-white tracking-widest">דירוג הקבוצות</h2>
               <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Regular Season Stats</span>
            </div>
            <div className="street-card overflow-hidden rounded-lg">
              <table className="w-full text-right">
                <thead className="bg-[#1a1a1a] border-b border-neutral-800 font-bold text-neutral-400 text-xs uppercase tracking-widest">
                  <tr><th className="p-5">#</th><th className="p-5">קבוצה</th><th className="p-5 text-center">נק'</th><th className="p-5 text-center">נצ'</th><th className="p-5 text-center">הפ'</th><th className="p-5 text-center">הפרש סלים</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {standings.map((t, i) => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors font-bold group">
                      <td className="p-5"><span className={`w-8 h-8 flex items-center justify-center rounded ${i === 0 ? 'bg-[var(--street-orange)] text-white' : i < 4 ? 'bg-neutral-800 text-white' : 'text-neutral-600'}`}>{i+1}</span></td>
                      <td className="p-5 text-lg group-hover:text-[var(--street-orange)] transition-colors">{t.name}</td>
                      <td className="p-5 text-center font-black text-[var(--street-orange)] text-2xl">{t.points}</td>
                      <td className="p-5 text-center">{t.wins}</td>
                      <td className="p-5 text-center">{t.losses}</td>
                      <td className={`p-5 text-center font-black text-lg ${t.diff > 0 ? 'text-green-500' : t.diff < 0 ? 'text-red-500' : 'text-neutral-500'}`} dir="ltr">{t.diff > 0 ? `+${t.diff}` : t.diff}</td>
                    </tr>
                  ))}
                  {standings.length === 0 && <tr><td colSpan="6" className="p-20 text-center text-neutral-600 font-bold">הליגה ממתינה לאישור הקבוצות הראשונות.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REGISTRATION */}
        {activeTab === 'registration' && (
          <div className="animate-fade-in max-w-xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-5xl font-stencil text-white tracking-widest mb-2">הרשמה לעונה</h2>
              <p className="text-neutral-500 font-bold uppercase tracking-wider">{leagueStage === 'registration' ? "הצטרפו לזירה עכשיו" : "ההרשמה סגורה כרגע"}</p>
            </div>
            {leagueStage === 'registration' ? (
              <div className="street-card p-10 relative">
                <form onSubmit={handleRegisterTeam} className="space-y-6">
                  <div>
                    <label className="block text-white font-black text-xs uppercase mb-2">שם הקבוצה</label>
                    <input required type="text" value={regTeamName} onChange={e=>setRegTeamName(e.target.value)} className="w-full bg-[#0a0a0a] border border-neutral-800 p-4 text-white font-bold focus:border-[var(--street-orange)] outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-white font-black text-xs uppercase">סגל שחקנים (שם מלא)</label>
                    {['קפטן', 'שחקן 2', 'שחקן 3', 'מחליף'].map((label, i) => (
                      <input key={i} required={i < 3} type="text" value={regPlayers[i]} placeholder={label} onChange={e=>{const up=[...regPlayers];up[i]=e.target.value;setRegPlayers(up);}} className="w-full bg-[#0a0a0a] border-b border-neutral-800 p-3 text-white font-bold outline-none focus:border-[var(--street-orange)]" />
                    ))}
                  </div>
                  <button disabled={isSubmitting} type="submit" className="w-full bg-[var(--street-orange)] text-black font-black py-5 uppercase hover:bg-white transition-all tracking-widest text-xl">{isSubmitting ? 'שולח...' : 'הירשם לליגה'}</button>
                </form>
              </div>
            ) : (
              <div className="street-card p-12 text-center border-dashed opacity-60">
                <Icon name="lock" size={60} className="mx-auto mb-6 text-neutral-600" />
                <h4 className="text-2xl font-bold mb-2">ההרשמה הסתיימה</h4>
                <p className="text-neutral-500">העונה כבר בעיצומה. נתראה במחזור הבא!</p>
              </div>
            )}
          </div>
        )}

        {/* LEAGUE RULES - REVERTED TO PREVIOUS DESIGN */}
        {activeTab === 'leagueRules' && (
          <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-10">
               <h2 className="text-5xl font-stencil text-white tracking-widest uppercase">תקנון הליגה</h2>
               <div className="bg-[var(--street-orange)] h-1 w-20 mx-auto mt-4"></div>
            </div>
            
            <div className="rule-block">
              <h3 className="text-xl font-bold text-[var(--street-orange)] mb-2">הקדמה - רגבים 3 על 3</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">ליגת סטריטבול רגבים הוקמה כדי לייצר זירה תחרותית וקהילתית עבור חובבי הכדורסל. אנו שומרים על רוח המשחק והגינות ספורטיבית מעל הכל.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rule-block">
                <h4 className="text-white font-bold mb-2">סגל ורישום</h4>
                <ul className="text-neutral-400 text-xs space-y-2">
                  <li>• עד 4 שחקנים בקבוצה (3+1).</li>
                  <li>• גילאי 16 ומעלה בלבד.</li>
                  <li>• יש לרשום שם פרטי ושם משפחה מדויק.</li>
                </ul>
              </div>
              <div className="rule-block">
                <h4 className="text-white font-bold mb-2">חוקי המשחק</h4>
                <ul className="text-neutral-400 text-xs space-y-2">
                  <li>• משך משחק: 20 דקות (זמן רץ).</li>
                  <li>• שוויון: תוספת הארכה של 4 דקות.</li>
                  <li>• קבוצה שקלעה מוציאה כדור (Make it Take it).</li>
                </ul>
              </div>
              <div className="rule-block">
                <h4 className="text-white font-bold mb-2">שיטת הניקוד</h4>
                <ul className="text-neutral-400 text-xs space-y-2">
                  <li>• קליעה מחוץ לקשת = 3 נקודות.</li>
                  <li>• קליעה בתוך הקשת = 2 נקודות.</li>
                  <li>• אין זריקות עונשין.</li>
                </ul>
              </div>
              <div className="rule-block">
                <h4 className="text-white font-bold mb-2">דירוג וטבלה</h4>
                <ul className="text-neutral-400 text-xs space-y-2">
                  <li>• ניצחון = 2 נק', הפסד = 1 נק'.</li>
                  <li>• הפרש סלים קובע שוויון נקודות.</li>
                  <li>• 4 הראשונות עולות לפיינל פור.</li>
                </ul>
              </div>
            </div>
            
            <div className="rule-block border-none bg-orange-600/10 rounded-lg">
               <h4 className="text-[var(--street-orange)] font-bold mb-2">חובת דיווח</h4>
               <p className="text-neutral-300 text-xs">לאחר כל משחק, קפטני הקבוצות מחויבים לעדכן את התוצאה באפליקציה באופן מיידי.</p>
            </div>
          </div>
        )}

        {/* HALL OF FAME */}
        {activeTab === 'hallOfFame' && (
          <div className="animate-fade-in space-y-12">
            <div className="text-center">
               <div className="inline-block p-4 border-2 border-[var(--street-yellow)] rounded-full mb-4">
                 <Icon name="crown" size={48} className="text-[var(--street-yellow)]" />
               </div>
               <h2 className="text-6xl font-stencil text-white tracking-[0.2em] uppercase">היכל התהילה</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hallOfFame.map((w) => (
                <div key={w.id} className="gold-card p-10 text-center relative group overflow-hidden">
                  {isAdminMode && <button onClick={()=>deleteHof(w.id)} className="absolute top-4 left-4 text-neutral-700 hover:text-red-500"><Icon name="x" size={18}/></button>}
                  <div className="text-[var(--street-yellow)] font-stencil text-4xl mb-4">{w.year}</div>
                  <h3 className="text-5xl font-stencil text-white uppercase tracking-widest mb-6 group-hover:scale-110 transition-transform">{w.teamName}</h3>
                  <div className="bg-black/50 py-3 px-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{w.players}</div>
                </div>
              ))}
              {hallOfFame.length === 0 && <div className="col-span-full py-20 text-center text-neutral-700 font-stencil text-2xl uppercase border-2 border-dashed border-neutral-900 rounded-xl">ההיסטוריה טרם נכתבה</div>}
            </div>
          </div>
        )}

        {/* TEAMS */}
        {activeTab === 'teams' && (
          <div className="animate-fade-in space-y-10">
            {isAdminMode && pendingRegistrations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-[var(--street-yellow)] uppercase tracking-widest">בקשות רישום ({pendingRegistrations.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRegistrations.map(r => (
                    <div key={r.id} className="street-card p-5 flex justify-between items-center bg-black border-[var(--street-yellow)]">
                      <div>
                        <h4 className="text-white font-bold text-lg">{r.name}</h4>
                        <p className="text-neutral-500 text-xs">{r.players.join(', ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>approveRegistration(r)} className="bg-green-600 p-2 rounded hover:bg-green-500 transition-colors"><Icon name="check" size={20} className="text-white"/></button>
                        <button onClick={()=>rejectRegistration(r.id)} className="bg-red-600 p-2 rounded hover:bg-red-500 transition-colors"><Icon name="x" size={20} className="text-white"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h3 className="text-3xl font-stencil text-white tracking-widest uppercase">קבוצות מאושרות</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teams.map(t => (
                <div key={t.id} className="street-card overflow-hidden">
                  <div className="bg-neutral-900 p-6 text-center border-b border-neutral-800">
                    <h3 className="font-stencil text-4xl text-white uppercase tracking-tighter">{t.name}</h3>
                  </div>
                  <div className="p-6 bg-black/40 space-y-3 font-bold text-sm text-neutral-400">
                    {t.players?.map((p, i) => <div key={i} className="flex gap-3 items-center opacity-80"><span className="text-[var(--street-orange)] font-stencil text-lg">#{i+1}</span> {p}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCHEDULE & PLAYOFFS (Standard Logic preserved) */}
        {activeTab === 'schedule' && (
           <div className="animate-fade-in space-y-8 text-right">
             <h2 className="text-4xl font-stencil text-[var(--street-orange)] tracking-widest uppercase border-b border-neutral-800 pb-2">לוח המשחקים</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.filter(m=>m.type==='regular').sort((a,b)=>a.roundIndex-b.roundIndex).map(m => (
                  <div key={m.id} className={`street-card p-6 ${m.isPlayed ? 'opacity-40 border-neutral-800' : 'border-[var(--street-orange)]'}`}>
                    <div className="text-[10px] font-black text-neutral-600 mb-2 uppercase">{m.roundName} | {m.roundDates}</div>
                    <div className="flex justify-between items-center text-center font-bold">
                      <div className="flex-1 text-white uppercase">{m.homeTeam.name}</div>
                      <div className="px-4">
                        {m.isPlayed ? <div className="text-2xl font-black text-[var(--street-orange)]">{m.homeScore}-{m.awayScore}</div> : <span className="font-stencil text-2xl text-neutral-800">VS</span>}
                      </div>
                      <div className="flex-1 text-white uppercase">{m.awayTeam.name}</div>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        )}

        {activeTab === 'playoffs' && (
           <div className="animate-fade-in space-y-12">
             <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
               <h2 className="text-4xl font-stencil text-[var(--street-yellow)] tracking-widest uppercase">שלב הפיינל פור</h2>
               <div className="flex gap-2">
                 {isAdminMode && leagueStage === 'regular' && <button onClick={startFinalFour} className="bg-white text-black px-5 py-2 font-black text-xs uppercase hover:bg-[var(--street-orange)] transition-colors">הפעל פיינל פור</button>}
                 {isAdminMode && leagueStage === 'playoff' && matches.filter(m=>m.type==='playoff'&&m.stage==='semi'&&m.isPlayed).length===2 && !matches.find(m=>m.stage==='final') && <button onClick={createFinals} className="bg-[var(--street-yellow)] text-black px-5 py-2 font-black text-xs uppercase">צור משחקי הכרעה</button>}
               </div>
             </div>

             {finalMatch?.isPlayed && isAdminMode && (
               <div className="street-card p-8 text-center border-[var(--street-yellow)] border-2">
                  <Icon name="crown" size={60} className="text-[var(--street-yellow)] mx-auto mb-4" />
                  <h3 className="text-3xl font-stencil text-white mb-6 tracking-widest">יש אלופה! הכתר והעלה להיכל</h3>
                  <div className="flex justify-center items-center gap-4">
                    <input type="text" value={newHofYear} onChange={e=>setNewHofYear(e.target.value)} className="bg-black border border-neutral-700 p-2 text-white w-24 text-center font-bold" />
                    <button onClick={promoteToHof} className="bg-[var(--street-yellow)] text-black font-black px-10 py-3 uppercase hover:bg-white transition-all shadow-xl">הכתרה רשמית</button>
                  </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {matches.filter(m=>m.type==='playoff').sort((a,b)=>a.roundIndex-b.roundIndex).map(m => (
                  <div key={m.id} className={`street-card p-10 ${m.stage === 'final' ? 'border-[var(--street-yellow)] border-2 shadow-[0_0_40px_rgba(255,179,0,0.15)]' : 'border-neutral-800'}`}>
                    <div className="text-[10px] font-black text-neutral-600 mb-4 uppercase text-center">{m.roundName}</div>
                    <div className="flex justify-between items-center text-center">
                      <div className="flex-1 font-black text-2xl text-white">{m.homeTeam.name}</div>
                      <div className="px-6">
                        {m.isPlayed ? <div className="text-5xl font-black text-[var(--street-yellow)]">{m.homeScore}-{m.awayScore}</div> : <span className="font-stencil text-4xl text-neutral-800">VS</span>}
                      </div>
                      <div className="flex-1 font-black text-2xl text-white">{m.awayTeam.name}</div>
                    </div>
                    {!m.isPlayed && (
                      <div className="mt-8 pt-8 border-t border-neutral-800 flex justify-center items-center gap-4">
                        <input type="number" id={`h_${m.id}`} className="w-20 h-14 bg-black border-b-2 border-neutral-800 text-center text-4xl font-black text-white outline-none focus:border-[var(--street-orange)]" placeholder="0" />
                        <button onClick={() => updateScore(m.id, document.getElementById(`h_${m.id}`).value, document.getElementById(`a_${m.id}`).value)} className="bg-[var(--street-orange)] text-black font-black px-8 py-3 uppercase hover:bg-white transition-colors">עדכן</button>
                        <input type="number" id={`a_${m.id}`} className="w-20 h-14 bg-black border-b-2 border-neutral-800 text-center text-4xl font-black text-white outline-none focus:border-[var(--street-orange)]" placeholder="0" />
                      </div>
                    )}
                  </div>
                ))}
             </div>
           </div>
        )}
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 p-12 max-w-sm w-full shadow-2xl relative">
             <button onClick={()=>setShowLoginModal(false)} className="absolute top-6 left-6 text-neutral-600 hover:text-white"><Icon name="x" size={24}/></button>
            <h3 className="text-4xl font-stencil text-white mb-10 text-center tracking-widest uppercase">Admin Entry</h3>
            <div className="space-y-6 mb-10">
              <input type="text" placeholder="Username" value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="w-full bg-black border border-neutral-800 p-4 text-white font-bold" />
              <input type="password" placeholder="Password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} className="w-full bg-black border border-neutral-800 p-4 text-white font-bold" dir="ltr" />
            </div>
            <button onClick={handleLogin} className="w-full bg-[var(--street-orange)] text-black font-black py-5 uppercase hover:bg-white transition-colors tracking-widest text-xl">Login</button>
          </div>
        </div>
      )}

      {/* ADMIN CONTROL PANEL - RESET SEASON */}
      {isAdminMode && (
        <div className="fixed bottom-4 left-4 z-50 flex gap-2">
           <button onClick={resetSeasonOnly} className="bg-red-900/40 hover:bg-red-600 text-red-500 hover:text-white p-2 border border-red-900 transition-all text-[10px] font-black px-4 flex items-center gap-2 rounded uppercase tracking-widest shadow-xl">
            <Icon name="history" size={14} /> Reset Current Season
          </button>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-[var(--street-orange)] text-black font-black px-10 py-5 shadow-2xl animate-bounce flex items-center gap-4 text-lg border-2 border-white/20">
          <Icon name="check" size={24} />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}