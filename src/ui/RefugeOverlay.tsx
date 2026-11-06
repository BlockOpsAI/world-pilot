import React, { useState } from 'react';
import { useWorldStore } from '../engine/store';
import { ambientAudio } from '../engine/ambientAudio';

export const RefugeOverlay: React.FC = () => {
  const currentWorldThemeId = useWorldStore(state => state.currentWorldThemeId);
  const setWorldTheme = useWorldStore(state => state.setWorldTheme);

  const isRefugeActive = currentWorldThemeId === 'le-refuge';
  const [isEntered, setIsEntered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isRefugeActive) return null;

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleEnterRefuge = () => {
    setIsEntered(true);
    // Start authentic audio soundscape if not already playing
    if (!ambientAudio.isAudioActive()) {
      ambientAudio.start('le-refuge');
    }
  };

  const handleExitRefuge = () => {
    setWorldTheme('earth-atelier');
    setIsEntered(false);
  };

  return (
    <div className={`refuge-screen-root ${isEntered ? 'refuge-entered' : ''}`}>
      {/* Editorial corner frame markers */}
      <div className="refuge-corner refuge-corner-tl" />
      <div className="refuge-corner refuge-corner-br" />

      {/* Top Header */}
      <header className="refuge-topbar">
        <div className="refuge-wordmark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m2 19 7-13 5 9 3-5 5 9H2Zm4-7 3 1 2-3" />
          </svg>
          <div className="refuge-wordmark-text">
            <span className="refuge-wordmark-title">LE REFUGE</span>
            <span className="refuge-wordmark-sub">UN MONDE À HABITER</span>
          </div>
        </div>

        <div className="refuge-top-right">
          <span className="refuge-live-dot" />
          <span className="refuge-pace-label">À votre rythme</span>
          <button
            className="refuge-icon-btn"
            onClick={handleToggleFullscreen}
            aria-label="Plein écran"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? '⤦' : '⛶'}
          </button>
          <button
            className="refuge-studio-btn"
            onClick={handleExitRefuge}
            title="Revenir à l'Atelier WorldPilot classique"
          >
            ← Atelier Studio
          </button>
        </div>
      </header>

      {/* Hero Welcome Section */}
      {!isEntered && (
        <section className="refuge-welcome" aria-labelledby="refuge-welcome-title">
          <div className="refuge-eyebrow">
            <span /> UNE PARENTHÈSE, EN PLEINE NATURE
          </div>
          <h1 id="refuge-welcome-title" className="refuge-title">
            Vous n’avez<br />rien à <em>réussir.</em>
          </h1>
          <p className="refuge-intro-copy">
            Un feu qui crépite. Le ciel qui change.<br />
            Et tout le temps de ne rien faire.
          </p>
          <button className="refuge-primary-button" onClick={handleEnterRefuge}>
            <span>Entrer dans le refuge</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h15m-6-6 6 6-6 6" />
            </svg>
          </button>
          <p className="refuge-loading-label">Le refuge est prêt. Entrez quand vous voulez.</p>
          <div className="refuge-welcome-notes">
            <span>Exploration libre</span>
            <span>Sans objectif</span>
            <span>Juste ici</span>
          </div>
        </section>
      )}

      {/* Foreground Sanctuary Rock Caption */}
      {!isEntered && (
        <div className="refuge-scene-caption">
          <span className="refuge-caption-rule" />
          <div>
            <span className="refuge-caption-eyebrow">VOTRE REFUGE</span>
            <p className="refuge-caption-text">
              Quelque part,<br />loin du bruit.
            </p>
          </div>
        </div>
      )}

      {/* When entered: discreet control pill at bottom */}
      {isEntered && (
        <div className="refuge-inworld-bar">
          <div className="refuge-inworld-hint">
            <kbd>Trackpad</kbd> ou <kbd>Souris</kbd> pour contempler le lac et les sommets <span>·</span> Déplacez des objets en toute liberté
          </div>
          <button
            className="refuge-pause-btn"
            onClick={() => setIsEntered(false)}
            title="Afficher l'accueil du Refuge"
          >
            Accueil du Refuge
          </button>
        </div>
      )}

      {/* Footer */}
      {!isEntered && (
        <footer className="refuge-welcome-footer">
          <span>UN LIEU POUR RALENTIR</span>
          <span>ZQSD ou Tactile pour marcher · Souris pour regarder</span>
        </footer>
      )}
    </div>
  );
};
