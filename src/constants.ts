import { Market, Strategy, Bot } from './types';

export const MARKET_LIST: Market[] = [
  { id: "1HZ10V", name: "Volatility 10 (1s)" },
  { id: "1HZ15V", name: "Volatility 15 (1s)" },
  { id: "1HZ25V", name: "Volatility 25 (1s)" },
  { id: "1HZ30V", name: "Volatility 30 (1s)" },
  { id: "1HZ50V", name: "Volatility 50 (1s)" },
  { id: "1HZ75V", name: "Volatility 75 (1s)" },
  { id: "1HZ90V", name: "Volatility 90 (1s)" },
  { id: "1HZ100V", name: "Volatility 100 (1s)" }
];

export const DECIMAL_PLACES: Record<string, number> = {
  "1HZ10V": 2, "1HZ15V": 3, "1HZ25V": 2, "1HZ30V": 3, "1HZ50V": 2, "1HZ75V": 2, "1HZ90V": 3, "1HZ100V": 2
};

export const TICK_BUFFER_SIZE = 25;
export const APP_ID = 69469;
export const REDIRECT_URL = 'https://otivoaihub.netlify.app';
export const SETTINGS_KEY = 'otivo_bot_settings';
export const KSH_RATE = 129;

export const getLoginUrl = () => {
  const oauthUrl = new URL('https://oauth.deriv.com/oauth2/authorize');
  oauthUrl.searchParams.append('app_id', APP_ID.toString());
  oauthUrl.searchParams.append('l', 'en');
  oauthUrl.searchParams.append('brand', 'deriv');
  oauthUrl.searchParams.append('scope', 'read trade payments trading_information');
  return oauthUrl.toString();
};

export const parseDerivCallback = (searchParams: URLSearchParams): import('./types').DerivAccount[] => {
  const accounts: import('./types').DerivAccount[] = [];
  let i = 1;

  while (searchParams.has(`acct${i}`)) {
    accounts.push({
      account: searchParams.get(`acct${i}`) || '',
      token: searchParams.get(`token${i}`) || '',
      currency: searchParams.get(`cur${i}`) || '',
    });
    i++;
  }

  return accounts;
};

export const STRATEGIES: Strategy[] = [
  { id: 'ZeroLock', name: 'ZeroLock', icon: 'Lock', description: 'Targets digits with 0% frequency in the last 25 ticks. High probability of differing as the digit is currently absent.' },
  { id: 'HighWall', name: 'HighWall', icon: 'Shield', description: 'Monitors high-value digits (7, 8, 9). If their combined frequency exceeds 40%, it trades against the rarest among them.' },
  { id: 'MidShield', name: 'MidShield', icon: 'Activity', description: 'Detects when middle digits (4, 5, 6) are over-saturated (>55% frequency). It shields your stake by trading against the rarest non-middle digits.' },
  { id: 'StreakBreak', name: 'StreakBreak', icon: 'Zap', description: 'Identifies immediate patterns where the same digit appears 3 times in a row. Trades "Differs" to bet against a 4th consecutive appearance.' },
  { id: 'VolShift', name: 'VolShift', icon: 'TrendingUp', description: 'Triggers when market volatility spikes by 30% or more. Selects the absolute rarest digit to trade during the market shift.' },
  { id: 'SecondRare18', name: 'SecondRare18', icon: 'Target', description: 'A sophisticated approach that avoids the absolute rarest digit (which might be due for a return) and targets the second rarest digit instead.' },
  { id: 'MomentumFade12', name: 'MomentumFade12', icon: 'Cpu', description: 'Fades digits that have high overall frequency (>25%) and recent short-term momentum (3 appearances in last 5 ticks).' },
  { id: 'VolRegime2', name: 'VolRegime2', icon: 'Layers', description: 'Compares short-term (10 ticks) vs long-term (25 ticks) volatility. If short-term volatility is higher, it trades the rarest digit.' },
  { id: 'DigitMomentumHMM', name: 'DigitMomentumHMM', icon: 'Scale', description: 'Uses a momentum-based model to track increasing digit frequency over 3 time windows. Fades digits with accelerating momentum.' },
  { id: 'MetaAdaptiveHMM', name: 'MetaAdaptiveHMM', icon: 'Rocket', description: 'A complex model using Shannon Entropy and Volatility weighting to calculate a "safety score" for each digit. Trades the highest scoring digit.' },
  { id: 'LDP', name: 'LDP', icon: 'Flame', description: 'Finds the least frequent digit and persists with it until a loss. Recalculates only after a loss to maintain high-speed adaptation.' },
  { id: 'DPMG25', name: 'DPMG-25', icon: 'Coins', description: 'Digit Probability Mind Game. Targets the most frequent digit (highest probability) and trades "Differs" against it, exploiting the bias that high-frequency digits will eventually cool down.' },
  { id: 'TrendSlayer', name: 'TrendSlayer', icon: 'Crosshair', description: 'Targets digits that have been trending up in frequency but are now hitting a resistance level. Fades the trend at its peak.' },
  { id: 'ParityPulse', name: 'ParityPulse', icon: 'Zap', description: 'Analyzes the balance between odd and even digits. Trades when the parity distribution is skewed beyond 70/30.' },
  { id: 'FibonacciDigit', name: 'FibonacciDigit', icon: 'MousePointer2', description: 'Uses Fibonacci sequences to predict digit gaps. Trades when a digit has been absent for a Fibonacci number of ticks.' },
  { id: 'QuantumScalp', name: 'QuantumScalp', icon: 'Ruler', description: 'A high-frequency bot that trades on micro-fluctuations in digit probability. Optimized for Volatility 100 (1s).' },
  { id: 'NeuralNetLite', name: 'NeuralNetLite', icon: 'Timer', description: 'A lightweight neural network simulation that learns digit patterns over the last 100 ticks to predict the next most likely digit to avoid.' },
  { id: 'ChaosTheory', name: 'ChaosTheory', icon: 'BarChart3', description: 'Exploits the chaotic nature of synthetic indices by identifying "islands of order" in digit sequences.' },
  { id: 'EVN', name: 'Even', icon: 'Scale', description: 'Trades on even digit outcomes using parity analysis.' },
  { id: 'ODD', name: 'Odd', icon: 'Scale', description: 'Trades on odd digit outcomes using parity analysis.' },
  { id: 'O4', name: 'Over 4', icon: 'TrendingUp', description: 'Trades on digits greater than 4 (5, 6, 7, 8, 9).' },
  { id: 'U5', name: 'Under 5', icon: 'TrendingDown', description: 'Trades on digits less than 5 (0, 1, 2, 3, 4).' },
  { id: 'RIS', name: 'Rise', icon: 'Rocket', description: 'Trades on upward price movement (Rise).' },
  { id: 'FAL', name: 'Fall', icon: 'Flame', description: 'Trades on downward price movement (Fall).' },
  { id: 'ACCU', name: 'Accumulator', icon: 'Coins', description: 'OTIVO PRO ACCUMULATOR - High-growth compounding engine.' },
  { id: 'CROSS_IGNITE', name: 'CrossIgnite', icon: 'Crosshair', description: 'EMA 9/21 Crossing strategy for trend identification.' },
  { id: 'RSI_BURST', name: 'RSI Burst', icon: 'Zap', description: 'Momentum flip detection using RSI indicators.' },
  { id: 'VWAP_SNAP', name: 'VWAP Snap', icon: 'MousePointer2', description: 'Mean reclaim strategy based on VWAP levels.' },
  { id: 'BAND_BREAK', name: 'BandBreak', icon: 'Ruler', description: 'Volatility expansion detection using Bollinger Bands.' },
  { id: 'ZERO_SHIFT', name: 'ZeroShift', icon: 'Timer', description: 'MACD regime shift detection for trend reversals.' },
  { id: 'SEQUENTIAL_TIME', name: 'SeqTime', icon: 'BarChart3', description: 'Time-based cyclic trading (2s→5s→9s→14s).' },
  { id: 'FREQ_SCAN', name: 'FreqScan', icon: 'Search', description: 'Indicator 1: Frequency Distribution Scanner. Targets digits with the lowest appearance frequency.' },
  { id: 'GAP_ANALYZE', name: 'GapAnalyze', icon: 'PieChart', description: 'Indicator 2: Gap Interval Analyzer. Targets digits with the largest average gap between appearances.' },
  { id: 'VOL_MODEL', name: 'VolModel', icon: 'BarChart3', description: 'Indicator 3: Volatility-Inverse Probability Model. Targets digits with the highest stable rarity score.' },
  { id: 'TRIPLE_THREAT', name: 'TripleThreat', icon: 'Target', description: '3-Indicator Strategy: Trades ONLY when all three indicators (Frequency, Gap, and Volatility) agree on the same digit.' },
];

export const BOTS: Bot[] = [
  {
    id: 'bot1',
    name: 'OTIVO MASTER AI',
    icon: 'Cpu',
    description: 'The master bot containing all 18 advanced trading strategies.',
    strategies: STRATEGIES.slice(0, 18).map(s => s.id)
  },
  {
    id: 'bot2',
    name: 'OTIVO HYBRID AI',
    icon: 'Activity',
    description: 'OTIVO HYBRID AI - Strategy Signal Analyzer V9.5 with SSA-5 Analysis.',
    strategies: ['EVN', 'ODD', 'O4', 'U5', 'RIS', 'FAL']
  },
  {
    id: 'bot3',
    name: 'OTIVO PRO ACCUMULATOR',
    icon: 'Zap',
    description: 'OTIVO PRO ACCUMULATOR - High-growth compounding engine with multi-core logic.',
    strategies: ['ACCU', 'CROSS_IGNITE', 'RSI_BURST', 'VWAP_SNAP', 'BAND_BREAK', 'ZERO_SHIFT', 'SEQUENTIAL_TIME']
  },
  {
    id: 'bot4',
    name: 'OTIVO TRIPLE THREAT',
    icon: 'Target',
    description: 'OTIVO TRIPLE THREAT - 3-Indicator Digit Differs Strategy with high-precision entry.',
    strategies: ['FREQ_SCAN', 'GAP_ANALYZE', 'VOL_MODEL', 'TRIPLE_THREAT']
  }
];
