import React from 'react';
import { motion } from 'motion/react';
import { SSAAnalysis } from '../types';
import Icon from './Icon';

interface SSAPanelProps {
  analysis: SSAAnalysis | null;
  activeStrategy?: string;
  ticksCount: number;
}

export default function SSAPanel({ analysis, activeStrategy, ticksCount }: SSAPanelProps) {
  if (!analysis) {
    return (
      <section className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-6 flex items-center gap-3">
          <span className="w-8 h-[1px] bg-cyan-500/50"></span>
          SSA-5 Analysis
        </h2>
        <div className="text-[9px] text-amber-400 animate-pulse uppercase font-black tracking-widest">
          Collecting Data ({ticksCount}/20)
        </div>
      </section>
    );
  }

  return (
    <section className="bg-cyan-500/5 border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-6 flex items-center gap-3">
        <span className="w-8 h-[1px] bg-cyan-500/50"></span>
        SSA-5 Analysis
      </h2>
      
      <div className="space-y-4">
        <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 animate-pulse">
          <div className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1">Live Signal</div>
          <div className="text-[10px] font-bold text-white leading-tight">
            {analysis.runtimeRemaining <= 5 ? (
              <span className="text-amber-400">SAFETY BUFFER ACTIVE</span>
            ) : (
              <>USE <b className="text-cyan-400">{activeStrategy || 'SELECT STRATEGY'}</b><br/>EST. RUNTIME: <b>{analysis.runtimeRemaining} TICKS</b></>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="text-[7px] text-white/40 uppercase font-black">Pressure</div>
            <div className="text-xs font-mono font-bold text-white">{(analysis.pressure * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="text-[7px] text-white/40 uppercase font-black">Bias</div>
            <div className="text-xs font-mono font-bold text-white">{analysis.bias}</div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/40">Volatility:</span>
            <span className="text-cyan-400 font-bold">{analysis.volatility}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-white/40">Parity:</span>
            <span className="text-indigo-400 font-bold">{analysis.parity}</span>
          </div>
          
          <div className="mt-4 pt-2 border-t border-white/5">
            <div className="text-[8px] text-white/40 uppercase font-black tracking-widest">Runtime Remaining</div>
            <div className="text-xs font-mono text-white mt-1">
              {analysis.runtimeRemaining > 0 ? (
                `${analysis.runtimeRemaining} Ticks`
              ) : (
                <span className="text-rose-400 animate-pulse">RECOVERY EXTENSION</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
