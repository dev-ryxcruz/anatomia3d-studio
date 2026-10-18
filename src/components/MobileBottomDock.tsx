import React from 'react';
import { Compass, Scissors, Search, Tag, X } from 'lucide-react';
import { CameraPreset, SliceAxis } from './Viewer3D';

interface MobileBottomDockProps {
  sidebarOpenMobile: boolean;
  mobileDockPopover: 'slice' | 'views' | null;
  sliceAxis: SliceAxis;
  sliceOffset: number;
  showLabels: boolean;
  onToggleSidebarMobile: () => void;
  onSetMobileDockPopover: React.Dispatch<
    React.SetStateAction<'slice' | 'views' | null>
  >;
  onCloseSidebarAndTools: () => void;
  onAxisChange: (axis: SliceAxis) => void;
  onSliceOffsetChange: (offset: number) => void;
  onToggleSliceInvert: () => void;
  onTriggerCamera: (preset: CameraPreset) => void;
  onToggleShowLabels: () => void;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  sidebarOpenMobile,
  mobileDockPopover,
  sliceAxis,
  sliceOffset,
  showLabels,
  onToggleSidebarMobile,
  onSetMobileDockPopover,
  onCloseSidebarAndTools,
  onAxisChange,
  onSliceOffsetChange,
  onToggleSliceInvert,
  onTriggerCamera,
  onToggleShowLabels,
}) => {
  return (
    <nav className="mobile-bottom-dock" aria-label="Controles 3D Mobile">
      {/* Popover: Plano de Corte */}
      {mobileDockPopover === 'slice' && (
        <div
          className="mobile-dock-popover"
          role="dialog"
          aria-label="Plano de Corte"
        >
          <div className="mobile-popover-header">
            <span>
              <Scissors size={14} className="text-cyan" /> Plano de Corte
              Anatômico
            </span>
            <button
              type="button"
              className="icon-btn-sm"
              onClick={() => onSetMobileDockPopover(null)}
            >
              <X size={15} />
            </button>
          </div>
          <div className="mobile-popover-pills">
            {(
              [
                { id: 'none', label: 'Desativado' },
                { id: 'axial', label: 'Axial' },
                { id: 'sagittal', label: 'Sagital' },
                { id: 'coronal', label: 'Coronal' },
              ] as { id: SliceAxis; label: string }[]
            ).map((ax) => (
              <button
                key={ax.id}
                type="button"
                className={`btn-chip ${
                  sliceAxis === ax.id ? 'btn-chip-active' : ''
                }`}
                onClick={() => onAxisChange(ax.id)}
              >
                {ax.label}
              </button>
            ))}
          </div>
          {sliceAxis !== 'none' && (
            <div className="mobile-popover-slider-row">
              <input
                type="range"
                min={sliceAxis === 'axial' ? -1.55 : -0.85}
                max={sliceAxis === 'axial' ? 2.6 : 0.85}
                step={0.02}
                value={sliceOffset}
                onChange={(e) => onSliceOffsetChange(parseFloat(e.target.value))}
                aria-label="Posição do plano de corte"
              />
              <button
                type="button"
                className="btn-chip"
                onClick={onToggleSliceInvert}
              >
                Inverter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Popover: Vistas Rápidas */}
      {mobileDockPopover === 'views' && (
        <div
          className="mobile-dock-popover"
          role="dialog"
          aria-label="Vistas da Câmera"
        >
          <div className="mobile-popover-header">
            <span>
              <Compass size={14} className="text-cyan" /> Vistas Anatômicas
            </span>
            <button
              type="button"
              className="icon-btn-sm"
              onClick={() => onSetMobileDockPopover(null)}
            >
              <X size={15} />
            </button>
          </div>
          <div className="mobile-popover-pills">
            <button
              type="button"
              className="btn-chip"
              onClick={() => {
                onTriggerCamera('anterior');
                onSetMobileDockPopover(null);
              }}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => {
                onTriggerCamera('posterior');
                onSetMobileDockPopover(null);
              }}
            >
              Posterior
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => {
                onTriggerCamera('right');
                onSetMobileDockPopover(null);
              }}
            >
              Lateral
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => {
                onTriggerCamera('superior');
                onSetMobileDockPopover(null);
              }}
            >
              Superior
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => {
                onTriggerCamera('reset');
                onSetMobileDockPopover(null);
              }}
            >
              Resetar
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`mobile-dock-btn ${
          sidebarOpenMobile ? 'mobile-dock-btn-active' : ''
        }`}
        onClick={onToggleSidebarMobile}
      >
        <Search size={18} />
        <span>Sistemas/Busca</span>
      </button>

      <button
        type="button"
        className={`mobile-dock-btn ${
          mobileDockPopover === 'slice' || sliceAxis !== 'none'
            ? 'mobile-dock-btn-active'
            : ''
        }`}
        onClick={() => {
          onCloseSidebarAndTools();
          onSetMobileDockPopover((v) => (v === 'slice' ? null : 'slice'));
        }}
      >
        <Scissors size={18} />
        <span>Plano de Corte</span>
      </button>

      <button
        type="button"
        className={`mobile-dock-btn ${
          mobileDockPopover === 'views' ? 'mobile-dock-btn-active' : ''
        }`}
        onClick={() => {
          onCloseSidebarAndTools();
          onSetMobileDockPopover((v) => (v === 'views' ? null : 'views'));
        }}
      >
        <Compass size={18} />
        <span>Vistas</span>
      </button>

      <button
        type="button"
        className={`mobile-dock-btn ${
          showLabels ? 'mobile-dock-btn-active' : ''
        }`}
        onClick={() => {
          onSetMobileDockPopover(null);
          onToggleShowLabels();
        }}
      >
        <Tag size={18} />
        <span>Etiquetas 3D</span>
      </button>
    </nav>
  );
};
