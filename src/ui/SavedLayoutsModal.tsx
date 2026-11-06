// src/ui/SavedLayoutsModal.tsx
// Modal de gestion des dispositions spatiales (Mindel §15)
// Permet de figer/enregistrer la disposition courante de la scène 3D (positions,
// rotations, échelles, états ouverts/fermés, relations) et de la restaurer à tout moment.

import React, { useState, useEffect } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

interface SavedLayoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedLayoutsModal: React.FC<SavedLayoutsModalProps> = ({ isOpen, onClose }) => {
  const savedLayouts = useWorldStore(s => s.savedSpatialLayouts);
  const saveCurrentSpatialLayout = useWorldStore(s => s.saveCurrentSpatialLayout);
  const loadSpatialLayout = useWorldStore(s => s.loadSpatialLayout);
  const deleteSpatialLayout = useWorldStore(s => s.deleteSpatialLayout);
  const entities = useWorldStore(s => s.world.ir.entities);

  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentEntityCount = Object.keys(entities).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!layoutName.trim()) return;

    saveCurrentSpatialLayout(layoutName.trim(), layoutDescription.trim() || undefined);
    playAudioFx('fanfare');
    setFeedbackMsg(`✓ Disposition « ${layoutName.trim()} » enregistrée avec succès !`);
    setLayoutName('');
    setLayoutDescription('');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleRestore = (layoutId: string, name: string) => {
    loadSpatialLayout(layoutId);
    playAudioFx('chime');
    setFeedbackMsg(`✓ Disposition « ${name} » restaurée dans la scène 3D !`);
    setTimeout(() => {
      setFeedbackMsg(null);
      onClose();
    }, 1200);
  };

  const handleDelete = (layoutId: string, name: string) => {
    if (window.confirm(`Supprimer définitivement la disposition « ${name} » ?`)) {
      deleteSpatialLayout(layoutId);
      playAudioFx('switch_click');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-layouts-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          maxHeight: '85vh',
          background: 'rgba(30, 41, 59, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>📐</span>
            <div>
              <h2
                id="saved-layouts-modal-title"
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Dispositions spatiales 3D
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}
                >
                  Mindel §15
                </span>
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Figez l’agencement exact (positions, rotations, états ouvert/fermé, relations) pour le restaurer à tout moment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la modal"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '14px',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            ✕
          </button>
        </div>

        {/* FEEDBACK ALERT */}
        {feedbackMsg && (
          <div
            style={{
              padding: '10px 24px',
              background: 'rgba(16, 185, 129, 0.25)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#a7f3d0',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {feedbackMsg}
          </div>
        )}

        {/* BODY */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* FORMULAIRE : Enregistrer la disposition courante */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '18px 20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💾</span> Enregistrer la disposition courante
              </span>
              <span style={{ fontSize: '11.5px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                {currentEntityCount} objet(s) dans la scène
              </span>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Nom de la disposition (ex: Sac ouvert avec laptop inséré)"
                  value={layoutName}
                  onChange={e => setLayoutName(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!layoutName.trim() || currentEntityCount === 0}
                  style={{
                    background: layoutName.trim() && currentEntityCount > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.08)',
                    color: layoutName.trim() && currentEntityCount > 0 ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: layoutName.trim() && currentEntityCount > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>💾</span> Enregistrer cette disposition
                </button>
              </div>

              <input
                type="text"
                placeholder="Description facultative (ex: Configuration pour la réunion client ou test d'encombrement)"
                value={layoutDescription}
                onChange={e => setLayoutDescription(e.target.value)}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </form>
          </div>

          {/* LISTE DES DISPOSITIONS SAUVEGARDÉES */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📂</span> Dispositions enregistrées ({savedLayouts.length})
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Stockées localement dans votre navigateur
              </span>
            </div>

            {savedLayouts.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.15)'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                  Aucune disposition enregistrée pour le moment
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Positionnez vos objets, ouvrez les compartiments, et cliquez sur « Enregistrer cette disposition » ci-dessus pour la conserver.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedLayouts.map(layout => {
                  const dateStr = new Date(layout.createdAt).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const entityCount = layout.entitySnapshots.length;

                  return (
                    <div
                      key={layout.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                            {layout.name}
                          </span>
                          <span
                            style={{
                              fontSize: '10.5px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#6ee7b7',
                              fontWeight: 600
                            }}
                          >
                            {entityCount} objet(s)
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {dateStr}
                          </span>
                        </div>
                        {layout.description && (
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                            {layout.description}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {layout.entitySnapshots.slice(0, 5).map(s => (
                            <span key={s.entityId} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                              {s.entityId} {s.state ? `(${s.state})` : ''}
                            </span>
                          ))}
                          {layout.entitySnapshots.length > 5 && (
                            <span style={{ color: '#94a3b8' }}>+{layout.entitySnapshots.length - 5} autre(s)</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleRestore(layout.id, layout.name)}
                          style={{
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '7px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span>📥</span> Restaurer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(layout.id, layout.name)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '7px',
                            padding: '6px 9px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          title="Supprimer cette disposition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)',
            fontSize: '12px',
            color: '#94a3b8'
          }}
        >
          <span>
            💡 Action délibérée et nommée : distincte de l'historique automatique de l'agent.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '7px',
              padding: '6px 14px',
              color: '#f1f5f9',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
