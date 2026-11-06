import React, { useEffect, useState } from 'react';
import { useWorldStore } from '../engine/store';
import { cookingRecipes, winePairings } from '../library/cookingRecipes';
import { playAudioFx } from '../engine/evaluator';

export const DegustationModal: React.FC = () => {
  const activeDegustationRecipeId = useWorldStore(s => s.activeDegustationRecipeId);
  const closeDegustationModal = useWorldStore(s => s.closeDegustationModal);
  const getDishEvaluation = useWorldStore(s => s.getDishEvaluation);
  const restartCurrentRecipe = useWorldStore(s => s.restartCurrentRecipe);

  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const evaluation = getDishEvaluation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDegustationModal();
    };
    if (activeDegustationRecipeId) {
      document.addEventListener('keydown', handleKeyDown);
      useWorldStore.getState().unlockAchievement('sommelier_accord');
      if (evaluation.stars === 5) {
        setShowConfetti(true);
      }
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeDegustationRecipeId, closeDegustationModal, evaluation.stars]);

  if (!activeDegustationRecipeId) return null;

  const recipe = cookingRecipes.find(r => 
    r.id === activeDegustationRecipeId || 
    activeDegustationRecipeId.includes(r.id) ||
    r.id.includes(activeDegustationRecipeId)
  ) || cookingRecipes[0];

  const pairing = winePairings[recipe.id] || winePairings['recipe-ratatouille'];

  const handleCopyReview = () => {
    const text = `⚜️ CARTE DE DÉGUSTATION GASTRONOMIQUE ⚜️\n` +
      `Plat : ${recipe.title} (${recipe.category})\n` +
      `Note : ${'★'.repeat(evaluation.stars)}${'☆'.repeat(5 - evaluation.stars)} (${evaluation.totalScore}/100 PTS - ${evaluation.title})\n\n` +
      `• Cuisson : ${evaluation.cookingScore}/40 - ${evaluation.cookingFeedback}\n` +
      `• Assaisonnement : ${evaluation.seasoningScore}/35 - ${evaluation.seasoningFeedback}\n` +
      `• Dressage : ${evaluation.platingScore}/25 - ${evaluation.platingFeedback}\n\n` +
      `Accord Sommelier : ${pairing.wine} (${pairing.region}, service ${pairing.temp})\n` +
      `Secret du Chef : « ${recipe.chefTip} »\n\n` +
      `Atelier culinaire interactif 3D WorldPilot.`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        playAudioFx('tink');
        setTimeout(() => setCopied(false), 2800);
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, '📋 Évaluation du Chef copiée dans le presse-papiers !']
        }));
      });
    }
  };

  const handleRestart = () => {
    restartCurrentRecipe();
    playAudioFx('tink');
    closeDegustationModal();
  };

  return (
    <div className="degustation-modal-overlay" onClick={closeDegustationModal}>
      {showConfetti && (
        <div className="degustation-confetti-container" aria-hidden="true">
          {Array.from({ length: 42 }).map((_, idx) => (
            <span
              key={idx}
              className="degustation-confetti-piece"
              style={{
                left: `${(idx * 2.4 + (idx % 7) * 3) % 100}%`,
                animationDelay: `${(idx % 12) * 0.12}s`,
                backgroundColor: ['#fbbf24', '#f59e0b', '#10b981', '#f43f5e', '#38bdf8', '#c084fc'][idx % 6]
              }}
            />
          ))}
        </div>
      )}

      <div 
        className="degustation-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Fiche de Dégustation Gastronomique"
      >
        <button 
          className="degustation-modal-close" 
          onClick={closeDegustationModal}
          title="Fermer la carte de dégustation [Échap]"
        >
          ✕
        </button>

        <div className="degustation-modal-header">
          <div className="degustation-badge-top">
            <span>⚜️ {evaluation.title.toUpperCase()}</span>
            <div className="degustation-stars" title={`${evaluation.stars} étoiles (${evaluation.totalScore}/100)`}>
              {[1, 2, 3, 4, 5].map(starIndex => (
                <span
                  key={starIndex}
                  style={{
                    color: starIndex <= evaluation.stars ? '#fbbf24' : 'rgba(255,255,255,0.18)',
                    marginRight: '2px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <h2 className="degustation-dish-title">{recipe.title}</h2>
          <div className="degustation-meta-row">
            <span>🏷️ {recipe.category}</span>
            <span>👨‍🍳 Niveau : {recipe.difficulty}</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>🏆 Score : {evaluation.totalScore} / 100 PTS</span>
          </div>
        </div>

        {/* Sub-Score Breakdown Meters */}
        <div className="degustation-score-meters">
          <div className="score-meter-card">
            <div className="score-meter-header">
              <span>🍳 Cuisson & Doneness</span>
              <b>{evaluation.cookingScore} / 40</b>
            </div>
            <div className="score-meter-bar">
              <div 
                className="score-meter-fill cooking" 
                style={{ width: `${(evaluation.cookingScore / 40) * 100}%` }} 
              />
            </div>
          </div>

          <div className="score-meter-card">
            <div className="score-meter-header">
              <span>🧂 Équilibre Aromatique</span>
              <b>{evaluation.seasoningScore} / 35</b>
            </div>
            <div className="score-meter-bar">
              <div 
                className="score-meter-fill seasoning" 
                style={{ width: `${(evaluation.seasoningScore / 35) * 100}%` }} 
              />
            </div>
          </div>

          <div className="score-meter-card">
            <div className="score-meter-header">
              <span>🍽️ Dressage & Présentation</span>
              <b>{evaluation.platingScore} / 25</b>
            </div>
            <div className="score-meter-bar">
              <div 
                className="score-meter-fill plating" 
                style={{ width: `${(evaluation.platingScore / 25) * 100}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="degustation-content-grid">
          {/* Sensory Review Section */}
          <div className="degustation-section sensory-section">
            <div className="degustation-section-title">
              <span>👁️👃👅 ANALYSE SENSORIELLE & CUISSON</span>
            </div>
            <div className="degustation-sensory-items">
              <div className="sensory-item">
                <span className="sensory-label">♨️ Cuisson & Texture ({evaluation.cookingScore}/40) :</span>
                <span className="sensory-desc">{evaluation.cookingFeedback}</span>
              </div>
              <div className="sensory-item">
                <span className="sensory-label">🌿 Bouquet & Assaisonnement ({evaluation.seasoningScore}/35) :</span>
                <span className="sensory-desc">{evaluation.seasoningFeedback}</span>
              </div>
              <div className="sensory-item">
                <span className="sensory-label">🎨 Aspect & Dressage ({evaluation.platingScore}/25) :</span>
                <span className="sensory-desc">{evaluation.platingFeedback}</span>
              </div>
            </div>
          </div>

          {/* Recommendations for improvement */}
          {evaluation.recommendations.length > 0 && (
            <div className="degustation-section recommendations-section">
              <div className="degustation-section-title">
                <span>🎯 CONSEILS DU CHEF POUR DÉCROCHER 5 ÉTOILES</span>
              </div>
              <ul className="degustation-recommendations-list">
                {evaluation.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sommelier & Wine Pairing Section */}
          <div className="degustation-section wine-section">
            <div className="degustation-section-title">
              <span>🍷 ACCORD DU SOMMELIER (METS & VINS)</span>
            </div>
            <div className="wine-pairing-card">
              <div className="wine-pairing-name">{pairing.wine}</div>
              <div className="wine-pairing-region">Terroir : <b>{pairing.region}</b> • Service : <b>{pairing.temp}</b></div>
              <div className="wine-pairing-notes">{pairing.notes}</div>
            </div>
          </div>

          {/* Chef Tip & Commendation */}
          <div className="degustation-section chef-tip-section">
            <div className="degustation-section-title">
              <span>💡 SECRET D'ATELIER DU CHEF</span>
            </div>
            <p className="chef-tip-text">« {recipe.chefTip} »</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="degustation-modal-actions">
          <button 
            className="degustation-btn celebrate"
            onClick={() => {
              playAudioFx('fanfare');
              playAudioFx('sparkle');
              setShowConfetti(true);
              const isSoupOrMousse = recipe.category?.toLowerCase().includes('soupe') || recipe.title?.toLowerCase().includes('mousse');
              const utensil = isSoupOrMousse ? 'spoon' : 'fork';
              useWorldStore.getState().triggerTasting(utensil);
              useWorldStore.getState().setCameraPreset('plate');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_degustation_celebrate', {
                  detail: { stars: evaluation.stars, totalScore: evaluation.totalScore, utensil }
                }));
              }
              setTimeout(() => closeDegustationModal(), 1600);
            }}
            title="Célébrer la dégustation et fermer"
          >
            <span>✨ Savourer & Célébrer</span>
          </button>

          <button 
            className="degustation-btn copy-review"
            onClick={handleCopyReview}
            title="Copier la fiche d'évaluation et le diplôme dans le presse-papiers"
          >
            <span>{copied ? '✅ Évaluation copiée !' : '📜 Copier l\'Évaluation'}</span>
          </button>

          <button 
            className="degustation-btn restart-recipe"
            onClick={handleRestart}
            title="Réinitialiser la cuisson, les assaisonnements et le dressage pour refaire la recette"
          >
            <span>🔄 Recommencer</span>
          </button>

          <button 
            className="degustation-btn choose-recipe"
            onClick={() => {
              closeDegustationModal();
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_open_cooking_modal'));
              }
            }}
            title="Parcourir le livre des 12 recettes gastronomiques"
          >
            <span>📖 Autre recette</span>
          </button>
        </div>
      </div>
    </div>
  );
};

