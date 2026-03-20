export type AppView = 'home' | 'bot';

export interface Market {
  id: string;
  name: string;
}

export interface Strategy {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Bot {
  id: string;
  name: string;
  icon: string;
  description: string;
  strategies: string[]; // IDs of strategies
}

export interface SSAAnalysis {
  pressure: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'CHOPPY' | 'SMOOTH' | 'STABLE';
  parity: 'STREAK' | 'BIASED' | 'BALANCED';
  streakCount: number;
  evens: number;
  scores: Record<string, number>;
  suggestedRuntime: number;
  runtimeRemaining: number;
}

export interface Trade {
  id: string;
  symbol: string;
  digit: number;
  type: 'DIGITDIFF' | 'DIGITMATCH' | 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER' | 'CALL' | 'PUT' | 'ACCU';
  strategy: string;
  status: 'pending' | 'won' | 'lost' | 'error';
  timestamp: number;
  contractId?: string;
  profit?: number;
  entryTick?: number;
  exitTick?: number;
}

export interface MarketMemory {
  ticks: number[];
  lastDigits: number[];
  stats: Record<number, number>;
  gaps: Record<number, number>;
  volatility?: number;
  prevVolatility?: number;
  transitions: Record<number, Record<number, number>>;
}

export interface SystemLog {
  id: number;
  message: string;
  timestamp: string;
}

export interface AppSettings {
  stake: number;
  martingaleMultiplier: number;
  takeProfit: number;
  stopLoss: number;
  cooldown: number;
  displayCurrency: 'USD' | 'KSH';
  isStrategyMode: boolean;
  isMultiStrategy: boolean;
  activeStrategies: string[];
  isSingleSymbolMode: boolean;
  selectedSymbol: string;
}

export interface DerivAccount {
  account: string;
  token: string;
  currency: string;
}
