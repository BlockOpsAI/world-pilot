import { useState, useEffect } from 'react';
import { fleScenes, createFLEPatch, type FLEScene } from '../library/fleScenes';
import { useWorldStore } from '../engine/store';

interface FLEScenesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDeploy?: (title: string, onExecute: (clearFirst: boolean) => void) => void;
}

export function FLEScenesModal({ isOpen, onClose, onRequestDeploy }: FLEScenesModalProps) {
  const [levelFilter, setLevelFilter] = useState<string>('Tous');
  const [search, setSearch] = useState<string>('');
  const [selectedScene, setSelectedScene] = useState<FLEScene>(fleScenes[0]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredScenes = fleScenes.filter(s => {
    const matchesLevel = levelFilter === 'Tous' || s.level === levelFilter;
    const matchesSearch = !search.trim() || 
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.vocabulary.some(v => v.toLowerCase().includes(search.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const handleLoadScene = (scene: FLEScene) => {
    const execute = (clearFirst: boolean) => {
      const store = useWorldStore.getState();
      if (clearFirst) {
        store.resetWorld();
      }
      const patch = createFLEPatch(scene, store.world.ir.entities);
      store.applyPatch(
        patch,
        `Scène FLE ${scene.number} : ${scene.title}`,
        { intent: 'load_fle_scene', actions: [{ action: 'create_fle_environment', target: scene.id }] }
      );
      // Focus the caption board
      const captionEntity = patch.entitiesCreated?.find(e => e.id.includes('captions'));
      if (captionEntity) {
        store.setSpatialContext(captionEntity.id, null);
      }
      onClose();
    };

    if (onRequestDeploy) {
      onRequestDeploy(scene.title, execute);
    } else {
      execute(false);
    }
  };

  return (
    <div className="library-backdrop" role="dialog" aria-modal="true" aria-labelledby="fle-title">
      <div className="library-dialog fle-modal-dialog">
        <header>
          <div>
            <div className="eyebrow">IMMERSION PÉDAGOGIQUE · 30 SCÈNES DU QUOTIDIEN</div>
            <h2 id="fle-title">Apprendre le français en 3D</h2>
            <p>Situations de communication authentiques · Dialogues · Vocabulaire · Écoute vocale · Quiz interactif</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        <div className="library-filters">
          <input
            type="text"
            placeholder="Rechercher une situation, un mot (boulangerie, café, médecin...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Recherche"
          />
          <div className="fle-level-tabs" role="tablist">
            {['Tous', 'A1', 'A2', 'B1', 'B2'].map(lvl => (
              <button
                key={lvl}
                className={`button ${levelFilter === lvl ? 'primary' : 'subtle'}`}
                onClick={() => setLevelFilter(lvl)}
              >
                {lvl === 'Tous' ? 'Tous les niveaux' : `Niveau ${lvl}`}
              </button>
            ))}
          </div>
        </div>

        <div className="fle-layout-container">
          <div className="fle-scene-list">
            {filteredScenes.map(scene => (
              <div
                key={scene.id}
                className={`fle-scene-item ${selectedScene.id === scene.id ? 'active' : ''}`}
                onClick={() => setSelectedScene(scene)}
              >
                <div className="fle-item-header">
                  <span className="fle-badge">{scene.level}</span>
                  <span className="fle-number">#{scene.number.toString().padStart(2, '0')}</span>
                </div>
                <h4>{scene.title}</h4>
                <p className="fle-cat">{scene.category}</p>
                <div className="fle-vocab-tags">
                  {scene.vocabulary.slice(0, 3).map((v, i) => (
                    <span key={i} className="fle-tag">{v}</span>
                  ))}
                </div>
              </div>
            ))}
            {filteredScenes.length === 0 && (
              <p className="empty-message">Aucune scène ne correspond à votre recherche.</p>
            )}
          </div>

          <div className="fle-preview-panel">
            <div className="fle-preview-header">
              <span className="fle-badge large">{selectedScene.level}</span>
              <div>
                <h3>{selectedScene.title}</h3>
                <span className="fle-cat">{selectedScene.category}</span>
              </div>
            </div>

            <p className="fle-desc">{selectedScene.description}</p>

            <div className="fle-section">
              <div className="section-title"><span>DIALOGUE DE RÉFÉRENCE</span></div>
              <pre className="fle-dialogue-box">{selectedScene.dialogue}</pre>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>VOCABULAIRE CLÉ</span></div>
              <div className="fle-vocab-full">
                {selectedScene.vocabulary.map((v, i) => (
                  <span key={i} className="fle-tag highlight">{v}</span>
                ))}
              </div>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>POINT DE LANGUE & GRAMMAIRE</span></div>
              <p className="fle-grammar">{selectedScene.grammarFocus}</p>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>QUIZ PÉDAGOGIQUE INTÉGRÉ</span></div>
              <p className="fle-quiz-preview"><b>Question :</b> {selectedScene.quizQuestion.question}</p>
            </div>

            <div className="fle-preview-actions">
              <button
                className="button primary large-btn"
                onClick={() => handleLoadScene(selectedScene)}
              >
                ✦ Charger cette scène 3D dans le monde
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
