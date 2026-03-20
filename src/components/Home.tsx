import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Icon from './Icon';

interface HomeProps {
  onStartTrading: () => void;
  isAuthorized: boolean;
}

const TERMINAL_STATES = [
  {
    id: 1,
    content: (
      <>
        <div className="flex gap-4">
          <span className="text-emerald-400">[SYSTEM]</span>
          <span className="text-white/40">Initializing Digit Memory Engine...</span>
        </div>
        <div className="flex gap-4">
          <span className="text-emerald-400">[SYSTEM]</span>
          <span className="text-white/40">Connecting to Volatility 100 (1s)...</span>
        </div>
        <div className="flex gap-4">
          <span className="text-blue-400">[ANALYSIS]</span>
          <span className="text-white/70">Pattern detected: ZeroLock Strategy active</span>
        </div>
        <div className="pl-4 border-l border-white/10 space-y-2 py-2">
          <div className="flex justify-between">
            <span className="text-white/40">Last Digit:</span>
            <span className="text-emerald-400 font-bold">7</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Probability:</span>
            <span className="text-white/70">94.2%</span>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="text-yellow-400">[TRADE]</span>
          <span className="text-white/90">Executing DigitDiff (Stake: $10.00)</span>
        </div>
      </>
    )
  },
  {
    id: 2,
    content: (
      <>
        <div className="flex gap-4">
          <span className="text-blue-400">[NETWORK]</span>
          <span className="text-white/40">WebSocket connected to Deriv API</span>
        </div>
        <div className="flex gap-4">
          <span className="text-emerald-400">[MARKET]</span>
          <span className="text-white/40">Analyzing Volatility 10 (1s)</span>
        </div>
        <div className="flex gap-4">
          <span className="text-purple-400">[STRATEGY]</span>
          <span className="text-white/70">Gap Hunter v2: Gap detected on Digit 3</span>
        </div>
        <div className="pl-4 border-l border-white/10 space-y-2 py-2">
          <div className="flex justify-between">
            <span className="text-white/40">Gap Size:</span>
            <span className="text-blue-400 font-bold">18 ticks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Threshold:</span>
            <span className="text-white/70">15</span>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="text-yellow-400">[TRADE]</span>
          <span className="text-white/90">Executing DigitMatch (Stake: $5.00)</span>
        </div>
      </>
    )
  },
  {
    id: 3,
    content: (
      <>
        <div className="flex gap-4">
          <span className="text-emerald-400">[ENGINE]</span>
          <span className="text-white/40">Multi-Bot Mode: 4 strategies active</span>
        </div>
        <div className="flex gap-4">
          <span className="text-blue-400">[SYNC]</span>
          <span className="text-white/40">Market data synchronized across 12 indices</span>
        </div>
        <div className="flex gap-4">
          <span className="text-green-400">[PROFIT]</span>
          <span className="text-white/70">Daily target reached: +$125.40</span>
        </div>
        <div className="pl-4 border-l border-white/10 space-y-2 py-2">
          <div className="flex justify-between">
            <span className="text-white/40">Status:</span>
            <span className="text-yellow-400 font-bold">Cooldown Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Remaining:</span>
            <span className="text-white/70">30s</span>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="text-white/30 italic">[STATUS]</span>
          <span className="text-white/20 italic">Awaiting next market cycle...</span>
        </div>
      </>
    )
  }
];

const Sparkle = ({ delay }: { delay: number }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0, 1.2, 0],
      rotate: [0, 45, 90]
    }}
    transition={{ 
      duration: 1.5, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut"
    }}
    className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
    style={{
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    }}
  />
);

export default function Home({ onStartTrading, isAuthorized }: HomeProps) {
  const [terminalIndex, setTerminalIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTerminalIndex((prev) => (prev + 1) % TERMINAL_STATES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full px-4 md:px-8 py-12 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              AI-Powered Trading Engine v2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic font-serif leading-none relative">
              <motion.span
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 15px rgba(255,255,255,0.6)",
                    "0 0 30px rgba(255,255,255,0.9)",
                    "0 0 15px rgba(255,255,255,0.6)",
                    "0 0 0px rgba(255,255,255,0)"
                  ],
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="block mb-2 relative"
              >
                MASTER THE
                <Sparkle delay={0} />
                <Sparkle delay={0.5} />
                <Sparkle delay={1.2} />
              </motion.span>
              <motion.span 
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  filter: ["brightness(1)", "brightness(1.8)", "brightness(1)"]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#E4E3E0] via-white to-[#E4E3E0] bg-[length:200%_auto] relative"
              >
                DIGIT MARKETS
                <Sparkle delay={0.3} />
                <Sparkle delay={0.8} />
                <Sparkle delay={1.5} />
              </motion.span>
            </h1>
            <p className="text-lg text-white/60 max-w-lg leading-relaxed">
              Otivo AI uses high-frequency digit memory analysis to exploit patterns in synthetic indices. 
              Automate your strategy with precision and speed.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={onStartTrading}
              className="bg-[#E4E3E0] text-[#343541] px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-xl shadow-black/20"
            >
              <Icon name="Play" className="w-5 h-5 fill-current" />
              Launch Trading Bot
            </button>
            {!isAuthorized && (
              <button 
                onClick={() => window.open('https://deriv.com/signup/', '_blank')}
                className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Create Account
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
            <div>
              <div className="text-2xl font-bold font-mono">99.9%</div>
              <div className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">12+</div>
              <div className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Strategies</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">&lt; 50ms</div>
              <div className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Latency</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 blur-3xl rounded-full opacity-50"></div>
          <div className="relative bg-[#202123] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
              <div className="text-[10px] font-mono opacity-30 ml-4">otivo-engine-v2.terminal</div>
            </div>
            <div className="p-8 space-y-6 font-mono text-xs min-h-[280px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={terminalIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {TERMINAL_STATES[terminalIndex].content}
                </motion.div>
              </AnimatePresence>
              
              <div className="animate-pulse flex gap-2 items-center pt-4 border-t border-white/5">
                <span className="w-2 h-4 bg-emerald-500"></span>
                <span className="text-white/20 italic">Awaiting tick confirmation...</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Icon name="Zap" className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Instant Execution</h3>
          <p className="text-sm text-white/50 leading-relaxed">
            Direct WebSocket connection to Deriv ensures your trades are placed the millisecond a pattern is confirmed.
          </p>
        </div>
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Icon name="Brain" className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Digit Memory</h3>
          <p className="text-sm text-white/50 leading-relaxed">
            Our engine tracks the last 25 digits across all markets simultaneously, calculating real-time probabilities.
          </p>
        </div>
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Icon name="Shield" className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold mb-3">Risk Management</h3>
          <p className="text-sm text-white/50 leading-relaxed">
            Built-in Martingale, Take Profit, and Stop Loss controls to keep your capital protected at all times.
          </p>
        </div>
      </section>
    </div>
  );
}
