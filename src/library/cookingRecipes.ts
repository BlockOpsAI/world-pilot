import type { WorldPatch, EntitySpec, RuleSpec, QuestSpec } from '../core/types';
import { getAsset } from './catalog';

export interface WinePairing {
  wine: string;
  region: string;
  temp: string;
  notes: string;
}

export const winePairings: Record<string, WinePairing> = {
  'recipe-ratatouille': {
    wine: 'Côtes de Provence Sainte-Victoire AOC',
    region: 'Provence (Rosé ou Rouge léger)',
    temp: '10 - 12°C',
    notes: 'La fraîcheur minérale et les arômes de pêche de vigne exaltent le fondant des tomates et courgettes confites au thym.'
  },
  'recipe-boeuf-bourguignon': {
    wine: 'Gevrey-Chambertin ou Bourgogne Hautes-Côtes',
    region: 'Bourgogne (Pinot Noir)',
    temp: '16 - 17°C',
    notes: 'Des tanins soyeux et des notes de griotte et sous-bois qui soutiennent magnifiquement la réduction au vin et le jarret confit.'
  },
  'recipe-gratin-dauphinois': {
    wine: 'Saint-Joseph blanc ou Roussette de Savoie',
    region: 'Rhône / Savoie',
    temp: '12 - 13°C',
    notes: 'Notes de noisette grillée et de fleurs blanches prolongeant l’onctuosité de la crème infusée à l’ail et la pomme de terre fondante.'
  },
  'recipe-quiche-lorraine': {
    wine: 'Pinot Blanc d’Alsace ou Riesling sec',
    region: 'Alsace',
    temp: '10 - 11°C',
    notes: 'La rondeur florale et la vivacité acidulée équilibrent le crémeux de la migaine et le fumé des lardons dorés.'
  },
  'recipe-soupe-oignon': {
    wine: 'Chablis Premier Cru ou Aligoté doré',
    region: 'Bourgogne (Chardonnay)',
    temp: '11 - 13°C',
    notes: 'Vif et cristallin, ce blanc tranche la richesse du Comté gratiné tout en épousant la douceur caramélisée de l’oignon.'
  },
  'recipe-soupe-a-l-oignon': {
    wine: 'Chablis Premier Cru ou Aligoté doré',
    region: 'Bourgogne (Chardonnay)',
    temp: '11 - 13°C',
    notes: 'Vif et cristallin, ce blanc tranche la richesse du Comté gratiné tout en épousant la douceur caramélisée de l’oignon.'
  },
  'recipe-risotto-champignons': {
    wine: 'Pouilly-Fuissé ou Meursault village',
    region: 'Bourgogne (Chardonnay)',
    temp: '12 - 14°C',
    notes: 'Une texture ample et beurrée en accord d’orfèvre avec la sauce liée et le parfum des sous-bois.'
  },
  'recipe-pates-carbonara': {
    wine: 'Frascati Superiore ou Chianti Classico',
    region: 'Latium / Toscane',
    temp: '12 - 16°C',
    notes: 'Une belle acidité naturelle pour nettoyer le gras noble du guanciale et exalter le piquant salé du Pecorino Romano.'
  },
  'recipe-salade-nicoise': {
    wine: 'Bandol Rosé ou Cassis blanc',
    region: 'Provence Méditerranée',
    temp: '9 - 11°C',
    notes: 'Notes d’agrumes et d’amande amère magnifiant les anchois, les œufs mollets et l’huile d’olive fruitée noire.'
  },
  'recipe-poulet-roti': {
    wine: 'Côte-Rôtie ou Saint-Émilion Grand Cru',
    region: 'Vallée du Rhône / Bordeaux',
    temp: '15 - 17°C',
    notes: 'Richesse tannique et arômes d’épices fines qui épousent à merveille la peau croustillante et le jus corsé du volailler.'
  },
  'recipe-crepes-bretonnes': {
    wine: 'Cidre bouché artisanal de Bretagne ou Grand Marnier',
    region: 'Bretagne / Normandie',
    temp: '10 - 14°C',
    notes: 'La fraîcheur effervescente de la pomme à cidre ou l’ampleur de la liqueur d’orange amère exhaussent le beurre salé.'
  },
  'recipe-crepes-suzette': {
    wine: 'Grand Marnier Cuvée Centenaire ou Cidre doux',
    region: 'Normandie / Liqueur de prestige',
    temp: '14 - 16°C',
    notes: 'La puissance flambée de l’orange amère et le caramel au beurre salé s’unissent dans un bouquet envoûtant.'
  },
  'recipe-mousse-chocolat': {
    wine: 'Maury Vintage ou Banyuls Grand Cru',
    region: 'Roussillon (Vin Doux Naturel)',
    temp: '14 - 15°C',
    notes: 'Notes de cacao amer, pruneau et cerise kirschée qui fusionnent avec la texture aérée du chocolat noir 70%.'
  },
  'recipe-mousse-au-chocolat': {
    wine: 'Maury Vintage ou Banyuls Grand Cru',
    region: 'Roussillon (Vin Doux Naturel)',
    temp: '14 - 15°C',
    notes: 'Notes de cacao amer, pruneau et cerise kirschée qui fusionnent avec la texture aérée du chocolat noir 70%.'
  },
  'recipe-tarte-tatin': {
    wine: 'Cidre fermier brut de Normandie ou Calvados',
    region: 'Normandie',
    temp: '10 - 12°C',
    notes: 'L’amertume fine de la pomme caramélisée et le feuilleté croustillant sublimés par les bulles vives du verger normand.'
  }
};

export interface CookingRecipe {
  id: string;
  number: number;
  title: string;
  category: 'Plats mijotés & tradition' | 'Légumes & entrées' | 'Pâtes & féculents' | 'Desserts & pâtisserie';
  difficulty: 'Facile' | 'Intermédiaire' | 'Chef';
  prepTime: string;
  cookTime: string;
  servings: number;
  description: string;
  ingredients: { name: string; quantity: string; assetId: string }[];
  utensils: { name: string; assetId: string }[];
  culinaryTechniques: string[];
  steps: string[];
  chefTip: string;
  quizQuestion: { question: string; options: string[]; answer: 'A' | 'B' | 'C' };
  assetPlacements: { assetId: string; pos: [number, number, number]; rot?: [number, number, number]; scale?: [number, number, number] }[];
  winePairing?: WinePairing;
}

export const cookingRecipes: CookingRecipe[] = [
  {
    id: 'recipe-ratatouille',
    number: 1,
    title: 'La Ratatouille provençale',
    category: 'Plats mijotés & tradition',
    difficulty: 'Facile',
    prepTime: '25 min',
    cookTime: '45 min',
    servings: 4,
    description: 'Le grand classique du soleil aux courgettes, tomates, poivrons et herbes de Provence.',
    ingredients: [
      { name: 'Courgette fraîche', quantity: '2 pièces', assetId: 'wp-courgette' },
      { name: 'Tomates mûres', quantity: '4 pièces', assetId: 'wp-tomate' },
      { name: 'Oignon jaune', quantity: '1 pièce', assetId: 'wp-oignon-jaune' },
      { name: 'Gousse d’ail', quantity: '3 gousses', assetId: 'wp-gousse-d-ail' },
      { name: 'Huile d’olive', quantity: '3 c. à soupe', assetId: 'wp-huile-d-olive-de-provence' },
      { name: 'Bouquet garni', quantity: '1 bouquet', assetId: 'wp-bouquet-garni' },
      { name: 'Fleur de sel', quantity: '1 pincée', assetId: 'wp-fleur-de-sel-de-guerande' },
    ],
    utensils: [
      { name: 'Cocotte en fonte', assetId: 'wp-cocotte' },
      { name: 'Planche à découper', assetId: 'wp-planche-a-decouper' },
      { name: 'Couteau de chef', assetId: 'wp-couteau-de-chef' },
      { name: 'Spatule en bois', assetId: 'wp-spatule' },
    ],
    culinaryTechniques: ['Émincer', 'Faire suer', 'Mijoter à feu doux', 'Monder'],
    steps: [
      '1. Laver les légumes. Couper les courgettes et tomates en dés réguliers.',
      '2. Émincer finement l’oignon et écraser les gousses d’ail dégermées.',
      '3. Dans la cocotte, faire chauffer l’huile d’olive et faire suer l’oignon sans coloration.',
      '4. Ajouter les courgettes, puis les tomates, le bouquet garni et l’ail.',
      '5. Saler à la fleur de sel, couvrir et laisser mijoter à feu doux 45 minutes en remuant délicatement.',
    ],
    chefTip: 'Pour une ratatouille exceptionnelle, faites dorer chaque légume séparément avant de les réunir dans la cocotte pour le mijotage final.',
    quizQuestion: {
      question: 'Quel est le geste technique consistant à faire cuire l’oignon doucement dans l’huile sans le brûler ?',
      options: ['Faire suer', 'Blanchir', 'Déglacer'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-cocotte', pos: [0, 0.9, -0.2] },
      { assetId: 'wp-planche-a-decouper', pos: [0, 0.9, 0.3] },
      { assetId: 'wp-couteau-de-chef', pos: [0.25, 0.92, 0.3] },
      { assetId: 'wp-courgette', pos: [-0.4, 0.9, 0.2] },
      { assetId: 'wp-tomate', pos: [-0.4, 0.9, -0.1] },
      { assetId: 'wp-oignon-jaune', pos: [0.45, 0.9, 0.2] },
      { assetId: 'wp-gousse-d-ail', pos: [0.45, 0.9, 0.05] },
      { assetId: 'wp-huile-d-olive-de-provence', pos: [-0.55, 0.9, -0.3] },
      { assetId: 'wp-bouquet-garni', pos: [0.45, 0.9, -0.2] },
      { assetId: 'wp-fleur-de-sel-de-guerande', pos: [0.25, 0.9, -0.3] },
    ]
  },
  {
    id: 'recipe-boeuf-bourguignon',
    number: 2,
    title: 'Le Bœuf Bourguignon de tradition',
    category: 'Plats mijotés & tradition',
    difficulty: 'Chef',
    prepTime: '35 min',
    cookTime: '3 h',
    servings: 6,
    description: 'Morceaux de bœuf fondants mijotés lentement au vin rouge de Bordeaux, carottes et aromates.',
    ingredients: [
      { name: 'Vin rouge de Bordeaux', quantity: '75 cl', assetId: 'wp-bouteille-de-vin' },
      { name: 'Carottes fraîches', quantity: '4 pièces', assetId: 'wp-carotte' },
      { name: 'Oignon jaune', quantity: '2 pièces', assetId: 'wp-oignon-jaune' },
      { name: 'Échalote', quantity: '2 pièces', assetId: 'wp-echalote' },
      { name: 'Ail', quantity: '2 gousses', assetId: 'wp-gousse-d-ail' },
      { name: 'Beurre doux', quantity: '30 g', assetId: 'wp-plaquette-de-beurre' },
      { name: 'Bouquet garni', quantity: '1 pièce', assetId: 'wp-bouquet-garni' },
    ],
    utensils: [
      { name: 'Cocotte en fonte', assetId: 'wp-cocotte' },
      { name: 'Planche de chef', assetId: 'wp-planche-a-decouper' },
      { name: 'Couteau de chef', assetId: 'wp-couteau-de-chef' },
      { name: 'Louche en inox', assetId: 'wp-louche' },
    ],
    culinaryTechniques: ['Saisir à feu vif', 'Singer (saupoudrer de farine)', 'Déglacer au vin rouge', 'Mijoter longuement'],
    steps: [
      '1. Tailler la viande en cubes réguliers de 5 cm. Éplucher les carottes et oignons.',
      '2. Dans la cocotte avec un mélange beurre-huile, faire dorer les morceaux de viande à feu vif.',
      '3. Retirer la viande, faire revenir les oignons et les carottes taillées en biseau.',
      '4. Remettre la viande, singer avec une cuillère de farine pour lier la sauce.',
      '5. Déglacer avec le vin rouge de Bordeaux, porter à ébullition, puis ajouter l’ail et le bouquet garni.',
      '6. Couvrir et laisser confire 3 heures à feu très doux.',
    ],
    chefTip: 'Le bœuf bourguignon est encore meilleur réchauffé le lendemain. Préparez-le la veille de votre repas !',
    quizQuestion: {
      question: 'Que signifie le terme culinaire « singer » la viande ?',
      options: ['La saupoudrer de farine', 'L’arroser de vin chaud', 'La faire griller à sec'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-cocotte', pos: [0, 0.9, -0.2] },
      { assetId: 'wp-bouteille-de-vin', pos: [-0.5, 0.9, -0.25] },
      { assetId: 'wp-carotte', pos: [-0.4, 0.9, 0.2] },
      { assetId: 'wp-oignon-jaune', pos: [0.4, 0.9, 0.2] },
      { assetId: 'wp-echalote', pos: [0.55, 0.9, 0.1] },
      { assetId: 'wp-plaquette-de-beurre', pos: [0.35, 0.9, -0.2] },
      { assetId: 'wp-bouquet-garni', pos: [-0.25, 0.9, -0.3] },
    ]
  },
  {
    id: 'recipe-gratin-dauphinois',
    number: 3,
    title: 'Le Gratin Dauphinois fondant',
    category: 'Pâtes & féculents',
    difficulty: 'Facile',
    prepTime: '20 min',
    cookTime: '1 h 15',
    servings: 6,
    description: 'Fines lamelles de pommes de terre fondantes cuites doucement dans la crème et frottées à l’ail.',
    ingredients: [
      { name: 'Pommes de terre', quantity: '1,2 kg', assetId: 'wp-pomme-de-terre' },
      { name: 'Crème fraîche', quantity: '40 cl', assetId: 'wp-pot-de-creme-fraiche' },
      { name: 'Lait entier', quantity: '50 cl', assetId: 'wp-bouteille-de-lait' },
      { name: 'Gousse d’ail', quantity: '2 gousses', assetId: 'wp-gousse-d-ail' },
      { name: 'Beurre', quantity: '40 g', assetId: 'wp-plaquette-de-beurre' },
      { name: 'Fleur de sel', quantity: '1 c. à café', assetId: 'wp-fleur-de-sel-de-guerande' },
    ],
    utensils: [
      { name: 'Plat à gratin', assetId: 'wp-saladier' },
      { name: 'Couteau de chef', assetId: 'wp-couteau-de-chef' },
      { name: 'Casserole', assetId: 'wp-casserole' },
    ],
    culinaryTechniques: ['Frotter le plat à l’ail', 'Mandoliner (émincer très fin)', 'Ne pas rincer les pommes de terre (garder l’amidon)'],
    steps: [
      '1. Éplucher les pommes de terre et les émincer en rondelles fines de 2 mm sans les rincer.',
      '2. Frotter généreusement le plat avec une gousse d’ail coupée, puis beurrer le plat.',
      '3. Dans une casserole, porter à frémissement le lait, la crème, le sel et la seconde gousse d’ail écrasée.',
      '4. Disposer les rondelles en couches régulières dans le plat.',
      '5. Verser le mélange lait-crème chaud sur les pommes de terre.',
      '6. Enfourner à 160°C pendant 1 heure et quart jusqu’à ce que le dessus soit gratiné et doré à souhait.',
    ],
    chefTip: 'La véritable recette traditionnelle dauphinoise ne contient aucun fromage : c’est l’amidon naturel des pommes de terre et la crème qui créent le gratiné velouté.',
    quizQuestion: {
      question: 'Pourquoi ne faut-il jamais rincer les pommes de terre après les avoir coupées pour le gratin ?',
      options: ['Pour conserver l’amidon naturel qui lie la crème', 'Pour éviter qu’elles noircissent', 'Pour garder le sucre'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-pomme-de-terre', pos: [-0.35, 0.9, 0.2] },
      { assetId: 'wp-pot-de-creme-fraiche', pos: [0.35, 0.9, 0.2] },
      { assetId: 'wp-bouteille-de-lait', pos: [-0.5, 0.9, -0.2] },
      { assetId: 'wp-plaquette-de-beurre', pos: [0.45, 0.9, -0.2] },
      { assetId: 'wp-gousse-d-ail', pos: [0.15, 0.9, 0.25] },
      { assetId: 'wp-casserole', pos: [0, 0.9, -0.2] },
    ]
  },
  {
    id: 'recipe-quiche-lorraine',
    number: 4,
    title: 'La Quiche Lorraine authentique',
    category: 'Plats mijotés & tradition',
    difficulty: 'Facile',
    prepTime: '20 min',
    cookTime: '35 min',
    servings: 6,
    description: 'Une garniture onctueuse d’œufs et de crème (l’appareil à quiche / la migaine) sur pâte dorée.',
    ingredients: [
      { name: 'Œufs frais', quantity: '4 œufs', assetId: 'wp-oeuf' },
      { name: 'Crème fraîche épaisse', quantity: '30 cl', assetId: 'wp-pot-de-creme-fraiche' },
      { name: 'Lait entier', quantity: '15 cl', assetId: 'wp-bouteille-de-lait' },
      { name: 'Beurre', quantity: '20 g', assetId: 'wp-plaquette-de-beurre' },
      { name: 'Fromage Comté', quantity: '100 g', assetId: 'wp-fromage-comte' },
    ],
    utensils: [
      { name: 'Saladier / cul-de-poule', assetId: 'wp-saladier' },
      { name: 'Fouet de cuisine', assetId: 'wp-fouet-de-cuisine' },
      { name: 'Poêle de chef', assetId: 'wp-poele' },
    ],
    culinaryTechniques: ['Fouetter l’appareil (migaine)', 'Rissoler', 'Cuire à blanc'],
    steps: [
      '1. Foncer un moule à tarte avec la pâte et piquer le fond avec une fourchette.',
      '2. Dans une poêle, faire dorer les lardons à sec pendant 4 minutes, puis les égoutter sur du papier.',
      '3. Dans le saladier, battre les 4 œufs entiers avec le fouet.',
      '4. Incorporer la crème fraîche, le lait, le poivre et une pointe de muscade.',
      '5. Répartir les lardons sur le fond de tarte, puis verser délicatement la migaine.',
      '6. Cuire 35 minutes à 180°C jusqu’à ce que le dessus soit gonflé et joliment doré.',
    ],
    chefTip: 'Pour éviter que le fond de tarte ne détrempe, précuisez la pâte 10 minutes à blanc avant d’ajouter l’appareil liquide.',
    quizQuestion: {
      question: 'Comment appelle-t-on le mélange traditionnel d’œufs et de crème fraîche battus ?',
      options: ['La migaine', 'La béchamel', 'La marinade'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-saladier', pos: [0, 0.9, 0] },
      { assetId: 'wp-fouet-de-cuisine', pos: [0.25, 0.9, 0.15] },
      { assetId: 'wp-oeuf', pos: [-0.35, 0.9, 0.2] },
      { assetId: 'wp-pot-de-creme-fraiche', pos: [-0.45, 0.9, -0.15] },
      { assetId: 'wp-poele', pos: [0.45, 0.9, -0.2] },
      { assetId: 'wp-fromage-comte', pos: [0.4, 0.9, 0.2] },
    ]
  },
  {
    id: 'recipe-soupe-oignon',
    number: 5,
    title: 'La Soupe à l’oignon gratinée des Halles',
    category: 'Plats mijotés & tradition',
    difficulty: 'Intermédiaire',
    prepTime: '15 min',
    cookTime: '40 min',
    servings: 4,
    description: 'La recette mythique des bistros parisiens, avec oignons dorés, croûtons de baguette et fromage fondu.',
    ingredients: [
      { name: 'Oignons jaunes', quantity: '1 kg', assetId: 'wp-oignon-jaune' },
      { name: 'Baguette de tradition', quantity: '1 pièce', assetId: 'wp-baguette' },
      { name: 'Fromage Comté râpé', quantity: '150 g', assetId: 'wp-fromage-comte' },
      { name: 'Beurre doux', quantity: '50 g', assetId: 'wp-plaquette-de-beurre' },
      { name: 'Ail', quantity: '1 gousse', assetId: 'wp-gousse-d-ail' },
    ],
    utensils: [
      { name: 'Cocotte en fonte', assetId: 'wp-cocotte' },
      { name: 'Couteau de chef', assetId: 'wp-couteau-de-chef' },
      { name: 'Planche de découpe', assetId: 'wp-planche-a-decouper' },
    ],
    culinaryTechniques: ['Compoter les oignons', 'Caraméliser', 'Gratiner sous le grill'],
    steps: [
      '1. Éplucher et émincer finement tous les oignons en lamelles régulières.',
      '2. Faire fondre le beurre dans la cocotte et ajouter les oignons avec une pincée de sel.',
      '3. Laisser compoter et caraméliser doucement 25 minutes jusqu’à l’obtention d’une teinte ambrée profonde.',
      '4. Mouiller avec 1,5 litre de bouillon chaud et laisser frémir 15 minutes.',
      '5. Trancher la baguette, frotter les tranches à l’ail et les faire dorer au four.',
      '6. Verser la soupe dans des bols, déposer les croûtons, couvrir généreusement de Comté et gratiner 8 minutes sous le grill.',
    ],
    chefTip: 'La caramélisation lente des oignons est la clé absolue : ne brusquez pas la cuisson, c’est le sucre naturel de l’oignon qui donne toute sa richesse au bouillon.',
    quizQuestion: {
      question: 'Quel est le secret pour obtenir le goût si doux et riche de la soupe à l’oignon ?',
      options: ['La caramélisation lente des oignons dans le beurre', 'Ajouter du sucre en poudre', 'Faire bouillir très vite'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-cocotte', pos: [0, 0.9, -0.2] },
      { assetId: 'wp-oignon-jaune', pos: [-0.35, 0.9, 0.2] },
      { assetId: 'wp-baguette', pos: [0.35, 0.9, 0.2] },
      { assetId: 'wp-fromage-comte', pos: [0.45, 0.9, -0.2] },
      { assetId: 'wp-plaquette-de-beurre', pos: [-0.45, 0.9, -0.2] },
    ]
  },
  {
    id: 'recipe-risotto-champignons',
    number: 6,
    title: 'Le Risotto crémeux aux champignons',
    category: 'Pâtes & féculents',
    difficulty: 'Intermédiaire',
    prepTime: '15 min',
    cookTime: '25 min',
    servings: 4,
    description: 'Grains de riz ronds nacrés cuits par absorption avec champignons dorés, échalotes et beurre frais.',
    ingredients: [
      { name: 'Paquet de riz', quantity: '320 g', assetId: 'wp-paquet-de-riz' },
      { name: 'Champignons de Paris', quantity: '300 g', assetId: 'wp-champignon-de-paris' },
      { name: 'Échalotes', quantity: '2 pièces', assetId: 'wp-echalote' },
      { name: 'Beurre', quantity: '50 g', assetId: 'wp-plaquette-de-beurre' },
      { name: 'Huile d’olive', quantity: '2 c. à soupe', assetId: 'wp-huile-d-olive-de-provence' },
    ],
    utensils: [
      { name: 'Casserole inox', assetId: 'wp-casserole' },
      { name: 'Spatule en bois', assetId: 'wp-spatule' },
      { name: 'Planche de chef', assetId: 'wp-planche-a-decouper' },
    ],
    culinaryTechniques: ['Nacrer le riz', 'Cuisson par absorption', 'Mantecare (émulsionner beurre et fromage)'],
    steps: [
      '1. Nettoyer et couper les champignons en lamelles. Les faire sauter vivement dans une poêle.',
      '2. Hacher finement les échalotes et les faire fondre dans la casserole avec l’huile et une noisette de beurre.',
      '3. Verser le riz sec et remuer 2 minutes jusqu’à ce que les grains deviennent translucides (nacrer).',
      '4. Verser une louche de bouillon chaud, remuer doucement jusqu’à absorption complète.',
      '5. Répéter l’opération louche par louche pendant environ 18 minutes.',
      '6. Hors du feu, incorporer les champignons, le restant de beurre froid et mélanger vivement pour obtenir la liaison crémeuse.',
    ],
    chefTip: 'Le bouillon doit être maintenu très chaud tout au long de la cuisson pour ne jamais stopper la gélatinisation de l’amidon du riz.',
    quizQuestion: {
      question: 'Que signifie « nacrer le riz » lors de la préparation d’un risotto ?',
      options: ['Enrober les grains dans la matière grasse chaude jusqu’à translucidité', 'Rincer le riz trois fois à l’eau glacée', 'Le faire bouillir dans du lait'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-casserole', pos: [0, 0.9, -0.2] },
      { assetId: 'wp-paquet-de-riz', pos: [-0.4, 0.9, 0.15] },
      { assetId: 'wp-champignon-de-paris', pos: [0.35, 0.9, 0.2] },
      { assetId: 'wp-echalote', pos: [0.45, 0.9, -0.1] },
      { assetId: 'wp-plaquette-de-beurre', pos: [-0.45, 0.9, -0.25] },
      { assetId: 'wp-spatule', pos: [0.15, 0.9, 0.25] },
    ]
  },
  {
    id: 'recipe-pates-carbonara',
    number: 7,
    title: 'Les Pâtes gourmandes à la française',
    category: 'Pâtes & féculents',
    difficulty: 'Facile',
    prepTime: '10 min',
    cookTime: '12 min',
    servings: 4,
    description: 'Pâtes al dente enrobées d’une crème onctueuse aux jaunes d’œufs, poivre moulu et fromage affiné.',
    ingredients: [
      { name: 'Paquet de pâtes', quantity: '400 g', assetId: 'wp-paquet-de-pates' },
      { name: 'Œufs frais', quantity: '4 jaunes', assetId: 'wp-oeuf' },
      { name: 'Crème fraîche', quantity: '20 cl', assetId: 'wp-pot-de-creme-fraiche' },
      { name: 'Fromage Comté', quantity: '80 g', assetId: 'wp-fromage-comte' },
      { name: 'Fleur de sel', quantity: '1 pincée', assetId: 'wp-fleur-de-sel-de-guerande' },
    ],
    utensils: [
      { name: 'Grande marmite', assetId: 'wp-casserole' },
      { name: 'Saladier de liaison', assetId: 'wp-saladier' },
      { name: 'Passoire inox', assetId: 'wp-saladier' },
    ],
    culinaryTechniques: ['Cuisson al dente', 'Liaison hors du feu', 'Émulsionner avec l’eau de cuisson'],
    steps: [
      '1. Faire bouillir un grand volume d’eau salée (1 litre pour 100 g de pâtes).',
      '2. Plonger les pâtes et cuire selon le temps indiqué pour une texture al dente.',
      '3. Dans le saladier, fouetter les jaunes d’œufs avec la crème, le sel et le poivre.',
      '4. Prélever une demi-louche d’eau de cuisson bouillante et l’ajouter à l’appareil à œufs.',
      '5. Égoutter les pâtes et les verser immédiatement dans le saladier hors du feu.',
      '6. Mélanger vivement pour créer un enrobage soyeux sans faire coaguler les œufs.',
    ],
    chefTip: 'La liaison aux œufs doit toujours se faire hors du feu direct : la chaleur résiduelle des pâtes suffit à cuire délicatement la sauce en crème soyeuse.',
    quizQuestion: {
      question: 'Pourquoi mélange-t-on les œufs et la crème aux pâtes obligatoirement hors du feu ?',
      options: ['Pour éviter que les œufs ne cuisent en omelette grumeleuse', 'Pour refroidir les pâtes', 'Pour évaporer la crème'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-casserole', pos: [0, 0.9, -0.2] },
      { assetId: 'wp-paquet-de-pates', pos: [-0.4, 0.9, 0.15] },
      { assetId: 'wp-oeuf', pos: [0.35, 0.9, 0.2] },
      { assetId: 'wp-pot-de-creme-fraiche', pos: [0.45, 0.9, -0.15] },
      { assetId: 'wp-fromage-comte', pos: [-0.35, 0.9, -0.2] },
    ]
  },
  {
    id: 'recipe-salade-nicoise',
    number: 8,
    title: 'La Salade Niçoise du marché',
    category: 'Légumes & entrées',
    difficulty: 'Facile',
    prepTime: '20 min',
    cookTime: '10 min',
    servings: 4,
    description: 'Une assiette fraîche et colorée mêlant crudités croquantes, œufs mollets et vinaigrette à l’huile d’olive.',
    ingredients: [
      { name: 'Salade verte croquante', quantity: '1 cœur', assetId: 'wp-salade-verte' },
      { name: 'Tomates fraîches', quantity: '3 pièces', assetId: 'wp-tomate' },
      { name: 'Concombre', quantity: '1 pièce', assetId: 'wp-concombre' },
      { name: 'Radis roses', quantity: '1 botte', assetId: 'wp-radis-rose' },
      { name: 'Œufs frais', quantity: '4 œufs', assetId: 'wp-oeuf' },
      { name: 'Huile d’olive de Provence', quantity: '4 c. à soupe', assetId: 'wp-huile-d-olive-de-provence' },
    ],
    utensils: [
      { name: 'Grand saladier', assetId: 'wp-saladier' },
      { name: 'Planche de chef', assetId: 'wp-planche-a-decouper' },
      { name: 'Couteau d’office', assetId: 'wp-couteau-de-chef' },
    ],
    culinaryTechniques: ['Cuisson des œufs mollets (6 min)', 'Tailler en éventail', 'Monter une vinaigrette'],
    steps: [
      '1. Cuire les œufs dans l’eau bouillante pendant 6 minutes, puis les plonger dans l’eau glacée et les écaler.',
      '2. Effeuiller et essorer la salade verte. Tapisser le fond du grand saladier.',
      '3. Trancher les tomates en quartiers et le concombre en fines rondelles.',
      '4. Équeuter et tailler les radis roses en biseau.',
      '5. Disposer harmonieusement tous les légumes sur la salade sans mélanger.',
      '6. Déposer les œufs coupés en deux au centre et arroser d’huile d’olive et de fleur de sel.',
    ],
    chefTip: 'Le plongeon immédiat des œufs dans l’eau glacée stoppe net la cuisson et permet d’obtenir un jaune coulant parfait et un écalage facile.',
    quizQuestion: {
      question: 'Combien de temps fait-on cuire un œuf dans l’eau bouillante pour obtenir un œuf mollet au jaune fondant ?',
      options: ['6 minutes', '3 minutes', '10 minutes'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-saladier', pos: [0, 0.9, 0] },
      { assetId: 'wp-salade-verte', pos: [-0.4, 0.9, 0.15] },
      { assetId: 'wp-tomate', pos: [0.35, 0.9, 0.2] },
      { assetId: 'wp-concombre', pos: [-0.35, 0.9, -0.2] },
      { assetId: 'wp-radis-rose', pos: [0.45, 0.9, -0.1] },
      { assetId: 'wp-oeuf', pos: [0, 0.9, 0.35] },
      { assetId: 'wp-huile-d-olive-de-provence', pos: [-0.5, 0.9, 0] },
    ]
  },
  {
    id: 'recipe-poulet-roti',
    number: 9,
    title: 'Le Poulet rôti du dimanche & grenailles',
    category: 'Plats mijotés & tradition',
    difficulty: 'Intermédiaire',
    prepTime: '15 min',
    cookTime: '1 h 10',
    servings: 4,
    description: 'Une peau croustillante dorée au beurre, chair moelleuse parfumée à l’ail et petites pommes de terre confites au jus.',
    ingredients: [
      { name: 'Pommes de terre', quantity: '800 g', assetId: 'wp-pomme-de-terre' },
      { name: 'Gousses d’ail', quantity: '1 tête', assetId: 'wp-gousse-d-ail' },
      { name: 'Beurre doux', quantity: '60 g', assetId: 'wp-plaquette-de-beurre' },
      { name: 'Bouquet garni', quantity: '1 pièce', assetId: 'wp-bouquet-garni' },
      { name: 'Fleur de sel', quantity: '1 c. à café', assetId: 'wp-fleur-de-sel-de-guerande' },
    ],
    utensils: [
      { name: 'Cocotte / plat de rôtissage', assetId: 'wp-cocotte' },
      { name: 'Couteau de découpe', assetId: 'wp-couteau-de-chef' },
      { name: 'Pinceau à beurre', assetId: 'wp-spatule' },
    ],
    culinaryTechniques: ['Beurrer sous la peau', 'Ail en chemise', 'Arroser régulièrement avec le jus'],
    steps: [
      '1. Préchauffer le four à 200°C. Laver et essuyer les pommes de terre sans les éplucher.',
      '2. Glisser des noisettes de beurre sous la peau du poulet pour nourrir la chair.',
      '3. Placer les gousses d’ail non épluchées (en chemise) et le bouquet garni autour de la volaille.',
      '4. Disposer les pommes de terre tout autour dans le fond du plat.',
      '5. Enfourner et arroser avec le jus de cuisson toutes les 20 minutes.',
      '6. Laisser reposer 10 minutes sous une feuille d’aluminium avant de découper.',
    ],
    chefTip: 'Le repos de 10 minutes après sortie du four permet aux sucs et jus de cuisson de diffuser au cœur de la viande : votre poulet sera incomparablement tendre.',
    quizQuestion: {
      question: 'Pourquoi met-on l’ail « en chemise » dans le plat de rôtissage ?',
      options: ['Avec sa peau pour qu’il confise doucement sans brûler', 'Dans un papier sulfurisé', 'Mixé avec du beurre'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-cocotte', pos: [0, 0.9, -0.1] },
      { assetId: 'wp-pomme-de-terre', pos: [-0.4, 0.9, 0.2] },
      { assetId: 'wp-gousse-d-ail', pos: [0.4, 0.9, 0.2] },
      { assetId: 'wp-plaquette-de-beurre', pos: [0.45, 0.9, -0.2] },
      { assetId: 'wp-bouquet-garni', pos: [-0.45, 0.9, -0.2] },
    ]
  },
  {
    id: 'recipe-crepes-bretonnes',
    number: 10,
    title: 'Les Crêpes bretonnes traditionnelles',
    category: 'Desserts & pâtisserie',
    difficulty: 'Facile',
    prepTime: '15 min',
    cookTime: '20 min',
    servings: 6,
    description: 'Pâte à crêpes fluide et parfumée, dorée au beurre noisette dans la poêle bien chaude.',
    ingredients: [
      { name: 'Lait entier', quantity: '50 cl', assetId: 'wp-bouteille-de-lait' },
      { name: 'Œufs frais', quantity: '4 œufs', assetId: 'wp-oeuf' },
      { name: 'Beurre doux', quantity: '50 g', assetId: 'wp-plaquette-de-beurre' },
      { name: 'Paquet de sucre', quantity: '50 g', assetId: 'wp-paquet-de-sucre' },
      { name: 'Fleur de sel', quantity: '1 pincée', assetId: 'wp-fleur-de-sel-de-guerande' },
    ],
    utensils: [
      { name: 'Grand saladier', assetId: 'wp-saladier' },
      { name: 'Fouet de cuisine', assetId: 'wp-fouet-de-cuisine' },
      { name: 'Poêle à crêpes', assetId: 'wp-poele' },
      { name: 'Louche en inox', assetId: 'wp-louche' },
    ],
    culinaryTechniques: ['Faire un puits', 'Beurre noisette', 'Temps de repos de la pâte'],
    steps: [
      '1. Dans le saladier, verser la farine avec le sucre et la pincée de sel. Former un puits au centre.',
      '2. Casser les 4 œufs dans le puits et commencer à mélanger au fouet depuis le centre.',
      '3. Verser le lait tiédi progressivement en filet pour éviter tout grumeau.',
      '4. Faire fondre le beurre jusqu’à une couleur ambrée (beurre noisette) et l’incorporer à la pâte.',
      '5. Laisser reposer la pâte 30 minutes à température ambiante.',
      '6. Cuire les crêpes dans la poêle beurrée très chaude 1 minute par face.',
    ],
    chefTip: 'Le beurre noisette apporte un goût inimitable de biscuit qui transforme de simples crêpes en dessert digne d’une crêperie artisanale.',
    quizQuestion: {
      question: 'Qu’est-ce que le « beurre noisette » utilisé par les pâtissiers ?',
      options: ['Un beurre fondu jusqu’à légère coloration ambrée parfumée', 'Un beurre mélangé à de la poudre de noisettes', 'Un beurre congelé râpé'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-saladier', pos: [0, 0.9, 0] },
      { assetId: 'wp-poele', pos: [0.45, 0.9, -0.2] },
      { assetId: 'wp-fouet-de-cuisine', pos: [0.15, 0.9, 0.25] },
      { assetId: 'wp-bouteille-de-lait', pos: [-0.45, 0.9, -0.2] },
      { assetId: 'wp-oeuf', pos: [-0.35, 0.9, 0.2] },
      { assetId: 'wp-plaquette-de-beurre', pos: [0.4, 0.9, 0.2] },
      { assetId: 'wp-paquet-de-sucre', pos: [-0.2, 0.9, -0.25] },
    ]
  },
  {
    id: 'recipe-mousse-chocolat',
    number: 11,
    title: 'La Mousse au chocolat noir intense',
    category: 'Desserts & pâtisserie',
    difficulty: 'Facile',
    prepTime: '20 min',
    cookTime: '5 min',
    servings: 4,
    description: 'Une mousse aérienne et ferme à base de chocolat noir 70%, blancs en neige et pointe de sel.',
    ingredients: [
      { name: 'Tablette de chocolat 70%', quantity: '200 g', assetId: 'wp-tablette-de-chocolat' },
      { name: 'Œufs frais', quantity: '6 œufs', assetId: 'wp-oeuf' },
      { name: 'Beurre doux', quantity: '30 g', assetId: 'wp-plaquette-de-beurre' },
      { name: 'Paquet de sucre', quantity: '30 g', assetId: 'wp-paquet-de-sucre' },
      { name: 'Fleur de sel', quantity: '1 pincée', assetId: 'wp-fleur-de-sel-de-guerande' },
    ],
    utensils: [
      { name: 'Casserole bain-marie', assetId: 'wp-casserole' },
      { name: 'Saladier pour les blancs', assetId: 'wp-saladier' },
      { name: 'Fouet de cuisine', assetId: 'wp-fouet-de-cuisine' },
      { name: 'Spatule / maryse', assetId: 'wp-spatule' },
    ],
    culinaryTechniques: ['Fondre au bain-marie', 'Monter les blancs en neige ferme', 'Incorporer à la maryse sans casser les bulles'],
    steps: [
      '1. Casser le chocolat en morceaux et le faire fondre doucement au bain-marie avec le beurre.',
      '2. Séparer les blancs des jaunes d’œufs avec précision.',
      '3. Incorporer les jaunes un à un dans le chocolat fondu tiédi.',
      '4. Monter les blancs en neige bien ferme avec une pincée de sel.',
      '5. Incorporer un tiers des blancs énergiquement pour détendre le chocolat.',
      '6. Ajouter le reste des blancs avec la spatule en soulevant la masse de bas en haut avec délicatesse.',
      '7. Réserver au frais au moins 4 heures avant de servir.',
    ],
    chefTip: 'La maryse doit caresser le fond du bol et soulever la mousse sans jamais tourner en rond, pour conserver l’air emprisonné dans les blancs d’œufs.',
    quizQuestion: {
      question: 'Quel est l’ustensile indispensable pour incorporer les blancs en neige sans les briser ?',
      options: ['La spatule souple (maryse)', 'Le fouet électrique à pleine vitesse', 'Une fourchette'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-saladier', pos: [0, 0.9, 0] },
      { assetId: 'wp-casserole', pos: [0, 0.9, -0.25] },
      { assetId: 'wp-tablette-de-chocolat', pos: [-0.35, 0.9, 0.2] },
      { assetId: 'wp-oeuf', pos: [0.35, 0.9, 0.2] },
      { assetId: 'wp-plaquette-de-beurre', pos: [-0.45, 0.9, -0.15] },
      { assetId: 'wp-spatule', pos: [0.2, 0.9, 0.25] },
    ]
  },
  {
    id: 'recipe-tarte-tatin',
    number: 12,
    title: 'La Tarte Tatin renversée caramélisée',
    category: 'Desserts & pâtisserie',
    difficulty: 'Intermédiaire',
    prepTime: '25 min',
    cookTime: '45 min',
    servings: 6,
    description: 'Quartiers de pommes fondants et dorés au caramel au beurre demi-sel, sous une pâte croustillante.',
    ingredients: [
      { name: 'Poires William / fruits du verger', quantity: '1.5 kg', assetId: 'wp-poire-william' },
      { name: 'Beurre demi-sel', quantity: '80 g', assetId: 'wp-plaquette-de-beurre' },
      { name: 'Paquet de sucre', quantity: '150 g', assetId: 'wp-paquet-de-sucre' },
      { name: 'Fleur de sel de Guérande', quantity: '1 pincée', assetId: 'wp-fleur-de-sel-de-guerande' },
      { name: 'Crème fraîche d’Isigny', quantity: '1 pot', assetId: 'wp-pot-de-creme-fraiche' },
    ],
    utensils: [
      { name: 'Poêle / moule tatin', assetId: 'wp-poele' },
      { name: 'Planche de découpe', assetId: 'wp-planche-a-decouper' },
      { name: 'Couteau d’office', assetId: 'wp-couteau-de-chef' },
    ],
    culinaryTechniques: ['Caraméliser à sec', 'Serrer les fruits', 'Démouler tiède d’un coup sec'],
    steps: [
      '1. Éplucher les fruits, les épépiner et les couper en gros quartiers réguliers.',
      '2. Dans le moule en cuivre ou la poêle, préparer un caramel ambré avec le sucre, le beurre et la fleur de sel.',
      '3. Ranger les quartiers de fruits bien serrés sur la tranche dans le caramel chaud.',
      '4. Cuire à feu moyen 15 minutes pour précuire et imprégner les fruits.',
      '5. Recouvrir avec le disque de pâte en rentrant les bords à l’intérieur du moule.',
      '6. Enfourner 30 minutes à 180°C.',
      '7. Laisser tiédir 10 minutes puis démouler d’un geste rapide et franc sur un plat.',
    ],
    chefTip: 'Serrez les fruits au maximum car ils réduisent considérablement à la cuisson : n’hésitez pas à faire un deuxième rang au centre.',
    quizQuestion: {
      question: 'Quand faut-il démouler la tarte Tatin sur le plat de service ?',
      options: ['Quand elle est encore tiède pour que le caramel ne soit pas figé', 'Complètement froide après 24 heures au frigo', 'Dès la sortie du four brûlante'],
      answer: 'A'
    },
    assetPlacements: [
      { assetId: 'wp-ilot-de-cuisine', pos: [0, 0, 0] },
      { assetId: 'wp-poele', pos: [0, 0.9, -0.1] },
      { assetId: 'wp-planche-a-decouper', pos: [0, 0.9, 0.25] },
      { assetId: 'wp-couteau-de-chef', pos: [0.25, 0.92, 0.25] },
      { assetId: 'wp-poire-william', pos: [-0.35, 0.9, 0.2] },
      { assetId: 'wp-plaquette-de-beurre', pos: [-0.4, 0.9, -0.2] },
      { assetId: 'wp-paquet-de-sucre', pos: [0.45, 0.9, 0.15] },
      { assetId: 'wp-fleur-de-sel-de-guerande', pos: [0.25, 0.9, -0.2] },
      { assetId: 'wp-pot-de-creme-fraiche', pos: [-0.45, 0.9, 0.0] },
    ]
  },
];

export function createRecipePatch(recipe: CookingRecipe, _existing: Record<string, EntitySpec> = {}): WorldPatch {
  const entitiesCreated: EntitySpec[] = [];
  const rulesChanged: RuleSpec[] = [];

  // 1. Recipe instructional board with embedded Web Screen (center rear)
  const boardId = `recipe_${recipe.id}_board`;
  const recipeWikiSlug = recipe.id === 'recipe-ratatouille' 
    ? 'Ratatouille' 
    : recipe.id === 'recipe-boeuf-bourguignon'
    ? 'B%C5%93uf_bourguignon'
    : recipe.id === 'recipe-crepes-suzette'
    ? 'Cr%C3%AApe_Suzette'
    : recipe.id === 'recipe-quiche-lorraine'
    ? 'Quiche_lorraine'
    : recipe.id === 'recipe-soupe-a-l-oignon'
    ? 'Soupe_%C3%A0_l%27oignon'
    : encodeURIComponent(recipe.title);
  const webUrl = `https://fr.m.wikipedia.org/wiki/${recipeWikiSlug}`;

  entitiesCreated.push({
    id: boardId,
    name: `Fiche recette · ${recipe.title}`,
    capabilities: [
      { type: 'transform', position: { x: -1.85, y: 0, z: -0.4 }, rotation: { x: 0, y: 0.35, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      { type: 'draggable' },
      { type: 'web_screen', url: webUrl },
      {
        type: 'educational',
        text: `★ RECETTE : ${recipe.title.toUpperCase()}\n⏱ Prépa: ${recipe.prepTime} | Cuisson: ${recipe.cookTime} | Niveau: ${recipe.difficulty}\n\nINGRÉDIENTS :\n${recipe.ingredients.map(i => `• ${i.name} (${i.quantity})`).join('\n')}\n\nÉTAPES :\n${recipe.steps.slice(0, 3).join('\n')}`,
        url: webUrl,
        value: 0,
        active: true
      },
    ],
    visuals: { assetId: 'web-screen', modelUrl: '/library/captions.glb' }
  });

  // 2. Audio chef narration / Minuteur mécanique du chef
  const audioId = `recipe_${recipe.id}_audio`;
  entitiesCreated.push({
    id: audioId,
    name: `Minuteur du Chef`,
    capabilities: [
      { type: 'transform', position: { x: 0.72, y: 0.90, z: 0.28 }, rotation: { x: 0, y: -0.2, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      { type: 'educational', text: `Astuce du chef pour ${recipe.title} : ${recipe.chefTip}`, value: 0, active: false },
    ],
    visuals: { assetId: 'wp-minuteur-cuisine', modelUrl: '/library/wp-minuteur-cuisine.glb' }
  });

  // 3. Culinary quiz lectern
  const quizId = `recipe_${recipe.id}_quiz`;
  entitiesCreated.push({
    id: quizId,
    name: `Quiz culinaire`,
    capabilities: [
      { type: 'transform', position: { x: -1.8, y: 0, z: -2.8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      {
        type: 'educational',
        text: `${recipe.quizQuestion.question}\nA) ${recipe.quizQuestion.options[0]}\nB) ${recipe.quizQuestion.options[1]}\nC) ${recipe.quizQuestion.options[2]}`,
        value: 0,
        active: false,
        correctAnswer: recipe.quizQuestion.answer
      },
    ],
    visuals: { assetId: 'quiz', modelUrl: '/library/quiz.glb' }
  });

  // 4. Physical props and ingredients on the culinary workshop island
  recipe.assetPlacements.forEach((placement, idx) => {
    const meta = getAsset(placement.assetId);
    const isFixedFurniture = [
      'wp-ilot-de-cuisine', 'counter', 'technical-bench', 'table', 'workbench', 'meeting-table'
    ].includes(placement.assetId);

    const entityId = `recipe_${recipe.id}_${placement.assetId}_${idx + 1}`;

    const safeY = (!isFixedFurniture && placement.pos[1] >= 0.85 && placement.pos[1] <= 0.915)
      ? 0.922
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
        { type: 'educational' as const, text: meta?.name || placement.assetId, value: 0, active: false }
      ],
      visuals: {
        assetId: placement.assetId,
        modelUrl: `/library/${placement.assetId}.glb`
      }
    });
  });

  // 5. Board, Audio & Quiz validation rules
  rulesChanged.push({
    id: `rule_${boardId}`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: boardId }],
    actions: [
      { type: 'play_sound', sound: 'chime' },
      { type: 'set_flag', flag: `recipe_${recipe.id}_audio_listened`, value: true },
      { type: 'show_warning', message: `📖 Fiche recette : « ${recipe.title} » consultée.` }
    ]
  });

  rulesChanged.push({
    id: `rule_${audioId}`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: audioId }],
    actions: [
      { type: 'play_sound', sound: 'chime' },
      { type: 'set_flag', flag: `recipe_${recipe.id}_audio_listened`, value: true },
      { type: 'show_warning', message: `👨‍🍳 Conseil du Chef : ${recipe.chefTip}` }
    ]
  });

  rulesChanged.push({
    id: `rule_recipe_${recipe.id}_quiz`,
    trigger: 'ANSWER_CORRECT',
    conditions: [
      { type: 'is_source', sourceId: quizId }
    ],
    actions: [
      { type: 'set_flag', flag: `recipe_${recipe.id}_passed`, value: true },
      { type: 'play_sound', sound: 'fanfare' },
      { type: 'show_warning', message: 'Bravo ! Bonne réponse culinaire.' }
    ]
  });

  // 6. Interactive Step-by-Step Cooking Quest
  const interactiveProps = entitiesCreated.slice(3).filter(
    e => !['wp-ilot-de-cuisine', 'counter', 'technical-bench', 'table', 'workbench', 'meeting-table'].includes(e.visuals?.assetId || '')
  );
  const cookUtensil =
    interactiveProps.find(e =>
      e.id.includes('cocotte') ||
      e.id.includes('poele') ||
      e.id.includes('casserole') ||
      e.id.includes('crepiere') ||
      e.id.includes('marmite') ||
      e.id.includes('saladier')
    ) || interactiveProps[0] || entitiesCreated[3];

  const prepUtensil =
    interactiveProps.find(
      e =>
        e.id !== cookUtensil?.id &&
        (e.id.includes('couteau') ||
          e.id.includes('planche') ||
          e.id.includes('fouet') ||
          e.id.includes('spatule') ||
          e.id.includes('saladier'))
    ) ||
    interactiveProps.find(e => e.id !== cookUtensil?.id) ||
    interactiveProps[0] ||
    entitiesCreated[3];

  const questId = `quest_${recipe.id}`;
  const quest: QuestSpec = {
    id: questId,
    title: `Atelier : ${recipe.title}`,
    category: 'cuisine',
    description: recipe.description,
    currentStepIndex: 0,
    status: 'in_progress',
    rewardSound: 'fanfare',
    steps: [
      {
        id: `${recipe.id}_step_1`,
        title: `Écouter l’astuce du Chef`,
        description: `Activez le point d’écoute pour entendre les secrets de réussite de ${recipe.title}.`,
        targetEntityId: audioId,
        requiredEvent: 'INTERACT',
        hint: `Cliquez sur le point d’écoute du chef à droite.`,
        completed: false
      },
      {
        id: `${recipe.id}_step_2`,
        title: `Préparer & émincer les ingrédients`,
        description: `Préparez les ${recipe.ingredients.length} ingrédients sur la planche de découpe.`,
        targetEntityId: prepUtensil?.id,
        requiredEvent: 'INTERACT',
        hint: `Interagissez avec ${prepUtensil?.name || 'la planche de découpe'}.`,
        completed: false
      },
      {
        id: `${recipe.id}_step_3`,
        title: `Mijoter & assaisonner`,
        description: `Faites chauffer et mijoter les ingrédients (${recipe.cookTime}).`,
        targetEntityId: cookUtensil?.id,
        requiredEvent: 'INTERACT',
        hint: `Interagissez avec ${cookUtensil?.name || 'la cocotte'}.`,
        completed: false
      },
      {
        id: `${recipe.id}_step_4`,
        title: `Valider le quiz technique`,
        description: `Répondez correctement à la question sur le pupitre pour obtenir votre validation culinaire.`,
        targetEntityId: quizId,
        requiredEvent: 'ANSWER_CORRECT',
        hint: `Choisissez A, B ou C sur le pupitre de quiz.`,
        completed: false
      }
    ]
  };

  const knife = entitiesCreated.find(e => e.id.includes('couteau'));

  if (prepUtensil) {
    const prepActions: import('../core/types').Action[] = [
      { type: 'play_sound', sound: 'knife_chop' },
      ...(knife ? [{ type: 'trigger_animation' as const, entityId: knife.id, animationType: 'chopping' as const }] : []),
      { type: 'set_flag', flag: `recipe_${recipe.id}_prepped`, value: true },
      { type: 'show_warning', message: `🔪 ${prepUtensil.name} : Ingrédients soigneusement parés et émincés !` }
    ];

    rulesChanged.push({
      id: `rule_${recipe.id}_prep`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: prepUtensil.id }],
      actions: prepActions
    });

    const dropPrepActions: import('../core/types').Action[] = [
      { type: 'play_sound', sound: 'knife_chop' },
      ...(knife ? [{ type: 'trigger_animation' as const, entityId: knife.id, animationType: 'chopping' as const }] : []),
      { type: 'set_flag', flag: `recipe_${recipe.id}_prepped`, value: true },
      { type: 'show_warning', message: `🔪 Découpe en cours : Ingrédient émincé sur ${prepUtensil.name} !` }
    ];

    rulesChanged.push({
      id: `rule_${recipe.id}_drop_prep`,
      trigger: 'DROP',
      conditions: [{ type: 'is_target', targetId: prepUtensil.id }],
      actions: dropPrepActions
    });
  }

  if (knife) {
    rulesChanged.push({
      id: `rule_${recipe.id}_knife`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: knife.id }],
      actions: [
        { type: 'play_sound', sound: 'knife_chop' },
        { type: 'trigger_animation', entityId: knife.id, animationType: 'chopping' },
        { type: 'set_flag', flag: `recipe_${recipe.id}_prepped`, value: true },
        { type: 'show_warning', message: `🔪 Couteau de chef : Découpe nette et précise en dés réguliers.` }
      ]
    });
  }

  if (cookUtensil) {
    rulesChanged.push({
      id: `rule_${recipe.id}_cook`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: cookUtensil.id }],
      actions: [
        { type: 'play_sound', sound: 'sizzle_cook' },
        { type: 'trigger_animation', entityId: cookUtensil.id, animationType: 'steaming' },
        { type: 'set_flag', flag: `recipe_${recipe.id}_cooked`, value: true },
        { type: 'show_warning', message: `🥘 ${cookUtensil.name} : Ça mijote doucement ! Les sucs et arômes se libèrent.` }
      ]
    });

    rulesChanged.push({
      id: `rule_${recipe.id}_drop_cook`,
      trigger: 'DROP',
      conditions: [{ type: 'is_target', targetId: cookUtensil.id }],
      actions: [
        { type: 'play_sound', sound: 'sizzle_cook' },
        { type: 'trigger_animation', entityId: cookUtensil.id, animationType: 'steaming' },
        { type: 'set_flag', flag: `recipe_${recipe.id}_cooked`, value: true },
        { type: 'show_warning', message: `🥘 ${cookUtensil.name} : Ingrédient plongé dans la cocotte, ça mijote à point !` }
      ]
    });
  }

  return {
    entitiesCreated,
    rulesChanged,
    invariantsAdded: [],
    questsAdded: [quest],
    activeQuestId: questId
  };
}
