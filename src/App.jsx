import React, { useState, useEffect, useRef } from 'react';
import { calculateResentmentMinimizer, calculateDebtSettlement } from './utils/algorithms';
import { 
  Layers, Wallet, Sparkles, Plus, Trash2, ShieldAlert, Award, RotateCcw, CreditCard, Users
} from 'lucide-react';
import gsap from 'gsap';

const DEFAULT_MEMBERS = ['Alex', 'Blake', 'Charlie', 'Dana'];
const DEFAULT_OPTIONS = ['Sushi Palace', 'Burger Joint', 'Taco Express', 'Pasta House'];
const DEFAULT_EXPENSES = [
  { id: '1', description: 'Group Lunch', amount: 80, paidBy: 'Alex', splitAmong: ['Alex', 'Blake', 'Charlie', 'Dana'] },
  { id: '2', description: 'Cab Ride', amount: 30, paidBy: 'Blake', splitAmong: ['Alex', 'Blake', 'Charlie'] },
  { id: '3', description: 'Snacks & Drinks', amount: 45, paidBy: 'Charlie', splitAmong: ['Charlie', 'Dana'] }
];

function App() {
  // Shared single source of truth for group members
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('resolve_members');
    return saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
  });

  const [newMemberName, setNewMemberName] = useState('');

  // Dinner Decider State
  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem('resolve_options');
    return saved ? JSON.parse(saved) : DEFAULT_OPTIONS;
  });
  const [newOptionName, setNewOptionName] = useState('');

  const [participants, setParticipants] = useState(() => {
    const saved = localStorage.getItem('resolve_participants');
    if (saved) return JSON.parse(saved);
    // Initialize preferences mapped to default options
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

  const deciderResultsRef = useRef(null);
  const splitterResultsRef = useRef(null);
  const canvasRef = useRef(null);

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
    // Keep participants array updated with active members
    setParticipants(prev => {
      const activeIds = new Set(members);
      // Remove members who are deleted
      let updated = prev.filter(p => activeIds.has(p.id));
      // Add members who are newly added
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

    // Sync Expense default settings
    if (members.length > 0) {
      if (!payer || !members.includes(payer)) {
        setPayer(members[0]);
      }
      // Sync default split checkbox list to match active members
      setSplitList(members);
    } else {
      setPayer('');
      setSplitList([]);
    }
  }, [members]);

  // Adjust preferences inside participants whenever choices modify
  useEffect(() => {
    setParticipants(prev => prev.map(p => {
      // Filter out removed choices
      let filtered = p.preferences.filter(o => options.includes(o));
      // Append new choices
      options.forEach(o => {
        if (!filtered.includes(o)) filtered.push(o);
      });
      return { ...p, preferences: filtered };
    }));
  }, [options]);

  // Interactive Background Canvas logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = 75;
    const maxDistance = 120;
    const mouse = { x: null, y: null, radius: 150 };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.size = Math.random() * 2 + 1;
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
            this.size = this.originalSize * 1.5;
          } else {
            this.size = this.originalSize;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(129, 140, 248, 0.4)';
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
            const alpha = (1 - dist / maxDistance) * 0.15;
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 1;
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
    // Clear out related expenses containing deleted member
    setExpenses(expenses.map(exp => ({
      ...exp,
      paidBy: exp.paidBy === name ? (members.find(m => m !== name) || '') : exp.paidBy,
      splitAmong: exp.splitAmong.filter(m => m !== name)
    })).filter(exp => exp.paidBy !== ''));

    if (editingParticipantId === name) {
      setEditingParticipantId(null);
    }
  };

  // Dinner Decider Options Controls
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

  // Preference details editor
  const startEditParticipant = (p) => {
    setEditingParticipantId(p.id);
    setEditVeto(p.veto);
    // Ensure all options are included in editing lists
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

  // Expense Splitter Controls
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

  // Reset all engine systems to defaults
  const resetToDefault = () => {
    setMembers(DEFAULT_MEMBERS);
    setOptions(DEFAULT_OPTIONS);
    setExpenses(DEFAULT_EXPENSES);
    setEditingParticipantId(null);
  };

  // Calculations
  const getDiningResults = () => {
    const activeVetoes = [];
    participants.forEach(p => {
      if (p.veto) activeVetoes.push(p.veto);
    });
    const ballots = participants.map(p => p.preferences);
    return calculateResentmentMinimizer(options, ballots, activeVetoes);
  };

  const diningResults = getDiningResults();
  const settlements = calculateDebtSettlement(expenses, members);

  // Dynamic GSAP Animations triggers
  useEffect(() => {
    if (diningResults.winner && deciderResultsRef.current) {
      gsap.fromTo(deciderResultsRef.current, 
        { scale: 0.95, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [diningResults.winner]);

  useEffect(() => {
    if (splitterResultsRef.current) {
      const items = splitterResultsRef.current.querySelectorAll('.settlement-item');
      gsap.fromTo(items, 
        { opacity: 0, scale: 0.96, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [expenses, members]);

  return (
    <div className="min-h-screen text-gray-100 flex flex-col relative overflow-hidden bg-black font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dynamic Interactive Particle Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Top Border Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50" />

      {/* Header bar */}
      <header className="relative z-50 border-b border-gray-900 bg-black/90 backdrop-blur-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Custom 4-Diamond Brand Logo */}
            <div className="grid grid-cols-2 gap-1 w-7 h-7 logo-rotate relative">
              <div className="w-3 h-3 bg-indigo-500 rounded-[3px] rotate-45 transform origin-center shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
              <div className="w-3 h-3 bg-[#0d9488] rounded-[3px] rotate-45 transform origin-center shadow-[0_0_12px_rgba(13,148,136,0.6)]" />
              <div className="w-3 h-3 bg-[#ea580c] rounded-[3px] rotate-45 transform origin-center shadow-[0_0_12px_rgba(234,88,12,0.6)]" />
              <div className="w-3 h-3 bg-violet-500 rounded-[3px] rotate-45 transform origin-center shadow-[0_0_12px_rgba(167,139,250,0.6)]" />
            </div>
            
            <div className="flex items-baseline gap-1.5 ml-1">
              <span className="font-extrabold text-2xl tracking-tight text-white">Resolve</span>
              <span className="text-gray-400 text-xs font-normal lowercase tracking-wide">loyalty</span>
            </div>
          </div>

          <button 
            onClick={resetToDefault}
            className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-gray-400 hover:text-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Default Values
          </button>
        </div>
      </header>

      {/* Main Consolidated Dashboard */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-12 space-y-8">
        
        {/* Intro Header Card */}
        <div className="floating-card border border-gray-800 bg-slate-900/40 p-8 rounded-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            The Unified Group Decision Dashboard
          </h2>
          <p className="text-gray-400 text-sm max-w-3xl leading-relaxed mt-3">
            Add friends to the **Group Members** list to synchronize participants across both tools. Pick a restaurant with the **Dinner Decider** (Borda utilities &amp; vetoes), and optimize sharing costs instantly with the **Expense Splitter** (greedy debt consolidation).
          </p>
        </div>

        {/* Top Grid: Shared Members Management */}
        <div className="floating-card border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
              1. Unified Group Members
            </h3>
          </div>
          <div className="flex gap-3 mb-4 max-w-md">
            <input 
              type="text" 
              value={newMemberName} 
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Add member name..."
              className="flex-1 bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
            />
            <button 
              onClick={addMember}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <div key={m} className="flex items-center gap-1.5 bg-slate-955/60 border border-gray-850 px-3.5 py-2 rounded-xl text-xs">
                <span className="text-gray-205 font-medium">{m}</span>
                <button onClick={() => removeMember(m)} className="text-gray-500 hover:text-red-400 ml-1 transition cursor-pointer font-bold">
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Split Layout: Dining vs Billing Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Box 1: Dinner Decider Panel */}
          <div className="space-y-6">
            <div className="floating-card border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                  2. Dinner Decider
                </h3>
              </div>

              {/* Options lists management */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Restaurant Options</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newOptionName} 
                    onChange={(e) => setNewOptionName(e.target.value)}
                    placeholder="Add restaurant option..."
                    className="flex-1 bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
                  />
                  <button 
                    onClick={addOption}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.map(opt => (
                    <div key={opt} className="flex items-center justify-between gap-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-gray-855 text-xs">
                      <span className="font-medium text-gray-205">{opt}</span>
                      <button 
                        onClick={() => removeOption(opt)}
                        className="text-gray-500 hover:text-red-400 transition cursor-pointer font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Members Preferences triggers */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Configure Member Ballots &amp; Vetoes</label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {participants.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => startEditParticipant(p)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        editingParticipantId === p.id 
                        ? 'bg-indigo-955/20 border-indigo-500/80 shadow-md shadow-indigo-500/5' 
                        : 'bg-slate-955/60 border-gray-850 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="font-semibold text-gray-205">{p.name}</div>
                      <div className="text-[10px] text-gray-550 mt-1 truncate">
                        {p.veto ? `Veto: ${p.veto}` : 'No veto'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preference Editor Box */}
              {editingParticipantId && (
                <div className="border border-indigo-500/20 bg-indigo-955/5 p-4 rounded-xl space-y-4 animate-fade-in text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Ballot: {editingParticipantId}</span>
                    <button 
                      onClick={saveParticipantEdit}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                    >
                      Save Preferences
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Veto Option</label>
                      <select 
                        value={editVeto} 
                        onChange={(e) => setEditVeto(e.target.value)}
                        className="w-full bg-slate-950 border border-gray-800 rounded-xl px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">No veto</option>
                        {options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Rank Options</label>
                      <div className="space-y-1">
                        {editPrefs.map((pref, idx) => (
                          <div key={pref} className="flex justify-between items-center bg-slate-955 p-2 rounded border border-gray-855 text-[10px]">
                            <span className="text-gray-300 font-semibold">{idx+1}. {pref}</span>
                            <div className="flex gap-0.5">
                              <button disabled={idx===0} onClick={()=>movePref(idx, -1)} className="bg-gray-850 hover:bg-gray-800 disabled:opacity-30 text-white px-1.5 py-0.5 rounded text-[9px] cursor-pointer">▲</button>
                              <button disabled={idx===editPrefs.length-1} onClick={()=>movePref(idx, 1)} className="bg-gray-850 hover:bg-gray-800 disabled:opacity-30 text-white px-1.5 py-0.5 rounded text-[9px] cursor-pointer">▼</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Consensus Win Output */}
              <div ref={deciderResultsRef} className="border border-gray-850 bg-slate-955/50 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Consensus Winner</h4>
                {diningResults.winner ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-indigo-600/5 border border-indigo-500/10 p-4 rounded-xl">
                      <div className="h-10 w-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center font-bold text-white shadow shadow-indigo-500/20">
                        ★
                      </div>
                      <div>
                        <div className="text-[10px] text-indigo-400 font-bold uppercase">Calculated Venue</div>
                        <div className="text-lg font-bold text-white">{diningResults.winner}</div>
                      </div>
                    </div>
                    
                    {/* Scores list */}
                    <div className="space-y-1.5">
                      {diningResults.ranked.map((r, i) => (
                        <div key={r.name} className="flex justify-between items-center text-xs bg-slate-950 p-2.5 rounded-lg border border-gray-855">
                          <span className="font-semibold text-gray-300">#{i + 1} {r.name}</span>
                          <div>
                            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 px-2 py-0.5 rounded text-[10px] mr-1.5">{r.score} pts</span>
                            <span className="text-[9px] text-gray-500 font-mono">Var: {r.variance}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-500 py-4">All options vetoed. Relax constraints to find a winner.</div>
                )}
              </div>
            </div>
          </div>

          {/* Box 2: Expense Splitter Panel */}
          <div className="space-y-6">
            <div className="floating-card border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                  3. Expense Splitter
                </h3>
              </div>

              {/* Add expense form */}
              <div className="space-y-4 text-xs">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Add Shared Expense</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Description</label>
                    <input 
                      type="text"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="e.g. Lunch, Taxi, Rental..."
                      className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Amount ($)</label>
                    <input 
                      type="number"
                      value={amt}
                      onChange={(e) => setAmt(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Paid By</label>
                    <select 
                      value={payer}
                      onChange={(e) => setPayer(e.target.value)}
                      className="w-full bg-slate-955 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {members.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Split Among</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-955/50 border border-gray-850 p-2 rounded-xl max-h-24 overflow-y-auto">
                      {members.map(m => (
                        <label key={m} className="flex items-center gap-1 text-[10px] text-gray-300 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={splitList.includes(m)}
                            onChange={() => toggleSplitPerson(m)}
                            className="rounded border-gray-850 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-950 w-3 h-3"
                          />
                          <span className="truncate">{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={addExpense}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  Add Expense
                </button>
              </div>

              {/* Raw expenses checklist */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Expenses Ledger</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center bg-slate-955/60 p-3.5 rounded-xl border border-gray-855 text-xs animate-fade-in">
                      <div className="truncate pr-2">
                        <div className="font-semibold text-gray-205">{exp.description}</div>
                        <div className="text-[10px] text-gray-500 mt-1 truncate">
                          Paid by <span className="text-indigo-400 font-medium">{exp.paidBy}</span> &middot; Split: {exp.splitAmong.join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">${exp.amount}</span>
                        <button 
                          onClick={() => removeExpense(exp.id)}
                          className="text-gray-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="text-center text-xs text-gray-500 py-4">No expenses recorded yet.</div>
                  )}
                </div>
              </div>

              {/* simplified settlements output */}
              <div className="border border-gray-855 bg-slate-955/50 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Settlements Ledger</h4>
                {settlements.length > 0 ? (
                  <div ref={splitterResultsRef} className="space-y-2">
                    {settlements.map((settle, idx) => (
                      <div key={idx} className="settlement-item flex items-center justify-between p-3 rounded-lg border border-indigo-500/10 bg-indigo-650/5 text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-bold text-red-400 truncate">{settle.from}</span>
                          <span className="text-gray-500 text-[10px] flex-shrink-0">pays</span>
                          <span className="font-bold text-emerald-400 truncate">{settle.to}</span>
                        </div>
                        <div className="text-white font-bold bg-indigo-950/40 border border-indigo-900/20 px-2 py-1 rounded-lg text-[11px] flex-shrink-0">
                          ${settle.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-500 py-4">All balances settled.</div>
                )}
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
