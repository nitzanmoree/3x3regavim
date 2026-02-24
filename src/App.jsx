import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, writeBatch, addDoc } from 'firebase/firestore';

// --- ICONS SETUP ---
const Icon = ({ name, size = 24, className = '', color = 'ffffff' }) => {
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
    award: 'award',
    shirt: 'shirt',
    menu: 'menu',
    chevronDown: 'chevron-down',
    zap: 'zap',
    logOut: 'log-out',
    rocket: 'rocket'
  };
  
  const cleanColor = color.replace('#', '');
  
  return (
    <img 
      src={`https://api.iconify.design/lucide:${iconMap[name] || name}.svg?color=%23${cleanColor}`} 
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

:root {
  --street-orange: #ff5722;
  --street-orange-dark: #bf360c;
  --street-yellow: #ffb300;
  --bg-dark: #0a0a0a;
  --card-bg: #141414;
}

body {
  background-color: var(--bg-dark);
  background-image: 
    url("https://www.transparenttextures.com/patterns/concrete-wall-2.png"),
    radial-gradient(circle at 0% 0%, rgba(255, 87, 34, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(255, 179, 0, 0.05) 0%, transparent 50%);
  background-attachment: fixed;
  color: #ffffff;
  font-family: 'Heebo', sans-serif;
  direction: rtl;
  overflow-x: hidden;
}

.font-stencil { 
  font-family: 'Karantina', system-ui; 
  letter-spacing: 2px;
}

.header-area {
  width: 100%;
  padding: 4rem 1rem;
  overflow: hidden;
  position: relative;
  background: #000;
  border-bottom: 5px solid var(--street-orange);
  text-align: center;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.header-image-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
  z-index: 1;
}

.title-box {
  display: inline-block;
  padding: 1rem 2rem;
  background: rgba(0,0,0,0.85);
  border: 4px solid #ffffff;
  box-shadow: 12px 12px 0px var(--street-orange);
  transform: rotate(-1.5deg);
  position: relative;
  z-index: 10;
}

.graffiti-main {
  font-size: 5.5rem;
  line-height: 0.85;
  text-transform: uppercase;
  color: #ffffff;
  text-shadow: 2px 2px 0px var(--street-orange);
}

@media (max-width: 768px) {
  .graffiti-main { font-size: 3.2rem; }
  .header-area { padding: 3rem 1rem 2rem; min-height: 200px; }
}

.nav-container {
  background: rgba(0,0,0,0.95);
  border-bottom: 2px solid #222;
  backdrop-filter: blur(10px);
}

.nav-link {
  color: #aaaaaa;
  font-weight: 900;
  padding: 1.2rem 1.5rem;
  text-transform: uppercase;
  transition: 0.3s;
  position: relative;
}

.nav-link.active {
  color: var(--street-orange);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--street-orange);
}

.street-card {
  background: var(--card-bg);
  border: 2px solid #222;
  transition: 0.2s ease-out;
}

.street-card:hover {
  border-color: var(--street-orange);
}

.tape-label {
  background: #000;
  color: var(--street-orange);
  padding: 4px 15px;
  font-family: 'Karantina';
  font-size: 1.4rem;
  display: inline-block;
  transform: rotate(1deg);
  margin-bottom: 1.2rem;
  border-left: 4px solid var(--street-orange);
}

.rule-strip {
  border-right: 6px solid var(--street-orange);
  padding: 1.5rem;
  background: rgba(255,255,255,0.03);
  margin-bottom: 2rem;
}

.gold-card {
  background: linear-gradient(135deg, #151515 0%, #222 100%);
  border: 2px solid var(--street-yellow);
}

.mobile-active-label {
  background: #000;
  padding: 0.5rem 1rem;
  border: 1px solid #333;
  color: var(--street-orange);
  font-family: 'Karantina';
  font-size: 1.6rem;
  letter-spacing: 1px;
}

.animate-in {
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.admin-launch-pad {
  background: linear-gradient(45deg, #1a1a1a, #000);
  border: 3px solid var(--street-yellow);
  box-shadow: 0 0 20px rgba(255, 179, 0, 0.2);
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [hallOfFame, setHallOfFame] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [leagueStage, setLeagueStage] = useState('registration');
  const [leagueStartDate, setLeagueStartDate] = useState('');
  const [makeupDates, setMakeupDates] = useState('');
  
  const [regTeamName, setRegTeamName] = useState('');
  const [regPlayers, setRegPlayers] = useState([
    { name: '', size: 'M' }, { name: '', size: 'M' }, { name: '', size: 'M' }, { name: '', size: 'M' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newHofYear, setNewHofYear] = useState(new Date().getFullYear().toString());
  const [manualHofTeam, setManualHofTeam] = useState('');
  const [manualHofPlayers, setManualHofPlayers] = useState('');

  const tabs = [
    { id: 'standings', l: 'טבלה', i: 'award' },
    { id: 'schedule', l: 'משחקים', i: 'calendar-days' },
    { id: 'playoffs', l: 'פיינל פור', i: 'trophy' },
    { id: 'teams', l: 'קבוצות', i: 'users' },
    { id: 'registration', l: 'רישום', i: 'userPlus' },
    { id: 'hallOfFame', l: 'היכל התהילה', i: 'crown' },
    { id: 'leagueRules', l: 'כללים', i: 'info' }
  ];

  useEffect(() => {
    document.title = "StreetBall Regavim";
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubTeams = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), (s) => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMatches = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (s) => setMatches(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubHof = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hallOfFame'), (s) => setHallOfFame(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.year - a.year)));
    const unsubPending = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registrationRequests'), (s) => setPendingRegistrations(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMeta = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), (ds) => {
      if (ds.exists()) {
        const d = ds.data();
        setLeagueStage(d.leagueStage || 'registration');
        setLeagueStartDate(d.leagueStartDate || '');
        setMakeupDates(d.makeupDates || '');
        setIsDBReady(true);
      } else { seedDatabase(); }
    });
    return () => { unsubTeams(); unsubMatches(); unsubHof(); unsubMeta(); unsubPending(); };
  }, [user]);

  const standings = useMemo(() => {
    const stats = {};
    teams.forEach(t => stats[t.id] = { id: t.id, name: t.name, points: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 });
    matches.filter(m => m.isPlayed && m.type === 'regular').forEach(m => {
      const hId = m.homeTeam.id, aId = m.awayTeam.id;
      if (!stats[hId] || !stats[aId]) return;
      const hS = parseInt(m.homeScore) || 0, aS = parseInt(m.awayScore) || 0;
      stats[hId].pf += hS; stats[hId].pa += aS; stats[aId].pf += aS; stats[aId].pa += hS;
      if (hS > aS) { stats[hId].wins += 1; stats[hId].points += 2; stats[aId].losses += 1; stats[aId].points += 1; }
      else { stats[aId].wins += 1; stats[aId].points += 2; stats[hId].losses += 1; stats[hId].points += 1; }
    });
    return Object.values(stats).map(s => ({ ...s, diff: s.pf - s.pa })).sort((a, b) => b.points - a.points || b.diff - a.diff);
  }, [teams, matches]);

  const shirtSummary = useMemo(() => {
    const summary = { 'S': 0, 'M': 0, 'L': 0, 'XL': 0, 'XXL': 0 };
    teams.forEach(t => t.players?.forEach(p => { if (p.size && summary[p.size] !== undefined) summary[p.size]++; }));
    return summary;
  }, [teams]);

  const showMessage = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const toggleAdmin = () => isAdminMode ? setIsAdminMode(false) : setShowLoginModal(true);
  
  const handleLogin = () => {
    if (adminUser === 'אדמין' && adminPass === '010608') { setIsAdminMode(true); setShowLoginModal(false); setAdminUser(''); setAdminPass(''); showMessage('ניהול מחובר'); }
    else showMessage('סיסמה שגויה');
  };

  const seedDatabase = async () => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    await batch.commit(); setIsDBReady(true);
  };

  const generateLeagueSchedule = async () => {
    if (teams.length < 2) return showMessage('צריך לפחות 2 קבוצות כדי להתחיל ליגה');
    if (!window.confirm(`האם להוציא את הליגה לדרך עם ${teams.length} קבוצות?`)) return;
    const batch = writeBatch(db);
    const teamList = [...teams];
    if (teamList.length % 2 !== 0) teamList.push({ id: 'bye', name: 'מנוחה' });
    const numTeams = teamList.length;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const startDate = new Date();
    for (let round = 0; round < numRounds; round++) {
      const roundDate = new Date(startDate);
      roundDate.setDate(startDate.getDate() + (round * 7));
      const dateStr = roundDate.toLocaleDateString('he-IL');
      for (let i = 0; i < matchesPerRound; i++) {
        const home = teamList[i];
        const away = teamList[numTeams - 1 - i];
        if (home.id !== 'bye' && away.id !== 'bye') {
          const matchId = `m_${round}_${i}`;
          batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), {
            homeTeam: home, awayTeam: away, homeScore: '', awayScore: '', isPlayed: false,
            roundName: `מחזור ${round + 1}`, roundDates: dateStr, roundIndex: round, type: 'regular'
          });
        }
      }
      teamList.splice(1, 0, teamList.pop());
    }
    const lastRoundDate = new Date(startDate);
    lastRoundDate.setDate(startDate.getDate() + (numRounds * 7));
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'regular', leagueStartDate: startDate.toISOString(), makeupDates: lastRoundDate.toLocaleDateString('he-IL') });
    await batch.commit();
    showMessage('הליגה יצאה לדרך!'); setActiveTab('schedule');
  };

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    if (leagueStage !== 'registration') return showMessage('ההרשמה סגורה');
    const validPlayers = regPlayers.filter(p => p.name.trim() !== '');
    if (validPlayers.length < 3) return showMessage('צריך לפחות 3 שחקנים');
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'registrationRequests'), { name: regTeamName, players: validPlayers, createdAt: Date.now() });
      showMessage('בקשת הרשמה נשלחה בהצלחה');
      setRegTeamName(''); setRegPlayers([{ name: '', size: 'M' }, { name: '', size: 'M' }, { name: '', size: 'M' }, { name: '', size: 'M' }]);
      setActiveTab('standings');
    } catch (err) { showMessage('שגיאה בשליחת הבקשה'); }
    setIsSubmitting(false);
  };

  const approveRegistration = async (request) => {
    const batch = writeBatch(db);
    const newTeamId = 't_' + Date.now();
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'teams', newTeamId), { name: request.name, players: request.players });
    batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'registrationRequests', request.id));
    await batch.commit(); showMessage(`קבוצת ${request.name} אושרה!`);
  };

  const updateScore = async (matchId, hS, aS) => {
    const h = parseInt(hS), a = parseInt(aS);
    if (isNaN(h) || isNaN(a)) return showMessage('ציון לא תקין');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), { homeScore: h, awayScore: a, isPlayed: true });
    showMessage('תוצאה עודכנה');
  };

  const promoteToHof = async () => {
    const fm = matches.find(m => m.id === 'ff_final');
    if (!fm || !fm.isPlayed) return;
    const winner = fm.homeScore > fm.awayScore ? fm.homeTeam : fm.awayTeam;
    const winnerData = teams.find(t => t.id === winner.id) || winner;
    const playersStr = Array.isArray(winnerData.players) ? winnerData.players.map(p => typeof p === 'object' ? p.name : p).join(', ') : '';
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hallOfFame', 'h_' + Date.now()), { year: newHofYear, teamName: winnerData.name, players: playersStr });
    showMessage(`${winnerData.name} הוכתרה כאלופה!`);
    setActiveTab('hallOfFame');
  };

  const addManualHof = async (e) => {
    e.preventDefault();
    if (!manualHofTeam.trim()) return showMessage('הזן שם קבוצה');
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hallOfFame', 'h_' + Date.now()), { 
      year: newHofYear, teamName: manualHofTeam, players: manualHofPlayers 
    });
    setManualHofTeam(''); setManualHofPlayers('');
    showMessage('נוסף להיכל התהילה');
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

  if (!isDBReady) return <div className="min-h-screen bg-black flex items-center justify-center text-[var(--street-orange)] font-stencil text-5xl animate-pulse uppercase">טוען...</div>;

  const finalMatch = matches.find(m => m.id === 'ff_final');
  const activeTabObj = tabs.find(t => t.id === activeTab);

  // Helper function to safely render players from any format
  const renderPlayersSafe = (playersData) => {
    if (typeof playersData === 'string') return playersData;
    if (Array.isArray(playersData)) {
      return playersData.map(p => typeof p === 'object' ? p.name : p).join(', ');
    }
    return '';
  };

  return (
    <div className="min-h-screen pb-20">
      <style>{customStyles}</style>

      {/* HEADER WITH TEXT & IMAGE OVERLAY */}
      <header className="header-area">
        <img 
          src="https://firebasestorage.googleapis.com/v0/b/streetballregavim.firebasestorage.app/o/headers%2F%D7%A1%D7%98%D7%A8%D7%99%D7%98%D7%91%D7%95%D7%9C%20%D7%A8%D7%92%D7%91%D7%99%D7%9D.jpg?alt=media" 
          alt="סטריטבול רגבים" 
          className="header-image-bg" 
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
        <div className="title-box">
          <h1 className="font-stencil graffiti-main">
            STREETBALL <span className="text-[var(--street-orange)]">REGAVIM</span>
          </h1>
        </div>
        <div className="mt-8 flex justify-center items-center gap-4 opacity-50 relative z-10">
          <div className="h-px w-12 bg-white"></div>
          <Icon name="zap" size={20} color="#ff5722" />
          <span className="font-stencil text-2xl uppercase tracking-[4px]">Elite 3x3 League</span>
          <Icon name="zap" size={20} color="#ff5722" />
          <div className="h-px w-12 bg-white"></div>
        </div>
      </header>

      {/* NAV */}
      <nav className="nav-container sticky top-0 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-0">
          
          <div className="md:hidden flex items-center gap-3">
             <div className="mobile-active-label">
                {activeTabObj?.l}
             </div>
          </div>

          <div className="hidden md:flex flex-1 justify-center">
            {tabs.map(t => (
              <button 
                key={t.id} onClick={() => setActiveTab(t.id)} 
                className={`nav-link ${activeTab === t.id ? 'active' : ''}`}
              >
                {t.l}
              </button>
            ))}
          </div>

          <div className="flex items-center">
            <button 
              onClick={toggleAdmin} 
              className="hidden md:flex md:border-r border-neutral-800 px-6 py-5 text-neutral-500 hover:text-[var(--street-orange)] transition-colors items-center gap-2 font-black text-xs uppercase"
            >
              <Icon name="settings" size={14} color="#666" /> {isAdminMode ? 'יציאה' : 'מנהל'}
            </button>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-4 bg-[#111] border-r border-neutral-800 flex items-center justify-center"
            >
              <Icon name={isMenuOpen ? "x" : "menu"} size={30} color="#ffffff" />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-black border-t border-neutral-800 animate-in p-2">
            <div className="grid grid-cols-1 gap-1">
              {tabs.map(t => (
                <button 
                  key={t.id} onClick={() => { setActiveTab(t.id); setIsMenuOpen(false); }} 
                  className={`flex items-center gap-4 p-4 font-black uppercase text-xl transition-all ${activeTab === t.id ? 'bg-neutral-900 text-[var(--street-orange)] border-r-4 border-[var(--street-orange)]' : 'text-neutral-500 border-r-4 border-transparent'}`}
                >
                  <Icon name={t.i} size={22} color={activeTab === t.id ? "#ff5722" : "#555"} />
                  {t.l}
                </button>
              ))}
              <div className="h-px bg-neutral-900 my-2"></div>
              <button 
                onClick={() => { toggleAdmin(); setIsMenuOpen(false); }} 
                className="flex items-center gap-4 p-4 font-black uppercase text-xl text-neutral-400"
              >
                <Icon name={isAdminMode ? "logOut" : "settings"} size={22} color="#888" />
                {isAdminMode ? 'יציאה מניהול' : 'כניסת מנהל'}
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto p-4 mt-8">
        
        {/* STANDINGS & ADMIN LAUNCH PAD */}
        {activeTab === 'standings' && (
          <div className="animate-in space-y-8">
            {isAdminMode && leagueStage === 'registration' && (
              <div className="admin-launch-pad p-8 rounded-lg text-center animate-pulse">
                <Icon name="rocket" size={48} color="#ffb300" className="mb-4 mx-auto" />
                <h3 className="text-3xl font-stencil text-white mb-2 uppercase">מוכנים להזניק את העונה?</h3>
                <p className="text-neutral-400 font-bold mb-6">ישנן {teams.length} קבוצות רשומות כרגע. לחיצה על הכפתור תבצע הגרלת לוח משחקים ותנעל את ההרשמה.</p>
                <button 
                  onClick={generateLeagueSchedule}
                  className="bg-[var(--street-yellow)] text-black font-black px-12 py-4 rounded uppercase text-xl hover:bg-white transition-all shadow-2xl"
                >
                  הוצא ליגה לדרך!
                </button>
              </div>
            )}

            <div className="tape-label">דירוג הקבוצות - עונה סדירה</div>
            <div className="street-card overflow-x-auto rounded-lg">
              <table className="w-full text-right min-w-[600px]">
                <thead className="bg-black/80 border-b border-neutral-800 text-neutral-400 text-xs font-black uppercase">
                  <tr><th className="p-6">דירוג</th><th className="p-6 text-right">קבוצה</th><th className="p-6 text-center">נק'</th><th className="p-6 text-center">נצ'</th><th className="p-6 text-center">הפ'</th><th className="p-6 text-center">הפרש</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {standings.map((t, i) => (
                    <tr key={t.id} className="group hover:bg-white/[0.02] transition-all">
                      <td className="p-6 font-stencil text-3xl text-neutral-700 group-hover:text-[var(--street-orange)]">0{i+1}</td>
                      <td className="p-6 text-2xl font-black text-white">{t.name}</td>
                      <td className="p-6 text-center font-stencil text-4xl text-[var(--street-orange)]">{t.points}</td>
                      <td className="p-6 text-center font-black text-white">{t.wins}</td>
                      <td className="p-6 text-center font-bold text-neutral-400">{t.losses}</td>
                      <td className={`p-6 text-center font-black text-xl ${t.diff >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">{t.diff > 0 ? `+${t.diff}` : t.diff}</td>
                    </tr>
                  ))}
                  {standings.length === 0 && <tr><td colSpan="6" className="p-20 text-center text-neutral-600 font-bold uppercase tracking-widest">ממתינים לפתיחת העונה</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {activeTab === 'schedule' && (
           <div className="animate-in space-y-8">
             <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <h2 className="text-4xl font-stencil text-[var(--street-orange)] tracking-widest uppercase">לוח המשחקים</h2>
                {leagueStage === 'regular' && <div className="text-xs font-bold text-neutral-500">מחזור השלמות: {makeupDates}</div>}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.filter(m=>m.type==='regular').sort((a,b)=>a.roundIndex-b.roundIndex).map(m => (
                  <div key={m.id} className={`street-card p-6 ${m.isPlayed ? 'opacity-40 border-neutral-800' : 'border-[var(--street-orange)]'}`}>
                    <div className="text-[10px] font-black text-neutral-600 mb-2 uppercase">{m.roundName} | {m.roundDates}</div>
                    <div className="flex justify-between items-center text-center font-bold">
                      <div className="flex-1 text-white uppercase text-xl">{m.homeTeam.name}</div>
                      <div className="px-4">
                        {m.isPlayed ? <div className="text-3xl font-black text-[var(--street-orange)]">{m.homeScore}-{m.awayScore}</div> : <span className="font-stencil text-2xl text-neutral-800">VS</span>}
                      </div>
                      <div className="flex-1 text-white uppercase text-xl">{m.awayTeam.name}</div>
                    </div>
                    {!m.isPlayed && (
                      <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-center items-center gap-4">
                        <input type="number" id={`h_${m.id}`} className="w-16 h-10 bg-black border-b-2 border-neutral-800 text-center text-2xl font-black text-white" placeholder="0" />
                        <button onClick={() => updateScore(m.id, document.getElementById(`h_${m.id}`).value, document.getElementById(`a_${m.id}`).value)} className="bg-[var(--street-orange)] text-black font-black px-6 py-2 uppercase text-xs hover:bg-white transition-all">עדכן תוצאה</button>
                        <input type="number" id={`a_${m.id}`} className="w-16 h-10 bg-black border-b-2 border-neutral-800 text-center text-2xl font-black text-white" placeholder="0" />
                      </div>
                    )}
                  </div>
                ))}
             </div>
           </div>
        )}

        {/* HALL OF FAME */}
        {activeTab === 'hallOfFame' && (
          <div className="animate-in space-y-12">
            <div className="text-center">
               <div className="tape-label tracking-[10px]">האגדות</div>
               <h2 className="font-stencil text-7xl md:text-8xl text-white uppercase tracking-tighter mt-2">היכל התהילה</h2>
            </div>

            {isAdminMode && (
              <div className="street-card p-6 border-[var(--street-yellow)] max-w-2xl mx-auto">
                <h4 className="text-lg font-bold text-white mb-4 uppercase">ניהול ידני</h4>
                <form onSubmit={addManualHof} className="flex flex-col md:flex-row gap-4">
                  <input required type="text" placeholder="שנה" value={newHofYear} onChange={e=>setNewHofYear(e.target.value)} className="w-20 bg-black border p-2 text-white" />
                  <input required type="text" placeholder="שם הקבוצה" value={manualHofTeam} onChange={e=>setManualHofTeam(e.target.value)} className="flex-1 bg-black border p-2 text-white" />
                  <input type="text" placeholder="שמות שחקנים" value={manualHofPlayers} onChange={e=>setManualHofPlayers(e.target.value)} className="flex-1 bg-black border p-2 text-white" />
                  <button type="submit" className="bg-[var(--street-yellow)] text-black font-black px-4 py-2 uppercase hover:bg-white transition-all">הוסף</button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {hallOfFame.map((w) => (
                <div key={w.id} className="gold-card p-12 text-center group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5"><Icon name="crown" size={100} color="#ffb300" /></div>
                  {isAdminMode && (
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hallOfFame', w.id))} className="absolute top-4 left-4 bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white p-2 rounded transition-all z-20"><Icon name="x" size={16} color="#ef4444" /></button>
                  )}
                  <div className="font-stencil text-6xl text-[var(--street-yellow)] mb-4">{w.year}</div>
                  <h3 className="font-stencil text-7xl text-white uppercase mb-6 transition-transform group-hover:scale-105">{w.teamName}</h3>
                  <div className="text-sm font-bold text-neutral-400 leading-loose pt-4 border-t border-neutral-800/50">
                    {renderPlayersSafe(w.players)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEAMS */}
        {activeTab === 'teams' && (
          <div className="animate-in space-y-10">
            {isAdminMode && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6 text-right">
                  <h3 className="font-stencil text-4xl text-[var(--street-yellow)] uppercase flex items-center gap-4">
                    <Icon name="alertCircle" size={30} color="#ffb300" /> בקשות ממתינות ({pendingRegistrations.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingRegistrations.map(r => (
                      <div key={r.id} className="street-card p-6 flex justify-between items-center bg-black border-r-8 border-r-[var(--street-yellow)]">
                        <div>
                          <h4 className="text-white font-black text-2xl">{r.name}</h4>
                          <div className="text-neutral-500 text-xs font-black uppercase mt-2">
                            {renderPlayersSafe(r.players)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={()=>approveRegistration(r)} className="bg-green-700 p-3 rounded hover:bg-green-500 transition-all shadow-lg"><Icon name="check" size={24} color="#ffffff"/></button>
                          <button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registrationRequests', r.id))} className="bg-red-700 p-3 rounded hover:bg-red-500 transition-all shadow-lg"><Icon name="x" size={24} color="#ffffff"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="street-card p-10 border-[var(--street-orange)] h-fit text-right">
                   <h3 className="font-stencil text-3xl text-white mb-8 uppercase flex items-center gap-3">
                     <Icon name="shirt" size={24} color="#ff5722" /> ריכוז מידות
                   </h3>
                   <div className="space-y-5 font-black">
                      {Object.entries(shirtSummary).map(([size, count]) => (
                        <div key={size} className="flex justify-between items-center border-b border-neutral-900 pb-3">
                          <span className="text-neutral-500 text-sm">מידה {size}:</span>
                          <span className="text-[var(--street-orange)] text-2xl">{count}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
            
            <div className="tape-label">קבוצות מאושרות</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {teams.map(t => (
                <div key={t.id} className="street-card overflow-hidden group">
                   {isAdminMode && <button onClick={() => deleteTeam(t.id)} className="absolute top-4 left-4 bg-red-900/60 text-white hover:bg-red-600 transition-all p-2 rounded z-20"><Icon name="x" size={16} color="#ffffff"/></button>}
                  <div className="bg-neutral-900 p-10 text-center border-b-4 border-neutral-900">
                    <h3 className="font-stencil text-6xl text-white uppercase group-hover:text-[var(--street-orange)] transition-colors">{t.name}</h3>
                  </div>
                  <div className="p-10 bg-black/80 space-y-6">
                    {t.players?.map((p, i) => (
                      <div key={i} className="flex justify-between items-center font-black text-sm text-white">
                        <div className="flex gap-5 items-center">
                          <span className="text-[var(--street-orange)] font-stencil text-3xl opacity-30">#{i+1}</span> 
                          <span className="tracking-tight">{typeof p === 'object' ? p.name : p}</span>
                        </div>
                        {isAdminMode && <span className="px-2 py-1 bg-white/10 text-[var(--street-yellow)] text-[10px] rounded">{p.size}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REGISTRATION */}
        {activeTab === 'registration' && (
          <div className="animate-in max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <div className="tape-label">גיוס קבוצות</div>
              <h2 className="font-stencil text-7xl text-white uppercase mt-2">רישום לליגה</h2>
            </div>
            {leagueStage === 'registration' ? (
              <div className="street-card p-10 shadow-[15px_15px_0px_rgba(0,0,0,0.5)]">
                <form onSubmit={handleRegisterTeam} className="space-y-8 text-right">
                  <div>
                    <label className="block text-neutral-400 font-black text-xs uppercase mb-3">שם הקבוצה</label>
                    <input required type="text" value={regTeamName} onChange={e=>setRegTeamName(e.target.value)} placeholder="..." className="w-full bg-black border-2 border-neutral-900 p-5 text-white font-black text-xl focus:border-[var(--street-orange)] outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-neutral-400 font-black text-xs uppercase">סגל שחקנים ומידות</label>
                    {['קפטן', 'שחקן 2', 'שחקן 3', 'מחליף'].map((label, i) => (
                      <div key={i} className="flex gap-3">
                        <input 
                          required={i < 3} type="text" value={regPlayers[i].name} placeholder={label} 
                          onChange={e=>{const up=[...regPlayers];up[i].name=e.target.value;setRegPlayers(up);}} 
                          className="flex-1 bg-black border-b-2 border-neutral-900 p-4 text-white font-bold outline-none focus:border-[var(--street-orange)]" 
                        />
                        <select value={regPlayers[i].size} onChange={e=>{const up=[...regPlayers];up[i].size=e.target.value;setRegPlayers(up);}} className="bg-neutral-900 border border-neutral-800 p-3 text-white font-black outline-none">
                          {['S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <button disabled={isSubmitting} type="submit" className="w-full bg-white text-black font-black py-6 uppercase hover:bg-[var(--street-orange)] hover:text-white transition-all text-2xl shadow-[10px_10px_0px_#000]">
                    {isSubmitting ? 'מעבד...' : 'שלח בקשת הרשמה'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="street-card p-20 text-center border-dashed opacity-40">
                <Icon name="lock" size={80} color="#555" />
                <h4 className="text-4xl font-stencil text-white mb-2 uppercase tracking-widest">ההרשמה נסגרה</h4>
                <p className="text-neutral-500 font-bold text-sm">העונה כבר התחילה. ניפגש בעונה הבאה!</p>
              </div>
            )}
          </div>
        )}

        {/* PLAYOFFS */}
        {activeTab === 'playoffs' && (
           <div className="animate-in space-y-12">
             <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-neutral-800 pb-4 gap-4">
               <h2 className="text-4xl font-stencil text-[var(--street-yellow)] tracking-widest uppercase">שלב הפיינל פור</h2>
               <div className="flex gap-2">
                 {isAdminMode && leagueStage === 'regular' && <button onClick={startFinalFour} className="bg-white text-black px-5 py-2 font-black text-xs uppercase hover:bg-[var(--street-orange)] transition-colors">הפעל פיינל פור</button>}
                 {isAdminMode && leagueStage === 'playoff' && matches.filter(m=>m.type==='playoff'&&m.stage==='semi'&&m.isPlayed).length===2 && !matches.find(m=>m.stage==='final') && <button onClick={createFinals} className="bg-[var(--street-yellow)] text-black px-5 py-2 font-black text-xs uppercase">צור משחקי הכרעה</button>}
               </div>
             </div>

             {finalMatch?.isPlayed && isAdminMode && (
               <div className="street-card p-8 text-center border-[var(--street-yellow)] border-2 animate-fade-in">
                  <Icon name="crown" size={60} className="text-[var(--street-yellow)] mx-auto mb-4" />
                  <h3 className="text-3xl font-stencil text-white mb-6 tracking-widest uppercase">יש אלופה! הכתר והעלה להיכל</h3>
                  <div className="flex flex-col md:flex-row justify-center items-center gap-4">
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
                      <div className="flex-1 font-black text-2xl text-white uppercase">{m.homeTeam.name}</div>
                      <div className="px-6">
                        {m.isPlayed ? <div className="text-5xl font-black text-[var(--street-yellow)]">{m.homeScore}-{m.awayScore}</div> : <span className="font-stencil text-4xl text-neutral-800">VS</span>}
                      </div>
                      <div className="flex-1 font-black text-2xl text-white uppercase">{m.awayTeam.name}</div>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        )}

        {/* LEAGUE RULES */}
        {activeTab === 'leagueRules' && (
          <div className="animate-in max-w-4xl mx-auto pb-10">
            <div className="tape-label">תקנון הליגה</div>
            <h2 className="font-stencil text-7xl text-white mb-10 uppercase">REGAVIM 3X3</h2>
            
            <div className="rule-strip">
              <h3 className="text-2xl font-black text-[var(--street-orange)] mb-2 uppercase">01. הקדמה</h3>
              <p className="text-white font-bold leading-relaxed text-lg">ברוכים הבאים לליגת הסטריטבול של רגבים 3 על 3. הליגה הוקמה במטרה לקדם את תרבות הכדורסל הקהילתית והתחרותית במגרש הביתי שלנו. אנו מצפים למשחק הוגן, ספורטיבי ומכבד בין כל המשתתפים.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rule-strip">
                <h3 className="text-xl font-black text-white mb-2 uppercase">02. סגל ורישום</h3>
                <ul className="text-white text-sm space-y-3 font-bold text-right">
                  <li>• עד 4 שחקנים בקבוצה (3 על המגרש + מחליף).</li>
                  <li>• גילאי 16 ומעלה בלבד.</li>
                  <li>• יש להזין שמות מלאים ומדויקים בעת הרישום.</li>
                </ul>
              </div>
              <div className="rule-strip">
                <h3 className="text-xl font-black text-white mb-2 uppercase">03. מהלך המשחק</h3>
                <ul className="text-white text-sm space-y-3 font-bold text-right">
                  <li>• משך כל משחק: 20 דקות זמן רץ.</li>
                  <li>• במקרה של שוויון: תוספת של 4 דקות להכרעה.</li>
                  <li>• המנצח מוציא כדור (Make it Take it).</li>
                </ul>
              </div>
              <div className="rule-strip">
                <h3 className="text-xl font-black text-white mb-2 uppercase">04. שיטת הניקוד</h3>
                <ul className="text-white text-sm space-y-3 font-bold text-right">
                  <li>• קליעה מחוץ לקשת = 3 נקודות.</li>
                  <li>• קליעה בתוך הקשת = 2 נקודות.</li>
                  <li>• אין זריקות עונשין במהלך המשחקים.</li>
                </ul>
              </div>
              <div className="rule-strip">
                <h3 className="text-xl font-black text-white mb-2 uppercase">05. דירוג וטבלה</h3>
                <ul className="text-white text-sm space-y-3 font-bold text-right">
                  <li>• ניצחון = 2 נקודות | הפסד = 1 נקודה.</li>
                  <li>• שוויון בטבלה יוכרע על פי הפרש סלים.</li>
                  <li>• 4 הקבוצות הראשונות עולות לאירוע הפיינל פור.</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-[var(--street-orange)] p-8 text-center shadow-[10px_10px_0px_#000]">
              <h4 className="text-black font-black uppercase text-xl mb-1">חובת דיווח תוצאה</h4>
              <p className="text-black/80 text-sm font-black uppercase">מיד לאחר המשחק, קפטני הקבוצות מחויבים להזין את התוצאה באפליקציה.</p>
            </div>
          </div>
        )}
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-4 animate-in">
          <div className="bg-[#0a0a0a] border-8 border-white p-12 max-w-sm w-full shadow-[25px_25px_0px_var(--street-orange)] relative">
             <button onClick={()=>setShowLoginModal(false)} className="absolute top-6 left-6 text-neutral-600 hover:text-white"><Icon name="x" size={24} color="#666" /></button>
            <h3 className="font-stencil text-6xl text-white mb-10 text-center uppercase">כניסת הנהלה</h3>
            <div className="space-y-6 mb-10 text-right">
              <input type="text" placeholder="שם משתמש" value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="w-full bg-black border-2 border-neutral-800 p-5 text-white font-black" />
              <input type="password" placeholder="קוד גישה" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} className="w-full bg-black border-2 border-neutral-800 p-5 text-white font-black" dir="ltr" />
            </div>
            <button onClick={handleLogin} className="w-full bg-white text-black font-black py-6 uppercase hover:bg-[var(--street-orange)] hover:text-white transition-all text-xl font-stencil">התחבר</button>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-[var(--street-orange)] text-black font-black px-12 py-6 shadow-2xl animate-bounce flex items-center gap-5 text-xl border-8 border-black">
          <Icon name="check" size={30} color="#000000" />
          <span>{notification}</span>
        </div>
      )}
      
      {isAdminMode && (
        <div className="fixed bottom-4 left-4 z-50 flex gap-2">
           <button onClick={resetSeasonOnly} className="bg-red-900/40 hover:bg-red-600 text-red-500 hover:text-white p-2 border border-red-900 transition-all text-[10px] font-black px-4 flex items-center gap-2 rounded uppercase tracking-widest shadow-xl">
            <Icon name="history" size={14} /> RESET SEASON
          </button>
        </div>
      )}
    </div>
  );
}