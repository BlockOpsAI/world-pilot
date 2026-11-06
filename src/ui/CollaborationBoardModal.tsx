import { useState, useEffect } from 'react';
import { useWorldStore, type StickyNote } from '../engine/store';

interface CollaborationBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollaborationBoardModal({ isOpen, onClose }: CollaborationBoardModalProps) {
  const notes = useWorldStore(state => state.collaborationNotes);
  const addNote = useWorldStore(state => state.addCollaborationNote);
  const voteNote = useWorldStore(state => state.voteCollaborationNote);
  const moveNote = useWorldStore(state => state.moveCollaborationNote);
  const deleteNote = useWorldStore(state => state.deleteCollaborationNote);

  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('Facilitateur');
  const [newCategory, setNewCategory] = useState<StickyNote['category']>('idea');
  const [newColor, setNewColor] = useState<StickyNote['color']>('yellow');
  const [newColumn, setNewColumn] = useState<StickyNote['column']>('in_progress');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedExport, setCopiedExport] = useState(false);

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

  const totalVotes = notes.reduce((sum, n) => sum + n.votes, 0);
  const topVotedNote = [...notes].sort((a, b) => b.votes - a.votes)[0];

  const filteredNotes = notes.filter(n => {
    if (filterCategory === 'all') return true;
    return n.category === filterCategory;
  });

  const columns: { id: StickyNote['column']; title: string; icon: string; count: number }[] = [
    { id: 'backlog', title: 'À explorer (Idéation)', icon: '💡', count: filteredNotes.filter(n => n.column === 'backlog').length },
    { id: 'in_progress', title: 'En cours (Test & Prototypage)', icon: '⚡', count: filteredNotes.filter(n => n.column === 'in_progress').length },
    { id: 'done', title: 'Validé (Décisions & Consensus)', icon: '✅', count: filteredNotes.filter(n => n.column === 'done').length }
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    addNote({
      text: newText.trim(),
      category: newCategory,
      color: newColor,
      author: newAuthor.trim() || 'Participant',
      column: newColumn
    });
    setNewText('');
  };

  const handleExportMarkdown = () => {
    const lines = [
      `# Compte-Rendu de Session Collaborative — WorldPilot`,
      `Date : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
      `Total de notes : ${notes.length} | Total de votes : ${totalVotes}`,
      '',
      `## 💡 À explorer (Idéation)`,
      ...notes.filter(n => n.column === 'backlog').map(n => `- [${n.category.toUpperCase()}] ${n.text} (${n.votes} votes, par ${n.author})`),
      '',
      `## ⚡ En cours (Test & Prototypage)`,
      ...notes.filter(n => n.column === 'in_progress').map(n => `- [${n.category.toUpperCase()}] ${n.text} (${n.votes} votes, par ${n.author})`),
      '',
      `## ✅ Validé (Décisions & Consensus)`,
      ...notes.filter(n => n.column === 'done').map(n => `- [${n.category.toUpperCase()}] ${n.text} (${n.votes} votes, par ${n.author})`),
      ''
    ];
    const md = lines.join('\n');
    navigator.clipboard?.writeText(md);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const colorStyles: Record<StickyNote['color'], { bg: string; border: string; text: string; tape: string }> = {
    yellow: { bg: '#fef9c3', border: '#fde047', text: '#713f12', tape: 'rgba(253, 224, 71, 0.6)' },
    green: { bg: '#dcfce7', border: '#86efac', text: '#14532d', tape: 'rgba(134, 239, 172, 0.6)' },
    pink: { bg: '#fce7f3', border: '#f472b6', text: '#831843', tape: 'rgba(244, 114, 182, 0.6)' },
    blue: { bg: '#e0f2fe', border: '#7dd3fc', text: '#0c4a6e', tape: 'rgba(125, 211, 252, 0.6)' },
    orange: { bg: '#ffedd5', border: '#fdba74', text: '#7c2d12', tape: 'rgba(253, 186, 116, 0.6)' }
  };

  const categoryLabels: Record<StickyNote['category'], { label: string; icon: string }> = {
    idea: { label: 'Idée', icon: '💡' },
    action: { label: 'Action', icon: '🎯' },
    question: { label: 'Question', icon: '❓' },
    decision: { label: 'Décision', icon: '⚖️' }
  };

  return (
    <div className="collab-board-overlay" onClick={onClose}>
      <div className="collab-board-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="collab-board-header">
          <div className="collab-board-title-wrap">
            <div className="collab-board-badge">
              <span>📋</span>
              <span>Tableau Partagé & Idéation Collaborative</span>
            </div>
            <h2>Espace Séminaire & Design Sprint</h2>
            <p>Partagez vos hypothèses, priorisez les post-its et votez en temps réel avec votre équipe.</p>
          </div>
          <div className="collab-board-header-actions">
            <button
              className={`collab-export-btn ${copiedExport ? 'copied' : ''}`}
              onClick={handleExportMarkdown}
              title="Copier le compte-rendu dans le presse-papiers"
            >
              {copiedExport ? '✓ Compte-rendu copié !' : '📄 Exporter le compte-rendu'}
            </button>
            <button className="collab-close-btn" onClick={onClose} title="Fermer (Échap)">
              ✕
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="collab-board-stats">
          <div className="collab-stat-item">
            <span className="collab-stat-icon">📌</span>
            <div>
              <div className="collab-stat-val">{notes.length}</div>
              <div className="collab-stat-lbl">Notes épinglées</div>
            </div>
          </div>
          <div className="collab-stat-item">
            <span className="collab-stat-icon">❤️</span>
            <div>
              <div className="collab-stat-val">{totalVotes}</div>
              <div className="collab-stat-lbl">Votes cumulés</div>
            </div>
          </div>
          {topVotedNote && (
            <div className="collab-stat-item top-note">
              <span className="collab-stat-icon">🏆</span>
              <div>
                <div className="collab-stat-val">Top : {topVotedNote.votes} votes</div>
                <div className="collab-stat-lbl truncate" title={topVotedNote.text}>"{topVotedNote.text.slice(0, 48)}..."</div>
              </div>
            </div>
          )}
        </div>

        {/* Create Note Bar */}
        <form className="collab-create-form" onSubmit={handleAddSubmit}>
          <div className="collab-input-row">
            <input
              type="text"
              className="collab-text-input"
              placeholder="Écrivez une idée, hypothèse ou action à épingler..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              maxLength={180}
            />
            <input
              type="text"
              className="collab-author-input"
              placeholder="Auteur"
              value={newAuthor}
              onChange={e => setNewAuthor(e.target.value)}
              maxLength={24}
            />
          </div>

          <div className="collab-options-row">
            <div className="collab-option-group">
              <span className="collab-option-label">Catégorie :</span>
              {(['idea', 'action', 'question', 'decision'] as const).map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`collab-pill-btn ${newCategory === cat ? 'active' : ''}`}
                  onClick={() => setNewCategory(cat)}
                >
                  {categoryLabels[cat].icon} {categoryLabels[cat].label}
                </button>
              ))}
            </div>

            <div className="collab-option-group">
              <span className="collab-option-label">Couleur :</span>
              {(['yellow', 'green', 'pink', 'blue', 'orange'] as const).map(col => (
                <button
                  type="button"
                  key={col}
                  className={`collab-color-dot ${newColor === col ? 'selected' : ''}`}
                  style={{ backgroundColor: colorStyles[col].bg, borderColor: colorStyles[col].border }}
                  onClick={() => setNewColor(col)}
                  title={col}
                />
              ))}
            </div>

            <div className="collab-option-group">
              <span className="collab-option-label">Colonne :</span>
              <select
                className="collab-column-select"
                value={newColumn}
                onChange={e => setNewColumn(e.target.value as any)}
              >
                <option value="backlog">💡 À explorer</option>
                <option value="in_progress">⚡ En cours</option>
                <option value="done">✅ Validé</option>
              </select>
            </div>

            <button type="submit" className="collab-submit-btn" disabled={!newText.trim()}>
              📌 Épingler
            </button>
          </div>
        </form>

        {/* Filter bar */}
        <div className="collab-filters-bar">
          <span className="collab-filters-title">Filtrer par type :</span>
          <button
            className={`collab-filter-tag ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Tous ({notes.length})
          </button>
          {(['idea', 'action', 'question', 'decision'] as const).map(cat => (
            <button
              key={cat}
              className={`collab-filter-tag ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {categoryLabels[cat].icon} {categoryLabels[cat].label} ({notes.filter(n => n.category === cat).length})
            </button>
          ))}
        </div>

        {/* Kanban Board Columns */}
        <div className="collab-kanban-grid">
          {columns.map(col => {
            const colNotes = filteredNotes.filter(n => n.column === col.id);
            return (
              <div key={col.id} className="collab-kanban-col">
                <div className="collab-col-header">
                  <span className="collab-col-icon">{col.icon}</span>
                  <span className="collab-col-title">{col.title}</span>
                  <span className="collab-col-badge">{col.count}</span>
                </div>

                <div className="collab-notes-list">
                  {colNotes.length === 0 ? (
                    <div className="collab-empty-col">
                      <span>Aucune note dans cette colonne</span>
                    </div>
                  ) : (
                    colNotes.map((note, index) => {
                      const style = colorStyles[note.color] || colorStyles.yellow;
                      const catInfo = categoryLabels[note.category] || categoryLabels.idea;
                      const rotation = (index % 3 === 0 ? -1 : index % 3 === 1 ? 1 : 0);

                      return (
                        <div
                          key={note.id}
                          className="collab-sticky-note"
                          style={{
                            backgroundColor: style.bg,
                            borderColor: style.border,
                            color: style.text,
                            transform: `rotate(${rotation}deg)`
                          }}
                        >
                          {/* Top scotch tape decoration */}
                          <div className="collab-scotch-tape" style={{ backgroundColor: style.tape }} />

                          {/* Note header: tag + delete */}
                          <div className="collab-note-meta">
                            <span className="collab-note-tag" style={{ borderColor: style.border }}>
                              {catInfo.icon} {catInfo.label}
                            </span>
                            <button
                              className="collab-note-del-btn"
                              onClick={() => deleteNote(note.id)}
                              title="Retirer cette note"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Note content */}
                          <p className="collab-note-text">{note.text}</p>

                          {/* Note footer: author + voting + move */}
                          <div className="collab-note-footer">
                            <span className="collab-note-author">✍️ {note.author}</span>
                            <div className="collab-note-actions">
                              <button
                                className="collab-vote-btn"
                                onClick={() => voteNote(note.id)}
                                title="Voter pour cette idée (+1)"
                              >
                                ❤️ <b>{note.votes}</b>
                              </button>
                              
                              {/* Move column buttons */}
                              {col.id !== 'backlog' && (
                                <button
                                  className="collab-move-btn"
                                  onClick={() => moveNote(note.id, col.id === 'done' ? 'in_progress' : 'backlog')}
                                  title="Déplacer vers la gauche"
                                >
                                  ◀
                                </button>
                              )}
                              {col.id !== 'done' && (
                                <button
                                  className="collab-move-btn"
                                  onClick={() => moveNote(note.id, col.id === 'backlog' ? 'in_progress' : 'done')}
                                  title="Déplacer vers la droite"
                                >
                                  ▶
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
