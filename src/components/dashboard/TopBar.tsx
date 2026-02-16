import { Home, Calendar, Plus, Lock, Unlock, LogOut, Timer } from 'lucide-react';
import { Board } from '@/types/board';

interface TopBarProps {
  boards: Board[];
  currentBoardId: string;
  onSwitchBoard: (id: string) => void;
  onAddBoard: () => void;
  zoomLocked: boolean;
  onToggleZoomLock: () => void;
  zoom: number;
  onTogglePomodoro: () => void;
  showPomodoro: boolean;
  onLogout: () => void;
  onHome: () => void;
  onCalendar: () => void;
  isRTL?: boolean;
  t?: (key: string) => string;
}

const TopBar = ({
  boards, currentBoardId, onSwitchBoard, onAddBoard,
  zoomLocked, onToggleZoomLock, zoom, onTogglePomodoro, showPomodoro,
  onLogout, onHome, onCalendar, isRTL, t,
}: TopBarProps) => {
  return (
    <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-1 shrink-0 z-50">
      {/* Left nav */}
      <div className="flex items-center gap-1 mr-4">
        <button onClick={onHome} className="p-2 rounded-lg hover:bg-secondary transition-colors active:scale-95" title={t?.('home') || 'Home'}>
          <Home className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={onCalendar} className="p-2 rounded-lg hover:bg-secondary transition-colors active:scale-95" title={t?.('calendar') || 'Calendar'}>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="w-px h-6 bg-border mr-2" />

      {/* Board tabs */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
        {boards.map(board => (
          <button
            key={board.id}
            onClick={() => onSwitchBoard(board.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap active:scale-95 ${
              board.id === currentBoardId
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            {board.name}
          </button>
        ))}
        <button
          onClick={onAddBoard}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground active:scale-95"
          title={t?.('addBoard') || 'Add Board'}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 ml-4">
        <span className="text-xs text-muted-foreground mr-2 tabular-nums max-md:hidden">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onTogglePomodoro}
          className={`p-2 rounded-lg transition-colors active:scale-95 ${showPomodoro ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'}`}
          title={t?.('pomodoroTimer') || 'Pomodoro Timer'}
        >
          <Timer className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleZoomLock}
          className={`p-2 rounded-lg transition-colors active:scale-95 ${zoomLocked ? 'bg-destructive text-destructive-foreground' : 'hover:bg-secondary text-muted-foreground'}`}
          title={zoomLocked ? (t?.('unlockBoard') || 'Unlock Board') : (t?.('lockBoard') || 'Lock Board')}
        >
          {zoomLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
        <button onClick={onLogout} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground active:scale-95" title={t?.('logout') || 'Logout'}>
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
