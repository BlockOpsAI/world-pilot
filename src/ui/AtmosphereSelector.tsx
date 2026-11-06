import React, { useState, useRef, useEffect } from 'react';
import { worldThemes, getWorldTheme, WorldThemeSpec } from '../library/worldThemes';
import { useWorldStore } from '../engine/store';

export const AtmosphereSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentWorldThemeId = useWorldStore(state => state.currentWorldThemeId);
  const currentGravity = useWorldStore(state => state.currentGravity);
  const shiftWorldTheme = useWorldStore(state => state.shiftWorldTheme);
  const setCustomGravity = useWorldStore(state => state.setCustomGravity);
  const isAmbientAudioActive = useWorldStore(state => state.isAmbientAudioActive);
  const toggleAmbientAudio = useWorldStore(state => state.toggleAmbientAudio);

  const activeTheme = getWorldTheme(currentWorldThemeId);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectTheme = (theme: WorldThemeSpec) => {
    shiftWorldTheme(theme.id);
  };

  const handleGravitySliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const gy = parseFloat(e.target.value);
    setCustomGravity([0, gy, 0]);
  };

  return (
    <div className="atmosphere-selector-wrapper" ref={containerRef}>
      <button
        className={`atmosphere-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        data-tooltip={isOpen ? undefined : `Changer d'univers & gravité (${activeTheme.name.split(' (')[0]})`}
        aria-label="Univers et Gravité"
        aria-expanded={isOpen}
      >
        <span className="atmo-icon">{activeTheme.icon}</span>
        <span className="atmo-name">{activeTheme.name.split(' (')[0]}</span>
        <span className="atmo-arrow">▾</span>
      </button>

      {isOpen && (
        <div className="atmosphere-dropdown-menu world-shift-dropdown" role="menu">
          <div className="atmo-dropdown-header">
            <span>UNIVERS & GRAVITÉ ({worldThemes.length})</span>
            <button
              className={`atmo-sound-toggle-btn ${isAmbientAudioActive ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleAmbientAudio();
              }}
              title={isAmbientAudioActive ? "Désactiver la nappe sonore en continu" : "Activer la nappe sonore en continu"}
            >
              {isAmbientAudioActive ? '🔊 Ambiance ON' : '🔇 Ambiance OFF'}
            </button>
          </div>

          <div className="atmo-items-grid">
            {worldThemes.map(theme => {
              const isSelected = currentWorldThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  className={`atmo-menu-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectTheme(theme)}
                  role="menuitem"
                >
                  <span className="item-icon">{theme.icon}</span>
                  <div className="item-text">
                    <div className="item-title-row">
                      <b>{theme.name}</b>
                      <span className="item-gravity-badge">{theme.gravityLabel.split(' ')[0]}</span>
                    </div>
                    <small>{theme.description}</small>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Live Gravity Controller */}
          <div className="world-shift-gravity-controller">
            <div className="gravity-header-row">
              <span>🎛️ Gravité Rapier Live :</span>
              <b>{currentGravity[1].toFixed(2)} m/s²</b>
            </div>
            <input
              type="range"
              min="-24.8"
              max="5.0"
              step="0.1"
              value={currentGravity[1]}
              onChange={handleGravitySliderChange}
              className="gravity-range-slider"
              title="Ajuster la gravité en direct"
            />
            <div className="gravity-quick-presets">
              <button onClick={() => setCustomGravity([0, -9.81, 0])} title="Terre standard">🌍 Terre</button>
              <button onClick={() => setCustomGravity([0, -3.72, 0])} title="Mars (38%)">🔴 Mars</button>
              <button onClick={() => setCustomGravity([0, 0, 0])} title="Zéro gravité">🛸 0-G</button>
              <button onClick={() => setCustomGravity([0, -1.62, 0])} title="Lune (16.5%)">🌙 Lune</button>
              <button onClick={() => setCustomGravity([0, 2.5, 0])} title="Antigravité inversée">🌀 +2.5</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
