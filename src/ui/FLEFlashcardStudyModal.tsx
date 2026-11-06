import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWorldStore } from '../engine/store';
import { fleScenes, FLEScene } from '../library/fleScenes';
import { speakAgentDialogue } from '../engine/agentDialogues';
import { playAudioFx } from '../engine/evaluator';
import { VoicePronunciationStudio } from './VoicePronunciationStudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sceneId?: string | null;
}

export function FLEFlashcardStudyModal({ isOpen, onClose, sceneId }: Props) {
  const [currentSceneId, setCurrentSceneId] = useState<string>(sceneId || fleScenes[0]?.id || '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [speechRate, setSpeechRate] = useState<1.0 | 0.75>(1.0);
  const [showVoiceStudio, setShowVoiceStudio] = useState<boolean>(false);

  const masteredVocab = useWorldStore(state => state.masteredVocab);
  const toggleVocabMastery = useWorldStore(state => state.toggleVocabMastery);
  const isVocabMastered = useWorldStore(state => state.isVocabMastered);
  const unlockAchievement = useWorldStore(state => state.unlockAchievement);

  useEffect(() => {
    if (sceneId) {
      setCurrentSceneId(sceneId);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [sceneId]);

  const activeScene: FLEScene | undefined = useMemo(() => {
    return fleScenes.find(s => s.id === currentSceneId) || fleScenes[0];
  }, [currentSceneId]);

  const vocabularyList = useMemo(() => {
    return activeScene?.vocabulary || [];
  }, [activeScene]);

  const totalCards = vocabularyList.length;
  const currentWord = vocabularyList[currentIndex] || '';
  const isCurrentMastered = isVocabMastered(currentWord);

  const masteredInSceneCount = useMemo(() => {
    return vocabularyList.filter(w => isVocabMastered(w)).length;
  }, [vocabularyList, masteredVocab, isVocabMastered]);

  const sceneProgressPercent = totalCards > 0 ? Math.round((masteredInSceneCount / totalCards) * 100) : 0;

  // Auto-check achievement when all cards in scene are mastered
  useEffect(() => {
    if (totalCards > 0 && masteredInSceneCount === totalCards) {
      unlockAchievement('fle_vocab_master');
    }
  }, [masteredInSceneCount, totalCards, unlockAchievement]);

  // Find a dialogue sentence matching the word, or create a natural one
  const exampleSentence = useMemo(() => {
    if (!activeScene || !currentWord) return '';
    const dialogueLines = activeScene.dialogue.split('\n');
    const lowerWord = currentWord.toLowerCase().replace(/^(un|une|le|la|les|l'|des)\s+/, '');
    const foundLine = dialogueLines.find(line => line.toLowerCase().includes(lowerWord));
    if (foundLine) {
      return foundLine.replace(/^[A-Za-zÀ-ÿ\s]+:\s*/, '');
    }
    return `En situation : « Pouvez-vous me donner ${currentWord.toLowerCase()}, s'il vous plaît ? »`;
  }, [activeScene, currentWord]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setShowVoiceStudio(false);
    setCurrentIndex(i => (i > 0 ? i - 1 : totalCards - 1));
    playAudioFx('tink');
  }, [totalCards]);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setShowVoiceStudio(false);
    setCurrentIndex(i => (i < totalCards - 1 ? i + 1 : 0));
    playAudioFx('tink');
  }, [totalCards]);

  const handleFlip = useCallback(() => {
    setIsFlipped(f => !f);
    playAudioFx('tink');
  }, []);

  const handleToggleMastery = useCallback(() => {
    if (!currentWord) return;
    const nowMastered = toggleVocabMastery(currentWord);
    playAudioFx(nowMastered ? 'sparkle' : 'tink');
  }, [currentWord, toggleVocabMastery]);

  const handleSpeak = useCallback((text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    speakAgentDialogue(text, speechRate);
    if (speechRate === 0.75) {
      unlockAchievement('phonetic_listener');
    }
    playAudioFx('tink');
  }, [speechRate, unlockAchievement]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMastery();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowVoiceStudio(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleFlip, handlePrev, handleNext, handleToggleMastery]);

  if (!isOpen || !activeScene) return null;

  return (
    <div className="flashcard-study-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Mode Révision Flashcards">
      <div className="flashcard-study-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flashcard-study-header">
          <div className="flashcard-study-title-group">
            <span className="fle-badge-small">{activeScene.level}</span>
            <div>
              <h3>{activeScene.title}</h3>
              <p className="flashcard-subcaption">
                Scène #{activeScene.number} · {activeScene.category}
              </p>
            </div>
          </div>

          <div className="flashcard-header-actions">
            {/* Scene Selector Dropdown */}
            <select
              className="flashcard-scene-select"
              value={currentSceneId}
              onChange={e => {
                setCurrentSceneId(e.target.value);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              title="Choisir une autre scène FLE"
            >
              {fleScenes.map(sc => (
                <option key={sc.id} value={sc.id}>
                  #{sc.number} [{sc.level}] {sc.title}
                </option>
              ))}
            </select>

            {/* Audio Cadence Selector */}
            <button
              className="fle-speech-rate-btn"
              onClick={() => {
                setSpeechRate(r => (r === 1.0 ? 0.75 : 1.0));
                playAudioFx('tink');
              }}
              title="Basculer la cadence vocale : 1.0x (naturelle) ou 0.75x (ralentie)"
            >
              {speechRate === 1.0 ? '🐰 1.0x' : '🐢 0.75x'}
            </button>

            <button className="icon-button" onClick={onClose} aria-label="Fermer le mode révision">
              ×
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flashcard-progress-bar-wrap">
          <div className="flashcard-progress-bar">
            <div
              className={`flashcard-progress-fill ${sceneProgressPercent === 100 ? 'complete' : ''}`}
              style={{ width: `${sceneProgressPercent}%` }}
            />
          </div>
          <div className="flashcard-progress-labels">
            <span>
              Carte {currentIndex + 1} / {totalCards}
            </span>
            <span className="flashcard-mastery-count">
              ⭐ {masteredInSceneCount} / {totalCards} maîtrisés ({sceneProgressPercent}%)
            </span>
          </div>
        </div>

        {/* 3D Flashcard Presentation */}
        <div className="flashcard-container" onClick={handleFlip} title="Cliquer pour retourner la carte [Espace]">
          <div className={`flashcard-card ${isFlipped ? 'flipped' : ''}`}>
            {/* FRONT */}
            <div className="flashcard-face flashcard-front">
              <div className="flashcard-card-top">
                <span className="flashcard-level-tag">{activeScene.level}</span>
                <span className="flashcard-status-pill">
                  {isCurrentMastered ? '✓ Maîtrisé' : '↻ À apprendre'}
                </span>
              </div>

              <div className="flashcard-card-body">
                <button
                  className="flashcard-speak-hero-btn"
                  onClick={e => handleSpeak(currentWord, e)}
                  title={`Écouter la prononciation vocale (${speechRate}x)`}
                >
                  🔊
                </button>
                <h2 className="flashcard-term">{currentWord}</h2>
                <span className="flashcard-phonetic-hint">Français standard · Écoute audio</span>
              </div>

              <div className="flashcard-card-footer">
                <span className="flashcard-flip-prompt">🔄 Cliquer ou appuyer sur [Espace] pour retourner</span>
              </div>
            </div>

            {/* BACK */}
            <div className="flashcard-face flashcard-back">
              <div className="flashcard-card-top">
                <span className="flashcard-grammar-pill">📚 {activeScene.grammarFocus}</span>
                <span className="flashcard-status-pill">
                  {isCurrentMastered ? '✓ Maîtrisé' : '↻ À apprendre'}
                </span>
              </div>

              <div className="flashcard-card-body back-body">
                <div className="flashcard-term-mini">
                  <span>{currentWord}</span>
                  <button
                    className="flashcard-mini-speak"
                    onClick={e => handleSpeak(currentWord, e)}
                    title="Réécouter le terme"
                  >
                    🔊
                  </button>
                </div>

                <div className="flashcard-example-box">
                  <div className="flashcard-example-header">
                    <span>Exemple en situation :</span>
                    <button
                      className="flashcard-mini-speak"
                      onClick={e => handleSpeak(exampleSentence, e)}
                      title="Écouter la phrase d'exemple"
                    >
                      🗣️ Écouter la phrase
                    </button>
                  </div>
                  <p className="flashcard-example-text">« {exampleSentence} »</p>
                </div>

                <div className="flashcard-context-note">
                  <b>Contexte d'usage :</b> {activeScene.description}
                </div>
              </div>

              <div className="flashcard-card-footer">
                <span className="flashcard-flip-prompt">🔄 Cliquer pour revenir au recto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flashcard-actions-bar">
          <div className="flashcard-nav-buttons">
            <button className="flashcard-nav-btn" onClick={handlePrev} title="Carte précédente [Flèche Gauche]">
              ← Précédent
            </button>
            <button className="flashcard-nav-btn" onClick={handleFlip} title="Retourner la carte [Espace]">
              🔄 Retourner
            </button>
            <button className="flashcard-nav-btn" onClick={handleNext} title="Carte suivante [Flèche Droite]">
              Suivant →
            </button>
            <button
              className={`flashcard-nav-btn flashcard-voice-toggle ${showVoiceStudio ? 'active' : ''}`}
              onClick={() => {
                setShowVoiceStudio(v => !v);
                playAudioFx('tink');
              }}
              title="Pratiquer la prononciation vocale au micro avec l'analyseur acoustique [Touche P]"
            >
              🎙️ {showVoiceStudio ? 'Masquer Studio' : 'Pratiquer ma voix'}
            </button>
          </div>

          <div className="flashcard-mastery-toggle-wrap">
            <button
              className={`flashcard-mastery-btn ${isCurrentMastered ? 'mastered' : ''}`}
              onClick={handleToggleMastery}
              title="Marquer comme maîtrisé ou à réviser [Touche M]"
            >
              {isCurrentMastered ? '✓ Maîtrisé' : '☆ Marquer comme maîtrisé'}
            </button>
          </div>
        </div>

        {/* Voice Pronunciation Recording & Waveform Studio */}
        {showVoiceStudio && (
          <VoicePronunciationStudio
            targetText={isFlipped && exampleSentence ? exampleSentence : currentWord}
            onClose={() => setShowVoiceStudio(false)}
          />
        )}

        {/* 100% Celebration Banner */}
        {sceneProgressPercent === 100 && (
          <div className="flashcard-congrats-banner">
            <span>🎉 Félicitations ! Toutes les cartes de cette scène sont maîtrisées !</span>
          </div>
        )}
      </div>
    </div>
  );
}
