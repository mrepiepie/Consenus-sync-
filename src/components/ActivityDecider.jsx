import React, { useState, useEffect, useRef } from 'react';
import { calculateSchulze } from '../utils/algorithms';
import { 
  Users, Plus, Trash2, ShieldAlert, Award, 
  Layers, RotateCcw, Scale
} from 'lucide-react';
import gsap from 'gsap';

const DEFAULT_PARTICIPANTS = [
  { id: 'p1', name: 'Alex', veto: 'Sushi Palace', weight: 1, preferences: ['Burger Joint', 'Taco Express', 'Sushi Palace', 'Pasta House'] },
  { id: 'p2', name: 'Blake', veto: '', weight: 1.5, preferences: ['Sushi Palace', 'Pasta House', 'Burger Joint', 'Taco Express'] },
  { id: 'p3', name: 'Charlie', veto: 'Burger Joint', weight: 1, preferences: ['Pasta House', 'Taco Express', 'Sushi Palace', 'Burger Joint'] },
  { id: 'p4', name: 'Dana', veto: '', weight: 1, preferences: ['Taco Express', 'Sushi Palace', 'Pasta House', 'Burger Joint'] }
];

const DEFAULT_OPTIONS = [
  'Sushi Palace',
  'Burger Joint',
  'Taco Express',
  'Pasta House'
];

export default function ActivityDecider() {
  const [participants, setParticipants] = useState(() => {
    const saved = localStorage.getItem('cs_participants');
    return saved ? JSON.parse(saved) : DEFAULT_PARTICIPANTS;
  });

  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem('cs_options');
    return saved ? JSON.parse(saved) : DEFAULT_OPTIONS;
  });

  const [newParticipantName, setNewParticipantName] = useState('');
  const [newOptionName, setNewOptionName] = useState('');

  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editVeto, setEditVeto] = useState('');
  const [editWeight, setEditWeight] = useState(1);
  const [editPrefs, setEditPrefs] = useState([]);

  const resultsCardRef = useRef(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('cs_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('cs_options', JSON.stringify(options));
  }, [options]);

  const getResults = () => {
    const activeVetoes = new Set();
    participants.forEach(p => {
      if (p.veto) {
        activeVetoes.add(p.veto);
      }
    });

    const validCandidates = options.filter(opt => !activeVetoes.has(opt));

    if (validCandidates.length === 0) {
      return { winner: null, ranked: [], pairwise: null, paths: null, vetoes: Array.from(activeVetoes) };
    }

    const ballots = [];
    const weights = [];
    participants.forEach(p => {
      ballots.push(p.preferences.filter(pref => validCandidates.includes(pref)));
      weights.push(p.weight || 1);
    });

    const schulzeResult = calculateSchulze(validCandidates, ballots, weights);
    return {
      ...schulzeResult,
      vetoes: Array.from(activeVetoes)
    };
  };

  const results = getResults();

  useEffect(() => {
    if (results.winner && resultsCardRef.current) {
      gsap.fromTo(resultsCardRef.current, 
        { scale: 0.95, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [results.winner]);

  const addOption = () => {
    const trimmed = newOptionName.trim();
    if (trimmed && !options.includes(trimmed)) {
      const updatedOpts = [...options, trimmed];
      setOptions(updatedOpts);
      setParticipants(participants.map(p => ({
        ...p,
        preferences: [...p.preferences, trimmed]
      })));
      setNewOptionName('');
    }
  };

  const removeOption = (optName) => {
    setOptions(options.filter(o => o !== optName));
    setParticipants(participants.map(p => ({
      ...p,
      veto: p.veto === optName ? '' : p.veto,
      preferences: p.preferences.filter(pref => pref !== optName)
    })));
  };

  const addParticipant = () => {
    const trimmed = newParticipantName.trim();
    if (trimmed) {
      const newId = 'p_' + Date.now();
      setParticipants([...participants, {
        id: newId,
        name: trimmed,
        veto: '',
        weight: 1,
        preferences: [...options]
      }]);
      setNewParticipantName('');
    }
  };

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
    if (editingParticipantId === id) {
      setEditingParticipantId(null);
    }
  };

  const startEditParticipant = (p) => {
    setEditingParticipantId(p.id);
    setEditName(p.name);
    setEditVeto(p.veto);
    setEditWeight(p.weight || 1);
    // Make sure we have all current options mapped
    const missing = options.filter(o => !p.preferences.includes(o));
    setEditPrefs([...p.preferences, ...missing].filter(o => options.includes(o)));
  };

  const saveParticipantEdit = () => {
    setParticipants(participants.map(p => {
      if (p.id === editingParticipantId) {
        return {
          ...p,
          name: editName,
          veto: editVeto,
          weight: Number(editWeight) || 1,
          preferences: editPrefs
        };
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

  const resetToDefault = () => {
    setParticipants(DEFAULT_PARTICIPANTS);
    setOptions(DEFAULT_OPTIONS);
    setEditingParticipantId(null);
  };

  return (
    <div className="space-y-8">
      {/* Intro Header Section */}
      <div className="border border-gray-800 bg-slate-900/40 p-8 rounded-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="h-7 w-7 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Group Dining &amp; Activity Decider
              </h2>
            </div>
          </div>
          <button 
            onClick={resetToDefault}
            className="flex items-center gap-2 bg-slate-950 border border-gray-800 hover:border-gray-700 text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Demo Values
          </button>
        </div>
        <p className="text-gray-400 text-sm max-w-3xl leading-relaxed mt-4">
          Struggling with the classic "Where should we go to eat?" dilemma. Collect ranked preferences and absolute vetos from members, filters out vetoed options to prevent frustration, then uses the **Schulze Beatpath Algorithm** to find the option that mathematically dominates the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Hand Options and Members panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Choices Management */}
          <div className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
              Choices / Places
            </h3>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newOptionName} 
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="Add venue / option..."
                className="flex-1 bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
              />
              <button 
                onClick={addOption}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Add
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {options.map(opt => (
                <div key={opt} className="flex justify-between items-center bg-slate-955/60 p-3 rounded-xl border border-gray-855 text-sm">
                  <span className="font-medium text-gray-205">{opt}</span>
                  <button 
                    onClick={() => removeOption(opt)}
                    className="text-gray-500 hover:text-red-400 p-1 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Participant Management */}
          <div className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
              Group Members
            </h3>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newParticipantName} 
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="Add member name..."
                className="flex-1 bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
              />
              <button 
                onClick={addParticipant}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Join
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {participants.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => startEditParticipant(p)}
                  className={`flex justify-between items-center p-3.5 rounded-xl border text-sm cursor-pointer transition ${
                    editingParticipantId === p.id 
                    ? 'bg-indigo-950/20 border-indigo-500/80 shadow-md shadow-indigo-500/5' 
                    : 'bg-slate-955/60 border-gray-850 hover:border-indigo-500/30'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-gray-205">{p.name}</div>
                    <div className="text-xs text-gray-550 mt-0.5 flex items-center gap-2">
                      <span>{p.veto ? `Veto: ${p.veto}` : 'No veto'}</span>
                      <span className="text-[10px] text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/30">
                        Weight: {p.weight || 1}x
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-900/30 text-indigo-350 rounded border border-indigo-900/20 font-bold uppercase tracking-wider">
                      Ranked
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeParticipant(p.id);
                      }}
                      className="text-gray-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Input Details & Algorithm Outputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Member Preferences Editor */}
          {editingParticipantId && (
            <div className="border border-indigo-500/20 bg-indigo-955/5 backdrop-blur-md p-6 rounded-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">
                  Preferences Editor: {editName}
                </h3>
                <button 
                  onClick={saveParticipantEdit}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/10"
                >
                  Save & Apply Preferences
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Veto / Absolute No-Go
                  </label>
                  <select 
                    value={editVeto} 
                    onChange={(e) => setEditVeto(e.target.value)}
                    className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="">No veto (willing to compromise)</option>
                    {options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-550 mt-2.5 flex items-center gap-1.5 leading-relaxed">
                    <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    Selecting a veto automatically excludes that venue from the ballot.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5 text-indigo-400" /> Vote Weight Factor
                  </label>
                  <select 
                    value={editWeight} 
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="1">Standard Weight (1.0x)</option>
                    <option value="1.5">Driver / Organizer (1.5x)</option>
                    <option value="2">Birthday Person (2.0x)</option>
                  </select>
                  <p className="text-xs text-gray-550 mt-2.5 leading-relaxed">
                    Grants higher priority calculations to specific members in case of a split tie.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Rank Options (Top to Bottom)
                  </label>
                  <div className="space-y-1.5">
                    {editPrefs.map((pref, idx) => (
                      <div key={pref} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-gray-855 text-xs">
                        <span className="font-semibold text-gray-300 flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center bg-indigo-900/30 text-indigo-300 rounded-full font-bold">
                            {idx + 1}
                          </span>
                          {pref}
                        </span>
                        <div className="flex gap-1">
                          <button 
                            disabled={idx === 0} 
                            onClick={() => movePref(idx, -1)}
                            className="bg-gray-850 hover:bg-gray-800 disabled:opacity-30 text-white px-2 py-1.5 rounded-lg text-[10px]"
                          >
                            ▲
                          </button>
                          <button 
                            disabled={idx === editPrefs.length - 1} 
                            onClick={() => movePref(idx, 1)}
                            className="bg-gray-850 hover:bg-gray-800 disabled:opacity-30 text-white px-2 py-1.5 rounded-lg text-[10px]"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          <div ref={resultsCardRef} className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-6 flex items-center gap-2">
              Consensus Result
            </h3>

            {results.winner ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-indigo-600/5 border border-indigo-500/15 p-5 rounded-2xl">
                  <div className="h-14 w-14 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Award className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Calculated Choice</div>
                    <div className="text-2xl font-bold text-white mt-0.5">{results.winner}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Pairwise Win Breakdown (Schulze Scores)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {results.ranked.map((r, i) => (
                      <div key={r.name} className="flex justify-between items-center bg-slate-955 p-3 rounded-xl border border-gray-855">
                        <span className="font-semibold text-sm text-gray-250 flex items-center gap-2">
                          <span className="text-xs text-gray-550">#{i + 1}</span>
                          {r.name}
                        </span>
                        <span className="text-xs px-2.5 py-1 bg-emerald-950/40 text-emerald-400 rounded-full border border-emerald-800/30 font-bold">
                          {r.score} wins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {results.vetoes.length > 0 && (
                  <div className="bg-red-955/10 border border-red-500/10 p-4 rounded-xl flex gap-3 text-xs text-red-300">
                    <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Vetoes applied:</span> {results.vetoes.join(', ')}. Eliminated before computing ranked ballots.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-550 text-sm">
                {results.vetoes.length === options.length ? (
                  <p className="flex items-center justify-center gap-2 text-amber-400">
                    <ShieldAlert className="h-5 w-5" />
                    All options have been vetoed! Relax constraints to find a winner.
                  </p>
                ) : (
                  'No valid winner can be calculated. Add options and participants above.'
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
