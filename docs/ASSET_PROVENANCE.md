# Provenance des assets WorldPilot

Dernière mise à jour : 4 octobre 2026

## Objets 3D GLB

Les objets GLB livrés avec WorldPilot ont été créés directement par WorldPilot. Ils ne sont pas des modèles GLB téléchargés depuis Sketchfab, TurboSquid ou une autre bibliothèque externe. Les fichiers correspondants se trouvent principalement dans `public/library/` et sont chargés par le catalogue de `src/library/`.

Les scènes peuvent aussi contenir des formes et modèles générés à l’exécution par les composants Three.js de `src/scene/`. Ils sont distincts des fichiers GLB précréés.

## Éléments à distinguer

Cette déclaration porte sur les objets GLB du projet. Elle ne signifie pas que toutes les dépendances logicielles, polices, sons ou ressources chargées depuis le Web ont été créés par WorldPilot. Pour toute distribution, vérifier les notices des dépendances et les licences des ressources supplémentaires effectivement utilisées dans la scène ou la démonstration.

Les textes, noms de marques et références à des produits dans des exemples de scènes ne constituent pas une autorisation de marque ou une validation par leurs titulaires. Les scènes contenant de telles références doivent être examinées avant une utilisation promotionnelle ou commerciale.

## Vérification reproductible

Pour préparer une distribution, inventorier les chemins GLB réellement référencés dans le catalogue, confirmer leur présence dans le dépôt, puis comparer l’inventaire avec le contenu du paquet livré. Mettre à jour ce document si l’origine ou le mode de création d’un objet change.

Ce document consigne une déclaration de provenance sur les objets GLB ; il ne constitue pas une certification de droits, une garantie d’absence de réclamation ni une certification de publication sur une plateforme tierce.
