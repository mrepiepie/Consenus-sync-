import React, { useState, useEffect, useRef } from 'react';
import ActivityDecider from './components/ActivityDecider';
import BillSplitter from './components/BillSplitter';
import { Layers, Wallet } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dining');
  const canvasRef = useRef(null);

  // Mouse particle interactive background logic
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

  return (
    <div className="min-h-screen text-gray-100 flex flex-col relative overflow-hidden bg-black font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Interactive Glowing Interactive Canvas Background */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Top Border Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-gray-900 bg-black/90 backdrop-blur-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Aesthetic BIA loyalty inspired Brand Logo & Typography */}
          <div className="flex items-center gap-3">
            {/* Custom 4-Diamond Logo (BIA Loyalty Inspired Style) */}
            <div className="grid grid-cols-2 gap-1 w-7 h-7 logo-rotate relative">
              <div className="w-3 h-3 bg-indigo-500 rounded-[3px] rotate-45 transform origin-center shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
              <div className="w-3 h-3 bg-[#0d9488] rounded-[3px] rotate-45 transform origin-center shadow-[0_0_12px_rgba(13,148,136,0.6)]" />
              <div className="w-3 h-3 bg-[#ea580c] rounded-[3px] rotate-45 transform origin-center shadow-[0_0_12px_rgba(234,88,12,0.6)]" />
              <div className="w-3 h-3 bg-violet-500 rounded-[3px] rotate-45 transform origin-center shadow-[0_0_12px_rgba(167,139,250,0.6)]" />
            </div>
            
            <div className="flex items-baseline gap-1.5 ml-1">
              <span className="font-extrabold text-2xl tracking-tight text-white font-sans">ConsensuSync</span>
              <span className="text-gray-400 text-xs font-normal lowercase tracking-wide font-sans">loyalty</span>
            </div>
          </div>

          {/* Navigation island */}
          <nav className="flex space-x-1 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shadow-lg">
            <button
              onClick={() => setActiveTab('dining')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                activeTab === 'dining'
                  ? 'bg-zinc-900 text-white shadow border border-zinc-800 scale-[1.02]'
                  : 'text-gray-550 hover:text-gray-300'
              }`}
            >
              <Layers className="h-4 w-4" /> Dinner Decider
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                activeTab === 'bills'
                  ? 'bg-zinc-900 text-white shadow border border-zinc-800 scale-[1.02]'
                  : 'text-gray-550 hover:text-gray-300'
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
      <footer className="relative z-10 border-t border-zinc-950 bg-black/40 py-6 text-center text-xs text-gray-600">
        ConsensuSync decision-making platform &copy; {new Date().getFullYear()} &middot; Built for Club Application
      </footer>
    </div>
  );
}

export default App;
