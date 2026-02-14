import { useState } from 'react';
import { X } from 'lucide-react';

interface NewBoardDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateBoard: (name: string, bgColor: string, gridColor: string, showGrid: boolean) => void;
}

const BG_PRESETS = [
  { label: 'Default', value: 'hsl(220, 14%, 96%)' },
  { label: 'Blue', value: 'hsl(210, 30%, 96%)' },
  { label: 'Green', value: 'hsl(142, 30%, 96%)' },
  { label: 'Pink', value: 'hsl(330, 30%, 96%)' },
  { label: 'Yellow', value: 'hsl(45, 30%, 96%)' },
  { label: 'White', value: 'hsl(0, 0%, 100%)' },
];

const GRID_PRESETS = [
  { label: 'Gray', value: 'hsl(220, 14%, 82%)' },
  { label: 'Blue', value: 'hsl(211, 40%, 80%)' },
  { label: 'Green', value: 'hsl(142, 40%, 80%)' },
  { label: 'Pink', value: 'hsl(330, 40%, 80%)' },
];

const NewBoardDialog = ({ open, onClose, onCreateBoard }: NewBoardDialogProps) => {
  const [name, setName] = useState('');
  const [bgColor, setBgColor] = useState(BG_PRESETS[0].value);
  const [gridColor, setGridColor] = useState(GRID_PRESETS[0].value);
  const [showGrid, setShowGrid] = useState(true);

  if (!open) return null;

  const handleCreate = () => {
    onCreateBoard(name || 'New Board', bgColor, gridColor, showGrid);
    setName('');
    setBgColor(BG_PRESETS[0].value);
    setGridColor(GRID_PRESETS[0].value);
    setShowGrid(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass ios-shadow-lg rounded-2xl p-6 w-96 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">New Board</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Name */}
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Board Name</label>
        <input
          className="w-full px-3 py-2 rounded-xl bg-secondary text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 mb-4"
          placeholder="My Board"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        {/* Background color */}
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Background</label>
        <div className="flex gap-2 mb-4">
          {BG_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setBgColor(p.value)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${bgColor === p.value ? 'border-primary scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: p.value }}
              title={p.label}
            />
          ))}
        </div>

        {/* Grid */}
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted-foreground">Grid Dots</label>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`w-10 h-6 rounded-full transition-colors relative ${showGrid ? 'bg-primary' : 'bg-secondary'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-card transition-transform ${showGrid ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        {showGrid && (
          <div className="flex gap-2 mb-4">
            {GRID_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => setGridColor(p.value)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${gridColor === p.value ? 'border-primary scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: p.value }}
                title={p.label}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleCreate}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity mt-2"
        >
          Create Board
        </button>
      </div>
    </div>
  );
};

export default NewBoardDialog;
