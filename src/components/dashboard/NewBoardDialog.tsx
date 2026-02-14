import { useState } from 'react';
import { X } from 'lucide-react';

interface NewBoardDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateBoard: (name: string, bgColor: string, gridColor: string, showGrid: boolean) => void;
}

// Preset background colors including black and white
const BG_PRESETS = [
  { label: 'Black', value: 'hsl(0, 0%, 0%)' },
  { label: 'White', value: 'hsl(0, 0%, 100%)' },
  { label: 'Default', value: 'hsl(220, 14%, 96%)' },
  { label: 'Blue', value: 'hsl(210, 30%, 96%)' },
  { label: 'Green', value: 'hsl(142, 30%, 96%)' },
  { label: 'Pink', value: 'hsl(330, 30%, 96%)' },
  { label: 'Yellow', value: 'hsl(45, 30%, 96%)' },
];

const GRID_PRESETS = [
  { label: 'White', value: 'hsl(0, 0%, 100%)' },
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
  const [customBg, setCustomBg] = useState('#000000');
  const [customGrid, setCustomGrid] = useState('#ffffff');

  if (!open) return null;

  const handleCreate = () => {
    onCreateBoard(name || 'New Board', bgColor, gridColor, showGrid);
    setName('');
    setBgColor(BG_PRESETS[0].value);
    setGridColor(GRID_PRESETS[0].value);
    setShowGrid(true);
    onClose();
  };

  // Convert hex to HSL string for custom color picker
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
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

        {/* Background color presets + picker */}
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Background</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {BG_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setBgColor(p.value)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${bgColor === p.value ? 'border-primary scale-110' : 'border-border'}`}
              style={{ backgroundColor: p.value }}
              title={p.label}
            />
          ))}
          {/* Custom color picker */}
          <label className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden cursor-pointer relative" title="Custom Color">
            <input
              type="color"
              value={customBg}
              onChange={(e) => { setCustomBg(e.target.value); setBgColor(hexToHsl(e.target.value)); }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400" />
          </label>
        </div>

        {/* Grid toggle */}
        <div className="flex items-center justify-between mb-2 mt-4">
          <label className="text-xs font-medium text-muted-foreground">Grid Dots</label>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`w-10 h-6 rounded-full transition-colors relative ${showGrid ? 'bg-primary' : 'bg-secondary'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-card transition-transform ${showGrid ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        {/* Grid color presets + picker */}
        {showGrid && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {GRID_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => setGridColor(p.value)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${gridColor === p.value ? 'border-primary scale-110' : 'border-border'}`}
                style={{ backgroundColor: p.value }}
                title={p.label}
              />
            ))}
            <label className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden cursor-pointer relative" title="Custom Grid Color">
              <input
                type="color"
                value={customGrid}
                onChange={(e) => { setCustomGrid(e.target.value); setGridColor(hexToHsl(e.target.value)); }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full h-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400" />
            </label>
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
