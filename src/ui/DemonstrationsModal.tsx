import { useState, useEffect } from 'react';
import { demonstrationScenarios, createDemonstrationPatch, type DemonstrationScenario } from '../library/demonstrations';
import { certifiedExperiencesRegistry } from '../library/certifiedExperiences';
import { parseInstruction } from '../authoring/parser';
import { PEDAGOGICAL_PRESETS } from '../research/pedagogicalCompiler';
import { useWorldStore } from '../engine/store';

interface DemonstrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDeploy?: (title: string, onExecute: (clearFirst: boolean) => void) => void;
}

const LOW_RICHNESS_DEMO_IDS = new Set([
  'demo-postal-deposit',
  'demo-music-jam',
  'demo-seminar-checkin',
  'demo-cozy-fireplace',
  'demo-victoria-vr-mint',
  'demo-pitch-projection',
  'demo-design-sprint',
  'demo-espresso-barista',
  'demo-ratatouille-simmer',
  'demo-chemistry-boil'
]);

export function DemonstrationsModal({ isOpen, onClose, onRequestDeploy }: DemonstrationsModalProps) {
  const [activeTab, setActiveTab] = useState<'demos' | 'pedagogy'>('demos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Toutes');
  const [onlyValidated, setOnlyValidated] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedLabKey, setSelectedLabKey] = useState<string>('electricity_ohm');

  const certifiedAsDemos: DemonstrationScenario[] = certifiedExperiencesRegistry
    .filter(c => !demonstrationScenarios.some(d => d.prompt === c.actionPresetCommand))
    .map((c, idx) => ({
      id: c.id,
      number: demonstrationScenarios.length + idx + 1,
      title: c.title,
      category: (c.category.includes('Luxe') ? 'Mode & Luxe Showroom' : c.category.includes('Cuisine') ? 'Cuisine & Gastronomie' : c.category.includes('Auto') ? 'Physique & Réactions' : 'Web3 & Innovation') as any,
      prompt: c.prompt,
      description: c.description,
      interactionSummary: c.interactionHighlights.join(' · '),
      triggerButtonLabel: '⚡ Lancer l’expérience',
      primaryEntityId: 'primary_entity',
      equipment: c.realisticObjects.map(obj => ({ name: obj, assetId: 'cube' })),
      assetPlacements: [],
      rules: []
    }));

  const allAvailableDemos = [
    ...demonstrationScenarios.filter(d => !LOW_RICHNESS_DEMO_IDS.has(d.id)),
    ...certifiedAsDemos
  ];
  const [selectedDemo, setSelectedDemo] = useState<DemonstrationScenario>(allAvailableDemos[0]);

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

  const pedagogicalList = Object.values(PEDAGOGICAL_PRESETS);
  const selectedLab = PEDAGOGICAL_PRESETS[selectedLabKey] || pedagogicalList[0];

  const filteredDemos = allAvailableDemos.filter(d => {
    const matchesCat = categoryFilter === 'Toutes' || d.category === categoryFilter;
    const matchesSearch = !search.trim() ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.prompt.toLowerCase().includes(search.toLowerCase()) ||
      d.equipment.some(e => e.name.toLowerCase().includes(search.toLowerCase()));
    const isVal = certifiedExperiencesRegistry.some(c => c.actionPresetCommand === d.prompt || c.id.includes(d.id.replace('demo-', '')));
    const matchesValidated = !onlyValidated || isVal;
    return matchesCat && matchesSearch && matchesValidated;
  });

  const handleDeploy = (demo: DemonstrationScenario, autoTrigger: boolean = false) => {
    const execute = (clearFirst: boolean) => {
      const store = useWorldStore.getState();
      if (clearFirst) {
        store.resetWorld();
      }
      if (demo.assetPlacements && demo.assetPlacements.length > 0) {
        const patch = createDemonstrationPatch(demo, store.world.ir.entities);
        store.applyPatch(
          patch,
          `Démonstration : ${demo.title}`,
          { intent: 'load_demonstration', actions: [{ action: 'create_demo_scenario', target: demo.id }] }
        );
        if (demo.atmosphere) {
          store.setAtmosphere(demo.atmosphere);
        }
        store.setSpatialContext(demo.primaryEntityId, null);

        if (autoTrigger) {
          // Small timeout to allow R3F and store to register before triggering interaction
          setTimeout(() => {
            store.dispatch({
              type: 'INTERACT',
              sourceId: demo.primaryEntityId
            });
          }, 350);
        }
      } else {
        const parseResult = parseInstruction(demo.prompt, store.spatialContext, store.world.ir.entities);
        if (parseResult.patch) {
          store.applyPatch(parseResult.patch, `Démonstration : ${demo.title}`, parseResult.plan);
        }
      }
      store.setCurrentSceneTitle(demo.title);
      onClose();
    };

    if (onRequestDeploy) {
      onRequestDeploy(demo.title, execute);
    } else {
      execute(false);
    }
  };

  const handleDeployLab = (presetId: string) => {
    const executeLab = (clearFirst: boolean) => {
      const store = useWorldStore.getState();
      if (clearFirst) {
        store.resetWorld();
      }
      store.compileAndLoadPedagogicalSimulation(presetId);
      store.setCurrentSceneTitle(selectedLab.title);
      onClose();
    };

    if (onRequestDeploy) {
      onRequestDeploy(selectedLab.title, executeLab);
    } else {
      executeLab(false);
    }
  };

  const categories = [
    { id: 'Toutes', label: 'Toutes' },
    { id: 'Mode & Luxe Showroom', label: 'Mode et luxe' },
    { id: 'Cuisine & Gastronomie', label: 'Cuisine et gastronomie' },
    { id: 'Réunion & Conférence', label: 'Réunion et conférence' },
    { id: 'Ville Parisienne & FLE', label: 'Ville parisienne et FLE' },
    { id: 'Physique & Réactions', label: 'Physique et réactions' },
    { id: 'Web3 & Innovation', label: 'Web3 et innovation' }
  ];

  return (
    <div className="library-backdrop" role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <div className="library-dialog fle-modal-dialog">
        <header>
          <div>
            <div className="eyebrow">
              {activeTab === 'demos' 
                ? "Chorégraphies d'interactions et causalité · 10 démonstrations" 
                : "Recherche cognitive Bloom-3D · Laboratoires physiques actifs"}
            </div>
            <h2 id="demo-title">
              {activeTab === 'demos' ? "Catalogue de démonstrations interactives" : "Laboratoires pédagogiques et pièges cognitifs"}
            </h2>
            <p>
              {activeTab === 'demos'
                ? "Prompts naturels · Objets communicants · Réactions en chaîne · Sons et particules réactifs"
                : "Action-Graph Compiler · Erreurs fécondes délibérées · Appareillage expérimental modélisé en 3D"}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        <div style={{ display: 'flex', gap: '10px', padding: '4px 24px 14px 24px', borderBottom: '1px solid #ffffff15' }}>
          <button
            className={`button ${activeTab === 'demos' ? 'primary' : 'subtle'}`}
            onClick={() => setActiveTab('demos')}
            style={{ flex: 1, padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>🌟</span>
            <span>Démonstrations et expériences ({allAvailableDemos.length})</span>
          </button>
          <button
            className={`button ${activeTab === 'pedagogy' ? 'primary' : 'subtle'}`}
            onClick={() => setActiveTab('pedagogy')}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: activeTab === 'pedagogy' ? 'linear-gradient(135deg, #1565c0, #0d47a1)' : undefined,
              borderColor: activeTab === 'pedagogy' ? '#64b5f6' : undefined,
            }}
          >
            <span>🔬</span>
            <span>Laboratoires actifs Bloom-3D (3)</span>
          </button>
        </div>

        {activeTab === 'demos' ? (
          <>
            <div className="library-filters">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Rechercher une expérience (Louis Vuitton, café, pitch, ratatouille, boîte, fiole...)"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Recherche"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className={`button ${onlyValidated ? 'primary' : 'subtle'}`}
                  onClick={() => setOnlyValidated(!onlyValidated)}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '0.82rem',
                    padding: '8px 12px',
                    borderColor: onlyValidated ? '#81c784' : undefined,
                    background: onlyValidated ? 'rgba(76, 175, 80, 0.2)' : undefined,
                    color: onlyValidated ? '#c8e6c9' : undefined
                  }}
                >
                  {onlyValidated ? '🛡️ Filtre : validées uniquement' : '🛡️ Filtre : toutes'}
                </button>
              </div>
              <div className="fle-level-tabs" role="tablist">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`button ${categoryFilter === cat.id ? 'primary' : 'subtle'}`}
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fle-layout-container">
              <div className="fle-scene-list">
                {filteredDemos.map(demo => (
                  <div
                    key={demo.id}
                    className={`fle-scene-item ${selectedDemo.id === demo.id ? 'active' : ''}`}
                    onClick={() => setSelectedDemo(demo)}
                  >
                    <div className="fle-item-header">
                      <span className="fle-badge">{demo.category.split(' & ')[0]}</span>
                      <span className="fle-number">#{demo.number.toString().padStart(2, '0')}</span>
                    </div>
                    <h4>{demo.title}</h4>
                    <p className="fle-cat">« {demo.prompt.slice(0, 48)}… »</p>
                    <div className="fle-vocab-tags">
                      {demo.equipment.map((eq, i) => (
                        <span key={i} className="fle-tag">{eq.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredDemos.length === 0 && (
                  <p className="empty-message">Aucune démonstration ne correspond à votre recherche.</p>
                )}
              </div>

              <div className="fle-preview-panel">
                <div className="fle-preview-header">
                  <span className="fle-badge large">Démo #{selectedDemo.number.toString().padStart(2, '0')}</span>
                  <div>
                    <h3>{selectedDemo.title}</h3>
                    <span className="fle-cat">{selectedDemo.category}</span>
                  </div>
                </div>

                <div className="fle-section">
                  <div className="section-title"><span>Prompt en langage naturel (à écrire ou dicter)</span></div>
                  <pre className="fle-dialogue-box" style={{ color: '#c7e6b1', fontWeight: 600 }}>
                    « {selectedDemo.prompt} »
                  </pre>
                </div>

                <p className="fle-desc">{selectedDemo.description}</p>

                <div className="fle-section">
                  <div className="section-title"><span>Chorégraphie d’interaction et réactions en chaîne</span></div>
                  <p className="fle-desc" style={{ background: '#111a14', padding: '12px 14px', borderRadius: '8px', border: '1px solid #62775644' }}>
                    💡 {selectedDemo.interactionSummary}
                  </p>
                </div>

                <div className="fle-section">
                  <div className="section-title"><span>Objets 3D mobilisés sur la scène</span></div>
                  <div className="fle-vocab-full">
                    {selectedDemo.equipment.map((eq, i) => (
                      <span key={i} className="fle-tag highlight">
                        ✦ {eq.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="fle-preview-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="button primary large-btn"
                    onClick={() => handleDeploy(selectedDemo, true)}
                    style={{ background: 'linear-gradient(135deg, #2e7d32, #1b5e20)', borderColor: '#81c784' }}
                  >
                    ⚡ Déployer et déclencher l’interaction en direct ({selectedDemo.triggerButtonLabel})
                  </button>
                  <button
                    className="button subtle large-btn"
                    onClick={() => handleDeploy(selectedDemo, false)}
                  >
                    ✦ Déployer la scène sans déclenchement immédiat
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="fle-layout-container" style={{ marginTop: '16px' }}>
            <div className="fle-scene-list">
              {pedagogicalList.map(lab => (
                <div
                  key={lab.id}
                  className={`fle-scene-item ${selectedLab.id === lab.id ? 'active' : ''}`}
                  onClick={() => setSelectedLabKey(lab.id)}
                  style={{ borderLeft: selectedLab.id === lab.id ? '3px solid #64b5f6' : undefined }}
                >
                  <div className="fle-item-header">
                    <span className="fle-badge" style={{ background: '#1976d2', color: '#fff' }}>
                      {lab.domain.replace('_', ' ')}
                    </span>
                    <span className="fle-number" style={{ color: '#90caf9', fontWeight: 'bold' }}>
                      Bloom: {lab.bloomLevel}
                    </span>
                  </div>
                  <h4>{lab.title}</h4>
                  <p className="fle-cat" style={{ color: '#ffb74d' }}>
                    ⚠️ {lab.misconceptionTrap.slice(0, 70)}…
                  </p>
                  <div className="fle-vocab-tags">
                    {lab.apparatusSpecs.map((app, i) => (
                      <span key={i} className="fle-tag">
                        ⚙️ {app.name} ({app.initialReading} {app.metricUnit})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="fle-preview-panel">
              <div className="fle-preview-header">
                <span className="fle-badge large" style={{ background: '#0d47a1', color: '#90caf9', border: '1px solid #1976d2' }}>
                  Labo Bloom-3D
                </span>
                <div>
                  <h3>{selectedLab.title}</h3>
                  <span className="fle-cat" style={{ color: '#64b5f6' }}>
                    Domaine : {selectedLab.domain} · Palier cognitif : {selectedLab.bloomLevel}
                  </span>
                </div>
              </div>

              <div className="fle-section">
                <div className="section-title"><span>Piège cognitif et erreur féconde délibérée</span></div>
                <div style={{ background: '#2c1505', border: '1px solid #e65100', padding: '12px 14px', borderRadius: '8px', color: '#ffe0b2', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <strong>⚠️ Dispositif de contrainte épistémique :</strong> {selectedLab.misconceptionTrap}
                </div>
              </div>

              <div className="fle-section">
                <div className="section-title"><span>Objectifs d'apprentissage visés</span></div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#cfd8dc', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {selectedLab.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div className="fle-section">
                <div className="section-title"><span>Appareillage physique sur la paillasse (3D)</span></div>
                <div className="fle-vocab-full">
                  {selectedLab.apparatusSpecs.map((app, i) => (
                    <span key={i} className="fle-tag highlight" style={{ background: '#102a45', borderColor: '#2196f3' }}>
                      🔬 {app.name} — <strong style={{ color: '#90caf9' }}>{app.initialReading} {app.metricUnit}</strong>
                    </span>
                  ))}
                </div>
              </div>

              <div className="fle-preview-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <button
                  className="button primary large-btn"
                  onClick={() => handleDeployLab(selectedLab.id)}
                  style={{ background: 'linear-gradient(135deg, #1565c0, #0d47a1)', borderColor: '#64b5f6', boxShadow: '0 4px 14px rgba(21, 101, 192, 0.4)' }}
                >
                  ⚡ Compiler et charger le laboratoire actif (Bloom-3D)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
