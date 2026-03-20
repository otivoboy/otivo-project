import React from 'react';
import Icon from './Icon';
import { getLoginUrl } from '../constants';
import { DerivAccount } from '../types';

interface NavbarProps {
  isAuthorized: boolean;
  activeAccount: string;
  accounts: DerivAccount[];
  onSwitchAccount: (account: string) => void;
  balance: number | null;
  currency: string;
  onLogout: () => void;
  onViewChange: (view: 'home' | 'bot') => void;
  currentView: 'home' | 'bot';
  formatValue: (val: number | null | undefined) => string;
}

export default function Navbar({ 
  isAuthorized, 
  activeAccount, 
  accounts,
  onSwitchAccount,
  balance, 
  currency, 
  onLogout, 
  onViewChange,
  currentView,
  formatValue
}: NavbarProps) {
  return (
    <nav className="border-b border-white/10 p-4 md:px-8 flex justify-between items-center bg-[#202123] sticky top-0 z-50">
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => onViewChange('home')}
      >
        <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden rounded-lg">
          <img 
            src="/logo.png" 
            alt="OTIVO HUB AI" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-xl font-black tracking-tighter italic font-serif hidden sm:block">
          OTIVO HUB AI
        </h1>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => onViewChange('home')}
            className={`text-xs uppercase tracking-widest font-bold transition-colors ${currentView === 'home' ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            Home
          </button>
          <button 
            onClick={() => onViewChange('bot')}
            className={`text-xs uppercase tracking-widest font-bold transition-colors ${currentView === 'bot' ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            Trading Bot
          </button>
        </div>

        <div className="flex items-center gap-4">
          {isAuthorized ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[8px] uppercase opacity-50 font-mono">Balance</span>
                <span className="text-sm font-mono font-bold text-green-400">
                  {formatValue(balance)} <span className="text-[10px] opacity-50">{currency}</span>
                </span>
              </div>
              
              <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

              <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] uppercase opacity-50 font-mono leading-none">Account</span>
                  {accounts.length > 1 ? (
                    <select 
                      value={activeAccount}
                      onChange={(e) => onSwitchAccount(e.target.value)}
                      className="bg-transparent text-[10px] font-mono font-bold leading-none mt-1 outline-none cursor-pointer hover:text-emerald-400 transition-colors"
                    >
                      {accounts.map(acc => (
                        <option key={acc.account} value={acc.account} className="bg-[#202123] text-white">
                          {acc.account} ({acc.account.startsWith('VR') ? 'Demo' : 'Real'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[10px] font-mono font-bold leading-none mt-1">{activeAccount}</span>
                  )}
                </div>
                <button 
                  onClick={onLogout}
                  className="p-1 hover:bg-white/10 rounded-full text-red-400 transition-colors"
                  title="Logout"
                >
                  <Icon name="LogOut" className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-[#E4E3E0] text-[#343541] px-4 py-2 rounded font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all text-[10px] flex items-center gap-2"
              >
                <Icon name="LogIn" className="w-3 h-3" />
                Login
              </button>
              <button 
                onClick={() => window.open('https://deriv.com/signup/', '_blank')}
                className="border border-white/20 text-white px-4 py-2 rounded font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-[10px] hidden sm:block"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
