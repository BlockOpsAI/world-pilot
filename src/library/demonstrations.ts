import type { WorldPatch, EntitySpec, RuleSpec } from '../core/types';
import { getAsset } from './catalog';
import { createBagShowcasePatch } from './bagShowcase';

export interface DemonstrationScenario {
  id: string;
  number: number;
  title: string;
  category: 'Cuisine & Gastronomie' | 'Réunion & Conférence' | 'Ville Parisienne & FLE' | 'Physique & Réactions' | 'Web3 & Innovation' | 'Mode & Luxe Showroom';
  prompt: string;
  description: string;
  interactionSummary: string;
  triggerButtonLabel: string;
  primaryEntityId: string;
  atmosphere?: string;
  equipment: { name: string; assetId: string }[];
  assetPlacements: { assetId: string; pos: [number, number, number]; rot?: [number, number, number]; scale?: [number, number, number]; text?: string }[];
  rules: RuleSpec[];
}

export const demonstrationScenarios: DemonstrationScenario[] = [
  {
    id: 'demo-espresso-barista',
    number: 1,
    title: 'L’Espresso du Barista (Machine E61 & Percolation)',
    category: 'Cuisine & Gastronomie',
    prompt: 'Prépare un café espresso et fais couler la crema dans la tasse',
    description: 'Une machine à café professionnelle E61 et une tasse en porcelaine sur un comptoir barista. L’activation déclenche la percolation sonore à 9 bars, l’élévation de vapeur douce et le service de l’espresso.',
    interactionSummary: 'Cliquez sur la machine à café pour enclencher la pompe, écouter la percolation réelle et observer la vapeur s’élever.',
    triggerButtonLabel: '☕ Faire couler l’espresso',
    primaryEntityId: 'demo_espresso_machine',
    atmosphere: 'cozy-bistrot',
    equipment: [
      { name: 'Comptoir de bar', assetId: 'counter' },
      { name: 'Machine à café professionnelle E61', assetId: 'coffee-machine' },
      { name: 'Tasse à café en porcelaine', assetId: 'wp-tasse-a-the' },
    ],
    assetPlacements: [
      { assetId: 'counter', pos: [0, 0, 0] },
      { assetId: 'coffee-machine', pos: [-0.4, 1.05, 0] },
      { assetId: 'wp-tasse-a-the', pos: [0.35, 1.05, 0] },
    ],
    rules: [
      {
        id: 'rule_demo_espresso',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_espresso_machine' }],
        actions: [
          { type: 'set_flag', flag: 'coffee_brewed', value: true },
          { type: 'play_sound', sound: 'coffee_brew' },
          { type: 'trigger_animation', entityId: 'demo_espresso_cup', animationType: 'steaming' },
          { type: 'set_atmosphere', atmosphere: 'cozy-bistrot' },
          { type: 'show_warning', message: '☕ Espresso extrait à 9 bars ! Crema noisette onctueuse et volutes de vapeur.' }
        ]
      }
    ]
  },
  {
    id: 'demo-ratatouille-simmer',
    number: 2,
    title: 'Mijotage de la Ratatouille (Cocotte en fonte & Feu doux)',
    category: 'Cuisine & Gastronomie',
    prompt: 'Fais mijoter la ratatouille dans la cocotte sur le feu',
    description: 'Une cocotte en fonte émaillée Le Creuset posée sur l’îlot central avec courgettes, tomates et aromates. L’interaction allume le feu doux, diffuse le son de crépitement et active la vapeur.',
    interactionSummary: 'Cliquez sur la cocotte en fonte pour déclencher le mijotage, faire suer les légumes et entendre le crépitement doux.',
    triggerButtonLabel: '🥘 Démarrer le mijotage',
    primaryEntityId: 'demo_ratatouille_cocotte',
    atmosphere: 'cozy-bistrot',
    equipment: [
      { name: 'Îlot de cuisine en chêne', assetId: 'wp-ilot-de-cuisine' },
      { name: 'Cocotte en fonte émaillée', assetId: 'wp-cocotte' },
      { name: 'Courgette fraîche', assetId: 'wp-courgette' },
      { name: 'Tomate mûre', assetId: 'wp-tomate' },
      { name: 'Planche de découpe', assetId: 'wp-planche-a-decouper' },
    ],
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-cocotte', pos: [0, 0.9, -0.1] },
      { assetId: 'wp-planche-a-decouper', pos: [0, 0.9, 0.3] },
      { assetId: 'wp-courgette', pos: [-0.4, 0.9, 0.1] },
      { assetId: 'wp-tomate', pos: [0.4, 0.9, 0.1] },
    ],
    rules: [
      {
        id: 'rule_demo_ratatouille',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_ratatouille_cocotte' }],
        actions: [
          { type: 'set_flag', flag: 'ratatouille_simmering', value: true },
          { type: 'play_sound', sound: 'sizzle_cook' },
          { type: 'trigger_animation', entityId: 'demo_ratatouille_cocotte', animationType: 'steaming' },
          { type: 'show_warning', message: '🥘 La ratatouille mijote à feu doux avec son bouquet garni !' }
        ]
      }
    ]
  },
  {
    id: 'demo-pitch-projection',
    number: 3,
    title: 'Le Pitch Investisseurs (Vidéoprojecteur & Écran Mural)',
    category: 'Réunion & Conférence',
    prompt: 'Branche l’ordinateur portable et allume le vidéoprojecteur sur l’écran mural',
    description: 'Poste de présentation exécutif avec ordinateur portable relié au vidéoprojecteur 4K. L’activation projette le flux, fait basculer l’écran en couleur cyan dynamique et affiche les indicateurs 3D.',
    interactionSummary: 'Cliquez sur le vidéoprojecteur pour allumer la lampe optique, synchroniser l’écran mural et jouer la fanfare de lancement.',
    triggerButtonLabel: '📽️ Allumer la projection',
    primaryEntityId: 'demo_pitch_projector',
    atmosphere: 'atelier',
    equipment: [
      { name: 'Vidéoprojecteur HD/4K', assetId: 'wp-videoprojecteur' },
      { name: 'Écran mural panoramique', assetId: 'wall-screen' },
      { name: 'Ordinateur portable unibody', assetId: 'wp-ordinateur-portable' },
      { name: 'Bureau individuel', assetId: 'wp-bureau-individuel' },
      { name: 'Graphique 3D de KPIs', assetId: 'bar-chart' },
    ],
    assetPlacements: [
      { assetId: 'wall-screen', pos: [0, 1.3, -2.0] },
      { assetId: 'wp-bureau-individuel', pos: [0, 0, 0.2] },
      { assetId: 'wp-ordinateur-portable', pos: [-0.3, 0.75, 0.2] },
      { assetId: 'wp-videoprojecteur', pos: [0.35, 0.75, 0.2] },
      { assetId: 'bar-chart', pos: [1.8, 0, -1.2] },
    ],
    rules: [
      {
        id: 'rule_demo_pitch',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_pitch_projector' }],
        actions: [
          { type: 'set_flag', flag: 'presentation_active', value: true },
          { type: 'play_sound', sound: 'switch_click' },
          { type: 'change_color', entityId: 'demo_pitch_screen', color: '#00e5ff' },
          { type: 'play_sound', sound: 'fanfare' },
          { type: 'show_warning', message: '📽️ Projection active ! Présentation des résultats financiers lancée sur grand écran.' }
        ]
      }
    ]
  },
  {
    id: 'demo-postal-deposit',
    number: 4,
    title: 'Dépôt Postal Parisien (Boîte La Poste B118 & Quittance)',
    category: 'Ville Parisienne & FLE',
    prompt: 'Poste une lettre recommandée dans la boîte jaune La Poste',
    description: 'Scène de rue haussmannienne avec réverbère en fonte et boîte aux lettres double fente jaune La Poste. L’insertion déclenche le son de bascule mécanique et la quittance de dépôt.',
    interactionSummary: 'Cliquez sur la boîte aux lettres pour poster le pli et valider la levée postale avec carillon sonore.',
    triggerButtonLabel: '📮 Glisser la lettre dans la fente',
    primaryEntityId: 'demo_postal_mailbox',
    atmosphere: 'paris-rain',
    equipment: [
      { name: 'Boîte aux lettres jaune La Poste B118', assetId: 'wp-boite-aux-lettres-de-rue' },
      { name: 'Réverbère haussmannien', assetId: 'wp-reverbere-de-rue' },
      { name: 'Banc extérieur en fonte', assetId: 'bench' },
    ],
    assetPlacements: [
      { assetId: 'wp-boite-aux-lettres-de-rue', pos: [0, 0, 0] },
      { assetId: 'wp-reverbere-de-rue', pos: [-1.4, 0, -0.4] },
      { assetId: 'bench', pos: [1.6, 0, 0.2] },
    ],
    rules: [
      {
        id: 'rule_demo_postal',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_postal_mailbox' }],
        actions: [
          { type: 'set_flag', flag: 'letter_posted', value: true },
          { type: 'play_sound', sound: 'bell' },
          { type: 'set_atmosphere', atmosphere: 'paris-rain' },
          { type: 'show_warning', message: '📮 Courrier posté avec succès dans la boîte B118 ! Prochaine levée à 16h30.' }
        ]
      }
    ]
  },
  {
    id: 'demo-chemistry-boil',
    number: 5,
    title: 'Réaction Chimique de Laboratoire (Ébullition & Virage)',
    category: 'Physique & Réactions',
    prompt: 'Chauffe la fiole Erlenmeyer sur le brûleur de laboratoire',
    description: 'Établi technique de sciences avec fiole Erlenmeyer sur brûleur. L’allumage fait entrer la solution en ébullition avec son de bulles montantes, dégagement de vapeur et virage de couleur chimique.',
    interactionSummary: 'Cliquez sur le brûleur pour allumer la flamme, voir la fiole changer de couleur et entendre le crépitement gazeux.',
    triggerButtonLabel: '⚗️ Chauffer la solution',
    primaryEntityId: 'demo_chemistry_burner',
    atmosphere: 'atelier',
    equipment: [
      { name: 'Établi technique', assetId: 'technical-bench' },
      { name: 'Brûleur de laboratoire', assetId: 'wp-bruleur-de-laboratoire' },
      { name: 'Fiole Erlenmeyer graduée', assetId: 'wp-fiole-erlenmeyer' },
      { name: 'Porte-tubes à essai', assetId: 'wp-porte-tubes' },
    ],
    assetPlacements: [
      { assetId: 'technical-bench', pos: [0, 0, 0] },
      { assetId: 'wp-bruleur-de-laboratoire', pos: [-0.3, 0.9, 0] },
      { assetId: 'wp-fiole-erlenmeyer', pos: [-0.3, 1.13, 0] },
      { assetId: 'wp-porte-tubes', pos: [0.5, 0.9, 0] },
    ],
    rules: [
      {
        id: 'rule_demo_chemistry',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_chemistry_burner' }],
        actions: [
          { type: 'set_flag', flag: 'solution_boiling', value: true },
          { type: 'play_sound', sound: 'bubbles' },
          { type: 'change_color', entityId: 'demo_chemistry_flask', color: '#00ffaa' },
          { type: 'trigger_animation', entityId: 'demo_chemistry_flask', animationType: 'steaming' },
          { type: 'show_warning', message: '⚗️ Ébullition active ! Virage indicateur vert fluo et condensation au col.' }
        ]
      }
    ]
  },
  {
    id: 'demo-design-sprint',
    number: 6,
    title: 'Atelier Créatif Design Sprint (Punaisage d’Idées)',
    category: 'Réunion & Conférence',
    prompt: 'Anime une session d’idéation avec post-its sur tableau blanc mobile',
    description: 'Table haute de travail avec bloc de notes adhésives et tableau blanc mobile sur roulettes. L’action colle une nouvelle idée clé sur le board, sonne la fin du chrono et fait passer l’ambiance en mode festif.',
    interactionSummary: 'Cliquez sur le tableau mobile pour punaiser une nouvelle hypothèse et valider l’étape Scrum.',
    triggerButtonLabel: '💡 Valider l’idée sur le tableau',
    primaryEntityId: 'demo_sprint_board',
    atmosphere: 'celebration-party',
    equipment: [
      { name: 'Tableau blanc mobile', assetId: 'mobile-board' },
      { name: 'Table haute de réunion', assetId: 'wp-table-haute-de-reunion' },
      { name: 'Tabouret haut', assetId: 'wp-tabouret-haut' },
      { name: 'Bloc de notes adhésives', assetId: 'wp-bloc-de-notes-adhesives' },
    ],
    assetPlacements: [
      { assetId: 'mobile-board', pos: [0, 0, -1.0] },
      { assetId: 'wp-table-haute-de-reunion', pos: [0, 0, 0.8] },
      { assetId: 'wp-tabouret-haut', pos: [-0.7, 0, 0.8] },
      { assetId: 'wp-tabouret-haut', pos: [0.7, 0, 0.8] },
      { assetId: 'wp-bloc-de-notes-adhesives', pos: [0, 1.1, 0.8] },
    ],
    rules: [
      {
        id: 'rule_demo_sprint',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_sprint_board' }],
        actions: [
          { type: 'set_flag', flag: 'sprint_idea_pinned', value: true },
          { type: 'play_sound', sound: 'fanfare' },
          { type: 'set_atmosphere', atmosphere: 'celebration-party' },
          { type: 'show_warning', message: '🎉 Idée retenue à l’unanimité ! Passage à la phase de prototypage rapide.' }
        ]
      }
    ]
  },
  {
    id: 'demo-cozy-fireplace',
    number: 7,
    title: 'Salon Exécutif au Coin du Feu (Crépitement & Lueur)',
    category: 'Physique & Réactions',
    prompt: 'Allume le feu de cheminée et tamise la lumière du salon',
    description: 'Espace lounge VIP avec canapés moelleux, table basse et lampadaire articulé. L’interaction allume les braises crépitantes, diffuse une lueur d’or et bascule la pièce en ambiance nocturne étoilée.',
    interactionSummary: 'Cliquez sur la table basse pour tamiser la pièce et écouter le crépitement apaisant du feu.',
    triggerButtonLabel: '🔥 Tamiser le salon VIP',
    primaryEntityId: 'demo_cozy_table',
    atmosphere: 'starry-night',
    equipment: [
      { name: 'Table basse en chêne', assetId: 'coffee-table' },
      { name: 'Canapé modulaire moelleux', assetId: 'sofa' },
      { name: 'Lampadaire articulé', assetId: 'floor-lamp' },
      { name: 'Bac de végétation', assetId: 'planter' },
    ],
    assetPlacements: [
      { assetId: 'coffee-table', pos: [0, 0, 0] },
      { assetId: 'sofa', pos: [0, 0, -1.2] },
      { assetId: 'floor-lamp', pos: [-1.6, 0, -1.0] },
      { assetId: 'planter', pos: [1.6, 0, 0.5] },
    ],
    rules: [
      {
        id: 'rule_demo_cozy',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_cozy_table' }],
        actions: [
          { type: 'set_flag', flag: 'cozy_lounge_active', value: true },
          { type: 'play_sound', sound: 'sizzle_cook' },
          { type: 'set_atmosphere', atmosphere: 'starry-night' },
          { type: 'show_warning', message: '🌙 Ambiance nocturne et crépitement de foyer activés dans le salon VIP.' }
        ]
      }
    ]
  },
  {
    id: 'demo-music-jam',
    number: 8,
    title: 'Studio Musical Acoustique (Résonance Guitare & Djembé)',
    category: 'Physique & Réactions',
    prompt: 'Joue un accord de guitare et fais résonner le djembé',
    description: 'Atelier de musique avec guitare acoustique sculptée, djembé et micro sur pied. L’interaction déclenche un carillon harmonique, anime la vibration de l’instrument et fait flotter des pétales zen.',
    interactionSummary: 'Cliquez sur la guitare acoustique pour faire résonner un accord vibrant et déclencher l’ambiance zen.',
    triggerButtonLabel: '🎸 Jouer un accord acoustique',
    primaryEntityId: 'demo_music_guitar',
    atmosphere: 'zen-garden',
    equipment: [
      { name: 'Guitare acoustique en bois', assetId: 'wp-guitare-acoustique' },
      { name: 'Djembé traditionnel', assetId: 'wp-djembe' },
      { name: 'Microphone sur pied', assetId: 'wp-microphone-sur-pied' },
    ],
    assetPlacements: [
      { assetId: 'wp-guitare-acoustique', pos: [-0.5, 0, 0] },
      { assetId: 'wp-djembe', pos: [0.5, 0, 0] },
      { assetId: 'wp-microphone-sur-pied', pos: [0, 0, -0.6] },
    ],
    rules: [
      {
        id: 'rule_demo_music',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_music_guitar' }],
        actions: [
          { type: 'set_flag', flag: 'music_played', value: true },
          { type: 'play_sound', sound: 'bell' },
          { type: 'trigger_animation', entityId: 'demo_music_guitar', animationType: 'pulsing' },
          { type: 'set_atmosphere', atmosphere: 'zen-garden' },
          { type: 'show_warning', message: '🎵 Accord majeur en résonance ! Vibration acoustique et brise zen.' }
        ]
      }
    ]
  },
  {
    id: 'demo-victoria-vr-mint',
    number: 9,
    title: 'Smart Contract Victoria VR (Socle Volcanique & Mint NFT)',
    category: 'Web3 & Innovation',
    prompt: 'Pose le casque Victoria VR sur le socle de lave et minte le NFT',
    description: 'Le prototype Victoria VR Alpha sur son piédestal d’exposition en pierre de lave. L’interaction déclenche le smart contract décentralisé, le jingle Web3 et l’émission on-chain du token virtuel.',
    interactionSummary: 'Cliquez sur le socle d’exposition pour initier la transaction de mint NFT Victoria VR.',
    triggerButtonLabel: '💎 Minter le NFT Victoria VR',
    primaryEntityId: 'demo_vr_pedestal',
    atmosphere: 'cyberpunk-neon',
    equipment: [
      { name: 'Socle d’exposition', assetId: 'pedestal' },
      { name: 'Casque VR de simulation', assetId: 'wp-casque-vr' },
      { name: 'Coffre sécurisé', assetId: 'chest' },
    ],
    assetPlacements: [
      { assetId: 'pedestal', pos: [0, 0, 0] },
      { assetId: 'wp-casque-vr', pos: [0, 0.8, 0] },
      { assetId: 'chest', pos: [1.4, 0, 0] },
    ],
    rules: [
      {
        id: 'rule_demo_vr',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_vr_pedestal' }],
        actions: [
          { type: 'mint_nft', nftName: 'Victoria VR Alpha #007' },
          { type: 'trigger_animation', entityId: 'demo_vr_helmet', animationType: 'floating' },
          { type: 'set_atmosphere', atmosphere: 'cyberpunk-neon' },
          { type: 'show_warning', message: '💎 Smart Contract validé ! NFT Victoria VR Alpha inscrit sur la blockchain.' }
        ]
      }
    ]
  },
  {
    id: 'demo-seminar-checkin',
    number: 10,
    title: 'Accueil Séminaire & Scan de Badge (Contrôle d’Accès)',
    category: 'Réunion & Conférence',
    prompt: 'Scanne le badge de participant sur la borne d’accueil du séminaire',
    description: 'Comptoir d’enregistrement de convention avec borne interactive et porte-badge. Le scan vérifie les droits d’accès, émet un bip d’autorisation sonore et diffuse la fanfare d’accueil.',
    interactionSummary: 'Cliquez sur le badge de participant pour simuler le scan RFID et valider l’entrée en séance.',
    triggerButtonLabel: '🎫 Badger à l’accueil',
    primaryEntityId: 'demo_checkin_badge',
    atmosphere: 'atelier',
    equipment: [
      { name: 'Comptoir de vente / accueil', assetId: 'counter' },
      { name: 'Badge de participant', assetId: 'wp-badge-de-participant' },
      { name: 'Borne de consignes / tablette', assetId: 'instructions' },
    ],
    assetPlacements: [
      { assetId: 'counter', pos: [0, 0, 0] },
      { assetId: 'instructions', pos: [-0.5, 1.05, 0] },
      { assetId: 'wp-badge-de-participant', pos: [0.4, 1.05, 0] },
    ],
    rules: [
      {
        id: 'rule_demo_checkin',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_checkin_badge' }],
        actions: [
          { type: 'set_flag', flag: 'badge_scanned', value: true },
          { type: 'play_sound', sound: 'switch_click' },
          { type: 'play_sound', sound: 'fanfare' },
          { type: 'show_warning', message: '🎫 Badge VIP validé ! Accès accordé à la plénière du séminaire.' }
        ]
      }
    ]
  },
  {
    id: 'demo-spatial-web-3d',
    number: 11,
    title: 'Le Cabinet des Savoirs (Web 3D & Causalité Spatiale)',
    category: 'Web3 & Innovation',
    prompt: 'Explorer le Cabinet des Savoirs et le Web 3D interactif',
    description: 'Un atelier de travail futuriste où le web physique prend vie : feuilletez le livre Gutenberg avec rotation 3D des pages, étudiez la micrographie cellulaire au microscope optique, observez le globe mondial, consultez les plans CAO et écoutez la platine vinyle.',
    interactionSummary: 'Cliquez sur n’importe quel objet pour ouvrir sa ressource web réelle (PDF vectoriel, Wikipedia, documentation Three.js ou article NCBI), ou saisissez-les pour tester le faisceau d’attachement magnétique et la causalité spatiale.',
    triggerButtonLabel: '🌐 Explorer le Web 3D',
    primaryEntityId: 'demo_cabinet_book',
    atmosphere: 'atelier',
    equipment: [
      { name: 'Table de travail en noyer', assetId: 'table' },
      { name: 'Livre Gutenberg & PDF', assetId: 'book' },
      { name: 'Station Développeur CLI', assetId: 'ordinateur' },
      { name: 'Globe Terrestre & Atlas', assetId: 'globe' },
      { name: 'Microscope Confocal de Recherche', assetId: 'microscope' },
      { name: 'Platine Vinyle Hi-Fi', assetId: 'turntable' },
      { name: 'Dossier de Plans CAO', assetId: 'porte-documents' }
    ],
    assetPlacements: [
      { assetId: 'table', pos: [0, 0, 0] },
      { assetId: 'book', pos: [-0.45, 0.94, 0.15], rot: [0, 0.2, 0] },
      { assetId: 'ordinateur', pos: [0, 0.94, -0.18] },
      { assetId: 'globe', pos: [-0.55, 0.94, -0.2], rot: [0, 0.35, 0] },
      { assetId: 'turntable', pos: [0.55, 0.94, -0.15] },
      { assetId: 'microscope', pos: [0.45, 0.94, 0.2], rot: [0, -0.25, 0] },
      { assetId: 'porte-documents', pos: [0, 0.94, 0.2] }
    ],
    rules: [
      {
        id: 'rule_demo_spatial_web',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_cabinet_book' }],
        actions: [
          { type: 'play_sound', sound: 'paper_turn' },
          { type: 'show_warning', message: '📖 Cabinet des Savoirs activé : chaque objet physique est un portail vers le web réel !' }
        ]
      }
    ]
  },
  {
    id: 'demo-mindel-bag-capacity',
    number: 12,
    title: 'Mindel : Sac 42L & Test de Capacité Spatiale',
    category: 'Mode & Luxe Showroom',
    prompt: 'Tester la capacité du Sac Voyageur Pro 42L et son compartiment ordinateur',
    description: 'Démonstrateur de référence Mindel (Web 3D hybride sémantique) : Sac 42L avec parties sémantiques (housse ordi, cavité principale, poche gourde), bascule d’états ouvert/fermé, test géométrique de capacité spatiale pour Laptop 15.6", détection d’incompatibilité et fiches 2D enrichies.',
    interactionSummary: 'Ouvrez le sac pour inspecter ses 3 compartiments, faites glisser le laptop 15.6" pour valider qu’il rentre sans forcer, logez la gourde latérale et testez le gros carton incompatible.',
    triggerButtonLabel: '🎒 Tester la capacité du sac',
    primaryEntityId: 'sac_nomade_42',
    atmosphere: 'atelier',
    equipment: [
      { name: 'Sac Nomade Pro 42L', assetId: 'wp-sac-voyageur-42l' },
      { name: 'Ordinateur Pro 15.6"', assetId: 'ordinateur' },
      { name: 'Gourde Isotherme 750ml', assetId: 'wp-gourde-isotherme' },
      { name: 'Gros Carton Incompatible', assetId: 'wp-carton-oversized' },
      { name: 'Table de Présentation Studio', assetId: 'table' }
    ],
    assetPlacements: [
      { assetId: 'table', pos: [0, 0.4, 0], scale: [2.2, 0.8, 1.4] },
      { assetId: 'wp-sac-voyageur-42l', pos: [0, 0.85, 0], rot: [0, 0.15, 0] },
      { assetId: 'ordinateur', pos: [0.65, 0.82, 0.1], rot: [0, -0.2, 0] },
      { assetId: 'wp-gourde-isotherme', pos: [-0.6, 0.82, 0.15] },
      { assetId: 'wp-carton-oversized', pos: [0.7, 0.82, -0.45] }
    ],
    rules: []
  }
];

export function createDemonstrationPatch(demo: DemonstrationScenario, existing: Record<string, EntitySpec> = {}): WorldPatch {
  const existingIds = Object.keys(existing || {});
  const entitiesRemoved = existingIds.length > 0 ? existingIds : undefined;

  if (demo.id === 'demo-mindel-bag-capacity') {
    const patch = createBagShowcasePatch();
    return {
      ...patch,
      worldTheme: 'luxury-showroom',
      ...(entitiesRemoved ? { entitiesRemoved } : {})
    };
  }

  const entitiesCreated: EntitySpec[] = [];
  const prefix = demo.id.replace('demo-', 'demo_');

  // 1. Interactive explanation board (center rear)
  entitiesCreated.push({
    id: `${prefix}_board`,
    name: `Démonstration · ${demo.title}`,
    capabilities: [
      { type: 'transform', position: { x: -1.85, y: 0, z: -0.4 }, rotation: { x: 0, y: 0.35, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      {
        type: 'educational',
        text: `★ DÉMO INTERACTIVE : ${demo.title.toUpperCase()}\n${demo.description}\n\nACTION DU SCÉNARIO :\n${demo.interactionSummary}\n\nPrompt vocal/texte : « ${demo.prompt} »`,
        value: 0,
        active: true
      }
    ],
    visuals: { assetId: 'captions', modelUrl: '/library/captions.glb' }
  });

  // 2. Physical props mapped with demo IDs
  demo.assetPlacements.forEach((placement, idx) => {
    const meta = getAsset(placement.assetId);
    let entityId = `${prefix}_obj_${idx + 1}`;

    // Precise semantic entity ID mapping for demonstration interactions:
    if (demo.id === 'demo-espresso-barista') {
      if (placement.assetId === 'coffee-machine') entityId = 'demo_espresso_machine';
      else if (placement.assetId === 'wp-tasse-a-the') entityId = 'demo_espresso_cup';
      else if (placement.assetId === 'counter') entityId = 'demo_espresso_counter';
    } else if (demo.id === 'demo-ratatouille-simmer') {
      if (placement.assetId === 'wp-cocotte') entityId = 'demo_ratatouille_cocotte';
      else if (placement.assetId === 'wp-ilot-de-cuisine') entityId = 'demo_ratatouille_ilot';
    } else if (demo.id === 'demo-pitch-projection') {
      if (placement.assetId === 'wp-videoprojecteur') entityId = 'demo_pitch_projector';
      else if (placement.assetId === 'wall-screen') entityId = 'demo_pitch_screen';
    } else if (demo.id === 'demo-postal-deposit') {
      if (placement.assetId === 'wp-boite-aux-lettres-de-rue') entityId = 'demo_postal_mailbox';
    } else if (demo.id === 'demo-chemistry-boil') {
      if (placement.assetId === 'wp-bruleur-de-laboratoire') entityId = 'demo_chemistry_burner';
      else if (placement.assetId === 'wp-fiole-erlenmeyer') entityId = 'demo_chemistry_flask';
      else if (placement.assetId === 'technical-bench') entityId = 'demo_chemistry_bench';
    } else if (demo.id === 'demo-design-sprint') {
      if (placement.assetId === 'mobile-board') entityId = 'demo_sprint_board';
    } else if (demo.id === 'demo-cozy-fireplace') {
      if (placement.assetId === 'coffee-table') entityId = 'demo_cozy_table';
    } else if (demo.id === 'demo-music-jam') {
      if (placement.assetId === 'wp-guitare-acoustique') entityId = 'demo_music_guitar';
    } else if (demo.id === 'demo-victoria-vr-mint') {
      if (placement.assetId === 'pedestal') entityId = 'demo_vr_pedestal';
      else if (placement.assetId === 'wp-casque-vr') entityId = 'demo_vr_helmet';
    } else if (demo.id === 'demo-seminar-checkin') {
      if (placement.assetId === 'wp-badge-de-participant') entityId = 'demo_checkin_badge';
      else if (placement.assetId === 'counter') entityId = 'demo_checkin_counter';
    } else if (demo.id === 'demo-spatial-web-3d') {
      if (placement.assetId === 'table') entityId = 'demo_cabinet_table';
      else if (placement.assetId === 'book') entityId = 'demo_cabinet_book';
      else if (placement.assetId === 'ordinateur') entityId = 'demo_cabinet_laptop';
      else if (placement.assetId === 'globe') entityId = 'demo_cabinet_globe';
      else if (placement.assetId === 'turntable') entityId = 'demo_cabinet_turntable';
      else if (placement.assetId === 'microscope') entityId = 'demo_cabinet_microscope';
      else if (placement.assetId === 'porte-documents') entityId = 'demo_cabinet_blueprint';
    } else if (idx === 0) {
      entityId = demo.primaryEntityId;
    }

    const isFixedFurniture = [
      'counter', 'technical-bench', 'wall-screen', 'bench', 'wp-ilot-de-cuisine',
      'wp-bureau-individuel', 'pedestal', 'sofa', 'wp-table-haute-de-reunion', 'coffee-table', 'table',
      'wp-reverbere-de-rue', 'wp-boite-aux-lettres-de-rue', 'floor-lamp', 'planter', 'mobile-board', 'bar-chart'
    ].includes(placement.assetId);

    const webUrls: Record<string, string> = {
      'book': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'porte-documents': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'ordinateur': 'https://threejs.org/docs/',
      'globe': 'https://fr.wikipedia.org/wiki/Terre',
      'turntable': 'https://fr.wikipedia.org/wiki/Disque_microsillon',
      'microscope': 'https://fr.m.wikipedia.org/wiki/Microbiologie'
    };
    const targetWebUrl = webUrls[placement.assetId];

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
        { type: 'collider' as const },
        ...(targetWebUrl ? [{ type: 'web_screen' as const, url: targetWebUrl }] : []),
        { type: 'educational' as const, text: placement.text || meta?.name || placement.assetId, value: 0, active: false }
      ],
      visuals: {
        assetId: placement.assetId,
        modelUrl: `/library/${placement.assetId}.glb`
      }
    });
  });

  return {
    entitiesCreated,
    rulesChanged: demo.rules,
    invariantsAdded: [],
    ...(entitiesRemoved ? { entitiesRemoved } : {})
  };
}
