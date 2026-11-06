import { useState, useEffect } from 'react';
import { seminarRooms, createSeminarPatch, type SeminarRoom } from '../library/seminarRooms';
import { useWorldStore } from '../engine/store';

interface SeminarRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDeploy?: (title: string, onExecute: (clearFirst: boolean) => void) => void;
}

export function SeminarRoomsModal({ isOpen, onClose, onRequestDeploy }: SeminarRoomsModalProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('Toutes');
  const [search, setSearch] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<SeminarRoom>(seminarRooms[0]);

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

  const filteredRooms = seminarRooms.filter(r => {
    const matchesCat = categoryFilter === 'Toutes' || r.category === categoryFilter;
    const matchesSearch = !search.trim() ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.equipment.some(e => e.name.toLowerCase().includes(search.toLowerCase())) ||
      r.keyFeatures.some(f => f.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleLoadRoom = (room: SeminarRoom) => {
    const execute = (clearFirst: boolean) => {
      const store = useWorldStore.getState();
      if (clearFirst) {
        store.resetWorld();
      }
      const patch = createSeminarPatch(room, store.world.ir.entities);
      store.applyPatch(
        patch,
        `Espace Séminaire ${room.number} : ${room.title}`,
        { intent: 'load_seminar_room', actions: [{ action: 'create_seminar_environment', target: room.id }] }
      );
      // Focus the caption board
      const captionEntity = patch.entitiesCreated?.find(e => e.id.includes('captions'));
      if (captionEntity) {
        store.setSpatialContext(captionEntity.id, null);
      }
      onClose();
    };

    if (onRequestDeploy) {
      onRequestDeploy(room.title, execute);
    } else {
      execute(false);
    }
  };

  const categories = [
    'Toutes',
    'Direction & Conseil',
    'Conférence & Assemblée',
    'Créativité & Design Sprint',
    'Négociation & Pitch',
    'Formation & Ateliers',
    'Espaces Collaboratifs'
  ];

  return (
    <div className="library-backdrop" role="dialog" aria-modal="true" aria-labelledby="seminar-title">
      <div className="library-dialog fle-modal-dialog">
        <header>
          <div>
            <div className="eyebrow">ESPACES PROFESSIONNELS · 8 CONFIGURATIONS DE SÉMINAIRE ET RÉUNION</div>
            <h2 id="seminar-title">Concevoir des salles de réunion et de séminaire</h2>
            <p>Aménagements spatiaux · Équipements audiovisuels · Ergonomie collaborative · Conseils animateur · Modèles 3D</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        <div className="library-filters">
          <input
            type="text"
            placeholder="Rechercher un espace, un équipement (boardroom, visioconférence, pitch, mange-debout, U...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Recherche"
          />
          <div className="fle-level-tabs" role="tablist">
            {categories.map(cat => (
              <button
                key={cat}
                className={`button ${categoryFilter === cat ? 'primary' : 'subtle'}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="fle-layout-container">
          <div className="fle-scene-list">
            {filteredRooms.map(room => (
              <div
                key={room.id}
                className={`fle-scene-item ${selectedRoom.id === room.id ? 'active' : ''}`}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="fle-item-header">
                  <span className="fle-badge">{room.capacity} pers.</span>
                  <span className="fle-number">#{room.number.toString().padStart(2, '0')}</span>
                </div>
                <h4>{room.title}</h4>
                <p className="fle-cat">{room.category}</p>
                <div className="fle-vocab-tags">
                  {room.equipment.slice(0, 3).map((eq, i) => (
                    <span key={i} className="fle-tag">{eq.name}</span>
                  ))}
                  {room.equipment.length > 3 && (
                    <span className="fle-tag">+{room.equipment.length - 3} autres</span>
                  )}
                </div>
              </div>
            ))}
            {filteredRooms.length === 0 && (
              <p className="empty-message">Aucun espace ne correspond à votre recherche.</p>
            )}
          </div>

          <div className="fle-preview-panel">
            <div className="fle-preview-header">
              <span className="fle-badge large">{selectedRoom.capacity} PARTICIPANTS</span>
              <div>
                <h3>{selectedRoom.title}</h3>
                <span className="fle-cat">{selectedRoom.category}</span>
              </div>
            </div>

            <p className="fle-desc">{selectedRoom.description}</p>

            <div className="fle-section">
              <div className="section-title"><span>Équipements et mobilier 3D inclus</span></div>
              <div className="fle-vocab-full">
                {selectedRoom.equipment.map((eq, i) => (
                  <span key={i} className="fle-tag highlight">
                    💼 {eq.name} ({eq.quantity})
                  </span>
                ))}
              </div>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>Caractéristiques spatiales et ergonomie</span></div>
              <div className="fle-vocab-tags" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedRoom.keyFeatures.map((feat, i) => (
                  <div key={i} style={{ fontSize: '11px', color: '#c7e6b1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✓</span> <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>ORGANISATION ARCHITECTURALE DU MONDE</span></div>
              <p className="fle-desc" style={{ background: '#111a14', padding: '12px 14px', borderRadius: '8px', border: '1px solid #62775644' }}>
                {selectedRoom.layoutDescription}
              </p>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>CONSEIL POUR LE FACILITATEUR / ANIMATEUR</span></div>
              <p className="fle-grammar">💡 {selectedRoom.facilitatorTips}</p>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>QUIZ D’ERGONOMIE ET DE FACILITATION</span></div>
              <p className="fle-quiz-preview"><b>Question :</b> {selectedRoom.quizQuestion.question}</p>
            </div>

            <div className="fle-preview-actions">
              <button
                className="button primary large-btn"
                onClick={() => handleLoadRoom(selectedRoom)}
              >
                ✦ Aménager cette salle de séminaire 3D dans le monde
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
