# Bibliothèque d’objets WorldPilot

500 modèles originaux procéduraux : les 80 objets initiaux et 420 nouveaux objets répartis dans 21 collections. Chaque modèle possède un fichier GLB autonome et une vignette SVG dans `public/library/`. Le manifeste fournit les dimensions effectivement exportées et le poids de chaque GLB.

## Utilisation

Ouvrir **Bibliothèque · 500** dans la barre supérieure. Rechercher un objet ou filtrer par catégorie, puis cliquer sur Ajouter. Le kit de cours ajoute huit objets à des emplacements libres. Sélectionner un objet dans la scène ou la liste pour régler sa position en mètres, sa rotation, son échelle et son accent coloré. Les champs de contenu sont validés en quittant le champ.

Commandes locales reconnues sans appel à un modèle : `Ajoute une pompe démontable`, `Ajoute un fauteuil de bureau`, `Crée une salle de cours`. Employer le nom exact du catalogue. Les demandes plus complexes passent par le système d’IA existant, dont le contexte contient les 500 références.

La pompe dispose d’une vue éclatée ; les pièces d’assemblage d’une démonstration assemblée/séparée ; la porte, le coffre et le levier d’états activables. Le quiz permet de choisir la réponse attendue et de tester A/B/C. Le chronomètre démarre, se met en pause et se réinitialise. Le lecteur audio utilise la synthèse vocale du navigateur. La sphère de respiration est animée. Les températures, masses et graphiques sont des représentations illustratives réglables, pas des instruments de mesure physique.

Les événements INTERACT, REQUEST_HELP, ANSWER_CORRECT et ANSWER_INCORRECT peuvent être utilisés dans les règles. Les règles de base créées avec les objets marquent des flags propres à leur identifiant. Le dépôt utilise le mécanisme DROP existant : sélectionner un objet, puis une zone, et double-cliquer sur l’objet.

## Fichiers et maintenance

- `src/library/catalog.ts` : catalogue, placement, création des entités et règles.
- `src/library/models.ts` : géométries et matériaux Three.js partagés par l’app et le générateur.
- `src/library/LibraryModel.tsx` : affichage et animation dans la scène.
- `src/library/LibraryPanel.tsx` : recherche, ajout, réglages et démonstrations interactives.
- `scripts/generate-library.ts` : génération reproductible des GLB et aperçus SVG.
- `public/library/manifest.json` : inventaire des exports.

`npm run generate:library` régénère les fichiers. `npm run test:library` valide les 500 modèles et leur réimport GLB, les origines au sol, les identifiants uniques, les commandes, les flags de quiz et la conservation du modèle après une modification.

## Limites explicites

Ces modèles sont des objets procéduraux à matériaux PBR, de détail intermédiaire, et non des scans photoréalistes. Le mannequin et les mains sont stylisés. Les assemblages sont des démonstrations commandées par boutons, sans exercice de montage pièce par pièce. Le tableau partagé et les notes sont locaux : aucune synchronisation multiutilisateur n’est ajoutée. Les sous-titres affichent du texte saisi, sans transcription automatique. Le moteur conserve son fonctionnement de session en mémoire.


## Extension de 420 objets

Les nouvelles collections couvrent la cuisine (ustensiles, équipements, ingrédients), la gastronomie française, les fêtes et traditions, la table, la ville, le quotidien, la classe, les mathématiques, le laboratoire, les arts, les boutiques, les réunions, les jeux fantasy et science-fiction, les sports, la nature, le bien-être, les métiers et les modules architecturaux. Chaque collection contient 20 objets.

`src/library/extendedCatalog.ts` contient les noms français et dimensions. `src/library/extendedModels.ts` contient 252 constructions paramétriques avec leurs variantes structurelles. Les modèles sont ajustés aux dimensions du catalogue, avec origine au sol et matériaux PBR. Les dimensions sont des choix de mise en scène, pas des dimensions normalisées.

Les 420 nouveaux objets sont des accessoires de décor sélectionnables, déplaçables et redimensionnables. Ils ne simulent pas le fonctionnement des appareils, les expériences scientifiques, les jeux ou les instruments. Les collections bien-être ne constituent pas des dispositifs thérapeutiques. Les matériaux sont sans textures photographiques ; la géométrie est stylisée. La bibliothèque compte 500 ressources, mais leur affichage simultané en VR n’a pas été validé : composer les scènes avec les objets nécessaires.
