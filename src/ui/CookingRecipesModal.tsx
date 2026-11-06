import { useState, useEffect } from 'react';
import { cookingRecipes, createRecipePatch, winePairings, type CookingRecipe } from '../library/cookingRecipes';
import { useWorldStore } from '../engine/store';

interface CookingRecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDeploy?: (title: string, onExecute: (clearFirst: boolean) => void) => void;
}

export function CookingRecipesModal({ isOpen, onClose, onRequestDeploy }: CookingRecipesModalProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('Toutes');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('Tous');
  const [search, setSearch] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<CookingRecipe>(cookingRecipes[0]);

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

  const filteredRecipes = cookingRecipes.filter(r => {
    const matchesCat = categoryFilter === 'Toutes' || r.category === categoryFilter;
    const matchesDiff = difficultyFilter === 'Tous' || r.difficulty === difficultyFilter;
    const matchesSearch = !search.trim() ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(search.toLowerCase())) ||
      r.culinaryTechniques.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesDiff && matchesSearch;
  });

  const handleLoadRecipe = (recipe: CookingRecipe) => {
    const execute = (clearFirst: boolean) => {
      const store = useWorldStore.getState();
      if (clearFirst) {
        store.resetWorld();
      }
      // Clean reset of previous cooking progress, doneness, seasoning, plating & chopping
      store.restartCurrentRecipe();
      store.setAtmosphere('cozy-bistrot');
      const patch = createRecipePatch(recipe, store.world.ir.entities);
      store.applyPatch(
        patch,
        `Recette de cuisine ${recipe.number} : ${recipe.title}`,
        { intent: 'load_cooking_recipe', actions: [{ action: 'create_cooking_workshop', target: recipe.id }] }
      );
      store.setCameraPreset('table');
      // Focus the recipe instructions board
      const boardEntity = patch.entitiesCreated?.find(e => e.id.includes('board'));
      if (boardEntity) {
        store.setSpatialContext(boardEntity.id, null);
      }
      onClose();
    };

    if (onRequestDeploy) {
      onRequestDeploy(recipe.title, execute);
    } else {
      execute(false);
    }
  };

  const categories = ['Toutes', 'Plats mijotés & tradition', 'Légumes & entrées', 'Pâtes & féculents', 'Desserts & pâtisserie'];
  const difficulties = ['Tous', 'Facile', 'Intermédiaire', 'Chef'];

  return (
    <div className="library-backdrop" role="dialog" aria-modal="true" aria-labelledby="cooking-title">
      <div className="library-dialog fle-modal-dialog">
        <header>
          <div>
            <div className="eyebrow">ATELIER GASTRONOMIQUE FRANÇAIS · 12 RECETTES EN 3D</div>
            <h2 id="cooking-title">Enseigner la cuisine & les recettes</h2>
            <p>Ingrédients frais du terroir · Ustensiles de chef · Gestes techniques · Étapes pas-à-pas · Quiz culinaire</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        <div className="library-filters">
          <input
            type="text"
            placeholder="Rechercher un plat, un légume, une technique (ratatouille, carotte, émincer, chocolat...)"
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
            <span style={{ borderLeft: '1px solid var(--line)', margin: '0 4px' }} />
            {difficulties.map(diff => (
              <button
                key={diff}
                className={`button ${difficultyFilter === diff ? 'primary' : 'subtle'}`}
                onClick={() => setDifficultyFilter(diff)}
              >
                {diff === 'Tous' ? 'Tous niveaux' : diff}
              </button>
            ))}
          </div>
        </div>

        <div className="fle-layout-container">
          <div className="fle-scene-list">
            {filteredRecipes.map(recipe => (
              <div
                key={recipe.id}
                className={`fle-scene-item ${selectedRecipe.id === recipe.id ? 'active' : ''}`}
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="fle-item-header">
                  <span className="fle-badge">{recipe.difficulty}</span>
                  <span className="fle-number">#{recipe.number.toString().padStart(2, '0')} · {recipe.prepTime}</span>
                </div>
                <h4>{recipe.title}</h4>
                <p className="fle-cat">{recipe.category} · {recipe.servings} pers.</p>
                <div className="fle-vocab-tags">
                  {recipe.ingredients.slice(0, 3).map((ing, i) => (
                    <span key={i} className="fle-tag">{ing.name}</span>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <span className="fle-tag">+{recipe.ingredients.length - 3} autres</span>
                  )}
                </div>
              </div>
            ))}
            {filteredRecipes.length === 0 && (
              <p className="empty-message">Aucune recette ne correspond à votre recherche.</p>
            )}
          </div>

          <div className="fle-preview-panel">
            <div className="fle-preview-header">
              <span className="fle-badge large">{selectedRecipe.difficulty}</span>
              <div>
                <h3>{selectedRecipe.title}</h3>
                <span className="fle-cat">{selectedRecipe.category} · Préparation : {selectedRecipe.prepTime} · Cuisson : {selectedRecipe.cookTime} · Pour {selectedRecipe.servings} personnes</span>
              </div>
            </div>

            <p className="fle-desc">{selectedRecipe.description}</p>

            <div className="fle-section">
              <div className="section-title"><span>INGRÉDIENTS EN 3D SUR L’ÎLOT DE CUISINE</span></div>
              <div className="fle-vocab-full">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <span key={i} className="fle-tag highlight">
                    {ing.name} ({ing.quantity})
                  </span>
                ))}
              </div>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>USTENSILES & MATÉRIEL DE CHEF</span></div>
              <div className="fle-vocab-tags">
                {selectedRecipe.utensils.map((u, i) => (
                  <span key={i} className="fle-tag">🍳 {u.name}</span>
                ))}
              </div>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>GESTES TECHNIQUES CULINAIRES</span></div>
              <div className="fle-vocab-tags">
                {selectedRecipe.culinaryTechniques.map((tech, i) => (
                  <span key={i} className="fle-tag highlight">✦ {tech}</span>
                ))}
              </div>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>ÉTAPES DE RÉALISATION PAS-À-PAS</span></div>
              <pre className="fle-dialogue-box">
                {selectedRecipe.steps.join('\n\n')}
              </pre>
            </div>

            <div className="fle-section">
              <div className="section-title"><span>LE SECRET DU CHEF</span></div>
              <div className="fle-chef-tip-badge">
                <span className="chef-tip-icon">💡</span>
                <p className="fle-grammar" style={{ margin: 0 }}>{selectedRecipe.chefTip}</p>
              </div>
            </div>

            {winePairings[selectedRecipe.id] && (
              <div className="fle-section wine-pairing-section">
                <div className="section-title"><span>🍷 ACCORD SOMMELIER RECOMMANDÉ</span></div>
                <div className="fle-sommelier-card">
                  <div className="sommelier-header">
                    <span className="sommelier-wine">🍇 {winePairings[selectedRecipe.id].wine}</span>
                    <span className="fle-badge sommelier-temp">🌡️ {winePairings[selectedRecipe.id].temp}</span>
                  </div>
                  <div className="sommelier-region">📍 {winePairings[selectedRecipe.id].region}</div>
                  <div className="sommelier-notes">« {winePairings[selectedRecipe.id].notes} »</div>
                </div>
              </div>
            )}

            <div className="fle-section">
              <div className="section-title"><span>QUIZ CULINAIRE DE VALIDATION</span></div>
              <p className="fle-quiz-preview"><b>Question :</b> {selectedRecipe.quizQuestion.question}</p>
            </div>

            <div className="fle-preview-actions" style={{ display: 'flex', gap: '8px' }}>
              <button
                className="button primary large-btn"
                style={{ flex: 1 }}
                onClick={() => handleLoadRecipe(selectedRecipe)}
              >
                ✦ Déployer cet atelier de cuisine 3D dans le monde
              </button>
              <button
                className="button subtle large-btn"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => {
                  const slug = selectedRecipe.id === 'recipe-ratatouille' 
                    ? 'Ratatouille' 
                    : selectedRecipe.id === 'recipe-boeuf-bourguignon'
                    ? 'B%C5%93uf_bourguignon'
                    : selectedRecipe.id === 'recipe-crepes-suzette'
                    ? 'Cr%C3%AApe_Suzette'
                    : selectedRecipe.id === 'recipe-quiche-lorraine'
                    ? 'Quiche_lorraine'
                    : selectedRecipe.id === 'recipe-soupe-a-l-oignon'
                    ? 'Soupe_%C3%A0_l%27oignon'
                    : encodeURIComponent(selectedRecipe.title);
                  useWorldStore.getState().openWebModal(
                    `https://fr.m.wikipedia.org/wiki/${slug}`,
                    `Recette · ${selectedRecipe.title}`
                  );
                }}
                title="Consulter la fiche Wikipédia complète"
              >
                🌐 Fiche Web ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
