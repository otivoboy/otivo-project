import React from 'react';
import classNames from 'classnames';
import { X, Info, RotateCcw, Play, Square } from 'lucide-react';

type TStatisticsTile = {
  content: React.ReactNode;
  contentClassName?: string;
  title: string;
};

type TStatisticsSummary = {
  currency: string;
  is_mobile: boolean;
  lost_contracts: number;
  number_of_runs: number;
  total_stake: number;
  total_payout: number;
  toggleStatisticsInfoModal: () => void;
  total_profit: number;
  won_contracts: number;
};

type TDrawerHeader = {
  is_clear_stat_disabled: boolean;
  is_mobile: boolean;
  is_drawer_open: boolean;
  onClearStatClick: () => void;
  toggleDrawer: (open: boolean) => void;
};

type TDrawerContent = {
  active_index: number;
  is_drawer_open: boolean;
  setActiveTabIndex: (index: number) => void;
  trades: any[];
  logs: any[];
  total_profit: number;
  total_stake: number;
  total_payout: number;
  won_contracts: number;
  lost_contracts: number;
  number_of_runs: number;
  currency: string;
  toggleStatisticsInfoModal: () => void;
  is_mobile: boolean;
};

type TDrawerFooter = {
  is_clear_stat_disabled: boolean;
  onClearStatClick: () => void;
};

const Money = ({ amount, currency, has_sign, show_currency }: { amount: number; currency: string; has_sign?: boolean; show_currency?: boolean }) => {
  const sign = has_sign && amount > 0 ? '+' : '';
  return (
    <span>
      {sign}{amount.toFixed(2)} {show_currency ? currency : ''}
    </span>
  );
};

const StatisticsTile = ({ content, contentClassName, title }: TStatisticsTile) => (
  <div className='run-panel__tile'>
    <div className='run-panel__tile-title'>{title}</div>
    <div className={classNames('run-panel__tile-content', contentClassName)}>{content}</div>
  </div>
);

export const StatisticsSummary = ({
  currency,
  is_mobile,
  lost_contracts,
  number_of_runs,
  total_stake,
  total_payout,
  toggleStatisticsInfoModal,
  total_profit,
  won_contracts,
}: TStatisticsSummary) => (
  <div
    className={classNames('run-panel__stat', {
      'run-panel__stat--mobile': is_mobile,
    })}
  >
    <div className='run-panel__stat--info' onClick={toggleStatisticsInfoModal}>
      <div className='run-panel__stat--info-item'>
        What's this?
      </div>
    </div>
    <div className='run-panel__stat--tiles'>
      <StatisticsTile
        title='Total stake'
        content={<Money amount={total_stake} currency={currency} show_currency />}
      />
      <StatisticsTile
        title='Total payout'
        content={<Money amount={total_payout} currency={currency} show_currency />}
      />
      <StatisticsTile title='No. of runs' content={number_of_runs} />
      <StatisticsTile title='Contracts lost' content={lost_contracts} />
      <StatisticsTile title='Contracts won' content={won_contracts} />
      <StatisticsTile
        title='Total profit/loss'
        content={<Money amount={total_profit} currency={currency} has_sign show_currency />}
        contentClassName={classNames('run-panel__stat-amount', {
          'run-panel__stat-amount--positive': total_profit > 0,
          'run-panel__stat-amount--negative': total_profit < 0,
        })}
      />
    </div>
  </div>
);

const DrawerHeader = ({ is_clear_stat_disabled, is_mobile, is_drawer_open, onClearStatClick, toggleDrawer }: TDrawerHeader) => (
  <div className="flex items-center justify-between p-4 border-b border-[#444654]">
    <div className="flex items-center gap-2">
      <button 
        onClick={() => toggleDrawer(false)}
        className="p-1 hover:bg-white/10 rounded-full transition-colors"
      >
        <X size={20} />
      </button>
      <span className="font-bold">Run Panel</span>
    </div>
    {is_mobile && is_drawer_open && (
      <button
        disabled={is_clear_stat_disabled}
        onClick={onClearStatClick}
        className={classNames(
          "px-4 py-1 rounded text-sm font-medium transition-colors",
          is_clear_stat_disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 border border-[#444654]"
        )}
      >
        Reset
      </button>
    )}
  </div>
);

const DrawerContent = ({ 
  active_index, 
  is_drawer_open, 
  setActiveTabIndex,
  trades,
  logs,
  is_mobile,
  ...props 
}: TDrawerContent) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-[#444654]">
        {['Summary', 'Transactions', 'Journal'].map((label, index) => (
          <button
            key={label}
            onClick={() => setActiveTabIndex(index)}
            className={classNames(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
              active_index === index ? "border-emerald-500 text-emerald-500" : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {active_index === 0 && (
            <div className="space-y-4">
              <div className="bg-[#2a2b32] p-4 rounded-lg border border-[#444654]">
                <h3 className="text-sm font-bold mb-2">Bot Status</h3>
                <p className="text-xs text-gray-400">Bot is currently {props.number_of_runs > 0 ? 'active' : 'idle'}.</p>
              </div>
              {/* Add more summary content here if needed */}
            </div>
          )}
          
          {active_index === 1 && (
            <div className="space-y-2">
              {trades.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No transactions yet.</p>
              ) : (
                trades.map((trade, i) => (
                  <div key={i} className="bg-[#2a2b32] p-3 rounded border border-[#444654] flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold">{trade.type}</div>
                      <div className="text-[10px] text-gray-500">{new Date(trade.time).toLocaleTimeString()}</div>
                    </div>
                    <div className={classNames("text-sm font-bold", trade.profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {active_index === 2 && (
            <div className="space-y-1 font-mono text-[10px]">
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No logs yet.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={classNames(
                    "p-1 rounded",
                    log.type === 'error' ? "text-red-400 bg-red-400/10" : 
                    log.type === 'success' ? "text-emerald-400 bg-emerald-400/10" : "text-gray-300"
                  )}>
                    <span className="text-gray-500 mr-2">[{new Date(log.time).toLocaleTimeString()}]</span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {((is_drawer_open && active_index !== 2)) && <StatisticsSummary is_mobile={is_mobile} {...props} />}
      </div>
    </div>
  );
};

const DrawerFooter = ({ is_clear_stat_disabled, onClearStatClick }: TDrawerFooter) => (
  <div className='run-panel__footer'>
    <button
      disabled={is_clear_stat_disabled}
      onClick={onClearStatClick}
      className={classNames(
        "run-panel__footer-button flex items-center justify-center gap-2 rounded font-bold transition-all",
        is_clear_stat_disabled 
          ? "bg-gray-700 text-gray-500 cursor-not-allowed" 
          : "bg-white/10 hover:bg-white/20 text-white border border-[#444654]"
      )}
    >
      <RotateCcw size={16} />
      <span>Reset</span>
    </button>
  </div>
);

const StatisticsInfoModal = ({
  is_open,
  onClose,
}: { is_open: boolean; onClose: () => void }) => {
  if (!is_open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#343541] border border-[#444654] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#444654]">
          <h3 className="font-bold flex items-center gap-2">
            <Info size={18} className="text-emerald-500" />
            What's this?
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4 text-sm">
          <div>
            <p className="font-bold text-emerald-500">Total stake</p>
            <p className="text-gray-400">Total stake since you last cleared your stats.</p>
          </div>
          <div>
            <p className="font-bold text-emerald-500">Total payout</p>
            <p className="text-gray-400">Total payout since you last cleared your stats.</p>
          </div>
          <div>
            <p className="font-bold text-emerald-500">No. of runs</p>
            <p className="text-gray-400">The number of times your bot has run since you last cleared your stats.</p>
          </div>
          <div>
            <p className="font-bold text-emerald-500">Contracts lost</p>
            <p className="text-gray-400">The number of contracts you have lost since you last cleared your stats.</p>
          </div>
          <div>
            <p className="font-bold text-emerald-500">Contracts won</p>
            <p className="text-gray-400">The number of contracts you have won since you last cleared your stats.</p>
          </div>
          <div>
            <p className="font-bold text-emerald-500">Total profit/loss</p>
            <p className="text-gray-400">Your total profit/loss since you last cleared your stats. It is the difference between your total payout and your total stake.</p>
          </div>
        </div>
        <div className="p-4 border-t border-[#444654] flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

type RunPanelProps = {
  isDrawerOpen: boolean;
  toggleDrawer: (open: boolean) => void;
  trades: any[];
  logs: any[];
  totalProfit: number;
  totalWins: number;
  totalLosses: number;
  totalStake: number;
  totalPayout: number;
  numberOfRuns: number;
  currency: string;
  onClearStats: () => void;
  isBotRunning: boolean;
  onRunButtonClick: () => void;
  onStopButtonClick: () => void;
};

const RunPanel: React.FC<RunPanelProps> = ({
  isDrawerOpen,
  toggleDrawer,
  trades,
  logs,
  totalProfit,
  totalWins,
  totalLosses,
  totalStake,
  totalPayout,
  numberOfRuns,
  currency,
  onClearStats,
  isBotRunning,
  onRunButtonClick,
  onStopButtonClick,
}) => {
  const [activeIndex, setActiveTabIndex] = React.useState(0);
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isDrawerOpen && !isMobile) return null;

  return (
    <>
      <div 
        className={classNames(
          isMobile && isDrawerOpen ? 'run-panel__container--mobile' : 'run-panel__container',
          {
            'translate-x-full': !isDrawerOpen && !isMobile,
            'translate-x-0': isDrawerOpen || isMobile,
            'hidden': !isDrawerOpen && isMobile
          }
        )}
      >
        <div className="run-panel__content">
          <DrawerHeader 
            is_clear_stat_disabled={numberOfRuns === 0}
            is_mobile={isMobile}
            is_drawer_open={isDrawerOpen}
            onClearStatClick={onClearStats}
            toggleDrawer={toggleDrawer}
          />
          
          <DrawerContent 
            active_index={activeIndex}
            is_drawer_open={isDrawerOpen}
            setActiveTabIndex={setActiveTabIndex}
            trades={trades}
            logs={logs}
            total_profit={totalProfit}
            total_stake={totalStake}
            total_payout={totalPayout}
            won_contracts={totalWins}
            lost_contracts={totalLosses}
            number_of_runs={numberOfRuns}
            currency={currency}
            toggleStatisticsInfoModal={() => setIsInfoModalOpen(true)}
            is_mobile={isMobile}
          />

          {!isMobile && (
            <DrawerFooter 
              is_clear_stat_disabled={numberOfRuns === 0}
              onClearStatClick={onClearStats}
            />
          )}

          {isMobile && (
            <div className="controls__section">
              <div className="controls__buttons">
                {!isBotRunning ? (
                  <button 
                    onClick={onRunButtonClick}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play size={20} fill="currentColor" />
                    Run Bot
                  </button>
                ) : (
                  <button 
                    onClick={onStopButtonClick}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Square size={20} fill="currentColor" />
                    Stop Bot
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <StatisticsInfoModal 
        is_open={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </>
  );
};

export default RunPanel;
