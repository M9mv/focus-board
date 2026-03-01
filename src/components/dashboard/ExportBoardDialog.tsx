import { useState } from 'react';
import { X, Image, FileText, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportBoardDialogProps {
  open: boolean;
  onClose: () => void;
  t?: (key: string) => string;
}

const ExportBoardDialog = ({ open, onClose, t }: ExportBoardDialogProps) => {
  const [exporting, setExporting] = useState(false);
  const _ = (key: string) => t?.(key) || key;

  const captureCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvasEl = document.querySelector('[data-board-canvas]') as HTMLElement;
    if (!canvasEl) return null;

    const rect = canvasEl.getBoundingClientRect();
    const computed = getComputedStyle(canvasEl);
    const bg = computed.backgroundColor || 'hsl(var(--background))';

    try {
      const canvas = await html2canvas(canvasEl, {
        backgroundColor: bg,
        useCORS: true,
        scale: Math.min(3, window.devicePixelRatio > 1 ? 2 : 1.5),
        width: rect.width,
        height: rect.height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      });
      return canvas;
    } catch {
      return null;
    }
  };

  const exportAsPNG = async () => {
    setExporting(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `board-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExporting(false);
      onClose();
    }
  };

  const exportAsPDF = async () => {
    setExporting(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`board-${Date.now()}.pdf`);
    } finally {
      setExporting(false);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass ios-shadow-lg rounded-2xl p-6 w-80 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">{_('exportBoard')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={exportAsPNG}
            disabled={exporting}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Image className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">{_('exportAsPNG')}</div>
              <div className="text-xs text-muted-foreground">{_('highQualityImage')}</div>
            </div>
            <Download className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <button
            onClick={exportAsPDF}
            disabled={exporting}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-destructive" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">{_('exportAsPDF')}</div>
              <div className="text-xs text-muted-foreground">{_('documentFormat')}</div>
            </div>
            <Download className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>
        </div>

        {exporting && (
          <div className="mt-4 text-center text-xs text-muted-foreground animate-pulse">
            {_('exporting')}...
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportBoardDialog;
