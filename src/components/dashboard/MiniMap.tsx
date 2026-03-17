import { BoardElement } from '@/types/board';

interface MiniMapProps {
  elements: BoardElement[];
  camera: { x: number; y: number };
  zoom: number;
  visible: boolean; // controlled externally - shown only during pan/zoom
}

// MiniMap appears temporarily when the user pans or zooms the canvas
const MiniMap = ({ elements, camera, zoom, visible }: MiniMapProps) => {
  const mapW = 180;
  const mapH = 110;

  if (!visible) return null;

  if (elements.length === 0) {
    return (
      <div
        className="fixed bottom-20 left-4 z-40 glass ios-shadow rounded-xl flex items-center justify-center animate-fade-in"
        style={{ width: mapW, height: mapH }}
      >
        <span className="text-[10px] text-muted-foreground">No elements</span>
      </div>
    );
  }

  const padding = 300;
  const xs = elements.flatMap(e => [e.x, e.x + e.width]);
  const ys = elements.flatMap(e => [e.y, e.y + e.height]);
  const minX = Math.min(0, ...xs) - padding;
  const maxX = Math.max(800, ...xs) + padding;
  const minY = Math.min(0, ...ys) - padding;
  const maxY = Math.max(600, ...ys) + padding;

  const worldW = maxX - minX;
  const worldH = maxY - minY;
  const scale = Math.min(mapW / worldW, mapH / worldH);

  const vpW = (window.innerWidth - 224) / zoom;
  const vpH = (window.innerHeight - 48) / zoom;
  const vpX = -camera.x / zoom;
  const vpY = -camera.y / zoom;

  return (
    <div
      className="fixed top-16 right-4 z-40 glass ios-shadow rounded-xl overflow-hidden animate-fade-in"
      style={{ width: mapW, height: mapH }}
    >
      {elements.map(el => (
        <div
          key={el.id}
          className="absolute bg-primary/30 rounded-[1px]"
          style={{
            left: (el.x - minX) * scale,
            top: (el.y - minY) * scale,
            width: Math.max(3, el.width * scale),
            height: Math.max(3, el.height * scale),
          }}
        />
      ))}
      <div
        className="absolute border border-primary/50 rounded-[1px]"
        style={{
          left: (vpX - minX) * scale,
          top: (vpY - minY) * scale,
          width: vpW * scale,
          height: vpH * scale,
        }}
      />
    </div>
  );
};

export default MiniMap;
