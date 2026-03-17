import { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';

// Water widget - themed rounded square, top-right corner next to battery
const WaterWidget = () => {
  const [glasses, setGlasses] = useState(() => {
    return parseInt(localStorage.getItem('water-glasses') || '0');
  });
  const target = 8;
  const progress = Math.min(1, glasses / target);

  useEffect(() => {
    localStorage.setItem('water-glasses', String(glasses));
  }, [glasses]);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div
      className="fixed bottom-4 left-20 z-40 w-14 h-14 rounded-2xl glass ios-shadow flex items-center justify-center cursor-pointer select-none animate-fade-in hover:ios-shadow-lg transition-shadow"
      onClick={() => setGlasses(g => Math.min(g + 1, target))}
      title={`Water: ${glasses}/${target} cups — click to log`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="3" className="stroke-secondary" />
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="3"
          className="stroke-primary"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <Droplets className="w-4 h-4 text-primary relative z-10" />
    </div>
  );
};

export default WaterWidget;
