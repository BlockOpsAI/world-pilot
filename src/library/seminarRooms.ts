import type { WorldPatch, EntitySpec, RuleSpec, QuestSpec } from '../core/types';
import { getAsset } from './catalog';

export interface SeminarRoom {
  id: string;
  number: number;
  title: string;
  category: 'Direction & Conseil' | 'Conférence & Assemblée' | 'Créativité & Design Sprint' | 'Négociation & Pitch' | 'Formation & Ateliers' | 'Espaces Collaboratifs';
  capacity: number;
  description: string;
  equipment: { name: string; quantity: string; assetId: string }[];
  keyFeatures: string[];
  layoutDescription: string;
  facilitatorTips: string;
  quizQuestion: { question: string; options: string[]; answer: 'A' | 'B' | 'C' };
  assetPlacements: { assetId: string; pos: [number, number, number]; rot?: [number, number, number]; scale?: [number, number, number]; text?: string }[];
}

export const seminarRooms: SeminarRoom[] = [
  {
    id: 'seminar-boardroom',
    number: 1,
    title: 'Salle du Conseil d’Administration (Executive Boardroom)',
    category: 'Direction & Conseil',
    capacity: 10,
    description: 'Espace décisionnel haut de gamme avec table ovale en noyer, fauteuils de direction en cuir, écran de visioconférence 4K et pieuvre téléphonique.',
    equipment: [
      { name: 'Table de réunion en bois', quantity: '1 unité centrale', assetId: 'meeting-table' },
      { name: 'Fauteuils de bureau ergonomiques', quantity: '6 unités', assetId: 'office-chair' },
      { name: 'Écran mural de visioconférence', quantity: '1 écran 4K', assetId: 'wall-screen' },
      { name: 'Pieuvre de conférence téléphonique', quantity: '1 unité', assetId: 'wp-telephone-de-conference' },
      { name: 'Ordinateur portable président', quantity: '2 laptops', assetId: 'wp-ordinateur-portable' },
      { name: 'Organiseurs de bureau & dossiers', quantity: '2 unités', assetId: 'wp-organiseur-de-bureau' },
      { name: 'Horloge murale', quantity: '1 unité', assetId: 'wp-horloge-murale' },
    ],
    keyFeatures: [
      'Disposition formelle face à l’écran de visioconférence',
      'Système audio omnidirectionnel centralisé',
      'Ergonomie posturale adaptée aux sessions stratégiques de 3h+',
      'Vue dégagée pour tous les participants vers les indicateurs clés'
    ],
    layoutDescription: 'Grande table de réunion axée au centre avec 6 fauteuils répartis symétriquement (3 de chaque côté), l’écran mural en fond de salle, et les équipements de visioconférence au centre du plateau.',
    facilitatorTips: 'Placez le président ou le facilitateur en bout de table face à l’écran pour maintenir le contact visuel avec les participants distants et présents.',
    quizQuestion: {
      question: 'Dans une salle de conseil (boardroom), quelle est la disposition optimale pour le système de captation audio ?',
      options: [
        'Au centre géométrique de la table pour une couverture omnidirectionnelle équilibrée',
        'Contre le mur du fond sous l’écran',
        'À côté du président de séance uniquement'
      ],
      answer: 'A'
    },
    assetPlacements: [
      // Central conference table
      { assetId: 'meeting-table', pos: [0, 0, 0] },
      // Visioconference wall screen
      { assetId: 'wall-screen', pos: [0, 1.2, -2.4] },
      // Conference phone in the center of the table
      { assetId: 'wp-telephone-de-conference', pos: [0, 0.76, 0] },
      // Laptops on table
      { assetId: 'wp-ordinateur-portable', pos: [-0.8, 0.76, -0.2], rot: [0, 0.2, 0] },
      { assetId: 'wp-ordinateur-portable', pos: [0.8, 0.76, 0.2], rot: [0, -3.0, 0] },
      // Desk organizers & notes
      { assetId: 'wp-organiseur-de-bureau', pos: [-1.1, 0.76, 0.2] },
      { assetId: 'wp-bloc-de-notes-adhesives', pos: [0.4, 0.76, -0.2] },
      { assetId: 'wp-porte-documents', pos: [1.1, 0.76, -0.2] },
      // Chairs along the table (north side)
      { assetId: 'office-chair', pos: [-0.9, 0, -0.85], rot: [0, 0, 0] },
      { assetId: 'office-chair', pos: [0, 0, -0.85], rot: [0, 0, 0] },
      { assetId: 'office-chair', pos: [0.9, 0, -0.85], rot: [0, 0, 0] },
      // Chairs along the table (south side)
      { assetId: 'office-chair', pos: [-0.9, 0, 0.85], rot: [0, Math.PI, 0] },
      { assetId: 'office-chair', pos: [0, 0, 0.85], rot: [0, Math.PI, 0] },
      { assetId: 'office-chair', pos: [0.9, 0, 0.85], rot: [0, Math.PI, 0] },
      // Decorative planter & acoustic partition
      { assetId: 'planter', pos: [2.2, 0, -1.8] },
      { assetId: 'partition', pos: [-2.2, 0, 0], rot: [0, Math.PI / 2, 0] },
    ]
  },
  {
    id: 'seminar-amphitheater',
    number: 2,
    title: 'Auditorium & Conférence Plénière (Town Hall / Keynote)',
    category: 'Conférence & Assemblée',
    capacity: 25,
    description: 'Configuration magistrale pour assemblées générales, keynotes et restitutions de séminaires avec estrade, pupitre de conférence et écran géant déroulant.',
    equipment: [
      { name: 'Pupitre de présentation avec micro', quantity: '1 estrade', assetId: 'presentation' },
      { name: 'Écran de projection déroulant', quantity: '1 écran géant', assetId: 'wp-ecran-de-projection-deroulant' },
      { name: 'Vidéoprojecteur HD', quantity: '1 unité', assetId: 'wp-videoprojecteur' },
      { name: 'Enceinte de sonorisation de conférence', quantity: '2 colonnes', assetId: 'wp-enceinte-de-conference' },
      { name: 'Fauteuils de conférence alignés', quantity: '8 unités', assetId: 'wp-fauteuil-de-conference' },
      { name: 'Badges de participants', quantity: '1 lot', assetId: 'wp-badge-de-participant' },
    ],
    keyFeatures: [
      'Hiérarchisation orateur / auditoire pour un impact d’écoute maximal',
      'Acoustique renforcée par colonnes d’amplification stéréo',
      'Zone de projection grand format visible depuis tous les rangs',
      'Allées de circulation dégagées pour les sessions de questions/réponses'
    ],
    layoutDescription: 'Pupitre d’orateur sur l’aile droite de l’estrade avec écran de projection central. Deux rangées de fauteuils de conférence orientées vers la scène.',
    facilitatorTips: 'Pensez à faire tester le microphone du pupitre et le retour écran 15 minutes avant l’ouverture des portes pour éviter tout délai technique.',
    quizQuestion: {
      question: 'Quel est l’élément architectural essentiel pour garantir l’accessibilité dans un auditorium de séminaire ?',
      options: [
        'Une allée centrale d’au moins 1,20 m permettant le passage de fauteuils roulants',
        'Une estrade surélevée de plus de 1,50 m',
        'Des micros suspendus au plafond uniquement'
      ],
      answer: 'A'
    },
    assetPlacements: [
      // Projection screen & speaker columns on stage
      { assetId: 'wp-ecran-de-projection-deroulant', pos: [0, 0, -2.6] },
      { assetId: 'presentation', pos: [1.5, 0, -2.0], rot: [0, -0.3, 0] },
      { assetId: 'wp-enceinte-de-conference', pos: [-2.0, 0, -2.4] },
      { assetId: 'wp-enceinte-de-conference', pos: [2.2, 0, -2.4] },
      // Projector on table/stand in center
      { assetId: 'wp-videoprojecteur', pos: [0, 1.0, 0.4] },
      // Row 1 of audience chairs
      { assetId: 'wp-fauteuil-de-conference', pos: [-1.4, 0, -0.8], rot: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [-0.5, 0, -0.8], rot: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [0.5, 0, -0.8], rot: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [1.4, 0, -0.8], rot: [0, 0, 0] },
      // Row 2 of audience chairs
      { assetId: 'wp-fauteuil-de-conference', pos: [-1.4, 0, 1.4], rot: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [-0.5, 0, 1.4], rot: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [0.5, 0, 1.4], rot: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [1.4, 0, 1.4], rot: [0, 0, 0] },
      // Badge display on side table
      { assetId: 'wp-badge-de-participant', pos: [2.2, 0.75, 0.2] },
    ]
  },
  {
    id: 'seminar-brainstorming',
    number: 3,
    title: 'Atelier Design Sprint & Créativité (Innovation Lab)',
    category: 'Créativité & Design Sprint',
    capacity: 8,
    description: 'Espace dynamique agile conçu pour le design thinking, la méthode Scrum et les séances de co-création avec tableau mobile, mange-debout et assises hybrides.',
    equipment: [
      { name: 'Table haute de réunion (mange-debout)', quantity: '1 unité', assetId: 'wp-table-haute-de-reunion' },
      { name: 'Tabourets hauts réglables', quantity: '4 unités', assetId: 'wp-tabouret-haut' },
      { name: 'Tableau blanc mobile sur roulettes', quantity: '2 tableaux', assetId: 'mobile-board' },
      { name: 'Blocs de notes adhésives (Post-it)', quantity: '3 blocs', assetId: 'wp-bloc-de-notes-adhesives' },
      { name: 'Canapé lounge de réflexion', quantity: '1 banquette', assetId: 'sofa' },
      { name: 'Jardinière végétale', quantity: '1 bac', assetId: 'planter' },
    ],
    keyFeatures: [
      'Alternance naturelle position debout / assis pour dynamiser l’énergie collective',
      'Surface de canevas et d’écriture effaçable à 360°',
      'Post-its colorés pour voter et catégoriser les hypothèses (dot voting)',
      'Coin détente propice à la maturation des idées divergentes'
    ],
    layoutDescription: 'Table haute centrale avec tabourets hauts, encadrée de deux tableaux blancs mobiles. Espace lounge latéral avec canapé confortable et végétation.',
    facilitatorTips: 'Encouragez les participants à se lever dès la phase d’idéation : la posture debout augmente de 30 % la participation active selon les études cognitives.',
    quizQuestion: {
      question: 'En méthodologie Design Sprint, quel est le rôle principal d’une table haute sans fauteuils fixes ?',
      options: [
        'Maintenir un niveau d’engagement élevé et faciliter le déplacement rapide vers les tableaux d’affichage',
        'Éviter d’avoir à ranger la pièce à la fin de la séance',
        'Empêcher les participants d’ouvrir leurs ordinateurs portables'
      ],
      answer: 'A'
    },
    assetPlacements: [
      // Central high standing table
      { assetId: 'wp-table-haute-de-reunion', pos: [0, 0, 0] },
      // High stools around standing table
      { assetId: 'wp-tabouret-haut', pos: [-0.65, 0, 0] },
      { assetId: 'wp-tabouret-haut', pos: [0.65, 0, 0] },
      { assetId: 'wp-tabouret-haut', pos: [0, 0, -0.65] },
      { assetId: 'wp-tabouret-haut', pos: [0, 0, 0.65] },
      // Post-its on high table
      { assetId: 'wp-bloc-de-notes-adhesives', pos: [0.15, 1.1, 0.1] },
      { assetId: 'wp-bloc-de-notes-adhesives', pos: [-0.2, 1.1, -0.1] },
      // Mobile whiteboards on wheels for sprint maps
      { assetId: 'mobile-board', pos: [-2.0, 0, -0.8], rot: [0, 0.4, 0] },
      { assetId: 'mobile-board', pos: [2.0, 0, -0.8], rot: [0, -0.4, 0] },
      // Lounge sofa for reflection & breakout discussions
      { assetId: 'sofa', pos: [0, 0, 2.4], rot: [0, Math.PI, 0] },
      // Bio-plants to reduce stress
      { assetId: 'planter', pos: [-2.2, 0, 2.0] },
      { assetId: 'planter', pos: [2.2, 0, 2.0] },
    ]
  },
  {
    id: 'seminar-pitch',
    number: 4,
    title: 'Salle de Démo & Pitch Investisseurs (Client Showcase)',
    category: 'Négociation & Pitch',
    capacity: 6,
    description: 'Cadre feutré et percutant pour présenter des offres stratégiques, lever des fonds ou sceller un partenariat avec projection interactive et graphiques 3D.',
    equipment: [
      { name: 'Écran mural de démonstration', quantity: '1 écran OLED', assetId: 'wall-screen' },
      { name: 'Graphique 3D d’évolution des KPIs', quantity: '1 modèle', assetId: 'bar-chart' },
      { name: 'Bureau individuel de pitch', quantity: '1 poste', assetId: 'wp-bureau-individuel' },
      { name: 'Moniteur sur pied & caméra HD', quantity: '1 écran', assetId: 'wp-moniteur-sur-pied' },
      { name: 'Clavier & souris de contrôle', quantity: '1 ensemble', assetId: 'wp-clavier-informatique' },
      { name: 'Fauteuils de conférence VIP', quantity: '4 unités', assetId: 'wp-fauteuil-de-conference' },
      { name: 'Cloisons acoustiques d’intimité', quantity: '2 cloisons', assetId: 'partition' },
    ],
    keyFeatures: [
      'Visualisation directe de métriques financières et graphiques 3D en temps réel',
      'Isolation acoustique optimisée pour les négociations confidentielles',
      'Disposition en demi-cercle rapproché renforçant la persuasion',
      'Pupitre de démonstration interactif pour manipuler la démo produit'
    ],
    layoutDescription: 'Écran mural et graphique 3D en fond de scène avec bureau de pilotage. Fauteuils VIP disposés en arc face à la démonstration, clos par des cloisons acoustiques.',
    facilitatorTips: 'Structurez votre pitch en 3 temps : Problème constaté (2 min), Démonstration concrète en 3D (5 min), Modèle économique et appel à l’action (3 min).',
    quizQuestion: {
      question: 'Quelle est la durée recommandée pour la phase d’accroche (hook) lors d’un pitch investisseur en séminaire ?',
      options: [
        '30 à 60 secondes pour capter immédiatement l’attention sur le problème',
        'Au moins 15 minutes pour détailler tout le CV de l’équipe',
        'Aucune accroche, il faut débuter directement par le bilan financier'
      ],
      answer: 'A'
    },
    assetPlacements: [
      // Screen & 3D KPI graph
      { assetId: 'wall-screen', pos: [0, 1.2, -2.3] },
      { assetId: 'bar-chart', pos: [1.8, 0, -2.0], rot: [0, -0.3, 0] },
      // Demo presenter desk
      { assetId: 'wp-bureau-individuel', pos: [-1.4, 0, -1.2], rot: [0, 0.4, 0] },
      { assetId: 'wp-moniteur-sur-pied', pos: [-1.4, 0.75, -1.2], rot: [0, 0.4, 0] },
      { assetId: 'wp-clavier-informatique', pos: [-1.3, 0.75, -1.0], rot: [0, 0.4, 0] },
      { assetId: 'wp-souris-informatique', pos: [-1.05, 0.75, -1.0], rot: [0, 0.4, 0] },
      // VIP client chairs facing screen
      { assetId: 'wp-fauteuil-de-conference', pos: [-1.2, 0, 0.8], rot: [0, -0.2, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [-0.4, 0, 0.9], rot: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [0.4, 0, 0.9], rot: [0, 0, 0] },
      { assetId: 'wp-fauteuil-de-conference', pos: [1.2, 0, 0.8], rot: [0, 0.2, 0] },
      // Acoustic side partitions
      { assetId: 'partition', pos: [-2.4, 0, 0], rot: [0, Math.PI / 2, 0] },
      { assetId: 'partition', pos: [2.4, 0, 0], rot: [0, Math.PI / 2, 0] },
    ]
  },
  {
    id: 'seminar-coworking',
    number: 5,
    title: 'Open Space Collaboratif & Hot-Desking (Team Hub)',
    category: 'Espaces Collaboratifs',
    capacity: 12,
    description: 'Espace partagé contemporain pour les sous-groupes de séminaire avec îlots de bureaux en vis-à-vis, séparateurs phoniques et stations de travail complètes.',
    equipment: [
      { name: 'Bureaux individuels jumelés', quantity: '4 unités', assetId: 'wp-bureau-individuel' },
      { name: 'Fauteuils de bureau réglables', quantity: '4 unités', assetId: 'office-chair' },
      { name: 'Moniteurs sur pied professionnels', quantity: '4 écrans', assetId: 'wp-moniteur-sur-pied' },
      { name: 'Claviers & souris ergonomiques', quantity: '4 kits', assetId: 'wp-clavier-informatique' },
      { name: 'Cloisons acoustiques de séparation', quantity: '3 panneaux', assetId: 'partition' },
      { name: 'Porte-documents & corbeilles', quantity: '2 unités', assetId: 'wp-porte-documents' },
    ],
    keyFeatures: [
      'Organisation en îlots de 2x2 favorisant l’émulation d’équipe sans isolement',
      'Écrans de travail haute résolution avec double affichage possible',
      'Séparateurs acoustiques réduisant le brouhaha ambiant',
      'Idéal pour les sessions de travail en sous-commissions ou hackathons'
    ],
    layoutDescription: 'Deux duos de bureaux face-à-face séparés par une cloison acoustique centrale, avec écrans, ordinateurs et fauteuils de bureau ergonomiques.',
    facilitatorTips: 'Pour des ateliers efficaces en sous-groupes, assignez un rôle précis à chaque table (un timekeeper, un scribe, un orateur) et fixez un chrono visible de 45 minutes.',
    quizQuestion: {
      question: 'Dans un open space de travail en sous-groupe, quel est le bénéfice majeur des cloisons acoustiques mobiles ?',
      options: [
        'Réduire les réflexions sonores pour permettre des échanges clairs sans gêner les tables voisines',
        'Rendre les participants totalement invisibles aux yeux du formateur',
        'Supprimer le besoin d’avoir une connexion Wi-Fi'
      ],
      answer: 'A'
    },
    assetPlacements: [
      // Desk pod A (North)
      { assetId: 'wp-bureau-individuel', pos: [-0.8, 0, -0.6], rot: [0, 0, 0] },
      { assetId: 'wp-moniteur-sur-pied', pos: [-0.8, 0.75, -0.75], rot: [0, 0, 0] },
      { assetId: 'wp-clavier-informatique', pos: [-0.8, 0.75, -0.55], rot: [0, 0, 0] },
      { assetId: 'wp-souris-informatique', pos: [-0.55, 0.75, -0.55], rot: [0, 0, 0] },
      { assetId: 'office-chair', pos: [-0.8, 0, -1.3], rot: [0, 0, 0] },

      { assetId: 'wp-bureau-individuel', pos: [0.8, 0, -0.6], rot: [0, 0, 0] },
      { assetId: 'wp-moniteur-sur-pied', pos: [0.8, 0.75, -0.75], rot: [0, 0, 0] },
      { assetId: 'wp-clavier-informatique', pos: [0.8, 0.75, -0.55], rot: [0, 0, 0] },
      { assetId: 'wp-souris-informatique', pos: [1.05, 0.75, -0.55], rot: [0, 0, 0] },
      { assetId: 'office-chair', pos: [0.8, 0, -1.3], rot: [0, 0, 0] },

      // Central divider partition
      { assetId: 'partition', pos: [0, 0, 0], rot: [0, 0, 0] },

      // Desk pod B (South, facing North)
      { assetId: 'wp-bureau-individuel', pos: [-0.8, 0, 0.6], rot: [0, Math.PI, 0] },
      { assetId: 'wp-moniteur-sur-pied', pos: [-0.8, 0.75, 0.75], rot: [0, Math.PI, 0] },
      { assetId: 'wp-clavier-informatique', pos: [-0.8, 0.75, 0.55], rot: [0, Math.PI, 0] },
      { assetId: 'wp-souris-informatique', pos: [-1.05, 0.75, 0.55], rot: [0, Math.PI, 0] },
      { assetId: 'office-chair', pos: [-0.8, 0, 1.3], rot: [0, Math.PI, 0] },

      { assetId: 'wp-bureau-individuel', pos: [0.8, 0, 0.6], rot: [0, Math.PI, 0] },
      { assetId: 'wp-moniteur-sur-pied', pos: [0.8, 0.75, 0.75], rot: [0, Math.PI, 0] },
      { assetId: 'wp-clavier-informatique', pos: [0.8, 0.75, 0.55], rot: [0, Math.PI, 0] },
      { assetId: 'wp-souris-informatique', pos: [0.55, 0.75, 0.55], rot: [0, Math.PI, 0] },
      { assetId: 'office-chair', pos: [0.8, 0, 1.3], rot: [0, Math.PI, 0] },

      // Side accessories
      { assetId: 'wp-porte-documents', pos: [-1.6, 0, 0] },
      { assetId: 'planter', pos: [2.2, 0, 0] },
    ]
  },
  {
    id: 'seminar-training-lab',
    number: 6,
    title: 'Laboratoire de Formation Technique (Hands-on Training Lab)',
    category: 'Formation & Ateliers',
    capacity: 10,
    description: 'Salle pédagogique en U permettant au formateur d’accompagner chaque apprenant individuellement sur poste informatique tout en maintenant une visibilité totale sur l’écran de démonstration.',
    equipment: [
      { name: 'Grande table de conférence en U', quantity: '1 ensemble en U', assetId: 'wp-table-de-conference-en-u' },
      { name: 'Pupitre de formateur', quantity: '1 unité', assetId: 'presentation' },
      { name: 'Tableau blanc mobile de cours', quantity: '1 unité', assetId: 'mobile-board' },
      { name: 'Postes apprenants (moniteurs + claviers)', quantity: '4 postes', assetId: 'wp-moniteur-sur-pied' },
      { name: 'Fauteuils de bureau confort', quantity: '5 unités', assetId: 'office-chair' },
      { name: 'Vidéoprojecteur central', quantity: '1 unité', assetId: 'wp-videoprojecteur' },
    ],
    keyFeatures: [
      'Disposition en fer à cheval (forme en U) garantissant un contact visuel permanent',
      'Espace central libéré permettant au formateur de circuler et d’assister les apprenants',
      'Double support visuel combinant projection numérique et tableau d’explication manuscrite',
      'Idéal pour les formations logicielles, techniques, simulations et certifications'
    ],
    layoutDescription: 'Table en U ouverte vers le pupitre du formateur et le tableau blanc. Les apprenants sont installés sur les 3 ailes avec postes informatiques.',
    facilitatorTips: 'Adoptez la règle des tiers : 1/3 de théorie, 2/3 de manipulation pratique sur les postes de travail pour maximiser la mémorisation procédurale.',
    quizQuestion: {
      question: 'Quel est l’avantage pédagogique principal de la disposition des tables en U par rapport à une salle en rang d’école classique ?',
      options: [
        'Le formateur peut circuler librement au centre pour vérifier les écrans et les apprenants peuvent se voir et débattre',
        'Elle permet de doubler le nombre de places assises dans la même pièce',
        'Elle supprime le besoin de vidéoprojecteur'
      ],
      answer: 'A'
    },
    assetPlacements: [
      // U-shaped conference table
      { assetId: 'wp-table-de-conference-en-u', pos: [0, 0, 0.3] },
      // Trainer lectern & whiteboard at the front
      { assetId: 'presentation', pos: [-1.2, 0, -1.8], rot: [0, 0.3, 0] },
      { assetId: 'mobile-board', pos: [1.0, 0, -2.0], rot: [0, -0.2, 0] },
      // Student workstations on the U-table
      { assetId: 'wp-moniteur-sur-pied', pos: [-1.0, 0.75, 0.0], rot: [0, Math.PI / 2, 0] },
      { assetId: 'wp-clavier-informatique', pos: [-0.85, 0.75, 0.0], rot: [0, Math.PI / 2, 0] },
      { assetId: 'office-chair', pos: [-1.5, 0, 0.0], rot: [0, Math.PI / 2, 0] },

      { assetId: 'wp-moniteur-sur-pied', pos: [1.0, 0.75, 0.0], rot: [0, -Math.PI / 2, 0] },
      { assetId: 'wp-clavier-informatique', pos: [0.85, 0.75, 0.0], rot: [0, -Math.PI / 2, 0] },
      { assetId: 'office-chair', pos: [1.5, 0, 0.0], rot: [0, -Math.PI / 2, 0] },

      { assetId: 'wp-moniteur-sur-pied', pos: [-0.5, 0.75, 1.2], rot: [0, 0, 0] },
      { assetId: 'wp-clavier-informatique', pos: [-0.5, 0.75, 1.05], rot: [0, 0, 0] },
      { assetId: 'office-chair', pos: [-0.5, 0, 1.7], rot: [0, 0, 0] },

      { assetId: 'wp-moniteur-sur-pied', pos: [0.5, 0.75, 1.2], rot: [0, 0, 0] },
      { assetId: 'wp-clavier-informatique', pos: [0.5, 0.75, 1.05], rot: [0, 0, 0] },
      { assetId: 'office-chair', pos: [0.5, 0, 1.7], rot: [0, 0, 0] },

      // Projector on small stand
      { assetId: 'wp-videoprojecteur', pos: [0, 0.9, -0.8] },
    ]
  },
  {
    id: 'seminar-lounge',
    number: 7,
    title: 'Salon Exécutif & Négociation VIP (Executive Lounge)',
    category: 'Direction & Conseil',
    capacity: 6,
    description: 'Espace feutré haut de gamme pour entretiens confidentiels, clôture d’accords bilatéraux et échanges informels de haut niveau avec canapés modulaires et lumière tamisée.',
    equipment: [
      { name: 'Canapés modulaires en tissu', quantity: '2 canapés', assetId: 'sofa' },
      { name: 'Table basse en chêne massif', quantity: '1 unité', assetId: 'coffee-table' },
      { name: 'Lampadaire articulé design', quantity: '1 luminaire', assetId: 'floor-lamp' },
      { name: 'Cloisons acoustiques élégantes', quantity: '2 cloisons', assetId: 'partition' },
      { name: 'Plantes en bacs décoratifs', quantity: '2 bacs', assetId: 'planter' },
      { name: 'Bouteille & verres de rafraîchissement', quantity: '1 service', assetId: 'wp-bouteille-de-vin' },
    ],
    keyFeatures: [
      'Atmosphère chaleureuse réduisant la tension inhérente aux négociations fermes',
      'Assises basses et confortables incitant à des discussions approfondies et sincères',
      'Ambiance lumineuse d’appoint douce et tamisée',
      'Écrin d’insonorisation par feutrine textile et végétation naturelle'
    ],
    layoutDescription: 'Deux grands canapés face-à-face encadrant une table basse en bois. Lampadaire d’angle, cloisons latérales et bacs de verdure créant un cocon intime.',
    facilitatorTips: 'Utilisez cet espace pour les moments de débriefing émotionnel, la résolution de conflits ou la finalisation contractuelle après les plénières formelles.',
    quizQuestion: {
      question: 'Dans une négociation bilatérale, quel est l’impact psychologique d’une disposition en salon lounge par rapport à une table de réunion rectangulaire ?',
      options: [
        'Elle atténue la confrontation frontale et favorise la collaboration et l’écoute empathique',
        'Elle force les parties à signer plus vite par lassitude',
        'Elle remplace obligatoirement les conseillers juridiques'
      ],
      answer: 'A'
    },
    assetPlacements: [
      // Central coffee table
      { assetId: 'coffee-table', pos: [0, 0, 0] },
      // Water / wine bottle on coffee table
      { assetId: 'wp-bouteille-de-vin', pos: [0, 0.42, 0] },
      // Two facing sofas
      { assetId: 'sofa', pos: [0, 0, -1.3], rot: [0, 0, 0] },
      { assetId: 'sofa', pos: [0, 0, 1.3], rot: [0, Math.PI, 0] },
      // Articulated floor lamp on corner
      { assetId: 'floor-lamp', pos: [-1.8, 0, -1.3], rot: [0, 0.6, 0] },
      // Acoustic partition walls creating privacy
      { assetId: 'partition', pos: [1.8, 0, 0], rot: [0, Math.PI / 2, 0] },
      { assetId: 'partition', pos: [-2.2, 0, 0.4], rot: [0, Math.PI / 2, 0] },
      // Lush planters
      { assetId: 'planter', pos: [-1.8, 0, 1.4] },
      { assetId: 'planter', pos: [1.8, 0, -1.4] },
    ]
  },
  {
    id: 'seminar-coffee-break',
    number: 8,
    title: 'Espace Pause-Café, Accueil & Networking (Breakout & Coffee Hub)',
    category: 'Espaces Collaboratifs',
    capacity: 20,
    description: 'Le cœur névralgique de tout séminaire réussi : comptoir d’accueil, machine à espresso professionnelle double-groupe, tables hautes pour le networking informel et fontaine rafraîchissante.',
    equipment: [
      { name: 'Comptoir bar d’accueil & buffet', quantity: '1 comptoir', assetId: 'counter' },
      { name: 'Machine à café professionnelle E61', quantity: '1 machine', assetId: 'coffee-machine' },
      { name: 'Tables hautes mange-debout', quantity: '2 unités', assetId: 'wp-table-haute-de-reunion' },
      { name: 'Tabourets hauts de networking', quantity: '4 unités', assetId: 'wp-tabouret-haut' },
      { name: 'Fontaine en pierre apaisante', quantity: '1 unité', assetId: 'fountain' },
      { name: 'Étagère commerciale de brochures & goodies', quantity: '1 étagère', assetId: 'shelf' },
    ],
    keyFeatures: [
      'Zone de sociabilisation informelle essentielle à la création de liens interpersonnels',
      'Flux de circulation fluide permettant d’accueillir les pauses de 50 à 100 participants',
      'Comptoir barista dédié au rechargement énergétique (caféine, tisanes, viennoiseries)',
      'Atmosphère décontractée propice aux échanges transversaux entre équipes'
    ],
    layoutDescription: 'Grand comptoir d’accueil en fond de salle équipé de la machine à café espresso. Deux tables hautes avec tabourets au centre et une fontaine d’agrément sur le côté.',
    facilitatorTips: 'Prévoyez des pauses d’au moins 25 à 30 minutes : 70 % des idées concrètes et des synergies de séminaire naissent durant les discussions informelles de pause-café.',
    quizQuestion: {
      question: 'Selon les études d’organisation d’événements d’entreprise, pourquoi les pauses café de séminaire doivent-elles durer au minimum 20 à 30 minutes ?',
      options: [
        'Pour laisser le temps aux connexions informelles de se créer après le temps incompressible de service des boissons',
        'Pour permettre aux participants de faire une sieste complète',
        'Pour amortir le coût de la machine à café'
      ],
      answer: 'A'
    },
    assetPlacements: [
      // Buffet counter at the back
      { assetId: 'counter', pos: [0, 0, -2.0] },
      // Commercial espresso machine on counter
      { assetId: 'coffee-machine', pos: [-0.4, 1.05, -2.0] },
      // Merchandising & brochure shelf next to counter
      { assetId: 'shelf', pos: [2.0, 0, -2.0] },
      // Standing networking tables
      { assetId: 'wp-table-haute-de-reunion', pos: [-1.4, 0, 0.4] },
      { assetId: 'wp-tabouret-haut', pos: [-1.8, 0, 0.4] },
      { assetId: 'wp-tabouret-haut', pos: [-1.0, 0, 0.4] },

      { assetId: 'wp-table-haute-de-reunion', pos: [1.4, 0, 0.4] },
      { assetId: 'wp-tabouret-haut', pos: [1.0, 0, 0.4] },
      { assetId: 'wp-tabouret-haut', pos: [1.8, 0, 0.4] },

      // Calming water fountain
      { assetId: 'fountain', pos: [-2.2, 0, -0.8] },
      // Planter
      { assetId: 'planter', pos: [2.2, 0, 1.6] },
    ]
  }
];

export function createSeminarPatch(room: SeminarRoom, _existing: Record<string, EntitySpec> = {}): WorldPatch {
  const entitiesCreated: EntitySpec[] = [];
  const rulesChanged: RuleSpec[] = [];

  // 1. Interactive pedagogical caption board describing the seminar space
  const captionId = `seminar_${room.id}_captions`;
  const equipmentList = room.equipment.map(e => `• ${e.name} (${e.quantity})`).join('\n');
  const featuresList = room.keyFeatures.map(f => `✓ ${f}`).join('\n');
  
  entitiesCreated.push({
    id: captionId,
    name: `Fiche Séminaire · ${room.title}`,
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0, z: -3.8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      {
        type: 'educational',
        text: `ESPACE PROFESSIONNEL · ${room.title.toUpperCase()}\nCapacité : ${room.capacity} personnes | Catégorie : ${room.category}\n\n${room.description}\n\nÉQUIPEMENTS CLÉS :\n${equipmentList}\n\nPOINTS FORTS :\n${featuresList}\n\nCONSEIL FACILITATEUR :\n${room.facilitatorTips}`,
        value: 0,
        active: true
      },
    ],
    visuals: { assetId: 'captions', modelUrl: '/library/captions.glb' }
  });

  // 2. Audio speaker for vocal debriefing / facilitation guide
  const audioId = `seminar_${room.id}_audio`;
  entitiesCreated.push({
    id: audioId,
    name: `Guide Audio Facilitateur`,
    capabilities: [
      { type: 'transform', position: { x: 2.2, y: 0, z: -3.8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      {
        type: 'educational',
        text: `Bienvenue dans la configuration ${room.title}. ${room.description}. Conseil pour votre réunion : ${room.facilitatorTips}`,
        value: 0,
        active: false
      },
    ],
    visuals: { assetId: 'audio', modelUrl: '/library/audio.glb' }
  });

  // 3. Seminar facilitation quiz
  const quizId = `seminar_${room.id}_quiz`;
  entitiesCreated.push({
    id: quizId,
    name: `Quiz Ergonomie & Facilitation`,
    capabilities: [
      { type: 'transform', position: { x: -2.2, y: 0, z: -3.8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      {
        type: 'educational',
        text: `${room.quizQuestion.question}\nA) ${room.quizQuestion.options[0]}\nB) ${room.quizQuestion.options[1]}\nC) ${room.quizQuestion.options[2]}`,
        value: 0,
        active: false,
        correctAnswer: room.quizQuestion.answer
      },
    ],
    visuals: { assetId: 'quiz', modelUrl: '/library/quiz.glb' }
  });

  // 4. Physical props and furniture
  room.assetPlacements.forEach((placement, idx) => {
    const meta = getAsset(placement.assetId);
    const entityId = `seminar_${room.id}_${placement.assetId}_${idx + 1}`;
    const isFixedFurniture = [
      'meeting-table',
      'wp-table-de-conference-en-u',
      'wp-table-haute-de-reunion',
      'wp-bureau-individuel',
      'counter',
      'sofa',
      'coffee-table',
      'wall-screen',
      'wp-ecran-de-projection-deroulant',
      'partition',
      'shelf',
      'fountain',
      'presentation',
      'table',
      'technical-bench',
      'wp-ilot-de-cuisine'
    ].includes(placement.assetId);

    const safeY = (!isFixedFurniture && placement.pos[1] >= 0.85 && placement.pos[1] <= 0.915)
      ? 0.925
      : (!isFixedFurniture && placement.pos[1] >= 0.38 && placement.pos[1] <= 0.425)
      ? 0.435
      : (!isFixedFurniture && placement.pos[1] >= 0.72 && placement.pos[1] <= 0.78)
      ? 0.785
      : placement.pos[1];

    entitiesCreated.push({
      id: entityId,
      name: meta?.name || placement.assetId,
      capabilities: [
        {
          type: 'transform',
          position: { x: placement.pos[0], y: safeY, z: placement.pos[2] },
          rotation: placement.rot ? { x: placement.rot[0], y: placement.rot[1], z: placement.rot[2] } : { x: 0, y: 0, z: 0 },
          scale: placement.scale ? { x: placement.scale[0], y: placement.scale[1], z: placement.scale[2] } : { x: 1, y: 1, z: 1 }
        },
        ...(!isFixedFurniture ? [{ type: 'draggable' as const }] : []),
        { type: 'collider' },
        { type: 'educational', text: meta?.name || placement.assetId, value: 0, active: false }
      ],
      visuals: {
        assetId: placement.assetId,
        modelUrl: `/library/${placement.assetId}.glb`
      }
    });
  });

  // 5. Interactive rules for briefing and audio
  rulesChanged.push({
    id: `rule_seminar_${room.id}_caption`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: captionId }],
    actions: [
      { type: 'play_sound', sound: 'chime' },
      { type: 'set_flag', flag: `seminar_${room.id}_briefing_read`, value: true },
      { type: 'show_warning', message: `📋 Fiche d'aménagement « ${room.title} » consultée avec succès.` }
    ]
  });

  rulesChanged.push({
    id: `rule_seminar_${room.id}_audio`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: audioId }],
    actions: [
      { type: 'play_sound', sound: 'chime' },
      { type: 'set_flag', flag: `seminar_${room.id}_audio_listened`, value: true },
      { type: 'show_warning', message: `🔊 Conseil facilitateur : ${room.facilitatorTips}` }
    ]
  });

  const firstProp = entitiesCreated.find(e => e.id.startsWith(`seminar_${room.id}_`) && e.id !== captionId && e.id !== audioId && e.id !== quizId);
  if (firstProp) {
    rulesChanged.push({
      id: `rule_seminar_${room.id}_first_prop`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: firstProp.id }],
      actions: [
        { type: 'play_sound', sound: 'tink' },
        { type: 'set_flag', flag: `seminar_${room.id}_prop_inspected`, value: true },
        { type: 'show_warning', message: `🛠️ Équipement inspecté : ${firstProp.name}.` }
      ]
    });
  }

  // 6. Quiz validation rule
  rulesChanged.push({
    id: `rule_seminar_${room.id}_quiz`,
    trigger: 'ANSWER_CORRECT',
    conditions: [
      { type: 'is_source', sourceId: quizId }
    ],
    actions: [
      { type: 'play_sound', sound: 'fanfare' },
      { type: 'set_flag', flag: `seminar_${room.id}_passed`, value: true },
      { type: 'show_warning', message: 'Bravo ! Bonne réponse de facilitation.' }
    ]
  });

  const questId = `quest_seminar_${room.id}`;
  const quest: QuestSpec = {
    id: questId,
    title: `Séminaire Pro #${room.number} : ${room.title}`,
    description: `${room.description} (${room.category} · Capacité ${room.capacity} pers.)`,
    category: 'seminaire',
    rewardSound: 'fanfare',
    currentStepIndex: 0,
    status: 'in_progress',
    steps: [
      {
        id: `step_${room.id}_1_briefing`,
        title: 'Agencement spatial & Objectifs',
        description: `Observer l'agencement de la salle (${room.category}) et les consignes ergonomiques.`,
        targetEntityId: captionId,
        requiredEvent: 'INTERACT',
        hint: `Consultez le panneau de briefing ou la borne audio pour découvrir la disposition idéale.`,
        completed: false
      },
      {
        id: `step_${room.id}_2_equipment`,
        title: 'Vérification des équipements collaboratifs',
        description: `Inspecter les dispositifs clés : ${room.equipment.slice(0, 3).map(e => e.name).join(', ')}.`,
        targetEntityId: firstProp?.id || captionId,
        requiredEvent: 'INTERACT',
        hint: `Cliquez sur les équipements 3D de la salle pour vérifier leur placement et ergonomie.`,
        completed: false
      },
      {
        id: `step_${room.id}_3_quiz`,
        title: 'Validation de facilitation & dynamique de groupe',
        description: `Question : « ${room.quizQuestion.question} »`,
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
