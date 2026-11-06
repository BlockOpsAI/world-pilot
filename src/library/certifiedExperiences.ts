// src/library/certifiedExperiences.ts
// Registre des expériences virtuelles officiellement certifiées et validées.
// Chaque expérience enregistrée ici a subi avec succès l'audit complet :
// 1. Réalisme des objets 3D (aucun fallback ni canard pour une voiture)
// 2. Causalité et règles complètes (sons, visuels, drapeaux)
// 3. Fluidité physique Rapier (mobilier lourd fixe, outils manipulables)
// 4. Ergonomie cognitive (points d'hésitation analysés et résolus)
// 5. Exécution sans accroc de la trace

export interface CertifiedExperience {
  id: string;
  prompt: string;
  title: string;
  category: 'Mécanique & Automobile' | 'Chimie & Sciences' | 'Cuisine & Gastronomie' | 'Physique & Électricité' | 'Bureautique & Réunion' | 'Mode & Luxe Showroom' | 'Métavers Victoria VR' | 'Aérospatial & Futurisme' | 'Ameublement & DIY' | 'Tech & Game Design' | 'Web3 & Innovation';
  status: 'validated';
  auditScore: number; // ex: 98/100
  certifiedDate: string;
  thumbnailIcon: string;
  description: string;
  realisticObjects: string[];
  interactionHighlights: string[];
  hesitationsResolved: string[];
  actionPresetCommand: string;
}

export const certifiedExperiencesRegistry: CertifiedExperience[] = [
  {
    id: 'cert_auto_battery_12v',
    prompt: 'Montrer comment changer une batterie dans une voiture',
    title: 'Remplacement de Batterie Automobile 12V AGM',
    category: 'Mécanique & Automobile',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '🚗',
    description: 'Procédure complète de maintenance en atelier : berline avec capot relevé, compartiment moteur complet avec bac récepteur et câbles (+) rouge / (-) noir, batterie neuve 12V 70Ah AGM sur établi.',
    realisticObjects: [
      'Voiture berline avec capot relevé et compartiment moteur complet (wp-voiture)',
      'Bac récepteur de batterie avec zone réceptrice aimantée',
      'Batterie automobile 12V 70Ah AGM avec poignée et voyant Magic Eye (wp-batterie-automobile)',
      'Établi technique de préparation (technical-bench)'
    ],
    interactionHighlights: [
      'Diagnostic préalable obligatoire : mesure de la tension (12.6V) avec son chime',
      'Glisser-déposer de la batterie dans le compartiment moteur avec verrouillage magnétique',
      'Raccordement des cosses, allumage automatique des phares LED et démarrage moteur',
      'Invariant formel de sécurité électrique interdisant la complétion sans diagnostic'
    ],
    hesitationsResolved: [
      'Ordre des opérations sécurisé par l’étape 1 de quête bien visible et boutons contextuels',
      'Repérage immédiat des cosses (+) rouge et (-) noire en modélisation 3D',
      'Possibilité de valider soit par glisser-déposer tactile, soit par les boutons d’action directe'
    ],
    actionPresetCommand: 'Montrer comment changer une batterie dans une voiture'
  },
  {
    id: 'cert_chem_flask_boil',
    prompt: 'Chauffe la fiole Erlenmeyer sur le brûleur de laboratoire',
    title: 'Laboratoire Chimique : Ébullition & Virage Colorimétrique',
    category: 'Chimie & Sciences',
    status: 'validated',
    auditScore: 96,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '⚗️',
    description: 'Paillasse technique de sciences avec fiole Erlenmeyer graduée sur brûleur à gaz. L’allumage déclenche l’ébullition avec son de bulles montantes, dégagement de vapeur et virage de couleur vert fluo.',
    realisticObjects: [
      'Paillasse technique fixe (technical-bench)',
      'Brûleur de laboratoire en laiton et fonte (wp-bruleur-de-laboratoire)',
      'Fiole Erlenmeyer graduée en verre borosilicate manipulable (wp-fiole-erlenmeyer)',
      'Porte-tubes à essai avec tubes gradués (wp-porte-tubes)'
    ],
    interactionHighlights: [
      'Allumage du brûleur au clic direct avec son de gaz et flamme',
      'Son procédural de bulles montantes calibré sans boucle infinie',
      'Virage photochimique vert fluo et volutes de vapeur au col de la fiole',
      'Paillasse stabilisée comme mobilier fixe sans risque de collision parasite'
    ],
    hesitationsResolved: [
      'La paillasse ne bouge plus quand on attrape la fiole (stabilité physique Rapier assurée)',
      'Bouton contextuel « ⚗️ Chauffer la solution » affiché pour guider l’action'
    ],
    actionPresetCommand: 'Chauffe la fiole Erlenmeyer sur le brûleur de laboratoire'
  },
  {
    id: 'cert_cooking_ratatouille',
    prompt: 'Fais mijoter la ratatouille dans la cocotte sur le feu',
    title: 'Mijotage Culinaire : Ratatouille Provençale en Cocotte',
    category: 'Cuisine & Gastronomie',
    status: 'validated',
    auditScore: 98,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '🥘',
    description: 'Îlot de cuisine en chêne avec cocotte en fonte émaillée Le Creuset, planche à découper, tomates et courgettes fraîches. Cuisson douce avec crépitement, vapeur et fiches de dégustation.',
    realisticObjects: [
      'Îlot de cuisine en chêne massif fixe (wp-ilot-de-cuisine)',
      'Cocotte en fonte émaillée rouge volcanique (wp-cocotte)',
      'Légumes détaillés déplaçables (courgette, tomate mûre)',
      'Planche à découper en bois (wp-planche-a-decouper)'
    ],
    interactionHighlights: [
      'Glisser-déposer des légumes avec aimantage magnétique émeraude sur la planche ou la cocotte',
      'Contrôle thermique à 3 allures (doux, moyen, vif)',
      'Crépitement sonore doux et élévation de vapeur volumétrique',
      'Fiche recette Wikipédia interactive consultable sur le panneau web 3D'
    ],
    hesitationsResolved: [
      'L’aimantage magnétique guide le positionnement exact des ingrédients',
      'L’utilisateur peut déclencher la cuisson d’un clic sur le bouton de la cocotte'
    ],
    actionPresetCommand: 'Fais mijoter la ratatouille dans la cocotte sur le feu'
  },
  {
    id: 'cert_physics_ohm_law',
    prompt: "Laboratoire d'Électrocinétique : Loi d'Ohm & Protection Court-Circuit",
    title: "Laboratoire d'Électrocinétique : Loi d'Ohm (U = R × I)",
    category: 'Physique & Électricité',
    status: 'validated',
    auditScore: 97,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '⚡',
    description: 'Banc didactique de physique avec générateur de tension continue, rhéostat à curseur, multimètre numérique et résistance de puissance. Étude de la proportionnalité U = R × I et protection contre les surintensités.',
    realisticObjects: [
      'Banc pédagogique d’électrocinétique (pedagogical_bench)',
      'Multimètre numérique d’atelier (multimeter)',
      'Résistance de puissance calibrée (resistor)',
      'Générateur de tension stabilisée (power-supply)',
      'Rhéostat à curseur linéaire (rheostat)'
    ],
    interactionHighlights: [
      'Mesure incrémentale de la tension et du courant avec retours chiffrés',
      'Piège de court-circuit simulant le déclenchement du disjoncteur avec signal sonore',
      'Validation de la conformité pédagogique Bloom-3D'
    ],
    hesitationsResolved: [
      'Étapes de quête numérotées guidant le câblage dans l’ordre méthodique',
      'Schéma de circuit projeté en arrière-plan pour éviter toute erreur de branchement'
    ],
    actionPresetCommand: "Laboratoire d'Électrocinétique : Loi d'Ohm & Protection Court-Circuit"
  },
  {
    id: 'cert_barista_espresso',
    prompt: 'Prépare un café espresso et fais couler la crema dans la tasse',
    title: 'Extraction Barista : Machine E61 & Crema Noisette',
    category: 'Cuisine & Gastronomie',
    status: 'validated',
    auditScore: 96,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '☕',
    description: 'Comptoir de bistrot parisien avec machine à espresso professionnelle E61 et tasse en porcelaine. L’actionnement du levier active la pompe 9 bars, l’écoulement de la crema et l’ambiance sonore bistrot.',
    realisticObjects: [
      'Comptoir barista en bois noble fixe (counter)',
      'Machine à café professionnelle E61 en acier poli (coffee-machine)',
      'Tasse à café en porcelaine blanche (wp-tasse-a-the)'
    ],
    interactionHighlights: [
      'Actionnement du levier d’infusion au clic direct sur la machine',
      'Son réel de percolation et extraction sous pression à 9 bars',
      'Volutes de vapeur douce montant de la tasse',
      'Bascule automatique en ambiance lumineuse et sonore bistrot'
    ],
    hesitationsResolved: [
      'La machine est clairement identifiable avec le bouton « ☕ Faire couler l’espresso »',
      'Feedback immédiat : crema visible et son d’extraction dès le clic'
    ],
    actionPresetCommand: 'Prépare un café espresso et fais couler la crema dans la tasse'
  },
  {
    id: 'cert_luxury_louis_vuitton',
    prompt: 'Visite de la boutique de luxe Louis Vuitton pour examiner les sacs et la maroquinerie',
    title: 'Boutique de Haute Maroquinerie : Sacs d’Excellence Louis Vuitton',
    category: 'Mode & Luxe Showroom',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '👜',
    description: 'Showroom de luxe parisien : comptoir de présentation en marbre Calacatta et laiton brossé, sac iconique Monogram Speedy en cuir naturel, sac Capucines haute maroquinerie Taurillon noir, vitrine joaillerie et podium d’inspection VIP avec certificat blockchain Victoria VR.',
    realisticObjects: [
      'Comptoir d’exposition en marbre Calacatta et laiton brossé (wp-presentoir-luxe)',
      'Sac Monogram Speedy en toile enduite et cuir vachette naturel (wp-sac-monogram)',
      'Sac Capucines haute maroquinerie en cuir Taurillon noir et fermoir bijou LV (wp-sac-capucines)',
      'Vitrine d’exposition haute joaillerie rétroéclairée LED (wp-vitrine-luxe)',
      'Podium central d’inspection VIP avec éclairage zénithal (wp-podium-vip)'
    ],
    interactionHighlights: [
      'Inspection détaillée 360° du sac Monogram : texture toile, cadenas doré numéroté et surpiqûres',
      'Examen du sac Capucines : fermoir bijou LV incrusté, anneaux dorés et doublure cuir rose',
      'Présentation VIP sur podium rotatif avec allumage des spots et génération du certificat d’authenticité blockchain',
      'Invariant formel de certification d’authenticité interdisant la présentation sans examen préalable'
    ],
    hesitationsResolved: [
      'Identification immédiate des sacs avec étiquettes haute maroquinerie et descriptifs clairs',
      'Double modalité : clic pour examiner les détails ou glisser vers le podium d’exposition VIP',
      'Quête guidée en 3 étapes sécurisant le parcours de visite haut de gamme'
    ],
    actionPresetCommand: 'Visite de la boutique de luxe Louis Vuitton pour examiner les sacs et la maroquinerie'
  },
  {
    id: 'cert_baking_cookies',
    prompt: 'Préparer et faire cuire des cookies aux pépites de chocolat au four',
    title: 'Atelier Pâtisserie : Cuisson des Cookies aux Pépites de Chocolat',
    category: 'Cuisine & Gastronomie',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '🍪',
    description: 'Atelier pâtissier complet : plan de travail en marbre blanc, grand saladier de pâte vanillée aux pépites de chocolat noir 70%, plaque de cuisson garnie de 6 cookies façonnés, four encastrable professionnel avec convection 180°C et dorure caramel.',
    realisticObjects: [
      'Plan de travail de pâtisserie en marbre blanc massif (wp-plan-patisserie)',
      'Saladier en céramique avec pâte à cookies et pépites de chocolat (wp-saladier-cookies)',
      'Plaque pâtissière antiadhésive avec papier sulfurisé et 6 cookies (wp-plaque-cookies)',
      'Four professionnel encastrable à convection rayonnant à 180°C (wp-four-patisserie)',
      'Glissière centrale réceptrice du four avec zone d’aimantage fluide'
    ],
    interactionHighlights: [
      'Inspection tactile de la préparation : consistance de la pâte, beurre pommade et pépites',
      'Enfournement fluide de la plaque de cuisson dans la glissière du four avec aimantage magnétique',
      'Thermostat automatique 180°C et cuisson 12 minutes avec diffusion d’arômes vanille-chocolat',
      'Invariant formel interdisant l’enfournement sans contrôle préalable de la pâte'
    ],
    hesitationsResolved: [
      'Température précalibrée à 180°C pour éviter toute erreur de réglage thermique',
      'Aimantage magnétique émeraude garantissant un enfournement fluide sans collision bloquante',
      'Carillon sonore de réussite et toast descriptif des arômes à la sortie du four'
    ],
    actionPresetCommand: 'Préparer et faire cuire des cookies aux pépites de chocolat au four'
  },
  {
    id: 'cert_supercar_showroom',
    prompt: 'Showroom automobile Victoria VR : inspecter et customiser la supercar',
    title: 'Showroom Supercar & Personnalisation',
    category: 'Métavers Victoria VR',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '🏎️',
    description: 'Showroom futuriste : hypercar de démonstration, plateau tournant avec anneau cyan, console de configuration des teintes et clé intelligente.',
    realisticObjects: [
      'Supercar de démonstration en livrée Rosso Corsa et carbone (wp-supercar-showroom)',
      'Plateau tournant motorisé de showroom avec néon circulaire cyan (wp-plateau-tournant)',
      'Console holographique de configuration des livrées et finitions (wp-borne-configurateur)',
      'Clé intelligente holographique de contact et télémétrie (wp-telecommande-sport)',
      'Cockpit récepteur avec zone d’aimantage pour le démarrage'
    ],
    interactionHighlights: [
      'Personnalisation en temps réel de la livrée (Rouge Victoria, Noir Carbone, Bleu Sport, Argent)',
      'Insertion de la clé intelligente pour démarrer le moteur V12 850 ch avec sonorité échappement titane',
      'Plateau de présentation motorisé avec reflets du rendu temps réel',
      'Invariant d’homologation piste garantissant la configuration avant démarrage'
    ],
    hesitationsResolved: [
      'Palette de teintes intuitive sur la console holographique avec pastilles colorées bien visibles',
      'Clé clairement positionnée à hauteur de main avec repère visuel vers le cockpit',
      'Quête étape par étape guidant la personnalisation puis le démarrage du moteur'
    ],
    actionPresetCommand: 'Showroom automobile Victoria VR : inspecter et customiser la supercar'
  },
  {
    id: 'cert_victoria_penthouse_gallery',
    prompt: 'Visite du penthouse panoramique Victoria VR avec galerie d’art numérique',
    title: 'Victoria VR : Penthouse Panoramique & Galerie d’Art NFT',
    category: 'Métavers Victoria VR',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '🌆',
    description: 'Résidence d’architecte sur les hauteurs du métavers Victoria VR : grande baie vitrée panoramique sur le skyline métropolitain, chevalet d’art numérique avec tableau NFT certifié ERC-721 "Victoria Genesis", canapé lounge en cuir beige, cube domotique de contrôle d’ambiance et déclenchement du coucher de soleil Golden Hour.',
    realisticObjects: [
      'Grande baie vitrée panoramique avec vue sur les gratte-ciels Victoria VR (wp-baie-panoramique)',
      'Chevalet d’art numérique avec cadre holographique NFT 8K (wp-cadre-art-numerique)',
      'Canapé lounge d’architecte en cuir beige et coussins velours (sofa)',
      'Cube holographique de contrôle domotique et ambiances lumineuses (wp-cube-domotique)',
      'Socle récepteur domotique de la table basse lounge'
    ],
    interactionHighlights: [
      'Consultation du certificat d’authenticité blockchain ERC-721 et signature d’artiste sur la toile numérique',
      'Dépose du cube de contrôle domotique sur la table lounge pour activer l’ambiance Golden Hour',
      'Transition lumineuse douce : reflets ambrés sur le mobilier, feu de cheminée et musique lounge feutrée',
      'Invariant de curation artistique reliant l’inspection de l’art au réglage du salon'
    ],
    hesitationsResolved: [
      'Cartel d’art agrandi avec lecture aisée du token ID sans encombrer la vue panoramique',
      'Cube de contrôle tactile manipulable facilement sur trackpad ou souris avec zone réceptrice large',
      'Confirmation visuelle immédiate par bascule de l’éclairage de scène'
    ],
    actionPresetCommand: 'Visite du penthouse panoramique Victoria VR avec galerie d’art numérique'
  },
  {
    id: 'cert_zerog_orbital_cupola',
    prompt: 'Station spatiale orbitale Victoria VR : observation de la Terre et sas de décompression',
    title: 'Victoria VR : Coupole Spatiale Orbitale Zéro-G & Sas de Sortie EVA',
    category: 'Aérospatial & Futurisme',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '🚀',
    description: 'Station orbitale internationale dans le métavers Victoria VR : coupole panoramique d’observation avec vue à 360° sur la Terre courbée et ses aurores boréales, console de télémétrie spatiale, casque de combinaison EVA flottant en apesanteur avec visière or réfléchissante et sas de pressurisation pour sortie extravéhiculaire.',
    realisticObjects: [
      'Coupole panoramique d’observation multi-hublots avec vue Terre 3D (wp-coupole-spatiale)',
      'Console de télémétrie orbitale et propulsion ionique (wp-console-spatiale)',
      'Casque spatial pressurisé EVA flottant en microgravité avec visière miroir or (wp-casque-spatial)',
      'Sas de décompression et d’équilibrage de pression d’arrimage'
    ],
    interactionHighlights: [
      'Consultation de la télémétrie orbitale (408 km, 27 600 km/h, aurores polaires) sur la console de bord',
      'Manipulation en apesanteur du casque EVA et arrimage guidé dans le récepteur du sas de décompression',
      'Signal sonore de pressurisation réussie et étanchéité validée pour la sortie extravéhiculaire',
      'Invariant astronautique de sécurité pressurisée prévenant toute ouverture intempestive du sas'
    ],
    hesitationsResolved: [
      'Trajectoire du casque en apesanteur amortie pour éviter tout égarement dans le vide de la pièce',
      'Sas d’arrimage illuminé avec indicateur vert d’étanchéité dès la mise en place',
      'Quête méthodique guidant la vérification télémétrique avant l’équilibrage du sas'
    ],
    actionPresetCommand: 'Station spatiale orbitale Victoria VR : observation de la Terre et sas de décompression'
  },
  {
    id: 'cert_ikea_furniture_assembly',
    prompt: 'Montage d’un meuble IKEA en kit avec tourillons et fixation murale',
    title: 'Atelier Ameublement : Montage de Meuble IKEA & Sécurité Murale',
    category: 'Ameublement & DIY',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-28',
    thumbnailIcon: '🪑',
    description: 'Atelier B2B officiel pour ameublement flat-pack : déballage méthodique, quincaillerie hêtre et acier, serrage des cames à la clé Allen 4mm et ancrage mural anti-basculement obligatoire (norme ASTM F2057-23).',
    realisticObjects: [
      'Tapis de feutre de protection au sol (wp-tapis-montage-ikea)',
      'Carton du kit meuble IKEA ouvert avec panneaux (wp-meuble-ikea-kit)',
      'Sachet de quincaillerie avec tourillons bois (wp-quincaillerie-ikea)',
      'Clé Allen 4mm hexagonale en acier trempé (wp-cle-allen)',
      'Équerre métallique de sécurité anti-basculement (wp-equerre-murale)',
      'Étagère bibliothèque assemblée (wp-etagere-ikea)',
      'Zone réceptrice d’ancrage mural anti-basculement'
    ],
    interactionHighlights: [
      'Déballage et comptage automatique de quincaillerie sans pièce manquante',
      'Insertion douce des tourillons bois dans les chants verticaux',
      'Serrage quart de tour à la clé Allen avec verrouillage sans jeu',
      'Glisser-déposer de l’équerre murale avec verrouillage magnétique sécurisé'
    ],
    hesitationsResolved: [
      'Notice visuelle claire sans ambiguïté sur le sens des panneaux',
      'Aimantage magnétique émeraude sur la zone murale sans frottement parasite',
      'Invariant de retenue interdisant l’homologation sans ancrage mural'
    ],
    actionPresetCommand: 'Montage d’un meuble IKEA en kit avec tourillons et fixation murale'
  },
  {
    id: 'cert_gamedev_level_studio',
    prompt: 'Créer un jeu de plateforme 3D avec plateformes, gemmes et playtest IA',
    title: 'Game Design Lab : Studio de Niveau 3D & Playtest Autonome',
    category: 'Tech & Game Design',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-28',
    thumbnailIcon: '🎮',
    description: 'Environnement de conception no-code pour studio de jeux vidéo : console de Level Design avec grille holographique, spawn pad joueur, plateformes néon magnétiques, gemmes ambrées, piège laser cadencé et Playtester IA autonome.',
    realisticObjects: [
      'Console holographique de Level Design & Grille 3D (wp-console-level-design)',
      'Socle de spawn joueur néon cyan (wp-spawn-pad)',
      'Plateformes flottantes en lévitation magnétique (wp-plateforme-flottante)',
      'Cluster de gemmes ambrées luminescentes (wp-gemme-collectable)',
      'Tourelle piège laser oscillant rouge (wp-piege-laser)',
      'Portail dimensionnel de victoire (wp-portail-victoire)',
      'Zone réceptrice d’activation du portail de victoire'
    ],
    interactionHighlights: [
      'Calibrage spatial de la distance de saut (2.55m max pour franchissement fluide)',
      'Ligne de vue et signalétique visuelle guidée par les gemmes ambrées',
      'Configuration de la cadence du laser à 1.5s pour esquive équitable',
      'Simulation kinématique complète par le Playtester IA jusqu’au portail'
    ],
    hesitationsResolved: [
      'Affichage des métriques de saut en temps réel sur la console',
      'Bouton d’action directe et glisser-déposer tactile des gemmes vers le portail',
      'Règle causale avec feedback visuel et sonore lors de chaque calibration'
    ],
    actionPresetCommand: 'Créer un jeu de plateforme 3D avec plateformes, gemmes et playtest IA'
  },
  {
    id: 'cert_spatial_web_3d',
    prompt: 'Explorer le Cabinet des Savoirs et le Web 3D interactif',
    title: 'Le Cabinet des Savoirs : Web 3D Spatial & Savoirs Numériques',
    category: 'Web3 & Innovation',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-30',
    thumbnailIcon: '🌐',
    description: 'Atelier de recherche futuriste où les objets physiques deviennent des portails vers le web réel : livre Gutenberg 3D, microscope confocal, globe atlas, station dev CLI, platine vinyle audiophile et plans CAO.',
    realisticObjects: [
      'Table de travail en noyer massif (table)',
      'Livre Gutenberg interactif avec liseuse PDF 3D (book)',
      'Microscope confocal de recherche biologique (microscope)',
      'Globe terrestre et atlas géopolitique (globe)',
      'Station développeur CLI Three.js (ordinateur)',
      'Platine vinyle Hi-Fi audiophile (turntable)',
      'Dossier de plans d’ingénierie CAO (porte-documents)'
    ],
    interactionHighlights: [
      'Consultation en direct de ressources web réelles (Wikipedia, Three.js, PDF W3C) intégrées aux écrans 3D',
      'Feuilletage volumétrique des pages du livre avec sonorité tactile',
      'Faisceau d’attachement magnétique et ancrage spatial des documents',
      'Contrôle audio haute-fidélité via la platine vinyle spatiale'
    ],
    hesitationsResolved: [
      'Indicateurs visuels et halo lumineux sur chaque artefact web',
      'Accès immédiat par clic direct ou par manipulation spatiale',
      'Bouton de recentrage de vue pour lecture optimale des écrans 3D'
    ],
    actionPresetCommand: 'Explorer le Cabinet des Savoirs et le Web 3D interactif'
  },
  {
    id: 'cert_mindel_bag_capacity',
    prompt: 'Tester la capacité du Sac Voyageur Pro 42L et son compartiment ordinateur',
    title: 'Mindel Web 3D : Sac Voyageur Pro 42L & Test de Capacité Spatiale',
    category: 'Mode & Luxe Showroom',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-10-06',
    thumbnailIcon: '🎒',
    description: 'Démonstrateur central Mindel (Web 3D hybride sémantique) : Sac 42L avec parties sémantiques (housse ordi, cavité principale, poche gourde), bascule d’états ouvert/fermé, test géométrique de capacité spatiale pour Laptop 15.6", détection d’incompatibilité et fiches 2D enrichies.',
    realisticObjects: [
      'Sac Voyageur Pro 42L compartimenté (wp-sac-voyageur-42l)',
      'Ordinateur portable Pro 15.6 pouces (ordinateur)',
      'Gourde isotherme 750ml inox (wp-gourde-isotherme)',
      'Colis volumineux incompatible (wp-carton-oversized)',
      'Table showroom de présentation (table)'
    ],
    interactionHighlights: [
      'Bascule d’état sémantique ouvert/fermé sans simulation physique coûteuse',
      'Test de capacité spatiale en temps réel avec vérification géométrique 3D',
      'Recherche d’accessoires compatibles depuis l’objet sélectionné',
      'Sauvegarde et restauration explicite de dispositions spatiales nommées'
    ],
    hesitationsResolved: [
      'Réponse immédiate et sans ambiguïté à la question : "Est-ce que mon PC 15.6 rentre ?"',
      'Distingue clairement l’objet logique de ses représentations 3D',
      'Fiches de ressources 2D typées (notice d’entretien, gabarit cabine IATA, achat en 1 clic)'
    ],
    actionPresetCommand: 'Tester la capacité du Sac Voyageur Pro 42L et son compartiment ordinateur'
  }
];

export function getValidatedExperiences(): CertifiedExperience[] {
  return certifiedExperiencesRegistry.filter(exp => exp.status === 'validated');
}

export function registerValidatedExperience(exp: CertifiedExperience): void {
  const existingIdx = certifiedExperiencesRegistry.findIndex(e => e.id === exp.id);
  if (existingIdx >= 0) {
    certifiedExperiencesRegistry[existingIdx] = exp;
  } else {
    certifiedExperiencesRegistry.push(exp);
  }
}
