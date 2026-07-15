import React, { useState, useEffect, useRef } from 'react';
import { calculateStableMatching } from '../utils/algorithms';
import { 
  Briefcase, Plus, Trash2, ListOrdered, 
  HelpCircle, RefreshCw, Layers, CheckCircle2 
} from 'lucide-react';
import gsap from 'gsap';

export default function TaskDivider() {
  const [members, setMembers] = useState([
    { id: 'Alex', name: 'Alex', preferences: ['Frontend UI', 'API & Database', 'QA & Testing', 'DevOps Setup'] },
    { id: 'Blake', name: 'Blake', preferences: ['API & Database', 'Frontend UI', 'DevOps Setup', 'QA & Testing'] },
    { id: 'Charlie', name: 'Charlie', preferences: ['DevOps Setup', 'API & Database', 'QA & Testing', 'Frontend UI'] },
    { id: 'Dana', name: 'Dana', preferences: ['QA & Testing', 'Frontend UI', 'API & Database', 'DevOps Setup'] }
  ]);

  const [tasks, setTasks] = useState([
    { id: 'Frontend UI', name: 'Frontend UI', capacity: 1, rankings: ['Alex', 'Blake', 'Dana', 'Charlie'] },
    { id: 'API & Database', name: 'API & Database', capacity: 1, rankings: ['Blake', 'Alex', 'Charlie', 'Dana'] },
    { id: 'DevOps Setup', name: 'DevOps Setup', capacity: 1, rankings: ['Charlie', 'Blake', 'Alex', 'Dana'] },
    { id: 'QA & Testing', name: 'QA & Testing', capacity: 1, rankings: ['Dana', 'Alex', 'Charlie', 'Blake'] }
  ]);

  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editPrefs, setEditPrefs] = useState([]);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editRankings, setEditRankings] = useState([]);
  const [editCapacity, setEditCapacity] = useState(1);

  const allocationPanelRef = useRef(null);

  const result = calculateStableMatching(members, tasks);

  // GSAP animation triggered when allocations change
  useEffect(() => {
    if (allocationPanelRef.current) {
      const cards = allocationPanelRef.current.querySelectorAll('.task-assignment-card');
      gsap.fromTo(cards, 
        { opacity: 0, y: 10, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, [members, tasks]);

  const startEditMember = (m) => {
    setEditingMemberId(m.id);
    setEditPrefs([...m.preferences]);
    setEditingTaskId(null);
  };

  const saveMemberPrefs = () => {
    setMembers(members.map(m => {
      if (m.id === editingMemberId) {
        return { ...m, preferences: editPrefs };
      }
      return m;
    }));
    setEditingMemberId(null);
  };

  const startEditTask = (t) => {
    setEditingTaskId(t.id);
    setEditRankings([...t.rankings]);
    setEditCapacity(t.capacity);
    setEditingMemberId(null);
  };

  const saveTaskRankings = () => {
    setTasks(tasks.map(t => {
      if (t.id === editingTaskId) {
        return { ...t, rankings: editRankings, capacity: Number(editCapacity) };
      }
      return t;
    }));
    setEditingTaskId(null);
  };

  const moveItem = (list, setList, index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= list.length) return;
    const updated = [...list];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setList(updated);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Intro Header Section */}
      <div className="border border-gray-800 bg-slate-900/40 p-8 rounded-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <Briefcase className="h-7 w-7 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Group Project Task &amp; Role Division
          </h2>
        </div>
        <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">
          Avoid task allocation arguments in project teams. Rather than a messy "first-come first-served" race, members rank their desired roles, and tasks rate members. The engine runs the **Gale-Shapley Stable Marriage Algorithm** to match members to roles, guaranteeing a stable, envy-free, and Pareto-efficient allocation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Hand Setup Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Members Prefs Overview */}
          <div className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
              Members &amp; Preferences
            </h3>
            <div className="space-y-2">
              {members.map(m => (
                <div 
                  key={m.id}
                  onClick={() => startEditMember(m)}
                  className={`p-3.5 rounded-xl border text-sm cursor-pointer transition ${
                    editingMemberId === m.id 
                    ? 'bg-indigo-950/20 border-indigo-500/80 shadow-md shadow-indigo-500/5' 
                    : 'bg-slate-950/60 border-gray-850 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="font-semibold text-gray-205">{m.name}</div>
                  <div className="text-xs text-gray-550 mt-1 truncate">
                    1st: {m.preferences[0] || 'None'} | 2nd: {m.preferences[1] || 'None'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Cap & Priority Overview */}
          <div className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
              Tasks &amp; Capacities
            </h3>
            <div className="space-y-2">
              {tasks.map(t => (
                <div 
                  key={t.id}
                  onClick={() => startEditTask(t)}
                  className={`p-3.5 rounded-xl border text-sm cursor-pointer transition ${
                    editingTaskId === t.id 
                    ? 'bg-indigo-950/20 border-indigo-500/80 shadow-md shadow-indigo-500/5' 
                    : 'bg-slate-955/60 border-gray-850 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-205">{t.name}</span>
                    <span className="text-[10px] bg-slate-950 px-2 py-0.5 border border-gray-800 rounded font-mono text-gray-400 font-bold uppercase tracking-wider">
                      Cap: {t.capacity}
                    </span>
                  </div>
                  <div className="text-xs text-gray-550 mt-1.5 truncate">
                    Task Priority Score: {t.rankings.join(' \u2192 ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Adjusting Priorities & Interactive Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Member Preferences Editor */}
          {editingMemberId && (
            <div className="border border-indigo-500/20 bg-indigo-955/5 backdrop-blur-md p-6 rounded-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">
                  Rank Task Preferences: {editingMemberId}
                </h3>
                <button 
                  onClick={saveMemberPrefs}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/10"
                >
                  Save Preferences
                </button>
              </div>
              <div className="space-y-1.5">
                {editPrefs.map((pref, idx) => (
                  <div key={pref} className="flex justify-between items-center bg-slate-955 p-2.5 rounded-xl border border-gray-850 text-xs">
                    <span className="font-semibold text-gray-300 flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-indigo-900/30 text-indigo-300 rounded-full font-bold">
                        {idx + 1}
                      </span>
                      {pref}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        disabled={idx === 0} 
                        onClick={() => moveItem(editPrefs, setEditPrefs, idx, -1)}
                        className="bg-gray-850 hover:bg-gray-800 disabled:opacity-30 text-white px-2 py-1.5 rounded-lg text-[10px]"
                      >
                        ▲
                      </button>
                      <button 
                        disabled={idx === editPrefs.length - 1} 
                        onClick={() => moveItem(editPrefs, setEditPrefs, idx, 1)}
                        className="bg-gray-850 hover:bg-gray-800 disabled:opacity-30 text-white px-2 py-1.5 rounded-lg text-[10px]"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Preferences Editor */}
          {editingTaskId && (
            <div className="border border-indigo-500/20 bg-indigo-950/5 backdrop-blur-md p-6 rounded-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">
                  Configure Task Matching Priority: {editingTaskId}
                </h3>
                <button 
                  onClick={saveTaskRankings}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/10"
                >
                  Save Configuration
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Capacity (Seats)
                  </label>
                  <input 
                    type="number"
                    min="1"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Assignee Priority Order (Skill-fit / Selection Score)
                  </label>
                  <div className="space-y-1.5">
                    {editRankings.map((rank, idx) => (
                      <div key={rank} className="flex justify-between items-center bg-slate-955 p-2.5 rounded-xl border border-gray-850 text-xs">
                        <span className="font-semibold text-gray-300">{rank}</span>
                        <div className="flex gap-1">
                          <button 
                            disabled={idx === 0} 
                            onClick={() => moveItem(editRankings, setEditRankings, idx, -1)}
                            className="bg-gray-850 hover:bg-gray-800 disabled:opacity-30 text-white px-2 py-1 rounded-lg text-[10px]"
                          >
                            ▲
                          </button>
                          <button 
                            disabled={idx === editRankings.length - 1} 
                            onClick={() => moveItem(editRankings, setEditRankings, idx, 1)}
                            className="bg-gray-850 hover:bg-gray-800 disabled:opacity-30 text-white px-2 py-1 rounded-lg text-[10px]"
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

          {/* Allocation Results */}
          <div ref={allocationPanelRef} className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-6 flex items-center gap-2">
              Stable Task Allocations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(result.assignments).map(taskId => {
                const assigned = result.assignments[taskId];
                return (
                  <div key={taskId} className="task-assignment-card bg-slate-950 p-4 rounded-xl border border-gray-855">
                    <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{taskId}</div>
                    <div className="mt-2.5 space-y-1.5">
                      {assigned.length > 0 ? (
                        assigned.map(memberId => (
                          <div key={memberId} className="flex items-center gap-2 text-sm bg-indigo-600/5 border border-indigo-500/15 px-3 py-2 rounded-lg text-white font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                            {memberId}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-550 italic py-1">No members assigned</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Steps simulation log */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Algorithm Execution Path (Stable Matching Simulation)
              </h4>
              <div className="bg-slate-950 p-4 rounded-xl border border-gray-850 max-h-48 overflow-y-auto font-mono text-[11px] text-gray-400 space-y-1.5">
                {result.steps.map((step, idx) => (
                  <div key={idx} className={step.startsWith('Round') ? 'text-indigo-400 font-bold mt-1' : 'pl-4'}>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
