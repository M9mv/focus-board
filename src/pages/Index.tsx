import { useState, useEffect, useRef, useCallback } from 'react';
import { useBoard } from '@/hooks/useBoard';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/i18n/useLanguage';
import { ElementType } from '@/types/board';
import TopBar from '@/components/dashboard/TopBar';
import Sidebar from '@/components/dashboard/Sidebar';
import Canvas from '@/components/dashboard/Canvas';
import MiniMap from '@/components/dashboard/MiniMap';
import PomodoroTimer from '@/components/dashboard/PomodoroTimer';
import WaterReminder from '@/components/dashboard/WaterReminder';
import WaterWidget from '@/components/dashboard/WaterWidget';
import BatteryIcon from '@/components/dashboard/BatteryIcon';
import NewBoardDialog from '@/components/dashboard/NewBoardDialog';
import SettingsDialog from '@/components/dashboard/SettingsDialog';
import ExportBoardDialog from '@/components/dashboard/ExportBoardDialog';
import AISidebar from '@/components/dashboard/AISidebar';
import CalendarPage from '@/pages/CalendarPage';
import Login from '@/pages/Login';

const Index = () => {
  const board = useBoard();
  const { settings, updateSettings } = useSettings();
  const { lang, setLang, t, isRTL } = useLanguage();
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Auth state
  const [user, setUser] = useState<string | null>(() => {
    return localStorage.getItem('study-dashboard-user');
  });

  // MiniMap: show temporarily on pan/zoom
  const [miniMapVisible, setMiniMapVisible] = useState(false);
  const miniMapTimer = useRef<number | null>(null);

  const showMiniMapTemporarily = useCallback(() => {
    if (!settings.showMiniMap) return;
    setMiniMapVisible(true);
    if (miniMapTimer.current) clearTimeout(miniMapTimer.current);
    miniMapTimer.current = window.setTimeout(() => setMiniMapVisible(false), 1500);
  }, [settings.showMiniMap]);

  // Water reminder state
  const [showWaterReminder, setShowWaterReminder] = useState(() => {
    if (!settings.waterReminder) return false;
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

  // Listen for sidebar touch-add events (mobile)
  useEffect(() => {
    const handler = (e: Event) => {
      const type = (e as CustomEvent).detail?.type as ElementType;
      if (type) {
        const cam = board.currentBoard.camera;
        const z = board.currentBoard.zoom;
        const x = (window.innerWidth / 2 - cam.x) / z;
        const y = (window.innerHeight / 2 - cam.y) / z;
        board.addElement(type, x, y);
      }
    };
    window.addEventListener('sidebar-touch-add', handler);
    return () => window.removeEventListener('sidebar-touch-add', handler);
  }, [board]);

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

  const handleHome = () => {
    if (board.boards.length > 0) board.switchBoard(board.boards[0].id);
  };

  const handleClearBoard = () => {
    board.updateCurrentBoard(b => ({ ...b, elements: [] }));
  };

  // Show login if not authenticated
  if (!user) return <Login onLogin={handleLogin} t={t} />;

  // Full-page calendar
  if (showCalendar) return <CalendarPage onBack={() => setShowCalendar(false)} t={t} isRTL={isRTL} />;

  return (
    <div className={`h-screen flex flex-col overflow-hidden bg-background ${isRTL ? 'direction-rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
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
        onCalendar={() => setShowCalendar(true)}
        onExport={() => setShowExport(true)}
        onToggleAI={() => setShowAI(!showAI)}
        showAI={showAI}
        isRTL={isRTL}
        t={t}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar onOpenSettings={() => setShowSettings(true)} userName={user} isRTL={isRTL} t={t} />
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
          snapToGrid={settings.snapToGrid}
          isRTL={isRTL}
          t={t}
        />
      </div>

      {/* Floating widgets */}
      <PomodoroTimer
        visible={showPomodoro}
        onClose={() => setShowPomodoro(false)}
        workMinutes={settings.pomodoroWork}
        breakMinutes={settings.pomodoroBreak}
        isRTL={isRTL}
        t={t}
      />
      <MiniMap
        elements={board.currentBoard.elements}
        camera={board.currentBoard.camera}
        zoom={board.currentBoard.zoom}
        visible={miniMapVisible}
      />
      <BatteryIcon />
      {showWaterWidget && <WaterWidget />}

      {/* Modals */}
      {showWaterReminder && (
        <WaterReminder onDone={handleWaterDone} onRemindLater={handleWaterRemindLater} t={t} />
      )}
      <NewBoardDialog
        open={showNewBoard}
        onClose={() => setShowNewBoard(false)}
        onCreateBoard={board.addBoard}
        t={t}
      />
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={updateSettings}
        onClearBoard={handleClearBoard}
        lang={lang}
        onSetLang={setLang}
        t={t}
      />
      <ExportBoardDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        t={t}
      />
      <AISidebar
        open={showAI}
        onClose={() => setShowAI(false)}
        elements={board.currentBoard.elements}
        isRTL={isRTL}
        t={t}
      />
    </div>
  );
};

export default Index;
