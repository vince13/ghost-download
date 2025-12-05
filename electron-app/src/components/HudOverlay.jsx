/**
 * HUD Overlay Page Component
 * Wraps the CompactHud component for the floating Electron window
 */
import { CompactHud } from './CompactHud';

export function HudOverlay() {
  return (
    <div className="bg-transparent p-0 m-0" style={{ width: 'fit-content', height: 'fit-content' }}>
      <CompactHud callId={null} isActive={false} />
    </div>
  );
}
