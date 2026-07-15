import React, { useState, useEffect, useRef } from 'react';
import { calculateDebtSettlement } from '../utils/algorithms';
import { 
  Plus, Trash2, DollarSign, Wallet, CreditCard, RotateCcw
} from 'lucide-react';
import gsap from 'gsap';

const DEFAULT_MEMBERS = ['Alex', 'Blake', 'Charlie', 'Dana'];

const DEFAULT_EXPENSES = [
  { id: '1', description: 'Group Lunch', amount: 80, paidBy: 'Alex', splitAmong: ['Alex', 'Blake', 'Charlie', 'Dana'] },
  { id: '2', description: 'Cab Ride', amount: 30, paidBy: 'Blake', splitAmong: ['Alex', 'Blake', 'Charlie'] },
  { id: '3', description: 'Snacks & Drinks', amount: 45, paidBy: 'Charlie', splitAmong: ['Charlie', 'Dana'] }
];

export default function BillSplitter() {
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('cs_members');
    return saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('cs_expenses');
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
  });

  const [newMember, setNewMember] = useState('');
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [payer, setPayer] = useState('Alex');
  const [splitList, setSplitList] = useState(['Alex', 'Blake', 'Charlie', 'Dana']);

  const resultsRef = useRef(null);

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('cs_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('cs_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Keep payer option valid if members are modified
  useEffect(() => {
    if (members.length > 0 && !members.includes(payer)) {
      setPayer(members[0]);
    }
  }, [members, payer]);

  const addMember = () => {
    const trimmed = newMember.trim();
    if (trimmed && !members.includes(trimmed)) {
      setMembers([...members, trimmed]);
      setSplitList([...splitList, trimmed]);
      setNewMember('');
    }
  };

  const removeMember = (name) => {
    setMembers(members.filter(m => m !== name));
    setSplitList(splitList.filter(m => m !== name));
    setExpenses(expenses.map(exp => ({
      ...exp,
      paidBy: exp.paidBy === name ? (members.find(m => m !== name) || '') : exp.paidBy,
      splitAmong: exp.splitAmong.filter(m => m !== name)
    })).filter(exp => exp.paidBy !== ''));
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
    setExpenses(DEFAULT_EXPENSES);
    setSplitList(DEFAULT_MEMBERS);
  };

  const settlements = calculateDebtSettlement(expenses, members);

  // GSAP animation when settlements change
  useEffect(() => {
    if (resultsRef.current) {
      const cards = resultsRef.current.querySelectorAll('.settlement-item');
      gsap.fromTo(cards, 
        { opacity: 0, scale: 0.96, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [expenses, members]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Intro Header Section */}
      <div className="border border-gray-800 bg-slate-900/40 p-8 rounded-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-7 w-7 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Shared Expense &amp; Bill Splitter
            </h2>
          </div>
          <button 
            onClick={resetToDefault}
            className="flex items-center gap-2 bg-slate-950 border border-gray-800 hover:border-gray-700 text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Demo Values
          </button>
        </div>
        <p className="text-gray-400 text-sm max-w-3xl leading-relaxed mt-4">
          Resolves conflicts when settling shared expenses among groups. Instead of everyone making messy individual payments back and forth, the engine simplifies balances using a **Greedy Debt Consolidation Algorithm** to compute the absolute minimum number of payments needed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Config / Inputs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Members list */}
          <div className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">
              Group Members
            </h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newMember} 
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Add member name..."
                className="flex-1 bg-slate-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
              />
              <button 
                onClick={addMember}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <div key={m} className="flex items-center gap-1.5 bg-slate-955/60 border border-gray-850 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-gray-250 font-medium">{m}</span>
                  <button onClick={() => removeMember(m)} className="text-gray-500 hover:text-red-400 ml-1 transition">
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Expense Form */}
          <div className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">
              Add Expense
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                <input 
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. Dinner, Uber, AirBnb..."
                  className="w-full bg-slate-955 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount ($)</label>
                  <input 
                    type="number"
                    value={amt}
                    onChange={(e) => setAmt(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-955 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Paid By</label>
                  <select 
                    value={payer}
                    onChange={(e) => setPayer(e.target.value)}
                    className="w-full bg-slate-955 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  >
                    {members.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Split Among</label>
                <div className="grid grid-cols-2 gap-2">
                  {members.map(m => (
                    <label key={m} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={splitList.includes(m)}
                        onChange={() => toggleSplitPerson(m)}
                        className="rounded border-gray-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-950"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={addExpense}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold transition"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Expenses List & Debt Settlements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Raw list of expenses */}
          <div className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">
              Expenses List
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {expenses.map(exp => (
                <div key={exp.id} className="flex justify-between items-center bg-slate-950/60 p-4 rounded-xl border border-gray-855 text-sm">
                  <div>
                    <div className="font-semibold text-gray-205">{exp.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Paid by <span className="text-indigo-400 font-medium">{exp.paidBy}</span> &middot; Split among {exp.splitAmong.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">${exp.amount}</span>
                    <button 
                      onClick={() => removeExpense(exp.id)}
                      className="text-gray-500 hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-500">No expenses added yet.</div>
              )}
            </div>
          </div>

          {/* Settled Transactions Output */}
          <div className="border border-gray-850 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-6 flex items-center gap-2">
              Simplified Settlements
            </h3>

            {settlements.length > 0 ? (
              <div ref={resultsRef} className="space-y-3">
                {settlements.map((settle, idx) => (
                  <div 
                    key={idx} 
                    className="settlement-item flex items-center justify-between p-4 rounded-xl border border-indigo-500/10 bg-indigo-650/5 hover:border-indigo-500/20 transition-all"
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-red-400">{settle.from}</span>
                      <span className="text-gray-500 text-xs">pays</span>
                      <span className="font-bold text-emerald-400">{settle.to}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white font-bold text-sm bg-indigo-950/40 border border-indigo-900/20 px-3 py-1.5 rounded-lg">
                      <CreditCard className="h-4 w-4 text-indigo-400" />
                      ${settle.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-550 text-sm">
                No debts to settle! All balances are balanced.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
