import { Droplets } from 'lucide-react';

interface WaterReminderProps {
  onDone: () => void;
  onRemindLater: () => void;
  t?: (key: string) => string;
}

const WaterReminder = ({ onDone, onRemindLater, t }: WaterReminderProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onRemindLater} />
      <div className="relative glass ios-shadow-lg rounded-2xl p-6 w-80 animate-scale-in text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Droplets className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">{t?.('stayHydrated') || 'Stay Hydrated! 💧'}</h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          {t?.('waterMessage') || 'Remember to drink 2 liters of water — drinking water improves focus and concentration.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onRemindLater}
            className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors active:scale-95"
          >
            {t?.('remindLater') || 'Remind Later'}
          </button>
          <button
            onClick={onDone}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity active:scale-95"
          >
            {t?.('done') || 'Done ✓'}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">{t?.('remindLaterTime') || 'Remind later: 25 minutes'}</p>
      </div>
    </div>
  );
};

export default WaterReminder;
