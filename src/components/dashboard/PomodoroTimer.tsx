import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';

interface PomodoroTimerProps {
  visible: boolean;
  onClose: () => void;
  workMinutes?: number;
  breakMinutes?: number;
}

const PomodoroTimer = ({ visible, onClose, workMinutes = 25, breakMinutes = 5 }: PomodoroTimerProps) => {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

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

  const totalTime = mode === 'work' ? workMinutes * 60 : breakMinutes * 60;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / totalTime;

  if (!visible) return null;

  return (
    <div className="fixed top-16 right-40 z-[9999] glass ios-shadow-lg rounded-2xl p-5 w-52 animate-scale-in pointer-events-auto">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-semibold uppercase tracking-wider ${mode === 'work' ? 'text-primary' : 'text-emerald-500'}`}>
          {mode === 'work' ? 'Focus' : 'Break'}
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
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={reset}
          className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
