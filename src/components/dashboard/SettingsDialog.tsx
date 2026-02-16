import { X, Sun, Moon, Palette, Languages } from 'lucide-react';
import { AppSettings } from '@/types/board';
import { Language } from '@/i18n/translations';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onClearBoard: () => void;
  lang?: Language;
  onSetLang?: (lang: Language) => void;
  t?: (key: string) => string;
}

const SettingsDialog = ({ open, onClose, settings, onUpdate, onClearBoard, lang = 'en', onSetLang, t }: SettingsDialogProps) => {
  if (!open) return null;

  const _ = (key: string) => t?.(key) || key;

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-6 rounded-full transition-colors relative ${value ? 'bg-primary' : 'bg-secondary'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-card transition-transform ${value ? 'left-5' : 'left-1'}`} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass ios-shadow-lg rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">{_('settingsTitle')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Language */}
        <label className="block text-xs font-medium text-muted-foreground mb-2">{_('language')}</label>
        <div className="flex gap-2 mb-5">
          {[
            { value: 'en' as const, label: _('english') },
            { value: 'ar' as const, label: _('arabic') },
          ].map(l => (
            <button
              key={l.value}
              onClick={() => onSetLang?.(l.value)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                lang === l.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              {l.label}
            </button>
          ))}
        </div>

        {/* Theme */}
        <label className="block text-xs font-medium text-muted-foreground mb-2">{_('theme')}</label>
        <div className="flex gap-2 mb-5">
          {[
            { value: 'light' as const, icon: Sun, label: _('light') },
            { value: 'dark' as const, icon: Moon, label: _('dark') },
            { value: 'custom' as const, icon: Palette, label: _('custom') },
          ].map(tm => (
            <button
              key={tm.value}
              onClick={() => onUpdate({ theme: tm.value })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                settings.theme === tm.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <tm.icon className="w-3.5 h-3.5" />
              {tm.label}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <label className="block text-xs font-medium text-muted-foreground mb-2">{_('canvas')}</label>
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{_('snapToGrid')}</span>
            <Toggle value={settings.snapToGrid} onChange={(v) => onUpdate({ snapToGrid: v })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{_('showMiniMap')}</span>
            <Toggle value={settings.showMiniMap} onChange={(v) => onUpdate({ showMiniMap: v })} />
          </div>
        </div>

        {/* Pomodoro */}
        <label className="block text-xs font-medium text-muted-foreground mb-2">{_('pomodoroTimer')}</label>
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{_('pomodoroWork')}</span>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.pomodoroWork}
              onChange={(e) => onUpdate({ pomodoroWork: Math.max(1, parseInt(e.target.value) || 25) })}
              className="w-16 px-2 py-1 rounded-lg bg-secondary text-sm text-foreground text-center outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{_('pomodoroBreak')}</span>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.pomodoroBreak}
              onChange={(e) => onUpdate({ pomodoroBreak: Math.max(1, parseInt(e.target.value) || 5) })}
              className="w-16 px-2 py-1 rounded-lg bg-secondary text-sm text-foreground text-center outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{_('notifications')}</span>
            <Toggle value={settings.pomodoroNotifications} onChange={(v) => onUpdate({ pomodoroNotifications: v })} />
          </div>
        </div>

        {/* Notifications */}
        <label className="block text-xs font-medium text-muted-foreground mb-2">{_('notifications')}</label>
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{_('waterReminders')}</span>
            <Toggle value={settings.waterReminder} onChange={(v) => onUpdate({ waterReminder: v })} />
          </div>
        </div>

        {/* Danger zone */}
        <button
          onClick={() => { if (confirm('Clear all elements from the current board?')) { onClearBoard(); onClose(); } }}
          className="w-full py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
        >
          {_('clearCurrentBoard')}
        </button>
      </div>
    </div>
  );
};

export default SettingsDialog;
