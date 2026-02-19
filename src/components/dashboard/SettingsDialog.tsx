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

// Convert hex to HSL string
const hexToHSL = (hex: string): string => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Convert HSL string to hex
const hslToHex = (hsl: string): string => {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return '#3b82f6';
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const PRESET_COLORS = [
  '211 100% 50%', // Blue
  '142 70% 45%',  // Green
  '0 84% 60%',    // Red
  '280 70% 55%',  // Purple
  '25 95% 55%',   // Orange
  '330 80% 55%',  // Pink
  '180 70% 45%',  // Teal
  '45 95% 50%',   // Yellow
];

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
        <div className="flex gap-2 mb-3">
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

        {/* Custom Primary Color */}
        <label className="block text-xs font-medium text-muted-foreground mb-2">{_('primaryColor')}</label>
        <div className="flex items-center gap-2 mb-2">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => onUpdate({ customPrimaryColor: color })}
              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                settings.customPrimaryColor === color ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: `hsl(${color})` }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mb-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="color"
              value={hslToHex(settings.customPrimaryColor || '211 100% 50%')}
              onChange={(e) => onUpdate({ customPrimaryColor: hexToHSL(e.target.value) })}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
            />
            <span className="text-xs text-muted-foreground">{_('customColor')}</span>
          </label>
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
