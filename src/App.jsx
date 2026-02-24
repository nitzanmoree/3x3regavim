import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';

// --- ICONS SETUP (Loading from CDN to avoid build issues) ---
const Icon = ({ name, size = 24, className = '' }) => {
  return (
    <img 
      src={`https://api.iconify.design/lucide:${name}.svg?color=currentColor`} 
      alt={name}
      width={size} 
      height={size} 
      className={className} 
      style={{ display: 'inline-block' }}
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

// --- CSS STYLES FOR ASPHALT & PAINT THEME ---
const customStyles = `
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700;900&family=Karantina:wght@400;700&display=swap');

:root {
  --street-orange: #ff5722;
  --street-yellow: #ffb300;
  --dark-asphalt: #121212;
  --light-concrete: #e0e0e0;
}

body {
  background-color: var(--dark-asphalt);
  background-image: 
    linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.95)),
    url("https://www.transparenttextures.com/patterns/concrete-wall.png");
  background-attachment: fixed;
  color: #fff;
  font-family: 'Heebo', sans-serif;
  direction: rtl;
  overflow-x: hidden;
}

.font-stencil { 
  font-family: 'Karantina', system-ui; 
  letter-spacing: 1.5px;
}

/* Refined Brutalist Cards */
.street-card {
  background-color: #1a1a1a;
  border: 2px solid #333;
  box-shadow: 4px 4px 0px var(--street-orange);
  transition: all 0.2s ease-in-out;
  position: relative;
}
.street-card:hover {
  transform: translateY(-2px);
  box-shadow: 6px 6px 0px var(--street-orange);
  border-color: #444;
}

.street-card-light {
  background-color: var(--light-concrete);
  background-image: url("https://www.transparenttextures.com/patterns/dust.png");
  color: #000;
  border: 2px solid #000;
  box-shadow: 4px 4px 0px #000;
  transition: all 0.2s;
  position: relative;
}
.street-card-light:hover {
  transform: translateY(-2px);
  box-shadow: 6px 6px 0px var(--street-orange);
}

/* Subtle Tape Effect */
.tape {
  background: #2a2a2a;
  color: #888;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
  text-transform: uppercase;
}
.tape.active {
  background: #111;
  color: var(--street-orange);
  border-bottom: 3px solid var(--street-orange);
}
.tape:hover:not(.active) {
  color: #fff;
  background: #222;
}

/* Polaroid Image */
.polaroid {
  background: #fff;
  padding: 8px 8px 32px 8px;
  border: 1px solid #ddd;
  box-shadow: 4px 4px 10px rgba(0,0,0,0.5);
}

/* Caution Stripes */
.caution-bg {
  background: repeating-linear-gradient(
    45deg,
    var(--street-yellow),
    var(--street-yellow) 10px,
    #000000 10px,
    #000000 20px
  );
}

/* Custom Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--dark-asphalt); }
::-webkit-scrollbar-thumb { background: #444; }
::-webkit-scrollbar-thumb:hover { background: var(--street-orange); }
`;

export default function App() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [isDBReady, setIsDBReady] = useState(false);
  const [activeTab, setActiveTab] = useState('standings');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [notification, setNotification] = useState(null);

  // Admin Login State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // Cloud Data State
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [leagueStage, setLeagueStage] = useState('registration');
  const [leagueStartDate, setLeagueStartDate] = useState('');
  const [makeupDates, setMakeupDates] = useState('');

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayers, setNewPlayers] = useState(['', '', '', '']);

  // --- FIREBASE INIT & SYNC ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (e) {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Collections Paths (Public Data for the league)
    const teamsRef = collection(db, 'artifacts', appId, 'public', 'data', 'teams');
    const matchesRef = collection(db, 'artifacts', appId, 'public', 'data', 'matches');
    const galleryRef = collection(db, 'artifacts', appId, 'public', 'data', 'gallery');
    const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state');

    const unsubTeams = onSnapshot(teamsRef, (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, console.error);

    const unsubMatches = onSnapshot(matchesRef, (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, console.error);

    const unsubGallery = onSnapshot(galleryRef, (snap) => {
      // Sort gallery by creation time descending
      const items = snap.docs.map(d => d.data());
      items.sort((a, b) => b.createdAt - a.createdAt);
      setGallery(items.map(i => i.url));
    }, console.error);

    const unsubMeta = onSnapshot(metaRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLeagueStage(data.leagueStage || 'registration');
        setLeagueStartDate(data.leagueStartDate || '');
        setMakeupDates(data.makeupDates || '');
        setIsDBReady(true);
      } else {
        // DB is totally empty, seed initial mock data
        seedDatabase();
      }
    }, console.error);

    return () => {
      unsubTeams();
      unsubMatches();
      unsubGallery();
      unsubMeta();
    };
  }, [user]);

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
  };

  // --- UTILS ---
  const showMessage = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleAdmin = () => {
    if (isAdminMode) {
      setIsAdminMode(false); // יציאה מניהול
    } else {
      setShowLoginModal(true); // פתיחת חלון התחברות
    }
  };

  const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress image
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // --- ACTIONS ---
  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return showMessage('יש להזין שם קבוצה');
    const validPlayers = newPlayers.filter(p => p.trim() !== '');
    if (validPlayers.length === 0) return showMessage('יש להזין לפחות שחקן אחד');

    const newTeam = {
      name: newTeamName,
      players: validPlayers
    };
    
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', 't_' + Date.now()), newTeam);
    setNewTeamName('');
    setNewPlayers(['', '', '', '']);
    showMessage('הקבוצה נוספה בהצלחה!');
  };

  const handleDeleteTeam = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', id));
  };

  const handlePlayerChange = (index, value) => {
    const updated = [...newPlayers];
    updated[index] = value;
    setNewPlayers(updated);
  };

  const handleImageUpload = async (e) => {
    if (!user) return;
    const files = Array.from(e.target.files);
    showMessage('מעלה תמונות לגלריה...');
    
    for (const file of files) {
      const base64 = await resizeImage(file, 800, 800); // Resize before uploading to avoid DB limits
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gallery', 'img_' + Date.now() + Math.floor(Math.random()*1000)), { 
        url: base64,
        createdAt: Date.now()
      });
    }
    showMessage('התמונות הועלו בהצלחה!');
  };

  // --- LEAGUE LOGIC ---
  const generateSchedule = async () => {
    if (teams.length < 2) return showMessage('חייבים לפחות 2 קבוצות כדי להתחיל ליגה');
    if (!leagueStartDate) return showMessage('יש לבחור תאריך לתחילת הליגה');
    
    const start = new Date(leagueStartDate);
    const day = start.getDay();
    const firstSunday = new Date(start);
    firstSunday.setDate(start.getDate() - day); 

    const formatDate = (date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
    
    const getWeekRange = (sundayDate, weekOffset) => {
      const s = new Date(sundayDate);
      s.setDate(s.getDate() + weekOffset * 7);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      return `${formatDate(s)} - ${formatDate(e)}`;
    };

    let tms = [...teams];
    let numTeams = tms.length;

    if (numTeams % 2 !== 0) {
      tms.push({ id: 'bye', name: 'מנוחה (אין משחק)' });
      numTeams++;
    }

    const rounds = numTeams - 1;
    const half = numTeams / 2;
    let newMatches = [];
    let indices = Array.from({ length: numTeams }, (_, i) => i);
    indices.shift(); 

    for (let round = 0; round < rounds; round++) {
      let teamIndices = [0, ...indices];
      for (let i = 0; i < half; i++) {
        let home = tms[teamIndices[i]];
        let away = tms[teamIndices[numTeams - 1 - i]];
        
        if (home.id !== 'bye' && away.id !== 'bye') {
          newMatches.push({
            id: `m_${round}_${home.id}_${away.id}`,
            roundName: `מחזור ${round + 1}`,
            roundDates: getWeekRange(firstSunday, round),
            roundIndex: round,
            homeTeam: home,
            awayTeam: away,
            homeScore: '',
            awayScore: '',
            isPlayed: false,
            type: 'regular'
          });
        }
      }
      indices.push(indices.shift());
    }

    const newMakeupDates = getWeekRange(firstSunday, rounds);
    
    // Save to Firestore
    const batch = writeBatch(db);
    newMatches.forEach(m => {
      const mRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', m.id);
      batch.set(mRef, m);
    });

    const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state');
    batch.update(metaRef, { 
      leagueStage: 'regular', 
      leagueStartDate, 
      makeupDates: newMakeupDates 
    });

    await batch.commit();
    setActiveTab('schedule');
    showMessage('לוח המשחקים נוצר בהצלחה! הליגה החלה.');
  };

  const updateScore = async (matchId, homeScore, awayScore) => {
    if (homeScore === '' || awayScore === '') return showMessage('יש להזין תוצאה לשתי הקבוצות');
    
    const parsedHome = parseInt(homeScore);
    const parsedAway = parseInt(awayScore);
    
    if (isNaN(parsedHome) || isNaN(parsedAway)) return showMessage('יש להזין מספרים חוקיים');
    if (parsedHome === parsedAway) return showMessage('בסטריטבול אין תיקו! נא להזין תוצאה מכריעה.');

    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
    await updateDoc(matchRef, { 
      homeScore: parsedHome, 
      awayScore: parsedAway, 
      isPlayed: true 
    });
    showMessage('התוצאה עודכנה בסנכרון לענן!');
  };

  const moveToMakeupRound = async (matchId) => {
    const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
    await updateDoc(matchRef, { 
      roundName: 'שבוע השלמות', 
      roundDates: makeupDates, 
      roundIndex: 999 
    });
    showMessage('המשחק הועבר למחזור השלמה.');
  };

  const calculateStandings = () => {
    let stats = {};
    teams.forEach(t => {
      stats[t.id] = { ...t, points: 0, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 };
    });

    matches.filter(m => m.isPlayed && m.type === 'regular').forEach(m => {
      const home = m.homeScore;
      const away = m.awayScore;
      const homeId = m.homeTeam.id;
      const awayId = m.awayTeam.id;

      if (!stats[homeId] || !stats[awayId]) return;

      stats[homeId].pf += home;
      stats[homeId].pa += away;
      stats[awayId].pf += away;
      stats[awayId].pa += home;

      if (home > away) {
        stats[homeId].wins += 1;
        stats[homeId].points += 2;
        stats[awayId].losses += 1;
        stats[awayId].points += 1;
      } else if (away > home) {
        stats[awayId].wins += 1;
        stats[awayId].points += 2;
        stats[homeId].losses += 1;
        stats[homeId].points += 1;
      }
    });

    Object.values(stats).forEach(s => { s.diff = s.pf - s.pa; });

    return Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points; 
      if (b.diff !== a.diff) return b.diff - a.diff;         
      return b.pf - a.pf;                                    
    });
  };

  const startFinalFour = async () => {
    const standings = calculateStandings();
    if (standings.length < 4) return showMessage("חייבים לפחות 4 קבוצות בטבלה לפיינל פור");
    
    const top4 = standings.slice(0, 4);
    const semi1 = {
      id: 'ff_semi1', roundName: 'חצי גמר 1', roundDates: 'אירוע שיא - פיינל פור', roundIndex: 1000, homeTeam: top4[0], awayTeam: top4[3], homeScore: '', awayScore: '', isPlayed: false, type: 'finalFour', stage: 'semi'
    };
    const semi2 = {
      id: 'ff_semi2', roundName: 'חצי גמר 2', roundDates: 'אירוע שיא - פיינל פור', roundIndex: 1000, homeTeam: top4[1], awayTeam: top4[2], homeScore: '', awayScore: '', isPlayed: false, type: 'finalFour', stage: 'semi'
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', semi1.id), semi1);
    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'matches', semi2.id), semi2);
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), { leagueStage: 'finalFour' });
    
    await batch.commit();
    setActiveTab('schedule');
    showMessage('הפיינל פור יצא לדרך!');
  };

  const createFinalMatch = async () => {
    const semis = matches.filter(m => m.type === 'finalFour' && m.stage === 'semi' && m.isPlayed);
    if (semis.length !== 2) return showMessage('יש לסיים את שני משחקי חצי הגמר קודם');

    const winner1 = semis[0].homeScore > semis[0].awayScore ? semis[0].homeTeam : semis[0].awayTeam;
    const winner2 = semis[1].homeScore > semis[1].awayScore ? semis[1].homeTeam : semis[1].awayTeam;

    const finalMatch = {
      id: 'ff_final', roundName: 'הגמר הגדול!', roundDates: 'הקרב על האליפות', roundIndex: 1001, homeTeam: winner1, awayTeam: winner2, homeScore: '', awayScore: '', isPlayed: false, type: 'finalFour', stage: 'final'
    };

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', finalMatch.id), finalMatch);
    showMessage('משחק הגמר נוצר בהצלחה!');
  };

  const resetLeagueFull = async () => {
    if(!window.confirm('אזהרה: הפעולה תמחק את כל הנתונים והמשחקים. האם אתה בטוח?')) return;
    
    const batch = writeBatch(db);
    matches.forEach(m => {
      batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'matches', m.id));
    });
    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'meta', 'state'), {
      leagueStage: 'registration',
      leagueStartDate: '',
      makeupDates: ''
    });
    
    await batch.commit();
    showMessage('הליגה אופסה.');
  };

  // --- COMPONENTS ---
  const standings = calculateStandings();
  const groupedMatches = matches.reduce((acc, m) => {
    if (!acc[m.roundName]) acc[m.roundName] = { dates: m.roundDates, matches: [], index: m.roundIndex };
    acc[m.roundName].matches.push(m);
    return acc;
  }, {});

  const sortedGroups = Object.keys(groupedMatches).sort((a, b) => groupedMatches[a].index - groupedMatches[b].index);

  const renderTabs = () => (
    <div className="flex flex-wrap justify-center bg-[#111] border-b border-neutral-800">
      {[
        { id: 'standings', label: 'טבלת הליגה' },
        { id: 'schedule', label: 'לוח משחקים' },
        { id: 'teams', label: 'קבוצות' },
        { id: 'gallery', label: 'גלריה' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`tape px-6 py-4 text-lg font-bold ${activeTab === tab.id ? 'active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
      <div className="flex-grow min-w-[50px]"></div>
      <button
        onClick={toggleAdmin}
        className={`px-6 py-4 text-sm font-bold tracking-wider flex items-center gap-2 border-l border-neutral-800 transition-colors ${
          isAdminMode ? 'bg-red-900/40 text-red-500 hover:bg-red-900/60' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
        }`}
      >
        <Icon name="settings" size={16} />
        {isAdminMode ? 'יציאה מניהול' : 'מנהל'}
      </button>
    </div>
  );

  if (!isDBReady) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white font-bold text-xl">
        מתחבר למגרש... (טוען נתונים מהענן)
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <style>{customStyles}</style>

      {/* HEADER - MATURE STREETBALL BANNER */}
      <header className="relative pt-16 pb-12 px-4 border-b border-neutral-800 bg-black overflow-hidden flex flex-col justify-center items-center">
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/brick-wall-dark.png')]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 to-black/90 z-0"></div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="border-4 border-white p-2 mb-2">
            <h1 className="font-stencil text-7xl md:text-8xl text-white leading-none tracking-widest uppercase">
              סטריטבול <span className="text-[var(--street-orange)]">רגבים</span>
            </h1>
          </div>
          <div className="bg-[var(--street-orange)] text-black font-bold text-lg px-6 py-1 tracking-widest uppercase">
            3X3 OFFICAL LEAGUE
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <div className="max-w-6xl mx-auto sticky top-0 z-50 shadow-xl">
        {renderTabs()}
      </div>

      {/* NOTIFICATION MODAL */}
      {notification && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] bg-[var(--street-orange)] text-black font-bold px-8 py-4 shadow-xl flex items-center gap-3">
          <Icon name="check" size={20} />
          <span className="text-lg">{notification}</span>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
          <div className="bg-neutral-900 border-2 border-[var(--street-orange)] p-8 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 left-4 text-neutral-500 hover:text-white"
            >
              <Icon name="x" size={24} />
            </button>
            <h3 className="text-3xl font-stencil text-[var(--street-orange)] mb-6 text-center tracking-wider">כניסת הנהלה</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-neutral-400 text-sm font-bold mb-2">שם משתמש</label>
                <input 
                  type="text" 
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full bg-black border border-neutral-700 text-white p-3 focus:border-[var(--street-orange)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm font-bold mb-2">סיסמה</label>
                <input 
                  type="password" 
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full bg-black border border-neutral-700 text-white p-3 focus:border-[var(--street-orange)] focus:outline-none"
                  dir="ltr"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (adminUser === 'אדמין' && adminPass === '010608') {
                        setIsAdminMode(true);
                        setShowLoginModal(false);
                        setAdminUser('');
                        setAdminPass('');
                      } else {
                        showMessage('שם משתמש או סיסמה שגויים');
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (adminUser === 'אדמין' && adminPass === '010608') {
                  setIsAdminMode(true);
                  setShowLoginModal(false);
                  setAdminUser('');
                  setAdminPass('');
                } else {
                  showMessage('שם משתמש או סיסמה שגויים');
                }
              }}
              className="w-full bg-[var(--street-orange)] text-black font-bold text-lg py-3 uppercase tracking-wider hover:bg-white transition-colors"
            >
              התחבר
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto p-4 mt-8 relative z-10">
        
        {/* === STANDINGS TAB === */}
        {activeTab === 'standings' && (
          <div className="space-y-6 animate-fade-in relative">
            <div className="flex items-center gap-3 border-b-2 border-neutral-800 pb-4">
              <Icon name="trophy" className="text-[var(--street-orange)]" size={28} />
              <h2 className="text-4xl font-stencil text-white tracking-wide">טבלת הליגה</h2>
            </div>
            
            <div className="street-card-light overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b-2 border-neutral-300 bg-neutral-200">
                      <th className="py-4 px-6 font-bold text-neutral-600">מקום</th>
                      <th className="py-4 px-6 font-bold text-neutral-800">קבוצה</th>
                      <th className="py-4 px-6 font-bold text-center text-black">נק'</th>
                      <th className="py-4 px-6 font-bold text-center text-neutral-600">נצחונות</th>
                      <th className="py-4 px-6 font-bold text-center text-neutral-600">הפסדים</th>
                      <th className="py-4 px-6 font-bold text-center text-neutral-600">הפרש</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-12 text-lg font-bold text-neutral-400">טרם נרשמו קבוצות</td></tr>
                    ) : (
                      standings.map((team, index) => (
                        <tr key={team.id} className={`border-b border-neutral-300 hover:bg-white transition-colors ${index < 4 && leagueStage !== 'registration' ? 'bg-orange-50' : 'bg-transparent'}`}>
                          <td className="py-4 px-6">
                            <span className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-[var(--street-orange)] text-white' : index < 4 ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bold text-lg text-black">{team.name}</td>
                          <td className="py-4 px-6 text-center text-2xl font-black text-[var(--street-orange)]">{team.points}</td>
                          <td className="py-4 px-6 text-center text-neutral-800 font-bold">{team.wins}</td>
                          <td className="py-4 px-6 text-center text-neutral-800 font-bold">{team.losses}</td>
                          <td className="py-4 px-6 text-center font-bold text-neutral-500" dir="ltr">{team.diff > 0 ? `+${team.diff}` : team.diff}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {leagueStage !== 'registration' && (
              <div className="text-sm font-bold text-neutral-500 flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-[var(--street-orange)]"></div>
                מקומות 1-4 עולים לפיינל פור בסיום העונה
              </div>
            )}
          </div>
        )}

        {/* === SCHEDULE TAB === */}
        {activeTab === 'schedule' && (
          <div className="space-y-8 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <Icon name="calendar-days" className="text-[var(--street-orange)]" size={28} />
                <h2 className="text-4xl font-stencil text-white tracking-wide">זירת הקרבות</h2>
              </div>
              
              {isAdminMode && leagueStage === 'regular' && (
                <button 
                  onClick={startFinalFour}
                  className="bg-white text-black font-bold px-6 py-2 border-2 border-transparent hover:border-white hover:bg-black hover:text-white transition-all text-sm uppercase tracking-wider"
                >
                  הפעל פיינל פור
                </button>
              )}
              
              {isAdminMode && leagueStage === 'finalFour' && matches.filter(m => m.stage === 'semi' && m.isPlayed).length === 2 && !matches.some(m => m.stage === 'final') && (
                <button 
                  onClick={createFinalMatch}
                  className="bg-[var(--street-yellow)] text-black font-bold px-6 py-2 border-2 border-[var(--street-yellow)] hover:bg-black hover:text-[var(--street-yellow)] transition-all text-sm uppercase tracking-wider flex items-center gap-2"
                >
                  <Icon name="play" size={16} />
                  צור משחק גמר
                </button>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-20 street-card">
                <div className="flex justify-center mb-4"><Icon name="shield-alert" size={48} className="text-neutral-600" /></div>
                <h3 className="text-xl font-bold text-neutral-400 mb-2">לוח המשחקים טרם נקבע</h3>
                {isAdminMode && leagueStage === 'registration' && (
                  <button onClick={generateSchedule} className="mt-6 bg-[var(--street-orange)] text-white font-bold px-8 py-3 hover:bg-[#e64a19] transition-colors">
                    הגרל משחקים כעת
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-12">
                {sortedGroups.map((roundName, idx) => {
                  const group = groupedMatches[roundName];
                  return (
                  <div key={idx} className="space-y-4 relative">
                    <div className="flex items-baseline gap-4 mb-4">
                      <h3 className="text-3xl font-stencil text-[var(--street-orange)] tracking-wider">
                        {roundName}
                      </h3>
                      <span className="text-sm font-bold text-neutral-500">{group.dates}</span>
                      <div className="h-px bg-neutral-800 flex-grow ml-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {group.matches.map((match) => (
                        <div key={match.id} className={`street-card p-5 ${match.isPlayed ? 'border-neutral-700 bg-neutral-900/50' : 'border-[var(--street-orange)]'}`}>
                          <div className="flex flex-col gap-4 relative z-10">
                            <div className="flex justify-between items-center text-center">
                              {/* Home Team */}
                              <div className="flex-1">
                                <h4 className="font-bold text-xl text-white">{match.homeTeam.name}</h4>
                              </div>
                              
                              {/* Score / VS */}
                              <div className="flex-shrink-0 px-4">
                                {match.isPlayed ? (
                                  <div className="flex items-center justify-center gap-3 bg-black px-4 py-2 border border-neutral-700">
                                    <span className={`text-2xl font-black ${match.homeScore > match.awayScore ? 'text-[var(--street-orange)]' : 'text-neutral-500'}`}>{match.homeScore}</span>
                                    <span className="text-neutral-600 font-bold">-</span>
                                    <span className={`text-2xl font-black ${match.awayScore > match.homeScore ? 'text-[var(--street-orange)]' : 'text-neutral-500'}`}>{match.awayScore}</span>
                                  </div>
                                ) : (
                                  <span className="font-stencil text-2xl text-neutral-600 tracking-widest">VS</span>
                                )}
                              </div>
                              
                              {/* Away Team */}
                              <div className="flex-1">
                                <h4 className="font-bold text-xl text-white">{match.awayTeam.name}</h4>
                              </div>
                            </div>
                            
                            {/* Score Input Area */}
                            {!match.isPlayed && (
                              <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-4">
                                <div className="flex items-center justify-center gap-4">
                                  <input 
                                    type="number" min="0" placeholder="0" id={`home_${match.id}`}
                                    className="w-16 h-12 bg-black border border-neutral-700 text-center text-xl font-bold text-white focus:border-[var(--street-orange)] focus:outline-none"
                                  />
                                  <span className="text-sm font-bold text-neutral-500">תוצאה</span>
                                  <input 
                                    type="number" min="0" placeholder="0" id={`away_${match.id}`}
                                    className="w-16 h-12 bg-black border border-neutral-700 text-center text-xl font-bold text-white focus:border-[var(--street-orange)] focus:outline-none"
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <button 
                                    onClick={() => {
                                      const h = document.getElementById(`home_${match.id}`).value;
                                      const a = document.getElementById(`away_${match.id}`).value;
                                      updateScore(match.id, h, a);
                                    }}
                                    className="flex-1 bg-neutral-800 text-white py-2 text-sm font-bold border border-neutral-700 hover:bg-[var(--street-orange)] hover:border-[var(--street-orange)] transition-colors"
                                  >
                                    עדכן תוצאה עכשיו
                                  </button>
                                  {match.type === 'regular' && match.roundName !== 'שבוע השלמות' && isAdminMode && (
                                    <button 
                                      onClick={() => moveToMakeupRound(match.id)}
                                      className="px-4 bg-transparent text-neutral-400 text-sm font-bold border border-neutral-700 hover:text-white hover:border-neutral-500 transition-colors"
                                    >
                                      דחה משחק
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )})}
                
                {/* Empty Makeup Week Placeholder */}
                {leagueStage === 'regular' && makeupDates && !groupedMatches['שבוע השלמות'] && (
                  <div className="space-y-4 relative opacity-60">
                     <div className="flex items-baseline gap-4 mb-4">
                      <h3 className="text-3xl font-stencil text-neutral-500 tracking-wider">
                        שבוע השלמות
                      </h3>
                      <span className="text-sm font-bold text-neutral-600">{makeupDates}</span>
                      <div className="h-px bg-neutral-800 flex-grow ml-4"></div>
                    </div>
                    <div className="street-card p-6 text-center border-dashed border-neutral-700">
                      <p className="font-bold text-neutral-500">המגרש פנוי. אין משחקי השלמה בינתיים.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* === TEAMS TAB === */}
        {activeTab === 'teams' && (
          <div className="space-y-6 animate-fade-in relative">
            <div className="flex items-center gap-3 border-b-2 border-neutral-800 pb-4 mb-6">
              <Icon name="users" className="text-[var(--street-orange)]" size={28} />
              <h2 className="text-4xl font-stencil text-white tracking-wide">הקבוצות</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team.id} className="street-card p-0 overflow-hidden group">
                  {isAdminMode && leagueStage === 'registration' && (
                    <button onClick={() => handleDeleteTeam(team.id)} className="absolute top-3 left-3 bg-red-600/80 text-white w-8 h-8 flex items-center justify-center rounded-sm hover:bg-red-600 transition-colors z-20">
                      <Icon name="x" size={16} />
                    </button>
                  )}
                  
                  {/* Team Header */}
                  <div className="bg-neutral-900 border-b-2 border-[var(--street-orange)] py-6 px-4 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--street-orange)] opacity-0 group-hover:opacity-5 transition-opacity"></div>
                    <h3 className="text-3xl font-stencil text-white tracking-widest uppercase">
                      {team.name}
                    </h3>
                  </div>

                  {/* Player List */}
                  <div className="p-5 bg-black">
                    <ul className="space-y-2">
                      {team.players.map((player, idx) => (
                        <li key={idx} className="font-bold text-neutral-300 text-sm flex items-center gap-3 bg-neutral-900 p-2 border border-neutral-800">
                          <span className="text-[var(--street-orange)] font-stencil text-lg w-4">{idx + 1}</span> 
                          <span>{player}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}

              {teams.length === 0 && (
                <div className="col-span-full text-center py-20 font-bold text-neutral-500 border border-dashed border-neutral-800 bg-neutral-900/50">
                  לא נרשמו קבוצות עדיין.
                </div>
              )}
            </div>
          </div>
        )}

        {/* === GALLERY TAB === */}
        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b-2 border-neutral-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Icon name="image" className="text-[var(--street-orange)]" size={28} />
                <h2 className="text-4xl font-stencil text-white tracking-wide">גלריה</h2>
              </div>
              
              <label className="bg-white text-black cursor-pointer hover:bg-neutral-200 transition-colors flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase tracking-wider">
                <Icon name="camera" size={18} />
                העלה תמונות
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {gallery.map((imgUrl, idx) => (
                <div key={idx} className="polaroid group cursor-pointer relative">
                  <div className="aspect-square overflow-hidden bg-neutral-100">
                    <img src={imgUrl} alt={`סטריטבול ${idx}`} className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-300" />
                  </div>
                  <div className="text-center mt-3">
                    <span className="text-neutral-500 font-bold text-xs uppercase tracking-widest">תמונה {gallery.length - idx}</span>
                  </div>
                </div>
              ))}
              
              {gallery.length === 0 && (
                <div className="col-span-full text-center py-24 border border-dashed border-neutral-800 bg-neutral-900/30">
                  <div className="flex justify-center mb-4"><Icon name="camera" size={48} className="text-neutral-600" /></div>
                  <p className="font-bold text-neutral-400 text-lg">הגלריה ריקה.</p>
                  <p className="text-neutral-500 text-sm mt-1">העלו תמונות כדי לייצר אווירה</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === ADMIN TOOLS (Only visible in admin mode) === */}
        {isAdminMode && (
          <div className="mt-16 border-t border-neutral-800 pt-8 relative">
            <div className="caution-bg h-2 w-full absolute top-0 left-0"></div>
            
            <div className="bg-neutral-900 p-6 border border-neutral-800 relative shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Icon name="settings" size={20} className="text-neutral-400" />
                פאנל ניהול הליגה
              </h3>

              {leagueStage === 'registration' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Add Team Form */}
                  <div className="bg-black p-6 border border-neutral-800">
                    <h4 className="text-lg font-bold text-white mb-4 border-b border-neutral-800 pb-2">רישום קבוצה חדשה</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-neutral-400 mb-1">שם הקבוצה</label>
                        <input 
                          type="text" 
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700 text-white p-2 text-sm focus:border-[var(--street-orange)] focus:outline-none"
                          placeholder="הזן שם..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-neutral-400 mb-1">שחקני הקבוצה (עד 4)</label>
                        <div className="space-y-2">
                          {[0, 1, 2, 3].map(idx => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-neutral-600 text-xs w-4">{idx+1}.</span>
                              <input 
                                type="text" 
                                value={newPlayers[idx]}
                                onChange={(e) => handlePlayerChange(idx, e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2 text-sm focus:border-neutral-500 focus:outline-none"
                                placeholder={`שם שחקן`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={handleAddTeam}
                        className="w-full bg-white text-black font-bold text-sm py-3 mt-4 hover:bg-neutral-200 transition-colors"
                      >
                        + הוסף קבוצה למסד הנתונים
                      </button>
                    </div>
                  </div>

                  {/* Start League Action */}
                  <div className="bg-[var(--street-orange)] p-6 flex flex-col justify-center items-center text-center text-black">
                    <h4 className="text-3xl font-stencil mb-2 uppercase tracking-wider">מוכנים להתחיל?</h4>
                    <p className="font-bold text-sm text-black/70 mb-6">
                      רשומות כרגע <span className="text-white text-lg mx-1">{teams.length}</span> קבוצות למשחק.
                    </p>
                    
                    <div className="w-full bg-black/10 p-4 border border-black/20 mb-6 text-right">
                      <label className="block text-sm font-bold text-black mb-1">תאריך פתיחת הליגה:</label>
                      <input 
                        type="date" 
                        value={leagueStartDate}
                        onChange={(e) => setLeagueStartDate(e.target.value)}
                        className="w-full bg-white text-black p-2 text-sm border-none focus:outline-none"
                      />
                    </div>

                    <button 
                      onClick={generateSchedule}
                      disabled={teams.length < 2 || !leagueStartDate}
                      className="bg-black text-white font-bold text-sm uppercase tracking-wider py-4 px-8 hover:bg-neutral-800 transition-colors disabled:opacity-50 w-full"
                    >
                      צור לוח משחקים בענן
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-black p-6 text-center border border-neutral-800">
                  <p className="font-bold text-neutral-400 mb-4 text-sm">הליגה החלה. נהל משחקים תחת לשונית "לוח משחקים".</p>
                  <button 
                    onClick={resetLeagueFull}
                    className="bg-transparent text-red-500 font-bold text-sm px-6 py-2 border border-red-500/50 hover:bg-red-900/20 transition-all"
                  >
                    איפוס ליגה מלא (מחיקת מסד הנתונים)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}