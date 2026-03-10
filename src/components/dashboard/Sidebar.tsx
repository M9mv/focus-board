import { useState, useEffect } from 'react';
import {
  StickyNote, ListTodo, Type, ImageIcon, CheckSquare,
  Minus, Smile, Settings, User, GitBranch, Mic,
} from 'lucide-react';
import { ElementType, ELEMENT_LABELS } from '@/types/board';

interface SidebarProps {
  onOpenSettings: () => void;
  userName: string;
  isRTL?: boolean;
  t?: (key: string) => string;
}

const SIDEBAR_ITEMS: { type: ElementType; icon: React.ElementType; color: string; labelKey: string }[] = [
  { type: 'note', icon: StickyNote, color: 'text-amber-500', labelKey: 'quickNote' },
  { type: 'todo', icon: ListTodo, color: 'text-primary', labelKey: 'todoList' },
  { type: 'textbox', icon: Type, color: 'text-foreground', labelKey: 'quickText' },
  { type: 'image', icon: ImageIcon, color: 'text-purple-500', labelKey: 'imageCard' },
  { type: 'checklist', icon: CheckSquare, color: 'text-emerald-500', labelKey: 'checklist' },
  { type: 'divider', icon: Minus, color: 'text-muted-foreground', labelKey: 'divider' },
  { type: 'icon', icon: Smile, color: 'text-orange-500', labelKey: 'emoji' },
  { type: 'mindmap', icon: GitBranch, color: 'text-cyan-500', labelKey: 'mindMap' },
];

const Sidebar = ({ onOpenSettings, userName, isRTL, t }: SidebarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('element-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Touch-based add: on long-press or tap, we'll add to center
  const handleTouchEnd = (type: ElementType) => {
    // For mobile: we fire a custom event that Index listens to
    window.dispatchEvent(new CustomEvent('sidebar-touch-add', { detail: { type } }));
  };

  const locale = isRTL ? 'ar' : 'en';

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col shrink-0 animate-slide-in-left max-md:w-14 max-md:overflow-hidden">
      <div className="p-4 border-b border-border max-md:p-2">
        <h2 className="text-sm font-semibold text-foreground max-md:hidden">{t?.('elements') || 'Elements'}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 max-md:hidden">{t?.('dragToCanvas') || 'Drag to canvas'}</p>
      </div>

      <div className="flex-1 p-3 space-y-1.5 overflow-y-auto max-md:p-1 max-md:space-y-1">
        {SIDEBAR_ITEMS.map(({ type, icon: Icon, color, labelKey }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd(type); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary cursor-grab active:cursor-grabbing transition-all hover:ios-shadow-sm active:scale-[0.97] active:bg-primary/10 select-none max-md:px-2 max-md:py-2 max-md:justify-center touch-manipulation"
          >
            <Icon className={`w-4 h-4 ${color} shrink-0`} />
            <span className="text-sm font-medium text-foreground max-md:hidden">{t?.(labelKey) || ELEMENT_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border max-md:p-2">
        <div className="flex items-center gap-2 mb-3 max-md:justify-center">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground truncate max-md:hidden">{userName}</span>
        </div>
        <div className="text-xs text-muted-foreground max-md:hidden">
          <div className="tabular-nums">
            {time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div>
            {time.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 max-md:mt-1 max-md:justify-center">
          <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title={t?.('settings') || 'Settings'}>
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
