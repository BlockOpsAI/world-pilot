import type { WorldPatch, EntitySpec, RuleSpec, QuestSpec } from '../core/types';
import { getAsset } from './catalog';

export interface FLEScene {
  id: string;
  number: number;
  title: string;
  category: 'Commerces & Alimentation' | 'Services & Ville' | 'Transports & Déplacement' | 'Hébergement & Voyages' | 'Santé & Soins' | 'Éducation & Langue' | 'Culture & Loisirs' | 'Quotidien & Gastronomie' | 'Vie professionnelle';
  level: 'A1' | 'A2' | 'B1' | 'B2';
  description: string;
  dialogue: string;
  vocabulary: string[];
  grammarFocus: string;
  assetPlacements: { assetId: string; pos: [number, number, number]; rot?: [number, number, number]; scale?: [number, number, number]; text?: string }[];
  quizQuestion: { question: string; options: string[]; answer: 'A' | 'B' | 'C' };
}

export function createFLEPatch(scene: FLEScene, _existing: Record<string, EntitySpec> = {}): WorldPatch {
  const entitiesCreated: EntitySpec[] = [];
  const rulesChanged: RuleSpec[] = [];

  // Add the dialogue caption board (positioned on lateral flank, angled to camera)
  const captionId = `fle_${scene.id}_captions`;
  entitiesCreated.push({
    id: captionId,
    name: `Dialogue · ${scene.title}`,
    capabilities: [
      { type: 'transform', position: { x: -1.9, y: 0, z: -0.6 }, rotation: { x: 0, y: 0.35, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      { type: 'educational', text: `[${scene.level}] ${scene.title.toUpperCase()}\n\n${scene.dialogue}`, value: 0, active: true },
    ],
    visuals: { assetId: 'captions', modelUrl: '/library/captions.glb' }
  });

  // Add audio pronunciation speaker
  const audioId = `fle_${scene.id}_audio`;
  entitiesCreated.push({
    id: audioId,
    name: `Écoute vocale`,
    capabilities: [
      { type: 'transform', position: { x: 1.85, y: 0, z: -0.6 }, rotation: { x: 0, y: -0.35, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      { type: 'educational', text: scene.dialogue, value: 0, active: false },
    ],
    visuals: { assetId: 'audio', modelUrl: '/library/audio.glb' }
  });

  // Add comprehension quiz
  const quizId = `fle_${scene.id}_quiz`;
  entitiesCreated.push({
    id: quizId,
    name: `Compréhension`,
    capabilities: [
      { type: 'transform', position: { x: -1.8, y: 0, z: -3.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      { type: 'educational', text: `${scene.quizQuestion.question}\nA) ${scene.quizQuestion.options[0]}\nB) ${scene.quizQuestion.options[1]}\nC) ${scene.quizQuestion.options[2]}`, value: 0, active: false, correctAnswer: scene.quizQuestion.answer },
    ],
    visuals: { assetId: 'quiz', modelUrl: '/library/quiz.glb' }
  });

  rulesChanged.push({
    id: `rule_${quizId}`,
    trigger: 'ANSWER_CORRECT',
    conditions: [{ type: 'is_source', sourceId: quizId }],
    actions: [{ type: 'set_flag', flag: `${scene.id}_completed`, value: true }, { type: 'show_warning', message: 'Bravo ! Bonne réponse au quiz FLE.' }]
  });

  rulesChanged.push({
    id: `rule_${captionId}`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: captionId }],
    actions: [
      { type: 'play_sound', sound: 'chime' },
      { type: 'set_flag', flag: `${scene.id}_dialogue_read`, value: true },
      { type: 'show_warning', message: `📖 Dialogue [${scene.level}] : « ${scene.title} » observé avec attention.` }
    ]
  });

  rulesChanged.push({
    id: `rule_${audioId}`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: audioId }],
    actions: [
      { type: 'play_sound', sound: 'chime' },
      { type: 'set_flag', flag: `${scene.id}_audio_listened`, value: true },
      { type: 'show_warning', message: `🔊 Écoute vocale : prononciation en français authentique active.` }
    ]
  });

  // Add objects with their specific coordinates
  scene.assetPlacements.forEach((p, idx) => {
    const asset = getAsset(p.assetId);
    const entId = `fle_${scene.id}_obj_${idx + 1}`;
    const isFixedFurniture = [
      'wp-ilot-de-cuisine', 'counter', 'technical-bench', 'table', 'workbench', 'meeting-table', 'coffee-table', 'desk', 'sofa', 'shelf',
      'wp-devanture-de-boulangerie', 'wp-auvent-de-terrasse', 'wp-barriere-de-terrasse', 'wp-table-de-bistrot',
      'wp-comptoir-de-vente', 'wp-etal-de-marche', 'wp-vitrine-refrigeree', 'wp-bureau-individuel',
      'wp-abribus', 'wp-kiosque-a-journaux', 'wp-miroir-de-boutique', 'wp-horloge-murale',
      'wp-panneau-directionnel', 'wp-reverbere-de-rue', 'wp-fontaine-a-boire', 'wp-potelet-urbain',
      'wp-banc-de-quai', 'bench', 'label', 'wall-screen'
    ].includes(p.assetId);

    const safeY = (!isFixedFurniture && p.pos[1] >= 0.85 && p.pos[1] <= 0.915)
      ? 0.925
      : (!isFixedFurniture && p.pos[1] >= 0.38 && p.pos[1] <= 0.425)
      ? 0.435
      : (!isFixedFurniture && p.pos[1] >= 0.72 && p.pos[1] <= 0.78)
      ? 0.785
      : p.pos[1];

    entitiesCreated.push({
      id: entId,
      name: asset?.name || p.assetId,
      capabilities: [
        {
          type: 'transform',
          position: { x: p.pos[0], y: safeY, z: p.pos[2] },
          rotation: p.rot ? { x: p.rot[0], y: p.rot[1], z: p.rot[2] } : { x: 0, y: 0, z: 0 },
          scale: p.scale ? { x: p.scale[0], y: p.scale[1], z: p.scale[2] } : { x: 1, y: 1, z: 1 }
        },
        ...(!isFixedFurniture ? [{ type: 'draggable' as const }] : []),
        { type: 'collider' as const },
        { type: 'educational' as const, text: p.text || asset?.name || '', value: 0, active: false }
      ],
      visuals: {
        assetId: p.assetId,
        modelUrl: `/library/${p.assetId}.glb`
      }
    });

    rulesChanged.push({
      id: `rule_${entId}_vocab`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: entId }],
      actions: [
        { type: 'play_sound', sound: 'tink' },
        { type: 'set_flag', flag: `${scene.id}_vocab_discovered`, value: true },
        { type: 'show_warning', message: `💡 Vocabulaire découvert : ${asset?.name || p.assetId}.` }
      ]
    });
  });

  const firstObj =
    entitiesCreated.find(e => e.id.startsWith(`fle_${scene.id}_obj`) && e.capabilities.some(c => c.type === 'draggable')) ||
    entitiesCreated.find(e => e.id.startsWith(`fle_${scene.id}_obj`));
  const questId = `quest_${scene.id}`;
  const quest: QuestSpec = {
    id: questId,
    title: `Immersion FLE #${scene.number} : ${scene.title}`,
    description: `${scene.description} (Niveau ${scene.level} · ${scene.category})`,
    category: 'fle',
    rewardSound: 'fanfare',
    currentStepIndex: 0,
    status: 'in_progress',
    steps: [
      {
        id: `step_${scene.id}_1_dialogue`,
        title: 'Dialogue authentique & Écoute',
        description: `Observer le dialogue de référence et écouter la prononciation vocale [${scene.level}].`,
        targetEntityId: captionId,
        requiredEvent: 'INTERACT',
        hint: `Cliquez sur le panneau de dialogue ou sur la borne audio pour écouter.`,
        completed: false
      },
      {
        id: `step_${scene.id}_2_vocab`,
        title: 'Exploration du vocabulaire en situation',
        description: `Identifier les éléments clés en 3D : ${scene.vocabulary.slice(0, 4).join(', ')}.`,
        targetEntityId: firstObj?.id || captionId,
        requiredEvent: 'INTERACT',
        hint: `Cliquez sur les objets 3D pour découvrir le lexique en situation authentique.`,
        completed: false
      },
      {
        id: `step_${scene.id}_3_quiz`,
        title: 'Validation de compréhension orale & écrite',
        description: `Question : « ${scene.quizQuestion.question} »`,
        targetEntityId: quizId,
        requiredEvent: 'ANSWER_CORRECT',
        hint: `Répondez A, B ou C sur le pupitre 3D ou directement dans le volet de quête.`,
        completed: false
      }
    ]
  };

  return {
    entitiesCreated,
    rulesChanged,
    invariantsAdded: [],
    questsAdded: [quest],
    activeQuestId: questId
  };
}

export const fleScenes: FLEScene[] = [
  {
    id: 'fle-boulangerie',
    number: 1,
    title: 'À la boulangerie parisienne',
    category: 'Commerces & Alimentation',
    level: 'A1',
    description: 'Commander du pain frais, des viennoiseries et demander le prix au boulanger.',
    dialogue: '— Bonjour Madame ! Une baguette tradition pas trop cuite et deux croissants, s’il vous plaît.\n— Voilà Monsieur ! Et avec ceci ?\n— Ce sera tout merci. Ça fait combien ?\n— Ça vous fera 3 euros 40.',
    vocabulary: ['la baguette', 'le croissant', 'le pain au chocolat', 'la tradition', 'combien coûte', 's’il vous plaît'],
    grammarFocus: 'Les articles définis/indéfinis et les formules de politesse (s’il vous plaît, merci).',
    quizQuestion: {
      question: 'Combien de croissants le client achète-t-il ?',
      options: ['Un croissant', 'Deux croissants', 'Trois croissants'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-devanture-de-boulangerie', pos: [0, 0, -1.8] },
      { assetId: 'wp-comptoir-de-vente', pos: [0, 0, -0.6] },
      { assetId: 'wp-caisse-enregistreuse', pos: [0.6, 1.05, -0.6] },
      { assetId: 'wp-corbeille-a-pain', pos: [-0.4, 1.05, -0.6] },
      { assetId: 'wp-baguette', pos: [-0.4, 1.18, -0.6], rot: [0, 0.4, 0.2] },
      { assetId: 'wp-croissant', pos: [0.1, 1.05, -0.6] },
      { assetId: 'wp-pain-au-chocolat', pos: [0.25, 1.05, -0.6] },
      { assetId: 'label', pos: [-0.4, 1.5, -0.6], text: 'LA BAGUETTE' }
    ]
  },
  {
    id: 'fle-cafe-terrasse',
    number: 2,
    title: 'Au café bistrot parisien',
    category: 'Commerces & Alimentation',
    level: 'A1',
    description: 'Prendre place en terrasse, commander une boisson et demander l’addition.',
    dialogue: '— Bonjour ! Un expresso en terrasse et un verre d’eau, s’il vous plaît.\n— Très bien. Avec un sucre ?\n— Oui merci. Et pourriez-vous m’apporter l’addition quand vous aurez un moment ?\n— Bien sûr, tout de suite !',
    vocabulary: ['le café', 'la terrasse', 'l’addition', 'le verre d’eau', 'le serveur', 'le sucre'],
    grammarFocus: 'Le présent de l’indicatif et l’expression du souhait (je voudrais, s’il vous plaît).',
    quizQuestion: {
      question: 'Que commande le client en terrasse ?',
      options: ['Un thé au citron', 'Un expresso et un verre d’eau', 'Un jus d’orange'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-auvent-de-terrasse', pos: [0, 1.8, -1.5] },
      { assetId: 'wp-barriere-de-terrasse', pos: [-1.4, 0, 0], rot: [0, Math.PI / 2, 0] },
      { assetId: 'wp-table-de-bistrot', pos: [0, 0, 0] },
      { assetId: 'wp-chaise-scolaire', pos: [-0.65, 0, 0], rot: [0, Math.PI / 2, 0] },
      { assetId: 'wp-chaise-scolaire', pos: [0.65, 0, 0], rot: [0, -Math.PI / 2, 0] },
      { assetId: 'wp-tasse-a-the', pos: [-0.12, 0.75, 0] },
      { assetId: 'wp-verre-a-eau', pos: [0.12, 0.75, 0.08] },
      { assetId: 'wp-carafe', pos: [0, 0.75, -0.15] },
      { assetId: 'label', pos: [0, 1.3, 0], text: 'LA TERRASSE' }
    ]
  },
  {
    id: 'fle-restaurant',
    number: 3,
    title: 'Au restaurant gastronomique',
    category: 'Commerces & Alimentation',
    level: 'A2',
    description: 'Réserver une table, consulter la carte et commander un menu traditionnel.',
    dialogue: '— Bonsoir, avez-vous réservé ?\n— Oui, une table pour deux au nom de Laurent.\n— Parfait, voici la carte des vins et le menu du jour.\n— Nous prendrons la formule entrée-plat avec une carafe d’eau, s’il vous plaît.',
    vocabulary: ['le menu', 'la carte', 'l’entrée', 'le plat du jour', 'la réservation', 'le dessert'],
    grammarFocus: 'Le futur proche (nous allons prendre) et les quantificateurs (une carafe, une part).',
    quizQuestion: {
      question: 'À quel nom la table a-t-elle été réservée ?',
      options: ['Au nom de Martin', 'Au nom de Laurent', 'Au nom de Dupont'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'meeting-table', pos: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [-0.8, 0, 0], rot: [0, Math.PI / 2, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [0.8, 0, 0], rot: [0, -Math.PI / 2, 0] },
      { assetId: 'wp-assiette-plate', pos: [-0.3, 0.76, 0] },
      { assetId: 'wp-assiette-plate', pos: [0.3, 0.76, 0] },
      { assetId: 'wp-fourchette', pos: [-0.5, 0.76, 0] },
      { assetId: 'wp-couteau-de-table', pos: [-0.1, 0.76, 0] },
      { assetId: 'wp-verre-a-pied', pos: [-0.2, 0.76, -0.2] },
      { assetId: 'wp-bougeoir-de-table', pos: [0, 0.76, 0] }
    ]
  },
  {
    id: 'fle-marche',
    number: 4,
    title: 'Au marché de primeurs',
    category: 'Commerces & Alimentation',
    level: 'A1',
    description: 'Acheter des fruits et légumes de saison au poids et échanger avec le maraîcher.',
    dialogue: '— Bonjour ! Combien coûtent les tomates anciennes ?\n— Elles sont à 3 euros 50 le kilo. Elles sont gorgées de soleil !\n— Mettez-m’en un kilo, ainsi que deux courgettes et une botte de carottes.\n— Très bien ! Autre chose avec ceci ?',
    vocabulary: ['le maraîcher', 'le kilo', 'le légume', 'le fruit', 'peser', 'frais'],
    grammarFocus: 'Les pronoms en (« Mettez-m’en un kilo ») et les adjectifs de qualité.',
    quizQuestion: {
      question: 'Quel est le prix au kilo des tomates ?',
      options: ['2 euros 50', '3 euros 50', '4 euros'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-etal-de-marche', pos: [0, 0, -0.8] },
      { assetId: 'wp-balance-de-cuisine', pos: [0.5, 0.9, -0.8] },
      { assetId: 'wp-cageot-a-fruits', pos: [-0.4, 0.9, -0.8] },
      { assetId: 'wp-tomate', pos: [-0.4, 0.95, -0.8] },
      { assetId: 'wp-courgette', pos: [-0.2, 0.9, -0.7] },
      { assetId: 'wp-carotte', pos: [0.1, 0.9, -0.7] },
      { assetId: 'wp-panier-de-courses', pos: [-0.8, 0, 0.2] },
      { assetId: 'label', pos: [-0.4, 1.4, -0.8], text: 'LES LÉGUMES FRAIS' }
    ]
  },
  {
    id: 'fle-supermarche',
    number: 5,
    title: 'Au supermarché et à la caisse',
    category: 'Commerces & Alimentation',
    level: 'A2',
    description: 'Faire ses courses avec un chariot et régler ses achats en caisse.',
    dialogue: '— Bonjour, avez-vous la carte de fidélité du magasin ?\n— Oui, la voici.\n— Vous réglez par carte bancaire ou en espèces ?\n— Par carte sans contact, s’il vous plaît.\n— Parfait, posez votre carte sur le terminal. Voulez-vous le ticket de caisse ?',
    vocabulary: ['le chariot', 'la caisse', 'la carte bancaire', 'le reçu', 'le sans contact', 'les courses'],
    grammarFocus: 'Les moyens de paiement et les questions à choix multiples.',
    quizQuestion: {
      question: 'Comment le client souhaite-t-il payer ?',
      options: ['Par chèque', 'Par carte sans contact', 'En espèces'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-caisse-enregistreuse', pos: [0, 0.8, 0] },
      { assetId: 'wp-terminal-de-paiement', pos: [0.4, 0.8, 0.1] },
      { assetId: 'wp-scanner-de-caisse', pos: [-0.3, 0.8, 0.1] },
      { assetId: 'wp-chariot-de-supermarche', pos: [-1, 0, 0.4] },
      { assetId: 'wp-sac-de-courses-en-papier', pos: [0.6, 0.8, -0.1] },
      { assetId: 'wp-paquet-de-riz', pos: [-0.8, 0.6, 0.4] },
      { assetId: 'wp-paquet-de-pates', pos: [-0.7, 0.6, 0.4] }
    ]
  },
  {
    id: 'fle-patisserie',
    number: 6,
    title: 'À la pâtisserie fine',
    category: 'Commerces & Alimentation',
    level: 'A2',
    description: 'Choisir des gâteaux raffinés pour un repas de fête.',
    dialogue: '— Bonjour Madame, que me conseillez-vous pour un anniversaire ?\n— Notre Paris-Brest au praliné est délicieux, ou bien cet assortiment de macarons colorés.\n— Excellente idée ! Je vais prendre un Paris-Brest pour six personnes et quatre macarons.',
    vocabulary: ['la pâtisserie', 'le macaron', 'le Paris-Brest', 'la part', 'le gâteau', 'gourmand'],
    grammarFocus: 'Les adjectifs démonstratifs (ce, cet, cette, ces).',
    quizQuestion: {
      question: 'Combien de macarons le client choisit-il ?',
      options: ['Deux', 'Quatre', 'Six'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-vitrine-refrigeree', pos: [0, 0, -0.6] },
      { assetId: 'wp-paris-brest', pos: [-0.4, 0.85, -0.6] },
      { assetId: 'wp-macaron', pos: [0, 0.85, -0.6] },
      { assetId: 'wp-eclair-au-chocolat', pos: [0.4, 0.85, -0.6] },
      { assetId: 'wp-millefeuille', pos: [-0.2, 0.85, -0.6] },
      { assetId: 'label', pos: [0, 1.4, -0.6], text: 'PÂTISSERIES' }
    ]
  },
  {
    id: 'fle-fromagerie',
    number: 7,
    title: 'À la fromagerie de tradition',
    category: 'Commerces & Alimentation',
    level: 'B1',
    description: 'Découvrir les terroirs fromagers français et demander conseil à l’artisan.',
    dialogue: '— Bonjour ! Je prépare un plateau de fromages. Que me suggérez-vous ?\n— Je vous conseille un bon comté affiné 18 mois, un chèvre crémeux du Poitou et un bleu d’Auvergne.\n— Vous voulez goûter le comté ?\n— Volontiers ! Il a un goût fruité exceptionnel.',
    vocabulary: ['le fromage', 'affiné', 'le terroir', 'crémeux', 'déguster', 'le plateau'],
    grammarFocus: 'L’accord des adjectifs de goût et les comparatifs/superlatifs.',
    quizQuestion: {
      question: 'Combien de mois d’affinage a le comté recommandé ?',
      options: ['6 mois', '12 mois', '18 mois'],
      answer: 'C'
    },
    assetPlacements: [
      { assetId: 'wp-comptoir-de-vente', pos: [0, 0, -0.5] },
      { assetId: 'wp-plateau-de-fromages', pos: [0, 1.05, -0.5] },
      { assetId: 'wp-meule-de-fromage', pos: [-0.6, 1.05, -0.5] },
      { assetId: 'wp-part-de-fromage', pos: [0.4, 1.05, -0.5] },
      { assetId: 'wp-couteau-de-chef', pos: [0.2, 1.05, -0.5] }
    ]
  },
  {
    id: 'fle-pharmacie',
    number: 8,
    title: 'À la pharmacie',
    category: 'Santé & Soins',
    level: 'A2',
    description: 'Expliquer des symptômes de santé et obtenir des conseils posologiques.',
    dialogue: '— Bonjour Docteur, j’ai de la fièvre et mal à la tête depuis hier soir.\n— Avez-vous pris votre température ?\n— Oui, j’avais 38,5 ce matin.\n— Prenez ce paracétamol : un comprimé toutes les six heures avec un grand verre d’eau.',
    vocabulary: ['la fièvre', 'le mal de tête', 'l’ordonnance', 'le comprimé', 'la posologie', 'le thermomètre'],
    grammarFocus: 'L’impératif pour donner un conseil médical (« Prenez », « Buvez »).',
    quizQuestion: {
      question: 'À quelle fréquence faut-il prendre le médicament ?',
      options: ['Toutes les 2 heures', 'Toutes les 6 heures', 'Une fois par jour'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'counter', pos: [0, 0, -0.5] },
      { assetId: 'thermometer', pos: [-0.3, 1.05, -0.5] },
      { assetId: 'wp-trousse-de-premiers-secours', pos: [0.4, 1.05, -0.5] },
      { assetId: 'wp-verre-a-eau', pos: [0.1, 1.05, -0.5] },
      { assetId: 'label', pos: [0, 1.5, -0.5], text: 'LA PHARMACIE' }
    ]
  },
  {
    id: 'fle-poste',
    number: 9,
    title: 'Au bureau de poste',
    category: 'Services & Ville',
    level: 'A2',
    description: 'Affranchir une lettre, peser un paquet et acheter des timbres.',
    dialogue: '— Bonjour, je voudrais envoyer cette lettre en recommandé pour le Canada.\n— Posez-la sur la balance s’il vous plaît... Elle fait 45 grammes. Vous voulez un suivi ?\n— Oui s’il vous plaît, avec accusé de réception.\n— Très bien, collez cette étiquette ici.',
    vocabulary: ['le recommandé', 'le timbre', 'le colis', 'peser', 'le facteur', 'l’accusé de réception'],
    grammarFocus: 'Le conditionnel de politesse (« Je voudrais », « Pourriez-vous »).',
    quizQuestion: {
      question: 'Où le client souhaite-t-il envoyer sa lettre ?',
      options: ['En Espagne', 'Au Canada', 'Au Japon'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-boite-aux-lettres-de-rue', pos: [1.4, 0, 0] },
      { assetId: 'counter', pos: [0, 0, -0.5] },
      { assetId: 'wp-balance-de-cuisine', pos: [0.2, 1.05, -0.5] },
      { assetId: 'wp-porte-documents', pos: [-0.3, 1.05, -0.5] },
      { assetId: 'label', pos: [1.4, 1.4, 0], text: 'LA POSTE' }
    ]
  },
  {
    id: 'fle-metro',
    number: 10,
    title: 'Dans le métro parisien',
    category: 'Transports & Déplacement',
    level: 'A1',
    description: 'Acheter un ticket à la borne, composter et demander son chemin sur le quai.',
    dialogue: '— Pardon Monsieur, quelle ligne dois-je prendre pour aller au Musée du Louvre ?\n— Prenez la ligne 1 en direction de Château de Vincennes et descendez à la station Palais-Royal.\n— Merci beaucoup ! Faut-il garder le ticket jusqu’à la sortie ?\n— Oui, toujours, en cas de contrôle !',
    vocabulary: ['le métro', 'la station', 'la ligne', 'le quai', 'le ticket', 'la correspondance'],
    grammarFocus: 'Les verbes de direction (prendre, descendre, changer, tourner).',
    quizQuestion: {
      question: 'À quelle station le voyageur doit-il descendre ?',
      options: ['Châtelet', 'Palais-Royal', 'Bastille'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-borne-de-tickets', pos: [-1, 0, -0.8] },
      { assetId: 'wp-banc-de-quai', pos: [0.8, 0, -0.8] },
      { assetId: 'wp-panneau-directionnel', pos: [0, 0, -1.8] },
      { assetId: 'wp-potelet-urbain', pos: [-1.6, 0, 0] },
      { assetId: 'label', pos: [0, 2.2, -1.8], text: 'MÉTRO · LIGNE 1' }
    ]
  },
  {
    id: 'fle-gare',
    number: 11,
    title: 'Au guichet de la gare SNCF',
    category: 'Transports & Déplacement',
    level: 'A2',
    description: 'Réserver un billet de TGV, choisir sa place et vérifier les horaires de départ.',
    dialogue: '— Bonjour, je souhaite réserver un aller-retour Paris-Marseille pour vendredi matin.\n— Préférez-vous voyager en première ou en seconde classe ? Côté fenêtre ou couloir ?\n— En seconde classe, côté fenêtre s’il vous plaît.\n— Votre train partira à 8h12 voie 3.',
    vocabulary: ['le train', 'le TGV', 'le quai', 'la voie', 'l’aller-retour', 'le départ'],
    grammarFocus: 'L’expression de l’heure et les préférences (préférer, souhaiter).',
    quizQuestion: {
      question: 'Sur quelle voie partira le train du voyageur ?',
      options: ['Voie 1', 'Voie 3', 'Voie 7'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'counter', pos: [0, 0, -0.6] },
      { assetId: 'wp-valise-a-roulettes', pos: [-0.8, 0, 0.2] },
      { assetId: 'wp-horloge-murale', pos: [0, 2.2, -1.2] },
      { assetId: 'wp-borne-de-tickets', pos: [1.2, 0, -0.6] }
    ]
  },
  {
    id: 'fle-arret-bus',
    number: 12,
    title: 'À l’arrêt de bus',
    category: 'Transports & Déplacement',
    level: 'A1',
    description: 'Consulter le plan de réseau et demander l’horaire de passage.',
    dialogue: '— Excusez-moi Madame, est-ce que le bus 38 s’arrête bien ici ?\n— Oui, il passe toutes les dix minutes. D’après l’écran, le prochain arrive dans deux minutes.\n— Super, merci ! Peut-on acheter un ticket auprès du chauffeur ?\n— Oui, prévoyez l’appoint si possible.',
    vocabulary: ['le bus', 'l’abribus', 'l’horaire', 'le chauffeur', 'l’arrêt', 'la correspondance'],
    grammarFocus: 'Les interrogations totales et partielles (est-ce que, où, quand).',
    quizQuestion: {
      question: 'Dans combien de minutes arrive le prochain bus ?',
      options: ['Deux minutes', 'Dix minutes', 'Quinze minutes'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-abribus', pos: [0, 0, -0.5] },
      { assetId: 'wp-panneau-directionnel', pos: [-1.6, 0, -0.5] },
      { assetId: 'bench', pos: [0, 0, -0.4] },
      { assetId: 'wp-potelet-urbain', pos: [1.6, 0, 0.5] }
    ]
  },
  {
    id: 'fle-kiosque',
    number: 13,
    title: 'Au kiosque à journaux',
    category: 'Services & Ville',
    level: 'A1',
    description: 'Acheter la presse quotidienne, un magazine et des souvenirs parisiens.',
    dialogue: '— Bonjour ! Avez-vous le journal d’aujourd’hui et un plan touristique de Paris ?\n— Oui bien sûr, les journaux sont ici et les plans sur le présentoir tournant.\n— Je vais aussi prendre cette carte postale de la Tour Eiffel.\n— Ça vous fera 5 euros 20.',
    vocabulary: ['le kiosque', 'le journal', 'le magazine', 'le plan', 'la carte postale', 'l’actualité'],
    grammarFocus: 'Les démonstratifs de proximité et le lexique de l’information.',
    quizQuestion: {
      question: 'Que prend le client en plus du journal et du plan ?',
      options: ['Un stylo', 'Une carte postale', 'Un livre'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-kiosque-a-journaux', pos: [0, 0, -0.6] },
      { assetId: 'wp-tourniquet-a-cartes', pos: [-1.4, 0, 0] },
      { assetId: 'wp-reverbere-de-rue', pos: [1.4, 0, 0] }
    ]
  },
  {
    id: 'fle-tourisme',
    number: 14,
    title: 'À l’office de tourisme',
    category: 'Services & Ville',
    level: 'A1',
    description: 'Demander son chemin, des conseils de visite et se repérer dans un quartier.',
    dialogue: '— Bonjour, pourriez-vous m’indiquer comment aller à la cathédrale Notre-Dame ?\n— Bien sûr ! Vous descendez cette rue tout droit pendant cinq minutes, puis vous traversez le pont sur la Seine.\n— Y a-t-il une visite guidée cet après-midi ?\n— Oui, un départ est prévu à 14 heures.',
    vocabulary: ['le monument', 'la visite guidée', 'tout droit', 'traverser', 'le pont', 'le plan'],
    grammarFocus: 'Les prépositions de lieu (devant, derrière, tout droit, à gauche, sur).',
    quizQuestion: {
      question: 'À quelle heure commence la visite guidée ?',
      options: ['À 10 heures', 'À 14 heures', 'À 16 heures'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'counter', pos: [0, 0, -0.6] },
      { assetId: 'globe', pos: [-0.6, 1.05, -0.6] },
      { assetId: 'wp-panneau-directionnel', pos: [1.4, 0, 0] },
      { assetId: 'wp-fontaine-a-boire', pos: [-1.4, 0, 0] }
    ]
  },
  {
    id: 'fle-hotel',
    number: 15,
    title: 'À la réception de l’hôtel',
    category: 'Hébergement & Voyages',
    level: 'A1',
    description: 'Faire son check-in, demander sa clé de chambre et les horaires des services.',
    dialogue: '— Bonsoir, bienvenue à l’Hôtel de Paris. Avez-vous une réservation ?\n— Oui, au nom de M. Garcia pour trois nuits.\n— Parfait, voici la clé de votre chambre au deuxième étage avec ascenseur.\n— À quelle heure est servi le petit-déjeuner ?\n— De 7 heures à 10 heures dans la salle du rez-de-chaussée.',
    vocabulary: ['l’hôtel', 'la chambre', 'la clé', 'l’ascenseur', 'l’étage', 'le petit-déjeuner'],
    grammarFocus: 'Les nombres ordinaux (premier, deuxième, troisième étage).',
    quizQuestion: {
      question: 'À quel étage se trouve la chambre de M. Garcia ?',
      options: ['Au rez-de-chaussée', 'Au deuxième étage', 'Au cinquième étage'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'counter', pos: [0, 0, -0.5] },
      { assetId: 'wp-valise-a-roulettes', pos: [-0.8, 0, 0.4] },
      { assetId: 'wp-trousseau-de-cles', pos: [0.2, 1.05, -0.5] },
      { assetId: 'wp-horloge-murale', pos: [0, 2.2, -1.2] }
    ]
  },
  {
    id: 'fle-aeroport',
    number: 16,
    title: 'À l’aéroport / enregistrement',
    category: 'Hébergement & Voyages',
    level: 'A2',
    description: 'Enregistrer ses bagages en soute et vérifier sa porte d’embarquement.',
    dialogue: '— Bonjour, vos passeports et confirmations de vol, s’il vous plaît.\n— Les voici. Avez-vous des bagages à enregistrer ?\n— Oui, cette valise pour la soute et nous gardons ce sac à dos en cabine.\n— Votre porte d’embarquement est la B22. L’embarquement débutera à 10h45.',
    vocabulary: ['le vol', 'l’embarquement', 'la soute', 'la cabine', 'le passeport', 'la porte'],
    grammarFocus: 'Les pronoms possessifs et la distinction soute/cabine.',
    quizQuestion: {
      question: 'Quel bagage le passager garde-t-il avec lui en cabine ?',
      options: ['Sa grande valise', 'Son sac à dos', 'Aucun bagage'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'counter', pos: [0, 0, -0.6] },
      { assetId: 'wp-valise-a-roulettes', pos: [0.6, 0, 0.3] },
      { assetId: 'wp-sac-a-dos', pos: [-0.5, 1.05, -0.6] },
      { assetId: 'wp-balance-de-cuisine', pos: [0.3, 1.05, -0.6] }
    ]
  },
  {
    id: 'fle-objets-trouves',
    number: 17,
    title: 'Aux objets trouvés / commissariat',
    category: 'Services & Ville',
    level: 'B1',
    description: 'Déclarer un objet perdu et en faire la description précise.',
    dialogue: '— Bonjour, je viens déclarer la perte de mon portefeuille dans le bus.\n— De quelle couleur est-il et quelle est sa matière ?\n— Il est en cuir marron foncé, rectangulaire, avec une fermeture éclair dorée.\n— Que contenait-il exactement ?\n— Ma carte d’identité, mon permis et une trentaine d’euros.',
    vocabulary: ['déclarer', 'perdre', 'le portefeuille', 'en cuir', 'la matière', 'l’identité'],
    grammarFocus: 'La description détaillée des matières (en cuir, en métal, en tissu) et des formes.',
    quizQuestion: {
      question: 'De quelle couleur est le portefeuille perdu ?',
      options: ['Noir', 'Marron foncé', 'Bleu marine'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'meeting-table', pos: [0, 0, -0.6] },
      { assetId: 'wp-fauteuil-de-conference', pos: [0, 0, 0.4] },
      { assetId: 'wp-portefeuille', pos: [0, 0.76, -0.6] },
      { assetId: 'wp-trousseau-de-cles', pos: [0.3, 0.76, -0.6] }
    ]
  },
  {
    id: 'fle-medecin',
    number: 18,
    title: 'Chez le médecin généraliste',
    category: 'Santé & Soins',
    level: 'B1',
    description: 'Décrire ses douleurs, antécédents et comprendre l’auscultation médicale.',
    dialogue: '— Asseyez-vous. Qu’est-ce qui vous amène aujourd’hui ?\n— J’ai une toux persistante et des frissons depuis trois jours.\n— Je vais ausculter votre respiration. Inspirez profondément et expirez... Rien d’alarmant, c’est une bronchite virale. Voici l’ordonnance pour du sirop.',
    vocabulary: ['le médecin', 'ausculter', 'respirer', 'la toux', 'le sirop', 'la guérison'],
    grammarFocus: 'L’expression de la durée (depuis trois jours, pendant une semaine).',
    quizQuestion: {
      question: 'Quel diagnostic le médecin pose-t-il ?',
      options: ['Une allergie', 'Une bronchite virale', 'Une entorse'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-bureau-individuel', pos: [0, 0, -0.6] },
      { assetId: 'wp-fauteuil-de-conference', pos: [-0.6, 0, 0.4] },
      { assetId: 'wp-fauteuil-de-conference', pos: [0.6, 0, -0.6], rot: [0, Math.PI, 0] },
      { assetId: 'thermometer', pos: [-0.3, 0.75, -0.6] },
      { assetId: 'wp-trousse-de-premiers-secours', pos: [0.3, 0.75, -0.6] }
    ]
  },
  {
    id: 'fle-coiffeur',
    number: 19,
    title: 'Au salon de coiffure',
    category: 'Santé & Soins',
    level: 'A2',
    description: 'Expliquer le type de coupe souhaité et échanger avec le coiffeur.',
    dialogue: '— Bonjour, installez-vous confortablement. Que désirez-vous faire aujourd’hui ?\n— J’aimerais rafraîchir ma coupe : couper deux centimètres sur les pointes et désépaissir un peu.\n— Très bien ! On commence par un shampoing doux avec soin ?\n— Oui, avec plaisir.',
    vocabulary: ['le coiffeur', 'la coupe', 'les pointes', 'les ciseaux', 'le shampoing', 'le séchage'],
    grammarFocus: 'Les expressions de quantité et de dimension (couper de deux centimètres, désépaissir).',
    quizQuestion: {
      question: 'Quelle longueur le client souhaite-t-il couper ?',
      options: ['Un centimètre', 'Deux centimètres', 'Dix centimètres'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-miroir-de-boutique', pos: [0, 0, -0.8] },
      { assetId: 'wp-fauteuil-de-conference', pos: [0, 0, 0] },
      { assetId: 'wp-paire-de-ciseaux', pos: [0.4, 0.8, -0.5] },
      { assetId: 'wp-peigne', pos: [0.5, 0.8, -0.5] },
      { assetId: 'wp-seche-cheveux', pos: [-0.4, 0.8, -0.5] }
    ]
  },
  {
    id: 'fle-classe',
    number: 20,
    title: 'Dans la salle de classe française',
    category: 'Éducation & Langue',
    level: 'A1',
    description: 'Suivre les consignes du professeur, poser une question et travailler sur cahier.',
    dialogue: '— Prenez votre cahier et ouvrez-le à la page 15. Qui peut conjuguer le verbe « être » au présent ?\n— Moi Madame ! Je suis, tu es, il est, nous sommes, vous êtes, ils sont !\n— Excellent travail ! Écrivez la règle dans votre cahier avec un stylo plume.',
    vocabulary: ['le tableau', 'le professeur', 'le cahier', 'l’élève', 'la règle', 'écrire'],
    grammarFocus: 'Les verbes d’action en classe (écouter, lever la main, répondre, écrire).',
    quizQuestion: {
      question: 'Quel verbe l’élève conjugue-t-il ?',
      options: ['Le verbe avoir', 'Le verbe être', 'Le verbe aller'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'whiteboard', pos: [0, 0, -1.8] },
      { assetId: 'wp-bureau-d-eleve', pos: [0, 0, -0.3] },
      { assetId: 'wp-chaise-scolaire', pos: [0, 0, 0.4] },
      { assetId: 'wp-cahier-ouvert', pos: [-0.15, 0.75, -0.3] },
      { assetId: 'wp-stylo-plume', pos: [0.18, 0.75, -0.3] },
      { assetId: 'wp-trousse-d-ecole', pos: [0, 0.75, -0.45] }
    ]
  },
  {
    id: 'fle-librairie',
    number: 21,
    title: 'À la librairie / bibliothèque',
    category: 'Éducation & Langue',
    level: 'A2',
    description: 'Chercher un roman francophone, demander conseil au libraire.',
    dialogue: '— Bonjour, je recherche un bon roman facile à lire pour progresser en français.\n— Je vous recommande « Le Petit Prince » de Saint-Exupéry ou une bande dessinée classique comme Tintin.\n— Formidable ! Sont-ils disponibles en rayon ?\n— Oui, dans l’étagère jeunesse juste derrière vous.',
    vocabulary: ['le livre', 'l’auteur', 'le roman', 'le rayon', 'la page', 'l’histoire'],
    grammarFocus: 'Les pronoms relatifs simples (qui, que, où).',
    quizQuestion: {
      question: 'Quel roman célèbre le libraire recommande-t-il ?',
      options: ['Les Misérables', 'Le Petit Prince', 'Madame Bovary'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-devanture-de-librairie', pos: [0, 0, -1.8] },
      { assetId: 'wp-bibliotheque-basse', pos: [-1.2, 0, -0.6] },
      { assetId: 'book', pos: [0, 0.8, -0.4] },
      { assetId: 'wp-classeur-a-anneaux', pos: [0.3, 0.8, -0.4] }
    ]
  },
  {
    id: 'fle-musee',
    number: 22,
    title: 'Au musée d’art / exposition',
    category: 'Culture & Loisirs',
    level: 'B1',
    description: 'Commenter une œuvre d’art, écouter l’audioguide et exprimer son ressenti.',
    dialogue: '— Regarde ce tableau impressionniste ! Les nuances de bleu et la lumière sur l’eau sont saisissantes.\n— En effet, l’artiste a peint ce paysage en plein air à la fin du dix-neuvième siècle.\n— Écoutons les commentaires de l’audioguide pour comprendre sa technique.',
    vocabulary: ['le chef-d’œuvre', 'le peintre', 'la toile', 'l’exposition', 'le paysage', 'la couleur'],
    grammarFocus: 'L’expression des sentiments et jugements esthétiques (magnifique, surprenant, touchant).',
    quizQuestion: {
      question: 'À quel mouvement artistique appartient le tableau commenté ?',
      options: ['Le cubisme', 'L’impressionnisme', 'Le surréalisme'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-chevalet-de-peintre', pos: [0, 0, -0.5] },
      { assetId: 'wp-toile-encadree', pos: [0, 1.1, -0.45] },
      { assetId: 'wp-socle-d-exposition', pos: [1.2, 0, -0.5] },
      { assetId: 'pedestal', pos: [-1.2, 0, -0.5] },
      { assetId: 'audio', pos: [1.2, 0.8, -0.5] }
    ]
  },
  {
    id: 'fle-mode',
    number: 23,
    title: 'Dans une boutique de prêt-à-porter',
    category: 'Commerces & Alimentation',
    level: 'A2',
    description: 'Essayer un vêtement, demander une autre taille ou une autre couleur.',
    dialogue: '— Bonjour, j’aime beaucoup cette veste en vitrine. L’avez-vous en taille 40 ?\n— Oui, la voici en noir et en bleu marine.\n— Puis-je l’essayer ? Où sont les cabines d’essayage ?\n— Les cabines sont au fond du magasin à côté du miroir.',
    vocabulary: ['le vêtement', 'la taille', 'la cabine d’essayage', 'essayer', 'la veste', 'le miroir'],
    grammarFocus: 'Les pronoms compléments d’objet direct (l’essayer, la prendre).',
    quizQuestion: {
      question: 'Quelle taille de veste le client demande-t-il ?',
      options: ['Taille 36', 'Taille 40', 'Taille 44'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-portant-a-vetements', pos: [-0.8, 0, -0.6] },
      { assetId: 'wp-cintre', pos: [-0.8, 1.3, -0.6] },
      { assetId: 'wp-cabine-d-essayage', pos: [1, 0, -0.6] },
      { assetId: 'wp-miroir-de-boutique', pos: [0.1, 0, -1] }
    ]
  },
  {
    id: 'fle-pique-nique',
    number: 24,
    title: 'Le pique-nique au parc',
    category: 'Culture & Loisirs',
    level: 'A1',
    description: 'Partager un déjeuner champêtre entre amis sur l’herbe d’un jardin public.',
    dialogue: '— Quelle belle journée ensoleillée ! Posons la nappe à l’ombre de cet arbre.\n— J’ai apporté une baguette croustillante, du fromage de chèvre et des fruits frais.\n— Je sors les verres et la bouteille d’eau fraîche. Bon appétit tout le monde !',
    vocabulary: ['le parc', 'l’arbre', 'la nappe', 'le panier', 'l’ombre', 'partager'],
    grammarFocus: 'Les expressions de la météo (il fait beau, il y a du soleil).',
    quizQuestion: {
      question: 'Où les amis choisissent-ils de s’installer ?',
      options: ['En plein soleil', 'À l’ombre d’un arbre', 'Sur un banc sous la pluie'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'tree', pos: [-1.4, 0, -1] },
      { assetId: 'bench', pos: [1.2, 0, -0.6] },
      { assetId: 'wp-panier-de-pique-nique', pos: [0, 0.05, 0] },
      { assetId: 'wp-baguette', pos: [0.3, 0.08, 0.1] },
      { assetId: 'wp-part-de-fromage', pos: [-0.25, 0.08, 0.1] },
      { assetId: 'wp-verre-a-eau', pos: [0.15, 0.08, -0.2] }
    ]
  },
  {
    id: 'fle-petanque',
    number: 25,
    title: 'La partie de pétanque',
    category: 'Culture & Loisirs',
    level: 'A2',
    description: 'Apprendre les règles du jeu provençal, pointer ou tirer près du cochonnet.',
    dialogue: '— C’est à qui de jouer ?\n— C’est à toi ! Tu tires ou tu pointes ?\n— Je vais pointer pour me rapprocher du cochonnet... Regarde, ma boule est à cinq centimètres !\n— Bien joué, tu as le point !',
    vocabulary: ['la pétanque', 'la boule', 'le cochonnet', 'pointer', 'tirer', 'avoir le point'],
    grammarFocus: 'L’alternative avec « ou bien » et le vocabulaire du sport convivial.',
    quizQuestion: {
      question: 'Que décide de faire le joueur lors de son lancer ?',
      options: ['Il tire', 'Il pointe', 'Il passe son tour'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'bench', pos: [-1.4, 0, -0.8] },
      { assetId: 'tree', pos: [1.5, 0, -1] },
      { assetId: 'wp-cochonnet', pos: [0, 0.02, 0] },
      { assetId: 'wp-boule-de-petanque', pos: [0.08, 0.04, 0.06] },
      { assetId: 'wp-boule-de-petanque', pos: [-0.25, 0.04, -0.1] },
      { assetId: 'wp-beret', pos: [-1.2, 0.45, -0.8] }
    ]
  },
  {
    id: 'fle-petit-dejeuner',
    number: 26,
    title: 'Le petit-déjeuner à la française',
    category: 'Quotidien & Gastronomie',
    level: 'A1',
    description: 'Nommer les aliments du matin : café au lait, tartines beurrées et confiture.',
    dialogue: '— Qu’aimes-tu manger le matin pour le petit-déjeuner ?\n— J’adore tremper un croissant chaud dans mon grand bol de café au lait.\n— Et avec ceci, une tartine de baguette avec du bon beurre et de la confiture de fraise !',
    vocabulary: ['le petit-déjeuner', 'le bol', 'la tartine', 'le beurre', 'la confiture', 'le café au lait'],
    grammarFocus: 'Les verbes de goût (aimer, adorer, préférer) + article défini.',
    quizQuestion: {
      question: 'Dans quoi le locuteur trempe-t-il son croissant ?',
      options: ['Dans un jus d’orange', 'Dans un bol de café au lait', 'Dans un verre d’eau'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'coffee-table', pos: [0, 0, 0] },
      { assetId: 'wp-bol-a-dejeuner', pos: [-0.2, 0.42, 0] },
      { assetId: 'wp-croissant', pos: [0.2, 0.42, 0.1] },
      { assetId: 'wp-plaquette-de-beurre', pos: [0.2, 0.42, -0.15] },
      { assetId: 'wp-pot-de-miel', pos: [-0.15, 0.42, -0.15] },
      { assetId: 'wp-brique-de-lait', pos: [-0.4, 0.42, 0] }
    ]
  },
  {
    id: 'fle-recette-cuisine',
    number: 27,
    title: 'L’atelier recette de cuisine',
    category: 'Quotidien & Gastronomie',
    level: 'B1',
    description: 'Suivre une recette pas à pas : émincer, cuire, assaisonner et mijoter.',
    dialogue: '— Pour commencer notre ratatouille, éminçons finement l’oignon et deux gousses d’ail.\n— Faisons-les revenir à feu doux dans une poêle avec de l’huile d’olive.\n— Ajoutons ensuite les courgettes coupées en dés et le bouquet garni. Laissons mijoter 30 minutes.',
    vocabulary: ['émincer', 'la poêle', 'l’huile d’olive', 'mijoter', 'assaisonner', 'la recette'],
    grammarFocus: 'Les verbes d’action culinaire à l’impératif pluriel (éminçons, ajoutons).',
    quizQuestion: {
      question: 'Combien de temps faut-il laisser mijoter la préparation ?',
      options: ['5 minutes', '30 minutes', '2 heures'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-planche-a-decouper', pos: [-0.4, 0.9, 0] },
      { assetId: 'wp-couteau-de-chef', pos: [-0.15, 0.9, 0.15] },
      { assetId: 'wp-poele', pos: [0.35, 0.9, 0] },
      { assetId: 'wp-oignon-jaune', pos: [-0.4, 0.93, 0] },
      { assetId: 'wp-gousse-d-ail', pos: [-0.55, 0.93, 0] },
      { assetId: 'wp-courgette', pos: [-0.3, 0.9, -0.2] },
      { assetId: 'wp-bouquet-garni', pos: [0.1, 0.9, -0.2] }
    ]
  },
  {
    id: 'fle-fete-14juillet',
    number: 28,
    title: 'La fête nationale du 14 Juillet',
    category: 'Culture & Loisirs',
    level: 'B1',
    description: 'Célébrer la fête républicaine avec musique, lampions et feux d’artifice.',
    dialogue: '— Ce soir à 23 heures, le feu d’artifice sera tiré depuis le pont !\n— Toute la place est pavoisée de drapeaux tricolores et de guirlandes festives.\n— Allons danser au bal des pompiers au son de l’accordéon !',
    vocabulary: ['le 14 juillet', 'la fête nationale', 'le drapeau', 'l’accordéon', 'le lampion', 'le bal'],
    grammarFocus: 'Le futur simple de l’indicatif (sera tiré, illuminera, danserons).',
    quizQuestion: {
      question: 'Quel instrument traditionnel anime le bal des pompiers ?',
      options: ['La guitare électrique', 'L’accordéon', 'La trompette'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'wp-drapeau-tricolore-sur-pied', pos: [-1.2, 0, -0.5] },
      { assetId: 'wp-lampion-de-fete', pos: [1.2, 0.5, -0.5] },
      { assetId: 'wp-accordeon', pos: [0, 0.5, 0] },
      { assetId: 'wp-guirlande-de-fanions', pos: [0, 2, -1] }
    ]
  },
  {
    id: 'fle-entretien',
    number: 29,
    title: 'L’entretien d’embauche',
    category: 'Vie professionnelle',
    level: 'B2',
    description: 'Présenter ses qualifications, parcours professionnel et projets futurs.',
    dialogue: '— Bonjour, installez-vous. J’ai lu votre CV avec beaucoup d’intérêt.\n— Merci. J’ai travaillé cinq ans comme chef de projet bilingue.\n— Quelles sont selon vous vos principales forces pour ce poste ?\n— Mon sens de l’organisation, mon esprit d’équipe et mon adaptabilité face aux défis.',
    vocabulary: ['le CV', 'l’entretien', 'les compétences', 'le poste', 'l’expérience', 'l’équipe'],
    grammarFocus: 'L’argumentation professionnelle et l’emploi du subjonctif.',
    quizQuestion: {
      question: 'Combien d’années d’expérience le candidat possède-t-il ?',
      options: ['Deux ans', 'Cinq ans', 'Dix ans'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'meeting-table', pos: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [0, 0, 0.8] },
      { assetId: 'wp-fauteuil-de-conference', pos: [0, 0, -0.8], rot: [0, Math.PI, 0] },
      { assetId: 'wp-ordinateur-portable', pos: [-0.2, 0.76, 0] },
      { assetId: 'wp-porte-documents', pos: [0.4, 0.76, 0] },
      { assetId: 'wp-badge-de-participant', pos: [0.2, 0.76, 0.2] }
    ]
  },
  {
    id: 'fle-pause-cafe',
    number: 30,
    title: 'La pause café en entreprise',
    category: 'Vie professionnelle',
    level: 'A2',
    description: 'Discuter de manière informelle entre collègues autour de la machine à café.',
    dialogue: '— Salut Thomas ! Tu as passé un bon week-end ?\n— Très sympa ! Je suis allé visiter un château en famille. Et toi ?\n— Repos et jardinage. Tu reprends un café ?\n— Oui, je veux bien, avec un nuage de lait s’il te plaît.',
    vocabulary: ['la pause café', 'le collègue', 'le week-end', 'l’ambiance', 'discuter', 'le travail'],
    grammarFocus: 'Le tutoiement informel et le passé composé (« Tu as passé », « Je suis allé »).',
    quizQuestion: {
      question: 'Qu’a fait Thomas pendant son week-end ?',
      options: ['Il a travaillé au bureau', 'Il a visité un château en famille', 'Il a voyagé à l’étranger'],
      answer: 'B'
    },
    assetPlacements: [
      { assetId: 'coffee-machine', pos: [0, 0.9, -0.5] },
      { assetId: 'wp-table-haute-de-reunion', pos: [0, 0, 0.4] },
      { assetId: 'wp-tabouret-haut', pos: [-0.5, 0, 0.4] },
      { assetId: 'wp-tabouret-haut', pos: [0.5, 0, 0.4] },
      { assetId: 'wp-mug', pos: [-0.15, 1.1, 0.4] },
      { assetId: 'wp-mug', pos: [0.15, 1.1, 0.4] },
      { assetId: 'partition', pos: [-1.4, 0, 0] }
    ]
  }
];

export function getFLEScene(idOrNumber: string | number): FLEScene | undefined {
  if (typeof idOrNumber === 'number') {
    return fleScenes.find(s => s.number === idOrNumber);
  }
  const norm = idOrNumber.toLowerCase().trim();
  return fleScenes.find(s => s.id === norm || s.title.toLowerCase().includes(norm));
}
