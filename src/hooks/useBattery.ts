import { useState, useEffect } from 'react';

export const useBattery = () => {
  const [level, setLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    const nav = navigator as any;
    if (!nav.getBattery) return;

    nav.getBattery().then((battery: any) => {
      setLevel(Math.round(battery.level * 100));
      setCharging(battery.charging);

      const onLevel = () => setLevel(Math.round(battery.level * 100));
      const onCharging = () => setCharging(battery.charging);
      battery.addEventListener('levelchange', onLevel);
      battery.addEventListener('chargingchange', onCharging);
    });
  }, []);

  return { level, charging };
};
