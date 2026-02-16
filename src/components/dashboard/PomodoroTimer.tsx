import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, GripHorizontal } from 'lucide-react';

interface PomodoroTimerProps {
  visible: boolean;
  onClose: () => void;
  workMinutes?: number;
  breakMinutes?: number;
  isRTL?: boolean;
  t?: (key: string) => string;
}

const PomodoroTimer = ({ visible, onClose, workMinutes = 25, breakMinutes = 5, isRTL, t }: PomodoroTimerProps) => {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Draggable state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: -1, y: -1 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const defaultPos = useRef({ x: 0, y: 0 });

  // Set default position on mount
  useEffect(() => {
    const x = window.innerWidth - 260;
    const y = 64;
    defaultPos.current = { x, y };
    if (position.x === -1) setPosition({ x, y });
  }, []);

  // Reset when durations change
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === 'work' ? workMinutes * 60 : breakMinutes * 60);
    }
  }, [workMinutes, breakMinutes, mode, isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (Notification.permission === 'granted') {
        new Notification(mode === 'work' ? '🎉 Break time! Take a rest.' : '💪 Focus time! Back to work.');
      }
      const nextMode = mode === 'work' ? 'break' : 'work';
      setMode(nextMode);
      setTimeLeft(nextMode === 'work' ? workMinutes * 60 : breakMinutes * 60);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, mode, workMinutes, breakMinutes]);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? workMinutes * 60 : breakMinutes * 60);
  };

  // Reset position to default
  const resetPosition = () => {
    setPosition({ ...defaultPos.current });
  };

  // Mouse drag
  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      setPosition({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y });
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Touch drag
  const handleDragTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDragging.current = true;
    dragOffset.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const t = ev.touches[0];
      if (!t || !isDragging.current) return;
      setPosition({ x: t.clientX - dragOffset.current.x, y: t.clientY - dragOffset.current.y });
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  };

  const totalTime = mode === 'work' ? workMinutes * 60 : breakMinutes * 60;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / totalTime;

  if (!visible) return null;

  return (
    <div
      className="fixed z-[9999] glass ios-shadow-lg rounded-2xl p-5 w-52 animate-scale-in pointer-events-auto select-none"
      style={{ left: position.x, top: position.y }}
    >
      {/* Drag handle */}
      <div
        className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-move rounded-t-2xl hover:bg-secondary/30 transition-colors"
        onMouseDown={handleDragMouseDown}
        onTouchStart={handleDragTouchStart}
        onDoubleClick={resetPosition}
        title={t?.('timerDragHint') || 'Drag to move • Double-click to reset position'}
      >
        <GripHorizontal className="w-4 h-4 text-muted-foreground/50" />
      </div>

      <div className="flex items-center justify-between mb-4 mt-2">
        <span className={`text-xs font-semibold uppercase tracking-wider ${mode === 'work' ? 'text-primary' : 'text-emerald-500'}`}>
          {mode === 'work' ? (t?.('focus') || 'Focus') : (t?.('break') || 'Break')}
        </span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="relative w-28 h-28 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" strokeWidth="6" className="stroke-secondary" />
          <circle cx="50" cy="50" r="44" fill="none" strokeWidth="6"
            className={mode === 'work' ? 'stroke-primary' : 'stroke-emerald-500'}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-light tabular-nums text-foreground">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={reset}
          className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
