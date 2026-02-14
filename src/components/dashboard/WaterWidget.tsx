import { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';

const WaterWidget = () => {
  const [glasses, setGlasses] = useState(() => {
    return parseInt(localStorage.getItem('water-glasses') || '0');
  });
  const target = 8;
  const progress = Math.min(1, glasses / target);

  useEffect(() => {
    localStorage.setItem('water-glasses', String(glasses));
  }, [glasses]);

  // Arc progress calculation
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-[130px] h-[130px] bg-card ios-shadow flex flex-col items-center justify-center gap-1 cursor-pointer select-none animate-fade-in hover:ios-shadow-lg transition-shadow"
      onClick={() => setGlasses(g => Math.min(g + 1, target))}
      title="Click to log a glass of water"
    >
      {/* Side arc */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="4"
          className="stroke-secondary" />
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="4"
          className="stroke-primary"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>

      <Droplets className="w-7 h-7 text-primary relative z-10" />
      <span className="text-[11px] font-semibold text-foreground relative z-10">Water</span>
      <span className="text-[10px] text-muted-foreground relative z-10 tabular-nums">
        {glasses}/{target} cups
      </span>
    </div>
  );
};

export default WaterWidget;
