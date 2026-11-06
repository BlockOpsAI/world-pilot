/** Authored collection: rows are name | construction | variant | dimensions in meters.
 * Variants select structural features, not merely a different name or color.
 */
export interface ExtendedAsset {
  id: string; name: string; category: string; description: string; size: readonly [number, number, number]; text: string;
  recipe: string; variant: number;
}
const collections: [string, string, string][] = [
['Cuisine · ustensiles', 'Préparer une recette et apprendre les gestes de cuisine', `
Casserole|pot|0|.42,.22,.26
Marmite|pot|1|.48,.38,.38
Poêle|pan|0|.55,.08,.3
Wok|pan|1|.55,.18,.34
Cocotte|pot|2|.42,.3,.32
Passoire|bowl|1|.32,.16,.3
Saladier|bowl|0|.3,.16,.3
Planche à découper|board|0|.4,.025,.28
Rouleau à pâtisserie|rolling|0|.42,.055,.055
Fouet de cuisine|utensil|0|.07,.3,.07
Spatule|utensil|1|.08,.32,.025
Louche|utensil|2|.1,.32,.1
Écumoire|utensil|3|.11,.32,.03
Couteau de chef|knife|0|.045,.32,.02
Couteau à pain|knife|1|.04,.36,.02
Éplucheur|utensil|4|.07,.18,.025
Râpe|grater|0|.12,.24,.09
Presse-agrumes|juicer|0|.18,.12,.18
Mortier et pilon|mortar|0|.2,.18,.2
Balance de cuisine|scale|0|.24,.08,.2`],
['Cuisine · équipements', 'Aménager une cuisine pour des ateliers virtuels', `
Réfrigérateur|appliance|0|.7,1.8,.7
Four encastrable|appliance|1|.6,.6,.6
Micro-ondes|appliance|2|.5,.3,.4
Lave-vaisselle|appliance|3|.6,.85,.6
Grille-pain|toaster|0|.28,.2,.18
Bouilloire|kettle|0|.23,.3,.2
Mixeur sur socle|blender|0|.2,.42,.2
Robot pâtissier|mixer|0|.4,.4,.25
Plaque à induction|hob|0|.6,.05,.5
Plaque au gaz|hob|1|.6,.1,.5
Hotte aspirante|hood|0|.9,.5,.5
Évier et robinet|sink|0|.8,.4,.5
Îlot de cuisine|cabinet|0|1.8,.9,.8
Meuble à tiroirs|cabinet|1|.8,.9,.6
Placard mural|cabinet|2|.8,.7,.35
Égouttoir à vaisselle|rack|0|.4,.2,.3
Poubelle à pédale|bin|0|.35,.6,.35
Chariot de service|cart|0|.8,.85,.45
Porte-épices|rack|1|.45,.35,.12
Crêpière|hob|2|.4,.12,.4`],
['Alimentation · ingrédients', 'Nommer les aliments, les trier et composer un marché', `
Pomme|fruit|0|.09,.09,.09
Poire|fruit|1|.08,.13,.08
Orange|fruit|2|.09,.09,.09
Citron|fruit|3|.1,.07,.07
Banane|banana|0|.2,.1,.05
Grappe de raisin|grapes|0|.12,.2,.12
Fraise|fruit|4|.055,.075,.055
Tomate|fruit|5|.085,.07,.085
Carotte|vegetable|0|.06,.25,.06
Poireau|vegetable|1|.08,.4,.07
Aubergine|fruit|6|.1,.23,.1
Poivron|fruit|7|.1,.13,.1
Champignon|mushroom|0|.09,.1,.09
Brocoli|vegetable|2|.18,.2,.18
Potiron|fruit|8|.32,.25,.32
Œuf et coquetier|egg|0|.065,.12,.065
Brique de lait|carton|0|.08,.24,.08
Paquet de farine|bag|0|.12,.2,.08
Bouteille d’huile|bottle|0|.08,.3,.08
Pot de miel|jar|0|.1,.14,.1`],
['France · boulangerie et gastronomie', 'Mettre en scène une boulangerie et le vocabulaire de la table', `
Baguette|bread|0|.65,.065,.075
Pain de campagne|bread|1|.3,.15,.28
Croissant|pastry|0|.18,.065,.12
Pain au chocolat|pastry|1|.13,.06,.09
Brioche tressée|bread|2|.3,.1,.14
Éclair au chocolat|pastry|2|.15,.06,.055
Macaron|cake|0|.055,.03,.055
Tarte aux pommes|cake|1|.28,.04,.28
Millefeuille|pastry|3|.12,.07,.075
Religieuse|cake|2|.08,.14,.08
Paris-Brest|cake|3|.18,.08,.18
Madeleine|pastry|4|.08,.03,.055
Cannelé|cake|4|.055,.06,.055
Kouign-amann|cake|5|.11,.05,.11
Galette des rois|cake|6|.3,.045,.3
Crêpe garnie|cake|7|.26,.025,.26
Meule de fromage|cheese|0|.28,.1,.28
Part de fromage|cheese|1|.14,.07,.16
Plateau de fromages|platter|0|.45,.13,.32
Soupière|pot|3|.35,.25,.25`],
['Art de la table', 'Dresser la table et pratiquer les échanges au restaurant', `
Assiette plate|plate|0|.27,.025,.27
Assiette creuse|plate|1|.23,.05,.23
Assiette à dessert|plate|2|.19,.02,.19
Bol à déjeuner|bowl|2|.16,.09,.16
Tasse à thé|cup|0|.13,.08,.1
Mug|cup|1|.13,.12,.09
Verre à eau|glass|0|.075,.12,.075
Verre à pied|glass|1|.08,.2,.08
Flûte|glass|2|.065,.23,.065
Carafe|bottle|1|.12,.27,.12
Théière|kettle|1|.24,.18,.17
Fourchette|cutlery|0|.025,.2,.01
Cuillère à soupe|cutlery|1|.045,.19,.02
Couteau de table|knife|2|.025,.22,.015
Petite cuillère|cutlery|2|.03,.13,.015
Serviette pliée|napkin|0|.16,.12,.12
Salière|jar|1|.05,.09,.05
Poivrière|mill|0|.055,.16,.055
Corbeille à pain|basket|0|.3,.12,.22
Bougeoir de table|candle|0|.1,.3,.1`],
['France · fêtes et traditions', 'Créer des scènes de conversation sur les fêtes, loisirs et traditions', `
Couronne de l’Épiphanie|crown|0|.2,.09,.2
Fève de collection|figurine|0|.035,.045,.025
Cloche de Pâques|bell|0|.15,.2,.15
Œuf décoré|egg|1|.09,.13,.09
Brin de muguet|flower|0|.16,.3,.1
Lampion de fête|lantern2|0|.25,.35,.25
Drapeau tricolore sur pied|flag|0|.8,1.6,.3
Guirlande de fanions|bunting|0|2,.3,.05
Boule de pétanque|sportsball|0|.074,.074,.074
Cochonnet|sportsball|1|.03,.03,.03
Accordéon|accordion|0|.5,.4,.25
Béret|hat|0|.28,.075,.28
Panier de pique-nique|basket|1|.45,.35,.3
Santon de berger|figurine|1|.1,.23,.07
Bûche de Noël|pastry|5|.3,.12,.13
Sapin décoré|conifer|1|1.2,2,1.2
Boule de Noël|ornament|0|.09,.11,.09
Couronne de porte|wreath|0|.4,.4,.09
Masque de carnaval|mask|0|.22,.12,.05
Chapeau de fête|hat|1|.18,.3,.18`],
['Ville · commerces et services', 'Construire une rue pour des dialogues et jeux de rôle en français', `
Kiosque à journaux|stall|0|2.2,2.5,1.6
Étal de marché|stall|1|2,2.2,1.2
Devanture de boulangerie|facade|0|2.5,2.8,.4
Devanture de librairie|facade|1|2.5,2.8,.4
Abribus|shelter|0|2.5,2.4,1.2
Banc de quai|seat|3|1.8,.9,.5
Boîte aux lettres de rue|mailbox|0|.45,1.3,.4
Potelet urbain|bollard|0|.14,.9,.14
Réverbère de rue|streetlamp|0|.65,3,.5
Feu tricolore|traffic|0|.4,2.6,.3
Panneau de passage piéton|sign|0|.6,2,.25
Panneau directionnel|sign|1|1.2,2,.3
Horodateur|terminal|0|.4,1.5,.35
Distributeur de billets|terminal|1|.7,1.5,.55
Borne de tickets|terminal|2|.5,1.4,.4
Cabine téléphonique|booth|0|1,2.3,1
Fontaine à boire|fountain2|0|.5,1,.5
Support pour vélos|rack|2|1.5,.7,.5
Barrière de terrasse|fence|0|1.5,1,.15
Table de bistrot|table2|0|.7,.75,.7`],
['Français · objets du quotidien', 'Travailler le vocabulaire et les situations de la vie courante', `
Sac à dos|bag|1|.32,.45,.18
Cartable|bag|2|.4,.3,.16
Valise à roulettes|luggage|0|.42,.65,.25
Sac à main|bag|3|.3,.25,.13
Portefeuille|wallet|0|.12,.09,.025
Trousseau de clés|keys|0|.1,.14,.02
Parapluie ouvert|umbrella|0|.9,1,.9
Lunettes|glasses|0|.14,.05,.14
Montre-bracelet|watch|0|.045,.025,.22
Réveil à cloches|clock2|0|.15,.2,.07
Téléphone portable|device|0|.075,.15,.009
Appareil photo|camera|0|.14,.09,.1
Casque audio|headphones|0|.18,.2,.08
Brosse à dents|brush|0|.015,.19,.02
Tube de dentifrice|tube|0|.055,.17,.035
Savon et porte-savon|soap|0|.13,.04,.09
Peigne|comb|0|.04,.18,.007
Sèche-cheveux|hairdryer|0|.2,.22,.08
Paire de chaussons|shoes|0|.24,.08,.28
Porte-manteau|coatstand|0|.55,1.75,.55`],
['Enseignement · salle de classe', 'Équiper des cours et activités collectives dans le métavers', `
Bureau d’élève|table2|1|.65,.75,.5
Table de groupe hexagonale|table2|2|1.4,.75,1.2
Chaise scolaire|seat|0|.45,.8,.45
Tabouret de laboratoire|seat|1|.4,.65,.4
Casier scolaire|locker|0|.4,1.8,.45
Bibliothèque basse|bookcase|0|1.2,1.1,.35
Chevalet de présentation|easel|0|.8,1.6,.55
Ardoise individuelle|board|1|.3,.22,.02
Cahier ouvert|notebook|0|.42,.012,.3
Classeur à anneaux|notebook|1|.55,.08,.32
Trousse d’école|bag|4|.22,.08,.08
Pot à crayons|pencilpot|0|.1,.16,.1
Crayon de papier|pencil|0|.008,.19,.008
Stylo-plume|pencil|1|.015,.14,.015
Gomme|eraser|0|.06,.02,.025
Taille-crayon|sharpener|0|.035,.02,.025
Paire de ciseaux|scissors|0|.07,.17,.015
Équerre scolaire|triangle|0|.2,.2,.004
Rapporteur|protractor|0|.2,.1,.005
Boulier|abacus|0|.4,.4,.12`],
['Enseignement · mathématiques', 'Manipuler des représentations schématiques de formes et de nombres', `
Cube unité|solid|0|.2,.2,.2
Pavé droit|solid|1|.4,.2,.15
Sphère géométrique|solid|2|.3,.3,.3
Cône géométrique|solid|3|.3,.4,.3
Cylindre géométrique|solid|4|.3,.4,.3
Pyramide à base carrée|solid|5|.3,.4,.3
Tétraèdre|solid|6|.3,.3,.3
Octaèdre|solid|7|.3,.4,.3
Dodécaèdre|solid|8|.3,.3,.3
Icosaèdre|solid|9|.3,.3,.3
Tore géométrique|solid|10|.35,.12,.35
Prisme triangulaire|solid|11|.3,.3,.4
Disque de fractions en quarts|fractions|4|.45,.04,.45
Disque de fractions en tiers|fractions|3|.45,.04,.45
Disque de fractions en sixièmes|fractions|6|.45,.04,.45
Barres de numération|numberbars|0|.6,.1,.4
Escalier de cubes|numberbars|1|.6,.6,.3
Repère à trois axes|axes|0|.7,.7,.7
Compas de démonstration|compass|0|.35,.6,.06
Tangram en volume|tangram|0|.5,.03,.5`],
['Enseignement · laboratoire', 'Installer des expériences illustratives de sciences', `
Bécher|vessel|0|.13,.18,.13
Éprouvette graduée|vessel|1|.09,.35,.09
Fiole Erlenmeyer|vessel|2|.15,.24,.15
Ballon de laboratoire|vessel|3|.18,.28,.18
Tube à essai|vessel|4|.025,.16,.025
Porte-tubes|testrack|0|.3,.2,.12
Pipette|pipette|0|.02,.25,.02
Entonnoir|funnel|0|.12,.18,.12
Brûleur de laboratoire|burner|0|.12,.23,.12
Support et pince|labstand|0|.35,.6,.25
Lunettes de protection|glasses|1|.18,.08,.12
Modèle d’atome|atom|0|.5,.5,.5
Hélice d’ADN schématique|dna|0|.35,.8,.35
Aimant en fer à cheval|magnet|0|.22,.25,.05
Circuit pile et ampoule|circuit|0|.5,.18,.3
Prisme optique|solid|12|.18,.16,.2
Pendule de démonstration|pendulum|0|.5,.6,.2
Ressort de démonstration|spring|0|.15,.4,.15
Loupe|magnifier|0|.15,.3,.025
Télescope sur trépied|telescope|0|.8,1.4,.8`],
['Arts · musique et création', 'Créer un atelier artistique ou une scène musicale', `
Guitare acoustique|guitar|0|.4,1,.12
Guitare électrique|guitar|1|.35,1,.08
Violon|guitar|2|.22,.6,.07
Ukulélé|guitar|3|.22,.55,.07
Piano droit|piano|0|1.4,1.2,.6
Clavier numérique|piano|1|1.2,.8,.4
Tambour|drum|0|.4,.3,.4
Caisse claire|drum|1|.36,.17,.36
Djembé|drum|2|.3,.6,.3
Cymbale sur pied|cymbal|0|.5,1.2,.5
Flûte à bec|flute|0|.04,.33,.04
Trompette|trumpet|0|.5,.2,.15
Microphone sur pied|microphone|0|.35,1.6,.35
Pupitre à partitions|easel|1|.6,1.3,.4
Palette de peintre|palette|0|.3,.025,.23
Pinceau plat|brush|1|.035,.28,.015
Chevalet de peintre|easel|2|.75,1.7,.6
Toile encadrée|frame|0|.6,.8,.045
Tour de potier|potterywheel|0|.6,.7,.6
Vase d’atelier|vase|0|.25,.4,.25`],
['Boutiques · vente et présentation', 'Aménager des boutiques et simuler les échanges commerciaux', `
Portant à vêtements|rack|3|1.2,1.6,.5
Cintre|hanger|0|.42,.22,.02
Présentoir à chaussures|shelves|0|.8,1.2,.35
Tourniquet à cartes|spinner|0|.6,1.6,.6
Caisse enregistreuse|register|0|.4,.3,.4
Terminal de paiement|device|1|.09,.17,.06
Scanner de caisse|scanner|0|.1,.2,.15
Panier de courses|basket|2|.45,.3,.3
Chariot de supermarché|cart|1|.6,1,.9
Sac de courses en papier|bag|5|.3,.4,.15
Boîte cadeau|gift|0|.25,.25,.25
Présentoir à bijoux|jewelry|0|.35,.5,.2
Buste à colliers|bust|0|.3,.4,.2
Miroir de boutique|mirror|0|.6,1.7,.4
Cabine d’essayage|booth|1|1.2,2.2,1.2
Mannequin de vitrine assis|figure|0|.6,1.2,.7
Vitrine réfrigérée|displaycase|0|1.5,1.3,.8
Cageot à fruits|crate|0|.5,.25,.35
Présentoir à lunettes|spinner|1|.4,.65,.3
Panneau de prix sur pied|sign|2|.45,1.1,.25`],
['Réunions · travail et conférences', 'Équiper des espaces de collaboration, bureaux et conférences', `
Bureau individuel|table2|3|1.4,.75,.7
Table haute de réunion|table2|4|1.2,1.1,.65
Table de conférence en U|table2|5|2.4,.75,2.2
Fauteuil de conférence|seat|2|.6,.95,.6
Tabouret haut|seat|4|.45,.95,.45
Ordinateur portable|laptop|0|.34,.24,.25
Moniteur sur pied|monitor|0|.55,.42,.2
Clavier informatique|keyboard|0|.44,.025,.14
Souris informatique|mouse|0|.06,.04,.11
Webcam|camera|1|.12,.07,.05
Vidéoprojecteur|projector|0|.3,.12,.25
Écran de projection déroulant|screen|0|1.8,2,.45
Enceinte de conférence|speaker|0|.3,.6,.3
Téléphone de conférence|conferencephone|0|.3,.08,.26
Bloc de notes adhésives|notebook|2|.1,.025,.1
Organiseur de bureau|organizer|0|.3,.16,.2
Corbeille à courrier|tray|0|.35,.12,.25
Badge de participant|badge|0|.1,.3,.015
Porte-documents|bag|6|.4,.3,.1
Horloge murale|clock2|1|.3,.3,.035`],
['Jeux · aventure et fantasy', 'Composer des niveaux, quêtes et décors de jeux d’aventure', `
Épée de chevalier|sword|0|.25,1,.07
Bouclier rond|shield|0|.6,.6,.1
Bouclier héraldique|shield|1|.5,.7,.1
Casque de chevalier|helmet|0|.3,.35,.3
Hache de fantasy|axe|0|.4,.8,.08
Arc de bois|bow|0|.35,1,.06
Carquois de flèches|quiver|0|.18,.7,.18
Bâton de mage|staff|0|.2,1.7,.2
Fiole de potion|bottle|2|.12,.2,.12
Cristal magique|crystal|0|.25,.5,.25
Torche murale|torch|0|.15,.65,.2
Brasero|brazier|0|.6,.7,.6
Tonneau|barrel|0|.6,.85,.6
Caisse de butin|crate|1|.7,.6,.6
Sac de pièces|bag|7|.2,.25,.2
Parchemin déroulé|scroll|0|.5,.04,.35
Livre de grimoire|notebook|3|.35,.09,.25
Autel de pierre|altar|0|1.4,.9,.8
Portail de donjon|arch|0|1.8,2.5,.5
Roue de puzzle|wheel|0|.6,.6,.12`],
['Jeux · science-fiction et arcade', 'Construire des décors futuristes et des salles de jeux', `
Borne d’arcade|arcade|0|.75,1.8,.8
Flipper|pinball|0|.65,1.2,1.3
Manette de jeu|gamepad|0|.16,.07,.1
Joystick|joystick|0|.15,.2,.15
Casque VR|vrheadset|0|.22,.12,.2
Contrôleurs VR|vrcontrollers|0|.24,.2,.1
Robot compagnon|robot|0|.5,1,.4
Robot quadrupède|robot|1|.7,.5,.9
Drone à quatre rotors|drone|0|.7,.2,.7
Console holographique|hologram|0|.8,1.2,.8
Capsule spatiale|capsule|0|1,2,.9
Conteneur futuriste|crate|2|.9,.6,.6
Réacteur d’énergie|reactor|0|.8,1.4,.8
Antenne satellite|dish|0|1.2,1.6,1.2
Porte de sas|arch|1|1.5,2.4,.4
Balise de checkpoint|beacon|0|.4,1.2,.4
Plateforme de téléportation|platform|0|1.5,.2,1.5
Tourelle de capteurs|sensor|0|.5,1.1,.5
Module de serveur|server|0|.6,1.8,.7
Trophée de tournoi|trophy|0|.4,.6,.25`],
['Sports · loisirs et jeux de société', 'Organiser des activités sportives et des jeux collectifs', `
Ballon de football|sportsball|2|.22,.22,.22
Ballon de basket|sportsball|3|.24,.24,.24
Ballon de rugby|sportsball|4|.3,.18,.18
Balle de tennis|sportsball|5|.067,.067,.067
Raquette de tennis|racket|0|.28,.68,.025
Raquette de ping-pong|racket|1|.15,.26,.012
Volant de badminton|shuttle|0|.065,.085,.065
But de football|goal|0|2,1.3,.7
Panier de basket|basketballhoop|0|1,2.8,.8
Cône de sport|cone|0|.25,.4,.25
Haie d’athlétisme|hurdle|0|1,.8,.5
Haltère|dumbbell|0|.35,.13,.13
Tapis de gymnastique|mat|0|.7,.03,1.8
Vélo d’appartement|bike|0|.5,1.2,1
Table de ping-pong|pingpong|0|1.5,.76,2.4
Échiquier et pièces|chess|0|.5,.1,.5
Plateau de dames|chess|1|.45,.03,.45
Dé à jouer|dice|0|.06,.06,.06
Dominos|domino|0|.2,.012,.14
Quilles et boule|bowling|0|.6,.38,.6`],
['Nature · jardin et environnement', 'Composer des jardins, paysages et ateliers sur l’environnement', `
Sapin|conifer|0|1.3,2.8,1.3
Palmier|palm|0|2,3,2
Cactus|cactus|0|.6,1.2,.4
Bambous|bamboo|0|.8,2.2,.6
Buisson fleuri|shrub|0|.9,.7,.7
Tournesol|flower|1|.4,1.2,.3
Tulipe|flower|2|.16,.45,.16
Rose en pot|flower|3|.3,.55,.3
Lavande en pot|flower|4|.4,.6,.4
Nénuphar|waterlily|0|.45,.08,.45
Tronc couché|log|0|1.2,.35,.35
Souche|log|1|.55,.45,.5
Champignons forestiers|mushroom|1|.35,.3,.3
Arrosoir|watering|0|.5,.35,.25
Brouette|wheelbarrow|0|.7,.65,1.3
Pelle de jardin|shovel|0|.25,1.2,.08
Râteau|rake|0|.4,1.3,.07
Composteur|crate|3|.8,.9,.8
Nichoir|birdhouse|0|.25,.35,.25
Hôtel à insectes|birdhouse|1|.5,.7,.2`],
['Bien-être · repos et expression', 'Aménager des espaces calmes et des activités d’expression', `
Zafu rond|cushion2|0|.4,.18,.4
Tapis de méditation|mat|1|.9,.04,.9
Bol chantant|bowl|3|.2,.11,.2
Carillon à vent|chime|0|.3,.6,.3
Diffuseur d’ambiance|diffuser|0|.15,.2,.15
Bougie en pot|candle|1|.1,.13,.1
Sablier|hourglass|0|.15,.3,.15
Jardin de galets|stonegarden|0|.6,.1,.4
Balle sensorielle|sensory|0|.1,.1,.1
Cube tactile|sensory|1|.1,.1,.1
Coussin étoile|cushion2|1|.45,.12,.45
Fauteuil à bascule|rocking|0|.7,1.1,.9
Chaise longue|lounger|0|.7,.9,1.8
Hamac sur support|hammock|0|2.2,1,.9
Paravent ajouré|screen|1|1.8,1.7,.3
Rideau sur portique|curtain|0|1.8,2.2,.4
Vase et branches|vase|1|.4,.9,.3
Plateau de thé|teatray|0|.5,.2,.35
Coffret d’expression|gift|1|.3,.15,.22
Roue des humeurs|emotionwheel|0|.5,.6,.2`],
['Métiers · atelier et formation', 'Créer des postes de travail et des simulations professionnelles', `
Marteau|hammer|0|.16,.32,.045
Maillet|hammer|1|.18,.35,.08
Tournevis cruciforme|screwdriver|0|.035,.25,.035
Clé plate|wrench|0|.06,.25,.02
Clé à molette|wrench|1|.08,.28,.025
Pince universelle|pliers|0|.08,.22,.03
Scie à main|saw|0|.14,.5,.035
Perceuse|drill|0|.3,.25,.08
Étau d’établi|vise|0|.3,.2,.2
Mètre ruban|tapemeasure|0|.08,.08,.04
Niveau à bulle|level|0|.5,.055,.025
Casque de chantier|helmet|1|.28,.18,.25
Gilet de sécurité|vest|0|.5,.65,.08
Caisse à outils|toolbox|0|.5,.25,.25
Échelle double|ladder|0|.6,1.8,.9
Diable de manutention|handtruck|0|.5,1.2,.45
Palette logistique|pallet|0|1.2,.14,.8
Cône de chantier|cone|1|.35,.65,.35
Barrière de chantier|fence|1|1.5,1,.4
Trousse de premiers secours|firstaid|0|.35,.25,.12`],
['Architecture · modules de scène', 'Assembler des pièces, parcours et espaces accessibles', `
Mur plein|wall|0|2.4,2.5,.18
Mur avec fenêtre|wall|1|2.4,2.5,.18
Mur avec ouverture de porte|wall|2|2.4,2.5,.18
Sol parquet|floor|0|2.4,.08,2.4
Sol carrelé|floor|1|2.4,.08,2.4
Sol de pierre|floor|2|2.4,.08,2.4
Estrade|stage|0|2,.4,1.5
Escalier droit|stairs|0|1,1.2,1.8
Rampe d’accès|ramp|0|1.2,.45,2.4
Garde-corps|fence|2|2,1,.1
Colonne classique|column|0|.5,2.4,.5
Pilier carré|column|1|.4,2.4,.4
Arche de jardin|arch|2|1.6,2.3,.4
Pergola|pergola|0|2.4,2.5,2.4
Fenêtre à volets|window|0|1.2,1.4,.2
Porte vitrée|door2|0|.95,2.1,.12
Porte coulissante|door2|1|1.8,2.1,.12
Auvent de terrasse|awning|0|2.4,.6,1.2
Cabine acoustique|booth|2|1.2,2.2,1.2
Dalle de chemin|stepping|0|.6,.08,.45`],
['Cuisine · épicerie et féculents', 'Préparer des plats traditionnels avec les féculents et ingrédients de base', `
Paquet de riz|staple|0|.14,.22,.08
Paquet de pâtes|staple|1|.12,.26,.08
Pomme de terre|tuber|0|.09,.07,.07
Plaquette de beurre|butter|0|.14,.045,.08
Pot de crème fraîche|jar|2|.09,.11,.09
Paquet de sucre|staple|2|.12,.18,.08
Pot de moutarde|jar|3|.08,.12,.08
Bouteille de vinaigre|bottle|3|.08,.28,.08
Gousse d’ail|allium|0|.065,.07,.065
Oignon jaune|allium|1|.09,.1,.09
Échalote|allium|2|.06,.11,.055
Boîte de conserve|can|0|.085,.11,.085
Bocal de cornichons|jar|4|.09,.15,.09
Tablette de chocolat|bar|0|.18,.015,.09
Sachet de levure|sachet|0|.08,.12,.005
Boîte de thé|staple|3|.1,.12,.1
Paquet de café moulu|staple|4|.1,.18,.07
Huile d’olive de Provence|bottle|4|.085,.31,.085
Fleur de sel de Guérande|jar|5|.1,.08,.1
Bouquet garni|herb|0|.18,.06,.07`],
['Cuisine · fruits et légumes du marché', 'Composer les recettes françaises avec les légumes du potager et fruits du verger', `
Courgette|gourd|0|.06,.24,.06
Salade verte|lettuce|0|.22,.15,.22
Concombre|gourd|1|.055,.28,.055
Haricots verts|pod|0|.15,.04,.1
Petits pois en cosses|pod|1|.14,.035,.07
Navet|tuber|1|.08,.11,.08
Branche de céleri|herb|1|.09,.32,.07
Artichaut|artichoke|0|.13,.16,.13
Radis rose|tuber|2|.04,.1,.04
Épinards|lettuce|1|.2,.12,.2
Asperges|pod|2|.08,.22,.08
Pêche|orchard|0|.08,.08,.08
Abricot|orchard|1|.065,.065,.065
Cerise|orchard|2|.09,.11,.045
Prune|orchard|3|.06,.07,.06
Melon de Cavaillon|melon|0|.18,.17,.18
Poire William|orchard|4|.085,.14,.085
Figues|orchard|5|.065,.07,.065
Framboises|orchard|6|.1,.05,.1
Noix de Grenoble|nut|0|.08,.05,.08`],
];
const slug = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const extendedCatalog: ExtendedAsset[] = collections.flatMap(([category, purpose, rows]) => {
  const entries=rows.trim().split('\n');
  if(entries.length!==20) throw new Error(`${category}: expected 20 assets, found ${entries.length}`);
  return entries.map(row=>{
    const [name,recipe,variant,dimensions]=row.split('|');
    return {id:`wp-${slug(name)}`,name,category,recipe,variant:Number(variant),size:dimensions.split(',').map(Number) as [number,number,number],text:name.toUpperCase(),description:`${name}. ${purpose}. Modèle de décor, échelle ajustable.`};
  });
});
export const extendedById = new Map(extendedCatalog.map(a=>[a.id,a]));
