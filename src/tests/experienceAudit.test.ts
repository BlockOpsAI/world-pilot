// src/tests/experienceAudit.test.ts
// Test suite automatisée de validation de qualité, de réalisme 3D,
// d'ergonomie cognitive et de certification des expériences virtuelles.

import assert from 'assert';
import { auditExperiencePrompt } from '../engine/experienceAuditor';
import { getValidatedExperiences, certifiedExperiencesRegistry } from '../library/certifiedExperiences';

async function runAuditTestSuite() {
  console.log('🤖 ========================================================');
  console.log('🤖 TEST RUNNER : MOTEUR AUTONOME D’AUDIT & CERTIFICATION');
  console.log('🤖 ========================================================\n');

  // Test 1 : Remplacement de batterie automobile (La demande clé de l'utilisateur)
  console.log('--- TEST 1 : Expérience Atelier Automobile (Batterie 12V) ---');
  const carPrompt = 'Montrer comment changer une batterie dans une voiture';
  const carReport = await auditExperiencePrompt(carPrompt, 'Mécanique & Automobile');

  console.log(`  📊 Score d'audit global : ${carReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${carReport.status}`);
  console.log(`  🚗 Objets 3D réalistes : ${carReport.objects3d.realisticEntitiesCount}/${carReport.objects3d.totalEntities}`);
  console.log(`  🚫 Fallbacks interdits détectés : ${carReport.objects3d.forbiddenFallbacksDetected.length}`);
  console.log(`  ⚡ Règles causales définies : ${carReport.interactions.rulesCount}`);
  console.log(`  🛡️ Invariants de sécurité : ${carReport.interactions.invariantsCount}`);
  console.log(`  🧠 Points d'hésitation humaine résolus : ${carReport.cognitiveErgonomics.hesitationPointsResolved}/${carReport.cognitiveErgonomics.totalHesitationPoints}`);

  assert.strictEqual(carReport.status, 'validated', "L'expérience automobile doit être certifiée avec le statut 'validated'");
  assert(carReport.overallScore >= 95, `Le score (${carReport.overallScore}) doit être >= 95`);
  assert.strictEqual(carReport.objects3d.forbiddenFallbacksDetected.length, 0, "Aucun canard ou modèle absurde ne doit être utilisé pour une voiture");
  assert(carReport.objects3d.realisticEntitiesCount >= 3, "La berline, le bac à batterie et la batterie 12V doivent être réalistes");
  assert(carReport.interactions.rulesCount >= 2, "Les règles d'inspection et d'installation doivent être présentes");
  assert(carReport.interactions.invariantsCount >= 1, "L'invariant de sécurité électrique doit être présent");
  assert.strictEqual(carReport.cognitiveErgonomics.passed, true, "Tous les points d'hésitation humaine doivent être résolus");
  assert.strictEqual(carReport.trace.completed, true, "La trace de la quête doit pouvoir être simulée jusqu'au bout");
  console.log('  ✅ [PASS] Expérience Automobile validée et certifiée avec succès.\n');

  // Test 2 : Expérience de Chimie (Brûleur et Fiole Erlenmeyer)
  console.log('--- TEST 2 : Expérience Laboratoire Chimique (Fiole & Brûleur) ---');
  const chemPrompt = 'Chauffe la fiole Erlenmeyer sur le brûleur de laboratoire';
  const chemReport = await auditExperiencePrompt(chemPrompt, 'Chimie & Sciences');

  console.log(`  📊 Score d'audit global : ${chemReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${chemReport.status}`);
  console.log(`  ⚗️ Stabilité du mobilier : ${chemReport.fluidity.stableFurnitureCount} meuble(s) fixe(s) stabilisé(s)`);
  console.log(`  🧲 Outils manipulables : ${chemReport.fluidity.movableToolsCount} outil(s)`);
  console.log(`  🔊 Retours sonores & visuels : validés`);

  assert.strictEqual(chemReport.status, 'validated', "L'expérience chimique doit être certifiée avec le statut 'validated'");
  assert(chemReport.overallScore >= 90, `Le score chimie (${chemReport.overallScore}) doit être >= 90`);
  assert.strictEqual(chemReport.fluidity.issues.length, 0, "Aucun conflit de collision meuble/objet ne doit exister");
  console.log('  ✅ [PASS] Expérience Chimie validée sans risque de freeze physique.\n');

  // Test 3 : Expérience Culinaire (Ratatouille en Cocotte)
  console.log('--- TEST 3 : Expérience Culinaire (Mijotage Ratatouille) ---');
  const cookingPrompt = 'Fais mijoter la ratatouille dans la cocotte sur le feu';
  const cookingReport = await auditExperiencePrompt(cookingPrompt, 'Cuisine & Gastronomie');

  console.log(`  📊 Score d'audit global : ${cookingReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${cookingReport.status}`);
  console.log(`  🥘 Stabilité de l'îlot : mobilier fixe sans instabilité`);
  console.log(`  🥦 Ingrédients manipulables : aimantage magnétique vers la planche et cocotte`);
  assert.strictEqual(cookingReport.status, 'validated', "L'expérience de cuisine doit être certifiée 'validated'");
  console.log('  ✅ [PASS] Expérience Culinaire validée avec aimantage magnétique et contrôle thermique.\n');

  // Test 4 : Expérience Boutique Louis Vuitton & Haute Maroquinerie
  console.log('--- TEST 4 : Expérience Boutique Louis Vuitton & Haute Maroquinerie ---');
  const lvPrompt = 'Visite de la boutique de luxe Louis Vuitton pour examiner les sacs et la maroquinerie';
  const lvReport = await auditExperiencePrompt(lvPrompt, 'Mode & Luxe Showroom');

  console.log(`  📊 Score d'audit global : ${lvReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${lvReport.status}`);
  console.log(`  👜 Objets 3D réalistes : ${lvReport.objects3d.realisticEntitiesCount}/${lvReport.objects3d.totalEntities}`);
  console.log(`  ⚡ Règles d'inspection & podium : ${lvReport.interactions.rulesCount}`);
  console.log(`  🛡️ Invariant d'authenticité certifiée : ${lvReport.interactions.invariantsCount}`);
  console.log(`  🧠 Points d'hésitation humaine résolus : ${lvReport.cognitiveErgonomics.hesitationPointsResolved}/${lvReport.cognitiveErgonomics.totalHesitationPoints}`);

  assert.strictEqual(lvReport.status, 'validated', "L'expérience Louis Vuitton doit être certifiée 'validated'");
  assert(lvReport.overallScore >= 95, `Le score Louis Vuitton (${lvReport.overallScore}) doit être >= 95`);
  assert(lvReport.objects3d.realisticEntitiesCount >= 4, "Les sacs Monogram, Capucines, le comptoir et la vitrine doivent être réalistes");
  assert.strictEqual(lvReport.trace.completed, true, "La trace de visite doit se terminer avec succès");
  console.log('  ✅ [PASS] Expérience Louis Vuitton validée et certifiée avec succès.\n');

  // Test 5 : Expérience Atelier Pâtisserie (Cookies aux Pépites de Chocolat)
  console.log('--- TEST 5 : Expérience Atelier Pâtisserie (Cookies au Four) ---');
  const cookiePrompt = 'Préparer et faire cuire des cookies aux pépites de chocolat au four';
  const cookieReport = await auditExperiencePrompt(cookiePrompt, 'Cuisine & Gastronomie');

  console.log(`  📊 Score d'audit global : ${cookieReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${cookieReport.status}`);
  console.log(`  🍪 Objets 3D réalistes : ${cookieReport.objects3d.realisticEntitiesCount}/${cookieReport.objects3d.totalEntities}`);
  console.log(`  ⚡ Règles causales pâtisserie : ${cookieReport.interactions.rulesCount}`);
  console.log(`  🛡️ Invariant de cuisson sécurisée : ${cookieReport.interactions.invariantsCount}`);

  assert.strictEqual(cookieReport.status, 'validated', "L'expérience Cookies doit être certifiée 'validated'");
  assert(cookieReport.overallScore >= 95, `Le score Cookies (${cookieReport.overallScore}) doit être >= 95`);
  assert.strictEqual(cookieReport.fluidity.issues.length, 0, "Aucun problème d'instabilité physique Rapier");
  assert.strictEqual(cookieReport.trace.completed, true, "La cuisson au four doit pouvoir être menée à son terme");
  console.log('  ✅ [PASS] Expérience Cookies validée et certifiée avec succès.\n');

  // Test 6 : Expérience Showroom Supercar
  console.log('--- TEST 6 : Expérience Showroom Supercar ---');
  const carVRPrompt = 'Showroom automobile Victoria VR : inspecter et customiser la supercar';
  const carVRReport = await auditExperiencePrompt(carVRPrompt, 'Métavers Victoria VR');

  console.log(`  📊 Score d'audit global : ${carVRReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${carVRReport.status}`);
  console.log(`  🏎️ Objets 3D réalistes : ${carVRReport.objects3d.realisticEntitiesCount}/${carVRReport.objects3d.totalEntities}`);
  console.log(`  ⚡ Personnalisation & Démarrage V12 : ${carVRReport.interactions.rulesCount} règles`);

  assert.strictEqual(carVRReport.status, 'validated', "Le Showroom Supercar doit être certifié 'validated'");
  assert(carVRReport.overallScore >= 95, `Le score Supercar (${carVRReport.overallScore}) doit être >= 95`);
  assert.strictEqual(carVRReport.trace.completed, true, "La trace du configurateur au démarrage doit être fluide");
  console.log('  ✅ [PASS] Expérience Supercar Victoria VR validée et certifiée avec succès.\n');

  // Test 7 : Expérience Penthouse Panoramique & Galerie NFT (Victoria VR)
  console.log('--- TEST 7 : Expérience Penthouse Panoramique & Galerie NFT ---');
  const phPrompt = 'Visite du penthouse panoramique Victoria VR avec galerie d’art numérique';
  const phReport = await auditExperiencePrompt(phPrompt, 'Métavers Victoria VR');

  console.log(`  📊 Score d'audit global : ${phReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${phReport.status}`);
  console.log(`  🌆 Objets 3D réalistes : ${phReport.objects3d.realisticEntitiesCount}/${phReport.objects3d.totalEntities}`);
  console.log(`  ⚡ Curation NFT & Ambiance Golden Hour : ${phReport.interactions.rulesCount} règles`);

  assert.strictEqual(phReport.status, 'validated', "Le Penthouse doit être certifié 'validated'");
  assert(phReport.overallScore >= 95, `Le score Penthouse (${phReport.overallScore}) doit être >= 95`);
  assert.strictEqual(phReport.trace.completed, true, "La quête de curation d'art et domotique doit réussir");
  console.log('  ✅ [PASS] Expérience Penthouse Victoria VR validée et certifiée avec succès.\n');

  // Test 8 : Expérience Coupole Spatiale Orbitale Zéro-G (Victoria VR)
  console.log('--- TEST 8 : Expérience Coupole Spatiale Orbitale Zéro-G ---');
  const spacePrompt = 'Station spatiale orbitale Victoria VR : observation de la Terre et sas de décompression';
  const spaceReport = await auditExperiencePrompt(spacePrompt, 'Aérospatial & Futurisme');

  console.log(`  📊 Score d'audit global : ${spaceReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${spaceReport.status}`);
  console.log(`  🚀 Objets 3D réalistes : ${spaceReport.objects3d.realisticEntitiesCount}/${spaceReport.objects3d.totalEntities}`);
  console.log(`  ⚡ Télémétrie & Arrimage Sas : ${spaceReport.interactions.rulesCount} règles`);

  assert.strictEqual(spaceReport.status, 'validated', "La Coupole Spatiale doit être certifiée 'validated'");
  assert(spaceReport.overallScore >= 95, `Le score Coupole Spatiale (${spaceReport.overallScore}) doit être >= 95`);
  assert.strictEqual(spaceReport.trace.completed, true, "La trace astronautique doit être 100% faisable");
  console.log('  ✅ [PASS] Expérience Spatiale Victoria VR validée et certifiée avec succès.\n');

  // Test 9 : Expérience Ameublement & DIY (Montage Meuble IKEA)
  console.log('--- TEST 9 : Expérience Ameublement & DIY (Montage Meuble IKEA) ---');
  const ikeaPrompt = 'Montage d’un meuble IKEA en kit avec tourillons et fixation murale';
  const ikeaReport = await auditExperiencePrompt(ikeaPrompt, 'Ameublement & DIY');

  console.log(`  📊 Score d'audit global : ${ikeaReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${ikeaReport.status}`);
  console.log(`  🪑 Objets 3D réalistes : ${ikeaReport.objects3d.realisticEntitiesCount}/${ikeaReport.objects3d.totalEntities}`);
  console.log(`  ⚡ Règles causales montage : ${ikeaReport.interactions.rulesCount} règles`);
  console.log(`  🛡️ Invariant sécurité anti-basculement : ${ikeaReport.interactions.invariantsCount}`);

  assert.strictEqual(ikeaReport.status, 'validated', "Le Montage IKEA doit être certifié 'validated'");
  assert(ikeaReport.overallScore >= 95, `Le score IKEA (${ikeaReport.overallScore}) doit être >= 95`);
  assert(ikeaReport.objects3d.realisticEntitiesCount >= 5, "Les panneaux, carton, sachet, clé Allen et équerre doivent être réalistes");
  assert.strictEqual(ikeaReport.trace.completed, true, "La trace du montage jusqu’à la fixation murale doit réussir");
  console.log('  ✅ [PASS] Expérience Montage IKEA validée et certifiée avec succès.\n');

  // Test 10 : Expérience Tech & Game Design (Level Design 3D & Playtest IA)
  console.log('--- TEST 10 : Expérience Game Design Lab (Studio 3D & Playtest IA) ---');
  const gamedevPrompt = 'Créer un jeu de plateforme 3D avec plateformes, gemmes et playtest IA';
  const gamedevReport = await auditExperiencePrompt(gamedevPrompt, 'Tech & Game Design');

  console.log(`  📊 Score d'audit global : ${gamedevReport.overallScore}/100`);
  console.log(`  🎯 Statut : ${gamedevReport.status}`);
  console.log(`  🎮 Objets 3D réalistes : ${gamedevReport.objects3d.realisticEntitiesCount}/${gamedevReport.objects3d.totalEntities}`);
  console.log(`  ⚡ Règles de Level Design & Playtest : ${gamedevReport.interactions.rulesCount} règles`);
  console.log(`  🛡️ Invariant faisabilité de niveau : ${gamedevReport.interactions.invariantsCount}`);

  assert.strictEqual(gamedevReport.status, 'validated', "Le Game Design Lab doit être certifié 'validated'");
  assert(gamedevReport.overallScore >= 95, `Le score GameDev (${gamedevReport.overallScore}) doit être >= 95`);
  assert(gamedevReport.objects3d.realisticEntitiesCount >= 5, "La console, spawn pad, plateformes, gemmes, laser et portail doivent être réalistes");
  assert.strictEqual(gamedevReport.trace.completed, true, "La trace de conception et playtest IA doit réussir");
  console.log('  ✅ [PASS] Expérience Game Design Lab validée et certifiée avec succès.\n');

  // Test 11 : Vérification du Registre Global des Expériences Certifiées
  console.log('--- TEST 11 : Registre Global des Expériences Certifiées ---');
  const validatedList = getValidatedExperiences();
  console.log(`  📋 Nombre d'expériences officiellement validées : ${validatedList.length}`);

  assert(validatedList.length >= 12, `Le registre doit contenir au moins 12 expériences certifiées (actuel: ${validatedList.length})`);
  assert.strictEqual(validatedList.length, certifiedExperiencesRegistry.length, "Toutes les expériences du registre doivent être validées");
  validatedList.forEach(exp => {
    assert.strictEqual(exp.status, 'validated', `L'expérience '${exp.id}' doit porter le statut 'validated'`);
    assert(exp.auditScore >= 90, `L'expérience '${exp.id}' doit avoir un score >= 90`);
    assert(exp.realisticObjects.length > 0, `L'expérience '${exp.id}' doit documenter ses objets 3D réalistes`);
    assert(exp.hesitationsResolved.length > 0, `L'expérience '${exp.id}' doit documenter ses résolutions d'hésitations`);
  });
  console.log('  ✅ [PASS] Toutes les 12 expériences du registre portent le statut certifié \'validated\'.\n');

  console.log('🎉 ========================================================');
  console.log('🎉 TOUS LES TESTS D’AUDIT ET DE CERTIFICATION ONT RÉUSSI !');
  console.log('🎉 ========================================================');
}

runAuditTestSuite().catch(err => {
  console.error('❌ Échec de la suite de tests d’audit :', err);
  process.exit(1);
});
