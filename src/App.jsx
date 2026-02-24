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
    award: 'award',
    shirt: 'shirt',
    menu: 'menu',
    chevronDown: 'chevron-down',
    zap: 'zap'
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
  --street-orange-dark: #bf360c;
  --street-yellow: #ffb300;
  --bg-dark: #0a0a0a;
  --card-bg: #141414;
  --concrete-text: #888;
}

body {
  background-color: var(--bg-dark);
  background-image: 
    url("https://www.transparenttextures.com/patterns/concrete-wall-2.png"),
    radial-gradient(circle at 0% 0%, rgba(255, 87, 34, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(255, 179, 0, 0.05) 0%, transparent 50%);
  background-attachment: fixed;
  color: #fff;
  font-family: 'Heebo', sans-serif;
  direction: rtl;
  overflow-x: hidden;
}

.font-stencil { 
  font-family: 'Karantina', system-ui; 
  letter-spacing: 2px;
}

/* Header Graffiti */
.header-area {
  padding: 4rem 1rem;
  text-align: center;
  position: relative;
  border-bottom: 8px solid #000;
}

.title-box {
  display: inline-block;
  padding: 1rem 2rem;
  background: #000;
  border: 4px solid #fff;
  box-shadow: 10px 10px 0px var(--street-orange);
  transform: rotate(-1deg);
}

.graffiti-main {
  font-size: 5rem;
  line-height: 0.9;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 2px 2px 0px var(--street-orange);
}

@media (max-width: 768px) {
  .graffiti-main { font-size: 3.5rem; }
}

/* Hard Brutalist Cards */
.street-card {
  background: var(--card-bg);
  border: 2px solid #222;
  position: relative;
  transition: 0.2s ease-out;
}

.street-card:hover {
  border-color: var(--street-orange);
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0px var(--street-orange);
}

/* Taped Label Style */
.tape-label {
  background: #000;
  color: var(--street-orange);
  padding: 2px 10px;
  font-family: 'Karantina';
  font-size: 1.2rem;
  display: inline-block;
  transform: rotate(1deg);
  margin-bottom: 0.5rem;
}

/* Nav Improvements */
.nav-container {
  background: rgba(0,0,0,0.9);
  border-bottom: 2px solid #222;
}

.nav-link {
  color: #777;
  font-weight: 900;
  padding: 1.2rem 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: 0.2s;
  position: relative;
}

.nav-link:hover { color: #fff; }

.nav-link.active {
  color: var(--street-orange);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--street-orange);
}

/* Rules Section - High Legibility */
.rule-strip {
  border-right: 6px solid var(--street-orange);
  padding: 1.5rem;
  background: rgba(255,255,255,0.02);
  margin-bottom: 2rem;
}

/* Custom Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #000; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--street-orange); }

.animate-in {
  animation: slideUp 0.4s ease-out forwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
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
    if (adminUser === 'אדמין' && adminPass === '010608') { setIsAdminMode(true); setShowLoginModal(false); setAdminUser(''); setAdminPass(''); showMessage('ADMIN AUTHENTICATED'); }
    else showMessage('ACCESS DENIED');
  };

  const seedDatabase = async () => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'registration', leagueStartDate: '', makeupDates: '' });
    await batch.commit(); setIsDBReady(true);
  };

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    if (leagueStage !== 'registration') return showMessage('REGISTRATION CLOSED');
    const validPlayers = regPlayers.filter(p => p.name.trim() !== '');
    if (validPlayers.length < 3) return showMessage('MIN 3 PLAYERS REQUIRED');
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'registrationRequests'), { name: regTeamName, players: validPlayers, createdAt: Date.now() });
      showMessage('בקשת רישום נשלחה לאישור');
      setRegTeamName(''); setRegPlayers([{ name: '', size: 'M' }, { name: '', size: 'M' }, { name: '', size: 'M' }, { name: '', size: 'M' }]);
      setActiveTab('standings');
    } catch (err) { showMessage('ERROR SUBMITTING'); }
    setIsSubmitting(false);
  };

  const approveRegistration = async (request) => {
    const batch = writeBatch(db);
    const newTeamId = 't_' + Date.now();
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'teams', newTeamId), { name: request.name, players: request.players });
    batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'registrationRequests', request.id));
    await batch.commit(); showMessage(`TEAM ${request.name} APPROVED`);
  };

  const updateScore = async (matchId, hS, aS) => {
    const h = parseInt(hS), a = parseInt(aS);
    if (isNaN(h) || isNaN(a)) return showMessage('INVALID SCORE');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId), { homeScore: h, awayScore: a, isPlayed: true });
    showMessage('SCORE UPDATED');
  };

  const promoteToHof = async () => {
    const fm = matches.find(m => m.id === 'ff_final');
    if (!fm || !fm.isPlayed) return;
    const winner = fm.homeScore > fm.awayScore ? fm.homeTeam : fm.awayTeam;
    const winnerData = teams.find(t => t.id === winner.id) || winner;
    const playersStr = Array.isArray(winnerData.players) ? winnerData.players.map(p => p.name).join(', ') : '';
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hallOfFame', 'h_' + Date.now()), { year: newHofYear, teamName: winnerData.name, players: playersStr });
    showMessage(`${winnerData.name} CROWNED CHAMPION!`);
    setActiveTab('hallOfFame');
  };

  if (!isDBReady) return <div className="min-h-screen bg-black flex items-center justify-center text-[var(--street-orange)] font-stencil text-4xl animate-pulse">LOADING...</div>;

  const finalMatch = matches.find(m => m.id === 'ff_final');

  return (
    <div className="min-h-screen pb-20">
      <style>{customStyles}</style>

      {/* HEADER - STREET ART STYLE */}
      <header className="header-area">
        <div className="title-box">
          <h1 className="font-stencil graffiti-main">
            STREETBALL <span className="text-[var(--street-orange)]">REGAVIM</span>
          </h1>
        </div>
        <div className="mt-6 flex justify-center items-center gap-3">
          <span className="font-stencil text-xl text-neutral-500 tracking-widest uppercase">League Management System</span>
          <Icon name="zap" size={18} className="text-[var(--street-orange)]" />
        </div>
      </header>

      {/* NAV - CLEAN & RESPONSIVE */}
      <nav className="nav-container sticky top-0 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-0">
          {/* Desktop Links */}
          <div className="hidden md:flex flex-1 justify-center">
            {tabs.map(t => (
              <button 
                key={t.id} onClick={() => setActiveTab(t.id)} 
                className={`nav-link px-4 md:px-6 ${activeTab === t.id ? 'active' : ''}`}
              >
                {t.l}
              </button>
            ))}
          </div>

          {/* Admin Toggle (Always visible) */}
          <button 
            onClick={toggleAdmin} 
            className="md:border-r border-neutral-800 px-6 py-4 text-neutral-500 hover:text-[var(--street-orange)] transition-colors flex items-center gap-2 font-black text-xs uppercase"
          >
            <Icon name="settings" size={14} /> {isAdminMode ? 'EXIT' : 'ADMIN'}
          </button>

          {/* Mobile Hamburger */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-4 text-white">
            <Icon name={isMenuOpen ? "x" : "menu"} size={24} />
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-black border-t border-neutral-800 animate-fade-in">
            {tabs.map(t => (
              <button 
                key={t.id} onClick={() => { setActiveTab(t.id); setIsMenuOpen(false); }} 
                className={`w-full text-right p-4 border-r-4 transition-all font-bold ${activeTab === t.id ? 'border-[var(--street-orange)] bg-neutral-900 text-[var(--street-orange)]' : 'border-transparent text-neutral-500'}`}
              >
                {t.l}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto p-4 mt-8">
        
        {/* STANDINGS - CLEAN GRID */}
        {activeTab === 'standings' && (
          <div className="animate-in">
            <div className="tape-label">LEAGUE RANKINGS</div>
            <div className="street-card overflow-x-auto">
              <table className="w-full text-right min-w-[600px]">
                <thead className="bg-black/50 border-b border-neutral-800 text-neutral-500 text-xs uppercase font-black">
                  <tr><th className="p-5">RANK</th><th className="p-5">TEAM NAME</th><th className="p-5 text-center">PTS</th><th className="p-5 text-center">W</th><th className="p-5 text-center">L</th><th className="p-5 text-center">DIFF</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {standings.map((t, i) => (
                    <tr key={t.id} className="group hover:bg-white/5 transition-all">
                      <td className="p-5 font-stencil text-2xl text-neutral-600 group-hover:text-[var(--street-orange)]">0{i+1}</td>
                      <td className="p-5 text-xl font-black uppercase tracking-tighter">{t.name}</td>
                      <td className="p-5 text-center font-stencil text-3xl text-[var(--street-orange)]">{t.points}</td>
                      <td className="p-5 text-center font-bold">{t.wins}</td>
                      <td className="p-5 text-center font-bold text-neutral-600">{t.losses}</td>
                      <td className={`p-5 text-center font-black ${t.diff >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">{t.diff > 0 ? `+${t.diff}` : t.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEAGUE RULES - REVERTED TO FAVORITE DESIGN */}
        {activeTab === 'leagueRules' && (
          <div className="animate-in max-w-4xl mx-auto">
            <div className="tape-label">OFFICIAL HANDBOOK</div>
            <h2 className="font-stencil text-6xl text-white mb-8 uppercase">ליגת רגבים 3X3</h2>
            
            <div className="rule-strip">
              <h3 className="text-2xl font-black text-[var(--street-orange)] mb-2 uppercase">01. הקדמה</h3>
              <p className="text-neutral-400 font-bold leading-relaxed">ליגת סטריטבול רגבים 3 על 3 הוקמה כדי לייצר זירה תחרותית, קהילתית ומקצועית עבור חובבי הכדורסל בישוב. המשחק מושתת על הגינות, ספורטיביות ורוח הרחוב.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rule-strip">
                <h3 className="text-xl font-black text-white mb-2 uppercase">02. סגל ורישום</h3>
                <ul className="text-neutral-400 text-sm space-y-2 font-bold">
                  <li>• עד 4 שחקנים בקבוצה (3 שחקנים + מחליף).</li>
                  <li>• גילאי 16 ומעלה (טורניר נוער בנפרד).</li>
                  <li>• יש לרשום שם מלא ומדויק לכל שחקן.</li>
                </ul>
              </div>
              <div className="rule-strip">
                <h3 className="text-xl font-black text-white mb-2 uppercase">03. מהלך המשחק</h3>
                <ul className="text-neutral-400 text-sm space-y-2 font-bold">
                  <li>• משך משחק: 20 דקות זמן רץ.</li>
                  <li>• שוויון: הארכה של 4 דקות להכרעה.</li>
                  <li>• המנצח מוציא (Make it Take it).</li>
                </ul>
              </div>
              <div className="rule-strip">
                <h3 className="text-xl font-black text-white mb-2 uppercase">04. שיטת הניקוד</h3>
                <ul className="text-neutral-400 text-sm space-y-2 font-bold">
                  <li>• קליעה מחוץ לקשת = 3 נקודות.</li>
                  <li>• קליעה בתוך הקשת = 2 נקודות.</li>
                  <li>• אין זריקות עונשין במהלך המשחק.</li>
                </ul>
              </div>
              <div className="rule-strip">
                <h3 className="text-xl font-black text-white mb-2 uppercase">05. דירוג וטבלה</h3>
                <ul className="text-neutral-400 text-sm space-y-2 font-bold">
                  <li>• ניצחון = 2 נקודות | הפסד = 1 נקודה.</li>
                  <li>• שוויון בטבלה יוכרע ע"י הפרש סלים.</li>
                  <li>• 4 הראשונות עולות לאירוע הפיינל פור.</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-neutral-900 border-2 border-dashed border-neutral-700 p-6 text-center">
              <h4 className="text-[var(--street-orange)] font-black uppercase mb-1">חובת דיווח תוצאה</h4>
              <p className="text-neutral-500 text-xs font-bold">מיד לאחר המשחק, קפטני הקבוצות מחויבים להזין את התוצאה באפליקציה.</p>
            </div>
          </div>
        )}

        {/* HALL OF FAME - GOLD pedestal */}
        {activeTab === 'hallOfFame' && (
          <div className="animate-in space-y-12">
            <div className="text-center">
               <div className="tape-label">THE LEGENDS</div>
               <h2 className="font-stencil text-7xl text-white uppercase tracking-widest mt-2">HALL OF FAME</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {hallOfFame.map((w) => (
                <div key={w.id} className="gold-card p-12 text-center group">
                  {isAdminMode && (
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hallOfFame', w.id))} className="absolute top-4 left-4 text-red-500 hover:bg-red-500 hover:text-white p-1 rounded transition-all"><Icon name="x" size={16}/></button>
                  )}
                  <div className="font-stencil text-5xl text-[var(--street-yellow)] mb-4">{w.year}</div>
                  <div className="h-1 w-12 bg-neutral-800 mx-auto mb-6"></div>
                  <h3 className="font-stencil text-6xl text-white uppercase mb-6 group-hover:scale-110 transition-transform">{w.teamName}</h3>
                  <div className="text-xs font-black text-neutral-500 uppercase tracking-widest leading-loose border-t border-neutral-800 pt-4">
                    {w.players}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REGISTRATION - DYNAMIC */}
        {activeTab === 'registration' && (
          <div className="animate-in max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <div className="tape-label">ENLIST NOW</div>
              <h2 className="font-stencil text-6xl text-white uppercase tracking-tight">TEAM ENTRY</h2>
            </div>
            {leagueStage === 'registration' ? (
              <div className="street-card p-10">
                <form onSubmit={handleRegisterTeam} className="space-y-6">
                  <div>
                    <label className="block text-neutral-500 font-black text-xs uppercase mb-2">TEAM IDENTIFIER</label>
                    <input required type="text" value={regTeamName} onChange={e=>setRegTeamName(e.target.value)} placeholder="שם הקבוצה" className="w-full bg-black border border-neutral-800 p-4 text-white font-bold focus:border-[var(--street-orange)] outline-none transition-all" />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-neutral-500 font-black text-xs uppercase">PLAYER ROSTER</label>
                    {['CAPTAIN', 'PLAYER 2', 'PLAYER 3', 'SUBSTITUTE'].map((label, i) => (
                      <div key={i} className="flex gap-2">
                        <input 
                          required={i < 3} type="text" value={regPlayers[i].name} placeholder={label} 
                          onChange={e=>{const up=[...regPlayers];up[i].name=e.target.value;setRegPlayers(up);}} 
                          className="flex-1 bg-black border-b border-neutral-800 p-3 text-white font-bold outline-none focus:border-[var(--street-orange)]" 
                        />
                        <select 
                          value={regPlayers[i].size}
                          onChange={e=>{const up=[...regPlayers];up[i].size=e.target.value;setRegPlayers(up);}}
                          className="bg-neutral-900 border border-neutral-800 text-neutral-500 p-2 text-xs font-black outline-none focus:text-[var(--street-orange)]"
                        >
                          {['S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <button disabled={isSubmitting} type="submit" className="w-full bg-[var(--street-orange)] text-black font-black py-6 uppercase hover:bg-white transition-all tracking-widest text-xl shadow-[10px_10px_0px_rgba(0,0,0,0.5)]">
                    {isSubmitting ? 'PROCESSING...' : 'SUBMIT ROSTER'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="street-card p-20 text-center border-dashed opacity-50">
                <Icon name="lock" size={64} className="mx-auto mb-6 text-neutral-700" />
                <h4 className="text-3xl font-stencil text-white mb-2">WINDOW CLOSED</h4>
                <p className="text-neutral-500 font-bold uppercase text-xs">Season is already live. Catch us next time.</p>
              </div>
            )}
          </div>
        )}

        {/* TEAMS LIST (ADMIN TOOLS) */}
        {activeTab === 'teams' && (
          <div className="animate-in space-y-10">
            {isAdminMode && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-stencil text-3xl text-[var(--street-yellow)] uppercase">PENDING APPROVAL ({pendingRegistrations.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingRegistrations.map(r => (
                      <div key={r.id} className="street-card p-5 flex justify-between items-center bg-black border-l-4 border-l-[var(--street-yellow)]">
                        <div>
                          <h4 className="text-white font-black uppercase text-xl">{r.name}</h4>
                          <div className="text-neutral-600 text-[10px] font-black uppercase mt-1">
                            {r.players.map((p,pi) => (
                              <span key={pi}>{p.name} ({p.size}){pi < r.players.length-1 ? ', ' : ''}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>approveRegistration(r)} className="bg-green-600 p-2 rounded hover:bg-green-500"><Icon name="check" size={20} className="text-white"/></button>
                          <button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registrationRequests', r.id))} className="bg-red-600 p-2 rounded hover:bg-red-500"><Icon name="x" size={20} className="text-white"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="street-card p-8 border-[var(--street-orange)] h-fit">
                   <h3 className="font-stencil text-2xl text-white mb-6 uppercase flex items-center gap-2">
                     <Icon name="shirt" size={20} className="text-[var(--street-orange)]" /> ROSTER SIZES
                   </h3>
                   <div className="space-y-4 font-black">
                      {Object.entries(shirtSummary).map(([size, count]) => (
                        <div key={size} className="flex justify-between items-center border-b border-neutral-900 pb-2">
                          <span className="text-neutral-500 text-xs">SIZE {size}:</span>
                          <span className="text-[var(--street-orange)] text-xl">{count}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
            
            <div className="tape-label">PRO TEAMS</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teams.map(t => (
                <div key={t.id} className="street-card overflow-hidden group">
                   {isAdminMode && <button onClick={() => deleteTeam(t.id)} className="absolute top-4 left-4 text-red-900 hover:text-red-500 transition-colors z-20"><Icon name="x" size={16}/></button>}
                  <div className="bg-neutral-900 p-10 text-center border-b-2 border-neutral-800">
                    <h3 className="font-stencil text-5xl text-white uppercase group-hover:text-[var(--street-orange)] transition-colors">{t.name}</h3>
                  </div>
                  <div className="p-8 bg-black/50 space-y-4">
                    {t.players?.map((p, i) => (
                      <div key={i} className="flex justify-between items-center font-black uppercase text-xs">
                        <div className="flex gap-4 items-center">
                          <span className="text-[var(--street-orange)] font-stencil text-xl opacity-40">#{i+1}</span> 
                          <span className="text-neutral-300">{p.name}</span>
                        </div>
                        {isAdminMode && <span className="size-badge">{p.size}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-4 animate-in">
          <div className="bg-[#111] border-4 border-white p-12 max-w-sm w-full shadow-[20px_20px_0px_var(--street-orange)] relative">
             <button onClick={()=>setShowLoginModal(false)} className="absolute top-6 left-6 text-neutral-600 hover:text-white"><Icon name="x" size={24}/></button>
            <h3 className="font-stencil text-5xl text-white mb-10 text-center uppercase">OFFICER LOGIN</h3>
            <div className="space-y-6 mb-10">
              <input type="text" placeholder="ID" value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="w-full bg-black border-2 border-neutral-800 p-4 text-white font-black" />
              <input type="password" placeholder="CODE" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} className="w-full bg-black border-2 border-neutral-800 p-4 text-white font-black" dir="ltr" />
            </div>
            <button onClick={handleLogin} className="w-full bg-white text-black font-black py-5 uppercase hover:bg-[var(--street-orange)] hover:text-white transition-all text-xl">AUTHENTICATE</button>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-[var(--street-orange)] text-black font-black px-10 py-5 shadow-2xl animate-bounce flex items-center gap-4 text-lg border-4 border-black">
          <Icon name="check" size={24} />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}