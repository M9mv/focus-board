import { useState, useEffect, useRef, useCallback } from 'react';
import { useBoard } from '@/hooks/useBoard';
import TopBar from '@/components/dashboard/TopBar';
import Sidebar from '@/components/dashboard/Sidebar';
import Canvas from '@/components/dashboard/Canvas';
import MiniMap from '@/components/dashboard/MiniMap';
import PomodoroTimer from '@/components/dashboard/PomodoroTimer';
import WaterReminder from '@/components/dashboard/WaterReminder';
import WaterWidget from '@/components/dashboard/WaterWidget';
import BatteryIcon from '@/components/dashboard/BatteryIcon';
import NewBoardDialog from '@/components/dashboard/NewBoardDialog';
import Login from '@/pages/Login';

const Index = () => {
  const board = useBoard();
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Auth state
  const [user, setUser] = useState<string | null>(() => {
    return localStorage.getItem('study-dashboard-user');
  });

  // MiniMap: show temporarily on pan/zoom
  const [miniMapVisible, setMiniMapVisible] = useState(false);
  const miniMapTimer = useRef<number | null>(null);

  const showMiniMapTemporarily = useCallback(() => {
    setMiniMapVisible(true);
    if (miniMapTimer.current) clearTimeout(miniMapTimer.current);
    miniMapTimer.current = window.setTimeout(() => setMiniMapVisible(false), 1500);
  }, []);

  // Water reminder state
  const [showWaterReminder, setShowWaterReminder] = useState(() => {
    const dismissed = localStorage.getItem('water-dismissed');
    if (dismissed === 'true') return false;
    const remindAt = localStorage.getItem('water-remind-at');
    if (remindAt) return Date.now() > parseInt(remindAt);
    return true;
  });
  const [showWaterWidget, setShowWaterWidget] = useState(() => {
    return localStorage.getItem('water-widget') === 'true';
  });

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (board.selectedElementId) board.deleteElement(board.selectedElementId);
      }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (board.selectedElementId) board.duplicateElement(board.selectedElementId);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [board.selectedElementId, board.deleteElement, board.duplicateElement]);

  const handleWaterDone = () => {
    setShowWaterReminder(false);
    setShowWaterWidget(true);
    localStorage.setItem('water-dismissed', 'true');
    localStorage.setItem('water-widget', 'true');
  };

  const handleWaterRemindLater = () => {
    setShowWaterReminder(false);
    localStorage.setItem('water-remind-at', String(Date.now() + 25 * 60 * 1000));
  };

  const handleLogout = () => {
    localStorage.removeItem('study-dashboard-user');
    setUser(null);
  };

  const handleLogin = (username: string) => {
    setUser(username);
  };

  // Home: switch to first board
  const handleHome = () => {
    if (board.boards.length > 0) board.switchBoard(board.boards[0].id);
  };

  // Show login if not authenticated
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar
        boards={board.boards}
        currentBoardId={board.currentBoardId}
        onSwitchBoard={board.switchBoard}
        onAddBoard={() => setShowNewBoard(true)}
        zoomLocked={board.currentBoard.zoomLocked}
        onToggleZoomLock={board.toggleZoomLock}
        zoom={board.currentBoard.zoom}
        onTogglePomodoro={() => setShowPomodoro(!showPomodoro)}
        showPomodoro={showPomodoro}
        onLogout={handleLogout}
        onHome={handleHome}
        onCalendar={() => setShowCalendar(!showCalendar)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas
          board={board.currentBoard}
          selectedElementId={board.selectedElementId}
          onAddElement={board.addElement}
          onUpdateElement={board.updateElement}
          onDeleteElement={board.deleteElement}
          onSelectElement={board.setSelectedElementId}
          onBringToFront={board.bringToFront}
          onDuplicateElement={board.duplicateElement}
          onSetCamera={board.setCamera}
          onSetZoom={board.setZoom}
          onInteraction={showMiniMapTemporarily}
        />
      </div>

      {/* Floating widgets at top of board */}
      <PomodoroTimer visible={showPomodoro} onClose={() => setShowPomodoro(false)} />
      <MiniMap
        elements={board.currentBoard.elements}
        camera={board.currentBoard.camera}
        zoom={board.currentBoard.zoom}
        visible={miniMapVisible}
      />
      <BatteryIcon />
      {showWaterWidget && <WaterWidget />}

      {/* Calendar panel */}
      {showCalendar && (
        <div className="fixed top-12 right-0 z-50 w-80 h-[calc(100vh-48px)] glass ios-shadow-lg border-l border-border p-4 animate-slide-in-right overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Calendar</h3>
            <button onClick={() => setShowCalendar(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground text-xs">✕</button>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {['S','M','T','W','T','F','S'].map((d, i) => <span key={i} className="font-medium">{d}</span>)}
            {Array.from({ length: 35 }, (_, i) => {
              const today = new Date();
              const first = new Date(today.getFullYear(), today.getMonth(), 1);
              const dayNum = i - first.getDay() + 1;
              const isToday = dayNum === today.getDate();
              const inMonth = dayNum > 0 && dayNum <= new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
              return (
                <span key={i} className={`py-1 rounded-lg ${isToday ? 'bg-primary text-primary-foreground font-semibold' : inMonth ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                  {inMonth ? dayNum : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showWaterReminder && (
        <WaterReminder onDone={handleWaterDone} onRemindLater={handleWaterRemindLater} />
      )}
      <NewBoardDialog
        open={showNewBoard}
        onClose={() => setShowNewBoard(false)}
        onCreateBoard={board.addBoard}
      />
    </div>
  );
};

export default Index;
