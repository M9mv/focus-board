import { useState, useEffect } from 'react';
import {
  StickyNote, ListTodo, Type, ImageIcon, CheckSquare,
  Minus, Smile, Settings, User,
} from 'lucide-react';
import { ElementType, ELEMENT_LABELS } from '@/types/board';

const SIDEBAR_ITEMS: { type: ElementType; icon: React.ElementType; color: string }[] = [
  { type: 'note', icon: StickyNote, color: 'text-amber-500' },
  { type: 'todo', icon: ListTodo, color: 'text-primary' },
  { type: 'textbox', icon: Type, color: 'text-foreground' },
  { type: 'image', icon: ImageIcon, color: 'text-purple-500' },
  { type: 'checklist', icon: CheckSquare, color: 'text-emerald-500' },
  { type: 'divider', icon: Minus, color: 'text-muted-foreground' },
  { type: 'icon', icon: Smile, color: 'text-orange-500' },
];

interface SidebarProps {
  onOpenSettings: () => void;
  userName: string;
}

const Sidebar = ({ onOpenSettings, userName }: SidebarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('element-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col shrink-0 animate-slide-in-left">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Elements</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Drag to canvas</p>
      </div>

      <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {SIDEBAR_ITEMS.map(({ type, icon: Icon, color }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary cursor-grab active:cursor-grabbing transition-all hover:ios-shadow-sm active:scale-[0.98] select-none"
          >
            <Icon className={`w-4 h-4 ${color} shrink-0`} />
            <span className="text-sm font-medium text-foreground">{ELEMENT_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground truncate">{userName}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          <div className="tabular-nums">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div>
            {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Settings">
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
