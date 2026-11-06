import { extendedCatalog } from './extendedCatalog';
import type { EntitySpec, WorldPatch, RuleSpec } from '../core/types';

const originalCatalog = [
  { id: 'objectives', name: 'Panneau d’objectifs', category: 'Structurer', description: 'Trois objectifs visibles sur un panneau mobile.', size: [1.7, 2.1, 0.7], text: 'OBJECTIFS\nObserver\nComprendre\nExpérimenter' },
  { id: 'instructions', name: 'Borne de consignes', category: 'Structurer', description: 'Un pupitre tactile pour expliquer une activité.', size: [0.8, 1.3, 0.65], text: 'À VOUS DE JOUER\nLisez la consigne\nExplorez le modèle' },
  { id: 'path', name: 'Parcours à étapes', category: 'Structurer', description: 'Quatre jalons numérotés pour suivre une progression.', size: [2.4, 0.3, 0.6], text: 'PARCOURS', interaction: 'progress' },
  { id: 'label', name: 'Étiquette 3D', category: 'Expliquer', description: 'Une annotation sur pied, personnalisable.', size: [0.9, 1.3, 0.25], text: 'ANNOTATION\nNom du composant' },
  { id: 'arrow', name: 'Flèche directionnelle', category: 'Expliquer', description: 'Un repère volumétrique pour diriger le regard.', size: [1.2, 0.35, 0.3], text: 'DIRECTION' },
  { id: 'cutaway', name: 'Modèle en coupe', category: 'Expliquer', description: 'Un cylindre ouvert révèle trois couches internes.', size: [0.9, 1.3, 0.9], text: 'COUPE TECHNIQUE' },
  { id: 'pump', name: 'Pompe démontable', category: 'Manipuler', description: 'Corps, roue et couvercle avec vue éclatée.', size: [1.8, 1.15, 1], text: 'POMPE CENTRIFUGE', interaction: 'explode' },
  { id: 'instructor', name: 'Mannequin instructeur', category: 'Démontrer', description: 'Un mannequin articulé montre une posture d’accueil.', size: [0.9, 1.9, 0.5], text: 'DÉMONSTRATION', interaction: 'pose' },
  { id: 'hands', name: 'Mains de démonstration', category: 'Démontrer', description: 'Deux mains articulées sur un support de présentation.', size: [0.8, 0.55, 0.5], text: 'GESTE TECHNIQUE', interaction: 'pose' },
  { id: 'assembly', name: 'Pièces à assembler', category: 'Manipuler', description: 'Trois solides à associer à leurs emplacements.', size: [1.5, 0.6, 0.8], text: 'ASSEMBLAGE', interaction: 'assemble' },
  { id: 'socket', name: 'Emplacement d’accroche', category: 'Manipuler', description: 'Une cible physique pour déposer un objet sélectionné.', size: [0.8, 0.15, 0.8], text: 'DÉPOSER ICI', zone: true },
  { id: 'ruler', name: 'Règle graduée', category: 'Mesurer', description: 'Une règle d’un mètre, avec graduations de 5 cm.', size: [1, 0.035, 0.15], text: '1 MÈTRE' },
  { id: 'balance', name: 'Balance à plateaux', category: 'Mesurer', description: 'Deux plateaux et des masses de démonstration.', size: [1.25, 1.1, 0.5], text: 'ÉQUILIBRE', interaction: 'balance' },
  { id: 'timer', name: 'Chronomètre', category: 'Mesurer', description: 'Un chronomètre de séance avec départ, pause et remise à zéro.', size: [0.8, 0.6, 0.25], text: '00:00', interaction: 'timer' },
  { id: 'thermometer', name: 'Thermomètre', category: 'Mesurer', description: 'Une colonne graduée pour illustrer une température.', size: [0.35, 1.4, 0.25], text: 'TEMPÉRATURE', interaction: 'temperature' },
  { id: 'workbench', name: 'Poste de travail', category: 'Pratiquer', description: 'Établi en bois, tiroirs et panneau porte-outils.', size: [2, 1.8, 0.8], text: 'ATELIER' },
  { id: 'tools', name: 'Outils de manipulation', category: 'Pratiquer', description: 'Tournevis, clé et pince présentés sur un plateau.', size: [0.85, 0.18, 0.6], text: 'OUTILS' },
  { id: 'cards', name: 'Cartes de réponse', category: 'Évaluer', description: 'Trois cartes A, B et C pour une question à choix.', size: [1.4, 0.7, 0.25], text: 'CHOISISSEZ UNE RÉPONSE', interaction: 'quiz' },
  { id: 'sorting', name: 'Bacs de classement', category: 'Évaluer', description: 'Trois bacs colorés pour organiser une activité de tri.', size: [1.8, 0.65, 0.65], text: 'CLASSER' },
  { id: 'quiz', name: 'Boutons de quiz', category: 'Évaluer', description: 'Un pupitre de vote à trois boutons.', size: [1.1, 1.05, 0.6], text: 'QUESTION\nQuelle réponse choisissez-vous ?', interaction: 'quiz' },
  { id: 'success', name: 'Indicateur de réussite', category: 'Accompagner', description: 'Un signal lumineux passe en vert à la validation.', size: [0.4, 1.4, 0.4], text: 'VALIDATION', interaction: 'activate' },
  { id: 'highlight', name: 'Cadre de surlignage', category: 'Accompagner', description: 'Un cadre lumineux pour attirer l’attention sur une zone.', size: [1.4, 1.3, 0.3], text: 'POINT À OBSERVER', interaction: 'activate' },
  { id: 'help', name: 'Borne d’aide', category: 'Accompagner', description: 'Un point d’assistance avec un indice personnalisable.', size: [0.6, 1.4, 0.5], text: 'UN INDICE ?\nObservez la forme des pièces.', interaction: 'help' },
  { id: 'notes', name: 'Notes repositionnables', category: 'Collaborer', description: 'Un tableau de notes colorées pour partager les idées.', size: [1.5, 1.8, 0.6], text: 'NOS IDÉES\nObserver · Proposer · Discuter' },
  { id: 'token', name: 'Jeton de parole', category: 'Collaborer', description: 'Un objet symbolique pour organiser les échanges.', size: [0.3, 0.45, 0.3], text: 'À VOUS', interaction: 'activate' },
  { id: 'whiteboard', name: 'Tableau partagé', category: 'Collaborer', description: 'Un tableau blanc avec contenu éditable localement.', size: [2, 2, 0.65], text: 'NOTRE RAISONNEMENT\nHypothèse\nObservation\nConclusion' },
  { id: 'lectern', name: 'Pupitre d’élève', category: 'Restituer', description: 'Un pupitre en bois avec micro et tablette.', size: [0.85, 1.35, 0.6], text: 'PRÉSENTATION' },
  { id: 'display', name: 'Présentoir de réalisations', category: 'Restituer', description: 'Trois niveaux pour exposer les travaux.', size: [1.8, 1.4, 0.7], text: 'VOS RÉALISATIONS' },
  { id: 'captions', name: 'Panneau de sous-titres', category: 'Accessibilité', description: 'Un écran large pour afficher un texte de cours.', size: [2, 1.7, 0.6], text: 'SOUS-TITRES\nLe contenu de votre cours apparaît ici.' },
  { id: 'audio', name: 'Lecteur audio', category: 'Accessibilité', description: 'Une enceinte avec lecture vocale du contenu saisi.', size: [0.6, 0.8, 0.35], text: 'Bienvenue dans votre espace d’apprentissage.', interaction: 'audio' },
  {"id": "meeting-table", "name": "Table de réunion", "category": "Réunions", "description": "Plateau en bois et piétement métallique.", "size": [2.8, 0.76, 1.2], "text": "TABLE DE RÉUNION"},
  {"id": "office-chair", "name": "Fauteuil de bureau", "category": "Réunions", "description": "Assise rembourrée, accoudoirs et roulettes.", "size": [0.7, 1.2, 0.7], "text": "FAUTEUIL DE BUREAU"},
  {"id": "mobile-board", "name": "Tableau blanc mobile", "category": "Réunions", "description": "Surface de présentation sur roulettes.", "size": [1.8, 1.9, 0.6], "text": "TABLEAU BLANC MOBILE"},
  {"id": "wall-screen", "name": "Écran mural", "category": "Réunions", "description": "Écran panoramique sur support.", "size": [2, 1.2, 0.12], "text": "ÉCRAN MURAL"},
  {"id": "presentation", "name": "Pupitre de présentation", "category": "Réunions", "description": "Pupitre de conférence avec microphone.", "size": [0.8, 1.2, 0.6], "text": "PUPITRE DE PRÉSENTATION", "interaction": "help"},
  {"id": "pedestal", "name": "Socle d’exposition", "category": "Boutiques", "description": "Socle en pierre à liseré de laiton.", "size": [1, 0.8, 1], "text": "SOCLE D’EXPOSITION"},
  {"id": "shelf", "name": "Étagère commerciale", "category": "Boutiques", "description": "Quatre niveaux et montants métalliques.", "size": [1.6, 2, 0.5], "text": "ÉTAGÈRE COMMERCIALE"},
  {"id": "glass-case", "name": "Vitrine en verre", "category": "Boutiques", "description": "Vitrine transparente à étagères.", "size": [1, 1.8, 0.7], "text": "VITRINE EN VERRE"},
  {"id": "mannequin", "name": "Mannequin de présentation", "category": "Boutiques", "description": "Silhouette articulée sur socle.", "size": [0.7, 1.85, 0.5], "text": "MANNEQUIN DE PRÉSENTATION"},
  {"id": "counter", "name": "Comptoir de vente", "category": "Boutiques", "description": "Comptoir en bois avec terminal de caisse.", "size": [2, 1.05, 0.75], "text": "COMPTOIR DE VENTE"},
  {"id": "fountain", "name": "Fontaine en pierre", "category": "Zen", "description": "Bassins superposés et filets d’eau.", "size": [1.2, 1.3, 1.2], "text": "FONTAINE EN PIERRE"},
  {"id": "sand-garden", "name": "Jardin de sable", "category": "Zen", "description": "Sable ratissé, pierres et râteau.", "size": [1.5, 0.15, 1], "text": "JARDIN DE SABLE"},
  {"id": "bonsai", "name": "Bonsaï en pot", "category": "Zen", "description": "Tronc ramifié et feuillage en plateaux.", "size": [0.8, 0.9, 0.6], "text": "BONSAÏ EN POT"},
  {"id": "lantern", "name": "Lanterne japonaise", "category": "Zen", "description": "Lanterne de pierre à lumière chaude.", "size": [0.6, 1.1, 0.6], "text": "LANTERNE JAPONAISE"},
  {"id": "cushion", "name": "Coussin de méditation", "category": "Zen", "description": "Coussin rond en tissu avec passepoil.", "size": [0.7, 0.25, 0.7], "text": "COUSSIN DE MÉDITATION"},
  {"id": "breathing", "name": "Sphère de respiration", "category": "Bien-être", "description": "Sphère extensible pour accompagner une respiration.", "size": [0.8, 1, 0.8], "text": "SPHÈRE DE RESPIRATION", "interaction": "breathing"},
  {"id": "pebble", "name": "Galet sensoriel", "category": "Bien-être", "description": "Galet lisse en pierre polie.", "size": [0.5, 0.2, 0.35], "text": "GALET SENSORIEL"},
  {"id": "emotions", "name": "Roue des émotions", "category": "Bien-être", "description": "Roue composée de six secteurs colorés.", "size": [1.1, 1.5, 0.5], "text": "ROUE DES ÉMOTIONS", "interaction": "progress"},
  {"id": "journal", "name": "Journal personnel", "category": "Bien-être", "description": "Carnet ouvert avec couverture et pages.", "size": [0.5, 0.08, 0.4], "text": "JOURNAL PERSONNEL"},
  {"id": "cocoon", "name": "Fauteuil enveloppant", "category": "Bien-être", "description": "Fauteuil textile avec dossier enveloppant.", "size": [1.1, 1.4, 1], "text": "FAUTEUIL ENVELOPPANT"},
  {"id": "door", "name": "Porte à mécanisme", "category": "Jeux", "description": "Cadre métallique et porte articulée.", "size": [1.4, 2.3, 0.35], "text": "PORTE À MÉCANISME", "interaction": "activate"},
  {"id": "lever", "name": "Levier mécanique", "category": "Jeux", "description": "Levier à poignée sur base mécanique.", "size": [0.5, 0.8, 0.5], "text": "LEVIER MÉCANIQUE", "interaction": "activate"},
  {"id": "pressure-pad", "name": "Dalle de pression", "category": "Jeux", "description": "Dalle de jeu avec bord lumineux.", "size": [1.2, 0.15, 1.2], "text": "DALLE DE PRESSION", "zone": true},
  {"id": "chest", "name": "Coffre verrouillable", "category": "Jeux", "description": "Coffre en bois cerclé de métal.", "size": [1, 0.7, 0.65], "text": "COFFRE VERROUILLABLE", "interaction": "activate"},
  {"id": "key-lock", "name": "Clé et serrure", "category": "Jeux", "description": "Clé en laiton et cadenas de démonstration.", "size": [0.6, 0.45, 0.3], "text": "CLÉ ET SERRURE"},
  {"id": "battery", "name": "Batterie amovible", "category": "Industrie", "description": "Boîtier industriel, bornes et poignée.", "size": [0.8, 0.55, 0.5], "text": "BATTERIE AMOVIBLE"},
  {"id": "technical-bench", "name": "Établi technique", "category": "Industrie", "description": "Établi robuste avec étau et rangements.", "size": [2, 0.9, 0.8], "text": "ÉTABLI TECHNIQUE"},
  {"id": "diagnostic", "name": "Console de diagnostic", "category": "Industrie", "description": "Console inclinée et indicateurs.", "size": [1.2, 1.4, 0.8], "text": "CONSOLE DE DIAGNOSTIC"},
  {"id": "valve", "name": "Vanne industrielle", "category": "Industrie", "description": "Tuyau, brides et volant de commande.", "size": [0.9, 1.1, 0.6], "text": "VANNE INDUSTRIELLE", "interaction": "activate"},
  {"id": "extinguisher", "name": "Extincteur", "category": "Industrie", "description": "Bouteille, poignée, manomètre et flexible.", "size": [0.35, 0.85, 0.3], "text": "EXTINCTEUR"},
  {"id": "globe", "name": "Globe terrestre", "category": "Découverte", "description": "Globe pédagogique avec continents stylisés.", "size": [0.8, 1, 0.8], "text": "GLOBE TERRESTRE"},
  {"id": "solar-system", "name": "Système solaire", "category": "Découverte", "description": "Soleil, huit planètes et orbites schématiques.", "size": [2.4, 1.2, 2], "text": "SYSTÈME SOLAIRE"},
  {"id": "microscope", "name": "Microscope", "category": "Découverte", "description": "Optique, potence et platine de laboratoire.", "size": [0.5, 0.8, 0.6], "text": "MICROSCOPE"},
  {"id": "molecule", "name": "Modèle moléculaire", "category": "Découverte", "description": "Atomes et liaisons d’une molécule illustrative.", "size": [1, 1, 1], "text": "MODÈLE MOLÉCULAIRE"},
  {"id": "book", "name": "Livre interactif", "category": "Découverte", "description": "Livre ouvert à contenu personnalisable.", "size": [0.6, 0.12, 0.4], "text": "LIVRE INTERACTIF", "interaction": "help"},
  {"id": "sofa", "name": "Canapé modulaire", "category": "Habitat", "description": "Trois assises et coussins textiles.", "size": [2.4, 0.9, 1], "text": "CANAPÉ MODULAIRE"},
  {"id": "coffee-table", "name": "Table basse", "category": "Habitat", "description": "Plateau arrondi en chêne.", "size": [1.2, 0.42, 0.7], "text": "TABLE BASSE"},
  {"id": "floor-lamp", "name": "Lampadaire articulé", "category": "Habitat", "description": "Pied lesté, bras et abat-jour.", "size": [0.7, 1.8, 0.6], "text": "LAMPADAIRE ARTICULÉ"},
  {"id": "partition", "name": "Cloison acoustique", "category": "Habitat", "description": "Panneau textile sur pieds.", "size": [1.5, 1.8, 0.45], "text": "CLOISON ACOUSTIQUE"},
  {"id": "coffee-machine", "name": "Machine à café", "category": "Habitat", "description": "Machine à espresso, buses et tasse.", "size": [0.65, 0.65, 0.5], "text": "MACHINE À CAFÉ"},
  {"id": "tree", "name": "Arbre", "category": "Nature", "description": "Tronc et couronne de feuillage.", "size": [2.3, 3.5, 2.3], "text": "ARBRE"},
  {"id": "rock", "name": "Rocher", "category": "Nature", "description": "Volume minéral irrégulier.", "size": [1.3, 0.85, 1], "text": "ROCHER"},
  {"id": "planter", "name": "Bac de végétation", "category": "Nature", "description": "Jardinière plantée de feuillages.", "size": [1.2, 0.95, 0.55], "text": "BAC DE VÉGÉTATION"},
  {"id": "bench", "name": "Banc extérieur", "category": "Nature", "description": "Lattes de bois et supports en fonte.", "size": [1.8, 0.9, 0.6], "text": "BANC EXTÉRIEUR"},
  {"id": "bridge", "name": "Passerelle en bois", "category": "Nature", "description": "Tablier à lattes et garde-corps.", "size": [2.4, 1.1, 1.4], "text": "PASSERELLE EN BOIS"},
  {"id": "bar-chart", "name": "Graphique 3D", "category": "Données", "description": "Cinq colonnes de hauteurs réglables.", "size": [1.6, 1.5, 0.7], "text": "GRAPHIQUE 3D", "interaction": "progress"},
  {"id": "terrain", "name": "Carte topographique", "category": "Données", "description": "Relief à strates pour explorer les volumes.", "size": [1.8, 0.65, 1.5], "text": "CARTE TOPOGRAPHIQUE"},
  {"id": "network", "name": "Nœuds de réseau", "category": "Données", "description": "Graphe spatial de nœuds reliés.", "size": [1.5, 1.5, 1], "text": "NŒUDS DE RÉSEAU"},
  {"id": "timeline", "name": "Ligne du temps", "category": "Données", "description": "Cinq jalons sur une frise spatiale.", "size": [2, 0.8, 0.4], "text": "LIGNE DU TEMPS"},
  {"id": "control-panel", "name": "Panneau de commande", "category": "Données", "description": "Console de pilotage à boutons et curseurs.", "size": [1.2, 1.2, 0.65], "text": "PANNEAU DE COMMANDE", "interaction": "activate"},
] as const;

export const catalog = [...originalCatalog, ...extendedCatalog];

export type AssetId = typeof catalog[number]['id'];
export type CatalogItem = typeof catalog[number];

export const ASSET_ALIASES: Record<string, AssetId | string> = {
  'wp-bouteille-de-vin': 'wp-bouteille-de-vinaigre',
  'wp-bouteille-de-lait': 'wp-brique-de-lait',
  'wp-oeuf': 'wp-oeuf-et-coquetier',
  'wp-fromage-comte': 'wp-part-de-fromage',
  'wp-champignon-de-paris': 'wp-champignon',
  'wp-comptoir-de-vente': 'counter',
  'wp-socle-d-exposition': 'pedestal',
  'wp-viande-de-boeuf': 'wp-boite-de-conserve',
  'wp-moulin-a-poivre': 'wp-poivriere',
  'web-screen': 'wall-screen',
  'wp-cuillere-bois': 'wp-cuillere-a-soupe',
  'wp-cuillere-en-bois': 'wp-cuillere-a-soupe',
  'wp-minuteur-cuisine': 'timer',
  'wp-minuteur': 'timer',
  'wp-volant-sport': 'valve',
  'wp-volant-de-voiture': 'valve',
  'wp-automobile': 'wp-voiture',
  'automobile': 'wp-voiture',
  'car': 'wp-voiture',
  'voiture': 'wp-voiture',
  'sedan': 'wp-voiture',
  'car_sedan': 'wp-voiture',
  'berline': 'wp-voiture',
  'wp-batterie-12v': 'wp-batterie-automobile',
  'batterie-automobile': 'wp-batterie-automobile',
  'wp-batterie': 'wp-batterie-automobile',
  'battery': 'wp-batterie-automobile',
  'batterie': 'wp-batterie-automobile',
  'car_battery': 'wp-batterie-automobile',
  'car-battery': 'wp-batterie-automobile',
  'car_battery_new': 'wp-batterie-automobile',
  'car_battery_old': 'wp-batterie-automobile',
  'wp-generateur': 'wp-generateur-secours',
  'portable_generator': 'wp-generateur-secours',
  'generator': 'wp-generateur-secours',
  'generateur': 'wp-generateur-secours',
  'wp-etabli': 'technical-bench',
  'etabli': 'technical-bench',
  'workbench': 'technical-bench',
  'kitchen-island': 'wp-ilot-de-cuisine',
  'plan-de-travail': 'wp-ilot-de-cuisine',
  'table-de-cuisine': 'wp-ilot-de-cuisine',
  'wp-table': 'meeting-table',
  'wp-pompe': 'pump',
  'wp-regle': 'ruler',
  'wp-boite-a-outils': 'tools',
  'wp-balance-a-plateaux': 'balance',
  'wp-assemblage-mecanique': 'assembly',
  'wp-pupitre-orateur': 'lectern',
  'wp-totem-numerique': 'interactive',
  'wp-coupe-technique': 'cutaway',
  'wp-cartes-de-reponse': 'cards',
  'wp-bacs-de-tri': 'sorting',
  'wp-microscope': 'microscope',
  'wp-mannequin-instructeur': 'instructor',
  'wp-mains-demonstration': 'hands',
  'wp-chronometre-mecanique': 'timer',
  'wp-jeton-arcade': 'token',
  'wp-balise-lumineuse': 'success',
  'wp-console-quiz': 'quiz',
  'wp-carnet-de-notes': 'journal',
  'wp-colonne-assistance': 'help',
  'wp-borne-tactile-consignes': 'instructions',
  'wp-panneau-objectifs': 'objectives',
  'wp-fleche-directionnelle': 'arrow',
  'wp-plot-jalon': 'path',
  'wp-etiquette-sur-pied': 'label',
  'wp-extincteur': 'extinguisher',
  'wp-melon': 'wp-melon-de-cavaillon',
  'wp-chocolatine': 'wp-pain-au-chocolat',
  'wp-coquetier': 'wp-oeuf-et-coquetier',
  'apple': 'wp-pomme',
  'orange': 'wp-orange',
  'lemon': 'wp-citron',
  'banana': 'wp-banane',
  'grapes': 'wp-grappe-de-raisin',
  'strawberry': 'wp-fraise',
  'eggplant': 'wp-aubergine',
  'bell_pepper': 'wp-poivron',
  'refrigerator': 'wp-refrigerateur',
  'built_in_oven': 'wp-four-encastrable',
  'dishwasher': 'wp-lave-vaisselle',
  'sink_faucet': 'wp-evier-et-robinet',
  'bread_knife': 'wp-couteau-a-pain',
  'wok': 'wp-wok',
  'colander': 'wp-passoire',
  'skimmer': 'wp-ecumoire',
  'peeler': 'wp-eplucheur',
  'grater': 'wp-rape',
  'citrus_juicer': 'wp-presse-agrumes',
  'mortar_pestle': 'wp-mortier-et-pilon',
  'stand_blender': 'wp-mixeur-sur-socle',
  'stand_mixer': 'wp-robot-patissier'
};

export interface DetailedCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  size: [number, number, number];
  text?: string;
  role?: 'floor_furniture' | 'support' | 'prop' | 'zone' | 'static';
}

export const SPECIALIZED_DETAILED_ASSETS: Record<string, DetailedCatalogItem> = {
  // Automobile & Atelier
  'wp-voiture': { id: 'wp-voiture', name: 'Voiture Berline (Compartiment Moteur Ouvert)', category: 'Industrie', description: 'Berline automobile 3D avec capot moteur relevé et compartiment moteur complet', size: [1.8, 1.4, 2.8], role: 'floor_furniture' },
  'wp-batterie-automobile': { id: 'wp-batterie-automobile', name: 'Batterie Automobile 12V 70Ah AGM', category: 'Industrie', description: 'Batterie automobile 12V AGM avec poignée, bornes (+) rouge et (-) bleue, et voyant Magic Eye', size: [0.48, 0.32, 0.32], role: 'prop' },
  'wp-generateur-secours': { id: 'wp-generateur-secours', name: 'Générateur de Secours 12V', category: 'Industrie', description: 'Générateur / onduleur portable 12V d’atelier avec tableau de commande', size: [0.45, 0.32, 0.30], role: 'prop' },
  'wp-supercar-showroom': { id: 'wp-supercar-showroom', name: 'Supercar GT Showroom', category: 'Automobile', description: 'Supercar aérodynamique de luxe sur socle showroom', size: [2.1, 1.25, 4.4], role: 'floor_furniture' },
  'wp-plateau-tournant': { id: 'wp-plateau-tournant', name: 'Plateau Tournant Showroom', category: 'Automobile', description: 'Plateau rotatif motorisé pour exposition de véhicules', size: [3.4, 0.09, 3.4], role: 'support' },
  'wp-borne-configurateur': { id: 'wp-borne-configurateur', name: 'Borne Configurateur Holographique', category: 'Automobile', description: 'Console de personnalisation holographique pour véhicules', size: [0.8, 1.4, 0.6], role: 'floor_furniture' },
  'wp-telecommande-sport': { id: 'wp-telecommande-sport', name: 'Télécommande Sport / Clé Intelligente', category: 'Automobile', description: 'Clé fob interactive pour allumage Start-Stop', size: [0.2, 0.06, 0.25], role: 'prop' },

  // Forêt & Mycologie
  'wp-sol-forestier': { id: 'wp-sol-forestier', name: 'Sol forestier & Clairière moussée', category: 'Nature', description: 'Sol de terre riche en humus avec tapis de mousse et feuilles mortes', size: [6.4, 0.15, 6.4], role: 'static' },
  'wp-cepe-de-bordeaux': { id: 'wp-cepe-de-bordeaux', name: 'Cèpe de Bordeaux (Boletus edulis)', category: 'Nature', description: 'Cèpe noble comestible avec tubes jaunâtres et pied ventru réticulé', size: [0.24, 0.22, 0.24], role: 'prop' },
  'wp-amanite-tue-mouches': { id: 'wp-amanite-tue-mouches', name: 'Amanite tue-mouches (Amanita muscaria)', category: 'Nature', description: 'Champignon vénéneux écarlate à pustules blanches, lamelles et anneau', size: [0.22, 0.26, 0.22], role: 'prop' },
  'wp-panier-cueillette': { id: 'wp-panier-cueillette', name: 'Panier de cueillette en osier', category: 'Nature', description: 'Panier traditionnel tressé en osier avec anse cintrée et doublure lin', size: [0.48, 0.44, 0.36], role: 'prop' },
  'wp-guide-mycologie': { id: 'wp-guide-mycologie', name: 'Guide mycologique & Loupe', category: 'Nature', description: 'Guide d’identification illustré ouvert avec loupe optique en laiton', size: [0.42, 0.08, 0.30], role: 'prop' },
  'wp-chene-forestier': { id: 'wp-chene-forestier', name: 'Grand chêne de sous-bois', category: 'Nature', description: 'Chêne pédonculé ancien avec canopée dense et racines ancrées', size: [4.5, 5.5, 4.5], role: 'static' },
  'wp-tronc-mousse': { id: 'wp-tronc-mousse', name: 'Tronc d’arbre moussé & Polypores', category: 'Nature', description: 'Tronc couché moussé servant d’abri et de support aux champignons en consoles', size: [1.8, 0.45, 0.5], role: 'static' },
  'wp-fougere-sous-bois': { id: 'wp-fougere-sous-bois', name: 'Fougère aigle de sous-bois', category: 'Nature', description: 'Touffe de fougères sauvages aux frondes déployées', size: [0.8, 0.7, 0.8], role: 'prop' },

  // Maritime & Littoral
  'wp-voilier': { id: 'wp-voilier', name: 'Voilier de croisière', category: 'Maritime', description: 'Bateau voilier avec coque en bois profilée, pont en teck et grand-voile déployée', size: [1.8, 2.2, 0.7], role: 'floor_furniture' },
  'wp-bateau': { id: 'wp-bateau', name: 'Bateau de mer', category: 'Maritime', description: 'Embarcation marine côtière', size: [1.8, 2.2, 0.7], role: 'floor_furniture' },
  'wp-parasol': { id: 'wp-parasol', name: 'Parasol de plage', category: 'Plage', description: 'Grand parasol à toile rayée bleue et écru avec bague d’inclinaison', size: [2.1, 2.4, 2.1], role: 'floor_furniture' },
  'wp-parasol-plage': { id: 'wp-parasol-plage', name: 'Parasol de plage', category: 'Plage', description: 'Grand parasol à toile rayée bleue et écru avec bague d’inclinaison', size: [2.1, 2.4, 2.1], role: 'floor_furniture' },
  'wp-phare': { id: 'wp-phare', name: 'Phare maritime côtier', category: 'Maritime', description: 'Phare en maçonnerie rayée rouge et blanc avec lanterne de Fresnel rotative', size: [2.8, 5.2, 2.8], role: 'static' },
  'wp-phare-maritime': { id: 'wp-phare-maritime', name: 'Phare maritime côtier', category: 'Maritime', description: 'Phare en maçonnerie rayée rouge et blanc avec lanterne de Fresnel rotative', size: [2.8, 5.2, 2.8], role: 'static' },
  'wp-bouee': { id: 'wp-bouee', name: 'Bouée de sauvetage SOLAS', category: 'Maritime', description: 'Bouée torique orange international avec bandes réfléchissantes et cordage', size: [0.8, 0.2, 0.8], role: 'prop' },
  'wp-bouee-sauvetage': { id: 'wp-bouee-sauvetage', name: 'Bouée de sauvetage SOLAS', category: 'Maritime', description: 'Bouée torique orange international avec bandes réfléchissantes et cordage', size: [0.8, 0.2, 0.8], role: 'prop' },
  'wp-coquillage': { id: 'wp-coquillage', name: 'Coquillage marin (Coquille Saint-Jacques)', category: 'Plage', description: 'Coquille bivalve striée nacrée et conque spiralée sur le sable', size: [0.35, 0.15, 0.35], role: 'prop' },
  'wp-coquille-saint-jacques': { id: 'wp-coquille-saint-jacques', name: 'Coquille Saint-Jacques', category: 'Plage', description: 'Coquille bivalve striée nacrée', size: [0.35, 0.15, 0.35], role: 'prop' },
  'wp-panier-coquillages': { id: 'wp-panier-coquillages', name: 'Panier de collecte de coquillages', category: 'Plage', description: 'Panier de plage tressé en osier avec anse', size: [0.45, 0.40, 0.35], role: 'prop' },
  'wp-seau-plage': { id: 'wp-seau-plage', name: 'Seau de plage pour coquillages', category: 'Plage', description: 'Seau littoral de ramassage de coquillages', size: [0.35, 0.35, 0.35], role: 'prop' },

  // Haute Couture & Mode
  'wp-sac-monogram': { id: 'wp-sac-monogram', name: 'Sac à Main Monogramme Luxe', category: 'Mode', description: 'Sac en toile enduite monogrammée et cuir de vachette naturel patiné', size: [0.35, 0.28, 0.20], role: 'prop' },
  'wp-sac-capucines': { id: 'wp-sac-capucines', name: 'Sac Haut de Gamme Cuir Taurillon', category: 'Mode', description: 'Sac structuré en cuir taurillon pleine fleur avec fermoir signature', size: [0.32, 0.24, 0.16], role: 'prop' },
  'wp-presentoir-luxe': { id: 'wp-presentoir-luxe', name: 'Présentoir Marbre & Laiton de Luxe', category: 'Mode', description: 'Support de marbre blanc biseauté et tige en laiton brossé pour maroquinerie', size: [0.45, 0.65, 0.40], role: 'support' },
  'wp-podium-vip': { id: 'wp-podium-vip', name: 'Podium d’Inspection VIP', category: 'Mode', description: 'Socle d’authentification feutré pour inspection de maroquinerie', size: [0.42, 0.12, 0.38], role: 'support' },
  'wp-vitrine-luxe': { id: 'wp-vitrine-luxe', name: 'Vitrine en Verre Sécurit & Laiton', category: 'Mode', description: 'Vitrine de haute joaillerie et maroquinerie à double étagère rétroéclairée', size: [0.9, 1.8, 0.6], role: 'floor_furniture' },
  'wp-mannequin-haute-couture': { id: 'wp-mannequin-haute-couture', name: 'Mannequin Haute Couture', category: 'Mode', description: 'Buste de tailleur gainé de lin écru sur pied tripode en fonte patinée', size: [0.55, 1.65, 0.45], role: 'floor_furniture' },

  // Pâtisserie & Cuisine Compléments
  'wp-plan-patisserie': { id: 'wp-plan-patisserie', name: 'Plan de Travail Pâtissier en Marbre', category: 'Cuisine', description: 'Table pâtissière lourde en marbre de Carrare frais pour le travail des pâtes', size: [1.8, 0.9, 0.85], role: 'support' },
  'wp-ingredients-cookies': { id: 'wp-ingredients-cookies', name: 'Plateau d’Ingrédients Pâtisserie', category: 'Cuisine', description: 'Plateau compartimenté réunissant farine, sucre roux, œufs et pépites', size: [0.55, 0.12, 0.40], role: 'prop' },
  'wp-plaque-cookies': { id: 'wp-plaque-cookies', name: 'Plaque de Cuisson Pâtissière', category: 'Cuisine', description: 'Plaque en aluminium perforé garnie d’un tapis de cuisson en silicone', size: [0.44, 0.02, 0.34], role: 'prop' },
  'wp-saladier-cookies': { id: 'wp-saladier-cookies', name: 'Cul-de-poule Inox Pâtissier', category: 'Cuisine', description: 'Grand bol hémisphérique en acier inoxydable avec base antidérapante', size: [0.32, 0.20, 0.32], role: 'prop' },
  'wp-four-patisserie': { id: 'wp-four-patisserie', name: 'Four Professionnel de Pâtisserie', category: 'Cuisine', description: 'Four statique à sole réfractaire et façade en inox brossé', size: [0.95, 1.6, 0.9], role: 'floor_furniture' },
  'wp-cuillere-bois': { id: 'wp-cuillere-bois', name: 'Cuillère en bois', category: 'Cuisine', description: 'Cuillère de cuisine artisanale en bois tourné', size: [0.06, 0.03, 0.32], role: 'prop' },

  // Jeux & Studio GameDev
  'wp-console-level-design': { id: 'wp-console-level-design', name: 'Console de Level Design', category: 'Jeux', description: 'Poste de travail ergonomique multi-écrans pour la conception spatiale', size: [1.6, 1.1, 0.85], role: 'support' },
  'wp-spawn-pad': { id: 'wp-spawn-pad', name: 'Dalle de Réapparition (Spawn Pad)', category: 'Jeux', description: 'Plateforme technologique lumineuse matérialisant le point de départ du joueur', size: [1.2, 0.05, 1.2], role: 'static' },
  'wp-plateforme-flottante': { id: 'wp-plateforme-flottante', name: 'Plateforme Flottante Interactive', category: 'Jeux', description: 'Module de saut en lévitation magnétique avec balises d’énergie', size: [1.4, 0.15, 1.4], role: 'support' },
  'wp-gemme-collectable': { id: 'wp-gemme-collectable', name: 'Gemme d’Énergie Cristalline', category: 'Jeux', description: 'Cristal facetté en lévitation émettant une pulsation lumineuse', size: [0.3, 0.45, 0.3], role: 'prop' },
  'wp-piege-laser': { id: 'wp-piege-laser', name: 'Émetteur de Barrière Laser', category: 'Jeux', description: 'Tourelle sécurisée projetant un faisceau de détection volumétrique', size: [0.4, 0.9, 0.4], role: 'floor_furniture' },
  'wp-portail-victoire': { id: 'wp-portail-victoire', name: 'Portail de Téléportation de Victoire', category: 'Jeux', description: 'Arche dimensionnelle avec vortex énergétique de fin de parcours', size: [1.8, 2.5, 0.6], role: 'floor_furniture' },
  'wp-goban': { id: 'wp-goban', name: 'Goban Traditionnel en Bois de Kaya', category: 'Jeux', description: 'Plateau de jeu de Go massif 19x19 sur pieds sculptés', size: [0.46, 0.28, 0.43], role: 'support' },
  'wp-pierre-go': { id: 'wp-pierre-go', name: 'Pierres de Go (Ardoise & Coquillage)', category: 'Jeux', description: 'Pierres de Go biconvexes traditionnelles noires et blanches', size: [0.15, 0.06, 0.15], role: 'prop' },
  'wp-goke': { id: 'wp-goke', name: 'Goke (Pots à Pierres de Go)', category: 'Jeux', description: 'Paires de bols traditionnels tournés en mûrier avec couvercles', size: [0.32, 0.12, 0.16], role: 'prop' },

  // Mobilier en Kit & Atelier Montage
  'wp-meuble-ikea-kit': { id: 'wp-meuble-ikea-kit', name: 'Caisson de Meuble en Kit (Démonté)', category: 'Mobilier', description: 'Pack de panneaux pré-percés en bois mélaminé prêts à l’assemblage', size: [0.8, 0.12, 0.5], role: 'prop' },
  'wp-tapis-montage-ikea': { id: 'wp-tapis-montage-ikea', name: 'Tapis Protecteur de Montage', category: 'Mobilier', description: 'Tapis de sol en feutre pour éviter les rayures pendant l’assemblage', size: [1.8, 0.02, 1.2], role: 'static' },
  'wp-panneau-ikea': { id: 'wp-panneau-ikea', name: 'Notice de Montage 3D Illustrée', category: 'Mobilier', description: 'Pupitre pédagogique avec schéma d’assemblage par étapes', size: [0.7, 1.2, 0.5], role: 'floor_furniture' },
  'wp-quincaillerie-ikea': { id: 'wp-quincaillerie-ikea', name: 'Boîte de Visserie & Tourillons', category: 'Mobilier', description: 'Organiseur transparent de vis excentriques et tourillons en hêtre', size: [0.28, 0.08, 0.20], role: 'prop' },
  'wp-cle-allen': { id: 'wp-cle-allen', name: 'Clé Mâle Hexagonale (Clé Allen)', category: 'Mobilier', description: 'Outil coudé 4mm en acier trempé pour vissage de mobilier', size: [0.12, 0.02, 0.06], role: 'prop' },
  'wp-equerre-murale': { id: 'wp-equerre-murale', name: 'Équerres de Sécurité Anti-Basculement', category: 'Mobilier', description: 'Système de fixation murale obligatoire pour étagères hautes', size: [0.15, 0.08, 0.15], role: 'prop' },
  'wp-etagere-ikea': { id: 'wp-etagere-ikea', name: 'Étagère Bibliothèque Montée', category: 'Mobilier', description: 'Meuble assemblé à 4 casiers carrés prêt à l’usage', size: [0.77, 1.47, 0.39], role: 'floor_furniture' }
};

/**
 * Catalogue unifié WorldPilot complet :
 * Fusionne les 540 assets de base avec l'ensemble des 100+ assets spécialisés haute fidélité.
 * C'est cette liste intégrale que le LLM consulte pour sélectionner ses modèles 3D !
 */
export const fullCatalog = [
  ...catalog,
  ...Object.values(SPECIALIZED_DETAILED_ASSETS)
];

/**
 * Résout n'importe quel identifiant brut ou URL de modèle vers un assetId canonique du catalogue.
 */
export function resolveCanonicalAssetId(rawId?: string, modelUrl?: string): string | undefined {
  const cand = (rawId || '').toLowerCase().trim();
  if (!cand && !modelUrl) return undefined;

  // 1. Direct match in full catalog
  if (cand) {
    if (SPECIALIZED_DETAILED_ASSETS[cand]) return cand;
    const fromCat = catalog.find(c => c.id === cand);
    if (fromCat) return fromCat.id;
    const fromAlias = ASSET_ALIASES[cand];
    if (fromAlias) return fromAlias;
  }

  // 2. Extract from modelUrl if provided
  if (modelUrl) {
    const urlClean = modelUrl.replace(/\.glb$/i, '').split('/').pop()?.toLowerCase().trim();
    if (urlClean) {
      if (SPECIALIZED_DETAILED_ASSETS[urlClean]) return urlClean;
      const fromCatUrl = catalog.find(c => c.id === urlClean);
      if (fromCatUrl) return fromCatUrl.id;
      const fromAliasUrl = ASSET_ALIASES[urlClean];
      if (fromAliasUrl) return fromAliasUrl;
    }
  }

  // 3. Fallback matching prefix/suffix
  if (cand.startsWith('wp-')) {
    const withoutPrefix = cand.replace(/^wp-/, '');
    if (ASSET_ALIASES[withoutPrefix]) return ASSET_ALIASES[withoutPrefix] as string;
    const fromCatWithout = catalog.find(c => c.id === withoutPrefix);
    if (fromCatWithout) return fromCatWithout.id;
  } else if (cand) {
    const withPrefix = `wp-${cand}`;
    if (SPECIALIZED_DETAILED_ASSETS[withPrefix]) return withPrefix;
    if (ASSET_ALIASES[withPrefix]) return ASSET_ALIASES[withPrefix] as string;
    const fromCatWith = catalog.find(c => c.id === withPrefix);
    if (fromCatWith) return fromCatWith.id;
  }

  return cand || undefined;
}

export function getAsset(id?: string) {
  if (!id) return undefined;
  const canonicalId = resolveCanonicalAssetId(id) || id;
  const direct = catalog.find(item => item.id === canonicalId);
  if (direct) return direct;
  if (SPECIALIZED_DETAILED_ASSETS[canonicalId]) {
    return SPECIALIZED_DETAILED_ASSETS[canonicalId];
  }
  const aliasId = ASSET_ALIASES[id];
  if (aliasId) {
    const aliasItem = catalog.find(item => item.id === aliasId) || SPECIALIZED_DETAILED_ASSETS[aliasId as string];
    if (aliasItem) {
      const customName = id.includes('cuillere') ? 'Cuillère en bois' : aliasItem.name;
      return { ...aliasItem, id: id as any, name: customName };
    }
  }
  return undefined;
}
export function normalize(text: string) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' '); }

export function createLibraryPatch(ids: readonly AssetId[], existing: Record<string, EntitySpec>): WorldPatch {
  const occupied = Object.values(existing).map(e => e.capabilities.find(c => c.type === 'transform')?.position).filter(Boolean);
  const entitiesCreated = ids.map((id, i): EntitySpec => {
    const asset = getAsset(id);
    const rawName = id.replace(/^wp-/, '').replace(/[-_]/g, ' ');
    const entityName = asset?.name || (rawName.charAt(0).toUpperCase() + rawName.slice(1));
    let slot = 0;
    // Stable spacing, including repeated additions and non-library objects.
    let position = { x: 0, y: 0, z: 0 };
    do {
      const columns = 4;
      position = { x: Number(((slot % columns - 1.5) * 2.8).toFixed(2)), y: 0, z: Math.floor(slot / columns) * 2.8 - 2.8 };
      slot++;
    } while (occupied.some(p => Math.abs(p.x - position.x) < 2.4 && Math.abs(p.z - position.z) < 2.4));
    occupied.push(position);
    return {
      id: `asset_${id}_${i + 1}`, name: entityName,
      capabilities: [{ type: 'transform', position, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, { type: 'collider' },
        { type: 'educational', text: asset?.text, value: 0, active: false, correctAnswer: 'B' },
        ...(asset && 'zone' in asset && (asset as any).zone ? [{ type: 'trigger_zone', radius: 0.4 }] : [])],
      visuals: { assetId: id, modelUrl: `/library/${id}.glb` },
    };
  });
  // IDs are unique across both the existing world and this batch.
  const used = new Set(Object.keys(existing));
  entitiesCreated.forEach(entity => {
    const base = entity.id;
    let suffix = 1;
    while (used.has(entity.id)) entity.id = `${base}_${suffix++}`;
    used.add(entity.id);
  });
  const rulesChanged: RuleSpec[] = [];
  for (const entity of entitiesCreated) {
    const asset = getAsset(entity.visuals?.assetId)!;
    if ('interaction' in asset) {
      const trigger = asset.interaction === 'quiz' ? 'ANSWER_CORRECT' : asset.interaction === 'help' ? 'REQUEST_HELP' : 'INTERACT';
      rulesChanged.push({ id: `rule_${entity.id}`, trigger, conditions: [{type:'is_source',sourceId:entity.id}], actions: [{type:'set_flag',flag:`${entity.id}_${trigger.toLowerCase()}`,value:true}] });
    }
    if ('zone' in asset && asset.zone) rulesChanged.push({id:`rule_${entity.id}_drop`,trigger:'DROP',conditions:[{type:'is_target',targetId:entity.id}],actions:[{type:'set_flag',flag:`${entity.id}_occupied`,value:true}]});
  }
  return { entitiesCreated, rulesChanged };
}

export const lessonKit: AssetId[] = ['objectives', 'pump', 'instructions', 'help', 'assembly', 'socket', 'quiz', 'success'];

const COMPLEX_INTENT_KEYWORDS = [
  'jeu', 'game', 'gameplay', 'loop', 'stand de tir', 'target range',
  'enigme', 'puzzle', 'course', 'collector', 'survie', 'survival',
  'simulation', 'laboratoire', 'demonstration', 'recette', 'seminaire',
  'rover', 'maintenance', 'showroom', 'exposition', 'post-processing',
  'lumen', 'cinematique', 'texture', 'materiau', 'matériau', 'matiere', 'matière'
];

export function parseLibraryInstruction(instruction: string, existing: Record<string, EntitySpec>): WorldPatch | null {
  const norm = normalize(instruction).trim().replace(/[.!]$/, '');
  if (/^(cree|creer|ajoute|ajouter|create|add) (un |une |le |la )?(atelier pedagogique|salle de cours|cours interactif|kit pedagogique)$/.test(norm)) return createLibraryPatch(lessonKit, existing);
  const verb = /^(?:cree|creer|ajoute|ajouter|create|add|pose|poser|place|placer|mets|mettre|remets|remettre|restaure|restaurer|affiche|afficher|recharge|recharger|charge|charger|instancie|instancier|spawn)\s+(?:(?:un|une|le|la|l|l'|l’|des|les|du|de la|de l'|de l’)\s+)?/i;
  if (!verb.test(norm)) return null;
  const requested = norm.replace(verb, '').trim();

  // If the instruction targets a complex gameplay loop or procedural macro, bypass single-asset library match
  if (COMPLEX_INTENT_KEYWORDS.some(kw => requested === kw || requested.startsWith(kw + ' '))) {
    return null;
  }

  // Common synonyms / semantic aliases
  const SYNONYMS: Record<string, string> = {
    'table de cuisine': 'wp-ilot-de-cuisine',
    'table cuisine': 'wp-ilot-de-cuisine',
    'ilot': 'wp-ilot-de-cuisine',
    'ilot de cuisine': 'wp-ilot-de-cuisine',
    'ilot central': 'wp-ilot-de-cuisine',
    'plan de travail': 'wp-ilot-de-cuisine',
    'etabli de cuisine': 'wp-ilot-de-cuisine',
    'table culinaire': 'wp-ilot-de-cuisine',
    'cuillere en bois': 'wp-cuillere-bois',
    'cuillere bois': 'wp-cuillere-bois',
    'cuillère en bois': 'wp-cuillere-bois',
    'cuillère bois': 'wp-cuillere-bois',
    'cuillere de cuisine': 'wp-cuillere-bois',
    'cuillère de cuisine': 'wp-cuillere-bois',
  };

  // If kitchen context (cocotte, vegetables, chef) and requested is generic 'table' -> wp-ilot-de-cuisine
  const isKitchenContext = Object.values(existing).some(e => {
    const a = (e.visuals?.assetId || '').toLowerCase();
    const n = (e.name || '').toLowerCase();
    return a.includes('cocotte') || a.includes('courgette') || a.includes('tomate') || a.includes('recette') || n.includes('cocotte') || n.includes('recette');
  });

  if ((requested === 'table' || requested === 'la table') && isKitchenContext) {
    return createLibraryPatch(['wp-ilot-de-cuisine'], existing);
  }

  if (SYNONYMS[requested]) {
    return createLibraryPatch([SYNONYMS[requested]], existing);
  }

  // 1. Exact match on normalized name
  let asset = catalog.find(item => normalize(item.name) === requested);
  if (asset) return createLibraryPatch([asset.id], existing);

  // 2. Direct ID or Alias match
  asset = catalog.find(item => item.id === requested || item.id === `wp-${requested}` || item.id.replace('wp-', '') === requested);
  if (asset) return createLibraryPatch([asset.id], existing);

  // 3. Name starts with requested word (e.g. "table" -> "Table de réunion", "pomme" -> "Pomme rouge")
  asset = catalog.find(item => {
    const itemNorm = normalize(item.name);
    return itemNorm.startsWith(requested + ' ') || itemNorm.endsWith(' ' + requested);
  });
  if (asset) return createLibraryPatch([asset.id], existing);

  // 4. Exact word token match (e.g. "chaise", "bouteille", "verre", "ordinateur")
  asset = catalog.find(item => {
    const tokens = normalize(item.name).split(/[\s-]+/);
    return tokens.includes(requested);
  });
  if (asset) return createLibraryPatch([asset.id], existing);

  // 5. General substring match if length > 3
  if (requested.length >= 4) {
    asset = catalog.find(item => normalize(item.name).includes(requested));
    if (asset) return createLibraryPatch([asset.id], existing);
  }

  return null;
}
