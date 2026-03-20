import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Icon from './components/Icon';
import Navbar from './components/Navbar';
import Home from './components/Home';
import BotSelection from './components/BotSelection';
import SSAPanel from './components/SSAPanel';
import RunPanel from './components/RunPanel';
import { 
  MARKET_LIST, 
  DECIMAL_PLACES, 
  TICK_BUFFER_SIZE, 
  APP_ID, 
  SETTINGS_KEY, 
  STRATEGIES, 
  BOTS,
  KSH_RATE,
  getLoginUrl,
  parseDerivCallback
} from './constants';
import { 
  Trade, 
  MarketMemory, 
  SystemLog, 
  AppSettings,
  AppView,
  Bot,
  SSAAnalysis
} from './types';

export default function App() {
  const [token, setToken] = useState<string>(localStorage.getItem('deriv_token') || '');
  const [activeAccount, setActiveAccount] = useState<string>(localStorage.getItem('deriv_account') || '');
  const [accounts, setAccounts] = useState<import('./types').DerivAccount[]>(JSON.parse(localStorage.getItem('deriv_accounts') || '[]'));
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const selectedBotIdRef = useRef<string | null>(null);

  // SSA-5 State
  const [ssaAnalysis, setSsaAnalysis] = useState<SSAAnalysis | null>(null);
  const [ssaTickCounter, setSsaTickCounter] = useState(0);
  const ssaAnalysisRef = useRef<SSAAnalysis | null>(null);

  // Bot No. 3 State
  const [sequentialIntervalIndex, setSequentialIntervalIndex] = useState(0);
  const sequentialIntervalIndexRef = useRef(0);
  const lastTradeEndTimeRef = useRef(Date.now());

  const handleSelectBot = (botId: string | null) => {
    setSelectedBotId(botId);
    setActiveStrategies([]); // Reset strategies when switching bots
  };
  
  const addLog = useCallback((message: string) => {
    setSystemLogs(prev => [{ id: Date.now() + Math.random(), message, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  }, []);

  // Handle Deriv OAuth callback
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search || window.location.hash.slice(1));
    if (searchParams.has('acct1')) {
      const newAccounts = parseDerivCallback(searchParams);
      if (newAccounts.length > 0) {
        setAccounts(newAccounts);
        localStorage.setItem('deriv_accounts', JSON.stringify(newAccounts));
        
        // Use the first account by default if none active
        const firstAccount = newAccounts[0];
        setToken(firstAccount.token);
        setActiveAccount(firstAccount.account);
        localStorage.setItem('deriv_token', firstAccount.token);
        localStorage.setItem('deriv_account', firstAccount.account);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        addLog(`Successfully logged in with ${newAccounts.length} accounts`);
      }
    } else if (searchParams.has('error')) {
      const errorMsg = searchParams.get('error');
      addLog(`Login error: ${errorMsg}`);
      setError(`Login failed: ${errorMsg}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [addLog]);

  const handleSwitchAccount = (account: string) => {
    const target = accounts.find(a => a.account === account);
    if (target) {
      setToken(target.token);
      setActiveAccount(target.account);
      localStorage.setItem('deriv_token', target.token);
      localStorage.setItem('deriv_account', target.account);
      addLog(`Switched to account ${target.account}`);
      
      // Force reconnect if running
      if (isRunning) {
        setIsRunning(false);
        setTimeout(() => setIsRunning(true), 500);
      }
    }
  };
  
  // Load initial settings from localStorage
  const savedSettings: Partial<AppSettings> = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [isRunning, setIsRunning] = useState(false);
  const [tradeRunning, setTradeRunning] = useState(false);
  const [memory, setMemory] = useState<Record<string, MarketMemory>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stake, setStake] = useState(savedSettings.stake ?? 1);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState(savedSettings.martingaleMultiplier ?? 11);
  const [currentStake, setCurrentStake] = useState(savedSettings.stake ?? 1);
  const [totalProfit, setTotalProfit] = useState(0);
  const totalProfitRef = useRef(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [totalStake, setTotalStake] = useState(0);
  const [totalPayout, setTotalPayout] = useState(0);
  const totalStakeRef = useRef(0);
  const totalPayoutRef = useRef(0);
  const [isRunPanelOpen, setIsRunPanelOpen] = useState(false);
  const [takeProfit, setTakeProfit] = useState(savedSettings.takeProfit ?? 10);
  const [stopLoss, setStopLoss] = useState(savedSettings.stopLoss ?? 5);
  const [cooldown, setCooldown] = useState(savedSettings.cooldown ?? 0);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'KSH'>(savedSettings.displayCurrency ?? 'USD');
  const [allSymbolsReady, setAllSymbolsReady] = useState(false);
  const [isStrategyMode, setIsStrategyMode] = useState(savedSettings.isStrategyMode ?? false);
  const [isMultiStrategy, setIsMultiStrategy] = useState(savedSettings.isMultiStrategy ?? false);
  const [activeStrategies, setActiveStrategies] = useState<string[]>(savedSettings.activeStrategies ?? []);
  const [displaySymbolIndex, setDisplaySymbolIndex] = useState(0);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSingleSymbolMode, setIsSingleSymbolMode] = useState(savedSettings.isSingleSymbolMode ?? false);
  const [selectedSymbol, setSelectedSymbol] = useState(savedSettings.selectedSymbol ?? MARKET_LIST[0].id);
  const [ldpDigits, setLdpDigits] = useState<Record<string, number | null>>({});
  const [lastLdpLostDigit, setLastLdpLostDigit] = useState<Record<string, number | null>>({});
  const [dpmgDigits, setDpmgDigits] = useState<Record<string, number | null>>({});
  const [hoveredStrategy, setHoveredStrategy] = useState<any>(null);
  const [, setTickUpdate] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const activeContractIdRef = useRef<string | null>(null);
  const isExecutingRef = useRef(false);
  const isRunningRef = useRef(isRunning);
  
  const stakeRef = useRef(stake);
  const currentStakeRef = useRef(currentStake);
  const martingaleMultiplierRef = useRef(martingaleMultiplier);
  const cooldownRef = useRef(cooldown);
  const lastTradeTimeRef = useRef(0);
  const lastStrategyRef = useRef<string | null>(null);
  const strategyRotationIndexRef = useRef(0);
  const isStrategyModeRef = useRef(isStrategyMode);
  const isMultiStrategyRef = useRef(isMultiStrategy);
  const activeStrategiesRef = useRef(activeStrategies);
  const takeProfitRef = useRef(takeProfit);
  const stopLossRef = useRef(stopLoss);
  const isSingleSymbolModeRef = useRef(isSingleSymbolMode);
  const selectedSymbolRef = useRef(selectedSymbol);

  useEffect(() => { totalProfitRef.current = totalProfit; }, [totalProfit]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { stakeRef.current = stake; }, [stake]);
  useEffect(() => { currentStakeRef.current = currentStake; }, [currentStake]);
  useEffect(() => { martingaleMultiplierRef.current = martingaleMultiplier; }, [martingaleMultiplier]);
  useEffect(() => { cooldownRef.current = cooldown; }, [cooldown]);
  useEffect(() => { isStrategyModeRef.current = isStrategyMode; }, [isStrategyMode]);
  useEffect(() => { isMultiStrategyRef.current = isMultiStrategy; }, [isMultiStrategy]);
  useEffect(() => { activeStrategiesRef.current = activeStrategies; }, [activeStrategies]);
  useEffect(() => { takeProfitRef.current = takeProfit; }, [takeProfit]);
  useEffect(() => { stopLossRef.current = stopLoss; }, [stopLoss]);
  useEffect(() => { isSingleSymbolModeRef.current = isSingleSymbolMode; }, [isSingleSymbolMode]);
  useEffect(() => { selectedSymbolRef.current = selectedSymbol; }, [selectedSymbol]);
  useEffect(() => { selectedBotIdRef.current = selectedBotId; }, [selectedBotId]);

  // Persist settings to localStorage
  useEffect(() => {
    const settings: AppSettings = {
      stake,
      martingaleMultiplier,
      takeProfit,
      stopLoss,
      cooldown,
      displayCurrency,
      isStrategyMode,
      isMultiStrategy,
      activeStrategies,
      isSingleSymbolMode,
      selectedSymbol
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [stake, martingaleMultiplier, takeProfit, stopLoss, cooldown, displayCurrency, isStrategyMode, isMultiStrategy, activeStrategies, isSingleSymbolMode, selectedSymbol]);

  useEffect(() => {
    if (!isMultiStrategy && activeStrategies.length > 1) {
      setActiveStrategies([activeStrategies[0]]);
    }
  }, [isMultiStrategy]);

  useEffect(() => {
    strategyRotationIndexRef.current = 0;
  }, [activeStrategies]);

  useEffect(() => {
    const initialMemory: Record<string, MarketMemory> = {};
    MARKET_LIST.forEach(m => {
      initialMemory[m.id] = {
        ticks: [],
        lastDigits: [],
        stats: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i, 0])),
        gaps: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i, 0])),
        transitions: {}
      };
    });
    setMemory(initialMemory);
  }, []);

  useEffect(() => {
    setCurrentStake(stake);
  }, [stake]);

  const onClearStats = () => {
    setTrades([]);
    setTotalProfit(0);
    totalProfitRef.current = 0;
    setTotalTrades(0);
    setTotalWins(0);
    setTotalLosses(0);
    setTotalStake(0);
    totalStakeRef.current = 0;
    setTotalPayout(0);
    totalPayoutRef.current = 0;
    addLog('Statistics and history cleared');
  };

  const calculateVolatility = useCallback((quotes: number[]) => {
    if (quotes.length < 2) return 0;
    const mean = quotes.reduce((a, b) => a + b, 0) / quotes.length;
    const variance = quotes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / quotes.length;
    return Math.sqrt(variance);
  }, []);

  const calculateEntropy = useCallback((stats: Record<number, number>) => {
    const probs = Object.values(stats).map(f => f / 100).filter(p => p > 0);
    return -probs.reduce((sum, p) => sum + p * Math.log2(p), 0);
  }, []);

  const calculateEMA = useCallback((prices: number[], period: number) => {
    if (prices.length < period) return prices[0];
    const k = 2 / (period + 1);
    let ema = prices[prices.length - 1];
    for (let i = prices.length - 2; i >= 0; i--) {
      ema = (prices[i] - ema) * k + ema;
    }
    return ema;
  }, []);

  const calculateRSI = useCallback((prices: number[], period = 7) => {
    if (prices.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = 0; i < period; i++) {
      const diff = prices[i] - prices[i + 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  }, []);

  const calculateBollingerBands = useCallback((prices: number[], period = 20, stdDev = 2) => {
    if (prices.length < period) return { middle: prices[0], upper: prices[0], lower: prices[0] };
    const slice = prices.slice(0, period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period;
    const dev = Math.sqrt(variance);
    return { middle, upper: middle + (stdDev * dev), lower: middle - (stdDev * dev) };
  }, []);

  const indicator1FrequencyScanner = useCallback((digits: number[]) => {
    if (digits.length === 0) return null;
    const frequency = new Array(10).fill(0);
    digits.forEach(digit => {
      if (digit >= 0 && digit <= 9) frequency[digit]++;
    });
    const minFrequency = Math.min(...frequency);
    const leastFrequentDigits = [];
    for (let i = 0; i < 10; i++) {
      if (frequency[i] === minFrequency) leastFrequentDigits.push(i);
    }
    return leastFrequentDigits[Math.floor(Math.random() * leastFrequentDigits.length)];
  }, []);

  const indicator2GapAnalyzer = useCallback((digits: number[]) => {
    if (digits.length === 0) return null;
    const gapData = Array.from({ length: 10 }, () => [] as number[]);
    for (let i = 0; i < digits.length; i++) {
      if (digits[i] >= 0 && digits[i] <= 9) gapData[digits[i]].push(i);
    }
    const avgGaps = new Array(10).fill(0);
    for (let digit = 0; digit < 10; digit++) {
      const positions = gapData[digit];
      if (positions.length < 2) {
        avgGaps[digit] = 100;
      } else {
        const gaps = [];
        for (let i = 1; i < positions.length; i++) {
          gaps.push(positions[i] - positions[i-1]);
        }
        avgGaps[digit] = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
      }
    }
    const maxGap = Math.max(...avgGaps);
    const maxGapDigits = [];
    for (let i = 0; i < 10; i++) {
      if (avgGaps[i] === maxGap) maxGapDigits.push(i);
    }
    return maxGapDigits[Math.floor(Math.random() * maxGapDigits.length)];
  }, []);

  const indicator3VolatilityModel = useCallback((digits: number[]) => {
    if (digits.length === 0) return null;
    const frequency = new Array(10).fill(0);
    digits.forEach(digit => {
      if (digit >= 0 && digit <= 9) frequency[digit]++;
    });
    const probabilities = frequency.map(count => count / digits.length);
    const rarityScores = probabilities.map(p => p === 0 ? 100 : 1 / p);
    const digitVolatility = new Array(10).fill(0);
    for (let digit = 0; digit < 10; digit++) {
      let changes = 0;
      let lastWasDigit = digits[0] === digit;
      for (let i = 1; i < digits.length; i++) {
        const isDigit = digits[i] === digit;
        if (isDigit !== lastWasDigit) {
          changes++;
          lastWasDigit = isDigit;
        }
      }
      digitVolatility[digit] = changes / Math.max(1, digits.length - 1);
    }
    const stableRarity = rarityScores.map((score, digit) => score * (1 - digitVolatility[digit]));
    const maxRarity = Math.max(...stableRarity);
    const maxRarityDigits = [];
    for (let i = 0; i < 10; i++) {
      if (stableRarity[i] === maxRarity) maxRarityDigits.push(i);
    }
    return maxRarityDigits[Math.floor(Math.random() * maxRarityDigits.length)];
  }, []);

  const checkStrategies = (symbol: string, mem: MarketMemory) => {
    const results: { strategy: string, digit: number, type: Trade['type'] }[] = [];
    const digits = mem.lastDigits || [];
    const stats = mem.stats;
    const lastDigit = digits[digits.length - 1];

    // 1. ZeroLock
    if (digits.length >= 25) {
      for (let d = 0; d <= 9; d++) {
        if (stats[d] === 0) {
          results.push({ strategy: 'ZeroLock', digit: d, type: 'DIGITDIFF' });
        }
      }
    }

    // 2. HighWall
    const highFreqSum = (stats[7] || 0) + (stats[8] || 0) + (stats[9] || 0);
    if (highFreqSum > 40) {
      let lowestFreq = 101;
      let lowestDigit = 0;
      for (let d = 7; d <= 9; d++) {
        if (stats[d] < lowestFreq) {
          lowestFreq = stats[d];
          lowestDigit = d;
        }
      }
      if (lowestFreq < 8) {
        results.push({ strategy: 'HighWall', digit: lowestDigit, type: 'DIGITDIFF' });
      }
    }

    // 3. MidShield
    const midFreqSum = (stats[4] || 0) + (stats[5] || 0) + (stats[6] || 0);
    if (midFreqSum > 55) {
      let bestDigit = -1;
      let minF = 101;
      [0,1,2,3,7,8,9].forEach(d => {
        if (stats[d] < minF) {
          minF = stats[d];
          bestDigit = d;
        }
      });
      if (bestDigit !== -1) results.push({ strategy: 'MidShield', digit: bestDigit, type: 'DIGITDIFF' });
    }

    // 4. StreakBreak
    if (digits.length >= 3 && digits[digits.length-1] === digits[digits.length-2] && digits[digits.length-2] === digits[digits.length-3]) {
      results.push({ strategy: 'StreakBreak', digit: digits[digits.length-1], type: 'DIGITDIFF' });
    }

    // 5. VolShift
    if (mem.volatility && mem.prevVolatility && mem.volatility > mem.prevVolatility * 1.3) {
      let minF = 101;
      let minD = 0;
      for (let d = 0; d <= 9; d++) {
        if (stats[d] < minF) {
          minF = stats[d];
          minD = d;
        }
      }
      results.push({ strategy: 'VolShift', digit: minD, type: 'DIGITDIFF' });
    }

    // 6. SecondRare18
    const sorted = Object.entries(stats).sort((a, b) => a[1] - b[1]);
    if (sorted.length >= 2) {
      results.push({ strategy: 'SecondRare18', digit: parseInt(sorted[1][0]), type: 'DIGITDIFF' });
    }

    // 7. MomentumFade12
    for (let d = 0; d <= 9; d++) {
      const last5 = digits.slice(-5);
      const countLast5 = last5.filter(x => x === d).length;
      if (stats[d] > 25 && countLast5 >= 3) {
        results.push({ strategy: 'MomentumFade12', digit: d, type: 'DIGITDIFF' });
      }
    }

    // 9. VolRegime2
    const volShort = calculateVolatility(mem.ticks.slice(-10));
    const volLong = calculateVolatility(mem.ticks.slice(-25));
    if (volShort > volLong) {
      let minF = 101;
      let minD = 0;
      for (let d = 0; d <= 9; d++) {
        if (stats[d] < minF) {
          minF = stats[d];
          minD = d;
        }
      }
      results.push({ strategy: 'VolRegime2', digit: minD, type: 'DIGITDIFF' });
    }

    // 10. DigitMomentumHMM
    for (let d = 0; d <= 9; d++) {
      const w1 = digits.slice(-5).filter(x => x === d).length;
      const w2 = digits.slice(-10, -5).filter(x => x === d).length;
      const w3 = digits.slice(-15, -10).filter(x => x === d).length;
      if (w1 > w2 && w2 > w3 && stats[d] > 20) {
        results.push({ strategy: 'DigitMomentumHMM', digit: d, type: 'DIGITDIFF' });
      }
    }

    // 14. MetaAdaptiveHMM
    const entropy = calculateEntropy(stats);
    const volWeight = mem.volatility ? (mem.volatility / 100) : 0;
    const entWeight = entropy / 3.32;
    let maxScore = -1;
    let bestD = 0;
    for (let d = 0; d <= 9; d++) {
      const score = (1 - (stats[d]/100)) + volWeight + entWeight;
      if (score > maxScore) {
        maxScore = score;
        bestD = d;
      }
    }
    results.push({ strategy: 'MetaAdaptiveHMM', digit: bestD, type: 'DIGITDIFF' });

    // 15. Least Digit Persistence (LDP)
    const currentLdp = ldpDigits[symbol];
    let ldpTarget: number | null | undefined = currentLdp;
    
    if (ldpTarget === undefined || ldpTarget === null) {
      let minFreq = 101;
      let candidates: number[] = [];
      const lastLost = lastLdpLostDigit[symbol];

      for (let d = 0; d <= 9; d++) {
        if (stats[d] < minFreq) {
          minFreq = stats[d];
          candidates = [d];
        } else if (stats[d] === minFreq) {
          candidates.push(d);
        }
      }

      if (candidates.length > 1 && lastLost !== undefined && lastLost !== null) {
        const filtered = candidates.filter(c => c !== lastLost);
        if (filtered.length > 0) candidates = filtered;
      }

      if (candidates.length > 1) {
        let maxGap = -1;
        let bestD = candidates[0];
        candidates.forEach(d => {
          if (mem.gaps[d] > maxGap) {
            maxGap = mem.gaps[d];
            bestD = d;
          }
        });
        ldpTarget = bestD;
      } else {
        ldpTarget = candidates[0];
      }
    }
    if (ldpTarget !== null && ldpTarget !== undefined) {
      results.push({ strategy: 'LDP', digit: ldpTarget, type: 'DIGITDIFF' });
    }

    // 16. Digit Probability Mind Game (DPMG-25)
    const currentDpmg = dpmgDigits[symbol];
    let dpmgTarget: number | null | undefined = currentDpmg;

    if (dpmgTarget === undefined || dpmgTarget === null) {
      let maxFreq = -1;
      let bestD = -1;
      let secondMaxFreq = -1;

      for (let d = 0; d <= 9; d++) {
        const freq = stats[d] / 4; 
        if (freq > maxFreq) {
          secondMaxFreq = maxFreq;
          maxFreq = freq;
          bestD = d;
        } else if (freq > secondMaxFreq) {
          secondMaxFreq = freq;
        }
      }

      if (maxFreq >= 4 && lastDigit !== bestD && (maxFreq - secondMaxFreq) >= 2) {
        dpmgTarget = bestD;
      }
    }

    if (dpmgTarget !== undefined && dpmgTarget !== null) {
      results.push({ strategy: 'DPMG25', digit: dpmgTarget, type: 'DIGITDIFF' });
    }

    // Bot No. 3 Strategies
    if (selectedBotIdRef.current === 'bot3') {
      const prices = mem.ticks || [];
      const currentPrice = prices[0];

      // ACCU: Accumulator
      if (activeStrategiesRef.current.includes('ACCU')) {
        results.push({ strategy: 'ACCU', digit: 0, type: 'ACCU' });
      }

      // CROSS_IGNITE: EMA 9/21 Crossing
      if (activeStrategiesRef.current.includes('CROSS_IGNITE') && prices.length >= 22) {
        const ema9 = calculateEMA(prices, 9);
        const ema21 = calculateEMA(prices, 21);
        const prevEma9 = calculateEMA(prices.slice(1), 9);
        const prevEma21 = calculateEMA(prices.slice(1), 21);

        if (prevEma9 <= prevEma21 && ema9 > ema21) {
          results.push({ strategy: 'CROSS_IGNITE', digit: 0, type: 'CALL' });
        } else if (prevEma9 >= prevEma21 && ema9 < ema21) {
          results.push({ strategy: 'CROSS_IGNITE', digit: 0, type: 'PUT' });
        }
      }

      // RSI_BURST: RSI Momentum Flip
      if (activeStrategiesRef.current.includes('RSI_BURST') && prices.length >= 14) {
        const rsi = calculateRSI(prices, 7);
        const prevRsi = calculateRSI(prices.slice(1), 7);
        if (prevRsi < 50 && rsi >= 50) {
          results.push({ strategy: 'RSI_BURST', digit: 0, type: 'CALL' });
        } else if (prevRsi > 50 && rsi <= 50) {
          results.push({ strategy: 'RSI_BURST', digit: 0, type: 'PUT' });
        }
      }

      // BAND_BREAK: Bollinger Band Expansion
      if (activeStrategiesRef.current.includes('BAND_BREAK') && prices.length >= 21) {
        const bands = calculateBollingerBands(prices, 20, 2);
        if (currentPrice > bands.upper) {
          results.push({ strategy: 'BAND_BREAK', digit: 0, type: 'CALL' });
        } else if (currentPrice < bands.lower) {
          results.push({ strategy: 'BAND_BREAK', digit: 0, type: 'PUT' });
        }
      }

      // SEQUENTIAL_TIME: Time-based Cyclic Trading
      if (activeStrategiesRef.current.includes('SEQUENTIAL_TIME')) {
        const now = Date.now();
        const intervals = [10000, 15000, 20000, 30000]; // 10s, 15s, 20s, 30s
        const currentInterval = intervals[sequentialIntervalIndexRef.current];
        
        if (now - lastTradeEndTimeRef.current >= currentInterval) {
          results.push({ strategy: 'SEQUENTIAL_TIME', digit: 0, type: 'CALL' });
        }
      }
    }

    // Bot No. 4 Strategies
    if (selectedBotIdRef.current === 'bot4') {
      const freqDigit = indicator1FrequencyScanner(digits);
      const gapDigit = indicator2GapAnalyzer(digits);
      const volDigit = indicator3VolatilityModel(digits);

      if (activeStrategiesRef.current.includes('FREQ_SCAN') && freqDigit !== null) {
        results.push({ strategy: 'FREQ_SCAN', digit: freqDigit, type: 'DIGITDIFF' });
      }
      if (activeStrategiesRef.current.includes('GAP_ANALYZE') && gapDigit !== null) {
        results.push({ strategy: 'GAP_ANALYZE', digit: gapDigit, type: 'DIGITDIFF' });
      }
      if (activeStrategiesRef.current.includes('VOL_MODEL') && volDigit !== null) {
        results.push({ strategy: 'VOL_MODEL', digit: volDigit, type: 'DIGITDIFF' });
      }
      if (activeStrategiesRef.current.includes('TRIPLE_THREAT') && freqDigit !== null && freqDigit === gapDigit && gapDigit === volDigit) {
        results.push({ strategy: 'TRIPLE_THREAT', digit: freqDigit, type: 'DIGITDIFF' });
      }
    }

    // Bot No. 2 Strategies (SSA-5 Based)
    if (selectedBotIdRef.current === 'bot2' && ssaAnalysisRef.current) {
      const scores = ssaAnalysisRef.current.scores;
      
      // EVN
      if (scores['EVN'] > 75) {
        results.push({ strategy: 'EVN', digit: 0, type: 'DIGITEVEN' });
      }
      // ODD
      if (scores['ODD'] > 75) {
        results.push({ strategy: 'ODD', digit: 0, type: 'DIGITODD' });
      }
      // O4
      if (scores['O4'] > 75) {
        results.push({ strategy: 'O4', digit: 4, type: 'DIGITOVER' });
      }
      // U5
      if (scores['U5'] > 75) {
        results.push({ strategy: 'U5', digit: 5, type: 'DIGITUNDER' });
      }
      // RIS
      if (scores['RIS'] > 75) {
        results.push({ strategy: 'RIS', digit: 0, type: 'CALL' });
      }
      // FAL
      if (scores['FAL'] > 75) {
        results.push({ strategy: 'FAL', digit: 0, type: 'PUT' });
      }
    }

    return results;
  };

  const subscribeAll = useCallback(() => {
    addLog("Requesting history and subscribing to ticks...");
    MARKET_LIST.forEach(market => {
      socketRef.current?.send(JSON.stringify({
        ticks_history: market.id,
        adjust_start_time: 1,
        count: TICK_BUFFER_SIZE,
        end: "latest",
        start: 1,
        style: "ticks",
        subscribe: 1
      }));
    });
  }, [addLog]);

  const handleTradeFinish = useCallback((contract: any) => {
    activeContractIdRef.current = null;
    const isWon = contract.status === 'won';
    const profit = Number(contract.profit) || 0;
    const payout = Number(contract.payout) || 0;

    setTotalProfit(prev => {
      const newTotalProfit = prev + profit;
      totalProfitRef.current = newTotalProfit;
      
      if (takeProfitRef.current > 0 && newTotalProfit >= takeProfitRef.current) {
        setIsRunning(false);
        setError(`Take Profit reached: ${formatValue(newTotalProfit)} ${getCurrencySymbol()}`);
      } else if (stopLossRef.current > 0 && newTotalProfit <= -stopLossRef.current) {
        setIsRunning(false);
        setError(`Stop Loss reached: ${formatValue(newTotalProfit)} ${getCurrencySymbol()}`);
      }
      
      return newTotalProfit;
    });

    if (isWon) {
      setCurrentStake(stakeRef.current);
      setTotalWins(prev => prev + 1);
      setTotalPayout(prev => {
        const newTotalPayout = prev + payout;
        totalPayoutRef.current = newTotalPayout;
        return newTotalPayout;
      });
    } else {
      setCurrentStake(prev => Number((prev * martingaleMultiplierRef.current).toFixed(2)));
      setTotalLosses(prev => prev + 1);
    }
    
    socketRef.current?.send(JSON.stringify({
      proposal_open_contract: 1,
      contract_id: contract.contract_id,
      subscribe: 0
    }));

    setTrades(prev => {
      const tradeIndex = prev.findIndex(t => t.contractId === contract.contract_id);
      if (tradeIndex !== -1) {
        const trade = prev[tradeIndex];
        
        if (!isWon && trade.strategy === 'LDP') {
          setLdpDigits(ldpPrev => ({ ...ldpPrev, [trade.symbol]: null }));
          setLastLdpLostDigit(prev => ({ ...prev, [trade.symbol]: trade.digit }));
        }

        if (!isWon && trade.strategy === 'DPMG25') {
          setDpmgDigits(dpmgPrev => ({ ...dpmgPrev, [trade.symbol]: null }));
        }

        const newTrades = [...prev];
        newTrades[tradeIndex] = {
          ...trade,
          status: isWon ? 'won' : 'lost',
          profit: profit,
          entryTick: contract.entry_tick,
          exitTick: contract.exit_tick
        };
        return newTrades;
      }
      return prev;
    });

    socketRef.current?.send(JSON.stringify({ authorize: token }));

    setTimeout(() => {
      isExecutingRef.current = false;
      setTradeRunning(false);
      lastTradeTimeRef.current = Date.now();
    }, 2000);
  }, [token]);

  const analyzeMarket = useCallback((symbol: string, ticks: number[], digits: number[]) => {
    if (ticks.length < 20) return;
    
    const last20Digits = digits.slice(-20);
    const last20Ticks = ticks.slice(-20);
    
    // 1. Digit Pressure
    const lowDigits = last20Digits.filter(d => d <= 4).length;
    const pressure = lowDigits / 20;
    
    // 2. Direction Bias (Micro-trend)
    let upCount = 0, downCount = 0;
    for (let i = 1; i < 5; i++) {
      if (last20Ticks[last20Ticks.length - i] > last20Ticks[last20Ticks.length - i - 1]) upCount++;
      else if (last20Ticks[last20Ticks.length - i] < last20Ticks[last20Ticks.length - i - 1]) downCount++;
    }
    const bias = upCount >= 3 ? 'BULLISH' : (downCount >= 3 ? 'BEARISH' : 'NEUTRAL');
    
    // 3. Parity Behavior
    const evens = last20Digits.filter(d => d % 2 === 0).length;
    let streakCount = 0;
    const firstParity = last20Digits[last20Digits.length - 1] % 2;
    for (let i = 1; i <= last20Digits.length; i++) {
      if (last20Digits[last20Digits.length - i] % 2 === firstParity) streakCount++;
      else break;
    }
    const parity = streakCount >= 4 ? 'STREAK' : (evens >= 12 || evens <= 8 ? 'BIASED' : 'BALANCED');
    
    // 4. Volatility Speed
    let flips = 0;
    for (let i = 1; i < 10; i++) {
      const dir1 = last20Ticks[last20Ticks.length - i] > last20Ticks[last20Ticks.length - i - 1];
      const dir2 = last20Ticks[last20Ticks.length - i - 1] > last20Ticks[last20Ticks.length - i - 2];
      if (dir1 !== dir2) flips++;
    }
    const volatility = flips >= 7 ? 'CHOPPY' : (flips <= 2 ? 'SMOOTH' : 'STABLE');

    // 5. Scoring
    const scores: Record<string, number> = {
      'EVN': Math.round((parity === 'BALANCED' ? 30 : (parity === 'BIASED' && evens > 10 ? 50 : 0)) + (volatility === 'STABLE' ? 30 : 10) + (streakCount < 3 ? 20 : 0)),
      'ODD': Math.round((parity === 'BALANCED' ? 30 : (parity === 'BIASED' && evens < 10 ? 50 : 0)) + (volatility === 'STABLE' ? 30 : 10) + (streakCount < 3 ? 20 : 0)),
      'O4': Math.round((pressure < 0.4 ? 70 : 20) + (volatility === 'SMOOTH' ? 30 : 10)),
      'U5': Math.round((pressure > 0.6 ? 70 : 20) + (volatility === 'SMOOTH' ? 30 : 10)),
      'RIS': Math.round((bias === 'BULLISH' ? 70 : 10) + (volatility === 'STABLE' ? 30 : 10)),
      'FAL': Math.round((bias === 'BEARISH' ? 70 : 10) + (volatility === 'STABLE' ? 30 : 10))
    };

    // Suggested Runtime
    let runtime = 25;
    if (volatility === 'SMOOTH') runtime = 45;
    if (volatility === 'CHOPPY') runtime = 15;
    if (bias !== 'NEUTRAL') runtime += 10;
    runtime += Math.floor(Math.random() * 10);

    const newAnalysis: SSAAnalysis = {
      pressure,
      bias,
      volatility,
      parity,
      streakCount,
      evens,
      scores,
      suggestedRuntime: runtime,
      runtimeRemaining: ssaAnalysisRef.current?.runtimeRemaining && ssaAnalysisRef.current.runtimeRemaining > 0 
        ? ssaAnalysisRef.current.runtimeRemaining - 1 
        : runtime
    };

    setSsaAnalysis(newAnalysis);
    ssaAnalysisRef.current = newAnalysis;
  }, []);

  const updateMemory = useCallback((symbol: string, quote: number) => {
    const decimals = DECIMAL_PLACES[symbol] || 2;
    const lastDigit = parseInt(quote.toFixed(decimals).slice(-1));
    
    setMemory(prev => {
      const symMemory = prev[symbol] || { 
        ticks: [], 
        stats: {}, 
        gaps: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i, 0])),
        lastDigits: [],
        transitions: {}
      };
      
      const newQuotes = [...(symMemory.ticks || []), quote].slice(-TICK_BUFFER_SIZE);
      const newDigits = [...(symMemory.lastDigits || []), lastDigit].slice(-TICK_BUFFER_SIZE);
      
      // Trigger SSA analysis if selected symbol
      if (symbol === selectedSymbolRef.current && selectedBotIdRef.current === 'bot2') {
        analyzeMarket(symbol, newQuotes, newDigits);
      }

      const newStats: Record<number, number> = {};
      const newGaps = { ...symMemory.gaps };

      for (let i = 0; i <= 9; i++) {
        const count = newDigits.filter(d => d === i).length;
        newStats[i] = Math.round((count / TICK_BUFFER_SIZE) * 100);
        
        if (i === lastDigit) {
          newGaps[i] = 0;
        } else {
          newGaps[i] = (newGaps[i] || 0) + 1;
        }
      }

      const currentVol = calculateVolatility(newQuotes);
      const prevVol = symMemory.volatility || currentVol;

      setTickUpdate(v => v + 1);

      const newTransitions = { ...(symMemory.transitions || {}) };
      if (newDigits.length >= 2) {
        const prevDigit = newDigits[newDigits.length - 2];
        if (prevDigit !== undefined && lastDigit !== undefined) {
          if (!newTransitions[prevDigit]) newTransitions[prevDigit] = {};
          newTransitions[prevDigit][lastDigit] = (newTransitions[prevDigit][lastDigit] || 0) + 1;
        }
      }

      return {
        ...prev,
        [symbol]: {
          ticks: newQuotes,
          lastDigits: newDigits,
          stats: newStats,
          gaps: newGaps,
          volatility: currentVol,
          prevVolatility: prevVol,
          transitions: newTransitions
        }
      };
    });
  }, [calculateVolatility]);

  const handleDerivMessage = useCallback((data: any) => {
    if (data.error) {
      setError(data.error.message);
      if (data.error.code === 'AuthorizationRequired') {
        setIsAuthorized(false);
      }
      return;
    }

    switch (data.msg_type) {
      case 'authorize':
        if (data.authorize) {
          setIsAuthorized(true);
          setBalance(data.authorize.balance);
          setCurrency(data.authorize.currency);
          if (data.authorize.loginid) {
            setActiveAccount(data.authorize.loginid);
            localStorage.setItem('deriv_account', data.authorize.loginid);
          }
          setError(null);
          setReconnectAttempts(0);
          setIsReconnecting(false);
          localStorage.setItem('deriv_token', token);
          subscribeAll();
          if (isRunningRef.current) {
            setIsRunning(true);
          }
        }
        break;
      case 'tick':
        if (data.tick) {
          updateMemory(data.tick.symbol, data.tick.quote);
        }
        break;
      case 'history':
        if (data.history && data.echo_req.ticks_history) {
          const symbol = data.echo_req.ticks_history;
          const prices = data.history.prices;
          addLog(`Received ${prices.length} historical ticks for ${symbol}`);
          prices.forEach((price: number) => updateMemory(symbol, price));
        }
        break;
      case 'buy':
        if (data.buy) {
          const contractId = data.buy.contract_id;
          activeContractIdRef.current = contractId;
          setTrades(prev => {
            const newTrades = [...prev];
            const pendingIndex = newTrades.findIndex(t => t.status === 'pending' && !t.contractId);
            if (pendingIndex !== -1) {
              newTrades[pendingIndex] = { ...newTrades[pendingIndex], contractId };
            }
            return newTrades;
          });
          socketRef.current?.send(JSON.stringify({
            proposal_open_contract: 1,
            contract_id: contractId,
            subscribe: 1
          }));
        }
        break;
      case 'proposal_open_contract':
        if (data.proposal_open_contract) {
          const contract = data.proposal_open_contract;
          if (contract.is_sold) {
            handleTradeFinish(contract);
          }
        }
        break;
    }
  }, [token, subscribeAll, addLog, updateMemory, handleTradeFinish]);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;
    
    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ forget_all: "ticks" }));
      if (token) {
        ws.send(JSON.stringify({ authorize: token }));
      }
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      handleDerivMessage(data);
    };

    ws.onclose = () => {
      setIsAuthorized(false);
      setIsReconnecting(true);
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        connect();
      }, delay);
    };

    ws.onerror = () => {
      setError('WebSocket connection error. Retrying...');
    };
  }, [token, reconnectAttempts, handleDerivMessage]);

  useEffect(() => {
    const handleOnline = () => {
      setError(null);
      connect();
    };
    const handleOffline = () => {
      setError('Network connection lost. Waiting for recovery...');
      setIsAuthorized(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect]);

  const executeTrade = useCallback((symbol: string, digit: number, type: Trade['type'] = 'DIGITDIFF', strategy = 'Manual') => {
    if (tradeRunning || isExecutingRef.current) return;
    isExecutingRef.current = true;
    setTradeRunning(true);

    const tradeStake = currentStakeRef.current;
    const duration = 1;

    const newTrade: Trade = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      digit,
      type,
      strategy,
      status: 'pending',
      timestamp: Date.now()
    };
    setTrades(prev => [newTrade, ...prev].slice(0, 100));
    setTotalTrades(prev => prev + 1);
    setTotalStake(prev => {
      const newTotalStake = prev + tradeStake;
      totalStakeRef.current = newTotalStake;
      return newTotalStake;
    });

    if (strategy === 'LDP') {
      setLdpDigits(prev => ({ ...prev, [symbol]: digit }));
    }

    if (strategy === 'DPMG25') {
      setDpmgDigits(prev => ({ ...prev, [symbol]: digit }));
    }

    const params: any = {
      amount: tradeStake,
      basis: "stake",
      contract_type: type,
      currency: currency,
      duration: duration,
      duration_unit: "t",
      symbol: symbol,
    };

    if (type === 'ACCU') {
      params.growth_rate = 0.01;
    }

    if (['DIGITDIFF', 'DIGITMATCH', 'DIGITOVER', 'DIGITUNDER'].includes(type)) {
      params.barrier = digit.toString();
    }

    if (strategy === 'SEQUENTIAL_TIME') {
      const intervals = [10000, 15000, 20000, 30000];
      sequentialIntervalIndexRef.current = (sequentialIntervalIndexRef.current + 1) % intervals.length;
      setSequentialIntervalIndex(sequentialIntervalIndexRef.current);
      lastTradeEndTimeRef.current = Date.now();
    }

    socketRef.current?.send(JSON.stringify({
      buy: 1,
      price: tradeStake,
      parameters: params
    }));
  }, [tradeRunning, currency]);

  useEffect(() => {
    if (!isRunning) return;

    if (!allSymbolsReady) {
      const readyCount = MARKET_LIST.filter(m => (memory[m.id]?.ticks.length || 0) >= TICK_BUFFER_SIZE).length;
      if (readyCount === MARKET_LIST.length) {
        setAllSymbolsReady(true);
      }
      return;
    }

    if (tradeRunning || isExecutingRef.current) return;

    const now = Date.now();
    const timeSinceLastTrade = now - lastTradeTimeRef.current;
    const cooldownMs = cooldownRef.current * 1000;
    
    if (timeSinceLastTrade < cooldownMs) {
      setRemainingCooldown(Math.ceil((cooldownMs - timeSinceLastTrade) / 1000));
      return;
    } else if (remainingCooldown !== 0) {
      setRemainingCooldown(0);
    }

    const isRecovery = currentStakeRef.current > stakeRef.current;

    let bestCandidate: any = null;

    if (isStrategyModeRef.current) {
      const candidates: any[] = [];
      
      const symbolsToProcess = isSingleSymbolModeRef.current 
        ? [selectedSymbolRef.current] 
        : Object.keys(memory);

      for (const symbol of symbolsToProcess) {
        const mem = memory[symbol];
        if (!mem || mem.ticks.length < TICK_BUFFER_SIZE) continue;
        
        const stratResults = checkStrategies(symbol, mem);
        stratResults.forEach(res => {
          if (activeStrategiesRef.current.includes(res.strategy)) {
            candidates.push({ ...res, symbol });
          }
        });
      }

      if (candidates.length > 0) {
        const grouped = candidates.reduce((acc: any, curr: any) => {
          if (!acc[curr.strategy]) acc[curr.strategy] = [];
          acc[curr.strategy].push(curr);
          return acc;
        }, {});

        const availableStrategies = Object.keys(grouped);
        let chosenStrategy: string | null = null;

        if (isMultiStrategyRef.current && activeStrategiesRef.current.length > 1) {
          const targetStrategy = activeStrategiesRef.current[strategyRotationIndexRef.current % activeStrategiesRef.current.length];
          
          if (grouped[targetStrategy]) {
            chosenStrategy = targetStrategy;
          } else {
            return;
          }
        }
        
        if (!chosenStrategy) {
          chosenStrategy = availableStrategies[Math.floor(Math.random() * availableStrategies.length)];
        }

        const strategyCandidates = grouped[chosenStrategy];
        const chosen = strategyCandidates[Math.floor(Math.random() * strategyCandidates.length)];
        
        bestCandidate = { ...chosen, gap: 0 };
        
        const currentIdx = activeStrategiesRef.current.indexOf(chosenStrategy);
        if (currentIdx !== -1) {
          strategyRotationIndexRef.current = (currentIdx + 1) % activeStrategiesRef.current.length;
        }
        lastStrategyRef.current = chosenStrategy;
      }
    } else {
      const targetFrequency = 0;
      const marketsToProcess = isSingleSymbolModeRef.current
        ? MARKET_LIST.filter(m => m.id === selectedSymbolRef.current)
        : [...MARKET_LIST].sort(() => Math.random() - 0.5);

      for (const market of marketsToProcess) {
        const mem = memory[market.id];
        if (!mem || !mem.stats) continue;

        for (let digit = 0; digit <= 9; digit++) {
          if (mem.stats[digit] === targetFrequency) {
            const gap = mem.gaps?.[digit] || 0;
            
            if (isRecovery) {
              if (!bestCandidate || gap > (bestCandidate.gap || 0)) {
                bestCandidate = { symbol: market.id, digit, gap, type: 'DIGITDIFF' };
              }
            } else {
              if (!bestCandidate || gap < (bestCandidate.gap || 0)) {
                bestCandidate = { symbol: market.id, digit, gap, type: 'DIGITDIFF' };
              }
            }
          }
        }
      }
    }

    if (bestCandidate) {
      executeTrade(bestCandidate.symbol, bestCandidate.digit, bestCandidate.type, bestCandidate.strategy || 'Digit Memory');
    }
  }, [isRunning, allSymbolsReady, tradeRunning, memory, activeStrategies, isMultiStrategy, isStrategyMode, isSingleSymbolMode, selectedSymbol, ldpDigits, executeTrade]);

  useEffect(() => {
    if (!tradeRunning || trades.length === 0) return;
    const latestTrade = trades[0];
    if (latestTrade.status !== 'pending') return;

    const timeout = setInterval(() => {
      const elapsed = Date.now() - latestTrade.timestamp;
      if (elapsed > 20000) {
        isExecutingRef.current = false;
        setTradeRunning(false);
        setTrades(prev => prev.map(t => 
          t.id === latestTrade.id ? { ...t, status: 'error' } : t
        ));
        setError('Trade timed out. Engine reset.');
        clearInterval(timeout);
      }
    }, 1000);

    return () => clearInterval(timeout);
  }, [tradeRunning, trades]);

  const executeManualTrade = () => {
    if (!isAuthorized || tradeRunning) return;
    const randomMarket = MARKET_LIST[Math.floor(Math.random() * MARKET_LIST.length)];
    const randomDigit = Math.floor(Math.random() * 10);
    executeTrade(randomMarket.id, randomDigit);
  };

  const toggleBot = () => {
    if (!isRunning) {
      setAllSymbolsReady(false);
      if (!isAuthorized) {
        connect();
      } else {
        setIsRunning(true);
      }
    } else {
      setIsRunning(false);
      setAllSymbolsReady(false);
    }
  };

  const formatValue = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '0.00';
    const num = Number(val);
    if (displayCurrency === 'KSH') {
      return (num * KSH_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return num.toFixed(2);
  };

  const getCurrencySymbol = () => displayCurrency;

  useEffect(() => {
    if (!isStrategyMode || !isRunning) {
      setDisplaySymbolIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setDisplaySymbolIndex(prev => (prev + 1) % MARKET_LIST.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isStrategyMode, isRunning]);

  const handleLogout = () => {
    setToken('');
    setActiveAccount('');
    setAccounts([]);
    setIsAuthorized(false);
    setBalance(null);
    localStorage.removeItem('deriv_token');
    localStorage.removeItem('deriv_account');
    localStorage.removeItem('deriv_accounts');
    if (socketRef.current) socketRef.current.close();
    addLog('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-[#343541] text-[#E4E3E0] font-sans selection:bg-[#E4E3E0] selection:text-[#343541] pb-16 md:pb-0">
      <Navbar 
        isAuthorized={isAuthorized}
        activeAccount={activeAccount}
        accounts={accounts}
        onSwitchAccount={handleSwitchAccount}
        balance={balance}
        currency={currency}
        onLogout={handleLogout}
        onViewChange={setCurrentView}
        currentView={currentView}
        formatValue={formatValue}
      />

      <AnimatePresence mode="wait">
        {currentView === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Home 
              onStartTrading={() => setCurrentView('bot')}
              isAuthorized={isAuthorized}
            />
          </motion.div>
        ) : (
          <motion.div
            key="bot"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full px-4 md:px-8 py-6"
          >
            <BotSelection 
              selectedBotId={selectedBotId}
              onSelectBot={handleSelectBot}
              activeStrategies={activeStrategies}
              onToggleStrategy={(stratId) => {
                if (isMultiStrategy) {
                  setActiveStrategies(prev => {
                    const next = prev.includes(stratId) ? prev.filter(id => id !== stratId) : [...prev, stratId];
                    return next.sort((a, b) => STRATEGIES.findIndex(s => s.id === a) - STRATEGIES.findIndex(s => s.id === b));
                  });
                } else {
                  setActiveStrategies([stratId]);
                }
              }}
              isMultiStrategy={isMultiStrategy}
              onToggleMultiStrategy={() => setIsMultiStrategy(!isMultiStrategy)}
              onSelectAll={(stratIds) => {
                setIsMultiStrategy(true);
                setActiveStrategies(stratIds.sort((a, b) => 
                  STRATEGIES.findIndex(s => s.id === a) - STRATEGIES.findIndex(s => s.id === b)
                ));
              }}
            />

            {activeStrategies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <header className="p-4 md:px-8 flex flex-col md:flex-row justify-between items-center bg-[#202123]/50 border border-white/5 rounded-2xl mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setActiveStrategies([])}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/10 group"
                      title="Back to Catalog"
                    >
                      <Icon name="ArrowLeft" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold opacity-50">Active Engine</span>
                      <span className="text-xs font-mono text-emerald-400">
                        {isMultiStrategy ? `${activeStrategies.length} Bots Active` : STRATEGIES.find(s => s.id === activeStrategies[0])?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-6 w-full md:w-auto">
                    {isReconnecting && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[8px] md:text-[10px] font-bold uppercase animate-pulse">
                    <Icon name="RefreshCw" className="w-3 h-3 animate-spin" />
                    Reconnecting...
                  </div>
                )}
                {isRunning && !allSymbolsReady && (
                  <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-yellow-100/10 border border-yellow-400/50 text-yellow-400 text-[9px] md:text-[10px] font-bold uppercase animate-pulse">
                    <Icon name="Activity" className="w-3 h-3" />
                    <span className="hidden sm:inline">Syncing Markets:</span> {MARKET_LIST.filter(m => (memory[m.id]?.ticks.length || 0) >= TICK_BUFFER_SIZE).length}/{MARKET_LIST.length}
                  </div>
                )}

                {isAuthorized && (
                  <div className="flex flex-col items-center md:items-end group">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] md:text-[10px] uppercase font-mono opacity-50">Total P/L</span>
                      <button 
                        onClick={onClearStats}
                        className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                        title="Reset Profit"
                      >
                        <Icon name="Trash2" className="w-3 h-3 opacity-50 hover:opacity-100" />
                      </button>
                    </div>
                    <div className={`flex items-center gap-2 text-lg md:text-xl font-bold font-mono ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalProfit >= 0 ? '+' : ''}{formatValue(totalProfit)} <span className="text-xs opacity-50">{getCurrencySymbol()}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center border-2 border-white/10 overflow-hidden rounded">
                  <button 
                    onClick={() => setDisplayCurrency('USD')}
                    className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold transition-colors ${displayCurrency === 'USD' ? 'bg-[#E4E3E0] text-[#343541]' : 'bg-transparent text-[#E4E3E0]'}`}
                  >
                    USD
                  </button>
                  <button 
                    onClick={() => setDisplayCurrency('KSH')}
                    className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-bold transition-colors ${displayCurrency === 'KSH' ? 'bg-[#E4E3E0] text-[#343541]' : 'bg-transparent text-[#E4E3E0]'}`}
                  >
                    KSH
                  </button>
                </div>
                
                <button 
                  onClick={toggleBot}
                  disabled={!token}
                  className={`
                    px-4 md:px-8 py-2 md:py-3 rounded border-2 border-white/10 font-bold uppercase tracking-widest transition-all flex items-center gap-2 text-xs md:text-sm
                    ${isRunning 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-[#E4E3E0] text-[#343541] hover:bg-opacity-90 disabled:opacity-30'}
                  `}
                >
                  {isRunning ? <Icon name="Square" className="w-4 h-4" /> : <Icon name="Play" className="w-4 h-4" />}
                  <span>{isRunning ? 'Stop Bot' : 'Start Bot'}</span>
                </button>

                <button
                  onClick={() => setIsRunPanelOpen(!isRunPanelOpen)}
                  className="p-2 bg-white/10 rounded border border-white/10"
                  title="Toggle Run Panel"
                >
                  <Icon name="Layout" className="w-5 h-5" />
                </button>
              </div>
            </header>

            <RunPanel 
              isDrawerOpen={isRunPanelOpen}
              toggleDrawer={setIsRunPanelOpen}
              trades={trades}
              logs={systemLogs}
              totalProfit={totalProfit}
              totalWins={totalWins}
              totalLosses={totalLosses}
              totalStake={totalStake}
              totalPayout={totalPayout}
              numberOfRuns={totalTrades}
              currency={currency}
              onClearStats={onClearStats}
              isBotRunning={isRunning}
              onRunButtonClick={toggleBot}
              onStopButtonClick={toggleBot}
            />

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-4 space-y-6">
          <section className="border border-white/10 p-6 bg-[#444654] backdrop-blur-sm">
            <h2 className="text-xs font-mono uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2">
              <Icon name="Settings" className="w-3 h-3" />
              Configuration
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1 text-green-400">Take Profit</label>
                  <input 
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1 text-red-400">Stop Loss</label>
                  <input 
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1">Initial Stake</label>
                  <input 
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1">Martingale Multiplier</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={martingaleMultiplier}
                    onChange={(e) => setMartingaleMultiplier(Number(e.target.value))}
                    className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1">Cooldown (Seconds)</label>
                  <input 
                    type="number"
                    value={cooldown}
                    onChange={(e) => setCooldown(Number(e.target.value))}
                    className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-black/20 border border-white/5 rounded">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold opacity-70">Single Symbol Mode</span>
                  <span className="text-[8px] opacity-50">Trade only one market</span>
                </div>
                <button 
                  onClick={() => setIsSingleSymbolMode(!isSingleSymbolMode)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${isSingleSymbolMode ? 'bg-green-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isSingleSymbolMode ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>

              {isSingleSymbolMode && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] uppercase font-bold mb-1">Target Market</label>
                  <select 
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 py-2 focus:outline-none font-mono text-xs uppercase"
                  >
                    {MARKET_LIST.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#444654]">{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1">Current Stake</label>
                  <div className="py-2 font-mono text-sm border-b border-white/20 font-bold text-indigo-400">
                    {formatValue(currentStake)} {getCurrencySymbol()}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1">Active Strategy</label>
                  <div className="py-2 font-mono text-sm border-b border-white/20 text-indigo-400 font-bold truncate">
                    {isStrategyMode 
                      ? (activeStrategies.length > 0 
                        ? (isMultiStrategy 
                          ? `Waiting for: ${activeStrategies[strategyRotationIndexRef.current % activeStrategies.length]}`
                          : activeStrategies.join(', '))
                        : 'None Selected')
                      : 'Digit Memory (0%)'}
                  </div>
                </div>
              </div>

              {!isAuthorized && (
                <button 
                  onClick={connect}
                  className="w-full py-2 border border-white/10 text-[10px] uppercase font-bold hover:bg-white/10 transition-colors"
                >
                  Authorize Connection
                </button>
              )}

              {isAuthorized && (
                <button 
                  onClick={executeManualTrade}
                  disabled={tradeRunning}
                  className="w-full py-2 border border-white/10 text-[10px] uppercase font-bold hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Icon name="Activity" className="w-3 h-3" />
                  Manual Test Trade
                </button>
              )}
            </div>
          </section>

          <section className="border border-white/10 p-6 bg-[#444654] backdrop-blur-sm h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-mono uppercase tracking-widest opacity-50 flex items-center gap-2">
                <Icon name="History" className="w-3 h-3" />
                Recent Activity
              </h2>
              <button 
                onClick={onClearStats}
                className="p-1.5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                title="Clear History & Profit"
              >
                <Icon name="Trash2" className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4 p-2 bg-black/20 border border-white/5 rounded">
              <div className="text-center">
                <div className="text-[8px] uppercase opacity-50">Total</div>
                <div className="text-xs font-bold font-mono">{totalTrades}</div>
              </div>
              <div className="text-center">
                <div className="text-[8px] uppercase opacity-50 text-green-400">Wins</div>
                <div className="text-xs font-bold font-mono text-green-400">{totalWins}</div>
              </div>
              <div className="text-center">
                <div className="text-[8px] uppercase opacity-50 text-red-400">Losses</div>
                <div className="text-xs font-bold font-mono text-red-400">{totalLosses}</div>
              </div>
              <div className="text-center">
                <div className="text-[8px] uppercase opacity-50 text-blue-400">Win %</div>
                <div className="text-xs font-bold font-mono text-blue-400">
                  {(totalWins + totalLosses) > 0 
                    ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(0) 
                    : 0}%
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-[200px]">
              {trades.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic font-serif">
                  No trades executed yet
                </div>
              ) : (
                trades.map(trade => (
                  <div 
                    key={trade.id}
                    className="border-b border-white/5 py-3 flex justify-between items-center"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono opacity-50">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                        <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-tighter px-1 bg-indigo-400/10 rounded border border-indigo-400/20">{trade.strategy || 'Manual'}</span>
                      </div>
                      <span className="text-xs font-bold">{trade.symbol}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold opacity-50">Contract</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono">{trade.type === 'DIGITDIFF' ? '≠' : '='} {trade.digit}</span>
                        <span className="text-[8px] opacity-30 uppercase">{trade.type === 'DIGITDIFF' ? 'Differs' : 'Matches'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trade.status === 'pending' && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
                      {trade.status === 'won' && <Icon name="CheckCircle" className="w-4 h-4 text-green-400" />}
                      {trade.status === 'lost' && <Icon name="XCircle" className="w-4 h-4 text-red-400" />}
                      <span className={`text-xs font-bold font-mono ${trade.profit && trade.profit > 0 ? 'text-green-400' : trade.profit && trade.profit < 0 ? 'text-red-400' : ''}`}>
                        {trade.profit ? (trade.profit > 0 ? `+${formatValue(trade.profit)}` : formatValue(trade.profit)) : '...'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="border border-white/10 p-6 bg-[#444654] backdrop-blur-sm h-[250px] flex flex-col mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-mono uppercase tracking-widest opacity-50 flex items-center gap-2">
                <Icon name="Terminal" className="w-3 h-3" />
                System Logs
              </h2>
              <button 
                onClick={() => setSystemLogs([])}
                className="p-1.5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                title="Clear Logs"
              >
                <Icon name="Trash2" className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar text-[10px] font-mono">
              {systemLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-20 italic">
                  No system events logged
                </div>
              ) : (
                systemLogs.map(log => (
                  <div key={log.id} className="flex gap-2 border-b border-white/5 py-1">
                    <span className="opacity-30">[{log.timestamp}]</span>
                    <span className="text-indigo-300">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          {selectedBotId === 'bot2' && ssaAnalysis && (
            <div className="mb-6">
              <SSAPanel 
                analysis={ssaAnalysis} 
                activeStrategy={activeStrategies.length > 0 ? activeStrategies[strategyRotationIndexRef.current % activeStrategies.length] : undefined}
                ticksCount={memory[selectedSymbol]?.ticks.length || 0}
              />
            </div>
          )}
          <section className="border border-white/10 bg-[#444654] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#202123] text-[#E4E3E0]">
              <h2 className="text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                <Icon name="TrendingUp" className="w-3 h-3" />
                Live Digit Frequency (Last 25 Ticks)
              </h2>
              <div className="flex items-center gap-4 text-[10px] font-mono">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500" /> 0% Trigger (Earliest)
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-[10px] uppercase font-serif italic opacity-50 border-r border-white/10">Symbol</th>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <th key={i} className="p-4 text-[10px] uppercase font-mono text-center border-r border-white/5">{i}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MARKET_LIST.filter((_, idx) => !isStrategyMode || idx === displaySymbolIndex).map(market => (
                    <tr key={market.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 border-r border-white/10 bg-[#444654] sticky left-0 z-10">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold truncate max-w-[120px]">{market.name}</span>
                          <span className="text-[8px] font-mono opacity-50">{market.id}</span>
                        </div>
                      </td>
                      {Array.from({ length: 10 }).map((_, i) => {
                        const stat = memory[market.id]?.stats[i] ?? 0;
                        const gap = memory[market.id]?.gaps?.[i] ?? 0;
                        const targetFrequency = 0;
                        const isTrigger = stat === targetFrequency && (memory[market.id]?.ticks.length || 0) >= TICK_BUFFER_SIZE;
                        
                        return (
                          <td 
                            key={i} 
                            className={`p-2 text-center font-mono text-xs border-r border-white/5 transition-all duration-500 ${isTrigger ? 'bg-red-500 text-white font-bold animate-pulse' : ''}`}
                          >
                            <div className="flex flex-col items-center">
                              <span>{stat}%</span>
                              <span className={`text-[8px] mt-0.5 ${isTrigger ? 'text-white/70' : 'opacity-30'}`}>G:{gap}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          {error && (
            <div className="mt-6 p-4 border border-red-500 bg-red-500/10 text-red-400 flex items-center gap-3">
              <Icon name="AlertCircle" className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-xs uppercase font-bold hover:underline">Dismiss</button>
            </div>
          )}
        </div>
      </main>
    </motion.div>
  )}
</motion.div>
    )}
  </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#202123] text-[#E4E3E0] px-4 md:px-6 py-2 flex flex-col md:flex-row justify-between items-center text-[9px] md:text-[10px] font-mono z-50 border-t border-white/10 gap-2">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${socketRef.current?.readyState === 1 ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="hidden sm:inline text-white/50">WS:</span> {socketRef.current?.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
          <div className="opacity-50 hidden sm:block">|</div>
          <div><span className="text-white/50">ENGINE:</span> {isRunning ? 'RUNNING' : 'IDLE'}</div>
          {isRunning && remainingCooldown > 0 && (
            <React.Fragment>
              <div className="opacity-50 hidden sm:block">|</div>
              <div className="text-yellow-400 animate-pulse">COOLDOWN: {remainingCooldown}s</div>
            </React.Fragment>
          )}
          <div className="opacity-50 hidden sm:block">|</div>
          <div><span className="text-white/50">TRADES:</span> {totalTrades}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="opacity-50 hidden md:block">APP_ID: {APP_ID}</div>
          <div className="opacity-50">© 2026 OTIVO HUB AI</div>
        </div>
      </footer>
    </div>
  );
}
