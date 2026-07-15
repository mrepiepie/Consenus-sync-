import React, { useState, useEffect, useRef } from 'react';
import { calculateResentmentMinimizer, calculateDebtSettlement } from './utils/algorithms';
import { 
  Layers, Wallet, Sparkles, Plus, Trash2, ShieldAlert, Award, RotateCcw, CreditCard, Users, ChevronRight, HelpCircle, ArrowRight, ArrowLeft
} from 'lucide-react';
import gsap from 'gsap';

const DEFAULT_MEMBERS = ['Alex', 'Blake', 'Charlie', 'Dana'];
const DEFAULT_OPTIONS = ['Sushi Palace', 'Burger Joint', 'Taco Express', 'Pasta House'];
const DEFAULT_EXPENSES = [
  { id: '1', description: 'Group Lunch', amount: 80, paidBy: 'Alex', splitAmong: ['Alex', 'Blake', 'Charlie', 'Dana'] },
  { id: '2', description: 'Cab Ride', amount: 30, paidBy: 'Blake', splitAmong: ['Alex', 'Blake', 'Charlie'] },
  { id: '3', description: 'Snacks & Drinks', amount: 45, paidBy: 'Charlie', splitAmong: ['Charlie', 'Dana'] }
];

const TUTORIAL_STEPS = [
  {
    title: "Step 1: The Group Directory",
    desc: "Start by entering all group members here. This list synchronizes immediately to both calculators, ensuring names always match perfectly.",
    target: "step-directory"
  },
  {
    title: "Step 2: Restaurant Ballots & Vetoes",
    desc: "In the Dinner Decider, add restaurants. You can veto options to instantly eliminate them, or rank them to find the winner.",
    target: "step-decider"
  },
  {
    title: "Step 3: Expenses Ledger",
    desc: "In the Expense Splitter, record bills. Select who paid and split the amount among specific members.",
    target: "step-splitter"
  },
  {
    title: "Step 4: Simplified Settlements",
    desc: "The algorithm instantly consolidates all transactions to give the absolute minimum number of payments required.",
    target: "step-settlements"
  }
];

function App() {
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('resolve_members');
    return saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
  });

  const [newMemberName, setNewMemberName] = useState('');
  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem('resolve_options');
    return saved ? JSON.parse(saved) : DEFAULT_OPTIONS;
  });
  const [newOptionName, setNewOptionName] = useState('');

  const [participants, setParticipants] = useState(() => {
    const saved = localStorage.getItem('resolve_participants');
    if (saved) return JSON.parse(saved);
    return DEFAULT_MEMBERS.map(name => ({
      id: name,
      name,
      veto: name === 'Alex' ? 'Sushi Palace' : name === 'Charlie' ? 'Burger Joint' : '',
      preferences: [...DEFAULT_OPTIONS]
    }));
  });

  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [editVeto, setEditVeto] = useState('');
  const [editPrefs, setEditPrefs] = useState([]);

  // Expense Splitter State
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('resolve_expenses');
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
  });

  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [payer, setPayer] = useState('');
  const [splitList, setSplitList] = useState([]);

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(0);

  // Parallax mouse variables
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  const deciderResultsRef = useRef(null);
  const splitterResultsRef = useRef(null);
  const canvasRef = useRef(null);
  const heroTextRef = useRef(null);

  // Sync state with LocalStorage
  useEffect(() => {
    localStorage.setItem('resolve_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('resolve_options', JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    localStorage.setItem('resolve_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('resolve_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Sync participants and expense payer options when members modify
  useEffect(() => {
    setParticipants(prev => {
      const activeIds = new Set(members);
      let updated = prev.filter(p => activeIds.has(p.id));
      members.forEach(name => {
        if (!updated.some(p => p.id === name)) {
          updated.push({
            id: name,
            name,
            veto: '',
            preferences: [...options]
          });
        }
      });
      return updated;
    });

    if (members.length > 0) {
      if (!payer || !members.includes(payer)) {
        setPayer(members[0]);
      }
      setSplitList(members);
    } else {
      setPayer('');
      setSplitList([]);
    }
  }, [members]);

  useEffect(() => {
    setParticipants(prev => prev.map(p => {
      let filtered = p.preferences.filter(o => options.includes(o));
      options.forEach(o => {
        if (!filtered.includes(o)) filtered.push(o);
      });
      return { ...p, preferences: filtered };
    }));
  }, [options]);

  // GSAP Title and text entrance animation + Mouse Parallax
  useEffect(() => {
    if (heroTextRef.current) {
      const elements = heroTextRef.current.querySelectorAll('.gsap-reveal');
      gsap.fromTo(elements, 
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );
    }

    const handleParallaxMove = (e) => {
      const factor = 18;
      const x = (window.innerWidth / 2 - e.clientX) / factor;
      const y = (window.innerHeight / 2 - e.clientY) / factor;
      setParallaxOffset({ x, y });
    };

    window.addEventListener('mousemove', handleParallaxMove);
    return () => window.removeEventListener('mousemove', handleParallaxMove);
  }, []);

  // Interactive Background Canvas logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = 80;
    const maxDistance = 110;
    const mouse = { x: null, y: null, radius: 155 };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 0.8;
        this.originalSize = this.size;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * force * 3;
            this.y += Math.sin(angle) * force * 3;
            this.size = this.originalSize * 1.6;
          } else {
            this.size = this.originalSize;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const alpha = (1 - dist / maxDistance) * 0.16;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Shared Member Controls
  const addMember = () => {
    const trimmed = newMemberName.trim();
    if (trimmed && !members.includes(trimmed)) {
      setMembers([...members, trimmed]);
      setNewMemberName('');
    }
  };

  const removeMember = (name) => {
    setMembers(members.filter(m => m !== name));
    setExpenses(expenses.map(exp => ({
      ...exp,
      paidBy: exp.paidBy === name ? (members.find(m => m !== name) || '') : exp.paidBy,
      splitAmong: exp.splitAmong.filter(m => m !== name)
    })).filter(exp => exp.paidBy !== ''));

    if (editingParticipantId === name) {
      setEditingParticipantId(null);
    }
  };

  const addOption = () => {
    const trimmed = newOptionName.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions([...options, trimmed]);
      setNewOptionName('');
    }
  };

  const removeOption = (name) => {
    setOptions(options.filter(o => o !== name));
  };

  const startEditParticipant = (p) => {
    setEditingParticipantId(p.id);
    setEditVeto(p.veto);
    const missing = options.filter(o => !p.preferences.includes(o));
    setEditPrefs([...p.preferences, ...missing].filter(o => options.includes(o)));
  };

  const saveParticipantEdit = () => {
    setParticipants(participants.map(p => {
      if (p.id === editingParticipantId) {
        return { ...p, veto: editVeto, preferences: editPrefs };
      }
      return p;
    }));
    setEditingParticipantId(null);
  };

  const movePref = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= editPrefs.length) return;
    const updated = [...editPrefs];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setEditPrefs(updated);
  };

  const addExpense = () => {
    const parsedAmt = Number(amt);
    if (desc.trim() && parsedAmt > 0 && payer && splitList.length > 0) {
      setExpenses([...expenses, {
        id: 'exp_' + Date.now(),
        description: desc.trim(),
        amount: parsedAmt,
        paidBy: payer,
        splitAmong: [...splitList]
      }]);
      setDesc('');
      setAmt('');
    }
  };

  const removeExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const toggleSplitPerson = (name) => {
    if (splitList.includes(name)) {
      setSplitList(splitList.filter(n => n !== name));
    } else {
      setSplitList([...splitList, name]);
    }
  };

  const resetToDefault = () => {
    setMembers(DEFAULT_MEMBERS);
    setOptions(DEFAULT_OPTIONS);
    setExpenses(DEFAULT_EXPENSES);
    setEditingParticipantId(null);
  };

  const diningResults = calculateResentmentMinimizer(options, participants.map(p => p.preferences), participants.filter(p => p.veto).map(p => p.veto));
  const settlements = calculateDebtSettlement(expenses, members);

  // Focus highlighters for tutorial walkthrough
  const highlightStep = (targetId) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // GSAP Highlight effect
      gsap.fromTo(el, 
        { outline: '2px solid rgba(99, 102, 241, 0)' },
        { outline: '2px solid rgba(99, 102, 241, 1)', duration: 0.4, yoyo: true, repeat: 3 }
      );
    }
  };

  useEffect(() => {
    if (showTutorial) {
      highlightStep(TUTORIAL_STEPS[tutorialIndex].target);
    }
  }, [tutorialIndex, showTutorial]);

  return (
    <div className="min-h-screen text-gray-150 flex flex-col relative overflow-hidden bg-black font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Interactive canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" style={{ pointerEvents: 'none' }} />

      {/* Parallax Floating Glow Blob */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)] blur-[90px] pointer-events-none z-0"
        style={{
          transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
          transition: 'transform 0.1s ease-out',
          top: '20%',
          left: '10%'
        }}
      />

      {/* Top Neon Border Gradient */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 shadow-[0_3px_20px_rgba(99,102,241,0.5)]" />

      {/* Header bar */}
      <header className="relative z-50 border-b border-zinc-900 bg-black/85 backdrop-blur-xl sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* 4-Diamond Logo */}
            <div className="grid grid-cols-2 gap-1 w-7.5 h-7.5 logo-rotate relative">
              <div className="w-3.5 h-3.5 bg-indigo-500 rounded-[4px] rotate-45 transform origin-center shadow-[0_0_14px_rgba(99,102,241,0.75)]" />
              <div className="w-3.5 h-3.5 bg-teal-500 rounded-[4px] rotate-45 transform origin-center shadow-[0_0_14px_rgba(20,184,166,0.75)]" />
              <div className="w-3.5 h-3.5 bg-orange-500 rounded-[4px] rotate-45 transform origin-center shadow-[0_0_14px_rgba(249,115,22,0.75)]" />
              <div className="w-3.5 h-3.5 bg-violet-500 rounded-[4px] rotate-45 transform origin-center shadow-[0_0_14px_rgba(139,92,246,0.75)]" />
            </div>
            <div className="flex items-baseline gap-1.5 ml-1">
              <span className="font-extrabold text-2xl tracking-tight text-white bg-clip-text">Resolve</span>
              <span className="text-gray-550 text-xs font-semibold lowercase tracking-wider">loyalty</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setShowTutorial(true);
                setTutorialIndex(0);
              }}
              className="flex items-center gap-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-600/20 text-indigo-400 px-4.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" /> Start Tutorial
            </button>
            <button 
              onClick={resetToDefault}
              className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 hover:text-white text-gray-400 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shadow-inner"
            >
              <RotateCcw className="h-3.5 w-3.5 text-indigo-400" /> Refresh App
            </button>
          </div>
        </div>
      </header>

      {/* Core Dashboard Workspace */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-10 space-y-8">
        
        {/* Interactive Tutorial Modal / Banner */}
        {showTutorial && (
          <div className="border border-indigo-500/30 bg-indigo-950/20 p-6 rounded-2xl relative overflow-hidden shadow-2xl animate-fade-in z-45">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-wider mb-1">
                  {TUTORIAL_STEPS[tutorialIndex].title}
                </h3>
                <p className="text-gray-300 text-sm max-w-3xl leading-relaxed">
                  {TUTORIAL_STEPS[tutorialIndex].desc}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  disabled={tutorialIndex === 0}
                  onClick={() => setTutorialIndex(prev => prev - 1)}
                  className="bg-zinc-900 border border-zinc-800 disabled:opacity-40 text-gray-300 p-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                {tutorialIndex < TUTORIAL_STEPS.length - 1 ? (
                  <button 
                    onClick={() => setTutorialIndex(prev => prev + 1)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    Next Step <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowTutorial(false)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Got It!
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Intro Premium Hero Box */}
        <div ref={heroTextRef} className="border border-zinc-900 bg-gradient-to-br from-zinc-950 to-black p-8 rounded-2xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 gsap-reveal opacity-0">
            <span className="px-2.5 py-0.5 bg-indigo-950/50 text-indigo-400 border border-indigo-900/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Smart Engine
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3 gsap-reveal opacity-0">
            <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
            Decide Venues &amp; Split Debts Dynamically
          </h2>
          <p className="text-gray-400 text-sm max-w-3xl leading-relaxed mt-2.5 gsap-reveal opacity-0">
            Synchronize your friends once, then decide where to go and settle splits simultaneously. Drag, drop, veto, and consolidated settlements will follow your group automatically.
          </p>
        </div>

        {/* SECTION 1: Shared Group Members Panel */}
        <div id="step-directory" className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-2xl relative transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                1. Group Directory
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-mono bg-zinc-900/60 border border-zinc-800/80 px-2.5 py-1 rounded-lg">
                Active: {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
              <button 
                onClick={() => setMembers([])}
                className="bg-red-950/40 border border-red-900/30 hover:border-red-500/50 hover:bg-red-950/60 text-red-400 px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-md">
            <input 
              type="text" 
              value={newMemberName} 
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Add member name..."
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500 transition-colors shadow-inner"
            />
            <button 
              onClick={addMember}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Member
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {members.map(m => (
              <div key={m} className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 px-4 py-2.5 rounded-xl text-xs transition-all">
                <span className="text-white font-semibold">{m}</span>
                <button 
                  onClick={() => removeMember(m)} 
                  className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer font-bold w-4 h-4 rounded-full bg-zinc-950 flex items-center justify-center text-[10px]"
                >
                  &times;
                </button>
              </div>
            ))}
            {members.length === 0 && (
              <span className="text-xs text-gray-600 italic">No members in directory. Add members to start.</span>
            )}
          </div>
        </div>

        {/* SECTION 2 & 3 Side by Side Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SECTION 2: DINNER DECIDER */}
          <div id="step-decider" className="lg:col-span-5 space-y-6 transition-all duration-300">
            <div className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    2. Dinner Decider
                  </h3>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">Borda Consensus Engine</span>
              </div>

              {/* Add Restaurant Option */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Restaurant Options</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newOptionName} 
                    onChange={(e) => setNewOptionName(e.target.value)}
                    placeholder="Add option/venue..."
                    className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
                  />
                  <button 
                    onClick={addOption}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {options.map(opt => (
                    <div key={opt} className="flex items-center gap-1.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850 text-xs">
                      <span className="font-semibold text-white">{opt}</span>
                      <button 
                        onClick={() => removeOption(opt)}
                        className="text-gray-500 hover:text-red-400 font-bold text-[10px]"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Config ballots */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Member Preferences</label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                  {participants.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => startEditParticipant(p)}
                      className={`flex justify-between items-center p-3 rounded-xl border text-xs cursor-pointer transition-all duration-200 ${
                        editingParticipantId === p.id 
                        ? 'bg-indigo-955/20 border-indigo-500/80 shadow-md shadow-indigo-500/5' 
                        : 'bg-zinc-900/40 border-zinc-850 hover:border-indigo-500/40'
                      }`}
                    >
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-500">
                          {p.veto ? `Veto: ${p.veto}` : 'No veto'}
                        </span>
                        <ChevronRight className="h-3 w-3 text-gray-550" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preference Editor Box */}
              {editingParticipantId && (
                <div className="border border-indigo-500/20 bg-indigo-955/10 p-4 rounded-xl space-y-4 animate-fade-in text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Ballot for {editingParticipantId}</span>
                    <button 
                      onClick={saveParticipantEdit}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                    >
                      Save Preferences
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Veto</label>
                      <select 
                        value={editVeto} 
                        onChange={(e) => setEditVeto(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="">No veto</option>
                        {options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rankings</label>
                      <div className="space-y-1">
                        {editPrefs.map((pref, idx) => (
                          <div key={pref} className="flex justify-between items-center bg-black/60 p-2 rounded border border-zinc-850 text-[10px]">
                            <span className="text-gray-300 font-semibold">{idx+1}. {pref}</span>
                            <div className="flex gap-0.5">
                              <button disabled={idx===0} onClick={()=>movePref(idx, -1)} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white px-1.5 py-0.5 rounded text-[9px] cursor-pointer">▲</button>
                              <button disabled={idx===editPrefs.length-1} onClick={()=>movePref(idx, 1)} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white px-1.5 py-0.5 rounded text-[9px] cursor-pointer">▼</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Consensus Results Section */}
              <div ref={deciderResultsRef} className="border border-zinc-850 bg-zinc-950/60 p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-indigo-400" />
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Calculated Consensus Choice</h4>
                </div>
                {diningResults.winner ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-indigo-650/5 border border-indigo-500/10 p-4 rounded-xl">
                      <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow shadow-indigo-600/25">
                        ★
                      </div>
                      <div>
                        <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Consensus Winner</div>
                        <div className="text-lg font-bold text-white">{diningResults.winner}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      {diningResults.ranked.map((r, i) => (
                        <div key={r.name} className="flex justify-between items-center text-xs bg-black p-2.5 rounded-lg border border-zinc-850">
                          <span className="font-semibold text-gray-300">#{i + 1} {r.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{r.score} pts</span>
                            <span className="text-[9px] text-gray-500 font-mono">Var: {r.variance}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-600 py-4 italic">No consensus reached. Try removing vetoes or adding options.</div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: EXPENSE SPLITTER */}
          <div id="step-splitter" className="lg:col-span-7 space-y-6 transition-all duration-300">
            <div className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    3. Expense Splitter
                  </h3>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">Debt Simplifier Algorithm</span>
              </div>

              {/* Add Expense Fields */}
              <div className="space-y-4 text-xs">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Add Shared Expense</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Description</label>
                    <input 
                      type="text"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="e.g. Uber, Rent, Dinner..."
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Amount ($)</label>
                    <input 
                      type="number"
                      value={amt}
                      onChange={(e) => setAmt(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500 shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Paid By</label>
                    <select 
                      value={payer}
                      onChange={(e) => setPayer(e.target.value)}
                      className="w-full bg-black border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    >
                      {members.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Split Among</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-black border border-zinc-850 p-2.5 rounded-xl max-h-24 overflow-y-auto">
                      {members.map(m => (
                        <label key={m} className="flex items-center gap-1.5 text-[10px] text-gray-300 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={splitList.includes(m)}
                            onChange={() => toggleSplitPerson(m)}
                            className="rounded border-zinc-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-3 h-3"
                          />
                          <span className="truncate">{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={addExpense}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  Add Expense
                </button>
              </div>

              {/* Ledger lists and debt simplification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Ledger Column */}
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ledger Ledger</label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {expenses.map(exp => (
                      <div key={exp.id} className="flex justify-between items-center bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 text-xs animate-fade-in">
                        <div className="truncate pr-1.5">
                          <div className="font-semibold text-white">{exp.description}</div>
                          <div className="text-[9px] text-gray-500 mt-1 truncate">
                            Paid by <span className="text-indigo-400">{exp.paidBy}</span> &middot; Split: {exp.splitAmong.join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">${exp.amount}</span>
                          <button 
                            onClick={() => removeExpense(exp.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors duration-150 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {expenses.length === 0 && (
                      <div className="text-center text-xs text-gray-600 py-6 italic border border-dashed border-zinc-850 rounded-xl">No expenses recorded.</div>
                    )}
                  </div>
                </div>

                {/* Settlements Column */}
                <div id="step-settlements" className="space-y-3 transition-all duration-300">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-indigo-400" />
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Settlements Ledger</label>
                  </div>
                  <div ref={splitterResultsRef} className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {settlements.map((settle, idx) => (
                      <div key={idx} className="settlement-item flex items-center justify-between p-3.5 rounded-xl border border-indigo-500/10 bg-indigo-650/5 text-xs">
                        <div className="flex items-center gap-1.5 truncate pr-1">
                          <span className="font-extrabold text-white truncate">{settle.from}</span>
                          <span className="text-gray-500 text-[10px] flex-shrink-0">pays</span>
                          <span className="font-extrabold text-emerald-400 truncate">{settle.to}</span>
                        </div>
                        <div className="text-white font-bold bg-indigo-950/40 border border-indigo-900/20 px-2.5 py-1 rounded-lg text-[10px] flex-shrink-0">
                          ${settle.amount}
                        </div>
                      </div>
                    ))}
                    {settlements.length === 0 && (
                      <div className="text-center text-xs text-gray-600 py-6 italic border border-dashed border-zinc-850 rounded-xl">All balances settled.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-950 bg-black/40 py-6 text-center text-xs text-gray-600">
        Resolve decision-making platform &copy; {new Date().getFullYear()} &middot; Built for Club Application
      </footer>
    </div>
  );
}

export default App;
