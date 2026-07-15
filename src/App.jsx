import React, { useState } from 'react';
import ActivityDecider from './components/ActivityDecider';
import BillSplitter from './components/BillSplitter';
import { Layers, Wallet, Sparkles } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dining');

  return (
    <div className="min-h-screen text-gray-100 flex flex-col relative overflow-hidden bg-[#070a13]">
      {/* Background blobs matched to SapioMatch template design */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-20%] left-[50%] w-[1000px] h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.12)_0%,rgba(124,58,237,0.04)_50%,transparent_100%)] filter blur-[90px] translate-x-[-50%] pointer-events-none" />
        <div className="absolute top-[45%] right-[8%] w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)] filter blur-[70px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[10%] w-[800px] h-[500px] bg-[radial-gradient(circle,rgba(236,72,153,0.05)_0%,transparent_75%)] filter blur-[100px] pointer-events-none" />
      </div>

      {/* Navigation header matched to SapioMatch nav-island */}
      <header className="relative z-50 border-b border-gray-800 bg-[#070a13]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white font-sans">ConsensuSync</span>
              <span className="text-[10px] block text-indigo-400 font-mono tracking-widest uppercase -mt-0.5">
                Consensus Engine
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex space-x-1 bg-slate-900/60 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab('dining')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'dining'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Layers className="h-4 w-4" /> Dinner Decider
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'bills'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Wallet className="h-4 w-4" /> Expense Splitter
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-12">
        {activeTab === 'dining' && <ActivityDecider />}
        {activeTab === 'bills' && <BillSplitter />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900 bg-slate-950/40 py-6 text-center text-xs text-gray-500">
        ConsensuSync decision-making platform &copy; {new Date().getFullYear()} &middot; Built for Club Application
      </footer>
    </div>
  );
}

export default App;
