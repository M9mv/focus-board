import { useState, useEffect } from 'react';
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

const Index = () => {
  const board = useBoard();
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);

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
      // Don't handle if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (board.selectedElementId) {
          board.deleteElement(board.selectedElementId);
        }
      }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (board.selectedElementId) {
          board.duplicateElement(board.selectedElementId);
        }
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
        />
      </div>

      {/* Floating widgets */}
      <PomodoroTimer visible={showPomodoro} onClose={() => setShowPomodoro(false)} />
      <MiniMap
        elements={board.currentBoard.elements}
        camera={board.currentBoard.camera}
        zoom={board.currentBoard.zoom}
      />
      <BatteryIcon />
      {showWaterWidget && <WaterWidget />}

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
