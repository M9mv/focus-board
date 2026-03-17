import { useBattery } from '@/hooks/useBattery';

// Battery icon - themed rounded square, top-right corner
const BatteryIcon = () => {
  const { level, charging } = useBattery();
  if (level === null) return null;

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - level / 100);
  const color = level > 50 ? 'stroke-emerald-500' : level > 20 ? 'stroke-amber-500' : 'stroke-destructive';

  return (
    <div
      className="fixed bottom-4 left-4 z-40 w-14 h-14 rounded-2xl glass ios-shadow flex items-center justify-center animate-fade-in"
      title={`Battery: ${level}%${charging ? ' (charging)' : ''}`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="3" className="stroke-secondary" />
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="3"
          className={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="text-[10px] font-semibold text-foreground tabular-nums relative z-10">
        {level}%
      </span>
    </div>
  );
};

export default BatteryIcon;
