import { useState, useEffect, useRef, useCallback } from 'react';
import { useBoard } from '@/hooks/useBoard';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/i18n/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { ElementType, BoardElement as BoardElementType, MindMapNode } from '@/types/board';
import { supabase } from '@/integrations/supabase/client';
import TopBar from '@/components/dashboard/TopBar';
import Sidebar from '@/components/dashboard/Sidebar';
import Canvas from '@/components/dashboard/Canvas';
import BoardElementComponent from '@/components/dashboard/BoardElement';
import MiniMap from '@/components/dashboard/MiniMap';
import PomodoroTimer from '@/components/dashboard/PomodoroTimer';
import WaterReminder from '@/components/dashboard/WaterReminder';
import WaterWidget from '@/components/dashboard/WaterWidget';
import BatteryIcon from '@/components/dashboard/BatteryIcon';
import NewBoardDialog from '@/components/dashboard/NewBoardDialog';
import SettingsDialog from '@/components/dashboard/SettingsDialog';
import AISidebar from '@/components/dashboard/AISidebar';
import ShareBoardDialog from '@/components/dashboard/ShareBoardDialog';
import CompleteProfileDialog from '@/components/auth/CompleteProfileDialog';
import CalendarPage from '@/pages/CalendarPage';
import Login from '@/pages/Login';

const Index = () => {
  const board = useBoard();
  const { settings, updateSettings } = useSettings();
  const { lang, setLang, t, isRTL } = useLanguage();
  const { user, loading: authLoading, profile, profileLoading, signInWithOAuth, updateProfile, signOut } = useAuth();
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Handle invite token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    if (inviteToken && user) {
      supabase.functions.invoke('accept-invite', {
        body: { token: inviteToken },
      }).then(({ data }) => {
        if (data?.board_id) {
          // Clear invite param
          window.history.replaceState({}, '', window.location.pathname);
        }
      });
    }
  }, [user]);

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

  const handleLogout = async () => {
    await signOut();
  };

  const handleGoogleLogin = async () => {
    return await signInWithOAuth('google');
  };

  const handleAppleLogin = async () => {
    return await signInWithOAuth('apple');
  };

  const handleHome = () => {
    if (board.boards.length > 0) board.switchBoard(board.boards[0].id);
  };

  const handleClearBoard = () => {
    board.updateCurrentBoard(b => ({ ...b, elements: [] }));
  };

  const handleAIAddElement = useCallback((type: 'note' | 'todo' | 'mindmap', data?: any) => {
    const cam = board.currentBoard.camera;
    const z = board.currentBoard.zoom;
    const baseX = Math.max(40, (window.innerWidth / 2 - cam.x) / z - 140);
    const baseY = Math.max(40, (window.innerHeight / 2 - cam.y) / z - 120);

    const id = board.addElement(type, baseX, baseY);
    if (!id || !data) return;

    const updates: Partial<BoardElementType> = {};
    if (data.title) updates.title = data.title;

    if (type === 'note' && data.content) {
      updates.content = data.content;
    }

    if (type === 'todo' && Array.isArray(data.items)) {
      updates.todos = data.items
        .filter((item: unknown) => typeof item === 'string' && item.trim())
        .map((text: string) => ({ id: crypto.randomUUID(), text, completed: false }));
    }

    if (type === 'mindmap' && Array.isArray(data.nodes)) {
      const nodes: MindMapNode[] = data.nodes
        .filter((item: unknown) => typeof item === 'string' && item.trim())
        .map((label: string, idx: number) => ({
          id: crypto.randomUUID(),
          x: 60 + (idx % 3) * 140,
          y: 90 + Math.floor(idx / 3) * 90,
          width: 120,
          height: 40,
          label,
          color: `hsl(${(idx * 47 + 190) % 360} 70% 58%)`,
        }));
      if (nodes.length) {
        updates.mindmapNodes = nodes;
        // Build connections from AI data
        const connections: import('@/types/board').MindMapConnection[] = [];
        if (Array.isArray(data.connections)) {
          data.connections.forEach((c: { from: number; to: number }) => {
            const fromNode = nodes[c.from];
            const toNode = nodes[c.to];
            if (fromNode && toNode) {
              connections.push({ id: crypto.randomUUID(), fromNodeId: fromNode.id, toNodeId: toNode.id });
            }
          });
        }
        updates.mindmapConnections = connections;
      }
    }

    if (Object.keys(updates).length > 0) board.updateElement(id, updates);
  }, [board]);

  const handleAIUpdateElement = useCallback((id: string, updates: Partial<BoardElementType>) => {
    if (!id) return;
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).id;
    board.updateElement(id, safeUpdates);
  }, [board]);

  const handleAIArrangeBoard = useCallback(() => {
    board.updateCurrentBoard((current) => {
      if (!current.elements.length) return current;

      const sorted = [...current.elements].sort((a, b) => a.y - b.y || a.x - b.x);
      const paddingX = 60;
      const paddingY = 60;
      const gapX = 28;
      const gapY = 24;
      const cols = Math.max(2, Math.floor((window.innerWidth - 160) / 320));

      const arranged = sorted.map((el, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = paddingX + col * (Math.max(220, el.width) + gapX);
        const y = paddingY + row * (Math.max(140, el.height) + gapY);
        return { ...el, x, y, zIndex: index + 1 };
      });

      return { ...current, elements: arranged };
    });
  }, [board]);

  // Show loading
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) return <Login onGoogleLogin={handleGoogleLogin} onAppleLogin={handleAppleLogin} t={t} />;

  const displayName = profile?.display_name?.trim() || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const needsProfile = !profileLoading && (!profile?.display_name?.trim() || !profile?.avatar_url?.trim());

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
        onFullscreen={() => setIsFullscreen(true)}
        onToggleAI={() => setShowAI(!showAI)}
        showAI={showAI}
        isRTL={isRTL}
        t={t}
        isCollaborative={board.currentBoard.isCollaborative}
        onShare={() => setShowShare(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar onOpenSettings={() => setShowSettings(true)} userName={displayName} isRTL={isRTL} t={t} />
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
      {/* Fullscreen mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[200] flex flex-col" style={{ backgroundColor: board.currentBoard.bgColor }}>
          <div
            className="flex-1 relative overflow-hidden"
            style={{
              ...(board.currentBoard.showGrid ? {
                backgroundImage: `radial-gradient(circle, ${board.currentBoard.gridColor} 1px, transparent 1px)`,
                backgroundSize: `${20 * board.currentBoard.zoom}px ${20 * board.currentBoard.zoom}px`,
                backgroundPosition: `${board.currentBoard.camera.x % (20 * board.currentBoard.zoom)}px ${board.currentBoard.camera.y % (20 * board.currentBoard.zoom)}px`,
              } : {}),
            }}
          >
            <div style={{
              transform: `translate(${board.currentBoard.camera.x}px, ${board.currentBoard.camera.y}px) scale(${board.currentBoard.zoom})`,
              transformOrigin: '0 0',
              position: 'absolute',
              top: 0,
              left: 0,
            }}>
              {board.currentBoard.elements.map(el => (
                <BoardElementComponent
                  key={el.id}
                  element={el}
                  selected={false}
                  onMouseDown={() => {}}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                  onDuplicate={() => {}}
                  onResizeMouseDown={() => {}}
                  isRTL={isRTL}
                  t={t}
                />
              ))}
            </div>
            {showPomodoro && (
              <PomodoroTimer
                visible={true}
                onClose={() => setShowPomodoro(false)}
                workMinutes={settings.pomodoroWork}
                breakMinutes={settings.pomodoroBreak}
                isRTL={isRTL}
                t={t}
              />
            )}
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="fixed top-4 right-4 z-[201] px-4 py-2 rounded-xl glass ios-shadow-lg text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
          >
            ✕ {t?.('exitFullscreen') || 'Exit Fullscreen'}
          </button>
        </div>
      )}
      <AISidebar
        open={showAI}
        onClose={() => setShowAI(false)}
        elements={board.currentBoard.elements}
        onAddElement={handleAIAddElement}
        onUpdateElement={handleAIUpdateElement}
        onDeleteElement={board.deleteElement}
        onArrangeBoard={handleAIArrangeBoard}
        isRTL={isRTL}
        t={t}
      />
      <ShareBoardDialog
        open={showShare}
        onClose={() => setShowShare(false)}
        boardId={board.currentBoardId}
        boardName={board.currentBoard.name}
        isOwner={true}
        t={t}
      />
      <CompleteProfileDialog
        open={needsProfile}
        defaultName={profile?.display_name || user.user_metadata?.display_name || ''}
        defaultAvatar={profile?.avatar_url || ''}
        onSubmit={updateProfile}
      />
    </div>
  );
};

export default Index;
