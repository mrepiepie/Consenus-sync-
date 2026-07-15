import React, { useState } from 'react';
import ActivityDecider from './components/ActivityDecider';
import BillSplitter from './components/BillSplitter';
import { Layers, Wallet, Sparkles } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dining');

  return (
    <div className="min-h-screen text-gray-100 flex flex-col relative overflow-hidden bg-[#070a13] font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dynamic Animated Floating Background Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Blob 1 - Slow float */}
        <div className="bg-floating-blob-1 absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.13)_0%,rgba(124,58,237,0.03)_60%,transparent_100%)] filter blur-[80px]" />
        
        {/* Blob 2 - Counter float */}
        <div className="bg-floating-blob-2 absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.06)_0%,rgba(99,102,241,0.02)_60%,transparent_100%)] filter blur-[90px]" />
        
        {/* Ambient Top Glow Grid */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.08)_0%,transparent_100%)] filter blur-[50px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-gray-800/80 bg-[#070a13]/80 backdrop-blur-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform hover:rotate-12 duration-300">
              <Sparkles className="h-5.5 w-5.5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block">ConsensuSync</span>
              <span className="text-[10px] block text-indigo-400 font-mono tracking-widest uppercase -mt-1 font-bold">
                Consensus Engine
              </span>
            </div>
          </div>

          {/* Navigation island */}
          <nav className="flex space-x-1 bg-slate-900/60 p-1.5 rounded-2xl border border-gray-800/60 backdrop-blur-md shadow-inner">
            <button
              onClick={() => setActiveTab('dining')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${
                activeTab === 'dining'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Layers className="h-4 w-4" /> Dinner Decider
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${
                activeTab === 'bills'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
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
