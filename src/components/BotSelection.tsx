import React from 'react';
import { motion } from 'motion/react';
import Icon from './Icon';
import { STRATEGIES, BOTS } from '../constants';
import { Strategy, Bot } from '../types';

interface BotSelectionProps {
  selectedBotId: string | null;
  onSelectBot: (botId: string | null) => void;
  activeStrategies: string[];
  onToggleStrategy: (strategyId: string) => void;
  isMultiStrategy: boolean;
  onToggleMultiStrategy: () => void;
  onSelectAll: (strategyIds: string[]) => void;
}

export default function BotSelection({ 
  selectedBotId,
  onSelectBot,
  activeStrategies, 
  onToggleStrategy, 
  isMultiStrategy, 
  onToggleMultiStrategy,
  onSelectAll
}: BotSelectionProps) {
  const isCatalogMode = activeStrategies.length === 0;
  const selectedBot = BOTS.find(b => b.id === selectedBotId);

  if (!selectedBotId) {
    return (
      <section className="min-h-[60vh] flex flex-col justify-center">
        <div className="mb-12">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight italic font-serif">TRADING BOTS</h2>
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest mt-1">Select a bot to view its available strategies</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {BOTS.map((bot) => (
            <motion.button
              key={bot.id}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectBot(bot.id)}
              className="relative p-8 rounded-3xl border-2 border-white/10 bg-white/5 hover:border-emerald-500/50 transition-all text-left flex flex-col gap-4 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-4xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Icon name={bot.icon as any} className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-tight text-white/90 group-hover:text-emerald-400 transition-colors">
                  {bot.name}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed mt-2 italic">
                  {bot.description}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View {bot.strategies.length} Strategies</span>
                <Icon name="ArrowRight" className="w-3 h-3" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    );
  }

  // If a bot is selected, show its strategies
  const botStrategies = STRATEGIES.filter(s => selectedBot?.strategies.includes(s.id));

  const handleSelectAll = () => {
    if (activeStrategies.length === botStrategies.length) {
      onSelectBot(selectedBotId); // This will trigger handleSelectBot which resets strategies
    } else {
      onSelectAll(botStrategies.map(s => s.id));
    }
  };

  return (
    <section className={`transition-all duration-500 ${isCatalogMode ? 'min-h-[60vh] flex flex-col justify-center' : 'bg-[#202123]/30 border border-white/10 rounded-2xl p-6 mb-8'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onSelectBot(null)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/10 group"
            title="Back to Bots"
          >
            <Icon name="ArrowLeft" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className={`${isCatalogMode ? 'text-4xl md:text-6xl' : 'text-xl'} font-bold tracking-tight italic font-serif transition-all duration-500`}>
              {selectedBot?.name}
            </h2>
            <p className="text-xs text-white/40 font-mono uppercase tracking-widest mt-1">
              {isCatalogMode ? 'Select a strategy to initialize the trading terminal' : 'Choose your AI strategy or combine multiple'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
          >
            <Icon name={activeStrategies.length === botStrategies.length ? 'XCircle' : 'CheckCircle'} className="w-4 h-4" />
            {activeStrategies.length === botStrategies.length ? 'Deselect All' : 'Select All Strategies'}
          </button>

          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold opacity-50 ml-2">Multi-Bot Mode</span>
            <button 
              onClick={onToggleMultiStrategy}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isMultiStrategy ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${isMultiStrategy ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${isCatalogMode ? 'w-full' : ''}`}>
        {botStrategies.map((strat) => {
          const isActive = activeStrategies.includes(strat.id);
          return (
            <motion.button
              key={strat.id}
              initial={isCatalogMode ? { opacity: 0, y: 20 } : false}
              animate={isCatalogMode ? { opacity: 1, y: 0 } : false}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggleStrategy(strat.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 group ${
                isActive 
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                  : 'bg-white/5 border-transparent hover:border-white/20'
              } ${isCatalogMode ? 'h-full min-h-[160px]' : ''}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors ${
                isActive ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'
              }`}>
                <Icon name={strat.icon as any} className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className={`font-bold text-base uppercase tracking-tight ${isActive ? 'text-emerald-400' : 'text-white/80'}`}>
                  {strat.name}
                </h3>
                <p className="text-[11px] text-white/40 leading-relaxed mt-1 line-clamp-3 italic">
                  {strat.description}
                </p>
              </div>

              {isActive && (
                <div className="absolute top-4 right-4">
                  <Icon name="CheckCircle" className="w-6 h-6 text-emerald-400" />
                </div>
              )}
              
              <div className={`absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-500 ${isActive ? 'w-full' : 'w-0'}`} />
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
