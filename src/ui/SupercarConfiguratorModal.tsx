import React, { useState, useEffect } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { useDraggableModal } from './useDraggableModal';

interface PaintOption {
  id: string;
  name: string;
  color: string;
  secondary: string;
  badge: string;
  description: string;
}

const PAINT_OPTIONS: PaintOption[] = [
  {
    id: 'rosso_corsa',
    name: 'Rouge Victoria Nacré',
    color: '#dc2626',
    secondary: '#991b1b',
    badge: 'Signature',
    description: 'Teinte de lancement officielle avec vernis multicouche haute luminance.'
  },
  {
    id: 'electric_cyan',
    name: 'Cyan Victoria VR Électrique',
    color: '#0284c7',
    secondary: '#075985',
    badge: 'Métavers',
    description: 'Pigments électroluminescents inspirés du Web3 spatial et de la réalité virtuelle.'
  },
  {
    id: 'onyx_carbon',
    name: 'Noir Carbone Onyx',
    color: '#18181b',
    secondary: '#09090b',
    badge: 'Furtif',
    description: 'Fibre de carbone apparente tressée avec finition satinée mate et reflets titane.'
  },
  {
    id: 'imperial_gold',
    name: 'Or Impérial Showroom',
    color: '#ca8a04',
    secondary: '#854d0e',
    badge: 'Prestige',
    description: 'Dorure spatiale 24 carats conçue pour les collections privées et l’apparat VIP.'
  },
  {
    id: 'polar_white',
    name: 'Blanc Platine Glacé',
    color: '#f1f5f9',
    secondary: '#cbd5e1',
    badge: 'Glacial',
    description: 'Nacre arctique et reflets irisés réagissant aux éclairages dynamiques du showroom.'
  }
];

export const SupercarConfiguratorModal: React.FC = () => {
  const isOpen = useWorldStore(s => s.isSupercarConfiguratorOpen);
  const closeConfigurator = useWorldStore(s => s.closeSupercarConfigurator);
  const applyConfiguration = useWorldStore(s => s.applySupercarConfiguration);
  const flags = useWorldStore(s => s.world.flags || {});
  const isConfigured = Boolean(flags['supercar_configured']);
  const currentPaint = useWorldStore(s => s.supercarCustomPaint) || '#dc2626';
  const storedCalipers = useWorldStore(s => s.supercarBrakeCalipers) || 'gold';
  const storedCarbonPack = useWorldStore(s => s.supercarCarbonPack);

  const [selectedPaint, setSelectedPaint] = useState<PaintOption>(
    () => PAINT_OPTIONS.find(p => p.color === currentPaint) || PAINT_OPTIONS[0]
  );
  const [brakeCalipers, setBrakeCalipers] = useState<'gold' | 'red' | 'cyan'>(storedCalipers);
  const [carbonPackActive, setCarbonPackActive] = useState(storedCarbonPack ?? true);

  const { offset, dragProps } = useDraggableModal();

  useEffect(() => {
    if (currentPaint) {
      const match = PAINT_OPTIONS.find(p => p.color === currentPaint);
      if (match) setSelectedPaint(match);
    }
  }, [currentPaint]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeConfigurator();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeConfigurator]);

  if (!isOpen) return null;

  const handleApply = () => {
    playAudioFx('chime');
    applyConfiguration(selectedPaint.color, selectedPaint.name, brakeCalipers, carbonPackActive);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(5, 10, 20, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeConfigurator();
      }}
    >
      <div
        {...dragProps}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          width: '560px',
          maxWidth: '92vw',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '18px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.25)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🏎️</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.04em', color: '#38bdf8' }}>
                CONFIGURATEUR SUPERCAR VICTORIA VR
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Victoria VR GT V12 Hybride · 850 ch · Personnalisation Spatiale
              </div>
            </div>
          </div>
          <button
            type="button"
            data-no-drag
            onClick={closeConfigurator}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.15s ease'
            }}
            title="Fermer le configurateur (Échap)"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }} data-no-drag>
          {/* Status banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              background: isConfigured ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)',
              border: `1px solid ${isConfigured ? 'rgba(16, 185, 129, 0.35)' : 'rgba(56, 189, 248, 0.35)'}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span>{isConfigured ? '✅' : '⚙️'}</span>
              <span>
                {isConfigured 
                  ? 'Configuration officielle déjà homologuée sur le véhicule' 
                  : 'Étape 1 : Choisissez votre livrée et validez la configuration spatiale.'}
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '6px',
                background: isConfigured ? '#10b981' : '#0284c7',
                color: '#ffffff'
              }}
            >
              {isConfigured ? 'Homologuée' : 'À Valider'}
            </span>
          </div>

          {/* Color Selection Palette */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
              <span>1. TEINTE DE CARROSSERIE CANDY COAT</span>
              <span style={{ color: selectedPaint.color, fontWeight: 800 }}>{selectedPaint.name}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PAINT_OPTIONS.map((paint) => {
                const isSelected = selectedPaint.id === paint.id;
                return (
                  <button
                    key={paint.id}
                    type="button"
                    onClick={() => {
                      setSelectedPaint(paint);
                      playAudioFx('switch_click');
                    }}
                    style={{
                      background: isSelected ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.5)',
                      border: `1.5px solid ${isSelected ? paint.color : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 16px ${paint.color}44` : 'none'
                    }}
                  >
                    {/* Color Swatch Circle */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${paint.color}, ${paint.secondary})`,
                        border: isSelected ? '2.5px solid #ffffff' : '1.5px solid rgba(255, 255, 255, 0.3)',
                        flexShrink: 0,
                        boxShadow: `0 2px 8px ${paint.color}66`
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                          {paint.name}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: `${paint.color}22`,
                            color: paint.color,
                            border: `1px solid ${paint.color}55`
                          }}
                        >
                          {paint.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {paint.description}
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ color: paint.color, fontSize: '18px', fontWeight: 900 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options: Brake Calipers & Carbon Pack */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Calipers */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                2. ÉTRIERS DE FREINS CARBOCÉRAMIQUE
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'gold' as const, label: 'Dorés 24K', color: '#facc15' },
                  { id: 'red' as const, label: 'Rouge Racing', color: '#ef4444' },
                  { id: 'cyan' as const, label: 'Cyan VR', color: '#38bdf8' }
                ].map((cal) => (
                  <button
                    key={cal.id}
                    type="button"
                    onClick={() => {
                      setBrakeCalipers(cal.id);
                      playAudioFx('tink');
                    }}
                    style={{
                      flex: 1,
                      padding: '5px 4px',
                      borderRadius: '6px',
                      border: `1px solid ${brakeCalipers === cal.id ? cal.color : 'rgba(255, 255, 255, 0.1)'}`,
                      background: brakeCalipers === cal.id ? `${cal.color}22` : 'transparent',
                      color: brakeCalipers === cal.id ? '#ffffff' : '#94a3b8',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {cal.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aero Pack */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => {
                setCarbonPackActive(!carbonPackActive);
                playAudioFx('switch_click');
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                  3. PACK CARBONE AÉRO
                </div>
                <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '2px' }}>
                  Aileron actif & splitters
                </div>
              </div>
              <div
                style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  background: carbonPackActive ? '#10b981' : '#475569',
                  position: 'relative',
                  transition: 'background 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: '2px',
                    left: carbonPackActive ? '18px' : '2px',
                    transition: 'left 0.2s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Validation CTA Button */}
          <button
            type="button"
            onClick={handleApply}
            style={{
              marginTop: '4px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f766e 100%)',
              border: '1px solid #38bdf8',
              borderRadius: '12px',
              padding: '14px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.03em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4), 0 0 16px rgba(56, 189, 248, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>⚡</span>
            <span>APPLIQUER LA CONFIGURATION & VALIDER L’ÉTAPE 1</span>
          </button>
        </div>
      </div>
    </div>
  );
};
