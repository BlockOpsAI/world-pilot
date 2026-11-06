// src/library/forestMushroomForaging.ts
// Scénario haute-fidélité déterministe : Clairière forestière & Cueillette de champignons.
// Environnement extérieur naturel immersif : sol de terre moussue riche en humus avec feuilles d'automne,
// grand chênes protecteurs, cèpes de Bordeaux comestibles (Boletus edulis), amanite tue-mouches toxique
// (Amanita muscaria), panier traditionnel en osier tressé et guide illustré de mycologie de terrain avec loupe.

import type { WorldPatch, EntitySpec, RuleSpec, QuestSpec, Invariant } from '../core/types';

export const FORAGING_QUEST: QuestSpec = {
  id: 'quest_cueillette_champignons',
  title: 'Mission : Cueillette Sécurisée en Forêt',
  description: 'Apprenez à identifier les champignons comestibles et à éviter les espèces toxiques mortelles.',
  category: 'nature',
  currentStepIndex: 0,
  status: 'in_progress',
  rewardSound: 'fanfare',
  steps: [
    {
      id: 'step_consult_guide',
      title: 'Consulter le guide de mycologie',
      description: 'Observez la clé dichotomique d’identification (tubes sous chapeau vs lamelles avec anneau et volve).',
      targetEntityId: 'forest_mycology_guide',
      requiredEvent: 'INTERACT',
      completed: false,
      hint: 'Cliquez sur le guide ouvert et sa loupe en laiton au premier plan.'
    },
    {
      id: 'step_harvest_cepe',
      title: 'Récolter le Cèpe de Bordeaux comestible',
      description: 'Ramassez le magnifique cèpe adulte (Boletus edulis) pour le déposer dans votre panier d’osier.',
      targetEntityId: 'forest_cepe_adult',
      requiredEvent: 'INTERACT',
      completed: false,
      hint: 'Cliquez sur le cèpe ventru au chapeau châtain sur le tapis de mousse à gauche.'
    },
    {
      id: 'step_identify_toxic_amanita',
      title: 'Signaler l’Amanite tue-mouches toxique',
      description: 'Examinez l’amanite rouge à points blancs pour confirmer sa toxicité et la laisser en forêt.',
      targetEntityId: 'forest_amanita',
      requiredEvent: 'INTERACT',
      completed: false,
      hint: 'Cliquez sur l’amanite écarlate à pustules blanches à droite pour valider son identification.'
    }
  ]
};

export const FORAGING_RULES: RuleSpec[] = [
  {
    id: 'rule_guide_inspect',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: 'forest_mycology_guide' }],
    actions: [
      { type: 'set_flag', flag: 'guide_consulted', value: true },
      { type: 'play_sound', sound: 'paper_turn' },
      {
        type: 'show_warning',
        message: '📖 Guide mycologique ouvert : Le Cèpe (Boletus edulis) possède des TUBES spongieux sous le chapeau et un pied ventru réticulé. L’Amanite possède des LAMELLES blanches, un anneau et une volve. DANGER TOXIQUE !'
      }
    ]
  },
  {
    id: 'rule_cepe_harvest',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: 'forest_cepe_adult' }],
    actions: [
      { type: 'set_flag', flag: 'cepe_harvested', value: true },
      { type: 'play_sound', sound: 'impact_wood' },
      {
        type: 'show_warning',
        message: '🧺 Excellent choix ! Cèpe de Bordeaux récolté. Chair blanche, ferme, odeur de noisette des bois. Parfait pour une poêlée persillée.'
      }
    ]
  },
  {
    id: 'rule_cepe_button_harvest',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: 'forest_cepe_button' }],
    actions: [
      { type: 'set_flag', flag: 'cepe_button_harvested', value: true },
      { type: 'play_sound', sound: 'impact_wood' },
      {
        type: 'show_warning',
        message: '🍄 Jeune bouchon de cèpe récolté ! D’une fermeté exceptionnelle.'
      }
    ]
  },
  {
    id: 'rule_cepe_basket_drop',
    trigger: 'DROP',
    conditions: [
      { type: 'is_source', sourceId: 'forest_cepe_adult' },
      { type: 'is_target', targetId: 'forest_wicker_basket' }
    ],
    actions: [
      { type: 'set_flag', flag: 'cepe_harvested', value: true },
      { type: 'play_sound', sound: 'impact_wood' },
      {
        type: 'show_warning',
        message: '🧺 Cèpe de Bordeaux déposé avec soin dans le panier en osier !'
      }
    ]
  },
  {
    id: 'rule_amanita_inspect',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: 'forest_amanita' }],
    actions: [
      { type: 'set_flag', flag: 'amanita_identified', value: true },
      { type: 'play_sound', sound: 'countdown_beep' },
      {
        type: 'show_warning',
        message: '⚠️ ATTENTION TOXIQUE : Amanite tue-mouches (Amanita muscaria). Chapeau rouge à pustules, lamelles blanches, anneau et volve. À NE PAS CUEILLIR !'
      }
    ]
  },
  {
    id: 'rule_amanita_basket_drop',
    trigger: 'DROP',
    conditions: [
      { type: 'is_source', sourceId: 'forest_amanita' },
      { type: 'is_target', targetId: 'forest_wicker_basket' }
    ],
    actions: [
      { type: 'set_flag', flag: 'amanita_in_basket', value: true },
      { type: 'play_sound', sound: 'countdown_beep' },
      {
        type: 'show_warning',
        message: '🚫 DANGER MORTEL : Ne déposez jamais une Amanite tue-mouches dans le panier de récolte !'
      }
    ]
  }
];

export const FORAGING_INVARIANTS: Invariant[] = [
  {
    id: 'inv_no_toxic_mushroom',
    description: 'Ne jamais mélanger d’amanite tue-mouches toxique dans le panier alimentaire.',
    condition: {
      type: 'never_state',
      stateFlag: 'amanita_in_basket',
      requiredFlag: 'never_allowed_toxic'
    }
  }
];

export function createForestMushroomForagingPatch(existingEntities: Record<string, EntitySpec> = {}): WorldPatch {
  const entitiesCreated: EntitySpec[] = [
    // 1. Sol forestier moussé & clairière ondulante (Élément statique ancré)
    {
      id: 'forest_ground',
      name: 'Sol forestier & Clairière moussée',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'collider' },
        { type: 'static' }
      ],
      visuals: {
        assetId: 'wp-sol-forestier',
        shape: 'box',
        color: '#365314'
      }
    },

    // 2. Grand chêne pédonculé majestueux en arrière-plan gauche (Élément statique ancré)
    {
      id: 'forest_oak_1',
      name: 'Grand chêne de sous-bois (Canopée)',
      capabilities: [
        { type: 'transform', position: { x: -2.8, y: 0, z: -2.4 }, rotation: { x: 0, y: 0.35, z: 0 }, scale: { x: 1.25, y: 1.25, z: 1.25 } },
        { type: 'collider' },
        { type: 'static' }
      ],
      visuals: {
        assetId: 'wp-chene-forestier'
      }
    },

    // 3. Chêne centenaire de lisière en arrière-plan droit (Élément statique ancré)
    {
      id: 'forest_oak_2',
      name: 'Chêne centenaire de lisière',
      capabilities: [
        { type: 'transform', position: { x: 3.1, y: 0, z: -1.9 }, rotation: { x: 0, y: -0.5, z: 0 }, scale: { x: 1.15, y: 1.15, z: 1.15 } },
        { type: 'collider' },
        { type: 'static' }
      ],
      visuals: {
        assetId: 'wp-chene-forestier'
      }
    },

    // 4. Tronc d’arbre moussé couché avec polypores étagés (Élément statique ancré)
    {
      id: 'forest_mossy_log',
      name: 'Tronc couché moussé & Polypores',
      capabilities: [
        { type: 'transform', position: { x: 1.8, y: 0.12, z: -0.8 }, rotation: { x: 0, y: 0.38, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'collider' },
        { type: 'static' }
      ],
      visuals: {
        assetId: 'wp-tronc-mousse'
      }
    },

    // 5. Fougères de sous-bois (Éléments statiques ancrés)
    {
      id: 'forest_fern_1',
      name: 'Fougère aigle de sous-bois',
      capabilities: [
        { type: 'transform', position: { x: -1.7, y: 0, z: 1.2 }, rotation: { x: 0, y: 0.75, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'collider' },
        { type: 'static' }
      ],
      visuals: {
        assetId: 'wp-fougere-sous-bois'
      }
    },
    {
      id: 'forest_fern_2',
      name: 'Touffe de fougères fraîches',
      capabilities: [
        { type: 'transform', position: { x: 2.2, y: 0, z: 1.3 }, rotation: { x: 0, y: -0.45, z: 0 }, scale: { x: 0.95, y: 0.95, z: 0.95 } },
        { type: 'collider' },
        { type: 'static' }
      ],
      visuals: {
        assetId: 'wp-fougere-sous-bois'
      }
    },

    // 6. Cèpe de Bordeaux adulte (Boletus edulis) comestible (Manipulable & Récoltable)
    {
      id: 'forest_cepe_adult',
      name: 'Cèpe de Bordeaux (Boletus edulis) · Comestible',
      capabilities: [
        { type: 'transform', position: { x: -0.7, y: 0.08, z: -0.3 }, rotation: { x: 0, y: 0.25, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        {
          type: 'educational',
          text: 'Cèpe de Bordeaux (Boletus edulis) : Tubes fins blanc-crème puis vert-olive, stipe ventru à réseau blanc. Excellent comestible.'
        }
      ],
      visuals: {
        assetId: 'wp-cepe-de-bordeaux'
      }
    },

    // 7. Bouchon de Cèpe jeune très ferme (Manipulable & Récoltable)
    {
      id: 'forest_cepe_button',
      name: 'Bouchon de Cèpe jeune · Très ferme',
      capabilities: [
        { type: 'transform', position: { x: -0.42, y: 0.06, z: -0.45 }, rotation: { x: 0.08, y: -0.35, z: 0.05 }, scale: { x: 0.85, y: 0.85, z: 0.85 } },
        { type: 'draggable' },
        { type: 'collider' },
        {
          type: 'educational',
          text: 'Jeune cèpe bouchon : chapeau hémisphérique compact et chair croquante.'
        }
      ],
      visuals: {
        assetId: 'wp-cepe-de-bordeaux'
      }
    },

    // 8. Amanite tue-mouches (Amanita muscaria) toxique (Manipulable & Identifiable)
    {
      id: 'forest_amanita',
      name: 'Amanite tue-mouches (Amanita muscaria) · Toxique !',
      capabilities: [
        { type: 'transform', position: { x: 1.15, y: 0.08, z: -0.35 }, rotation: { x: 0, y: -0.3, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        {
          type: 'educational',
          text: 'Amanite tue-mouches : Chapeau rouge vif à pustules blanches, lamelles blanches libres, anneau et volve. TOXIQUE !'
        }
      ],
      visuals: {
        assetId: 'wp-amanite-tue-mouches'
      }
    },

    // 9. Panier en osier tressé de cueillette avec doublure lin (Support & Contenant de récolte)
    {
      id: 'forest_wicker_basket',
      name: 'Panier de cueillette en osier tressé',
      capabilities: [
        { type: 'transform', position: { x: 0.55, y: 0.15, z: 0.45 }, rotation: { x: 0, y: -0.25, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        {
          type: 'educational',
          text: 'Panier en osier traditionnel : panier ajouré permettant la respiration des champignons et la dissémination des spores lors de la marche.'
        }
      ],
      visuals: {
        assetId: 'wp-panier-cueillette'
      }
    },

    // 10. Guide d’identification mycologique relié cuir avec loupe en laiton optique
    {
      id: 'forest_mycology_guide',
      name: 'Guide d’identification mycologique & Loupe',
      capabilities: [
        { type: 'transform', position: { x: -0.05, y: 0.1, z: 0.6 }, rotation: { x: 0, y: 0.12, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        {
          type: 'educational',
          text: 'Guide de terrain de la Société Mycologique : Planches comparatives Boletus vs Amanita, critères anatomiques essentiels.'
        }
      ],
      visuals: {
        assetId: 'wp-guide-mycologie'
      }
    }
  ];

  return {
    entitiesRemoved: Object.keys(existingEntities),
    entitiesCreated,
    rulesChanged: FORAGING_RULES,
    invariantsAdded: FORAGING_INVARIANTS,
    questsAdded: [FORAGING_QUEST],
    activeQuestId: FORAGING_QUEST.id
  };
}
