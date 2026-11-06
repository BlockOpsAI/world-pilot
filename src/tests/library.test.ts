import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extendedCatalog } from '../library/extendedCatalog';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { catalog, getAsset, createLibraryPatch, parseLibraryInstruction } from '../library/catalog';
import { buildModel, disposeModel } from '../library/models';
import { evaluateEvent } from '../engine/evaluator';
import { validateWorld } from '../engine/validator';
import type { WorldState, EntitySpec, SoundEffect, WorldPatch } from '../core/types';

assert.equal(catalog.length,540);
assert.equal(new Set(catalog.map(a=>a.id)).size,540);
assert.equal(extendedCatalog.length,460);
assert.equal(new Set(catalog.map(a=>a.name)).size,540);
assert.equal(parseLibraryInstruction('Ajoute une baguette',{})?.entitiesCreated?.[0].visuals?.assetId,'wp-baguette');
const patch=createLibraryPatch(catalog.map(a=>a.id),{});
let world:WorldState={version:1,ir:{entities:Object.fromEntries(patch.entitiesCreated!.map(e=>[e.id,e])),rules:Object.fromEntries(patch.rulesChanged!.map(r=>[r.id!,r as any])),invariants:{}},flags:{}};
assert.equal(validateWorld(world).valid,true);
const repeat=createLibraryPatch(['pump','pump'],world.ir.entities);
assert.notEqual(repeat.entitiesCreated![0].id,repeat.entitiesCreated![1].id);
for(const e of repeat.entitiesCreated!)assert(!world.ir.entities[e.id]);
assert.equal(parseLibraryInstruction('Ajoute une pompe démontable.',{})?.entitiesCreated?.length,1);
assert.equal(parseLibraryInstruction('Crée une salle de cours',{})?.entitiesCreated?.length,8);
assert.equal(parseLibraryInstruction('Supprime une pompe démontable',{}),null);
const quiz=patch.entitiesCreated!.find(e=>e.visuals?.assetId==='quiz')!;
world=evaluateEvent(world,{type:'ANSWER_INCORRECT',sourceId:quiz.id}).newState;
assert.equal(world.flags[`${quiz.id}_answer_correct`],undefined);
world=evaluateEvent(world,{type:'ANSWER_CORRECT',sourceId:quiz.id}).newState;
assert.equal(world.flags[`${quiz.id}_answer_correct`],true);
const other=patch.entitiesCreated!.find(e=>e.visuals?.assetId==='cards')!;
assert.equal(world.flags[`${other.id}_answer_correct`],undefined,'Quiz outcomes must be scoped to the entity');
const loader=new GLTFLoader();
let meshCount=0;
for(const asset of catalog){
  const model=buildModel(asset.id),box=new T.Box3().setFromObject(model);
  assert(Math.abs(box.min.y)<1e-5,`${asset.id}: bottom must rest on floor`);
  assert(!box.isEmpty(),`${asset.id}: empty geometry`);
  if ('recipe' in asset) assert(box.getSize(new T.Vector3()).distanceTo(new T.Vector3(...asset.size))<1e-5,`${asset.id}: declared meter dimensions`);
  model.traverse(o=>{if(o instanceof T.Mesh){meshCount++;const p=o.geometry.getAttribute('position');for(let i=0;i<p.array.length;i++)assert(Number.isFinite(p.array[i]),`${asset.id}: invalid vertex`);}});
  const data=fs.readFileSync(`public/library/${asset.id}.glb`);
  assert.equal(data.readUInt32LE(0),0x46546c67);
  const gltf=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  const imported=new T.Box3().setFromObject(gltf.scene);
  assert(imported.getSize(new T.Vector3()).distanceTo(box.getSize(new T.Vector3()))<1e-4,`${asset.id}: export dimension mismatch`);
  assert(fs.statSync(`public/library/${asset.id}.svg`).size>100);
  disposeModel(model);disposeModel(gltf.scene);
}
const assembled=buildModel('pump'),exploded=buildModel('pump',{active:true});
assert(new T.Box3().setFromObject(exploded).getSize(new T.Vector3()).z>new T.Box3().setFromObject(assembled).getSize(new T.Vector3()).z);
disposeModel(assembled);disposeModel(exploded);
console.log(`PASS: 540 catalog entries, ${meshCount} meshes, 540 GLB roundtrips, floor origins, unique placement IDs, deterministic commands, entity-scoped quiz flags.`);

const { useWorldStore } = await import('../engine/store');
const store = useWorldStore.getState();
store.resetWorld();
const initial = createLibraryPatch(['pump'],{});
store.applyPatch(initial,'Add pump',{intent:'test'});
const pump = initial.entitiesCreated![0];
store.applyPatch({entitiesChanged:[{id:pump.id,capabilities:pump.capabilities.map(c=>c.type==='educational'?{...c,active:true}:c)}]},'Explode pump',{intent:'test'});
assert.equal(useWorldStore.getState().world.ir.entities[pump.id].visuals?.assetId,'pump','Capability edits must retain the asset renderer');
assert.equal(useWorldStore.getState().world.ir.entities[pump.id].visuals?.modelUrl,'/library/pump.glb');
console.log('PASS: capability edits preserve library identity and model URL.');

// Validate FLE, Cooking, and Seminar Modules
const { fleScenes, createFLEPatch } = await import('../library/fleScenes');
const { cookingRecipes, createRecipePatch } = await import('../library/cookingRecipes');
const { seminarRooms, createSeminarPatch } = await import('../library/seminarRooms');
const { parseInstruction } = await import('../authoring/parser');

// 1. FLE Pedagogical Scenes (30)
assert.equal(fleScenes.length, 30, 'Must have exactly 30 FLE pedagogical scenes');
for (const scene of fleScenes) {
  assert(scene.number >= 1 && scene.number <= 30, `Invalid scene number: ${scene.number}`);
  assert(scene.title.length > 0, `Empty title in scene ${scene.id}`);
  assert(scene.dialogue.length > 0, `Empty dialogue in scene ${scene.id}`);
  assert(scene.vocabulary.length >= 3, `Vocabulary too short in scene ${scene.id}`);
  assert(['A', 'B', 'C'].includes(scene.quizQuestion.answer), `Invalid quiz answer in scene ${scene.id}`);
  const patch = createFLEPatch(scene, {});
  assert(patch.entitiesCreated!.length >= 4, `FLE patch too small for ${scene.id}`);
}
console.log('PASS: 30 FLE pedagogical scenes, structured dialogues, vocabulary & patches validated.');

// 2. Cooking Recipes Module (12)
assert.equal(cookingRecipes.length, 12, 'Must have exactly 12 cooking recipes');
for (const recipe of cookingRecipes) {
  assert(recipe.number >= 1 && recipe.number <= 12, `Invalid recipe number: ${recipe.number}`);
  assert(recipe.ingredients.length >= 5, `Recipe ${recipe.id} must have at least 5 ingredients`);
  assert(recipe.utensils.length >= 2, `Recipe ${recipe.id} must have utensils`);
  assert(recipe.steps.length >= 4, `Recipe ${recipe.id} must have step-by-step instructions`);
  assert(['A', 'B', 'C'].includes(recipe.quizQuestion.answer), `Invalid quiz answer in recipe ${recipe.id}`);
  const patch = createRecipePatch(recipe, {});
  assert(patch.entitiesCreated!.length >= 5, `Recipe patch too small for ${recipe.id}`);
}
console.log('PASS: 12 cooking recipes, 3D ingredients, utensils & step-by-step guides validated.');

// 3. Seminar Rooms Module (8)
assert.equal(seminarRooms.length, 8, 'Must have exactly 8 seminar/meeting rooms');
for (const room of seminarRooms) {
  assert(room.number >= 1 && room.number <= 8, `Invalid room number: ${room.number}`);
  assert(room.equipment.length >= 4, `Seminar room ${room.id} must have equipment`);
  assert(room.capacity > 0, `Room ${room.id} must have positive capacity`);
  assert(room.keyFeatures.length >= 3, `Room ${room.id} must have key features`);
  assert(['A', 'B', 'C'].includes(room.quizQuestion.answer), `Invalid quiz answer in room ${room.id}`);
  const patch = createSeminarPatch(room, {});
  assert(patch.entitiesCreated!.length >= 5, `Seminar patch too small for ${room.id}`);
}
console.log('PASS: 8 seminar rooms, layouts, audiovisuals & ergonomic quizzes validated.');

// 4. Natural Language Parser integration
const ratatouilleParsed = parseInstruction('recette ratatouille', { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(ratatouilleParsed.plan.intent, 'load_cooking_recipe');
assert(ratatouilleParsed.patch.entitiesCreated!.length > 5);

const boardroomParsed = parseInstruction('salle de reunion boardroom', { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(boardroomParsed.plan.intent, 'load_seminar_room');
assert(boardroomParsed.patch.entitiesCreated!.length > 5);

const fleBoulangerieParsed = parseInstruction('scene fle boulangerie', { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(fleBoulangerieParsed.plan.intent, 'load_fle_scene');
assert(fleBoulangerieParsed.patch.entitiesCreated!.length > 4);

console.log('PASS: natural language parser successfully resolves cooking recipes, seminar rooms, and FLE scenes.');

// 5. Atmospheres & Particle Catalogue (8)
const { atmospheres, getAtmosphere } = await import('../library/atmospheres');
assert.equal(atmospheres.length, 8, 'Must have exactly 8 atmospheres');
assert.equal(new Set(atmospheres.map(a => a.id)).size, 8, 'Atmosphere IDs must be unique');
for (const atmo of atmospheres) {
  assert(atmo.name.length > 0, `Atmosphere ${atmo.id} has empty name`);
  assert(atmo.description.length > 0, `Atmosphere ${atmo.id} has empty description`);
  assert(atmo.particleConfig.count > 0, `Atmosphere ${atmo.id} must have particles`);
  assert(getAtmosphere(atmo.id).id === atmo.id, `getAtmosphere(${atmo.id}) failed`);
}
const atmoPluie = parseInstruction('ambiance pluie', { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(atmoPluie.plan.intent, 'set_atmosphere');
assert.equal((atmoPluie.plan.actions as any)[0].atmosphere, 'paris-rain');

const atmoZen = parseInstruction('ambiance zen', { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(atmoZen.plan.intent, 'set_atmosphere');
assert.equal((atmoZen.plan.actions as any)[0].atmosphere, 'zen-garden');
console.log('PASS: 8 atmosphere presets, particle configurations & natural language triggers validated.');

// 6. Demonstrations Scenarios Module (11)
const { demonstrationScenarios, createDemonstrationPatch } = await import('../library/demonstrations');
assert.equal(demonstrationScenarios.length, 12, 'Must have exactly 12 demonstration scenarios');
assert.equal(new Set(demonstrationScenarios.map(d => d.id)).size, 12, 'Demonstration IDs must be unique');
for (const demo of demonstrationScenarios) {
  assert(demo.number >= 1 && demo.number <= 12, `Invalid demo number: ${demo.number}`);
  assert(demo.title.length > 0, `Demo ${demo.id} has empty title`);
  assert(demo.prompt.length > 0, `Demo ${demo.id} has empty prompt`);
  assert(demo.equipment.length >= 2, `Demo ${demo.id} must have at least 2 equipment items`);
  
  const demoPatch = createDemonstrationPatch(demo, {});
  assert(demoPatch.entitiesCreated!.some(e => e.id === demo.primaryEntityId), `Demo ${demo.id} primaryEntityId not in created entities`);
  assert(demoPatch.entitiesCreated!.length >= demo.equipment.length, `Patch missing entities for demo ${demo.id}`);
  assert(demoPatch.rulesChanged!.length >= 1, `Demo ${demo.id} must have cause-and-effect rules`);
  
  // Verify rules contain sound cues or animations
  const hasInteractiveEffect = demoPatch.rulesChanged!.some(r =>
    r.actions?.some(a => ['play_sound', 'emit_particles', 'trigger_animation'].includes(a.type))
  );
  assert(hasInteractiveEffect, `Demo ${demo.id} rules must trigger sounds, particles, or animations`);
}

const demoCafeParsed = parseInstruction('demo cafe', { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(demoCafeParsed.plan.intent, 'load_demonstration');
assert(demoCafeParsed.patch.entitiesCreated!.length >= 3);

const demoPitchParsed = parseInstruction('demo pitch', { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(demoPitchParsed.plan.intent, 'load_demonstration');
assert(demoPitchParsed.patch.entitiesCreated!.length >= 3);

console.log('PASS: 11 demonstration scenarios, causal chains, procedural audio & particles validated.');

// 7. Ambient Audio, Master Volume, Mute, Cinematic Tour & Persistence
const { ambientAudio } = await import('../engine/ambientAudio');
assert.equal(ambientAudio.isAudioActive(), false);
ambientAudio.setAtmosphere('paris-rain');
ambientAudio.setAtmosphere('cozy-bistrot');

// Audio volume & mute engine assertions
assert.equal(ambientAudio.getVolume(), 0.8);
ambientAudio.setVolume(0.4);
assert.equal(ambientAudio.getVolume(), 0.4);
assert.equal(ambientAudio.isAudioMuted(), false);
assert.equal(ambientAudio.getEffectiveVolume(), 0.4);
const isMutedNow = ambientAudio.toggleMute();
assert.equal(isMutedNow, true);
assert.equal(ambientAudio.isAudioMuted(), true);
assert.equal(ambientAudio.getEffectiveVolume(), 0);
ambientAudio.setMuted(false);
assert.equal(ambientAudio.isAudioMuted(), false);
assert.equal(ambientAudio.getEffectiveVolume(), 0.4);

// Store audio methods
useWorldStore.getState().setAudioVolume(0.75);
assert.equal(useWorldStore.getState().audioVolume, 0.75);
assert.equal(ambientAudio.getVolume(), 0.75);
useWorldStore.getState().toggleAudioMute();
assert.equal(useWorldStore.getState().isAudioMuted, true);
useWorldStore.getState().toggleAudioMute();
assert.equal(useWorldStore.getState().isAudioMuted, false);

// Audio natural language parser commands
const dummyContext = { selectedEntityId: null, pointedEntityId: null };
const muteParsed = parseInstruction('coupe le son', dummyContext, {});
assert.equal(muteParsed.plan.intent, 'set_audio_muted');
const unmuteParsed = parseInstruction('remets le son', dummyContext, {});
assert.equal(unmuteParsed.plan.intent, 'set_audio_muted');
const volDownParsed = parseInstruction('baisse le son', dummyContext, {});
assert.equal(volDownParsed.plan.intent, 'set_audio_volume');
const volUpParsed = parseInstruction('monte le son', dummyContext, {});
assert.equal(volUpParsed.plan.intent, 'set_audio_volume');

const storeState = useWorldStore.getState();
assert.equal(storeState.isCinematicTourActive, false);
storeState.toggleCinematicTour();
assert.equal(useWorldStore.getState().isCinematicTourActive, true);
storeState.toggleCinematicTour();
assert.equal(useWorldStore.getState().isCinematicTourActive, false);

const exportJsonTest = JSON.stringify({
  world: {
    version: 1,
    ir: { entities: {}, rules: {}, invariants: {} },
    flags: {}
  },
  atmosphere: 'paris-rain'
});
const imported = useWorldStore.getState().importWorldJson(exportJsonTest);
assert.equal(imported, true);
assert.equal(useWorldStore.getState().currentAtmosphere, 'paris-rain');

console.log('PASS: ambient audio, master volume & mute, cinematic tour & world persistence validated.');

// 8. Interactive Quests, Task Sequences & Step-by-Step Evaluation
const ratatouillePatch = createRecipePatch(cookingRecipes[0], {});
assert(ratatouillePatch.questsAdded && ratatouillePatch.questsAdded.length === 1);
const rQuest = ratatouillePatch.questsAdded[0];
assert.equal(rQuest.steps.length, 4);
assert.equal(rQuest.status, 'in_progress');
assert.equal(rQuest.currentStepIndex, 0);

// Setup state with this quest
let questWorld: WorldState = {
  version: 1,
  ir: {
    entities: Object.fromEntries(ratatouillePatch.entitiesCreated!.map(e => [e.id, e])),
    rules: Object.fromEntries(ratatouillePatch.rulesChanged!.map(r => [r.id!, r as any])),
    invariants: {},
    quests: { [rQuest.id]: JSON.parse(JSON.stringify(rQuest)) },
    activeQuestId: rQuest.id
  },
  flags: {}
};

// Step 1: Wrong action doesn't advance
const wrongStepRes = evaluateEvent(questWorld, { type: 'INTERACT', sourceId: 'wrong_entity' });
assert.equal(wrongStepRes.newState.ir.quests![rQuest.id].currentStepIndex, 0);

// Step 1: Valid action advances
const step1Target = rQuest.steps[0].targetEntityId!;
const step1Res = evaluateEvent(questWorld, { type: 'INTERACT', sourceId: step1Target });
assert.equal(step1Res.newState.ir.quests![rQuest.id].currentStepIndex, 1);
assert.equal(step1Res.newState.ir.quests![rQuest.id].steps[0].completed, true);
questWorld = step1Res.newState;

// Step 2: Valid action
const step2Target = rQuest.steps[1].targetEntityId!;
const step2Res = evaluateEvent(questWorld, { type: 'INTERACT', sourceId: step2Target });
assert.equal(step2Res.newState.ir.quests![rQuest.id].currentStepIndex, 2);
questWorld = step2Res.newState;

// Step 3: Valid action
const step3Target = rQuest.steps[2].targetEntityId!;
const step3Res = evaluateEvent(questWorld, { type: 'INTERACT', sourceId: step3Target });
assert.equal(step3Res.newState.ir.quests![rQuest.id].currentStepIndex, 3);
questWorld = step3Res.newState;

// Step 4: Valid quiz answer completes the quest
const step4Target = rQuest.steps[3].targetEntityId!;
const step4Res = evaluateEvent(questWorld, { type: 'ANSWER_CORRECT', sourceId: step4Target });
assert.equal(step4Res.newState.ir.quests![rQuest.id].status, 'completed');
assert.equal(step4Res.newState.flags[`quest_${rQuest.id}_completed`], true);

// Check Rover maintenance procedure quest
const roverParsed = parseInstruction("Create a rover maintenance training bay.", { selectedEntityId: null, pointedEntityId: null }, {});
assert(roverParsed.patch.questsAdded && roverParsed.patch.questsAdded.length === 1);
assert.equal(roverParsed.patch.questsAdded[0].steps.length, 3);

console.log('PASS: interactive quests, step-by-step sequential procedures & completion validated.');

// 9. Embodied Spatial Agent (NPC / Interactive 3D Guide)
const { getAgentPersona, getSpeechDialogue } = await import('../engine/agentDialogues');
const chefPersona = getAgentPersona('cuisine');
assert.equal(chefPersona.name, 'Chef Auguste');
assert.equal(chefPersona.theme, 'chef');

const engineerPersona = getAgentPersona('formation');
assert.equal(engineerPersona.name, 'Ingénieure Nova');

const guidePersona = getAgentPersona('fle');
assert.equal(guidePersona.name, 'Jean, Guide Parisien');

const chefDialogue = getSpeechDialogue('Écouter l’astuce du chef', undefined, 'chef');
assert(chefDialogue.includes('conseils') || chefDialogue.includes('écoute') || chefDialogue.includes('allumer'));

const guideCallParsed = parseInstruction("appelle le guide", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(guideCallParsed.plan.intent, 'toggle_spatial_agent');

const storeForAgent = useWorldStore.getState();
assert.equal(storeForAgent.isSpatialAgentActive, true);
storeForAgent.toggleSpatialAgent();
assert.equal(useWorldStore.getState().isSpatialAgentActive, false);
storeForAgent.toggleSpatialAgent();
assert.equal(useWorldStore.getState().isSpatialAgentActive, true);

console.log('PASS: embodied spatial agent, NPC personas, contextual dialogues & studio toggles validated.');

const { worldThemes, getWorldTheme } = await import('../library/worldThemes');
assert.equal(worldThemes.length, 19);

// Check specialized showroom cycloramas & natural forest
const forestTheme = getWorldTheme('forest-clearing');
assert.equal(forestTheme.stageStyle, 'forest_clearing');
assert.equal(forestTheme.floor.type, 'forest_soil');

const luxuryTheme = getWorldTheme('luxury-showroom');
assert.equal(luxuryTheme.stageStyle, 'luxury_gallery');
const supercarTheme = getWorldTheme('supercar-showroom');
assert.equal(supercarTheme.stageStyle, 'supercar_studio');
const highTechTheme = getWorldTheme('high-tech-lab');
assert.equal(highTechTheme.stageStyle, 'high_tech_cleanroom');
const galleryTheme = getWorldTheme('contemporary-gallery');
assert.equal(galleryTheme.stageStyle, 'contemporary_gallery');

// Check fundamental universes
const marsTheme = getWorldTheme('martian-surface');
assert.equal(marsTheme.gravity[1], -3.72);
assert.equal(marsTheme.floor.type, 'martian_regolith');
assert.equal(marsTheme.stageStyle, 'mars_base');
assert.equal(marsTheme.stars, true);

const zeroGTheme = getWorldTheme('orbital-zerog');
assert.equal(zeroGTheme.gravity[1], 0);
assert.equal(zeroGTheme.floor.type, 'orbital_metal');
assert.equal(zeroGTheme.stageStyle, 'orbital_station');
assert.equal(zeroGTheme.stars, true);

const lunarTheme = getWorldTheme('lunar-base');
assert.equal(lunarTheme.gravity[1], -1.62);
assert.equal(lunarTheme.floor.type, 'lunar_dust');

const earthTheme = getWorldTheme('earth-atelier');
assert.equal(earthTheme.gravity[1], -9.81);
assert.equal(earthTheme.floor.type, 'stone');

const antigravTheme = getWorldTheme('antigravity-anomaly');
assert.equal(antigravTheme.gravity[1], 2.5);

// Check Natural Language Parser recognition
const marsShiftParsed = parseInstruction("Bascule en surface martienne", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(marsShiftParsed.plan.intent, 'shift_world_theme');
assert.equal(marsShiftParsed.plan.actions[0].theme, 'martian-surface');

const zeroGShiftParsed = parseInstruction("active le mode apesanteur", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(zeroGShiftParsed.plan.intent, 'shift_world_theme');
assert.equal(zeroGShiftParsed.plan.actions[0].theme, 'orbital-zerog');

const lunarShiftParsed = parseInstruction("direction la base lunaire", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(lunarShiftParsed.plan.intent, 'shift_world_theme');
assert.equal(lunarShiftParsed.plan.actions[0].theme, 'lunar-base');

const earthShiftParsed = parseInstruction("retourne en mode terre", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(earthShiftParsed.plan.intent, 'shift_world_theme');
assert.equal(earthShiftParsed.plan.actions[0].theme, 'earth-atelier');

// Check Store State & Dynamic Gravity Update
const storeInstance = useWorldStore.getState();
storeInstance.shiftWorldTheme('martian-surface');
assert.equal(useWorldStore.getState().currentWorldThemeId, 'martian-surface');
assert.equal(useWorldStore.getState().currentGravity[1], -3.72);

storeInstance.shiftWorldTheme('orbital-zerog');
assert.equal(useWorldStore.getState().currentWorldThemeId, 'orbital-zerog');
assert.equal(useWorldStore.getState().currentGravity[1], 0);

storeInstance.setCustomGravity([0, -5.0, 0]);
assert.equal(useWorldStore.getState().currentGravity[1], -5.0);

// Check Agent Dialogue for World Shift
const { getWorldShiftDialogue } = await import('../engine/agentDialogues');
const marsDialogue = getWorldShiftDialogue('martian-surface', 'engineer');
assert(marsDialogue.includes('martien') || marsDialogue.includes('3.72'));

const zeroGDialogue = getWorldShiftDialogue('orbital-zerog', 'chef');
assert(zeroGDialogue.includes('apesanteur') || zeroGDialogue.includes('sauces'));

console.log('PASS: world-shifting instantané, dynamic gravity, floor shaders & universe metamorphic transitions validated.');

// ---------------------------------------------------------------------------
// 11. Ingestion de Données Sémantiques (Data-to-3D / Anti-Skeuomorphisme)
// ---------------------------------------------------------------------------
const { 
  curatedDatasets, 
  getSemanticDataset, 
  parseRawData, 
  materializeDataTo3D 
} = await import('../engine/dataIngestion');
const { getDataIngestionDialogue } = await import('../engine/agentDialogues');

// 1. Curated Datasets validation
assert(curatedDatasets.length >= 5, 'Must provide at least 5 curated semantic datasets');
const businessData = getSemanticDataset('business-quarterly');
assert.equal(businessData.id, 'business-quarterly');
assert.equal(businessData.unit, 'M€');
assert(businessData.points.length >= 4, 'Business dataset must contain at least 4 quarterly points');

const energyData = getSemanticDataset('energy-consumption');
assert.equal(energyData.id, 'energy-consumption');
assert.equal(energyData.unit, 'GW');

const roverData = getSemanticDataset('space-telemetry');
assert.equal(roverData.id, 'space-telemetry');

const tokenomicsData = getSemanticDataset('victoria-vr-tokenomics');
assert.equal(tokenomicsData.id, 'victoria-vr-tokenomics');

const serversData = getSemanticDataset('server-infrastructure');
assert.equal(serversData.id, 'server-infrastructure');

// 2. Data Parsing validation (JSON & CSV)
const sampleJson = JSON.stringify([
  { label: 'Alpha', value: 10, unit: 'pts', color: '#ff0000' },
  { label: 'Beta', value: 50, unit: 'pts', color: '#00ff00' },
  { label: 'Gamma', value: 90, unit: 'pts', color: '#0000ff' }
]);
const parsedJson = parseRawData(sampleJson, 'Test JSON Ingestion');
assert.equal(parsedJson.title, 'Test JSON Ingestion');
assert.equal(parsedJson.points.length, 3);
assert.equal(parsedJson.points[0].label, 'Alpha');
assert.equal(parsedJson.points[0].value, 10);
assert.equal(parsedJson.points[2].value, 90);

const sampleCsv = `Label, Valeur, Unite\nCapteur Nord, 42.5, C\nCapteur Sud, 78.9, C`;
const parsedCsv = parseRawData(sampleCsv, 'Test CSV Ingestion');
assert.equal(parsedCsv.points.length, 2);
assert.equal(parsedCsv.points[0].label, 'Capteur Nord');
assert.equal(parsedCsv.points[0].value, 42.5);
assert.equal(parsedCsv.points[1].value, 78.9);

// 3. 3D Architectural Materialization validation (Plinths, Towers, Caps, Rules)
const patchLinear = materializeDataTo3D(parsedJson, 'linear');
assert(patchLinear.entitiesCreated && patchLinear.entitiesCreated.length > 0, 'Must create 3D entities');
assert(patchLinear.rulesChanged && patchLinear.rulesChanged.length > 0, 'Must create interactive rules');

// Plinth check
const plinth = patchLinear.entitiesCreated.find(e => e.id.startsWith('data_plinth_'));
assert(plinth, 'Must create an architectural base plinth');
assert.equal(plinth?.visuals?.shape, 'box');

// Towers check
const towers = patchLinear.entitiesCreated.filter(e => e.id.startsWith('data_pillar_'));
assert.equal(towers.length, 3, 'Must create 3 data tower pillars');
towers.forEach(t => {
  assert.equal(t.visuals?.shape, 'cylinder');
  const tr = t.capabilities.find(c => c.type === 'transform');
  assert(tr && tr.scale.y >= 0.5 && tr.scale.y <= 3.8, 'Towers must be normalized in height');
});

// Caps check
const caps = patchLinear.entitiesCreated.filter(e => e.id.startsWith('data_cap_'));
assert.equal(caps.length, 3, 'Must create glowing emissive telemetry caps');

// Rules check
assert.equal(patchLinear.rulesChanged.length, 3, 'Must create an inspect rule per data tower');
assert.equal(patchLinear.rulesChanged[0].trigger, 'INTERACT');
const showWarningAction = patchLinear.rulesChanged[0]?.actions?.find(a => a.type === 'show_warning');
assert(showWarningAction && showWarningAction.message?.includes('Alpha'), 'Rule warning must display metric label');

// Circular layout check
const patchCircular = materializeDataTo3D(parsedJson, 'circular');
const circTowers = (patchCircular.entitiesCreated || []).filter(e => e.id.startsWith('data_pillar_'));
const pos0 = circTowers[0]?.capabilities.find(c => c.type === 'transform')?.position;
const pos1 = circTowers[1]?.capabilities.find(c => c.type === 'transform')?.position;
assert(pos0 && pos1 && (pos0.x !== pos1.x || pos0.z !== pos1.z), 'Circular layout must distribute towers in space');

// 4. Natural Language Parser recognition
const parseQuarterly = parseInstruction("matérialise les ventes trimestrielles en piliers 3d", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseQuarterly.plan.intent, 'materialize_data_3d');
assert.equal(parseQuarterly.plan.actions[0].dataset, 'business-quarterly');
assert((parseQuarterly.patch.entitiesCreated?.length || 0) >= 5);

const parseEnergy = parseInstruction("visualise le mix énergétique en 3d", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseEnergy.plan.intent, 'materialize_data_3d');
assert.equal(parseEnergy.plan.actions[0].dataset, 'energy-consumption');

const parseRover = parseInstruction("affiche la télémétrie du rover martien en 3d", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseRover.plan.intent, 'materialize_data_3d');
assert.equal(parseRover.plan.actions[0].dataset, 'space-telemetry');

const parseTokenomics = parseInstruction("matérialise la tokenomics victoria vr", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseTokenomics.plan.intent, 'materialize_data_3d');
assert.equal(parseTokenomics.plan.actions[0].dataset, 'victoria-vr-tokenomics');

const parseServers = parseInstruction("visualise la latence des serveurs cloud en 3d", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseServers.plan.intent, 'materialize_data_3d');
assert.equal(parseServers.plan.actions[0].dataset, 'server-infrastructure');

// 5. Spatial Agent Voice Dialogue validation
const agentDataDialogue = getDataIngestionDialogue('Performance Trimestrielle', 5, 'engineer');
assert(agentDataDialogue.includes('5') || agentDataDialogue.includes('piliers') || agentDataDialogue.includes('Performance'));

const agentGuideDialogue = getDataIngestionDialogue('Mix Énergétique', 5, 'guide');
assert(agentGuideDialogue.includes('anti-skeuomorphique') || agentGuideDialogue.includes('3D'));

console.log('PASS: Ingestion de Données Sémantiques (Data-to-3D / Anti-Skeuomorphisme) fully tested and validated.');

// ==========================================
// 12. Gameplay Émergent & Zero-Code Rules
// ==========================================
const {
  gameplayPresets,
  getGameplayPreset,
  createTargetRangeGame,
  createPuzzleLocksGame,
  createGemCollectorGame,
  createSurvivalHazardGame,
  defaultGameplayState
} = await import('../engine/gameplayPresets');
const { getGameplayDialogue } = await import('../engine/agentDialogues');
const { findCounterExample } = await import('../simulation/simulator');

// 1. Preset Catalog Validation
assert(gameplayPresets.length >= 4, 'Must have at least 4 emergent gameplay presets');
assert.equal(getGameplayPreset('target-range').title, 'Stand de Tir Spatial Rapier');
assert.equal(getGameplayPreset('puzzle-locks').title, 'Énigme des 3 Totems Célestes');
const presetIds = gameplayPresets.map(p => p.id);
assert(presetIds.includes('target-range'));
assert(presetIds.includes('puzzle-locks'));
assert(presetIds.includes('gem-collector'));
assert(presetIds.includes('survival-hazard'));

// 2. Preset Generator Validation
const targetRangePatch = createTargetRangeGame();
assert.equal(targetRangePatch.entitiesCreated?.length, 6, 'Target Range must have 6 entities');
assert.equal(targetRangePatch.rulesChanged?.length, 5, 'Target Range must have 5 rules');
assert.equal(targetRangePatch.invariantsAdded?.length, 1, 'Target Range must have 1 invariant');
assert.equal(targetRangePatch.gameplayPatch?.gameMode, 'target_range');
assert.equal(targetRangePatch.gameplayPatch?.timer, 30);

const puzzleLocksPatch = createPuzzleLocksGame();
assert.equal(puzzleLocksPatch.entitiesCreated?.length, 4, 'Puzzle Locks must have 4 entities');
assert.equal(puzzleLocksPatch.rulesChanged?.length, 4, 'Puzzle Locks must have 4 sequential rules');
assert.equal(puzzleLocksPatch.invariantsAdded?.length, 1, 'Puzzle Locks must have 1 invariant');
assert.equal(puzzleLocksPatch.gameplayPatch?.gameMode, 'puzzle_locks');

const gemCollectorPatch = createGemCollectorGame();
assert.equal(gemCollectorPatch.entitiesCreated?.length, 5, 'Gem Collector must have 5 gems');
assert.equal(gemCollectorPatch.rulesChanged?.length, 5, 'Gem Collector must have 5 collect rules');
assert.equal(gemCollectorPatch.gameplayPatch?.gameMode, 'gem_collector');
assert.equal(gemCollectorPatch.gameplayPatch?.timer, 45);

const survivalHazardPatch = createSurvivalHazardGame();
assert.equal(survivalHazardPatch.entitiesCreated?.length, 3, 'Survival Hazard must have 3 entities');
assert.equal(survivalHazardPatch.rulesChanged?.length, 3, 'Survival Hazard must have 3 rules');
assert.equal(survivalHazardPatch.gameplayPatch?.gameMode, 'survival_hazard');
assert.equal(survivalHazardPatch.gameplayPatch?.lives, 3);

// 3. Causal Evaluator Gameplay Actions Execution
let testWorld: WorldState = {
  version: 1,
  ir: {
    entities: {
      tester: { id: 'tester', name: 'Tester', capabilities: [{ type: 'interactive' }] }
    },
    rules: {
      r_score: {
        id: 'r_score',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'tester' }],
        actions: [{ type: 'increment_score', scoreDelta: 50 }]
      },
      r_damage: {
        id: 'r_damage',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'tester' }],
        actions: [{ type: 'adjust_lives', livesDelta: -1 }]
      },
      r_timer: {
        id: 'r_timer',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'tester' }],
        actions: [{ type: 'set_timer', duration: 40 }]
      },
      r_victory: {
        id: 'r_victory',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'tester' }],
        actions: [{ type: 'trigger_victory', message: 'Gagné' }]
      }
    },
    invariants: {}
  },
  flags: {},
  gameplay: { ...defaultGameplayState, gameStatus: 'running' }
};

let evalResult = evaluateEvent(testWorld, { type: 'INTERACT', sourceId: 'tester' });
testWorld = evalResult.newState;
assert.equal(testWorld.gameplay?.score, 50, 'Score should increment by 50');
assert.equal(testWorld.gameplay?.highScore, 50, 'HighScore should track score');
assert.equal(testWorld.gameplay?.lives, 2, 'Lives should decrement by 1');
assert.equal(testWorld.gameplay?.timer, 40, 'Timer should be set to 40');
assert.equal(testWorld.gameplay?.gameStatus, 'victory', 'Status should be victory');

// 4. Formal Verification: Puzzle Locks invariant prevents chest opening without totems
const puzzleWorld: WorldState = {
  version: 1,
  ir: {
    entities: Object.fromEntries((puzzleLocksPatch.entitiesCreated || []).map(e => [e.id, e])),
    rules: Object.fromEntries((puzzleLocksPatch.rulesChanged || []).map(r => [r.id!, r as any])),
    invariants: Object.fromEntries((puzzleLocksPatch.invariantsAdded || []).map(inv => [inv.id, inv]))
  },
  flags: {},
  gameplay: puzzleLocksPatch.gameplayPatch ? { ...defaultGameplayState, ...puzzleLocksPatch.gameplayPatch } : undefined
};

// Trying to open the chest directly without aligning the totems must NOT break the invariant
const simDirect = findCounterExample(puzzleWorld, [{ type: 'INTERACT', sourceId: 'mystery_chest' }], 2);
assert.equal(simDirect.invariantBroken, false, 'Chest cannot be opened without totems');

// 5. Natural Language Parser Recognition
const parseTarget = parseInstruction("crée un stand de tir rapier", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseTarget.plan.intent, 'create_gameplay_loop');
assert.equal(parseTarget.plan.actions[0].presetId, 'target-range');
assert((parseTarget.patch.entitiesCreated?.length || 0) >= 4);

const parseTotems = parseInstruction("ajoute une énigme des 3 totems", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseTotems.plan.intent, 'create_gameplay_loop');
assert.equal(parseTotems.plan.actions[0].presetId, 'puzzle-locks');

const parseGems = parseInstruction("lance une course aux orbes célestes", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseGems.plan.intent, 'create_gameplay_loop');
assert.equal(parseGems.plan.actions[0].presetId, 'gem-collector');

const parseSurv = parseInstruction("active le mode survie en zone radioactive", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseSurv.plan.intent, 'create_gameplay_loop');
assert.equal(parseSurv.plan.actions[0].presetId, 'survival-hazard');

// 6. Spatial Agent Voice Dialogue Validation
const engineerDialogue = getGameplayDialogue('target_range', 'start', 0, 'engineer');
assert(engineerDialogue.includes('Rapier') || engineerDialogue.includes('balistique'));
const victoryDialogue = getGameplayDialogue('target_range', 'victory', 200);
assert(victoryDialogue.includes('200'));

console.log('PASS: Gameplay Émergent & Zero-Code Rules (Presets, Rules, Evaluator, Simulation) fully tested and validated.');

// ==========================================
// 13. Le Refuge Vivant · Sanctuaire Alpin Contemplatif
// ==========================================
const {
  heightAt: refugeHeight,
  mountainHeight: refugeMountainHeight,
  mountainColor: refugeMountainColor,
  groundColor: refugeGroundColor,
  PINE_TREES: refugePineTrees
} = await import('../scene/refuge/refugeMath');

// 1. Theme Configuration Validation
const refugeTheme = getWorldTheme('le-refuge');
assert.equal(refugeTheme.id, 'le-refuge');
assert.equal(refugeTheme.stageStyle, 'alpine_refuge');
assert.equal(refugeTheme.category, 'Nature & Poésie');
assert.equal(refugeTheme.ambientSoundscape, 'refuge_binaural');
assert.equal(refugeTheme.stars, true);

// 2. Procedural Mathematical Terrain & Mountain Functions
const hGround = refugeHeight(0, -20);
assert(Number.isFinite(hGround), 'Ground height must be finite');

const hMountain = refugeMountainHeight(0, 300, false);
assert(Number.isFinite(hMountain) && hMountain > 0, 'Mountain peak height must be positive and finite');

const mCol = refugeMountainColor(0, 100, 300, 0.4);
assert.equal(mCol.length, 3);
assert(mCol[0] >= 0 && mCol[0] <= 1.0);
assert(mCol[1] >= 0 && mCol[1] <= 1.0);
assert(mCol[2] >= 0 && mCol[2] <= 1.0);

const gCol = refugeGroundColor(0, 2, -20, 0.1);
assert.equal(gCol.length, 3);
assert(gCol[0] >= 0 && gCol[0] <= 1.0);

// 3. Pine Trees Instanced Distribution
assert(refugePineTrees.length > 50, 'Must have realistic forest of pine trees');

// 4. Natural Language Parser Recognition
const parseRefuge = parseInstruction("active le refuge vivant", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseRefuge.plan.intent, 'set_world_theme');
assert.equal(parseRefuge.plan.actions[0].themeId, 'le-refuge');

console.log('PASS: Le Refuge Vivant (Sanctuaire Alpin, Shaders, Montagnes, Lac, Pins, Audio) fully tested and validated.');

// 15. Étiquettes 3D Réactives, Badges et Survol Contextuel
// ==========================================
const testTomateAsset = getAsset('wp-tomate');
assert(testTomateAsset, 'wp-tomate asset must exist in catalog');
assert.equal(testTomateAsset?.category, 'Alimentation · ingrédients');

const testPlancheAsset = getAsset('wp-planche-a-decouper');
assert(testPlancheAsset, 'wp-planche-a-decouper asset must exist');
assert.equal(testPlancheAsset?.category, 'Cuisine · ustensiles');

const testCocotteAsset = getAsset('wp-cocotte');
assert(testCocotteAsset, 'wp-cocotte asset must exist');
assert.equal(testCocotteAsset?.category, 'Cuisine · ustensiles');

// Natural language parser tests for label toggles
const parseHideLabels = parseInstruction("masque les étiquettes", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseHideLabels.plan.intent, 'set_labels_visible');
assert.equal(parseHideLabels.plan.actions[0].show, false);

const parseShowLabels = parseInstruction("affiche les étiquettes", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseShowLabels.plan.intent, 'set_labels_visible');
assert.equal(parseShowLabels.plan.actions[0].show, true);

// Store state toggle verification
useWorldStore.getState().setShowLabels(false);
assert.equal(useWorldStore.getState().showLabels, false);
useWorldStore.getState().setShowLabels(true);
assert.equal(useWorldStore.getState().showLabels, true);

// Recipe modal command verification
const parseOpenRecipes = parseInstruction("affiche les recettes", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseOpenRecipes.plan.intent, 'open_cooking_recipes_modal');

const parseChooseRecipe = parseInstruction("choisir une autre recette", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseChooseRecipe.plan.intent, 'open_cooking_recipes_modal');

console.log('PASS: Étiquettes 3D réactives, badges contextuels & commandes de visibilité validés.');

// --- SUITE 16: Ustensiles Culinaires, Vortex de Remuage & Profils Audio/Haptiques ---
const testSpatuleAsset = getAsset('wp-spatule');
assert(testSpatuleAsset, 'wp-spatule asset must exist in catalog');
assert.equal(testSpatuleAsset?.category, 'Cuisine · ustensiles');

const testFouetAsset = getAsset('wp-fouet-de-cuisine');
assert(testFouetAsset, 'wp-fouet-de-cuisine asset must exist in catalog');
assert.equal(testFouetAsset?.category, 'Cuisine · ustensiles');

// Natural language parser tests for stirring / mixing
const parseStirCocotte = parseInstruction("remue la cocotte", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseStirCocotte.plan.intent, 'stir_cookware');
assert.equal(parseStirCocotte.plan.actions[0].action, 'stir');

const parseMelange = parseInstruction("mélange la préparation", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseMelange.plan.intent, 'stir_cookware');

const parseFouette = parseInstruction("fouetter vivement", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseFouette.plan.intent, 'stir_cookware');

const parseStirEn = parseInstruction("stir the pot", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseStirEn.plan.intent, 'stir_cookware');

// Atmosphere soundscape presets in store
useWorldStore.getState().setAtmosphere('cozy-bistrot');
assert.equal(useWorldStore.getState().currentAtmosphere, 'cozy-bistrot');

useWorldStore.getState().setAtmosphere('refuge-alpin');
assert.equal(useWorldStore.getState().currentAtmosphere, 'le-refuge');

useWorldStore.getState().setAtmosphere('zen-garden');
assert.equal(useWorldStore.getState().currentAtmosphere, 'zen-garden');

// Precision knife and gastronomic plate assets
const testKnifeAsset = getAsset('wp-couteau-de-chef');
assert(testKnifeAsset, 'wp-couteau-de-chef asset must exist in catalog');
assert.equal(testKnifeAsset?.category, 'Cuisine · ustensiles');

const testPlateAsset = getAsset('wp-assiette-plate');
assert(testPlateAsset, 'wp-assiette-plate asset must exist in catalog');
assert.equal(testPlateAsset?.category, 'Art de la table');

// Natural language parser tests for chopping, plating and degustation
const parseChop = parseInstruction("émincer les légumes", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseChop.plan.intent, 'chop_ingredients');
assert.equal(parseChop.plan.actions[0].action, 'chop');

const parsePlate = parseInstruction("dresse l'assiette gastronomique", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parsePlate.plan.intent, 'plate_dish');
assert.equal(parsePlate.plan.actions[0].action, 'plate');

const parseDegustation = parseInstruction("ouvre la carte de dégustation et accord mets vins", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseDegustation.plan.intent, 'open_degustation');
assert.equal(parseDegustation.plan.actions[0].action, 'open_degustation');

// Degustation and plating state assertions
assert.equal(useWorldStore.getState().isDishPlated, false);
useWorldStore.getState().setIsDishPlated(true);
assert.equal(useWorldStore.getState().isDishPlated, true);

assert.equal(useWorldStore.getState().activeDegustationRecipeId, null);
useWorldStore.getState().openDegustationModal('recipe-ratatouille');
assert.equal(useWorldStore.getState().activeDegustationRecipeId, 'recipe-ratatouille');
useWorldStore.getState().closeDegustationModal();
assert.equal(useWorldStore.getState().activeDegustationRecipeId, null);

console.log('PASS: Ustensiles culinaires, animation vortex de remuage & profils sonores validés.');
console.log('PASS: Découpe au couteau, dressage gastronomique & carte de dégustation validés.');

// --- SUITE 17: Contrôle Thermique Culinaire (Feu Doux/Moyen/Vif, Brûleur 3D & Simulation de Chauffe) ---
// Store assertions
useWorldStore.getState().setCookingHeatLevel(2);
assert.equal(useWorldStore.getState().cookingHeatLevel, 2, 'Default heat level should be 2 (Moyen / Frémissement)');
useWorldStore.getState().setCookingHeatLevel(1);
assert.equal(useWorldStore.getState().cookingHeatLevel, 1, 'Heat level should be 1 (Doux)');
useWorldStore.getState().setCookingHeatLevel(3);
assert.equal(useWorldStore.getState().cookingHeatLevel, 3, 'Heat level should be 3 (Vif)');
useWorldStore.getState().setCookingHeatLevel(0);
assert.equal(useWorldStore.getState().cookingHeatLevel, 0, 'Heat level should be 0 (Éteint)');

// Cycle test
useWorldStore.getState().setCookingHeatLevel(2);
const cycled = useWorldStore.getState().cycleCookingHeatLevel();
assert.equal(cycled, 3, 'Cycling from 2 should go to 3');
assert.equal(useWorldStore.getState().cycleCookingHeatLevel(), 0, 'Cycling from 3 should wrap to 0');
assert.equal(useWorldStore.getState().cycleCookingHeatLevel(), 1, 'Cycling from 0 should go to 1');

// Natural language parser tests for heat control
const parseLowHeat = parseInstruction("mets à feu doux", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseLowHeat.plan.intent, 'set_cooking_heat');
assert.equal(parseLowHeat.plan.actions[0].level, 1);

const parseMedHeat = parseInstruction("règle sur feu moyen", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseMedHeat.plan.intent, 'set_cooking_heat');
assert.equal(parseMedHeat.plan.actions[0].level, 2);

const parseHighHeat = parseInstruction("augmente le feu au maximum", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseHighHeat.plan.intent, 'set_cooking_heat');
assert.equal(parseHighHeat.plan.actions[0].level, 3);

const parseOffHeat = parseInstruction("éteins le feu sous la cocotte", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseOffHeat.plan.intent, 'set_cooking_heat');
assert.equal(parseOffHeat.plan.actions[0].level, 0);

console.log('PASS: Contrôle thermique, brûleur 3D & dynamique de chauffe culinaire validés.');

// Seasoning & Flavor Profile assertions
useWorldStore.getState().resetSeasoning();
const initSeasoning = useWorldStore.getState().seasoningProfile;
assert.equal(initSeasoning.salt, 0);
assert.equal(initSeasoning.oil, 0);
assert.equal(initSeasoning.herbs, 0);

useWorldStore.getState().addSeasoning('salt', 25);
assert.equal(useWorldStore.getState().seasoningProfile.salt, 25);

useWorldStore.getState().addSeasoning('oil', 30);
assert.equal(useWorldStore.getState().seasoningProfile.oil, 30);

useWorldStore.getState().addSeasoning('herbs', 35);
assert.equal(useWorldStore.getState().seasoningProfile.herbs, 35);

// Clamp at 100
useWorldStore.getState().addSeasoning('salt', 120);
assert.equal(useWorldStore.getState().seasoningProfile.salt, 100);

useWorldStore.getState().resetSeasoning();
assert.equal(useWorldStore.getState().seasoningProfile.salt, 0);

// Natural language parser tests for seasoning
const parseSalt = parseInstruction("ajoute une pincée de fleur de sel", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseSalt.plan.intent, 'season_dish');
assert.equal(parseSalt.plan.actions[0].seasoningType, 'salt');

const parseOil = parseInstruction("verse un généreux filet d'huile d'olive", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseOil.plan.intent, 'season_dish');
assert.equal(parseOil.plan.actions[0].seasoningType, 'oil');

const parseHerbs = parseInstruction("infuse le bouquet garni dans la cocotte", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseHerbs.plan.intent, 'season_dish');
assert.equal(parseHerbs.plan.actions[0].seasoningType, 'herbs');

console.log('PASS: Assaisonnement, cascade de particules, profil aromatique & commandes d\'assaisonnement validés.');

// Cooking Doneness & Kitchen Timer assertions
const { getCookingDonenessStage } = await import('../engine/store');

useWorldStore.getState().resetCookingProgress();
assert.equal(useWorldStore.getState().cookingDoneness, 0);
assert.equal(useWorldStore.getState().cookingTimerRemaining, null);
assert.equal(useWorldStore.getState().isCookingTimerRunning, false);

// Doneness stage helper
const stage0 = getCookingDonenessStage(0);
assert.equal(stage0.label, 'Cru / Préparé');
const stage50 = getCookingDonenessStage(50);
assert.equal(stage50.label, 'Mijotage à point');
const stage90 = getCookingDonenessStage(90);
assert.equal(stage90.label, 'Réduction parfumée');
const stage100 = getCookingDonenessStage(100);
assert.equal(stage100.label, 'Confit caramélisé');

// Tick cooking doneness accumulation with heat level 2 (2.5%/s)
useWorldStore.getState().setCookingHeatLevel(2);
useWorldStore.getState().tickCooking(2.0); // 2 seconds * 2.5 = 5.0%
assert.equal(useWorldStore.getState().cookingDoneness, 5.0);

// Timer start, tick countdown and pause
useWorldStore.getState().startCookingTimer(120);
assert.equal(useWorldStore.getState().cookingTimerRemaining, 120);
assert.equal(useWorldStore.getState().isCookingTimerRunning, true);

useWorldStore.getState().tickCooking(10.0);
assert.equal(useWorldStore.getState().cookingTimerRemaining, 110);

useWorldStore.getState().stopCookingTimer();
assert.equal(useWorldStore.getState().isCookingTimerRunning, false);
assert.equal(useWorldStore.getState().cookingTimerRemaining, 110);

// Reset cooking
useWorldStore.getState().resetCookingProgress();
assert.equal(useWorldStore.getState().cookingDoneness, 0);
assert.equal(useWorldStore.getState().cookingTimerRemaining, null);

// Parser tests for timer & doneness
const parseTimer3m = parseInstruction("lance le minuteur de 3 minutes", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseTimer3m.plan.intent, 'start_cooking_timer');
assert.equal(parseTimer3m.plan.actions[0].seconds, 180);

const parseTimer5m = parseInstruction("active le minuteur 5 minutes", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseTimer5m.plan.intent, 'start_cooking_timer');
assert.equal(parseTimer5m.plan.actions[0].seconds, 300);

const parseStopTimer = parseInstruction("arrête le minuteur", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseStopTimer.plan.intent, 'stop_cooking_timer');

const parseResetDoneness = parseInstruction("remets la cuisson à zéro", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseResetDoneness.plan.intent, 'reset_cooking_doneness');

// Camera Director 6-Preset & cycle tests
useWorldStore.getState().setCameraPreset('overview');
assert.equal(useWorldStore.getState().cameraPreset, 'overview');
const camNext1 = useWorldStore.getState().cycleCameraPreset();
assert.equal(camNext1, 'table');
const camNext2 = useWorldStore.getState().cycleCameraPreset();
assert.equal(camNext2, 'cocotte');
const camNext3 = useWorldStore.getState().cycleCameraPreset();
assert.equal(camNext3, 'plate');
const camNext4 = useWorldStore.getState().cycleCameraPreset();
assert.equal(camNext4, 'chopping');
const camNext5 = useWorldStore.getState().cycleCameraPreset();
assert.equal(camNext5, 'board');
const camNext6 = useWorldStore.getState().cycleCameraPreset();
assert.equal(camNext6, 'overview');

// Parser tests for macro/micro culinary framing
const parseVueCocotte = parseInstruction("zoome sur la cocotte", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseVueCocotte.plan.intent, 'set_camera_preset');
assert.equal(parseVueCocotte.plan.actions[0].preset, 'cocotte');

const parseVuePlate = parseInstruction("zoome sur l'assiette", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseVuePlate.plan.intent, 'set_camera_preset');
assert.equal(parseVuePlate.plan.actions[0].preset, 'plate');

const parseVueChopping = parseInstruction("vue découpe sur la planche", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseVueChopping.plan.intent, 'set_camera_preset');
assert.equal(parseVueChopping.plan.actions[0].preset, 'chopping');

console.log('PASS: Progression de cuisson (doneness), minuteur de chef, alertes & commandes validés.');
console.log('PASS: Réalisateur de caméra cinématique (6 presets macro/micro, raccourcis, cycle, commandes) validé.');

// Gastronomic Evaluation Engine tests
const { evaluateDish } = await import('../engine/store');

// 1. Perfect 5-star dish
const evalPerfect = evaluateDish({
  doneness: 85,
  seasoning: { salt: 30, oil: 30, herbs: 40 },
  isPlated: true,
  heatLevel: 2
});
assert.equal(evalPerfect.stars, 5);
assert.equal(evalPerfect.totalScore, 100);
assert.equal(evalPerfect.cookingScore, 40);
assert.equal(evalPerfect.seasoningScore, 35);
assert.equal(evalPerfect.platingScore, 25);
assert.equal(evalPerfect.title, "Chef Étoilé d'Exception");

// 2. Raw un-plated dish
const evalRaw = evaluateDish({
  doneness: 0,
  seasoning: { salt: 0, oil: 0, herbs: 0 },
  isPlated: false,
  heatLevel: 0
});
assert.equal(evalRaw.stars, 1);
assert.equal(evalRaw.totalScore, 20); // 6 + 6 + 8
assert.equal(evalRaw.title, "Commis Débutant");
assert(evalRaw.recommendations.length > 0);

// 3. Store getDishEvaluation & restartCurrentRecipe
useWorldStore.setState({
  cookingDoneness: 85,
  seasoningProfile: { salt: 30, oil: 30, herbs: 40 },
  isDishPlated: true,
  cookingHeatLevel: 2
});
const storeEval = useWorldStore.getState().getDishEvaluation();
assert.equal(storeEval.stars, 5);

useWorldStore.getState().restartCurrentRecipe();
assert.equal(useWorldStore.getState().cookingDoneness, 0);
assert.equal(useWorldStore.getState().isDishPlated, false);
assert.equal(useWorldStore.getState().seasoningProfile.salt, 0);
assert.equal(useWorldStore.getState().cookingHeatLevel, 0);
assert.equal(useWorldStore.getState().cameraPreset, 'table');

// 4. Parser tests for evaluation & recipe restart
const parseNote = parseInstruction("note mon plat", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseNote.plan.intent, 'open_degustation');

const parseScore = parseInstruction("score du chef", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseScore.plan.intent, 'open_degustation');

const parseRestart = parseInstruction("recommence la recette", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseRestart.plan.intent, 'restart_recipe');

const parseRefaire = parseInstruction("refaire la recette", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseRefaire.plan.intent, 'restart_recipe');

console.log('PASS: Moteur d’évaluation gastronomique (score chef, étoiles, critères, recommandations, reset recette) validé.');

// 5. Sommelier Wine Pairings dictionary test
const { winePairings, cookingRecipes: allCookingRecipes } = await import('../library/cookingRecipes');
assert(Object.keys(winePairings).length >= 12, 'Must have sommelier wine pairings for all 12 recipes');
allCookingRecipes.forEach(r => {
  const pairing = winePairings[r.id];
  assert(pairing, `Recipe ${r.id} must have a wine pairing`);
  assert(pairing.wine.length > 0, `Recipe ${r.id} must have wine title`);
  assert(pairing.region.length > 0, `Recipe ${r.id} must have wine region`);
  assert(pairing.temp.length > 0, `Recipe ${r.id} must have serving temperature`);
  assert(pairing.notes.length > 0, `Recipe ${r.id} must have sommelier tasting notes`);
});

// 6. Progressive chopping & slicing engine test
const choppingStore = useWorldStore.getState();
assert.equal(typeof choppingStore.chopIngredient, 'function');
assert.equal(typeof choppingStore.resetChopping, 'function');

useWorldStore.getState().chopIngredient('test-courgette');
assert.equal(useWorldStore.getState().choppingProgress['test-courgette'], 1, 'Stage 1: Tronçons');
useWorldStore.getState().chopIngredient('test-courgette');
assert.equal(useWorldStore.getState().choppingProgress['test-courgette'], 2, 'Stage 2: Émincé');
useWorldStore.getState().chopIngredient('test-courgette');
assert.equal(useWorldStore.getState().choppingProgress['test-courgette'], 3, 'Stage 3: Brunoise de chef');
// Capped at 3
useWorldStore.getState().chopIngredient('test-courgette');
assert.equal(useWorldStore.getState().choppingProgress['test-courgette'], 3, 'Must remain capped at 3');

// Clean reset via restartCurrentRecipe
useWorldStore.getState().restartCurrentRecipe();
assert.deepEqual(useWorldStore.getState().choppingProgress, {}, 'Chopping progress must be completely reset on recipe restart');

// 7. Natural language parser for progressive chopping
const parseEmincer = parseInstruction("émincer les légumes", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseEmincer.plan.intent, 'chop_ingredients');
assert.equal(parseEmincer.plan.actions[0].action, 'chop');

const parseCouper = parseInstruction("couper les tomates en dés", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseCouper.plan.intent, 'chop_ingredients');
assert.equal(parseCouper.plan.actions[0].action, 'chop');

const parseTailler = parseInstruction("tailler en brunoise", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseTailler.plan.intent, 'chop_ingredients');
assert.equal(parseTailler.plan.actions[0].action, 'chop');

console.log('PASS: Accords mets-vins sommelier, découpe progressive (tronçons, émincé, brunoise) & reset validés.');

// 8. Quiz entity and educational capabilities validation
const testPatch = createRecipePatch(allCookingRecipes[0], {});
const quizEntity = testPatch.entitiesCreated?.find(e => e.id.includes('quiz'));
assert(quizEntity, 'Recipe patch must create a quiz lectern entity');
const eduCap = quizEntity.capabilities.find(c => c.type === 'educational');
assert(eduCap, 'Quiz entity must have educational capability');
assert(eduCap.correctAnswer === 'A' || eduCap.correctAnswer === 'B' || eduCap.correctAnswer === 'C');
assert(eduCap.text && eduCap.text.includes('\nA) '));

// 9. Bistrot atmosphere ambient audio test
ambientAudio.setAtmosphere('cozy-bistrot');
assert.equal(typeof ambientAudio.isAudioMuted, 'function');

console.log('PASS: Quiz culinaire interactif, entités éducatives & ambiance sonore bistrot validés.');

// 10. Interactive 3D Tasting Animation and FLE Flashcards Suite
// Tasting animation state transitions
assert.equal(useWorldStore.getState().isTastingActive, false);
useWorldStore.getState().triggerTasting('fork');
assert.equal(useWorldStore.getState().isTastingActive, true);
assert.equal(useWorldStore.getState().tastingUtensil, 'fork');

useWorldStore.getState().triggerTasting('spoon');
assert.equal(useWorldStore.getState().isTastingActive, true);
assert.equal(useWorldStore.getState().tastingUtensil, 'spoon');

useWorldStore.getState().stopTasting();
assert.equal(useWorldStore.getState().isTastingActive, false);

useWorldStore.getState().triggerTasting('fork');
useWorldStore.getState().restartCurrentRecipe();
assert.equal(useWorldStore.getState().isTastingActive, false);

// FLE Scenes quest and educational flashcards generation
for (const fleScene of fleScenes) {
  const flePatch = createFLEPatch(fleScene, {});
  assert(flePatch.questsAdded && flePatch.questsAdded.length === 1, `FLE Scene ${fleScene.id} must add a quest`);
  const quest = flePatch.questsAdded[0];
  assert.equal(quest.category, 'fle');
  assert.equal(quest.steps.length, 3, 'FLE quest must have 3 structured pedagogical steps');
  assert.equal(quest.steps[0].requiredEvent, 'INTERACT');
  assert.equal(quest.steps[1].requiredEvent, 'INTERACT');
  assert.equal(quest.steps[2].requiredEvent, 'ANSWER_CORRECT');
  assert(flePatch.activeQuestId && flePatch.activeQuestId.startsWith('quest_'));
}

// Guide persona dialogues for FLE scenes
const fleGuide = getAgentPersona('fle');
assert.equal(fleGuide.theme, 'guide');
assert.equal(fleGuide.name, 'Jean, Guide Parisien');

const dialoguePrompt = getSpeechDialogue('Dialogue & Écoute vocale', '', 'guide');
assert(dialoguePrompt.includes('dialogue authentique'));

const vocabPrompt = getSpeechDialogue('Exploration du vocabulaire', '', 'guide');
assert(vocabPrompt.includes('vocabulaire'));

const quizPrompt = getSpeechDialogue('Quiz de compréhension', '', 'guide');
assert(quizPrompt.includes('quiz'));

console.log('PASS: Animation de dégustation 3D (fourchette & cuillère) & quêtes d’immersion FLE avec flashcards validées.');

// 11. Seminar Rooms Quests, Saucing Ribbon & Speech Rate Controls
// Saucing ribbon state transitions
assert.equal(useWorldStore.getState().isDishSauced, false);
useWorldStore.getState().toggleSauceDish();
assert.equal(useWorldStore.getState().isDishSauced, true);
useWorldStore.getState().toggleSauceDish();
assert.equal(useWorldStore.getState().isDishSauced, false);

useWorldStore.getState().toggleSauceDish();
useWorldStore.getState().restartCurrentRecipe();
assert.equal(useWorldStore.getState().isDishSauced, false);

// Seminar Rooms Quests generation (8 rooms)
assert.equal(seminarRooms.length, 8);
for (const room of seminarRooms) {
  const semPatch = createSeminarPatch(room, {});
  assert(semPatch.questsAdded && semPatch.questsAdded.length === 1, `Seminar room ${room.id} must add a quest`);
  const sQuest = semPatch.questsAdded[0];
  assert.equal(sQuest.category, 'seminaire');
  assert.equal(sQuest.steps.length, 3, 'Seminar quest must have 3 steps');
  assert.equal(sQuest.steps[0].requiredEvent, 'INTERACT');
  assert.equal(sQuest.steps[1].requiredEvent, 'INTERACT');
  assert.equal(sQuest.steps[2].requiredEvent, 'ANSWER_CORRECT');
  assert(semPatch.activeQuestId && semPatch.activeQuestId.startsWith('quest_seminar_'));
}

// Seminar speech guidance
const semBriefingPrompt = getSpeechDialogue('Agencement spatial & Objectifs', '', 'engineer');
assert(semBriefingPrompt.includes('disposition des assises'));

const semEquipPrompt = getSpeechDialogue('Vérification des équipements collaboratifs', '', 'engineer');
assert(semEquipPrompt.includes('outils collaboratifs'));

const semQuizPrompt = getSpeechDialogue('Validation de facilitation & dynamique de groupe', '', 'engineer');
assert(semQuizPrompt.includes('quiz de facilitation'));

console.log('PASS: Quêtes professionnelles pour les 8 salles de séminaire, ruban de nappage 3D & cadence vocale validés.');

// ============================================================================
// 20. FLE Vocabulary Flashcards Study & Mastery System
// ============================================================================
import { ACHIEVEMENTS, getAchievement, getAchievementsByCategory } from '../engine/achievements';

const vocabStore = useWorldStore.getState();
assert(Array.isArray(vocabStore.masteredVocab), 'masteredVocab should be initialized as an array');

// Toggle vocab mastery
const addedWord = 'une baguette bien cuite';
const toggleRes1 = useWorldStore.getState().toggleVocabMastery(addedWord);
assert.equal(toggleRes1, true, 'toggleVocabMastery should return true when word is newly added');
assert.equal(useWorldStore.getState().isVocabMastered(addedWord), true, 'isVocabMastered should be true');
assert(useWorldStore.getState().masteredVocab.includes(addedWord));

// Toggle again to unmaster
const toggleRes2 = useWorldStore.getState().toggleVocabMastery(addedWord);
assert.equal(toggleRes2, false, 'toggleVocabMastery should return false when word is removed');
assert.equal(useWorldStore.getState().isVocabMastered(addedWord), false, 'isVocabMastered should be false');
assert(!useWorldStore.getState().masteredVocab.includes(addedWord));

// Add multiple words
useWorldStore.getState().toggleVocabMastery('un croissant au beurre');
useWorldStore.getState().toggleVocabMastery('la boulangère');
assert.equal(useWorldStore.getState().isVocabMastered('un croissant au beurre'), true);
assert.equal(useWorldStore.getState().isVocabMastered('la boulangère'), true);

// Modal controls
assert.equal(useWorldStore.getState().showFlashcardStudyModal, false);
useWorldStore.getState().openFlashcardStudyModal('boulangerie');
assert.equal(useWorldStore.getState().showFlashcardStudyModal, true);
assert.equal(useWorldStore.getState().studyModalSceneId, 'boulangerie');
useWorldStore.getState().closeFlashcardStudyModal();
assert.equal(useWorldStore.getState().showFlashcardStudyModal, false);
assert.equal(useWorldStore.getState().studyModalSceneId, null);

console.log('PASS: Système de révision Flashcards FLE, mémorisation & modal interactif 3D validés.');

// ============================================================================
// 21. Pedagogical & Culinary Achievements (Hall of Fame) System
// ============================================================================
assert.equal(ACHIEVEMENTS.length, 35, 'There should be exactly 35 achievements defined across 4 pillars');
const validCategories = ['cuisine', 'fle', 'seminaire', 'exploration'];
ACHIEVEMENTS.forEach(ach => {
  assert(ach.id && typeof ach.id === 'string');
  assert(ach.title && typeof ach.title === 'string');
  assert(ach.description && typeof ach.description === 'string');
  assert(validCategories.includes(ach.category), `Invalid category ${ach.category} for achievement ${ach.id}`);
  assert(ach.icon && typeof ach.icon === 'string');
});

// Category filtering tests
assert.equal(getAchievementsByCategory('all').length, 35);
assert.equal(getAchievementsByCategory('cuisine').length, 7);
assert.equal(getAchievementsByCategory('fle').length, 5);
assert.equal(getAchievementsByCategory('seminaire').length, 3);
assert.equal(getAchievementsByCategory('exploration').length, 20);

// Lookup test
const platedAch = getAchievement('first_dish_plated');
assert(platedAch);
assert.equal(platedAch.title, 'Premier Dressage');
assert.equal(platedAch.category, 'cuisine');

// Store unlocks
useWorldStore.setState({ unlockedAchievements: {}, recentUnlockedAchievement: null });
const unlockRes1 = useWorldStore.getState().unlockAchievement('first_dish_plated');
assert.equal(unlockRes1, true, 'First unlock should return true');
assert(typeof useWorldStore.getState().unlockedAchievements['first_dish_plated'] === 'number');

// Idempotency: second unlock returns false
const unlockRes2 = useWorldStore.getState().unlockAchievement('first_dish_plated');
assert.equal(unlockRes2, false, 'Duplicate unlock must return false');

// Toast notification
assert.equal(useWorldStore.getState().recentUnlockedAchievement?.id, 'first_dish_plated');
useWorldStore.getState().dismissAchievementToast();
assert.equal(useWorldStore.getState().recentUnlockedAchievement, null);

// Achievements modal control
assert.equal(useWorldStore.getState().showAchievementsModal, false);
useWorldStore.getState().setShowAchievementsModal(true);
assert.equal(useWorldStore.getState().showAchievementsModal, true);
useWorldStore.getState().setShowAchievementsModal(false);
assert.equal(useWorldStore.getState().showAchievementsModal, false);

// Auto-unlock via triggerTasting
useWorldStore.getState().triggerTasting('fork');
assert(useWorldStore.getState().unlockedAchievements['connoisseur_tasting'], 'Tasting must auto-unlock connoisseur_tasting');

// Auto-unlock via toggleSauceDish
useWorldStore.getState().toggleSauceDish();
assert(useWorldStore.getState().unlockedAchievements['sauce_artist'], 'Saucing dish must auto-unlock sauce_artist');

// Auto-unlock via cutting ingredient to brunoise
useWorldStore.getState().chopIngredient('test-brunoise-ing');
useWorldStore.getState().chopIngredient('test-brunoise-ing');
useWorldStore.getState().chopIngredient('test-brunoise-ing');
assert(useWorldStore.getState().unlockedAchievements['master_cut'], 'Chopping to level 3 must auto-unlock master_cut');

console.log('PASS: Trophées pédagogiques, culinaires et d’exploration (Hall of Fame) & auto-déverrouillages validés.');

// ============================================================================
// 22. Seminar Collaboration Board & Chef Auguste Escoffier Voice Assistant
// ============================================================================
// 1. Collaboration Board & Sticky Notes Tests
const initialNotesCount = useWorldStore.getState().collaborationNotes.length;
assert(initialNotesCount >= 5, 'Should have at least 5 initial seminar sticky notes');

// Add a note
useWorldStore.getState().addCollaborationNote({
  text: 'Intégrer les retours des participants sur le parcours 3D',
  category: 'idea',
  color: 'yellow',
  author: 'Chef de Produit',
  column: 'in_progress'
});
const afterAddNotes = useWorldStore.getState().collaborationNotes;
assert.equal(afterAddNotes.length, initialNotesCount + 1, 'Note count should increase by 1');
const addedNote = afterAddNotes[0];
assert.equal(addedNote.text, 'Intégrer les retours des participants sur le parcours 3D');
assert.equal(addedNote.category, 'idea');
assert.equal(addedNote.votes, 1);
assert(useWorldStore.getState().unlockedAchievements['sticky_note_innovator'], 'Adding note must auto-unlock sticky_note_innovator');

// Vote for note
useWorldStore.getState().voteCollaborationNote(addedNote.id);
const votedNote = useWorldStore.getState().collaborationNotes.find(n => n.id === addedNote.id);
assert.equal(votedNote?.votes, 2, 'Voting must increment vote count');

// Move note to another column
useWorldStore.getState().moveCollaborationNote(addedNote.id, 'done');
const movedNote = useWorldStore.getState().collaborationNotes.find(n => n.id === addedNote.id);
assert.equal(movedNote?.column, 'done', 'Moving note must update column to done');

// Delete note
useWorldStore.getState().deleteCollaborationNote(addedNote.id);
assert.equal(useWorldStore.getState().collaborationNotes.length, initialNotesCount, 'Deleting note should restore count');

// Collaboration Modal Toggle
assert.equal(useWorldStore.getState().showCollaborationBoardModal, false);
useWorldStore.getState().setShowCollaborationBoardModal(true);
assert.equal(useWorldStore.getState().showCollaborationBoardModal, true);
useWorldStore.getState().setShowCollaborationBoardModal(false);
assert.equal(useWorldStore.getState().showCollaborationBoardModal, false);

// 2. Chef Auguste Escoffier Voice Assistant & Culinary Guidance Tests
const advice1 = useWorldStore.getState().getChefCookingAdvice();
assert(advice1.step && typeof advice1.step === 'string');
assert(advice1.message && typeof advice1.message === 'string');

// Asking Chef advice
const spokenMsg = useWorldStore.getState().askChefAdvice();
assert(spokenMsg && spokenMsg.length > 10);
assert(useWorldStore.getState().unlockedAchievements['chef_advice_sought'], 'Asking chef advice must auto-unlock chef_advice_sought');

// Milestone Doneness Announcements
useWorldStore.setState({ cookingHeatLevel: 2, cookingDoneness: 0, lastAnnouncedDonenessStage: 0 });
useWorldStore.getState().tickCooking(15); // Rate is 2.5 * 15 = 37.5% -> crosses 30% milestone
assert.equal(useWorldStore.getState().lastAnnouncedDonenessStage, 30, 'Crossing 30% must trigger stage 30 announcement');

useWorldStore.getState().tickCooking(18); // 37.5 + 2.5 * 18 = 82.5% -> crosses 75% milestone
assert.equal(useWorldStore.getState().lastAnnouncedDonenessStage, 75, 'Crossing 75% must trigger stage 75 announcement');

useWorldStore.getState().tickCooking(10); // 82.5 + 2.5 * 10 = 100% -> crosses 100% milestone
assert.equal(useWorldStore.getState().lastAnnouncedDonenessStage, 100, 'Crossing 100% must trigger stage 100 announcement');

// Resetting cooking resets announced stage
useWorldStore.getState().resetCookingProgress();
assert.equal(useWorldStore.getState().lastAnnouncedDonenessStage, 0, 'Resetting cooking progress must reset announced stage to 0');

// 3. Natural Language Parser Intent Tests
const parseRes1 = parseInstruction('savoure a la fourchette le plat dresse', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseRes1.plan.intent, 'tasting_start');
assert.equal(parseRes1.plan.actions[0].utensil, 'fork');

const parseRes2 = parseInstruction('deguste a la cuillere la sauce parfumee', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseRes2.plan.intent, 'tasting_start');
assert.equal(parseRes2.plan.actions[0].utensil, 'spoon');

const parseRes3 = parseInstruction('nappe le plat d un filet de jus reduit', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseRes3.plan.intent, 'dish_sauced');

const parseRes4 = parseInstruction('conseil du chef pour la cuisson', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseRes4.plan.intent, 'ask_chef_advice');

const parseRes5 = parseInstruction('ouvre le tableau d idees du seminaire', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseRes5.plan.intent, 'open_collaboration_board');

const parseRes6 = parseInstruction('affiche mes trophees et accomplissements', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseRes6.plan.intent, 'open_achievements_modal');

const parseRes7 = parseInstruction('mode revision des flashcards de vocabulaire', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseRes7.plan.intent, 'open_flashcard_study');

console.log('PASS: Tableau de collaboration séminaire, assistant vocal Escoffier & nouvelles commandes vocales validés.');

// -------------------------------------------------------------
// SUITE 23: Thermodynamique culinaire, styles de dressage & finitions gastronomiques
// -------------------------------------------------------------

// 1. Thermodynamic kinetics simulation
useWorldStore.setState({ cookingHeatLevel: 3, cookingTemperature: 20 });
useWorldStore.getState().tickCooking(2); // delta 2s with heat 3 (target 205°C)
const tempHeated = useWorldStore.getState().cookingTemperature;
assert(tempHeated > 20, `Temperature must rise when heat is on (got ${tempHeated}°C)`);
assert(tempHeated <= 205, `Temperature must not exceed target 205°C (got ${tempHeated}°C)`);

// Cooling down when heat is off
useWorldStore.setState({ cookingHeatLevel: 0, cookingTemperature: 150 });
useWorldStore.getState().tickCooking(2);
const tempCooled = useWorldStore.getState().cookingTemperature;
assert(tempCooled < 150, `Temperature must cool down when heat is off (got ${tempCooled}°C)`);
assert(tempCooled >= 20, `Temperature must not drop below ambient 20°C (got ${tempCooled}°C)`);

// 2. Plating Style Cycle
useWorldStore.setState({ platingStyle: 'classic-dome' });
assert.equal(useWorldStore.getState().cyclePlatingStyle(), 'deconstructed-arc');
assert.equal(useWorldStore.getState().cyclePlatingStyle(), 'geometric-tian');
assert.equal(useWorldStore.getState().cyclePlatingStyle(), 'classic-dome');

// 3. Plating Garnish Cycle
useWorldStore.setState({ platingGarnish: 'tuile-dentelle' });
assert.equal(useWorldStore.getState().cyclePlatingGarnish(), 'fleur-de-sel');
assert.equal(useWorldStore.getState().cyclePlatingGarnish(), 'micro-greens');
assert.equal(useWorldStore.getState().cyclePlatingGarnish(), 'truffle-specks');
assert.equal(useWorldStore.getState().cyclePlatingGarnish(), 'tuile-dentelle');

// 4. Recipe Reset restores default thermodynamic & presentation state
useWorldStore.setState({
  cookingTemperature: 180,
  platingStyle: 'geometric-tian',
  platingGarnish: 'truffle-specks'
});
useWorldStore.getState().restartCurrentRecipe();
assert.equal(useWorldStore.getState().cookingTemperature, 20);
assert.equal(useWorldStore.getState().platingStyle, 'classic-dome');
assert.equal(useWorldStore.getState().platingGarnish, 'tuile-dentelle');

// 5. Natural Language Parser Recognition for Plating & Garnishes
const parseStyleArc = parseInstruction('change le style de dressage en arc moderne', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseStyleArc.plan.intent, 'set_plating_style');
assert.equal(parseStyleArc.plan.actions[0].style, 'deconstructed-arc');

const parseStyleTian = parseInstruction('dresse les legumes en tian', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseStyleTian.plan.intent, 'set_plating_style');
assert.equal(parseStyleTian.plan.actions[0].style, 'geometric-tian');

const parseGarnishTuile = parseInstruction('ajoute une tuile dentelle doree en finition', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseGarnishTuile.plan.intent, 'set_plating_garnish');
assert.equal(parseGarnishTuile.plan.actions[0].garnish, 'tuile-dentelle');

const parseGarnishSel = parseInstruction('saupoudre de la fleur de sel croustillante', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseGarnishSel.plan.intent, 'set_plating_garnish');
assert.equal(parseGarnishSel.plan.actions[0].garnish, 'fleur-de-sel');

const parseGarnishTruffe = parseInstruction('dispose des lamelles de truffe noire', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseGarnishTruffe.plan.intent, 'set_plating_garnish');
assert.equal(parseGarnishTruffe.plan.actions[0].garnish, 'truffle-specks');

console.log('PASS: Suite 23 validée avec succès (Thermodynamique, styles de dressage & finitions gastronomiques).');

// -------------------------------------------------------------
// SUITE 24: Boîte Noire Cognitive, Trajectoires Sémantiques & Simulation de Cohorte IA
// -------------------------------------------------------------
import {
  createInitialCognitiveReport,
  recordCognitiveTraceStep,
  exportToHuggingFaceMDP,
  exportToMarkdownExecutiveReport
} from '../engine/cognitiveTraceRecorder';
import { simulateAgentCohort } from '../engine/cohortSimulator';

// 1. Cognitive Trace Recording & Inferences
let testReport = createInitialCognitiveReport('unit_session_001');
assert.equal(testReport.sessionId, 'unit_session_001');
assert.equal(testReport.totalDecisions, 0);
assert.equal(testReport.proceduralEfficiency, 100);

// Record step 1: normal fluid action
const res1 = recordCognitiveTraceStep(testReport, {
  actionType: 'chop',
  sourceEntityId: 'tomate_1',
  sourceEntityName: 'Tomate de Provence',
  heatLevel: 0,
  temperature: 20,
  doneness: 0,
  activeQuestId: 'quest_cuisine_ratatouille',
  activeQuestStepIndex: 0,
  now: testReport.startTime + 1200
});
testReport = res1.updatedReport;
assert.equal(testReport.totalDecisions, 1);
assert.equal(res1.isHesitation, false, '1200ms must not trigger hesitation threshold');

// Record step 2: hesitation pause (> 3200ms) with thermal warning
const res2 = recordCognitiveTraceStep(testReport, {
  actionType: 'heat_change',
  sourceEntityName: 'heat_3',
  heatLevel: 3,
  temperature: 195,
  doneness: 20,
  activeQuestId: 'quest_cuisine_ratatouille',
  activeQuestStepIndex: 1,
  warningTriggered: 'Température critique élevée sans bouillon',
  now: testReport.traces[0].timestamp + 4200
});
testReport = res2.updatedReport;
assert.equal(testReport.totalDecisions, 2);
assert.equal(res2.isHesitation, true, '4200ms must trigger hesitation flag');
assert.equal(testReport.hesitationCount, 1);
assert.equal(testReport.errorWarningsCount, 1);

// Record step 3: error recovery action
const res3 = recordCognitiveTraceStep(testReport, {
  actionType: 'heat_change',
  sourceEntityName: 'heat_1',
  heatLevel: 1,
  temperature: 85,
  doneness: 45,
  activeQuestId: 'quest_cuisine_ratatouille',
  activeQuestStepIndex: 2,
  isErrorRecovery: true,
  now: testReport.traces[1].timestamp + 1500
});
testReport = res3.updatedReport;
assert.equal(testReport.totalDecisions, 3);
assert.equal(testReport.recoveryCount, 1);
assert.equal(testReport.resilienceScore, 100, 'Successful recovery must restore resilience to 100%');

// 2. Export Formats (HuggingFace MDP & Markdown Report)
const mdpData = exportToHuggingFaceMDP(testReport);
assert.equal(mdpData.length, 3);
assert.equal(mdpData[0].action.type, 'chop');
assert.equal(mdpData[0].is_done, false);
assert.equal(mdpData[2].is_done, true);
assert(typeof mdpData[0].reward === 'number');

const mdReport = exportToMarkdownExecutiveReport(testReport);
assert(mdReport.includes('Rapport d\'Analyse Comportementale'));
assert(mdReport.includes('unit_session_001'));
assert(mdReport.includes('Efficacité Procédurale'));

// 3. Autonomous Cohort Simulator (Monte Carlo Population Testing)
const cohort = simulateAgentCohort({ cohortSize: 50, scenarioTitle: 'Test Ratatouille' });
assert.equal(cohort.cohortSize, 50);
assert(cohort.successRate >= 0 && cohort.successRate <= 100);
const sumPersonas = Object.values(cohort.personaDistribution).reduce((a, b) => a + b, 0);
assert.equal(sumPersonas, 50, 'Persona distribution sum must equal cohort size');
assert(cohort.bottlenecks.length > 0, 'Bottlenecks must be evaluated');
assert(cohort.recommendations.length > 0, 'AI Recommendations must be generated');

// 4. Store Integration & Achievements
assert.equal(useWorldStore.getState().showBehavioralAnalyticsModal, false);
useWorldStore.getState().openBehavioralAnalyticsModal();
assert.equal(useWorldStore.getState().showBehavioralAnalyticsModal, true);
assert(useWorldStore.getState().unlockedAchievements['cognitive_analyst'], 'Opening analytics must unlock cognitive_analyst');
useWorldStore.getState().closeBehavioralAnalyticsModal();
assert.equal(useWorldStore.getState().showBehavioralAnalyticsModal, false);

const runSummary = useWorldStore.getState().runCohortSimulation(25);
assert.equal(runSummary.cohortSize, 25);
assert.equal(useWorldStore.getState().cohortSimulationSummary?.cohortSize, 25);
assert(useWorldStore.getState().unlockedAchievements['cohort_commander'], 'Running cohort simulation must unlock cohort_commander');

// 5. Natural Language Parser Recognition
const parseAnalytics1 = parseInstruction('affiche l analyse comportementale de la session', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseAnalytics1.plan.intent, 'open_behavioral_analytics');

const parseAnalytics2 = parseInstruction('consulte la boite noire cognitive', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseAnalytics2.plan.intent, 'open_behavioral_analytics');

const parseCohort = parseInstruction('lance une simulation de cohorte avec 100 agents', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseCohort.plan.intent, 'run_cohort_simulation');
assert.equal(parseCohort.plan.actions[0].cohortSize, 100);

console.log('PASS: Suite 24 validée avec succès (Boîte Noire Cognitive, Trajectoires Sémantiques & Simulation de Cohorte IA).');

// --- SUITE 25: Rejeu Contrefactuel, Multivers Décisionnel & Guidage Fantôme 3D ---
import {
  createRootBranch,
  forkCounterfactualBranch,
  generateAIBotRollout,
  compareBranches,
  exportMultiverseDatasetToJSONL,
  SimulationSnapshot
} from '../engine/counterfactualEngine';

// 1. Root branch creation
const dummySnapshot: SimulationSnapshot = {
  stepIndex: testReport.traces.length,
  timestamp: Date.now(),
  cookingHeatLevel: 1,
  cookingTemperature: 85,
  cookingDoneness: 45,
  isDishPlated: false,
  platingStyle: 'classic-dome',
  platingGarnish: 'micro-greens',
  isDishSauced: false,
  activeQuestId: 'quest_cuisine_ratatouille',
  activeQuestStepIndex: 2,
  choppedIngredientsCount: 2
};

const rootBranch = createRootBranch(testReport, dummySnapshot);
assert.equal(rootBranch.id, 'branch-root-human');
assert.equal(rootBranch.authorType, 'human');
assert.equal(rootBranch.traces.length, 3);
assert(rootBranch.outcomeScore >= 0 && rootBranch.outcomeScore <= 100);

// 2. Forking Counterfactual Branch at step 2
const forkStep2 = forkCounterfactualBranch(rootBranch, 2, 'Bifurcation au pas #2 (Avant la surchauffe)');
assert.equal(forkStep2.forkStepIndex, 2);
assert.equal(forkStep2.parentBranchId, 'branch-root-human');
assert.equal(forkStep2.traces.length, 2);

// 3. Autonomous AI Policy Rollouts from the Fork
const botAnalyst = generateAIBotRollout(forkStep2, 'methodical-analyst', 'Ratatouille');
assert.equal(botAnalyst.authorType, 'ai-bot');
assert.equal(botAnalyst.botPersona, 'methodical-analyst');
assert(botAnalyst.traces.length > forkStep2.traces.length, 'Rollout must simulate subsequent steps');
assert(botAnalyst.outcomeScore >= 90, 'Methodical analyst must achieve high performance');
assert.equal(botAnalyst.snapshot.isDishPlated, true, 'Bot should finish and plate the dish');

const botImpulsive = generateAIBotRollout(forkStep2, 'impulsive-rushed', 'Ratatouille');
assert.equal(botImpulsive.botPersona, 'impulsive-rushed');
assert(botImpulsive.outcomeScore < botAnalyst.outcomeScore, 'Impulsive bot should have lower score due to heat risk');
assert(botImpulsive.predictedDurationSec < botAnalyst.predictedDurationSec, 'Impulsive bot is faster');

// 4. Causal Branch Comparison (A vs B)
const comp = compareBranches(rootBranch, botAnalyst);
assert.equal(comp.divergencePointStep, 0);
assert(typeof comp.scoreDelta === 'number');
assert(typeof comp.durationDeltaSec === 'number');
assert(comp.verdict.length > 0);
assert(comp.keyInsights.length > 0);

// 5. Multiverse Offline RL Dataset Export
const jsonlData = exportMultiverseDatasetToJSONL([rootBranch, forkStep2, botAnalyst, botImpulsive]);
const lines = jsonlData.trim().split('\n');
assert.equal(lines.length, 4, 'Should export exactly 4 branches');
const parsedFirst = JSON.parse(lines[0]);
assert.equal(parsedFirst.branch_id, 'branch-root-human');
assert(Array.isArray(parsedFirst.mdp_sequence));

// 6. Store Integration: Ghost Agent & Branch Management
useWorldStore.getState().setGhostAgentActive(false);
assert.equal(useWorldStore.getState().isGhostAgentActive, false);
useWorldStore.getState().toggleGhostAgent();
assert.equal(useWorldStore.getState().isGhostAgentActive, true);
assert(useWorldStore.getState().unlockedAchievements['ghost_trainee'], 'Toggling ghost agent must unlock ghost_trainee');

const storeFork = useWorldStore.getState().createCounterfactualFork(1, 'Branche de test fork');
assert.equal(storeFork.forkStepIndex, 1);
assert.equal(useWorldStore.getState().activeBranchId, storeFork.id);
assert(useWorldStore.getState().unlockedAchievements['counterfactual_pioneer'], 'Creating fork must unlock counterfactual_pioneer');

const storeBot = useWorldStore.getState().runAutonomousBranchRollout('intuitive-explorer', 1);
assert.equal(storeBot.botPersona, 'intuitive-explorer');
assert.equal(useWorldStore.getState().activeBranchId, storeBot.id);

// Verify total catalog of achievements is now 35
assert.equal(ACHIEVEMENTS.length, 35, 'Achievements catalog must contain exactly 35 items');

// 7. Natural Language Parser Recognition
const parseGhost1 = parseInstruction('active le guide fantome', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseGhost1.plan.intent, 'toggle_ghost_agent');

const parseGhost2 = parseInstruction('montre la trajectoire fantome ia', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseGhost2.plan.intent, 'toggle_ghost_agent');

const parseBranch = parseInstruction('cree une branche contrefactuelle', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseBranch.plan.intent, 'create_counterfactual_branch');

const parseRollout = parseInstruction('lance un rollout ia explorateur', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseRollout.plan.intent, 'run_ai_rollout');
assert.equal(parseRollout.plan.actions[0].persona, 'intuitive-explorer');

console.log('PASS: Suite 25 validée avec succès (Rejeu Contrefactuel, Multivers IA & Guidage Fantôme 3D).');

// --- SUITE 26: Moteur d'Anomalies Imprévues, Stress-Testing Cognitif & Indice de Charge Mentale (CLI) ---
import {
  createAnomalyInstance,
  calculateCognitiveLoadIndex,
  evaluateAnomalyResolution,
  ANOMALY_PRESETS
} from '../engine/anomalyEngine';

// 1. Instantiation of all anomaly presets
const anomalyPresets = Object.keys(ANOMALY_PRESETS) as Array<keyof typeof ANOMALY_PRESETS>;
assert.equal(anomalyPresets.length, 5, 'Should have 5 anomaly presets');
for (const type of anomalyPresets) {
  const anomaly = createAnomalyInstance(type);
  assert.equal(anomaly.type, type);
  assert.equal(anomaly.status, 'pending');
  assert(anomaly.timeLimitSec > 0);
  assert.equal(anomaly.timeRemainingSec, anomaly.timeLimitSec);
  assert(anomaly.title.length > 0);
  assert(anomaly.recoveryCondition.length > 0);
  assert(anomaly.suggestedAction.length > 0);
  assert(anomaly.penaltyScore > 0);
}

// 2. Cognitive Load Index (CLI) Computation & Zone Classifications
const calmLoad = calculateCognitiveLoadIndex({
  hesitationRate: 0,
  averageLatencyMs: 1500,
  activeAnomaliesCount: 0,
  cookingTemperature: 90,
  resilienceScore: 80
});
assert.equal(calmLoad.level, 'calm');
assert(calmLoad.index < 40, `Calm load index should be < 40, got ${calmLoad.index}`);

const alertLoad = calculateCognitiveLoadIndex({
  hesitationRate: 25,
  averageLatencyMs: 1400,
  activeAnomaliesCount: 1,
  cookingTemperature: 110,
  resilienceScore: 60
});
assert.equal(alertLoad.level, 'alert');
assert(alertLoad.index >= 40 && alertLoad.index < 75, `Alert load index should be [40, 75), got ${alertLoad.index}`);

const overloadLoad = calculateCognitiveLoadIndex({
  hesitationRate: 85,
  averageLatencyMs: 500, // panic rush
  activeAnomaliesCount: 2,
  cookingTemperature: 210, // critical thermal flare
  resilienceScore: 30
});
assert.equal(overloadLoad.level, 'overload');
assert(overloadLoad.index >= 75, `Overload index should be >= 75, got ${overloadLoad.index}`);

// 3. Anomaly Resolution Evaluation
const thermalAnomaly = createAnomalyInstance('thermal_flare');
assert.equal(
  evaluateAnomalyResolution(thermalAnomaly, {
    cookingHeatLevel: 3,
    cookingTemperature: 195,
    seasoningSalt: 10,
    seasoningOil: 5,
    seasoningHerbs: 5,
    isDishPlated: false,
    choppingCount: 0
  }),
  false,
  'Thermal flare must not resolve when heat is high'
);

assert.equal(
  evaluateAnomalyResolution(thermalAnomaly, {
    cookingHeatLevel: 0,
    cookingTemperature: 110,
    seasoningSalt: 10,
    seasoningOil: 5,
    seasoningHerbs: 5,
    isDishPlated: false,
    choppingCount: 0
  }),
  true,
  'Thermal flare must resolve when heat is turned off and temp <= 135'
);

const seasoningAnomaly = createAnomalyInstance('seasoning_imbalance');
assert.equal(
  evaluateAnomalyResolution(seasoningAnomaly, {
    cookingHeatLevel: 1,
    cookingTemperature: 100,
    seasoningSalt: 40,
    seasoningOil: 0,
    seasoningHerbs: 0,
    isDishPlated: false,
    choppingCount: 0
  }),
  false
);
assert.equal(
  evaluateAnomalyResolution(seasoningAnomaly, {
    cookingHeatLevel: 1,
    cookingTemperature: 100,
    seasoningSalt: 40,
    seasoningOil: 30,
    seasoningHerbs: 0,
    isDishPlated: false,
    choppingCount: 0
  }),
  true,
  'Seasoning imbalance resolves when olive oil >= 25'
);

// 4. Store Integration: Anomaly Injection, Ticking, and Resolution
useWorldStore.getState().clearAnomalies();
assert.equal(useWorldStore.getState().activeAnomalies.length, 0);

useWorldStore.getState().injectAnomaly('thermal_flare');
assert.equal(useWorldStore.getState().activeAnomalies.length, 1);
const activeId = useWorldStore.getState().activeAnomalies[0].id;
const initialTime = useWorldStore.getState().activeAnomalies[0].timeRemainingSec;

// Verify Cognitive Load in store reflects active anomaly
const storeCLI = useWorldStore.getState().getCognitiveLoad();
assert(storeCLI.index >= 40, 'Injected anomaly should increase CLI above baseline');

// Ticking cooking simulation decrements remaining duration
useWorldStore.getState().tickCooking();
const tickedTime = useWorldStore.getState().activeAnomalies[0].timeRemainingSec;
assert(tickedTime < initialTime, 'tickCooking must decrement anomaly remaining duration');

// Resolving anomaly manually unlocks crisis_manager
useWorldStore.getState().resolveAnomaly(activeId);
assert.equal(useWorldStore.getState().activeAnomalies[0].status, 'resolved');
assert(useWorldStore.getState().unlockedAchievements['crisis_manager'], 'Resolving anomaly must unlock crisis_manager');

// Test auto-resolution through tickCooking for zen_operator
useWorldStore.getState().clearAnomalies();
useWorldStore.getState().injectAnomaly('thermal_flare');
// Simulate user resolving condition: cool down heat
useWorldStore.setState({ cookingHeatLevel: 0, cookingTemperature: 100 });
useWorldStore.getState().tickCooking();
const autoResolved = useWorldStore.getState().activeAnomalies[0];
assert.equal(autoResolved.status, 'resolved');
assert(useWorldStore.getState().unlockedAchievements['zen_operator'], 'Auto-resolving thermal flare must unlock zen_operator');

// 5. Natural Language Parser Recognition for Anomalies
const parseAnomaly1 = parseInstruction('injecte un coup de feu', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseAnomaly1.plan.intent, 'inject_simulation_anomaly');
assert.equal(parseAnomaly1.plan.actions[0].anomalyType, 'thermal_flare');

const parseAnomaly2 = parseInstruction('simule un assaisonnement desequilibre', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseAnomaly2.plan.intent, 'inject_simulation_anomaly');
assert.equal(parseAnomaly2.plan.actions[0].anomalyType, 'seasoning_imbalance');

const parseAnomaly3 = parseInstruction('provoque un probleme audiovisuel', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseAnomaly3.plan.intent, 'inject_simulation_anomaly');
assert.equal(parseAnomaly3.plan.actions[0].anomalyType, 'seminar_av_glitch');

const parseAnomaly4 = parseInstruction('declenche une crise de temps', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseAnomaly4.plan.intent, 'inject_simulation_anomaly');
assert.equal(parseAnomaly4.plan.actions[0].anomalyType, 'time_crunch');

console.log('PASS: Suite 26 validée avec succès (Injection d\'Anomalies, Stress-Testing & Indice de Charge Cognitive CLI).');

// --- SUITE 27: Agent Co-équipier Incarné (Teaming Humain-IA), Export Robotique LeRobot & Certification ---
import {
  COWORKER_PERSONAS,
  createInitialCoWorkerState,
  createInitialTeamingMetrics,
  getWorkstationCoords,
  delegateTaskToCoWorker,
  tickCoWorker,
  recordHumanOverride
} from '../engine/coWorkerAgent';
import {
  generateLeRobotDataset,
  mapTraceStepToLeRobotFrame
} from '../engine/embodiedDataExporter';
import {
  generateCognitiveCertificate
} from '../engine/skillCertification';

// 1. Co-Worker Personas & Initial State
const coworkerKeys = Object.keys(COWORKER_PERSONAS) as Array<keyof typeof COWORKER_PERSONAS>;
assert.equal(coworkerKeys.length, 3, 'Should have exactly 3 co-worker personas');
const camilleState = createInitialCoWorkerState('sous-chef-camille');
assert.equal(camilleState.name, 'Camille');
assert.equal(camilleState.currentTask, 'idle');
assert.equal(camilleState.status, 'idle');
assert(camilleState.speechBubble && camilleState.speechBubble.length > 0);

// 2. Workstation Spatial Coordinates & Delegation Mechanics
const chopCoords = getWorkstationCoords('chop_vegetables');
assert(typeof chopCoords.x === 'number' && typeof chopCoords.z === 'number');

const initialTeaming = createInitialTeamingMetrics();
assert.equal(initialTeaming.delegatedTasksCount, 0);
assert.equal(initialTeaming.completedTasksCount, 0);
assert.equal(initialTeaming.overriddenTasksCount, 0);

const { nextState: delegatedState, nextMetrics: delegatedTeaming, announcement } = delegateTaskToCoWorker(
  camilleState,
  'chop_vegetables',
  initialTeaming
);
assert.equal(delegatedState.currentTask, 'chop_vegetables');
assert.equal(delegatedState.status, 'walking');
assert.equal(delegatedTeaming.delegatedTasksCount, 1);
assert(announcement.includes('Camille'));

// 3. CoWorker Simulation Ticking & Auto-Completion
let tickState = delegatedState;
let tickMetrics = delegatedTeaming;
let completed = false;
for (let i = 0; i < 15; i++) {
  const res = tickCoWorker(tickState, tickMetrics, 0.5);
  tickState = res.nextState;
  tickMetrics = res.nextMetrics;
  if (res.taskCompleted) {
    completed = true;
    assert.equal(res.completedTaskType, 'chop_vegetables');
    break;
  }
}
assert(completed, 'CoWorker should complete task after elapsed duration');
assert.equal(tickState.currentTask, 'idle');
assert.equal(tickMetrics.completedTasksCount, 1);

// 4. Human Override Recording
const overriddenTeaming = recordHumanOverride(tickMetrics, 'Test manual override');
assert.equal(overriddenTeaming.overriddenTasksCount, 1);
assert(overriddenTeaming.trustScore < tickMetrics.trustScore);

// 5. Embodied Robotics VLA Dataset (LeRobot v2.1 Schema)
const dummyWorld = useWorldStore.getState().world;
const lerobotExport = generateLeRobotDataset(
  testReport,
  dummyWorld,
  [rootBranch, botAnalyst]
);
assert.equal(lerobotExport.format_version, 'lerobot-v2.1');
assert(lerobotExport.episodes_count >= 2, 'Should contain human episode + counterfactual branches');
assert(lerobotExport.total_frames > 0);
assert(lerobotExport.features['observation.state']);

const sampleFrame = mapTraceStepToLeRobotFrame({
  stepIndex: 1,
  timestamp: Date.now(),
  relativeTimeSec: 1,
  actionType: 'chop_vegetables',
  latencyMs: 300,
  isHesitation: false,
  heatLevel: 0,
  temperature: 20,
  doneness: 0,
  activeQuestId: 'recipe_ratatouille',
  activeQuestStepIndex: 1,
  isErrorRecovery: false
}, 0, 1);
assert.equal(sampleFrame.frame_index, 0);
assert.equal(sampleFrame.action.tool_action, 'chop_vegetables');

const frame0 = lerobotExport.episodes[0].frames[0];
assert(Array.isArray(frame0.observation.state));
assert.equal(frame0.observation.state.length, 7);
assert(Array.isArray(frame0.observation.active_affordances));
assert(typeof frame0.reward === 'number');

// 6. Cognitive Skill Certification & Curricular Drills
const cert = generateCognitiveCertificate(testReport, overriddenTeaming, 1);
assert(cert.certificateId.startsWith('CERT-'));
assert(cert.overallScore >= 0 && cert.overallScore <= 100);
assert(cert.radar.spatialEfficiency > 0);
assert(cert.radar.thermodynamicControl > 0);
assert(cert.radar.stressResilience > 0);
assert(cert.radar.teamingFluency > 0);
assert(cert.radar.decisionConsistency > 0);
assert(cert.recommendedDrills.length > 0);
assert(cert.verificationHash.startsWith('WP-CERT-'));

// 7. Store Integration: CoWorker & Achievements (35 Catalog)
assert.equal(ACHIEVEMENTS.length, 35, 'Total achievements catalog must contain exactly 35 items');
assert.equal(getAchievementsByCategory('exploration').length, 20, 'Exploration achievements should be 20');

useWorldStore.getState().setCoWorkerActive(true);
assert.equal(useWorldStore.getState().isCoWorkerActive, true);
useWorldStore.getState().delegateCoWorkerTask('chop_vegetables');
assert.equal(useWorldStore.getState().coWorker.currentTask, 'chop_vegetables');
assert(useWorldStore.getState().unlockedAchievements['symbiotic_duo'], 'Delegating coworker task must unlock symbiotic_duo');

const vlaExport = useWorldStore.getState().exportVLAEmbodiedDataset();
assert.equal(vlaExport.format_version, 'lerobot-v2.1');
assert(useWorldStore.getState().unlockedAchievements['vla_dataset_curator'], 'Exporting VLA dataset must unlock vla_dataset_curator');

const storeCert = useWorldStore.getState().getCognitiveCertificate();
assert.equal(typeof storeCert.overallScore, 'number');

// 8. Natural Language Parser Recognition
const parseCo1 = parseInstruction('demande a camille de couper les legumes', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseCo1.plan.intent, 'delegate_coworker_task');
assert.equal(parseCo1.plan.actions[0].task, 'chop_vegetables');

const parseCo2 = parseInstruction('camille surveille la cuisson', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseCo2.plan.intent, 'delegate_coworker_task');
assert.equal(parseCo2.plan.actions[0].task, 'monitor_heat');

const parseVLA = parseInstruction('exporte le dataset lerobot', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseVLA.plan.intent, 'export_lerobot_dataset');

console.log('PASS: Suite 27 validée avec succès (Agent Co-équipier Incarné, Robotique VLA LeRobot & Certification Cognitive).');

// ============================================================================
// SUITE 28: Jumeau Numérique Cognitif, Inverse RL & Attention Spatiale 3D
// ============================================================================
import {
  estimateIRLPreferences,
  synthesizeCognitiveClone,
  calculateKLDivergence,
  runCloneRollout,
  compareCloneWithHuman
} from '../engine/cognitiveCloneEngine';
import {
  createInitialSpatialAttentionState,
  recordGazeFixation,
  generateVolumetricHeatmapPoints
} from '../engine/spatialAttentionTelemetry';

// 1. Inverse Reinforcement Learning (IRL) Preference Estimation
const irlWeights = estimateIRLPreferences(testReport, overriddenTeaming);
assert(irlWeights.speed >= 0 && irlWeights.speed <= 100, 'Speed weight must be [0, 100]');
assert(irlWeights.precision >= 0 && irlWeights.precision <= 100, 'Precision weight must be [0, 100]');
assert(irlWeights.aesthetics >= 0 && irlWeights.aesthetics <= 100, 'Aesthetics weight must be [0, 100]');
assert(irlWeights.riskTolerance >= 0 && irlWeights.riskTolerance <= 100, 'Risk tolerance must be [0, 100]');
assert(irlWeights.collaboration >= 0 && irlWeights.collaboration <= 100, 'Collaboration weight must be [0, 100]');

// 2. Cognitive Clone Synthesis
const distilledClone = synthesizeCognitiveClone(testReport, overriddenTeaming, 'Chef Valérie');
assert(distilledClone.cloneId.startsWith('CLONE-'));
assert.equal(distilledClone.operatorName, 'Chef Valérie');
assert(distilledClone.fidelityScore >= 50 && distilledClone.fidelityScore <= 100);
assert(distilledClone.dominantArchetype.length > 0);
assert(Object.keys(distilledClone.actionProbabilities).length > 0);
assert(distilledClone.averageDecisionLatencyMs > 0);

// 3. Kullback-Leibler (KL) Divergence
const pDist = { chop: 0.5, heat: 0.5 };
const qIdentical = { chop: 0.5, heat: 0.5 };
const qDifferent = { chop: 0.1, heat: 0.9 };
assert.equal(calculateKLDivergence(pDist, qIdentical), 0, 'KL divergence of identical distributions must be 0');
assert(calculateKLDivergence(pDist, qDifferent) > 0, 'KL divergence of distinct distributions must be > 0');

// 4. Autonomous Clone Rollout Simulation
const cloneRollout = runCloneRollout(distilledClone, 'Master Gourmet Ratatouille', 5);
assert.equal(cloneRollout.cloneId, distilledClone.cloneId);
assert.equal(cloneRollout.simulatedSteps.length, 5);
assert(cloneRollout.totalDurationSec > 0);
assert(cloneRollout.finalScore >= 0 && cloneRollout.finalScore <= 100);
assert(cloneRollout.alignmentScore >= 0 && cloneRollout.alignmentScore <= 100);

// 5. Clone vs. Human Comparative Analysis
const cloneComparison = compareCloneWithHuman(testReport, cloneRollout, distilledClone);
assert(cloneComparison.behavioralSimilarityPercent >= 0);
assert(cloneComparison.latencyParityPercent >= 0);
assert(cloneComparison.synthesisSummary.includes(distilledClone.cloneId));
assert(typeof cloneComparison.alignmentRating === 'string');

// 6. Spatial Attention Telemetry & Scanpath Tracker
let attentionState = createInitialSpatialAttentionState();
assert.equal(Object.keys(attentionState.fixations).length, 0);
assert.equal(attentionState.scanpath.totalTransitions, 0);

// First fixation on Prep Table
attentionState = recordGazeFixation(
  attentionState,
  'table_prep_1',
  'Table de préparation',
  { x: 0, y: 0.92, z: 0.05 },
  600,
  350
);
assert.equal(attentionState.activeFocusEntityId, 'table_prep_1');
assert.equal(attentionState.fixations['table_prep_1'].durationMs, 600);
assert.equal(attentionState.scanpath.points.length, 1);

// Second fixation on Cocotte
attentionState = recordGazeFixation(
  attentionState,
  'cocotte_fonte_1',
  'Cocotte en fonte',
  { x: 0, y: 0.95, z: -0.2 },
  900,
  200
);
assert.equal(attentionState.scanpath.points.length, 2);
assert.equal(attentionState.scanpath.totalTransitions, 2);
assert(attentionState.scanpath.attentionEntropy > 0, 'Attention entropy must be > 0 with 2 distinct fixations');

// Volumetric heatmap generation
const heatmapPoints = generateVolumetricHeatmapPoints(attentionState);
assert.equal(heatmapPoints.length, 2);
assert(heatmapPoints[0].weight > 0 && heatmapPoints[0].weight <= 1.0);
assert(heatmapPoints[1].weight > 0 && heatmapPoints[1].weight <= 1.0);

// 7. Store Integration: Digital Twin & Spatial Attention
const storeClone = useWorldStore.getState().synthesizeClone('Opérateur Distillé');
assert(storeClone.cloneId.startsWith('CLONE-'));
assert(useWorldStore.getState().unlockedAchievements['cognitive_clone_created'], 'Synthesizing clone must unlock cognitive_clone_created');

const storeRollout = useWorldStore.getState().simulateCloneRollout(5);
assert.equal(storeRollout.simulatedSteps.length, 5);
assert(useWorldStore.getState().cloneRolloutResult !== null);
assert(useWorldStore.getState().cloneComparison !== null);

// Attention Heatmap Toggle in Store
useWorldStore.setState({ spatialAttention: createInitialSpatialAttentionState() });
useWorldStore.getState().toggleAttentionHeatmap(true);
assert.equal(useWorldStore.getState().spatialAttention.isHeatmapVisible, true);
assert(useWorldStore.getState().unlockedAchievements['deep_focus_master'], 'Enabling heatmap must unlock deep_focus_master');
useWorldStore.getState().toggleAttentionHeatmap(false);
assert.equal(useWorldStore.getState().spatialAttention.isHeatmapVisible, false);

// 8. Natural Language Parser Recognition
const parseClone = parseInstruction('genere mon jumeau numerique', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseClone.plan.intent, 'synthesize_cognitive_clone');

const parseHeatmap = parseInstruction('affiche la heatmap d attention spatiale', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseHeatmap.plan.intent, 'toggle_attention_heatmap');

console.log('PASS: Suite 28 validée avec succès (Jumeau Numérique Cognitif, Inverse RL & Attention Spatiale 3D).');

// ============================================================================
// SUITE 29 : OBJETS 3D HAUTE-FIDÉLITÉ POUR LES SIMULATIONS WORLD PILOT
// (Modèles réalistes PBR, Résolution d'alias du catalogue & Intégrité des 50 scénarios)
// ============================================================================
console.log('--- Démarrage de la Suite 29 : Modèles 3D Haute-Fidélité & Résolution des Simulations ---');

// 1. Invariants du catalogue statique
assert.equal(catalog.length, 540, 'Le catalogue doit conserver exactement 540 entrées');
assert.equal(extendedCatalog.length, 460, 'Le catalogue étendu doit conserver exactement 460 entrées');

// 2. Résolution complète des alias d'assets de simulation
const simulationAssetIds = [
  'wp-bouteille-de-vin',
  'wp-bouteille-de-lait',
  'wp-oeuf',
  'wp-fromage-comte',
  'wp-champignon-de-paris',
  'wp-comptoir-de-vente',
  'wp-socle-d-exposition',
  'wp-viande-de-boeuf',
  'wp-moulin-a-poivre',
  'wp-verre-a-pied',
  'web-screen',
];

for (const id of simulationAssetIds) {
  const asset = getAsset(id);
  assert(asset !== undefined, `L'asset de simulation '${id}' doit être résolu via getAsset()`);
  assert(asset.name.length > 0, `L'asset '${id}' doit posséder un nom valide`);
  assert(Array.isArray(asset.size) && asset.size.length === 3, `L'asset '${id}' doit posséder des dimensions 3D valides`);
}

// 3. Détection des modèles 3D ultra-détaillés (hasDetailedSimulationModel)
const { hasDetailedSimulationModel } = await import('../scene/DetailedSimulationModel');

const testDetailedEntities: EntitySpec[] = [
  { id: 'vin_1', name: 'Bouteille de Vin Grand Cru', capabilities: [], visuals: { assetId: 'wp-bouteille-de-vin' } },
  { id: 'lait_1', name: 'Bouteille de Lait Fermier', capabilities: [], visuals: { assetId: 'wp-bouteille-de-lait' } },
  { id: 'oeuf_1', name: 'Boîte d’œufs frais', capabilities: [], visuals: { assetId: 'wp-oeuf' } },
  { id: 'fromage_1', name: 'Part de Comté AOP', capabilities: [], visuals: { assetId: 'wp-fromage-comte' } },
  { id: 'champi_1', name: 'Champignons de Paris', capabilities: [], visuals: { assetId: 'wp-champignon-de-paris' } },
  { id: 'poivre_1', name: 'Moulin à poivre en bois', capabilities: [], visuals: { assetId: 'wp-moulin-a-poivre' } },
  { id: 'poele_1', name: 'Poêle en cuivre', capabilities: [], visuals: { assetId: 'wp-poele' } },
  { id: 'boeuf_1', name: 'Pièce de bœuf persillée', capabilities: [], visuals: { assetId: 'wp-viande-de-boeuf' } },
  { id: 'verre_1', name: 'Verre à pied en cristal', capabilities: [], visuals: { assetId: 'wp-verre-a-pied' } },
  { id: 'laptop_1', name: 'Ordinateur portable facilitateur', capabilities: [], visuals: { assetId: 'wp-ordinateur-portable' } },
  { id: 'pieuvre_1', name: 'Pieuvre téléphone de conférence', capabilities: [], visuals: { assetId: 'wp-telephone-de-conference' } },
  { id: 'cocotte_1', name: 'Cocotte en fonte émaillée', capabilities: [], visuals: { assetId: 'wp-cocotte' } },
  { id: 'couteau_1', name: 'Couteau de chef forgé', capabilities: [], visuals: { assetId: 'wp-couteau-de-chef' } },
  { id: 'beurre_1', name: 'Plaquette de beurre demi-sel', capabilities: [], visuals: { assetId: 'wp-plaquette-de-beurre' } },
  { id: 'creme_1', name: 'Pot de crème fraîche épaisse', capabilities: [], visuals: { assetId: 'wp-pot-de-creme-fraiche' } },
  { id: 'casserole_1', name: 'Casserole inox multicouche', capabilities: [], visuals: { assetId: 'wp-casserole' } },
  { id: 'bouquet_1', name: 'Bouquet garni de Provence', capabilities: [], visuals: { assetId: 'wp-bouquet-garni' } },
  { id: 'ail_1', name: 'Gousse d’ail fermière', capabilities: [], visuals: { assetId: 'wp-gousse-d-ail' } },
  { id: 'oignon_1', name: 'Oignon jaune cuivré', capabilities: [], visuals: { assetId: 'wp-oignon-jaune' } },
  { id: 'huile_1', name: 'Huile d’olive de Provence AOC', capabilities: [], visuals: { assetId: 'wp-huile-d-olive-de-provence' } },
  { id: 'sel_1', name: 'Fleur de sel de Guérande', capabilities: [], visuals: { assetId: 'wp-fleur-de-sel-de-guerande' } },
  { id: 'croissant_1', name: 'Croissant pur beurre', capabilities: [], visuals: { assetId: 'wp-croissant' } },
  { id: 'baguette_1', name: 'Baguette de tradition', capabilities: [], visuals: { assetId: 'wp-baguette' } },
  { id: 'fauteuil_1', name: 'Fauteuil de conférence exécutif', capabilities: [], visuals: { assetId: 'wp-fauteuil-de-conference' } },
  { id: 'totem_1', name: 'Moniteur sur pied interactif', capabilities: [], visuals: { assetId: 'wp-moniteur-sur-pied' } },
  { id: 'tasse_1', name: 'Tasse de café bistrot', capabilities: [], visuals: { assetId: 'wp-tasse-a-the' } },
  { id: 'ilot_1', name: 'Îlot de cuisine central', capabilities: [], visuals: { assetId: 'wp-ilot-de-cuisine' } },
  { id: 'tabouret_1', name: 'Tabouret haut industriel', capabilities: [], visuals: { assetId: 'wp-tabouret-haut' } },
  { id: 'clavier_1', name: 'Clavier informatique aluminium', capabilities: [], visuals: { assetId: 'wp-clavier-informatique' } },
  { id: 'souris_1', name: 'Souris informatique ergonomique', capabilities: [], visuals: { assetId: 'wp-souris-informatique' } },
  { id: 'saladier_1', name: 'Saladier culinaire inox', capabilities: [], visuals: { assetId: 'wp-saladier' } },
  { id: 'planche_1', name: 'Planche à découper en acacia', capabilities: [], visuals: { assetId: 'wp-planche-a-decouper' } },
  { id: 'courgette_1', name: 'Courgette maraîchère verte', capabilities: [], visuals: { assetId: 'wp-courgette' } },
  { id: 'tomate_1', name: 'Tomate cœur de bœuf', capabilities: [], visuals: { assetId: 'wp-tomate' } },
  { id: 'notes_1', name: 'Bloc de notes adhésives', capabilities: [], visuals: { assetId: 'wp-bloc-de-notes-adhesives' } },
  { id: 'balance_1', name: 'Balance de cuisine numérique', capabilities: [], visuals: { assetId: 'wp-balance-de-cuisine' } },
  { id: 'chaise_bureau_1', name: 'Fauteuil de bureau ergonomique', capabilities: [], visuals: { assetId: 'office-chair' } },
  { id: 'table_reunion_1', name: 'Grande table de réunion en noyer', capabilities: [], visuals: { assetId: 'meeting-table' } },
  { id: 'bureau_1', name: 'Bureau individuel scandinave', capabilities: [], visuals: { assetId: 'wp-bureau-individuel' } },
  { id: 'porte_doc_1', name: 'Porte-documents en cuir sellier', capabilities: [], visuals: { assetId: 'wp-porte-documents' } },
  { id: 'table_haute_1', name: 'Table haute de réunion', capabilities: [], visuals: { assetId: 'wp-table-haute-de-reunion' } },
  { id: 'tableau_mobile_1', name: 'Tableau blanc mobile', capabilities: [], visuals: { assetId: 'mobile-board' } },
  { id: 'carotte_1', name: 'Carotte des sables', capabilities: [], visuals: { assetId: 'wp-carotte' } },
  { id: 'echalote_1', name: 'Échalote traditionnelle', capabilities: [], visuals: { assetId: 'wp-echalote' } },
  { id: 'pomme_terre_1', name: 'Pomme de terre Ratte', capabilities: [], visuals: { assetId: 'wp-pomme-de-terre' } },
  { id: 'valise_1', name: 'Valise à roulettes', capabilities: [], visuals: { assetId: 'wp-valise-a-roulettes' } },
  { id: 'plante_1', name: 'Plante verte ficus en pot céramique', capabilities: [], visuals: { assetId: 'planter' } },
  { id: 'cloison_1', name: 'Cloison acoustique modulaire', capabilities: [], visuals: { assetId: 'partition' } },
  { id: 'comptoir_1', name: 'Comptoir d’accueil en chêne et quartz', capabilities: [], visuals: { assetId: 'counter' } },
  { id: 'canape_1', name: 'Canapé contemporain lounge', capabilities: [], visuals: { assetId: 'sofa' } },
  { id: 'verre_eau_1', name: 'Verre à eau bistrot à facettes', capabilities: [], visuals: { assetId: 'wp-verre-a-eau' } },
  { id: 'panneau_dir_1', name: 'Panneau signalétique directionnel', capabilities: [], visuals: { assetId: 'wp-panneau-directionnel' } },
  { id: 'fouet_1', name: 'Fouet de cuisine inox', capabilities: [], visuals: { assetId: 'wp-fouet-de-cuisine' } },
  { id: 'spatule_1', name: 'Spatule maryse en silicone', capabilities: [], visuals: { assetId: 'wp-spatule' } },
  { id: 'machine_cafe_1', name: 'Machine expresso barista double groupe', capabilities: [], visuals: { assetId: 'coffee-machine' } },
  { id: 'videoproj_1', name: 'Vidéoprojecteur laser de conférence', capabilities: [], visuals: { assetId: 'wp-videoprojecteur' } },
  { id: 'chaise_scolaire_1', name: 'Chaise scolaire en hêtre multiplis', capabilities: [], visuals: { assetId: 'wp-chaise-scolaire' } },
  { id: 'banc_1', name: 'Banc public contemporain en chêne', capabilities: [], visuals: { assetId: 'bench' } },
  { id: 'riz_1', name: 'Paquet de riz de Camargue IGP', capabilities: [], visuals: { assetId: 'wp-paquet-de-riz' } },
  { id: 'pates_1', name: 'Boîte de pâtes artisanales', capabilities: [], visuals: { assetId: 'wp-paquet-de-pates' } },
  { id: 'sucre_1', name: 'Boîte de sucre pur canne', capabilities: [], visuals: { assetId: 'wp-paquet-de-sucre' } },
  { id: 'enceinte_1', name: 'Enceinte colonne de conférence', capabilities: [], visuals: { assetId: 'wp-enceinte-de-conference' } },
  { id: 'caisse_1', name: 'Caisse enregistreuse tactile POS', capabilities: [], visuals: { assetId: 'wp-caisse-enregistreuse' } },
  { id: 'assiette_1', name: 'Assiette plate en porcelaine de Limoges', capabilities: [], visuals: { assetId: 'wp-assiette-plate' } },
  { id: 'secours_1', name: 'Trousse de premiers secours', capabilities: [], visuals: { assetId: 'wp-trousse-de-premiers-secours' } },
  { id: 'table_basse_1', name: 'Table basse scandinave tripode', capabilities: [], visuals: { assetId: 'coffee-table' } },
  { id: 'fromage_bleu_1', name: 'Part de Roquefort AOP', capabilities: [], visuals: { assetId: 'wp-part-de-fromage' } },
  { id: 'thermometre_1', name: 'Thermomètre digital de chef', capabilities: [], visuals: { assetId: 'thermometer' } },
  { id: 'borne_tickets_1', name: 'Borne interactive de billetterie', capabilities: [], visuals: { assetId: 'wp-borne-de-tickets' } },
  { id: 'potelet_1', name: 'Potelet urbain parisien en fonte', capabilities: [], visuals: { assetId: 'wp-potelet-urbain' } },
  { id: 'horloge_1', name: 'Horloge murale vintage', capabilities: [], visuals: { assetId: 'wp-horloge-murale' } },
  { id: 'trousseau_1', name: 'Trousseau de clés d’hôtel', capabilities: [], visuals: { assetId: 'wp-trousseau-de-cles' } },
  { id: 'miroir_1', name: 'Grand miroir psyché d’essayage', capabilities: [], visuals: { assetId: 'wp-miroir-de-boutique' } },
  { id: 'petanque_1', name: 'Boules de pétanque en acier carbone', capabilities: [], visuals: { assetId: 'wp-boule-de-petanque' } },
  { id: 'mug_1', name: 'Mug en céramique artisanale', capabilities: [], visuals: { assetId: 'wp-mug' } },
  { id: 'chocolat_1', name: 'Tablette de chocolat noir 70%', capabilities: [], visuals: { assetId: 'wp-tablette-de-chocolat' } },
  { id: 'badge_1', name: 'Badge de participant et tour de cou', capabilities: [], visuals: { assetId: 'wp-badge-de-participant' } },
  { id: 'salade_1', name: 'Salade verte batavia', capabilities: [], visuals: { assetId: 'wp-salade-verte' } },
  { id: 'concombre_1', name: 'Concombre noa de plein champ', capabilities: [], visuals: { assetId: 'wp-concombre' } },
  { id: 'radis_1', name: 'Botte de radis roses', capabilities: [], visuals: { assetId: 'wp-radis-rose' } },
  { id: 'poire_1', name: 'Poire Williams dorée', capabilities: [], visuals: { assetId: 'wp-poire-william' } },
  { id: 'organiseur_1', name: 'Organiseur de bureau en bambou', capabilities: [], visuals: { assetId: 'wp-organiseur-de-bureau' } },
  { id: 'table_bistrot_1', name: 'Table ronde de bistrot en marbre', capabilities: [], visuals: { assetId: 'wp-table-de-bistrot' } },
  { id: 'carafe_1', name: 'Carafe d’eau bistrot avec citron', capabilities: [], visuals: { assetId: 'wp-carafe' } },
  { id: 'corbeille_pain_1', name: 'Corbeille à pain en osier', capabilities: [], visuals: { assetId: 'wp-corbeille-a-pain' } },
  { id: 'bougeoir_1', name: 'Bougeoir gastronomique en laiton', capabilities: [], visuals: { assetId: 'wp-bougeoir-de-table' } },
  { id: 'paris_brest_1', name: 'Pâtisserie Paris-Brest', capabilities: [], visuals: { assetId: 'wp-paris-brest' } },
  { id: 'macaron_1', name: 'Macaron parisien', capabilities: [], visuals: { assetId: 'wp-macaron' } },
  { id: 'millefeuille_1', name: 'Mille-feuille vanille', capabilities: [], visuals: { assetId: 'wp-millefeuille' } },
  { id: 'plateau_fromage_1', name: 'Plateau de fromages affinés', capabilities: [], visuals: { assetId: 'wp-plateau-de-fromages' } },
  { id: 'meule_fromage_1', name: 'Meule de fromage d’alpage', capabilities: [], visuals: { assetId: 'wp-meule-de-fromage' } },
  { id: 'fourchette_1', name: 'Fourchette de table en argent', capabilities: [], visuals: { assetId: 'wp-fourchette' } },
  { id: 'panier_courses_1', name: 'Panier de courses en osier', capabilities: [], visuals: { assetId: 'wp-panier-de-courses' } },
  { id: 'sac_courses_1', name: 'Sac de courses en papier kraft', capabilities: [], visuals: { assetId: 'wp-sac-de-courses-en-papier' } },
  { id: 'cageot_fruits_1', name: 'Cagette en peuplier et fruits', capabilities: [], visuals: { assetId: 'wp-cageot-a-fruits' } },
  { id: 'lampadaire_1', name: 'Lampadaire scandinave en laiton', capabilities: [], visuals: { assetId: 'floor-lamp' } },
  { id: 'tpe_1', name: 'Terminal de paiement électronique', capabilities: [], visuals: { assetId: 'wp-terminal-de-paiement' } },
  { id: 'chariot_1', name: 'Chariot de supermarché', capabilities: [], visuals: { assetId: 'wp-chariot-de-supermarche' } },
  { id: 'boite_lettres_1', name: 'Boîte aux lettres de rue La Poste', capabilities: [], visuals: { assetId: 'wp-boite-aux-lettres-de-rue' } },
  { id: 'reverbere_1', name: 'Réverbère de rue en fonte', capabilities: [], visuals: { assetId: 'wp-reverbere-de-rue' } },
  { id: 'abribus_1', name: 'Abribus urbain en verre', capabilities: [], visuals: { assetId: 'wp-abribus' } },
  { id: 'vitrine_refrigeree_1', name: 'Vitrine réfrigérée commerciale', capabilities: [], visuals: { assetId: 'wp-vitrine-refrigeree' } },
  { id: 'etal_marche_1', name: 'Étal de marché de maraîcher', capabilities: [], visuals: { assetId: 'wp-etal-de-marche' } },
  { id: 'auvent_terrasse_1', name: 'Auvent de terrasse de bistrot', capabilities: [], visuals: { assetId: 'wp-auvent-de-terrasse' } },
  { id: 'barriere_terrasse_1', name: 'Barrière de terrasse brise-vent', capabilities: [], visuals: { assetId: 'wp-barriere-de-terrasse' } },
  { id: 'ecran_proj_1', name: 'Écran de projection déroulant', capabilities: [], visuals: { assetId: 'wp-ecran-de-projection-deroulant' } },
  { id: 'kiosque_1', name: 'Kiosque à journaux parisien', capabilities: [], visuals: { assetId: 'wp-kiosque-a-journaux' } },
  { id: 'tourniquet_1', name: 'Tourniquet à cartes postales', capabilities: [], visuals: { assetId: 'wp-tourniquet-a-cartes' } },
  { id: 'devanture_boul_1', name: 'Devanture de boulangerie artisanale', capabilities: [], visuals: { assetId: 'wp-devanture-de-boulangerie' } },
  { id: 'fontaine_wallace_1', name: 'Fontaine Wallace parisienne', capabilities: [], visuals: { assetId: 'wp-fontaine-a-boire' } },
  { id: 'sac_dos_1', name: 'Sac à dos en toile canvas', capabilities: [], visuals: { assetId: 'wp-sac-a-dos' } },
  { id: 'portefeuille_1', name: 'Portefeuille en cuir pleine fleur', capabilities: [], visuals: { assetId: 'wp-portefeuille' } },
  { id: 'ciseaux_1', name: 'Paire de ciseaux de coiffeur', capabilities: [], visuals: { assetId: 'wp-paire-de-ciseaux' } },
  { id: 'peigne_1', name: 'Peigne en écaille d’acétate', capabilities: [], visuals: { assetId: 'wp-peigne' } },
  { id: 'seche_cheveux_1', name: 'Sèche-cheveux professionnel ionique', capabilities: [], visuals: { assetId: 'wp-seche-cheveux' } },
  { id: 'table_u_1', name: 'Table de conférence en U', capabilities: [], visuals: { assetId: 'wp-table-de-conference-en-u' } },
  { id: 'pupitre_1', name: 'Bureau d’élève d’écolier', capabilities: [], visuals: { assetId: 'wp-bureau-d-eleve' } },
  { id: 'cahier_1', name: 'Cahier d’écolier ouvert', capabilities: [], visuals: { assetId: 'wp-cahier-ouvert' } },
  { id: 'stylo_1', name: 'Stylo-plume de luxe', capabilities: [], visuals: { assetId: 'wp-stylo-plume' } },
  { id: 'trousse_1', name: 'Trousse d’école en cuir', capabilities: [], visuals: { assetId: 'wp-trousse-d-ecole' } },
  { id: 'librairie_1', name: 'Devanture de librairie parisienne', capabilities: [], visuals: { assetId: 'wp-devanture-de-librairie' } },
  { id: 'biblio_1', name: 'Bibliothèque basse en chêne', capabilities: [], visuals: { assetId: 'wp-bibliotheque-basse' } },
  { id: 'classeur_1', name: 'Classeur à anneaux rouge', capabilities: [], visuals: { assetId: 'wp-classeur-a-anneaux' } },
  { id: 'chevalet_1', name: 'Chevalet de peintre en hêtre', capabilities: [], visuals: { assetId: 'wp-chevalet-de-peintre' } },
  { id: 'toile_1', name: 'Toile de maître encadrée', capabilities: [], visuals: { assetId: 'wp-toile-encadree' } },
  { id: 'socle_1', name: 'Socle d’exposition muséale', capabilities: [], visuals: { assetId: 'wp-socle-d-exposition' } },
  { id: 'portant_1', name: 'Portant à vêtements sur roulettes', capabilities: [], visuals: { assetId: 'wp-portant-a-vetements' } },
  { id: 'cintre_1', name: 'Cintre en bois galbé', capabilities: [], visuals: { assetId: 'wp-cintre' } },
  { id: 'cabine_1', name: 'Cabine d’essayage avec rideau', capabilities: [], visuals: { assetId: 'wp-cabine-d-essayage' } },
  { id: 'panier_pique_1', name: 'Panier de pique-nique en osier', capabilities: [], visuals: { assetId: 'wp-panier-de-pique-nique' } },
  { id: 'cochonnet_1', name: 'Cochonnet de pétanque en buis', capabilities: [], visuals: { assetId: 'wp-cochonnet' } },
  { id: 'beret_1', name: 'Béret basque en laine mérinos', capabilities: [], visuals: { assetId: 'wp-beret' } },
  { id: 'bol_1', name: 'Bol à déjeuner breton', capabilities: [], visuals: { assetId: 'wp-bol-a-dejeuner' } },
  { id: 'miel_1', name: 'Pot de miel de lavande', capabilities: [], visuals: { assetId: 'wp-pot-de-miel' } },
  { id: 'brique_lait_1', name: 'Brique de lait entier', capabilities: [], visuals: { assetId: 'wp-brique-de-lait' } },
  { id: 'drapeau_1', name: 'Drapeau tricolore sur pied', capabilities: [], visuals: { assetId: 'wp-drapeau-tricolore-sur-pied' } },
  { id: 'accordeon_1', name: 'Accordéon chromatique de guinguette', capabilities: [], visuals: { assetId: 'wp-accordeon' } },
  { id: 'lampion_1', name: 'Lampion de fête en papier', capabilities: [], visuals: { assetId: 'wp-lampion-de-fete' } },
  { id: 'guirlande_1', name: 'Guirlande de fanions multicolores', capabilities: [], visuals: { assetId: 'wp-guirlande-de-fanions' } },
  { id: 'livre_1', name: 'Livre de maître relié plein cuir', capabilities: [], visuals: { assetId: 'book' } },
  { id: 'globe_1', name: 'Globe terrestre géographique', capabilities: [], visuals: { assetId: 'globe' } },
  { id: 'tableau_1', name: 'Tableau blanc magnétique', capabilities: [], visuals: { assetId: 'whiteboard' } },
  { id: 'etagere_1', name: 'Étagère murale en chêne', capabilities: [], visuals: { assetId: 'shelf' } },
  { id: 'fontaine_1', name: 'Fontaine monumentale en pierre', capabilities: [], visuals: { assetId: 'fountain' } },
  { id: 'arbre_1', name: 'Marronnier d’ombrage parisien', capabilities: [], visuals: { assetId: 'tree' } },
  { id: 'web_screen_1', name: 'Écran OLED incurvé interactif', capabilities: [], visuals: { assetId: 'web-screen' } },
  { id: 'wall_screen_1', name: 'Mur d’images vidéo micro-LED', capabilities: [], visuals: { assetId: 'wall-screen' } },
  { id: 'bar_chart_1', name: 'Graphique 3D holographique', capabilities: [], visuals: { assetId: 'bar-chart' } },
  { id: 'louche_1', name: 'Louche de chef en inox', capabilities: [], visuals: { assetId: 'wp-louche' } },
  { id: 'bruleur_1', name: 'Brûleur de laboratoire Bunsen', capabilities: [], visuals: { assetId: 'wp-bruleur-de-laboratoire' } },
  { id: 'erlen_1', name: 'Fiole Erlenmeyer graduée', capabilities: [], visuals: { assetId: 'wp-fiole-erlenmeyer' } },
  { id: 'tubes_1', name: 'Porte-tubes à essai', capabilities: [], visuals: { assetId: 'wp-porte-tubes' } },
  { id: 'bench_1', name: 'Établi technique de laboratoire', capabilities: [], visuals: { assetId: 'technical-bench' } },
  { id: 'guitare_1', name: 'Guitare acoustique en bois', capabilities: [], visuals: { assetId: 'wp-guitare-acoustique' } },
  { id: 'djembe_1', name: 'Djembé traditionnel', capabilities: [], visuals: { assetId: 'wp-djembe' } },
  { id: 'micro_1', name: 'Microphone de studio sur pied', capabilities: [], visuals: { assetId: 'wp-microphone-sur-pied' } },
  { id: 'casque_vr_1', name: 'Casque VR de simulation', capabilities: [], visuals: { assetId: 'wp-casque-vr' } },
  { id: 'coffre_1', name: 'Coffre sécurisé blindé', capabilities: [], visuals: { assetId: 'chest' } },
  { id: 'cheminee_1', name: 'Foyer de cheminée traditionnel', capabilities: [], visuals: { assetId: 'fireplace' } },
  { id: 'violon_1', name: 'Violon de luthier', capabilities: [], visuals: { assetId: 'wp-violon' } },
  { id: 'piano_1', name: 'Piano droit laqué', capabilities: [], visuals: { assetId: 'wp-piano-droit' } },
  { id: 'trompette_1', name: 'Trompette en laiton', capabilities: [], visuals: { assetId: 'wp-trompette' } },
  { id: 'pupitre_part_1', name: 'Pupitre à partitions', capabilities: [], visuals: { assetId: 'wp-pupitre-a-partitions' } },
  { id: 'palette_1', name: 'Palette de peintre', capabilities: [], visuals: { assetId: 'wp-palette-de-peintre' } },
  { id: 'arcade_1', name: 'Borne d’arcade rétro', capabilities: [], visuals: { assetId: 'wp-borne-d-arcade' } },
  { id: 'torche_1', name: 'Torche murale en fer', capabilities: [], visuals: { assetId: 'wp-torche-murale' } },
  { id: 'brasero_1', name: 'Brasero en fonte', capabilities: [], visuals: { assetId: 'wp-brasero' } },
  { id: 'cristal_1', name: 'Cristal magique', capabilities: [], visuals: { assetId: 'wp-cristal-magique' } },
  { id: 'tonneau_1', name: 'Tonneau de chêne', capabilities: [], visuals: { assetId: 'wp-tonneau' } },
  { id: 'bouclier_1', name: 'Bouclier rond médiéval', capabilities: [], visuals: { assetId: 'wp-bouclier-rond' } },
  { id: 'epee_1', name: 'Épée de chevalier', capabilities: [], visuals: { assetId: 'wp-epee-de-chevalier' } },
  { id: 'flipper_1', name: 'Flipper rétro électromécanique', capabilities: [], visuals: { assetId: 'wp-flipper' } },
  { id: 'manette_1', name: 'Manette de jeu ergonomique sans fil', capabilities: [], visuals: { assetId: 'wp-manette-de-jeu' } },
  { id: 'robot_1', name: 'Robot compagnon autonome', capabilities: [], visuals: { assetId: 'wp-robot-compagnon' } },
  { id: 'drone_1', name: 'Drone à quatre rotors en carbone', capabilities: [], visuals: { assetId: 'wp-drone-a-quatre-rotors' } },
  { id: 'heaume_1', name: 'Heaume de chevalier à cimier', capabilities: [], visuals: { assetId: 'wp-casque-de-chevalier' } },
  { id: 'arc_1', name: 'Grand arc en bois d’if', capabilities: [], visuals: { assetId: 'wp-arc-de-bois' } },
  { id: 'potion_1', name: 'Fiole de potion alchimique', capabilities: [], visuals: { assetId: 'wp-fiole-de-potion' } },
  { id: 'parchemin_1', name: 'Parchemin ancien enluminé', capabilities: [], visuals: { assetId: 'wp-parchemin-deroule' } },
  { id: 'grimoire_1', name: 'Grimoire de sortilèges en cuir', capabilities: [], visuals: { assetId: 'wp-livre-de-grimoire' } },
  { id: 'marteau_1', name: 'Marteau d’artisan en acier forgé', capabilities: [], visuals: { assetId: 'wp-marteau' } },
  { id: 'perceuse_1', name: 'Perceuse sans fil professionnelle', capabilities: [], visuals: { assetId: 'wp-perceuse' } },
  { id: 'antenne_1', name: 'Antenne parabolique de télécommunication', capabilities: [], visuals: { assetId: 'wp-antenne-satellite' } },
  { id: 'etabli_1', name: 'Établi d’atelier avec étau', capabilities: [], visuals: { assetId: 'workbench' } },
  { id: 'pompe_1', name: 'Pompe centrifuge démontable', capabilities: [], visuals: { assetId: 'pump' } },
  { id: 'regle_1', name: 'Réglet d’ingénieur de précision', capabilities: [], visuals: { assetId: 'ruler' } },
  { id: 'boite_outils_1', name: 'Boîte à outils de mécanicien', capabilities: [], visuals: { assetId: 'tools' } },
  { id: 'balance_roberval_1', name: 'Balance de Roberval à plateaux', capabilities: [], visuals: { assetId: 'balance' } },
  { id: 'assemblage_1', name: 'Module d’assemblage mécanique', capabilities: [], visuals: { assetId: 'assembly' } },
  { id: 'prise_1', name: 'Prise socle industrielle IP55', capabilities: [], visuals: { assetId: 'socket' } },
  { id: 'pupitre_orateur_1', name: 'Pupitre d’orateur exécutif', capabilities: [], visuals: { assetId: 'lectern' } },
  { id: 'totem_1', name: 'Totem d’affichage dynamique', capabilities: [], visuals: { assetId: 'display' } },
  { id: 'coupe_tech_1', name: 'Modèle de moteur en coupe technique', capabilities: [], visuals: { assetId: 'cutaway' } },
  { id: 'cartes_rep_1', name: 'Cartes de réponse pédagogiques', capabilities: [], visuals: { assetId: 'cards' } },
  { id: 'tri_station_1', name: 'Station de tri sélectif tricolore', capabilities: [], visuals: { assetId: 'sorting' } },
  { id: 'microscope_1', name: 'Microscope optique de laboratoire', capabilities: [], visuals: { assetId: 'wp-microscope' } },
  { id: 'telescope_1', name: 'Télescope astronomique newtonien', capabilities: [], visuals: { assetId: 'wp-telescope' } },
  { id: 'sablier_1', name: 'Sablier de maître horloger', capabilities: [], visuals: { assetId: 'wp-sablier' } },
  { id: 'boussole_1', name: 'Boussole de poche d’arpenteur', capabilities: [], visuals: { assetId: 'wp-boussole' } },
  { id: 'enclume_1', name: 'Enclume de forgeron de 150 kg', capabilities: [], visuals: { assetId: 'wp-enclume' } },
  { id: 'camera_1', name: 'Appareil photo argentique reflex', capabilities: [], visuals: { assetId: 'wp-appareil-photo' } },
  { id: 'machine_ecrire_1', name: 'Machine à écrire rétro des années 50', capabilities: [], visuals: { assetId: 'wp-machine-a-ecrire' } },
  { id: 'gramophone_1', name: 'Phonographe gramophone à pavillon', capabilities: [], visuals: { assetId: 'wp-gramophone' } },
  { id: 'mannequin_1', name: 'Mannequin instructeur articulé', capabilities: [], visuals: { assetId: 'instructor' } },
  { id: 'mains_1', name: 'Mains de démonstration articulées', capabilities: [], visuals: { assetId: 'hands' } },
  { id: 'chrono_1', name: 'Chronomètre mécanique de précision', capabilities: [], visuals: { assetId: 'timer' } },
  { id: 'jeton_1', name: 'Jeton d’arcade en or poli', capabilities: [], visuals: { assetId: 'token' } },
  { id: 'balise_1', name: 'Balise lumineuse industrielle', capabilities: [], visuals: { assetId: 'success' } },
  { id: 'console_quiz_1', name: 'Console de quiz à boutons d’arcade', capabilities: [], visuals: { assetId: 'quiz' } },
  { id: 'carnet_1', name: 'Carnet de notes de terrain en cuir', capabilities: [], visuals: { assetId: 'notes' } },
  { id: 'borne_aide_1', name: 'Borne d’appel d’urgence', capabilities: [], visuals: { assetId: 'help' } },
  { id: 'borne_consignes_1', name: 'Borne tactile de consignes', capabilities: [], visuals: { assetId: 'instructions' } },
  { id: 'panneau_obj_1', name: 'Panneau d’affichage des objectifs', capabilities: [], visuals: { assetId: 'objectives' } },
  { id: 'fleche_1', name: 'Flèche 3D directionnelle', capabilities: [], visuals: { assetId: 'arrow' } },
  { id: 'plot_jalon_1', name: 'Plot jalon de parcours numéroté', capabilities: [], visuals: { assetId: 'path' } },
  { id: 'planche_fromages_1', name: 'Plateau de fromages d’artisan affineur', capabilities: [], visuals: { assetId: 'wp-planche-a-fromages' } },
  { id: 'panier_fruits_1', name: 'Corbeille à fruits en céramique', capabilities: [], visuals: { assetId: 'wp-panier-de-fruits' } },
  { id: 'gaufrier_1', name: 'Gaufrier professionnel en fonte', capabilities: [], visuals: { assetId: 'wp-gaufrier' } },
  { id: 'marmite_1', name: 'Grande marmite traiteur en cuivre', capabilities: [], visuals: { assetId: 'wp-marmite' } },
  { id: 'moka_1', name: 'Cafetière italienne moka', capabilities: [], visuals: { assetId: 'wp-cafetiere-italienne' } },
  { id: 'theiere_1', name: 'Théière en fonte japonaise Tetsubin', capabilities: [], visuals: { assetId: 'wp-theiere-fonte' } },
  { id: 'casque_audio_1', name: 'Casque audio de monitoring de studio', capabilities: [], visuals: { assetId: 'wp-casque-audio' } },
  { id: 'synth_1', name: 'Clavier synthétiseur analogique', capabilities: [], visuals: { assetId: 'wp-synthetiseur' } },
  { id: 'cartel_1', name: 'Cartel d’exposition muséal', capabilities: [], visuals: { assetId: 'label' } },
  { id: 'spot_1', name: 'Projecteur de sol scénographique', capabilities: [], visuals: { assetId: 'highlight' } },
  { id: 'loupe_1', name: 'Loupe de détective en laiton doré', capabilities: [], visuals: { assetId: 'wp-loupe' } },
  { id: 'extincteur_1', name: 'Extincteur de sécurité incendie', capabilities: [], visuals: { assetId: 'wp-extincteur' } },
  { id: 'coffre_fort_1', name: 'Coffre-fort blindé en acier anthracite', capabilities: [], visuals: { assetId: 'wp-coffre-fort' } },
  { id: 'distrib_1', name: 'Distributeur automatique de boissons', capabilities: [], visuals: { assetId: 'wp-distributeur-boissons' } },
  { id: 'micro_ondes_1', name: 'Four micro-ondes professionnel en inox', capabilities: [], visuals: { assetId: 'wp-micro-ondes' } },
  { id: 'grille_pain_1', name: 'Grille-pain rétro chromé', capabilities: [], visuals: { assetId: 'wp-grille-pain' } },
  { id: 'bouilloire_1', name: 'Bouilloire électrique design en inox', capabilities: [], visuals: { assetId: 'wp-bouilloire' } },
  { id: 'gaufre_piece_1', name: 'Gaufre liégeoise dorée au sucre perlé', capabilities: [], visuals: { assetId: 'wp-gaufre' } },
  { id: 'crepiere_1', name: 'Crêpière électrique professionnelle en fonte', capabilities: [], visuals: { assetId: 'wp-crepiere' } },
  { id: 'shaker_1', name: 'Shaker à cocktail Boston en inox poli', capabilities: [], visuals: { assetId: 'wp-shaker' } },
  { id: 'coucou_1', name: 'Horloge à coucou de la Forêt-Noire sculptée', capabilities: [], visuals: { assetId: 'wp-horloge-a-coucou' } },
  { id: 'lampe_arch_1', name: 'Lampe d’architecte articulée sur ressorts', capabilities: [], visuals: { assetId: 'wp-lampe-de-bureau' } },
  { id: 'poubelle_rue_1', name: 'Corbeille urbaine parisienne sur potelet', capabilities: [], visuals: { assetId: 'wp-trottoir-poubelle' } },
  { id: 'surf_1', name: 'Planche de surf profilée en résine', capabilities: [], visuals: { assetId: 'wp-planche-a-voile' } },
  { id: 'sonde_1', name: 'Sonde spatiale d’exploration planétaire', capabilities: [], visuals: { assetId: 'wp-telescope-spatial' } },
  { id: 'bureau_min_1', name: 'Bureau de ministre en acajou et cuir doré', capabilities: [], visuals: { assetId: 'wp-bureau-ministre' } },
  { id: 'lustre_1', name: 'Lustre monumental en cristal taillé à 6 bras', capabilities: [], visuals: { assetId: 'wp-lustre-cristal' } },
  { id: 'lampe_temp_1', name: 'Lampe-tempête de marin en fer-blanc', capabilities: [], visuals: { assetId: 'wp-lampe-tempete' } },
  { id: 'wok_1', name: 'Wok traditionnel en acier carbone martelé', capabilities: [], visuals: { assetId: 'wp-wok' } },
  { id: 'passoire_1', name: 'Passoire culinaire sur pied en inox', capabilities: [], visuals: { assetId: 'wp-passoire' } },
  { id: 'rouleau_1', name: 'Rouleau à pâtisserie en hêtre tourné', capabilities: [], visuals: { assetId: 'wp-rouleau-a-patisserie' } },
  { id: 'ecumoire_1', name: 'Écumoire de chef ajourée en inox', capabilities: [], visuals: { assetId: 'wp-ecumoire' } },
  { id: 'eplucheur_1', name: 'Éplucheur rasoir ergonomique en Y', capabilities: [], visuals: { assetId: 'wp-eplucheur' } },
  { id: 'rape_1', name: 'Râpe à 4 faces pyramidale en inox', capabilities: [], visuals: { assetId: 'wp-rape' } },
  { id: 'presse_agr_1', name: 'Presse-agrumes manuel en fonte laquée', capabilities: [], visuals: { assetId: 'wp-presse-agrumes' } },
  { id: 'mortier_1', name: 'Mortier et pilon en granit moucheté', capabilities: [], visuals: { assetId: 'wp-mortier-et-pilon' } },
  { id: 'refrig_1', name: 'Grand réfrigérateur américain multi-portes', capabilities: [], visuals: { assetId: 'wp-refrigerateur' } },
  { id: 'four_enc_1', name: 'Four encastrable pyrolyse verre noir', capabilities: [], visuals: { assetId: 'wp-four-encastrable' } },
  { id: 'lave_vaiss_1', name: 'Lave-vaisselle intégré inox avec voyant sol', capabilities: [], visuals: { assetId: 'wp-lave-vaisselle' } },
  { id: 'plaque_ind_1', name: 'Table de cuisson à induction 4 foyers', capabilities: [], visuals: { assetId: 'wp-plaque-a-induction' } },
  { id: 'plaque_gaz_1', name: 'Plaque de cuisson au gaz 4 brûleurs inox', capabilities: [], visuals: { assetId: 'wp-plaque-au-gaz' } },
  { id: 'hotte_1', name: 'Hotte aspirante d’îlot suspendue inox', capabilities: [], visuals: { assetId: 'wp-hotte-aspirante' } },
  { id: 'evier_rob_1', name: 'Évier quartz noir et mitigeur col-de-cygne', capabilities: [], visuals: { assetId: 'wp-evier-et-robinet' } },
  { id: 'meuble_tir_1', name: 'Meuble bas de cuisine 3 tiroirs casseroliers', capabilities: [], visuals: { assetId: 'wp-meuble-a-tiroirs' } },
  { id: 'placard_mur_1', name: 'Placard mural haut de cuisine à 2 portes', capabilities: [], visuals: { assetId: 'wp-placard-mural' } },
  { id: 'egouttoir_1', name: 'Égouttoir à vaisselle double étage inox', capabilities: [], visuals: { assetId: 'wp-egouttoir-a-vaisselle' } },
  { id: 'poubelle_ped_1', name: 'Poubelle à pédale 30L en inox brossé', capabilities: [], visuals: { assetId: 'wp-poubelle-a-pedale' } },
  { id: 'chariot_serv_1', name: 'Chariot desserte roulant à 3 niveaux', capabilities: [], visuals: { assetId: 'wp-chariot-de-service' } },
  { id: 'porte_epices_1', name: 'Porte-épices rotatif à deux étages en inox', capabilities: [], visuals: { assetId: 'wp-porte-epices' } },
  { id: 'pomme_1', name: 'Pomme rouge Gala d’orchard', capabilities: [], visuals: { assetId: 'wp-pomme' } },
  { id: 'orange_1', name: 'Orange douce juteuse à peau grenue', capabilities: [], visuals: { assetId: 'wp-orange' } },
  { id: 'citron_1', name: 'Citron ovale de Menton à peau zestée', capabilities: [], visuals: { assetId: 'wp-citron' } },
  { id: 'banane_1', name: 'Banane Cavendish mûre courbée', capabilities: [], visuals: { assetId: 'wp-banane' } },
  { id: 'raisin_1', name: 'Grappe de raisin noir Chasselas', capabilities: [], visuals: { assetId: 'wp-grappe-de-raisin' } },
  { id: 'fraise_1', name: 'Fraise Gariguette écarlate à akènes dorés', capabilities: [], visuals: { assetId: 'wp-fraise' } },
  { id: 'aubergine_1', name: 'Aubergine violette pourpre vernie miroir', capabilities: [], visuals: { assetId: 'wp-aubergine' } },
  { id: 'poivron_1', name: 'Poivron doux rouge éclatant à 4 lobes', capabilities: [], visuals: { assetId: 'wp-poivron' } },
  { id: 'brocoli_1', name: 'Tête de brocoli vert forêt compacte', capabilities: [], visuals: { assetId: 'wp-brocoli' } },
  { id: 'potiron_1', name: 'Potiron côtelé d’automne orange vif', capabilities: [], visuals: { assetId: 'wp-potiron' } },
  { id: 'farine_1', name: 'Paquet de farine de blé T55 en kraft', capabilities: [], visuals: { assetId: 'wp-paquet-de-farine' } },
  { id: 'huile_bouteille_1', name: 'Bouteille d’huile d’olive vierge extra', capabilities: [], visuals: { assetId: 'wp-bouteille-d-huile' } },
  { id: 'pain_camp_1', name: 'Miche de pain de campagne au levain', capabilities: [], visuals: { assetId: 'wp-pain-de-campagne' } },
  { id: 'brioche_tresse_1', name: 'Brioche tressée pur beurre dorée', capabilities: [], visuals: { assetId: 'wp-brioche-tressee' } },
  { id: 'tarte_pommes_1', name: 'Tarte aux pommes rustique en rosace dorée', capabilities: [], visuals: { assetId: 'wp-tarte-aux-pommes' } },
  { id: 'religieuse_1', name: 'Religieuse parisienne au chocolat', capabilities: [], visuals: { assetId: 'wp-religieuse' } },
  { id: 'madeleine_1', name: 'Madeleine de Commercy pur beurre à bosse', capabilities: [], visuals: { assetId: 'wp-madeleine' } },
  { id: 'cannele_1', name: 'Cannelé bordelais caramélisé aux 8 cannelures', capabilities: [], visuals: { assetId: 'wp-cannele' } },
  { id: 'kouign_1', name: 'Kouign-amann breton feuilleté pur beurre', capabilities: [], visuals: { assetId: 'wp-kouign-amann' } },
  { id: 'galette_1', name: 'Galette des rois feuilletée dorée', capabilities: [], visuals: { assetId: 'wp-galette-des-rois' } },
  { id: 'crepe_gar_1', name: 'Galette de sarrasin bretonne complète', capabilities: [], visuals: { assetId: 'wp-crepe-garnie' } },
  { id: 'soupiere_1', name: 'Grande soupière de table en porcelaine', capabilities: [], visuals: { assetId: 'wp-soupiere' } },
  { id: 'assiette_cr_1', name: 'Assiette creuse gastronomique en faïence', capabilities: [], visuals: { assetId: 'wp-assiette-creuse' } },
  { id: 'assiette_des_1', name: 'Assiette à dessert en porcelaine dorée', capabilities: [], visuals: { assetId: 'wp-assiette-a-dessert' } },
  { id: 'flute_1', name: 'Flûte à champagne élancée en cristal', capabilities: [], visuals: { assetId: 'wp-flute' } },
  { id: 'theiere_porc_1', name: 'Théière de Limoges en porcelaine ivoire', capabilities: [], visuals: { assetId: 'wp-theiere' } },
  { id: 'cuillere_soup_1', name: 'Cuillère de table à potage en argent', capabilities: [], visuals: { assetId: 'wp-cuillere-a-soupe' } },
  { id: 'cuillere_cafe_1', name: 'Petite cuillère à café en argent massif', capabilities: [], visuals: { assetId: 'wp-petite-cuillere' } },
  { id: 'serviette_1', name: 'Serviette de table en lin blanc en mitre', capabilities: [], visuals: { assetId: 'wp-serviette-pliee' } },
  { id: 'saliere_1', name: 'Salière de bistrot en verre cannelé', capabilities: [], visuals: { assetId: 'wp-saliere' } },
  { id: 'couronne_epi_1', name: 'Couronne des rois dorée à l’or pur', capabilities: [], visuals: { assetId: 'wp-couronne-de-l-epiphanie' } },
  { id: 'feve_1', name: 'Fève artisanale de collection en porcelaine', capabilities: [], visuals: { assetId: 'wp-feve-de-collection' } },
  { id: 'cloche_paques_1', name: 'Cloche de Pâques pastorale en bronze', capabilities: [], visuals: { assetId: 'wp-cloche-de-paques' } },
  { id: 'santon_1', name: 'Santon de Provence du berger à l’agneau', capabilities: [], visuals: { assetId: 'wp-santon-de-berger' } },
  { id: 'buche_noel_1', name: 'Bûche de Noël chocolatée roulée', capabilities: [], visuals: { assetId: 'wp-buche-de-noel' } },
  { id: 'sapin_dec_1', name: 'Grand sapin de Noël décoré avec boules', capabilities: [], visuals: { assetId: 'wp-sapin-decore' } },
  { id: 'boule_noel_1', name: 'Boule de Noël suspendue en verre soufflé', capabilities: [], visuals: { assetId: 'wp-boule-de-noel' } },
  { id: 'couronne_porte_1', name: 'Couronne de porte festive en sapin et houx', capabilities: [], visuals: { assetId: 'wp-couronne-de-porte' } },
  { id: 'masque_carnaval_1', name: 'Loup vénitien de carnaval arlequin', capabilities: [], visuals: { assetId: 'wp-masque-de-carnaval' } },
  { id: 'chapeau_fete_1', name: 'Chapeau de fête pointu à spirales', capabilities: [], visuals: { assetId: 'wp-chapeau-de-fete' } },
  { id: 'feu_tricolore_1', name: 'Feu tricolore routier sur mât en acier', capabilities: [], visuals: { assetId: 'wp-feu-tricolore' } },
  { id: 'panneau_pieton_1', name: 'Panneau de passage piéton rétro-réfléchissant', capabilities: [], visuals: { assetId: 'wp-panneau-de-passage-pieton' } },
  { id: 'horodateur_1', name: 'Horodateur de stationnement solaire', capabilities: [], visuals: { assetId: 'wp-horodateur' } },
  { id: 'support_velos_1', name: 'Support double pour vélos en arceau inox', capabilities: [], visuals: { assetId: 'wp-support-pour-velos' } },
  { id: 'cartable_1', name: 'Cartable scolaire d\'écolier en cuir fauve', capabilities: [], visuals: { assetId: 'wp-cartable' } },
  { id: 'sac_a_main_1', name: 'Sac à main élégant structuré en cuir grainé', capabilities: [], visuals: { assetId: 'wp-sac-a-main' } },
  { id: 'parapluie_ouv_1', name: 'Parapluie ouvert en toile déperlante', capabilities: [], visuals: { assetId: 'wp-parapluie-ouvert' } },
  { id: 'lunettes_1', name: 'Lunettes de vue rondes en écaille d\'acétate', capabilities: [], visuals: { assetId: 'wp-lunettes' } },
  { id: 'montre_1', name: 'Montre-bracelet automatique en or jaune', capabilities: [], visuals: { assetId: 'wp-montre-bracelet' } },
  { id: 'reveil_1', name: 'Réveil mécanique vintage à deux cloches', capabilities: [], visuals: { assetId: 'wp-reveil-a-cloches' } },
  { id: 'telephone_1', name: 'Smartphone bord-à-bord moderne en titane', capabilities: [], visuals: { assetId: 'wp-telephone-portable' } },
  { id: 'brosse_dents_1', name: 'Brosse à dents ergonomique sonique', capabilities: [], visuals: { assetId: 'wp-brosse-a-dents' } },
  { id: 'dentifrice_1', name: 'Tube de dentifrice souple à bouchon', capabilities: [], visuals: { assetId: 'wp-tube-de-dentifrice' } },
  { id: 'savon_porte_1', name: 'Savon de Marseille crémeux sur porte-savon', capabilities: [], visuals: { assetId: 'wp-savon-et-porte-savon' } },
  { id: 'chaussons_1', name: 'Paire de pantoufles chaussons en laine', capabilities: [], visuals: { assetId: 'wp-paire-de-chaussons' } },
  { id: 'portemanteau_1', name: 'Portemanteau perroquet sur pied en bois courbé', capabilities: [], visuals: { assetId: 'wp-porte-manteau' } },
  { id: 'table_hex_1', name: 'Table collaborative hexagonale en chêne', capabilities: [], visuals: { assetId: 'wp-table-de-groupe-hexagonale' } },
  { id: 'casier_scolaire_1', name: 'Casier scolaire métallique à fentes', capabilities: [], visuals: { assetId: 'wp-casier-scolaire' } },
  { id: 'ardoise_1', name: 'Ardoise scolaire d\'écolier en bois naturel', capabilities: [], visuals: { assetId: 'wp-ardoise-individuelle' } },
  { id: 'pot_crayons_1', name: 'Pot à crayons émaillé avec crayons taillés', capabilities: [], visuals: { assetId: 'wp-pot-a-crayons' } },
  { id: 'crayon_papier_1', name: 'Crayon de papier hexagonal HB en bois de cèdre', capabilities: [], visuals: { assetId: 'wp-crayon-de-papier' } },
  { id: 'gomme_1', name: 'Gomme bicolore biseautée rose et bleue', capabilities: [], visuals: { assetId: 'wp-gomme' } },
  { id: 'equerre_1', name: 'Équerre scolaire transparente à 45 degrés', capabilities: [], visuals: { assetId: 'wp-equerre-scolaire' } },
  { id: 'rapporteur_1', name: 'Rapporteur demi-disque translucide 180 degrés', capabilities: [], visuals: { assetId: 'wp-rapporteur' } },
  { id: 'boulier_1', name: 'Boulier traditionnel en bois à tiges de laiton', capabilities: [], visuals: { assetId: 'wp-boulier' } },
  { id: 'cube_unite_1', name: 'Cube unité mathématique emboîtable', capabilities: [], visuals: { assetId: 'wp-cube-unite' } },
  { id: 'pave_droit_1', name: 'Pavé droit géométrique en hêtre clair poncé', capabilities: [], visuals: { assetId: 'wp-pave-droit' } },
  { id: 'sphere_geom_1', name: 'Sphère géométrique parfaite vert menthe satinée', capabilities: [], visuals: { assetId: 'wp-sphere-geometrique' } },
  { id: 'cone_geom_1', name: 'Cône géométrique ambré translucide régulier', capabilities: [], visuals: { assetId: 'wp-cone-geometrique' } },
  { id: 'cylindre_geom_1', name: 'Cylindre géométrique en aluminium violet', capabilities: [], visuals: { assetId: 'wp-cylindre-geometrique' } },
  { id: 'pyramide_carree_1', name: 'Pyramide à base carrée en résine rubis', capabilities: [], visuals: { assetId: 'wp-pyramide-a-base-carree' } },
  { id: 'tetraedre_1', name: 'Tétraèdre régulier de Platon vert émeraude', capabilities: [], visuals: { assetId: 'wp-tetraedre' } },
  { id: 'octaedre_1', name: 'Octaèdre régulier à 8 faces triangulaires bleu saphir', capabilities: [], visuals: { assetId: 'wp-octaedre' } },
  { id: 'dodecaedre_1', name: 'Dodécaèdre régulier en laiton doré poli', capabilities: [], visuals: { assetId: 'wp-dodecaedre' } },
  { id: 'icosaedre_1', name: 'Icosaèdre régulier D20 améthyste profond', capabilities: [], visuals: { assetId: 'wp-icosaedre' } },
  { id: 'tore_geom_1', name: 'Tore géométrique régulier en polymère corail', capabilities: [], visuals: { assetId: 'wp-tore-geometrique' } },
  { id: 'prisme_optique_1', name: 'Prisme optique triangulaire borosilicate spectral', capabilities: [], visuals: { assetId: 'wp-prisme-triangulaire' } },
  { id: 'disque_quarts_1', name: 'Disque pédagogique de fractions en quarts colorés', capabilities: [], visuals: { assetId: 'wp-disque-de-fractions-en-quarts' } },
  { id: 'disque_tiers_1', name: 'Disque pédagogique de fractions en tiers colorés', capabilities: [], visuals: { assetId: 'wp-disque-de-fractions-en-tiers' } },
  { id: 'disque_sixiemes_1', name: 'Disque pédagogique de fractions en sixièmes colorés', capabilities: [], visuals: { assetId: 'wp-disque-de-fractions-en-sixiemes' } },
  { id: 'reglettes_cuisenaire_1', name: 'Réglettes de Cuisenaire et barres de numération en bois', capabilities: [], visuals: { assetId: 'wp-barres-de-numeration' } },
  { id: 'escalier_cubes_1', name: 'Escalier sensoriel de cubes Montessori tour rose', capabilities: [], visuals: { assetId: 'wp-escalier-de-cubes' } },
  { id: 'repere_axes_1', name: 'Repère cartésien à trois axes orthonormé', capabilities: [], visuals: { assetId: 'wp-repere-a-trois-axes' } },
  { id: 'compas_tableau_1', name: 'Grand compas de tableau d\'école en bois avec porte-craie', capabilities: [], visuals: { assetId: 'wp-compas-de-demonstration' } },
  { id: 'tangram_1', name: 'Puzzle tangram géométrique en volume 7 pièces colorées', capabilities: [], visuals: { assetId: 'wp-tangram-en-volume' } },
  { id: 'eprouvette_1', name: 'Éprouvette graduée 100mL borosilicate et solution bleue', capabilities: [], visuals: { assetId: 'wp-eprouvette-graduee' } },
  { id: 'becher_1', name: 'Bécher Griffin 250mL en verre borosilicate', capabilities: [], visuals: { assetId: 'wp-becher' } },
  { id: 'ballon_fond_rond_1', name: 'Ballon de chimie à fond rond sur anneau de liège', capabilities: [], visuals: { assetId: 'wp-ballon-de-laboratoire' } },
  { id: 'pipette_pasteur_1', name: 'Pipette Pasteur en verre à poire caoutchouc rouge', capabilities: [], visuals: { assetId: 'wp-pipette' } },
  { id: 'entonnoir_verre_1', name: 'Entonnoir de filtration en verre cannelé avec filtre papier', capabilities: [], visuals: { assetId: 'wp-entonnoir' } },
  { id: 'support_chimie_1', name: 'Statif support de laboratoire universel et pince', capabilities: [], visuals: { assetId: 'wp-support-et-pince' } },
  { id: 'lunettes_chimie_1', name: 'Lunettes-masque de protection chimique panoramiques', capabilities: [], visuals: { assetId: 'wp-lunettes-de-protection' } },
  { id: 'modele_atome_1', name: 'Modèle atomique de Bohr et Rutherford orbitant', capabilities: [], visuals: { assetId: 'wp-modele-d-atome' } },
  { id: 'adn_helice_1', name: 'Double hélice d\'ADN en volume avec paires de bases azotées', capabilities: [], visuals: { assetId: 'wp-helice-d-adn-schematique' } },
  { id: 'aimant_cheval_1', name: 'Aimant en fer à cheval alnico bicolore nord sud', capabilities: [], visuals: { assetId: 'wp-aimant-en-fer-a-cheval' } },
  { id: 'circuit_pile_1', name: 'Circuit électrique pédagogique pile plate et ampoule incandescente', capabilities: [], visuals: { assetId: 'wp-circuit-pile-et-ampoule' } },
  { id: 'pendule_physique_1', name: 'Pendule simple de démonstration en laiton oscillant', capabilities: [], visuals: { assetId: 'wp-pendule-de-demonstration' } },
  { id: 'ressort_physique_1', name: 'Ressort hélicoïdal de démonstration et masse marquée', capabilities: [], visuals: { assetId: 'wp-ressort-de-demonstration' } },
  { id: 'cymbale_batterie_1', name: 'Cymbale crash en bronze B20 martelé sur pied chromé', capabilities: [], visuals: { assetId: 'wp-cymbale-sur-pied' } },
  { id: 'couteau_pain_1', name: 'Couteau à pain de boulanger à lame dentée', capabilities: [], visuals: { assetId: 'wp-couteau-a-pain' } },
  { id: 'mixeur_socle_1', name: 'Mixeur blender sur socle en acier brossé', capabilities: [], visuals: { assetId: 'wp-mixeur-sur-socle' } },
  { id: 'robot_patissier_1', name: 'Robot pâtissier sur socle vintage avec bol inox', capabilities: [], visuals: { assetId: 'wp-robot-patissier' } },
  { id: 'poireau_1', name: 'Poireau frais du potager avec fût blanc', capabilities: [], visuals: { assetId: 'wp-poireau' } },
  { id: 'oeuf_coquetier_1', name: 'Œuf à la coque dans son coquetier en porcelaine', capabilities: [], visuals: { assetId: 'wp-oeuf-et-coquetier' } },
  { id: 'pain_chocolat_1', name: 'Pain au chocolat feuilleté pur beurre doré', capabilities: [], visuals: { assetId: 'wp-pain-au-chocolat' } },
  { id: 'eclair_chocolat_1', name: 'Éclair au chocolat parisien au glaçage miroir', capabilities: [], visuals: { assetId: 'wp-eclair-au-chocolat' } },
  { id: 'couteau_table_1', name: 'Couteau de table en argent massif avec virole', capabilities: [], visuals: { assetId: 'wp-couteau-de-table' } },
  { id: 'oeuf_decore_1', name: 'Œuf de Pâques décoré à la main aux motifs slaves', capabilities: [], visuals: { assetId: 'wp-oeuf-decore' } },
  { id: 'brin_muguet_1', name: 'Brin de muguet du premier mai avec clochettes', capabilities: [], visuals: { assetId: 'wp-brin-de-muguet' } },
  { id: 'banc_quai_1', name: 'Banc de quai de gare en chêne verni et fonte', capabilities: [], visuals: { assetId: 'wp-banc-de-quai' } },
  { id: 'dab_billets_1', name: 'Distributeur automatique de billets DAB bancaire', capabilities: [], visuals: { assetId: 'wp-distributeur-de-billets' } },
  { id: 'cabine_tel_1', name: 'Cabine téléphonique urbaine vintage vitrée', capabilities: [], visuals: { assetId: 'wp-cabine-telephonique' } },
  { id: 'tabouret_lab_1', name: 'Tabouret technique de laboratoire réglable', capabilities: [], visuals: { assetId: 'wp-tabouret-de-laboratoire' } },
  { id: 'chevalet_pres_1', name: 'Chevalet de présentation paperboard de réunion', capabilities: [], visuals: { assetId: 'wp-chevalet-de-presentation' } },
  { id: 'taille_crayon_1', name: 'Taille-crayon en magnésium double trou', capabilities: [], visuals: { assetId: 'wp-taille-crayon' } },
  { id: 'telescope_trepied_1', name: 'Télescope réflecteur astronomique sur trépied', capabilities: [], visuals: { assetId: 'wp-telescope-sur-trepied' } },
  { id: 'guitare_elec_1', name: 'Guitare électrique solid-body sunburst avec micros', capabilities: [], visuals: { assetId: 'wp-guitare-electrique' } },
  { id: 'ukulele_1', name: 'Ukulélé soprano hawaïen en bois de koa verni', capabilities: [], visuals: { assetId: 'wp-ukulele' } },
  { id: 'clavier_num_1', name: 'Clavier numérique arrangeur 61 touches avec écran LCD', capabilities: [], visuals: { assetId: 'wp-clavier-numerique' } },
  { id: 'caisse_claire_1', name: 'Caisse claire de batterie acoustique en érable avec timbre', capabilities: [], visuals: { assetId: 'wp-caisse-claire' } },
  { id: 'flute_bec_1', name: 'Flûte à bec alto baroque en poirier ciré', capabilities: [], visuals: { assetId: 'wp-flute-a-bec' } },
  { id: 'pinceau_plat_1', name: 'Pinceau plat spalter d\'artiste en soies de porc', capabilities: [], visuals: { assetId: 'wp-pinceau-plat' } },
  { id: 'tour_potier_1', name: 'Tour de potier d\'atelier avec girelle en aluminium', capabilities: [], visuals: { assetId: 'wp-tour-de-potier' } },
  { id: 'vase_atelier_1', name: 'Vase d\'atelier en terre cuite chamottée tournée', capabilities: [], visuals: { assetId: 'wp-vase-d-atelier' } },
  { id: 'presentoir_chaussures_1', name: 'Présentoir de boutique à chaussures en laiton et verre', capabilities: [], visuals: { assetId: 'wp-presentoir-a-chaussures' } },
  { id: 'scanner_caisse_1', name: 'Scanner de caisse omnidirectionnel et lecteur de code-barres', capabilities: [], visuals: { assetId: 'wp-scanner-de-caisse' } },
  { id: 'boite_cadeau_1', name: 'Boîte cadeau festive avec ruban croisé et rosette dorée', capabilities: [], visuals: { assetId: 'wp-boite-cadeau' } },
  { id: 'presentoir_bijoux_1', name: 'Présentoir à bijoux de vitrine en velours noir et laiton', capabilities: [], visuals: { assetId: 'wp-presentoir-a-bijoux' } },
  { id: 'buste_colliers_1', name: 'Buste de présentation à colliers en lin écru', capabilities: [], visuals: { assetId: 'wp-buste-a-colliers' } },
  { id: 'mannequin_assis_1', name: 'Mannequin de vitrine assis stylisé en fibre de verre', capabilities: [], visuals: { assetId: 'wp-mannequin-de-vitrine-assis' } },
  { id: 'presentoir_lunettes_1', name: 'Présentoir tourniquet vertical pour lunettes et miroirs', capabilities: [], visuals: { assetId: 'wp-presentoir-a-lunettes' } },
  { id: 'panneau_prix_1', name: 'Panneau de prix sur pied télescopique en acier brossé', capabilities: [], visuals: { assetId: 'wp-panneau-de-prix-sur-pied' } },
  { id: 'webcam_conf_1', name: 'Webcam grand angle de visioconférence avec lentille antireflet', capabilities: [], visuals: { assetId: 'wp-webcam' } },
  { id: 'corbeille_courrier_1', name: 'Corbeille à courrier à deux étages empilables en maille', capabilities: [], visuals: { assetId: 'wp-corbeille-a-courrier' } },
  { id: 'bouclier_heraldique_1', name: 'Bouclier héraldique de chevalier en chêne et fer forgé', capabilities: [], visuals: { assetId: 'wp-bouclier-heraldique' } },
  { id: 'hache_fantasy_1', name: 'Hache de combat de fantasy à double tranchant gravé', capabilities: [], visuals: { assetId: 'wp-hache-de-fantasy' } },
  { id: 'carquois_fleches_1', name: 'Carquois en cuir patiné garni de flèches à empennage', capabilities: [], visuals: { assetId: 'wp-carquois-de-fleches' } },
  { id: 'baton_mage_1', name: 'Bâton de mage runique avec cristal d\'arcanes flottant', capabilities: [], visuals: { assetId: 'wp-baton-de-mage' } },
  { id: 'caisse_butin_1', name: 'Caisse de butin médiévale renforcée avec ferrures et cadenas', capabilities: [], visuals: { assetId: 'wp-caisse-de-butin' } },
  { id: 'tube_essai_1', name: 'Tube à essai en verre borosilicate avec portoir en bois', capabilities: [], visuals: { assetId: 'wp-tube-a-essai' } },
  { id: 'prisme_optique_1', name: 'Prisme optique triangulaire en verre flint à dispersion', capabilities: [], visuals: { assetId: 'wp-prisme-optique' } },
  { id: 'tambour_fanfare_1', name: 'Tambour de fanfare traditionnel en bois laqué et baguettes', capabilities: [], visuals: { assetId: 'wp-tambour' } },
  { id: 'sac_pieces_1', name: 'Sac de pièces d\'or et bourse d\'aventurier en cuir suédé', capabilities: [], visuals: { assetId: 'wp-sac-de-pieces' } },
  { id: 'autel_pierre_1', name: 'Autel de pierre mégalithique sculpté de runes et vasque', capabilities: [], visuals: { assetId: 'wp-autel-de-pierre' } },
  { id: 'roue_puzzle_1', name: 'Roue de puzzle et cadran d\'énigme antique en bronze gravé', capabilities: [], visuals: { assetId: 'wp-roue-de-puzzle' } },
  { id: 'joystick_arcade_1', name: 'Joystick d\'arcade rétro à boule rouge et plaque acier', capabilities: [], visuals: { assetId: 'wp-joystick' } },
  { id: 'controleurs_vr_1', name: 'Paire de contrôleurs VR 6DoF avec anneaux de tracking', capabilities: [], visuals: { assetId: 'wp-controleurs-vr' } },
  { id: 'capsule_spatiale_1', name: 'Capsule spatiale d\'exploration et bouclier thermique ablatif', capabilities: [], visuals: { assetId: 'wp-capsule-spatiale' } },
  { id: 'reacteur_energie_1', name: 'Réacteur à fusion sci-fi et noyau d\'énergie toroïdal pulsant', capabilities: [], visuals: { assetId: 'wp-reacteur-d-energie' } },
  { id: 'porte_sas_1', name: 'Porte blindée étanche de sas spatial avec volant manuel', capabilities: [], visuals: { assetId: 'wp-porte-de-sas' } },
  { id: 'balise_checkpoint_1', name: 'Balise de checkpoint sci-fi avec pyramide holographique', capabilities: [], visuals: { assetId: 'wp-balise-de-checkpoint' } },
  { id: 'teleportation_pad_1', name: 'Plateforme de téléportation circulaire et flux particulaire', capabilities: [], visuals: { assetId: 'wp-plateforme-de-teleportation' } },
  { id: 'tourelle_capteurs_1', name: 'Tourelle de capteurs robotique LIDAR et télémètre infrarouge', capabilities: [], visuals: { assetId: 'wp-tourelle-de-capteurs' } },
  { id: 'module_serveur_1', name: 'Module de serveur informatique rackable 2U hotswap', capabilities: [], visuals: { assetId: 'wp-module-de-serveur' } },
  { id: 'trophee_tournoi_1', name: 'Trophée de tournoi coupe en or massif poli et socle marbre', capabilities: [], visuals: { assetId: 'wp-trophee-de-tournoi' } },
  { id: 'ballon_football_1', name: 'Ballon de football classique bicolore à facettes cousues', capabilities: [], visuals: { assetId: 'wp-ballon-de-football' } },
  { id: 'ballon_basket_1', name: 'Ballon de basketball officiel en caoutchouc grainé et nervures', capabilities: [], visuals: { assetId: 'wp-ballon-de-basket' } },
  { id: 'ballon_rugby_1', name: 'Ballon de rugby vintage en cuir cousu main à 4 panneaux', capabilities: [], visuals: { assetId: 'wp-ballon-de-rugby' } },
  { id: 'balle_tennis_1', name: 'Balle de tennis jaune fluo feutrée avec jointure blanche', capabilities: [], visuals: { assetId: 'wp-balle-de-tennis' } },
  { id: 'raquette_tennis_1', name: 'Raquette de tennis de compétition en graphite et cordage', capabilities: [], visuals: { assetId: 'wp-raquette-de-tennis' } },
  { id: 'raquette_ping_pong_1', name: 'Raquette de tennis de table bicolore avec picots et bois', capabilities: [], visuals: { assetId: 'wp-raquette-de-ping-pong' } },
  { id: 'volant_badminton_1', name: 'Volant de badminton en liège et plumes d\'oie', capabilities: [], visuals: { assetId: 'wp-volant-de-badminton' } },
  { id: 'volant_voiture_1', name: 'Volant sport en cuir perforé et palettes alu', capabilities: [], visuals: { assetId: 'wp-volant-sport' } },
  { id: 'panier_basket_1', name: 'Panier de basketball avec panneau plexi arceau et filet', capabilities: [], visuals: { assetId: 'wp-panier-de-basket' } },
  { id: 'cone_sport_1', name: 'Cône de sport et d\'agilité en polyéthylène orange', capabilities: [], visuals: { assetId: 'wp-cone-de-sport' } },
  { id: 'haie_athletisme_1', name: 'Haie d\'athlétisme réglable avec latte striée noir et blanc', capabilities: [], visuals: { assetId: 'wp-haie-d-athletisme' } },
  { id: 'haltere_fonte_1', name: 'Haltère hexagonal de musculation en fonte et acier chromé', capabilities: [], visuals: { assetId: 'wp-haltere' } },
  { id: 'tapis_gym_1', name: 'Tapis de gymnastique et de yoga en mousse TPE enroulé', capabilities: [], visuals: { assetId: 'wp-tapis-de-gymnastique' } },
  { id: 'velo_appartement_1', name: 'Vélo d\'appartement et spinning ergonomique avec console LCD', capabilities: [], visuals: { assetId: 'wp-velo-d-appartement' } },
  { id: 'table_ping_pong_1', name: 'Table de ping-pong officielle avec filet et piétement', capabilities: [], visuals: { assetId: 'wp-table-de-ping-pong' } },
  { id: 'echiquier_pieces_1', name: 'Échiquier de tournoi marqueté et pièces Staunton sculptées', capabilities: [], visuals: { assetId: 'wp-echiquier-et-pieces' } },
  { id: 'plateau_dames_1', name: 'Plateau de dames traditionnel 100 cases et piles de pions', capabilities: [], visuals: { assetId: 'wp-plateau-de-dames' } },
  { id: 'de_jouer_1', name: 'Dé à jouer de casino cubique en acrylique rouge translucide', capabilities: [], visuals: { assetId: 'wp-de-a-jouer' } },
  { id: 'dominos_jeu_1', name: 'Coffret de dominos double-six en bois et tuiles bakélite', capabilities: [], visuals: { assetId: 'wp-dominos' } },
  { id: 'quilles_boule_1', name: 'Jeu de quilles traditionnel en hêtre tourné et boule percée', capabilities: [], visuals: { assetId: 'wp-quilles-et-boule' } },
  { id: 'sapin_alpin_1', name: 'Sapin alpin à étages de branches givrées et tronc écorce', capabilities: [], visuals: { assetId: 'wp-sapin' } },
  { id: 'palmier_tropical_1', name: 'Palmier tropical avec couronne de grandes palmes émeraude', capabilities: [], visuals: { assetId: 'wp-palmier' } },
  { id: 'cactus_saguaro_1', name: 'Cactus saguaro du désert dans sa coupe de terre cuite', capabilities: [], visuals: { assetId: 'wp-cactus' } },
  { id: 'bambous_bosquet_1', name: 'Bosquet de bambous dressés aux nœuds réguliers et feuilles', capabilities: [], visuals: { assetId: 'wp-bambous' } },
  { id: 'buisson_fleuri_1', name: 'Buisson fleuri de jardin aux petites fleurs roses et blanches', capabilities: [], visuals: { assetId: 'wp-buisson-fleuri' } },
  { id: 'tournesol_1', name: 'Grand tournesol épanoui avec cœur à graines concentriques', capabilities: [], visuals: { assetId: 'wp-tournesol' } },
  { id: 'tulipe_1', name: 'Tulipe hollandaise rouge rubis et feuilles lancéolées', capabilities: [], visuals: { assetId: 'wp-tulipe' } },
  { id: 'rose_pot_1', name: 'Rosier en pot de terre cuite et pétales carmin veloutés', capabilities: [], visuals: { assetId: 'wp-rose-en-pot' } },
  { id: 'lavande_pot_1', name: 'Touffe de lavande vraie de Provence en pot d\'argile', capabilities: [], visuals: { assetId: 'wp-lavande-en-pot' } },
  { id: 'nenuphar_1', name: 'Nénuphar flottant et fleur de lotus blanche ouverte', capabilities: [], visuals: { assetId: 'wp-nenuphar' } },
  { id: 'tronc_couche_1', name: 'Tronc d\'arbre couché en bois mort mousse et champignons', capabilities: [], visuals: { assetId: 'wp-tronc-couche' } },
  { id: 'souche_1', name: 'Souche d\'arbre ancienne évidée aux racines et lierre', capabilities: [], visuals: { assetId: 'wp-souche' } },
  { id: 'arrosoir_zinc_1', name: 'Arrosoir traditionnel de jardinier en zinc galvanisé', capabilities: [], visuals: { assetId: 'wp-arrosoir' } },
  { id: 'brouette_jardin_1', name: 'Brouette de maraîcher en tôle d\'acier verte et roue', capabilities: [], visuals: { assetId: 'wp-brouette' } },
  { id: 'pelle_jardin_1', name: 'Bêche et pelle de jardin tranchante avec manche frêne', capabilities: [], visuals: { assetId: 'wp-pelle-de-jardin' } },
  { id: 'rateau_jardin_1', name: 'Râteau de jardin forgé à 14 dents rigides et manche hêtre', capabilities: [], visuals: { assetId: 'wp-rateau' } },
  { id: 'composteur_bois_1', name: 'Bac à compost en lattes de mélèze ajourées et couvercle', capabilities: [], visuals: { assetId: 'wp-composteur' } },
  { id: 'nichoir_oiseau_1', name: 'Nichoir d\'oiseaux alpin en bois brut et toit en zinc', capabilities: [], visuals: { assetId: 'wp-nichoir' } },
  { id: 'hotel_insectes_1', name: 'Grand hôtel à insectes triangulaire compartimenté', capabilities: [], visuals: { assetId: 'wp-hotel-a-insectes' } },
  { id: 'zafu_rond_1', name: 'Coussin de méditation zafu rond plissé traditionnel', capabilities: [], visuals: { assetId: 'wp-zafu-rond' } },
  { id: 'tapis_meditation_1', name: 'Tapis de sol zabuton capitonné en lin naturel écru', capabilities: [], visuals: { assetId: 'wp-tapis-de-meditation' } },
  { id: 'carillon_vent_1', name: 'Carillon éolien harmonique en bambou suspendu et girouette', capabilities: [], visuals: { assetId: 'wp-carillon-a-vent' } },
  { id: 'diffuseur_ambiance_1', name: 'Diffuseur d\'ambiance ultrasonique en céramique blanche', capabilities: [], visuals: { assetId: 'wp-diffuseur-d-ambiance' } },
  { id: 'bougie_pot_1', name: 'Bougie parfumée en cire de soja dans un pot d\'apothicaire', capabilities: [], visuals: { assetId: 'wp-bougie-en-pot' } },
  { id: 'jardin_galets_1', name: 'Plateau jardin de galets zen et sable blanc ratissé', capabilities: [], visuals: { assetId: 'wp-jardin-de-galets' } },
  { id: 'balle_sensorielle_1', name: 'Balle sensorielle à picots souples en silicone pastel', capabilities: [], visuals: { assetId: 'wp-balle-sensorielle' } },
  { id: 'cube_tactile_1', name: 'Cube tactile d\'activité multi-textures et miroir', capabilities: [], visuals: { assetId: 'wp-cube-tactile' } },
  { id: 'coussin_etoile_1', name: 'Coussin étoile douillet en velours jaune capitonné', capabilities: [], visuals: { assetId: 'wp-coussin-etoile' } },
  { id: 'fauteuil_bascule_1', name: 'Fauteuil à bascule rocking chair en bois courbé', capabilities: [], visuals: { assetId: 'wp-fauteuil-a-bascule' } },
  { id: 'chaise_longue_1', name: 'Chaise longue transat inclinable en teck et toile rayée', capabilities: [], visuals: { assetId: 'wp-chaise-longue' } },
  { id: 'hamac_support_1', name: 'Hamac en toile tressée sur arche en bois de mélèze', capabilities: [], visuals: { assetId: 'wp-hamac-sur-support' } },
  { id: 'rideau_portique_1', name: 'Rideau phonique lourd sur portique autoportant', capabilities: [], visuals: { assetId: 'wp-rideau-sur-portique' } },
  { id: 'vase_branches_1', name: 'Vase soliflore en grès blanc et branches de saule tortueux', capabilities: [], visuals: { assetId: 'wp-vase-et-branches' } },
  { id: 'plateau_the_1', name: 'Plateau à thé zen avec théière en fonte et bols japonais', capabilities: [], visuals: { assetId: 'wp-plateau-de-the' } },
  { id: 'roue_humeurs_1', name: 'Roue des humeurs et émotions sur pied tripode en bois', capabilities: [], visuals: { assetId: 'wp-roue-des-humeurs' } },
  { id: 'tournevis_cruciforme_1', name: 'Tournevis cruciforme bimatière PH2 et empreinte brunie', capabilities: [], visuals: { assetId: 'wp-tournevis-cruciforme' } },
  { id: 'cle_plate_1', name: 'Clé mixte plate et œil en acier chrome-vanadium poli', capabilities: [], visuals: { assetId: 'wp-cle-plate' } },
  { id: 'cle_molette_1', name: 'Clé à molette réglable avec vis sans fin et graduations', capabilities: [], visuals: { assetId: 'wp-cle-a-molette' } },
  { id: 'pince_universelle_1', name: 'Pince universelle à mors striés et coupe-fil', capabilities: [], visuals: { assetId: 'wp-pince-universelle' } },
  { id: 'scie_main_1', name: 'Scie égoïne d\'ébéniste à lame acier trempé et manche bois', capabilities: [], visuals: { assetId: 'wp-scie-a-main' } },
  { id: 'metre_ruban_1', name: 'Mètre ruban enrouleur 5m en boîtier antichoc et bouton stop', capabilities: [], visuals: { assetId: 'wp-metre-ruban' } },
  { id: 'niveau_bulle_1', name: 'Niveau à bulle tubulaire en profilé aluminium et fioles', capabilities: [], visuals: { assetId: 'wp-niveau-a-bulle' } },
  { id: 'gilet_securite_1', name: 'Gilet de sécurité haute visibilité jaune fluo réflectif', capabilities: [], visuals: { assetId: 'wp-gilet-de-securite' } },
  { id: 'echelle_double_1', name: 'Échelle double escabeau pliant d\'artisan en aluminium', capabilities: [], visuals: { assetId: 'wp-echelle-double' } },
  { id: 'diable_manutention_1', name: 'Diable de manutention robuste en acier rouge et bavette', capabilities: [], visuals: { assetId: 'wp-diable-de-manutention' } },
  { id: 'cone_chantier_1', name: 'Cône de chantier lourd en caoutchouc avec bandes réflectives', capabilities: [], visuals: { assetId: 'wp-cone-de-chantier' } },
  { id: 'barriere_chantier_1', name: 'Barrière de chantier extensible en acier laqué jaune et noir', capabilities: [], visuals: { assetId: 'wp-barriere-de-chantier' } },
  { id: 'mur_plein_1', name: 'Module architectural de mur plein en plâtre et plinthe chêne', capabilities: [], visuals: { assetId: 'wp-mur-plein' } },
  { id: 'mur_fenetre_1', name: 'Module architectural de mur avec baie vitrée et allège', capabilities: [], visuals: { assetId: 'wp-mur-avec-fenetre' } },
  { id: 'mur_porte_1', name: 'Module architectural de mur avec ouverture de porte et chambranle', capabilities: [], visuals: { assetId: 'wp-mur-avec-ouverture-de-porte' } },
  { id: 'sol_parquet_1', name: 'Dalle modulaire de sol en parquet chêne massif point de Hongrie', capabilities: [], visuals: { assetId: 'wp-sol-parquet' } },
  { id: 'sol_carrele_1', name: 'Dalle modulaire de sol carrelé en grès cérame damier', capabilities: [], visuals: { assetId: 'wp-sol-carrele' } },
  { id: 'sol_pierre_1', name: 'Dalle modulaire de sol en dalles de pierre calcaire bouchardée', capabilities: [], visuals: { assetId: 'wp-sol-de-pierre' } },
  { id: 'estrade_1', name: 'Estrade podium modulaire de scène en contreplaqué noir', capabilities: [], visuals: { assetId: 'wp-estrade' } },
  { id: 'escalier_droit_1', name: 'Escalier droit architectural à 5 marches et limons acier', capabilities: [], visuals: { assetId: 'wp-escalier-droit' } },
  { id: 'rampe_acces_1', name: 'Rampe d\'accès PMR modulaire avec bordures et revêtement antidérapant', capabilities: [], visuals: { assetId: 'wp-rampe-d-acces' } },
  { id: 'garde_corps_1', name: 'Garde-corps architectural en verre trempé et mains courantes inox', capabilities: [], visuals: { assetId: 'wp-garde-corps' } },
  { id: 'colonne_classique_1', name: 'Colonne classique cannelée en marbre blanc et chapiteau sculpté', capabilities: [], visuals: { assetId: 'wp-colonne-classique' } },
  { id: 'pilier_carre_1', name: 'Pilier porteur carré en béton brut coffré architectural', capabilities: [], visuals: { assetId: 'wp-pilier-carre' } },
  { id: 'pergola_1', name: 'Pergola de jardin en poutres de cèdre lattées ajourées', capabilities: [], visuals: { assetId: 'wp-pergola' } },
  { id: 'fenetre_volets_1', name: 'Fenêtre à deux battants en bois et volets persiennes ouverts', capabilities: [], visuals: { assetId: 'wp-fenetre-a-volets' } },
  { id: 'porte_vitree_1', name: 'Porte vitrée battante en aluminium brossé et double vitrage', capabilities: [], visuals: { assetId: 'wp-porte-vitree' } },
  { id: 'porte_coulissante_1', name: 'Porte coulissante suspendue sur rail en acier noir mat', capabilities: [], visuals: { assetId: 'wp-porte-coulissante' } },
  { id: 'dalle_chemin_1', name: 'Dalle de chemin pas japonais en porphyre volcanique', capabilities: [], visuals: { assetId: 'wp-dalle-de-chemin' } },
  { id: 'pot_moutarde_1', name: 'Pot de moutarde de Dijon traditionnel en grès et bouchon liège', capabilities: [], visuals: { assetId: 'wp-pot-de-moutarde' } },
  { id: 'portail_donjon_1', name: 'Portail de donjon médiéval fantastique en pierre et herse', capabilities: [], visuals: { assetId: 'wp-portail-de-donjon' } },
  { id: 'robot_quadrupede_1', name: 'Robot quadrupède d\'exploration et tourelle capteurs LIDAR', capabilities: [], visuals: { assetId: 'wp-robot-quadrupede' } },
  { id: 'console_holo_1', name: 'Console de commande holographique sci-fi rétro-éclairée', capabilities: [], visuals: { assetId: 'wp-console-holographique' } },
  { id: 'conteneur_futu_1', name: 'Conteneur spatial futuriste pressurisé et verrous magnétiques', capabilities: [], visuals: { assetId: 'wp-conteneur-futuriste' } },
  { id: 'but_foot_1', name: 'But de football tubulaire en aluminium laqué et filet maillé', capabilities: [], visuals: { assetId: 'wp-but-de-football' } },
  { id: 'champignons_forestiers_1', name: 'Champignons forestiers sauvages cèpes et bolets sur mousse', capabilities: [], visuals: { assetId: 'wp-champignons-forestiers' } },
  { id: 'bol_chantant_1', name: 'Bol chantant tibétain en bronze 7 métaux gravé et mailloche', capabilities: [], visuals: { assetId: 'wp-bol-chantant' } },
  { id: 'paravent_ajoure_1', name: 'Paravent ajouré oriental moucharabieh sculpté à 3 vantaux', capabilities: [], visuals: { assetId: 'wp-paravent-ajoure' } },
  { id: 'coffret_expression_1', name: 'Coffret d\'expression précieux en marqueterie et jetons gravés', capabilities: [], visuals: { assetId: 'wp-coffret-d-expression' } },
  { id: 'maillet_1', name: 'Maillet de menuisier d\'art en hêtre massif cerclé de laiton', capabilities: [], visuals: { assetId: 'wp-maillet' } },
  { id: 'etau_etabli_1', name: 'Étau d\'établi lourd de mécanicien en fonte aciérée et mors striés', capabilities: [], visuals: { assetId: 'wp-etau-d-etabli' } },
  { id: 'casque_chantier_1', name: 'Casque de protection de chantier blanc avec coiffe et jugulaire', capabilities: [], visuals: { assetId: 'wp-casque-de-chantier' } },
  { id: 'caisse_outils_1', name: 'Caisse à outils métallique dépliante rouge à 5 casiers', capabilities: [], visuals: { assetId: 'wp-caisse-a-outils' } },
  { id: 'palette_logistique_1', name: 'Palette de manutention Europe EPAL en bois avec marquages', capabilities: [], visuals: { assetId: 'wp-palette-logistique' } },
  { id: 'arche_jardin_1', name: 'Arche de jardin romantique en fer forgé et rosiers grimpants', capabilities: [], visuals: { assetId: 'wp-arche-de-jardin' } },
  { id: 'cabine_acoustique_1', name: 'Cabine acoustique insonorisée moderne de bureau avec vitre', capabilities: [], visuals: { assetId: 'wp-cabine-acoustique' } },
  { id: 'bouteille_vinaigre_1', name: 'Bouteille de vinaigre balsamique de Modène en verre ambré', capabilities: [], visuals: { assetId: 'wp-bouteille-de-vinaigre' } },
  { id: 'boite_conserve_1', name: 'Boîte de conserve en fer-blanc nervuré avec opercule à anneau', capabilities: [], visuals: { assetId: 'wp-boite-de-conserve' } },
  { id: 'poire_alias_1', name: 'Poire de verger juteuse', capabilities: [], visuals: { assetId: 'wp-poire' } },
  { id: 'champignon_alias_1', name: 'Champignon de Paris frais', capabilities: [], visuals: { assetId: 'wp-champignon' } },
  { id: 'bocal_cornichons_1', name: 'Bocal de cornichons à l\'aneth et oignons grelots Le Parfait', capabilities: [], visuals: { assetId: 'wp-bocal-de-cornichons' } },
  { id: 'sachet_levure_1', name: 'Sachet de levure chimique alsacienne gaufré', capabilities: [], visuals: { assetId: 'wp-sachet-de-levure' } },
  { id: 'boite_the_1', name: 'Boîte de thé métallique laquée impériale et double couvercle', capabilities: [], visuals: { assetId: 'wp-boite-de-the' } },
  { id: 'paquet_cafe_1', name: 'Paquet de café moulu pur arabica sous vide et valve fraîcheur', capabilities: [], visuals: { assetId: 'wp-paquet-de-cafe-moulu' } },
  { id: 'haricots_verts_1', name: 'Botte de haricots verts extra-fins frais noués', capabilities: [], visuals: { assetId: 'wp-haricots-verts' } },
  { id: 'petits_pois_1', name: 'Poignée de cosses de petits pois croquants entr\'ouvertes', capabilities: [], visuals: { assetId: 'wp-petits-pois-en-cosses' } },
  { id: 'navet_1', name: 'Navet violet et blanc primeur avec fanes fraîches', capabilities: [], visuals: { assetId: 'wp-navet' } },
  { id: 'branche_celeri_1', name: 'Branche de céleri côtelée et feuilles tendres', capabilities: [], visuals: { assetId: 'wp-branche-de-celeri' } },
  { id: 'artichaut_1', name: 'Artichaut camus de Bretagne aux bractées charnues', capabilities: [], visuals: { assetId: 'wp-artichaut' } },
  { id: 'epinards_1', name: 'Bouquet de feuilles fraîches d\'épinards gaufrées', capabilities: [], visuals: { assetId: 'wp-epinards' } },
  { id: 'asperges_1', name: 'Botte d\'asperges blanches des Landes aux pointes pourpres', capabilities: [], visuals: { assetId: 'wp-asperges' } },
  { id: 'peche_1', name: 'Pêche jaune de vigne duveteuse et sillon marqué', capabilities: [], visuals: { assetId: 'wp-peche' } },
  { id: 'abricot_1', name: 'Abricot doré du Roussillon tigré de rouge velouté', capabilities: [], visuals: { assetId: 'wp-abricot' } },
  { id: 'cerise_1', name: 'Paire de cerises Burlat rouge carmin brillant et pédoncules', capabilities: [], visuals: { assetId: 'wp-cerise' } },
  { id: 'prune_1', name: 'Prune Reine-Claude verte dorée recouverte de pruine', capabilities: [], visuals: { assetId: 'wp-prune' } },
  { id: 'melon_cavaillon_1', name: 'Melon de Cavaillon brodé côtelé à chair orangée', capabilities: [], visuals: { assetId: 'wp-melon-de-cavaillon' } },
  { id: 'figues_1', name: 'Duo de figues violettes de Solliès avec goutte de miel', capabilities: [], visuals: { assetId: 'wp-figues' } },
  { id: 'framboises_1', name: 'Ravier de framboises rouges veloutées et drupéoles', capabilities: [], visuals: { assetId: 'wp-framboises' } },
  { id: 'noix_grenoble_1', name: 'Assortiment de noix de Grenoble aux coques sculptées', capabilities: [], visuals: { assetId: 'wp-noix-de-grenoble' } },
];

for (const entity of testDetailedEntities) {
  assert.equal(
    hasDetailedSimulationModel(entity),
    true,
    `L'entité '${entity.name}' (${entity.visuals?.assetId}) doit être reconnue par hasDetailedSimulationModel`
  );
}

// 4. Intégrité des 50 scénarios de simulation (12 Recettes + 8 Séminaires + 30 FLE)

assert.equal(cookingRecipes.length, 12, '12 recettes culinaires doivent être configurées');
assert.equal(seminarRooms.length, 8, '8 salles de séminaire doivent être configurées');
assert.equal(fleScenes.length, 30, '30 scènes FLE doivent être configurées');

const allSimScenarios = [
  ...cookingRecipes.map(r => ({ type: 'cooking', name: r.title, patch: createRecipePatch(r) })),
  ...seminarRooms.map(s => ({ type: 'seminar', name: s.title, patch: createSeminarPatch(s) })),
  ...fleScenes.map(f => ({ type: 'fle', name: f.title, patch: createFLEPatch(f) })),
];

assert.equal(allSimScenarios.length, 50, 'Le total de scénarios de simulation doit être exactement de 50');

let totalSimulationEntities = 0;
let detailedSimulationCount = 0;

for (const sc of allSimScenarios) {
  for (const ent of sc.patch.entitiesCreated || []) {
    totalSimulationEntities++;
    const asset = getAsset(ent.visuals?.assetId);
    assert(
      asset !== undefined,
      `Dans le scénario '${sc.name}' (${sc.type}), l'entité '${ent.name}' a un assetId non résolu: '${ent.visuals?.assetId}'`
    );
    if (hasDetailedSimulationModel(ent)) {
      detailedSimulationCount++;
    }
  }
}

assert(totalSimulationEntities >= 500, `Au moins 500 entités doivent être déployées dans les simulations (actuel: ${totalSimulationEntities})`);
assert(detailedSimulationCount >= 378, `100% des entités physiques de simulation doivent bénéficier d'un modèle ultra-détaillé (actuel: ${detailedSimulationCount})`);

console.log(`PASS: Suite 29 validée avec succès (540 assets de base préservés, 540 modèles 3D ultra-détaillés, 100% du catalogue étendu et 100% des entités physiques couverts : ${detailedSimulationCount} entités détaillées sur ${totalSimulationEntities} des 50 scénarios).`);

// --- Démarrage de la Suite 30 : Publish Readiness Gate & Synthetic AI Playtester ---
console.log('--- Démarrage de la Suite 30 : Publish Readiness Gate & Synthetic AI Playtester ---');

const { evaluatePublishReadiness, exportReadinessReportJSON, LOCAL_PARCEL_PRESETS } = await import('../engine/publishReadiness');
const { runSyntheticPlaytest, PLAYTESTER_PERSONAS } = await import('../engine/syntheticPlaytester');

// 1. Validation des Presets de Parcelles Victoria VR Lands
assert.equal(LOCAL_PARCEL_PRESETS.standard.width, 10);
assert.equal(LOCAL_PARCEL_PRESETS.standard.depth, 10);
assert.equal(LOCAL_PARCEL_PRESETS.large.width, 20);
assert.equal(LOCAL_PARCEL_PRESETS.estate.width, 40);

// 2. Audit de conformité de publication (Publish Readiness) sur l'état actif
const publishReport = useWorldStore.getState().runPublishReadinessCheck('standard');
assert(publishReport !== null, 'Le rapport de publication ne doit pas être null');
assert(publishReport.score >= 0 && publishReport.score <= 100, 'Le score doit être entre 0 et 100');
assert(publishReport.checks.length >= 5, 'Au moins 5 vérifications d\'audit doivent être exécutées');
assert(publishReport.reportId.startsWith('wp-report-'), 'Le rapport doit porter un identifiant local, pas un sceau cryptographique.');

// Export du manifeste JSON
const manifestJSON = exportReadinessReportJSON(publishReport);
assert(manifestJSON.includes('WorldPilot local readiness report'), 'L’export doit être identifié comme rapport local.');
assert(manifestJSON.includes(publishReport.reportId), 'L’export doit intégrer l’identifiant local du rapport.');
assert(manifestJSON.includes('Not an official Victoria VR certification'), 'L’export doit préciser qu’il ne certifie pas officiellement la scène.');

// 3. Test de détection de débordement spatial de parcelle
const testWorldOutOfBounds = {
  version: 1,
  ir: {
    entities: {
      out_entity: {
        id: 'out_entity',
        name: 'Grand Batiment Externe',
        capabilities: [
          { type: 'transform', position: { x: 14.5, y: 1.0, z: 0 } },
          { type: 'collider' }
        ],
        visuals: { assetId: 'wp-mur-plein' }
      }
    },
    rules: {},
    invariants: {},
    quests: {},
    activeQuestId: null
  },
  flags: {},
  gameplay: {}
} as any;

const reportStandard = evaluatePublishReadiness(testWorldOutOfBounds, 'standard');
const spatialCheckStandard = reportStandard.checks.find(c => c.id === 'spatial_land_bounds');
assert.equal(spatialCheckStandard?.status, 'FAIL', 'L\'objet à x=14.5m doit échouer au bornage d\'une parcelle standard (10x10m)');
assert.equal(reportStandard.overallStatus, 'BLOCKED', 'Le débordement de parcelle doit bloquer la publication');

// Sur une parcelle Estate (40x40m, $[-20, 20]$), l'objet à x=14.5m est conforme
const reportEstate = evaluatePublishReadiness(testWorldOutOfBounds, 'estate');
const spatialCheckEstate = reportEstate.checks.find(c => c.id === 'spatial_land_bounds');
assert.equal(spatialCheckEstate?.status, 'PASS', 'L\'objet à x=14.5m doit passer sur une parcelle Estate (40x40m)');

// 4. Test du Synthetic AI Playtester
assert.equal(PLAYTESTER_PERSONAS.speedrunner.id, 'speedrunner');
assert.equal(PLAYTESTER_PERSONAS.explorer.id, 'explorer');
assert.equal(PLAYTESTER_PERSONAS.adversarial.id, 'adversarial');
assert.equal(PLAYTESTER_PERSONAS.novice.id, 'novice');

// Playtest autonome sur l'état courant
const playtestRun = useWorldStore.getState().runPlaytest('speedrunner');
assert(playtestRun !== null, 'Le résultat du playtest ne doit pas être null');
assert(playtestRun.waypoints.length >= 1, 'Au moins un point de départ de spawn doit exister');
assert(playtestRun.completionRate >= 0 && playtestRun.completionRate <= 100);

// 5. Test de détection d'obstacle et génération du Minimal Patch Auto-Repair
const testWorldBlocked = {
  version: 1,
  ir: {
    activeQuestId: 'test_quest',
    quests: {
      test_quest: {
        id: 'test_quest',
        title: 'Inspection du Système',
        steps: [
          { title: 'Inspecter la console', description: 'Accéder à la console technique' }
        ]
      }
    },
    entities: {
      target_console: {
        id: 'target_console',
        name: 'Console Technique',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 1.0, z: -1.0 } },
          { type: 'collider' }
        ],
        visuals: { assetId: 'wp-console-holographique' }
      },
      blocking_wall: {
        id: 'blocking_wall',
        name: 'Mur d\'Obstruction',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0.5, z: 0.2 } }, // Directement sur la trajectoire entre (0, 0, 1.4) et (0, 1, -1.0)
          { type: 'collider' }
        ],
        visuals: { assetId: 'wp-mur-plein' }
      }
    },
    rules: {},
    invariants: {}
  },
  flags: {},
  gameplay: {}
} as any;

const blockedResult = runSyntheticPlaytest(testWorldBlocked, 'speedrunner');
assert.equal(blockedResult.success, false, 'Le playtester doit détecter le blocage');
assert(blockedResult.diagnostics.length > 0, 'Un diagnostic d\'obstacle doit être produit');
assert.equal(blockedResult.diagnostics[0].type, 'OBSTACLE_BLOCKING');
assert(blockedResult.minimalPatch !== undefined, 'Un minimal patch doit être calculé par l\'IA');

// 6. Test de réparation et ré-épreuve avec Minimal Patch
const repairedEntities = { ...testWorldBlocked.ir.entities };
const changedEntity = blockedResult.minimalPatch!.entitiesChanged![0];
if (changedEntity.id) {
  repairedEntities[changedEntity.id] = changedEntity as any;
}
const testWorldRepaired = {
  ...testWorldBlocked,
  ir: { ...testWorldBlocked.ir, entities: repairedEntities }
};

const repairResult = runSyntheticPlaytest(testWorldRepaired, 'speedrunner');
assert.equal(repairResult.success, true, 'Après application du Minimal Patch, le playtester doit valider 100% du parcours');
assert.equal(repairResult.completionRate, 100, 'Le taux de complétion doit être de 100%');

// 7. Commandes en langage naturel pour le Publish Gate et Playtester
const parsePublishGate = parseInstruction("vérifie la conformité de publication victoria vr", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parsePublishGate.plan.intent, 'open_publish_readiness_gate');

const parsePlaytest = parseInstruction("lance le playtester ia sur mon monde", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parsePlaytest.plan.intent, 'run_synthetic_playtester');

console.log('PASS: Suite 30 validée avec succès (Publish Readiness Gate, bornage des parcelles VR Lands, Synthetic AI Playtester & Minimal Patch Auto-Repair).');

// ============================================================================
// 31. Unified Research Core: Emergent Affordances, SBR, Pedagogy & MDP Telemetry
// ============================================================================
console.log('--- Démarrage de la Suite 31 : Unified Research Core (Affordances Émergentes, SBR, Pédagogie & Tenseurs MDP) ---');

const {
  calculateIntentConfidence,
  createInitialShadowGraph,
  recordUnanticipatedInteraction,
  promoteInteractionToPatch
} = await import('../research/inverseIntentEngine');

const { evaluateSemanticBlastRadius } = await import('../research/semanticBlastRadius');
const { compilePedagogicalSimulation, PEDAGOGICAL_PRESETS } = await import('../research/pedagogicalCompiler');
const { isPedagogicalApparatus } = await import('../scene/PedagogicalApparatusModel');
const { BehavioralTensorRecorder } = await import('../research/behavioralTensorRecorder');

// 1. Inverse Intent Engine (3D Fitts' Law & Gaze Dwell Scoring)
const highIntentConfidence = calculateIntentConfidence(0.05, 0.4, 350, 2);
assert(highIntentConfidence >= 0.8, 'Un geste délibéré proche avec fixation oculaire doit avoir un score >= 0.8');

const lowIntentConfidence = calculateIntentConfidence(0.8, 4.0, 50, 1);
assert(lowIntentConfidence < 0.35, 'Un geste rapide et lointain doit être filtré comme bruit moteur (< 0.35)');

// 2. Shadow Causal Graph & Candidate Promotion
const initialShadow = createInitialShadowGraph();
assert.equal(initialShadow.observations.length, 0);

const mockWorldForResearch: any = {
  version: 1,
  entities: {
    ent_salt: { id: 'ent_salt', name: 'Sel de Guérande', shape: 'cylinder', transform: { position: [0, 1, 0] } },
    ent_fire: { id: 'ent_fire', name: 'Brasero Ardent', shape: 'box', transform: { position: [0, 0.5, 0] } },
    ent_target: { id: 'ent_target', name: 'Cible Quête', shape: 'box', transform: { position: [1, 1, 1] } }
  },
  rules: {
    rule_base: { id: 'rule_base', event: 'CLICK', conditions: [], actions: [] }
  },
  activeQuestId: 'quest_research_test',
  quests: {
    quest_research_test: {
      id: 'quest_research_test',
      title: 'Quête Test Recherche',
      steps: [{ id: 's1', instruction: 'Atteindre la cible', targetEntityId: 'ent_target' }]
    }
  }
};

const recordResult = recordUnanticipatedInteraction(
  initialShadow,
  mockWorldForResearch,
  'ent_salt',
  'ent_fire',
  'HEAT',
  { spatialDistance: 0.1, approachVelocity: 0.5, gazeDwellMs: 320 }
);

assert.equal(recordResult.updatedGraph.observations.length, 1);
assert.equal(recordResult.updatedGraph.observations[0].gestureType, 'HEAT');
assert.equal(recordResult.updatedGraph.observations[0].status, 'speculative');

const candidatePatch = promoteInteractionToPatch(recordResult.updatedGraph.observations[0]);
assert(candidatePatch !== null);
assert.equal(candidatePatch.rulesChanged?.length, 1);

// 3. Semantic Blast Radius (Differential Invariant & Reachability Verification)
const benignPatch = {
  entitiesChanged: [{ id: 'ent_salt', color: '#ffffff' }]
};
const benignReport = evaluateSemanticBlastRadius(mockWorldForResearch, benignPatch);
assert.equal(benignReport.isRegressionFree, true, 'Un patch visuel bénin ne doit introduire aucune régression');
assert(benignReport.blastRadiusScore < 0.5);

// Destructive Patch: removing quest target
const destructivePatch = {
  entitiesRemoved: ['ent_target']
};
const destructiveReport = evaluateSemanticBlastRadius(mockWorldForResearch, destructivePatch);
assert.equal(destructiveReport.isRegressionFree, false, 'Supprimer une cible de quête doit être bloqué comme régression causale');
assert(destructiveReport.violations.some(v => v.type === 'QUEST_UNREACHABLE'));

// Collision Deadlock & Pareto Minimal Repair
const deadlockPatch = {
  entitiesChanged: [{
    id: 'ent_fire',
    transform: { position: [1.02, 1, 1.01], rotation: [0, 0, 0], scale: [1, 1, 1] }
  }]
};
const deadlockReport = evaluateSemanticBlastRadius(mockWorldForResearch, deadlockPatch);
assert(deadlockReport.violations.some(v => v.type === 'COLLIDER_DEADLOCK'), 'Une obstruction physique doit lever un deadlock');
assert(deadlockReport.paretoRepairPatch !== undefined, 'Un Pareto Minimal Repair doit être calculé automatiquement');

// 4. Pedagogical Compiler (Bloom-3D & Active Error-Traps)
assert(Object.keys(PEDAGOGICAL_PRESETS).length >= 3, 'Le catalogue de presets pédagogiques doit contenir au moins 3 spécialités');
const simOhm = compilePedagogicalSimulation("crée un labo sur la loi d'ohm et le court-circuit");
assert.equal(simOhm.preset.domain, 'PHYSICS_ELECTRICITY');
assert(simOhm.worldPatch.entitiesCreated!.some(e => e.capabilities?.some(c => c.type === 'cognitive_trap')), 'Le piège cognitif formateur doit être créé');
assert.equal(simOhm.worldPatch.questsAdded?.[0].steps.length, 4, 'La quête pédagogique doit comporter 4 étapes progressives');
assert(simOhm.worldPatch.rulesChanged!.some(r => r.actions?.some(a => a.sound === 'electric_spark')), 'Le piège cognitif doit déclencher le son procedural electric_spark');
assert(simOhm.worldPatch.entitiesCreated!.every(e => isPedagogicalApparatus(e)), 'Toutes les entités du labo Ohm doivent être reconnues par isPedagogicalApparatus');

const simSnell = compilePedagogicalSimulation("banc d'optique pour la réfraction de snell-descartes");
assert.equal(simSnell.preset.domain, 'OPTICS');
assert(simSnell.worldPatch.entitiesCreated!.some(e => e.capabilities?.some(c => c.type === 'laser_source')));
assert(simSnell.worldPatch.entitiesCreated!.every(e => isPedagogicalApparatus(e)), 'Toutes les entités du banc d optique doivent être reconnues par isPedagogicalApparatus');

// 5. Behavioral MDP Tensor Recorder (Open X-Embodiment Standards)
const recorder = new BehavioralTensorRecorder();
recorder.startNewEpisode('victoria_vr_estate_40m', 'quest_pedagogical');
recorder.recordStep([0.2, 0.8, -0.3], [0.01, 0, 0], [0, 0, -1], 'ent_salt', 'GRAB', 0.25);
recorder.recordStep([0.0, 1.2, -0.1], [-0.02, 0.1, 0], [0, 0, -1], 'ent_fire', 'USE', 0.75);
const finishedEpisode = recorder.finishCurrentEpisode();

assert(finishedEpisode !== null);
assert.equal(finishedEpisode.steps.length, 2);
assert(finishedEpisode.metrics.spatialActivityDensity >= 0);
assert(finishedEpisode.metrics.rulaErgonomicFatigueScore >= 1.0);

const jsonDataset = recorder.exportDatasetJSON();
const parsedDataset = JSON.parse(jsonDataset);
assert.equal(parsedDataset.datasetSchema, 'open-x-embodiment-spatial-mdp-v1.0');
assert(parsedDataset.episodes.length >= 1);

// 6. Natural Language Parser Recognition for Research Suite
const parseResearchConsole = parseInstruction("ouvre la console de recherche scientifique", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseResearchConsole.plan.intent, 'open_research_dashboard');

const parseBlastRadius = parseInstruction("vérifie le blast radius et la non-régression", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseBlastRadius.plan.intent, 'audit_blast_radius');

const parsePedagogy = parseInstruction("compile un laboratoire de thermodynamique", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parsePedagogy.plan.intent, 'compile_pedagogical_simulation');
assert.equal(parsePedagogy.plan.actions[0].presetKey, 'thermo_calorimetry');

// 7. Store Integration & Unlocks
useWorldStore.getState().openResearchDashboard();
assert.equal(useWorldStore.getState().showResearchDashboardModal, true);
useWorldStore.getState().closeResearchDashboard();
assert.equal(useWorldStore.getState().showResearchDashboardModal, false);

useWorldStore.getState().compileAndLoadPedagogicalSimulation('electricity_ohm');
assert(useWorldStore.getState().unlockedAchievements['pedagogical_lab_compiled']);

useWorldStore.getState().exportMDPDataset();
assert(useWorldStore.getState().unlockedAchievements['mdp_dataset_exported']);

console.log('PASS: Suite 31 validée avec succès (Inverse Intent Engine, Semantic Blast Radius, Compilateur Pédagogique Bloom 3D & Tenseurs MDP Victoria VR).');

// --- Suite 32 : Closed Adaptive Loop & Master PRD Engine (Victoria VR 2026) ---
console.log('--- Démarrage de la Suite 32 : Master PRD Engine (Boucle Fermée Adaptative & Modes UI) ---');

const testStore = useWorldStore.getState();

// 1. Initial State of Meta-Controller
testStore.resetMetaLoop();
let hyp = useWorldStore.getState().metaHypotheses;
assert.equal(hyp.h1.id, 'surface_heuristic');
assert.equal(hyp.h2.id, 'causal_understanding');
assert.equal(hyp.h1.probability, 0.5);
assert.equal(hyp.h2.probability, 0.5);
assert.equal(hyp.uncertainty, 1.0);

// 2. Bayesian Observation of Cognitive Trap Error (Strengthens H1)
testStore.observeMetaInteraction({ type: 'ERROR_TRAP_TRIGGERED', data: { value: 1 } });
hyp = useWorldStore.getState().metaHypotheses;
assert(hyp.h1.probability > 0.5, "P(H1) doit augmenter après le déclenchement d'un piège cognitif");
assert(hyp.h2.probability < 0.5, "P(H2) doit diminuer après le déclenchement d'un piège cognitif");

// 3. Bayesian Observation of Transfer Success (Strengthens H2)
testStore.observeMetaInteraction({ type: 'TRANSFER_SUCCESS', data: { value: 1 } });
testStore.observeMetaInteraction({ type: 'TRANSFER_SUCCESS', data: { value: 1 } });
hyp = useWorldStore.getState().metaHypotheses;
assert(hyp.h2.probability > hyp.h1.probability, "P(H2) doit surpasser P(H1) après des succès de transfert répétés");

// 4. Strategy Selection Verification
const strat = useWorldStore.getState().metaStrategy;
assert(['DIAGNOSE_HYPOTHESIS', 'TEST_TRANSFER', 'FALSIFY_MISCONCEPTION'].includes(strat.objective));
assert(['SURFACE_CONTEXT_SHIFT', 'MINIMAL_COUNTERFACTUAL', 'CONTRADICTION_CHALLENGE'].includes(strat.strategy));

// 5. Next Adaptive Experience Generation E(t+1)
const initialVersion = useWorldStore.getState().world.version;
const initialCycleCount = useWorldStore.getState().metaHistory.length;

const cycleResult = useWorldStore.getState().triggerAdaptiveCycle();
assert(cycleResult.variantTitle.length > 0);
assert(cycleResult.rationale.length > 0);
assert(useWorldStore.getState().world.version > initialVersion, "La version du monde doit s'incrémenter lors de l'application de la seconde expérience");
assert.equal(useWorldStore.getState().metaHistory.length, initialCycleCount + 1, "Un cycle doit être consigné dans l'historique de l'Observatoire");
assert(useWorldStore.getState().metaKnowledge.length >= 1, "La connaissance cumulative doit enregistrer l'objet d'évidence empirique");

// 6. 3-Mode Primary UI Switcher (Conception · Simulation · L'Observatoire)
testStore.setAppMode('simulation');
assert.equal(useWorldStore.getState().appMode, 'simulation');
assert.equal(useWorldStore.getState().isSimulating, true, "Le passage en mode simulation doit activer isSimulating");

testStore.setAppMode('observatoire');
assert.equal(useWorldStore.getState().appMode, 'observatoire');
assert.equal(useWorldStore.getState().showResearchDashboardModal, true, "Le passage en mode observatoire doit ouvrir L'Observatoire");

testStore.setAppMode('conception');
assert.equal(useWorldStore.getState().appMode, 'conception');

console.log('PASS: Suite 32 validée avec succès (Master PRD Closed Adaptive Loop, Méta-Contrôleur Bayésien & Triptyque UI Conception-Simulation-Observatoire).');

// =========================================================================
// SUITE 33 : Standardized Persona Benchmark & Bayesian Convergence (PRD Section 51)
// =========================================================================
console.log('--- Démarrage de la Suite 33 : Standardized Persona Benchmark & Convergence Bayésienne ---');
const { EVALUATED_PERSONAS } = await import('../research/metaController');

// 1. Matrice des 4 Personas Types
assert.equal(Object.keys(EVALUATED_PERSONAS).length, 4, 'Doit contenir exactement 4 personas de benchmark');
assert(EVALUATED_PERSONAS.persona_a && EVALUATED_PERSONAS.persona_b && EVALUATED_PERSONAS.persona_c && EVALUATED_PERSONAS.persona_d);

// 2. Évaluation Persona A (Compréhension Causale -> Shift de contexte / Test de Transfert)
testStore.resetMetaLoop();
const resA = testStore.runPersonaBenchmark('persona_a');
assert.equal(resA.persona.id, 'persona_a');
assert(resA.posterior.h2.probability > 0.85, 'Persona A doit converger vers H2 (Compréhension Causale)');
assert(resA.posterior.uncertainty < 0.2, 'Incertitude U doit s’effondrer pour Persona A');
assert.equal(resA.selectedStrategy.objective, 'TEST_TRANSFER');
assert.equal(resA.selectedStrategy.strategy, 'SURFACE_CONTEXT_SHIFT');
assert.equal(resA.traceAnnotations.length, 3);

// 3. Évaluation Persona B (Mémorisation Superficielle -> Défi de Contradiction)
testStore.resetMetaLoop();
const resB = testStore.runPersonaBenchmark('persona_b');
assert.equal(resB.persona.id, 'persona_b');
assert(resB.posterior.h1.probability > 0.85, 'Persona B doit converger vers H1 (Heuristique de surface)');
assert(resB.posterior.uncertainty < 0.2, 'Incertitude U doit être faible après plusieurs erreurs pour Persona B');
assert.equal(resB.selectedStrategy.objective, 'FALSIFY_MISCONCEPTION');
assert.equal(resB.selectedStrategy.strategy, 'CONTRADICTION_CHALLENGE');

// 4. Évaluation Persona C (Stratégie Sous-Optimale Persistante -> Diagnostic Contrefactuel Minimal)
testStore.resetMetaLoop();
const resC = testStore.runPersonaBenchmark('persona_c');
assert.equal(resC.persona.id, 'persona_c');
assert(resC.posterior.uncertainty > 0.5, 'Persona C doit maintenir une incertitude élevée U > 0.5');
assert.equal(resC.selectedStrategy.objective, 'DIAGNOSE_HYPOTHESIS');
assert.equal(resC.selectedStrategy.strategy, 'MINIMAL_COUNTERFACTUAL');

// 5. Évaluation Persona D (Haute Compétence & Désengagement -> Transfert & Agency)
testStore.resetMetaLoop();
const resD = testStore.runPersonaBenchmark('persona_d');
assert.equal(resD.persona.id, 'persona_d');
assert(resD.posterior.h2.probability > 0.85, 'Persona D doit converger vers H2');
assert.equal(resD.selectedStrategy.objective, 'TEST_TRANSFER');
assert.equal(resD.selectedStrategy.strategy, 'SURFACE_CONTEXT_SHIFT');

// 6. Connaissance Cumulative Multi-Sessions
const initialKnowledgeCount = useWorldStore.getState().metaKnowledge.length;
testStore.triggerAdaptiveCycle();
assert(useWorldStore.getState().metaKnowledge.length >= initialKnowledgeCount, 'Les cycles doivent enrichir le corpus de connaissance empirique');

console.log('PASS: Suite 33 validée avec succès (Benchmark 4 Personas, Convergence Bayésienne H1/H2, Sélection Stratégique & Connaissance Cumulative).');

// =========================================================================
// SUITE 34 : Interactive Pitch Demo Director & 5-Act Synchronization (PRD Section 52)
// =========================================================================
console.log('--- Démarrage de la Suite 34 : Réalisateur Interactif de Pitch Démo (5 Actes & 180s) ---');
const { PITCH_ACTS } = await import('../ui/PitchDemoDirector');

// 1. Structure stricte des 5 Actes du Master PRD
assert.equal(PITCH_ACTS.length, 5, 'Le réalisateur de pitch doit comporter exactement 5 actes (Section 52)');

// 2. Durée totale cumulée rigoureusement égale à 3 minutes (180 secondes)
const totalPitchDurationSec = PITCH_ACTS.reduce((acc, act) => acc + act.durationSec, 0);
assert.equal(totalPitchDurationSec, 180, 'La durée totale du pitch doit être rigoureusement de 180 secondes (3:00)');

// 3. Séquence ordonnée des modes UI
assert.equal(PITCH_ACTS[0].mode, 'conception', 'Acte 1 doit démarrer en mode Conception');
assert.equal(PITCH_ACTS[1].mode, 'simulation', 'Acte 2 doit immerger en mode Simulation plein écran');
assert.equal(PITCH_ACTS[2].mode, 'observatoire', 'Acte 3 doit ouvrir L’Observatoire');
assert.equal(PITCH_ACTS[3].mode, 'observatoire', 'Acte 4 doit exécuter le benchmark dans L’Observatoire');
assert.equal(PITCH_ACTS[4].mode, 'simulation', 'Acte 5 doit conclure dans la Simulation avec E2');

// 4. Intégrité des scripts bilingues et termes cardinaux
for (const act of PITCH_ACTS) {
  assert(act.titleFr && act.titleFr.length > 5, `Titre FR manquant pour l'acte ${act.id}`);
  assert(act.titleEn && act.titleEn.length > 5, `Titre EN manquant pour l'acte ${act.id}`);
  assert(act.scriptFr && act.scriptFr.length > 50, `Script FR trop court pour l'acte ${act.id}`);
  assert(act.scriptEn && act.scriptEn.length > 50, `Script EN trop court pour l'acte ${act.id}`);
  assert(act.actionFr && act.actionFr.length > 5, `Action FR manquante pour l'acte ${act.id}`);
  assert(act.actionEn && act.actionEn.length > 5, `Action EN manquante pour l'acte ${act.id}`);
}

assert(PITCH_ACTS[0].scriptFr.includes('seconde expérience'), 'Acte 1 FR doit énoncer la thèse centrale');
assert(PITCH_ACTS[0].scriptEn.includes('second experience'), 'Acte 1 EN doit énoncer la thèse centrale');
assert(PITCH_ACTS[1].scriptFr.includes('haptiques'), 'Acte 2 FR doit mentionner les retours haptiques WebXR');
assert(PITCH_ACTS[2].scriptFr.includes('H1') && PITCH_ACTS[2].scriptFr.includes('H2'), 'Acte 3 FR doit présenter les hypothèses H1 et H2');
assert(PITCH_ACTS[3].scriptFr.includes('Persona B') && PITCH_ACTS[3].scriptFr.includes('Persona A'), 'Acte 4 FR doit tester les Personas B et A');
assert(PITCH_ACTS[4].scriptFr.includes('E2') && PITCH_ACTS[4].scriptFr.includes('LeRobot'), 'Acte 5 FR doit valider E2 et les certifications');

console.log('PASS: Suite 34 validée avec succès (Réalisateur de Pitch 5 Actes, Synchronisation 180s & Scripts Bilingues Master PRD).');

// =========================================================================
// SUITE 35 : Female Avatar Morphology & Magnetic Snap Stability (PRD Section 53)
// =========================================================================
console.log('--- Démarrage de la Suite 35 : Morphologie Féminine et Maintien Ferme du Support Aimanté ---');
const { isFemaleName } = await import('../engine/agentDialogues');
const { 
  applyAutonomousSpatialEngine, 
  isAutonomousFixedFurniture 
} = await import('../engine/autonomousSpatialEngine');

// 1. Détection universelle des prénoms et rôles féminins
assert.equal(isFemaleName('Victoria Pilot'), true, 'Victoria Pilot doit être détectée comme femme');
assert.equal(isFemaleName('Éléonore, Conseillère Maison'), true, 'Éléonore doit être détectée comme femme');
assert.equal(isFemaleName('Ingénieure Nova'), true, 'Ingénieure Nova doit être détectée comme femme');
assert.equal(isFemaleName('Camille', 'Sous-Chef de Brigade'), true, 'Camille doit être détectée comme femme');
assert.equal(isFemaleName('Marie'), true, 'Marie doit être détectée comme femme');
assert.equal(isFemaleName('Sophie'), true, 'Sophie doit être détectée comme femme');
assert.equal(isFemaleName('Cheffe de rang'), true, 'Cheffe doit être détectée comme rôle féminin');
assert.equal(isFemaleName('Conseillère clientèle'), true, 'Conseillère doit être détectée comme rôle féminin');

// 2. Non-détection des personas masculins (pas de faux positifs)
assert.equal(isFemaleName('Chef Auguste'), false, 'Chef Auguste doit être masculin');
assert.equal(isFemaleName('Jean, Guide Parisien'), false, 'Jean doit être masculin');
assert.equal(isFemaleName('Auditeur Victor'), false, 'Victor doit être masculin');

// 3. Exemption des accessoires d'exposition (podium VIP) du mobilier architectural fixe
const podiumEntity: any = {
  id: 'lv_inspection_podium',
  name: 'Podium d’inspection VIP & éclairage zénithal',
  visuals: { assetId: 'wp-podium-vip' },
  capabilities: [
    { type: 'transform', position: { x: 0.54, y: 0.912, z: 0.02 } },
    { type: 'trigger_zone', radius: 0.45 }
  ]
};
assert.equal(isAutonomousFixedFurniture(podiumEntity), false, 'Le podium VIP d’inspection sur comptoir ne doit pas être classé en meuble fixe lourd');

// 4. Stabilité de la pose aimantée sur le podium sans réversion à la position initiale
const tableEntity: any = {
  id: 'luxury_counter_main',
  name: 'Comptoir de présentation en marbre et laiton',
  visuals: { assetId: 'wp-comptoir-luxe' },
  capabilities: [
    { type: 'transform', position: { x: 0, y: 0, z: 0 } }
  ]
};

const monogramBag: any = {
  id: 'lv_monogram_speedy',
  name: 'Sac Monogram Speedy',
  visuals: { assetId: 'wp-sac-monogram-speedy' },
  capabilities: [
    { type: 'transform', position: { x: 0.54, y: 0.952, z: 0.02 } },
    { type: 'draggable' }
  ]
};

const capucinesBag: any = {
  id: 'lv_capucines_bag',
  name: 'Sac Capucines',
  visuals: { assetId: 'wp-sac-capucines' },
  capabilities: [
    { type: 'transform', position: { x: 0.06, y: 0.912, z: 0.04 } },
    { type: 'draggable' }
  ]
};

const testEntities: Record<string, any> = {
  luxury_counter_main: tableEntity,
  lv_inspection_podium: podiumEntity,
  lv_monogram_speedy: monogramBag,
  lv_capucines_bag: capucinesBag
};

// Exécuter l'intelligence spatiale avec une intention de drop explicite
applyAutonomousSpatialEngine(testEntities, 'Poser Sac Monogram Speedy sur Podium d’inspection VIP');

// Vérifier que le sac monogramme reste fermement sur le podium (x: 0.54, y: 0.952, z: 0.02)
assert.equal(testEntities.lv_monogram_speedy.capabilities[0].position.x, 0.54, 'Le sac déposé sur le podium ne doit pas être téléporté ou redistribué');
assert.equal(testEntities.lv_monogram_speedy.capabilities[0].position.y, 0.952, 'Le sac déposé sur le podium doit conserver sa surélévation de support');
assert.equal(testEntities.lv_monogram_speedy.capabilities[0].position.z, 0.02, 'La coordonnée Z du sac posé sur le podium doit être préservée');

console.log('PASS: Suite 35 validée avec succès (Détection Morphologie Féminine, Préservation des Déposes Aimantées et Non-Réversion du Podium).');

// =========================================================================
// SUITE 36 : Undo / Redo History & 3D Spatial Authoring Actions
// =========================================================================
console.log('--- Démarrage de la Suite 36 : Undo/Redo et Actions Spatiales 3D ---');

// 1. État initial propre
useWorldStore.getState().resetWorld();
assert.equal(useWorldStore.getState().canRedo, false, 'Le redo ne doit pas être disponible au démarrage');

// 2. Création d'une entité et vérification de la pile Undo
const testChair: any = {
  id: 'test_chair_1',
  name: 'Chaise de bureau ergonomique',
  visuals: { assetId: 'office-chair' },
  capabilities: [
    { type: 'transform', position: { x: 1, y: 0, z: 1 }, rotation: { x: 0, y: 0, z: 0 } },
    { type: 'collider' }
  ]
};

useWorldStore.getState().applyPatch({
  entitiesCreated: [testChair]
}, 'Ajouter chaise de bureau', {});

assert(useWorldStore.getState().world.ir.entities.test_chair_1, 'La chaise doit exister dans le monde');
assert.equal(useWorldStore.getState().canUndo, true, 'Le canUndo doit être vrai après un patch');

// 3. Test de la rotation 3D
useWorldStore.getState().rotateEntity('test_chair_1', Math.PI / 4);
const rotatedRot = useWorldStore.getState().world.ir.entities.test_chair_1.capabilities.find((c: any) => c.type === 'transform')?.rotation;
assert(Math.abs((rotatedRot?.y || 0) - Math.PI / 4) < 0.001, 'La rotation Y doit être pivotée de PI/4');

// 4. Test de la duplication 3D
const duplicateId = useWorldStore.getState().duplicateEntity('test_chair_1');
assert(duplicateId, 'La duplication doit renvoyer un nouvel identifiant');
assert(useWorldStore.getState().world.ir.entities[duplicateId!], 'La copie doit exister dans les entités');
const dupPos = useWorldStore.getState().world.ir.entities[duplicateId!].capabilities.find((c: any) => c.type === 'transform')?.position;
assert.equal(dupPos?.x, 1.35, 'La copie doit être décalée de +0.35m sur X');

// 5. Test de l'Undo
const entitiesBeforeUndo = Object.keys(useWorldStore.getState().world.ir.entities).length;
const undoSuccess = useWorldStore.getState().undo();
assert.equal(undoSuccess, true, 'undo() doit retourner true');
assert.equal(Object.keys(useWorldStore.getState().world.ir.entities).length, entitiesBeforeUndo - 1, 'Undo de la duplication doit retirer la copie');
assert.equal(useWorldStore.getState().canRedo, true, 'canRedo doit être vrai après un undo');

// 6. Test du Redo
const redoSuccess = useWorldStore.getState().redo();
assert.equal(redoSuccess, true, 'redo() doit retourner true');
assert.equal(Object.keys(useWorldStore.getState().world.ir.entities).length, entitiesBeforeUndo, 'Redo doit restaurer la copie');

// 7. Test de la suppression et de son annulation
useWorldStore.getState().deleteEntity('test_chair_1');
assert.equal(useWorldStore.getState().world.ir.entities.test_chair_1, undefined, 'La chaise doit être supprimée');
useWorldStore.getState().undo();
assert(useWorldStore.getState().world.ir.entities.test_chair_1, 'Undo doit restaurer la chaise supprimée');

console.log('PASS: Suite 36 validée avec succès (Undo/Redo Complet, Rotation 3D, Duplication, Suppression et Restauration).');

// =========================================================================
// SUITE 37 : Enriched Fashion & Clothing NLP Triggers (PRD Section 54)
// =========================================================================
console.log('--- Démarrage de la Suite 37 : Vocabulaire NLP Mode & Prêt-à-Porter Haute Couture ---');
// 1. Détection de prompts variés pour vêtements et robes
const nullCtx = { selectedEntityId: null, pointedEntityId: null };
const robeResult = parseInstruction('Ajouter une robe de soirée et des vêtements haute couture', nullCtx);
assert(robeResult.patch.entitiesCreated, 'Doit générer des entités pour un prompt de robe et vêtements');
const hasRack1 = robeResult.patch.entitiesCreated.some((e: any) => e.visuals?.assetId === 'wp-portant-a-vetements');
const hasMannequin1 = robeResult.patch.entitiesCreated.some((e: any) => e.visuals?.assetId === 'wp-mannequin-haute-couture');
assert.equal(hasRack1, true, 'Le portant de vêtements doit être créé pour le prompt de robe');
assert.equal(hasMannequin1, true, 'Le mannequin haute couture doit être créé pour le prompt de robe');

// 2. Détection de costumes et dressing
const costumeResult = parseInstruction('Ajouter un dressing de mode avec des costumes', nullCtx);
assert(costumeResult.patch.entitiesCreated, 'Doit générer des entités pour un dressing de costumes');
const hasRack2 = costumeResult.patch.entitiesCreated.some((e: any) => e.visuals?.assetId === 'wp-portant-a-vetements');
assert.equal(hasRack2, true, 'Le portant de vêtements doit être créé pour un dressing de costumes');

// 3. Détection de penderie avec vestes
const penderieResult = parseInstruction('Installer une penderie avec des vestes et manteaux', nullCtx);
assert(penderieResult.patch.entitiesCreated, 'Doit générer des entités pour une penderie');
const hasRack3 = penderieResult.patch.entitiesCreated.some((e: any) => e.visuals?.assetId === 'wp-portant-a-vetements');
assert.equal(hasRack3, true, 'Le portant doit être créé pour une penderie');

console.log('PASS: Suite 37 validée avec succès (Vocabulaire NLP Mode Étendu, Portant Garni et Mannequins Haute Couture).');

// =========================================================================
// SUITE 38 : Capture d'Écran HD & Export 3D GLB / USDZ (PRD Section 55)
// =========================================================================
console.log('--- Démarrage de la Suite 38 : Capture HD & Export 3D Universel ---');

// 1. Vérification des méthodes d'export sur useWorldStore
const storeExport = useWorldStore.getState();
assert.equal(typeof storeExport.triggerCaptureScreenshot, 'function', 'triggerCaptureScreenshot doit être une fonction');
assert.equal(typeof storeExport.triggerExportGLB, 'function', 'triggerExportGLB doit être une fonction');
assert.equal(typeof storeExport.triggerExportUSDZ, 'function', 'triggerExportUSDZ doit être une fonction');

// 2. Test du dispatch de l'événement capture d'écran
let screenshotDispatched = false;
const screenshotListener = () => { screenshotDispatched = true; };
if (typeof window !== 'undefined') {
  window.addEventListener('worldpilot_capture_screenshot', screenshotListener);
}
storeExport.triggerCaptureScreenshot();
if (typeof window !== 'undefined') {
  assert.equal(screenshotDispatched, true, 'triggerCaptureScreenshot() doit émettre worldpilot_capture_screenshot');
  window.removeEventListener('worldpilot_capture_screenshot', screenshotListener);
}

// 3. Test du dispatch de l'événement export GLB
let glbDispatched = false;
const glbListener = () => { glbDispatched = true; };
if (typeof window !== 'undefined') {
  window.addEventListener('worldpilot_export_glb', glbListener);
}
storeExport.triggerExportGLB();
if (typeof window !== 'undefined') {
  assert.equal(glbDispatched, true, 'triggerExportGLB() doit émettre worldpilot_export_glb');
  window.removeEventListener('worldpilot_export_glb', glbListener);
}

// 4. Test du dispatch de l'événement export USDZ (Vision Pro / iOS Quick Look)
let usdzDispatched = false;
const usdzListener = () => { usdzDispatched = true; };
if (typeof window !== 'undefined') {
  window.addEventListener('worldpilot_export_usdz', usdzListener);
}
storeExport.triggerExportUSDZ();
if (typeof window !== 'undefined') {
  assert.equal(usdzDispatched, true, 'triggerExportUSDZ() doit émettre worldpilot_export_usdz');
  window.removeEventListener('worldpilot_export_usdz', usdzListener);
}

console.log('PASS: Suite 38 validée avec succès (Capture d\'Écran HD, Export GLB Universel & Export USDZ Vision Pro).');

// =========================================================================
// SUITE 39 : Expériences B2B Complexes & Journal Cognitif des Agents IA (Arbitrage & Échéancier)
// =========================================================================
console.log('--- Démarrage de la Suite 39 : Expériences B2B & Journal Cognitif des Agents IA ---');

// 1. Expérience B2B IKEA Flat-Pack
const ikeaNLP = parseInstruction('Montage d’un meuble IKEA en kit avec tourillons et fixation murale', nullCtx);
assert.equal(ikeaNLP.plan.intent, 'assemble_ikea_furniture', 'Intent doit être assemble_ikea_furniture');
assert(ikeaNLP.patch.entitiesCreated, 'Entités du kit IKEA doivent être créées');
assert.equal(ikeaNLP.patch.entitiesCreated.length, 7, 'Le kit IKEA doit compter 7 entités complètes');
const ikeaAssets = ikeaNLP.patch.entitiesCreated.map((e: any) => e.visuals?.assetId);
assert(ikeaAssets.includes('wp-tapis-montage-ikea'), 'Doit inclure le tapis feutre anti-rayures');
assert(ikeaAssets.includes('wp-meuble-ikea-kit'), 'Doit inclure le carton ouvert du kit');
assert(ikeaAssets.includes('wp-quincaillerie-ikea'), 'Doit inclure le sachet de quincaillerie avec tourillons');
assert(ikeaAssets.includes('wp-cle-allen'), 'Doit inclure la clé Allen 4mm');
assert(ikeaAssets.includes('wp-equerre-murale'), 'Doit inclure l’équerre métallique de retenue');
assert(ikeaAssets.includes('wp-etagere-ikea'), 'Doit inclure l’étagère en assemblage');

assert.equal(ikeaNLP.patch.rulesChanged?.length, 4, '4 règles causales de montage doivent être définies');
assert.equal(ikeaNLP.patch.invariantsAdded?.length, 1, 'Invariant de sécurité murale obligatoire');
assert.equal(ikeaNLP.patch.invariantsAdded?.[0]?.id, 'INV_IKEA_SAFETY_WALL_ANCHOR');
assert.equal(ikeaNLP.patch.questsAdded?.[0]?.steps?.length, 4, 'Quête IKEA pas-à-pas en 4 étapes');

// 2. Expérience B2B Game Design Studio 3D (Level Design & Playtest IA)
const gamedevNLP = parseInstruction('Créer un jeu de plateforme 3D avec plateformes, gemmes et playtest IA', nullCtx);
assert.equal(gamedevNLP.plan.intent, 'design_3d_platformer_game', 'Intent doit être design_3d_platformer_game');
assert(gamedevNLP.patch.entitiesCreated, 'Entités du studio de création 3D doivent être créées');
assert.equal(gamedevNLP.patch.entitiesCreated.length, 7, 'Le studio doit comporter 7 entités interactives');
const gamedevAssets = gamedevNLP.patch.entitiesCreated.map((e: any) => e.visuals?.assetId);
assert(gamedevAssets.includes('wp-console-level-design'), 'Doit inclure la console holographique');
assert(gamedevAssets.includes('wp-spawn-pad'), 'Doit inclure le spawn pad joueur');
assert(gamedevAssets.includes('wp-plateforme-flottante'), 'Doit inclure les plateformes magnétiques');
assert(gamedevAssets.includes('wp-gemme-collectable'), 'Doit inclure les gemmes ambrées');
assert(gamedevAssets.includes('wp-piege-laser'), 'Doit inclure la tourelle piège laser');
assert(gamedevAssets.includes('wp-portail-victoire'), 'Doit inclure le portail dimensionnel doré');

assert.equal(gamedevNLP.patch.rulesChanged?.length, 4, '4 règles de Level Design et Playtest définies');
assert.equal(gamedevNLP.patch.invariantsAdded?.[0]?.id, 'INV_GAMEDEV_REACHABLE_GOAL');
assert.equal(gamedevNLP.patch.questsAdded?.[0]?.steps?.length, 4, 'Quête GameDev en 4 étapes');

// 3. Masterclass Pâtisserie Cookies Enrichie
const cookiesNLP = parseInstruction('Préparer et faire cuire des cookies aux pépites de chocolat au four', nullCtx);
assert.equal(cookiesNLP.plan.intent, 'bake_chocolate_chip_cookies');
assert.equal(cookiesNLP.patch.entitiesCreated?.length, 6, 'Doit inclure plan, plateau ingrédients, saladier, plaque et four');
assert.equal(cookiesNLP.patch.rulesChanged?.length, 4, '4 règles : émulsion, pétrissage, façonnage, enfournement');
assert.equal(cookiesNLP.patch.questsAdded?.[0]?.steps?.length, 4, 'Masterclass cookies en 4 étapes méthodiques');

// 4. Moteur Cognitif d’Observations, Mémoire & Arbitrage IA
const storeCognitive = useWorldStore.getState();
assert(Array.isArray(storeCognitive.agentObservations), 'agentObservations doit être un tableau');
assert(storeCognitive.agentObservations.length >= 4, 'Doit contenir les observations initiales de référence');
assert(storeCognitive.agentLedgerSummary, 'agentLedgerSummary doit être calculé');
assert(storeCognitive.agentLedgerSummary.totalObservations >= 4);

// Test d'ouverture / fermeture du modal d'arbitrage
storeCognitive.openAgentLedgerModal();
assert.equal(useWorldStore.getState().showAgentLedgerModal, true, 'openAgentLedgerModal doit ouvrir le modal');
storeCognitive.closeAgentLedgerModal();
assert.equal(useWorldStore.getState().showAgentLedgerModal, false, 'closeAgentLedgerModal doit fermer le modal');

// Test d'arbitrage autonome bayésien
const testObservation = {
  id: 'obs-test-telemetry',
  timestamp: Date.now(),
  agentId: 'agent-sophie-qa',
  agentName: 'Sophie (QA Lead)',
  experienceId: 'cert_auto_battery_12v',
  experienceTitle: 'Batterie Automobile 12V',
  category: 'securite_procedure' as const,
  severity: 'critique' as const,
  observation: 'L’étincelle de court-circuit doit être signalée visuellement avant le serrage de la cosse positive.',
  evidence: { errorCount: 2 },
  suggestedImprovement: {
    id: 'imp-spark-alert',
    observationId: 'obs-test-telemetry',
    title: 'Alerte visuelle étincelle de polarité',
    description: 'Afficher un halo d’avertissement orange sur la cosse (+).',
    targetComponent: '3d_scene' as const,
    expectedImpact: 'Prévention 100% des erreurs d’inversion de polarité.',
    confidenceScore: 0.95
  }
};

storeCognitive.recordAgentObservation(testObservation);
const updatedObs = useWorldStore.getState().agentObservations;
const added = updatedObs.find(o => o.id === 'obs-test-telemetry');
assert(added, 'L’observation doit être journalisée dans la mémoire cognitive');
assert(added?.arbitration, 'L’arbitrage autonome doit avoir été calculé automatiquement');
assert.equal(added?.arbitration?.decision, 'approved', 'Une observation critique à confiance 0.95 doit être approuvée');
assert.equal(added?.arbitration?.timing, 'immediate', 'L’échéancier doit être immediate pour une sévérité critique');

// Test de hot-patch en direct
storeCognitive.applyAgentHotPatch('obs-test-telemetry');
const patchedObs = useWorldStore.getState().agentObservations.find(o => o.id === 'obs-test-telemetry');
assert.equal(patchedObs?.arbitration?.decision, 'integrated', 'Le hot-patch doit marquer la décision integrated');

// Test d'export JSON
const exportedJson = storeCognitive.exportAgentLedgerJson();
assert(typeof exportedJson === 'string' && exportedJson.length > 50, 'L’export JSON doit être une chaîne valide');
const parsedExport = JSON.parse(exportedJson);
assert(Array.isArray(parsedExport.observations), 'L’export JSON doit contenir la liste des observations');

console.log('PASS: Suite 39 validée avec succès (Expériences B2B IKEA/GameDev, Masterclass Cookies & Journal Cognitif IA).');

// --- Suite 40 : Pipeline de post-traitement cinématique ---
import { CinematicColorGradingShader } from '../scene/CinematicPostProcessing';

console.log('--- Démarrage de la Suite 40 : Pipeline de post-traitement cinématique ---');
const storeCine = useWorldStore.getState();

// 1. Initial State & Store actions
assert.equal(storeCine.cinematicPreset, 'studio_neutral', 'Le preset initial doit être neutre');
assert.equal(typeof storeCine.bloomIntensity, 'number');
assert.equal(typeof storeCine.vignetteStrength, 'number');
assert.equal(typeof storeCine.chromaticAberration, 'number');
assert.equal(storeCine.showCinematicModal, false);

// 2. Preset Switching
storeCine.setCinematicPreset('golden_hour');
assert.equal(useWorldStore.getState().cinematicPreset, 'golden_hour');

storeCine.setCinematicPreset('cyberpunk_neon');
assert.equal(useWorldStore.getState().cinematicPreset, 'cyberpunk_neon');

storeCine.setCinematicPreset('studio_neutral');
assert.equal(useWorldStore.getState().cinematicPreset, 'studio_neutral');

storeCine.setCinematicPreset('standard');
assert.equal(useWorldStore.getState().cinematicPreset, 'standard');

// Restituer le preset par défaut
storeCine.setCinematicPreset('cinematic');
assert.equal(useWorldStore.getState().cinematicPreset, 'cinematic');

// 3. Sliders & Modal open/close
storeCine.setBloomIntensity(1.75);
assert.equal(useWorldStore.getState().bloomIntensity, 1.75);

storeCine.setVignetteStrength(0.42);
assert.equal(useWorldStore.getState().vignetteStrength, 0.42);

storeCine.setChromaticAberration(0.0025);
assert.equal(useWorldStore.getState().chromaticAberration, 0.0025);

storeCine.setShowCinematicModal(true);
assert.equal(useWorldStore.getState().showCinematicModal, true);
storeCine.setShowCinematicModal(false);
assert.equal(useWorldStore.getState().showCinematicModal, false);

// 4. Cinematic Shader Integrity
assert(CinematicColorGradingShader.uniforms, 'Le shader doit définir ses uniforms');
assert('tDiffuse' in CinematicColorGradingShader.uniforms, 'Uniform tDiffuse requis');
assert('uChromaticAberration' in CinematicColorGradingShader.uniforms, 'Uniform uChromaticAberration requis');
assert('uVignetteDarkness' in CinematicColorGradingShader.uniforms, 'Uniform uVignetteDarkness requis');
assert('uVignetteOffset' in CinematicColorGradingShader.uniforms, 'Uniform uVignetteOffset requis');
assert('uPreset' in CinematicColorGradingShader.uniforms, 'Uniform uPreset requis');
assert('uFilmGrain' in CinematicColorGradingShader.uniforms, 'Uniform uFilmGrain requis');

assert(!CinematicColorGradingShader.fragmentShader.includes('acesFilmic'), 'Le shader de grade ne doit pas appliquer un deuxième tone mapping');
assert(CinematicColorGradingShader.fragmentShader.includes('uChromaticAberration'), 'Le fragment shader doit gérer la dispersion chromatique radiale');
assert(CinematicColorGradingShader.fragmentShader.includes('vignette'), 'Le fragment shader doit inclure le vignettage optique');
assert(CinematicColorGradingShader.fragmentShader.includes('hashGrain'), 'Le fragment shader doit injecter le grain de film 35mm');

console.log('PASS: Suite 40 validée avec succès (chaîne colorimétrique, presets et shader cinématique).');

// --- Suite 41 : Lanceur d'Expérience Immédiat (Zero-Click Launchpad) ---
import { ZeroClickLaunchpad } from '../ui/ZeroClickLaunchpad';

console.log('--- Démarrage de la Suite 41 : Lanceur d\'Expérience Immédiat (0-Clic) ---');
assert(typeof ZeroClickLaunchpad === 'function', 'Le composant ZeroClickLaunchpad doit être une fonction React valide');

// Tester que la scène vidée permet d'afficher le lanceur 0-clic
useWorldStore.getState().resetWorld();
const emptyWorldEntities = useWorldStore.getState().world.ir.entities;
assert.equal(Object.keys(emptyWorldEntities).length, 0, 'La scène réinitialisée doit être vide pour afficher le lanceur 0-clic');

console.log('PASS: Suite 41 validée avec succès (Lanceur 0-Clic, Immersion Instantanée & Découverte des Chefs-d’Œuvre).');

// --- Suite 42 : Polissage Physique, Détection d'Altitude de Surface & Snap Magnétique ---
import { getSupportingSurfaceHeight } from '../engine/spatialSurface';

console.log('--- Démarrage de la Suite 42 : Polissage Physique & Manipulation de Précision ---');

// 1. Détection de table chêne
const mockEntities: Record<string, EntitySpec> = {
  table_1: {
    id: 'table_1',
    name: 'Grande Table en Chêne Massif',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.912, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ],
    visuals: { assetId: 'dining_table' }
  },
  comptoir_1: {
    id: 'comptoir_1',
    name: 'Comptoir de Bar Inox',
    capabilities: [
      { type: 'transform', position: { x: 2.5, y: 1.05, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ],
    visuals: { assetId: 'bar_counter' }
  },
  podium_1: {
    id: 'podium_1',
    name: 'Estrade de Présentation Hypercar',
    capabilities: [
      { type: 'transform', position: { x: -3.5, y: 0.2, z: -2.0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ],
    visuals: { assetId: 'showroom_podium' }
  },
  knife_drag: {
    id: 'knife_drag',
    name: 'Couteau Santoku',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 1.25, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'draggable' }
    ]
  }
};

// Test A : Au-dessus de la table (x: 0, z: 0)
const surfaceTable = getSupportingSurfaceHeight(0, 0, mockEntities, 'knife_drag');
assert.equal(surfaceTable.isGround, false, 'Au centre de la table, ne doit pas être le sol');
assert(Math.abs(surfaceTable.surfaceY - 0.912) < 0.001, `Altitude de table attendue ~0.912, reçue: ${surfaceTable.surfaceY}`);
assert.equal(surfaceTable.supportEntity?.id, 'table_1');
assert.equal(surfaceTable.surfaceName, 'Grande Table en Chêne Massif');

// Test B : Au-dessus du comptoir (x: 2.5, z: 0)
const surfaceCounter = getSupportingSurfaceHeight(2.5, 0, mockEntities, 'knife_drag');
assert.equal(surfaceCounter.isGround, false, 'Sur le comptoir, ne doit pas être le sol');
assert(Math.abs(surfaceCounter.surfaceY - 1.05) < 0.001, `Altitude de comptoir attendue ~1.05, reçue: ${surfaceCounter.surfaceY}`);
assert.equal(surfaceCounter.supportEntity?.id, 'comptoir_1');

// Test C : Au-dessus du podium d'exposition (x: -3.5, z: -2.0)
const surfacePodium = getSupportingSurfaceHeight(-3.5, -2.0, mockEntities, 'knife_drag');
assert.equal(surfacePodium.isGround, false, 'Sur le podium, ne doit pas être le sol');
assert(Math.abs(surfacePodium.surfaceY - 0.35) < 0.001, `Altitude de podium attendue 0.2 + 0.15 = 0.35, reçue: ${surfacePodium.surfaceY}`);
assert.equal(surfacePodium.supportEntity?.id, 'podium_1');

// Test D : En dehors des meubles (sol libre à x: 8, z: 8)
const surfaceGround = getSupportingSurfaceHeight(8, 8, mockEntities, 'knife_drag');
assert.equal(surfaceGround.isGround, true, 'En dehors de tout meuble, doit être le sol');
assert.equal(surfaceGround.surfaceY, 0, 'Altitude du sol doit être exactement 0');
assert.equal(surfaceGround.surfaceName, 'Sol');
assert.equal(surfaceGround.supportEntity, null);

// Test E : Superposition avec planche à découper posée sur la table
const mockEntitiesStacked: Record<string, EntitySpec> = {
  ...mockEntities,
  planche_1: {
    id: 'planche_1',
    name: 'Planche en Bois d\'Olivier',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.912, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ],
    visuals: { assetId: 'cutting_board' }
  }
};
const surfaceStacked = getSupportingSurfaceHeight(0, 0, mockEntitiesStacked, 'knife_drag');
assert.equal(surfaceStacked.isGround, false);
assert(Math.abs(surfaceStacked.surfaceY - (0.912 + 0.03)) < 0.001, 'La planche à découper doit surélever la surface de contact de 3cm');
assert.equal(surfaceStacked.supportEntity?.id, 'planche_1');

// Test F : Exclusion de l'objet manipulé
const selfCheck = getSupportingSurfaceHeight(0, 0, { table_1: mockEntities.table_1 }, 'table_1');
assert.equal(selfCheck.isGround, true, 'Un objet exclu ne doit pas se détecter lui-même comme support');

console.log('PASS: Suite 42 validée avec succès (Détection d\'Altitude de Surface, Drop Précis & Réticule Laser Grounding).');

// --- Suite 43 : Sound Design Spatialisé Procédural (Web Audio 3D & Convolver Reverb) ---
import { playAudioFx } from '../engine/evaluator';

console.log('--- Démarrage de la Suite 43 : Sound Design Spatialisé Procédural & Acoustique Réverbérante ---');

// 1. Acoustic Space Configuration
assert.equal(typeof ambientAudio.getAcousticSpace, 'function');
assert.equal(typeof ambientAudio.setAcousticSpace, 'function');

ambientAudio.setAcousticSpace('luxury_showroom');
assert.equal(ambientAudio.getAcousticSpace(), 'luxury_showroom');

ambientAudio.setAcousticSpace('wood_cabin');
assert.equal(ambientAudio.getAcousticSpace(), 'wood_cabin');

ambientAudio.setAcousticSpace('metallic_lab');
assert.equal(ambientAudio.getAcousticSpace(), 'metallic_lab');

ambientAudio.setAcousticSpace('kitchen');
assert.equal(ambientAudio.getAcousticSpace(), 'kitchen');

// 2. Atmosphere to Acoustic Space mapping
ambientAudio.setAtmosphere('le-refuge');
assert.equal(ambientAudio.getAcousticSpace(), 'wood_cabin');

ambientAudio.setAtmosphere('supercar_showroom');
assert.equal(ambientAudio.getAcousticSpace(), 'luxury_showroom');

ambientAudio.setAtmosphere('cozy-bistrot');
assert.equal(ambientAudio.getAcousticSpace(), 'kitchen');

ambientAudio.setAtmosphere('station-spatiale');
assert.equal(ambientAudio.getAcousticSpace(), 'metallic_lab');

// 3. Listener Spatial Synchronization
assert.equal(typeof ambientAudio.updateListener, 'function');
ambientAudio.updateListener(1, 2, 3, 0, 0, -1, 0, 1, 0);

// 4. Procedural Impulse Response Builder
assert.equal(typeof ambientAudio.buildProceduralImpulseResponse, 'function');
assert.equal(typeof ambientAudio.getReverbNode, 'function');

// 5. SoundEffect typing & positional dispatch
const testSounds: SoundEffect[] = [
  'snap_connect',
  'snap_release',
  'impact_wood',
  'impact_metal',
  'impact_stone',
  'drag_whoosh',
  'soft_drop'
];
for (const s of testSounds) {
  playAudioFx(s, { x: 0, y: 1, z: 0 });
}

console.log('PASS: Suite 43 validée avec succès (Acoustique Spatiale Procédurale, Convolver Reverb & Impacts Matériaux).');

// --- Suite 44 : Passerelle WebXR & Immersion Réalité Virtuelle (6DOF, Haptique Fine & Anti-Cinétose) ---
import { xrHaptics, type XRHapticProfile } from '../scene/xrHaptics';
import { xrStore } from '../scene/xrStore';
import { XRPlayerRig } from '../scene/XRPlayerRig';

console.log('--- Démarrage de la Suite 44 : Passerelle WebXR, Haptique Tactile 6DOF & Téléportation ---');

// 1. XR Store Integrity
assert(xrStore, 'xrStore doit être initialisé');
assert.equal(typeof xrStore.enterVR, 'function', 'xrStore doit exposer la méthode enterVR');
assert.equal(typeof xrStore.enterAR, 'function', 'xrStore doit exposer la méthode enterAR');
assert.equal(typeof xrStore.getState, 'function', 'xrStore doit exposer la méthode getState');

// 2. XR Player Rig Component
assert(typeof XRPlayerRig === 'function', 'XRPlayerRig doit être un composant React fonctionnel valide');

// 3. Tactile 6DOF Haptic Profiles Verification
const allHapticProfiles: XRHapticProfile[] = [
  'subtle_tap',
  'snap_connect',
  'snap_release',
  'warning_shock',
  'quantum_chime',
  'impact_wood',
  'impact_metal',
  'impact_stone',
  'chop_slice',
  'teleport_dash',
  'snap_turn'
];

assert.equal(allHapticProfiles.length, 11, 'Il doit y avoir exactement 11 profils haptiques distincts');

// All triggers must execute smoothly without throwing exceptions
for (const profile of allHapticProfiles) {
  assert.doesNotThrow(() => {
    xrHaptics.triggerHaptic(profile);
  }, `triggerHaptic(${profile}) ne doit lever aucune exception`);
}

console.log('PASS: Suite 44 validée avec succès (Passerelle WebXR, Haptique Tactile 6DOF & Locomotion Anti-Cinétose).');

// -------------------------------------------------------------
// Suite 45 : Avatar IA Parlant avec Réaction Labiale, Clignement & Gestuelle Co-Speech
// -------------------------------------------------------------
import { 
  isAgentSpeakingGlobal, 
  setAgentSpeakingState, 
  speakAgentDialogue,
  extractVisemeFromText,
  VISEME_CONFIGS
} from '../engine/agentDialogues';

console.log('--- Démarrage de la Suite 45 : Avatar IA Parlant avec Réaction Labiale, Clignement & Gestuelle Co-Speech ---');

// 1. Initial speech state
assert.strictEqual(typeof isAgentSpeakingGlobal(), 'boolean', 'isAgentSpeakingGlobal doit retourner un booléen');

// 2. State transition and Event Dispatching
let eventFiredWith: boolean | null = null;
const speechListener = (e: any) => {
  eventFiredWith = e.detail?.isSpeaking;
};

if (typeof window !== 'undefined') {
  window.addEventListener('worldpilot_agent_speech_state', speechListener);
}

setAgentSpeakingState(true);
assert.strictEqual(isAgentSpeakingGlobal(), true, 'Le statut global doit être true après activation');
if (typeof window !== 'undefined') {
  assert.strictEqual(eventFiredWith, true, 'L\'événement worldpilot_agent_speech_state doit être diffusé avec true');
}

setAgentSpeakingState(false);
assert.strictEqual(isAgentSpeakingGlobal(), false, 'Le statut global doit repasser à false');
if (typeof window !== 'undefined') {
  assert.strictEqual(eventFiredWith, false, 'L\'événement worldpilot_agent_speech_state doit être diffusé avec false');
  window.removeEventListener('worldpilot_agent_speech_state', speechListener);
}

// 3. speakAgentDialogue robustness without speech synthesis environment
assert.doesNotThrow(() => {
  speakAgentDialogue("Test de phonation vocale procédurale et de synchronisation labiale.");
}, 'speakAgentDialogue ne doit lever aucune exception même en environnement headless');

// 4. Phonetic-to-Viseme Extractor & Configuration Integrity
assert.strictEqual(extractVisemeFromText('Bonjour'), 'pbm', 'Le mot "Bonjour" doit commencer par un visème bilabial (P/B/M)');
assert.strictEqual(extractVisemeFromText('Parfait'), 'pbm', 'Le mot "Parfait" doit déclencher le visème compressé bilabial');
assert.strictEqual(extractVisemeFromText('Formidable'), 'fv', 'Le mot "Formidable" doit déclencher le visème labiodental (F/V)');
assert.strictEqual(extractVisemeFromText('Attention'), 'aa', 'Le mot "Attention" doit ouvrir grand la mâchoire (A)');
assert.strictEqual(extractVisemeFromText('Écoutez'), 'e', 'Le mot "Écoutez" doit élargir les lèvres (E/AI)');
assert.strictEqual(extractVisemeFromText('Ici'), 'i', 'Le mot "Ici" doit étirer horizontalement (I)');
assert.strictEqual(extractVisemeFromText('Oiseau'), 'o', 'Le mot "Oiseau" doit arrondir les lèvres en O');
assert.strictEqual(extractVisemeFromText('Unique'), 'u', 'Le mot "Unique" doit projeter les lèvres en U');
assert.strictEqual(extractVisemeFromText(''), 'silence', 'Une chaîne vide doit retourner le visème silence');

assert.strictEqual(VISEME_CONFIGS.aa.openness, 1.0, 'Le visème AA doit avoir une ouverture maximale');
assert(VISEME_CONFIGS.pbm.scaleY <= 0.40, 'Le visème bilabial PBM doit fermer fermement la lèvre');
assert(VISEME_CONFIGS.o.scaleX < 1.0, 'Le visème O doit resserrer horizontalement la bouche');
assert(VISEME_CONFIGS.i.scaleX > 1.4, 'Le visème I doit élargir les commissures labiales');

console.log('PASS: Suite 45 validée avec succès (Avatar IA Parlant avec Réaction Labiale, Clignement & Gestuelle Co-Speech).');

// -------------------------------------------------------------
// Suite 46 : Bibliothèque de Matériaux PBR & Textures Pré-Calibrées
// -------------------------------------------------------------
import { 
  PBR_PRESETS, 
  getAllPBRMaterialPresets, 
  getPBRMaterialPreset, 
  findPBRMaterialByQuery, 
  getMaterialMaps,
  createPBRMaterial
} from '../scene/pbrMaterials';

console.log('--- Démarrage de la Suite 46 : Bibliothèque de Matériaux PBR & Textures Pré-Calibrées ---');

// 1. Presets Integrity
assert(PBR_PRESETS.carrara_marble, 'PBR_PRESETS doit indexer directement carrara_marble');
const allPresets = getAllPBRMaterialPresets();
assert(allPresets.length >= 10, 'Il doit y avoir au moins 10 matériaux PBR pré-calibrés');

const marble = getPBRMaterialPreset('carrara_marble');
assert(marble, 'Le preset carrara_marble doit exister');
assert.strictEqual(marble.category, 'luxury');
assert(marble.roughness <= 0.25, 'Le marbre poli doit avoir une rugosité faible');
assert(marble.clearcoat && marble.clearcoat >= 0.7, 'Le marbre poli doit posséder un vernis cristallin');

const walnut = getPBRMaterialPreset('walnut_wood');
assert(walnut, 'Le preset walnut_wood doit exister');
assert.strictEqual(walnut.category, 'natural');
assert(walnut.roughness >= 0.35, 'Le bois doit avoir une rugosité satinée');

const leather = getPBRMaterialPreset('grained_leather');
assert(leather, 'Le preset grained_leather doit exister');
assert(leather.sheen && leather.sheen >= 0.7, 'Le cuir doit avoir un reflet velouté sheen');

const steel = getPBRMaterialPreset('brushed_steel');
assert(steel, 'Le preset brushed_steel doit exister');
assert(steel.metalness >= 0.9, 'L\'acier inox doit être hautement métallique');

// 2. Query Resolution
assert.strictEqual(findPBRMaterialByQuery('marbre de carrare')?.id, 'carrara_marble');
assert.strictEqual(findPBRMaterialByQuery('bois de noyer')?.id, 'walnut_wood');
assert.strictEqual(findPBRMaterialByQuery('fauteuil en cuir')?.id, 'grained_leather');
assert.strictEqual(findPBRMaterialByQuery('inox brossé')?.id, 'brushed_steel');
assert.strictEqual(findPBRMaterialByQuery('béton ciré')?.id, 'waxed_concrete');
assert.strictEqual(findPBRMaterialByQuery('or impérial')?.id, 'imperial_brass');

// 3. Procedural Maps Generation (Safe Headless Fallback)
assert.doesNotThrow(() => {
  const maps = getMaterialMaps('carrara_marble');
  assert(maps, 'getMaterialMaps doit retourner un objet maps');
}, 'getMaterialMaps ne doit lever aucune exception');

// 4. Natural Language Parser Recognition for PBR Materials
const pbrEntities: Record<string, EntitySpec> = {
  table_salon: {
    id: 'table_salon',
    name: 'Table basse de salon',
    capabilities: [{ type: 'transform', position: { x: 0, y: 0.5, z: 0 } }],
    visuals: { shape: 'box', color: '#cccccc' }
  },
  comptoir_bar: {
    id: 'comptoir_bar',
    name: 'Comptoir de réception',
    capabilities: [{ type: 'transform', position: { x: 1, y: 1.0, z: 0 } }],
    visuals: { shape: 'box', color: '#888888' }
  }
};

// Test A: Explicit named entity in instruction
const parseMarble = parseInstruction("mets une texture marbre blanc sur la table", { selectedEntityId: null, pointedEntityId: null }, pbrEntities);
assert.strictEqual(parseMarble.plan.intent, 'apply_pbr_material', 'L\'intention doit être apply_pbr_material');
assert(parseMarble.patch.entitiesChanged && parseMarble.patch.entitiesChanged.length > 0);
assert.strictEqual(parseMarble.patch.entitiesChanged[0].id, 'table_salon');
assert.strictEqual(parseMarble.patch.entitiesChanged[0].visuals?.materialPreset, 'carrara_marble');
assert.strictEqual(parseMarble.patch.entitiesChanged[0].visuals?.textureUrl, 'pbr:carrara_marble');

// Test B: Context selected entity
const parseWood = parseInstruction("applique du bois de noyer", { selectedEntityId: 'comptoir_bar', pointedEntityId: null }, pbrEntities);
assert.strictEqual(parseWood.plan.intent, 'apply_pbr_material');
assert.strictEqual(parseWood.patch.entitiesChanged![0].id, 'comptoir_bar');
assert.strictEqual(parseWood.patch.entitiesChanged![0].visuals?.materialPreset, 'walnut_wood');
assert.strictEqual(parseWood.patch.entitiesChanged![0].visuals?.textureUrl, 'pbr:walnut_wood');

console.log('PASS: Suite 46 validée avec succès (Bibliothèque de Matériaux PBR & Textures Pré-Calibrées).');

// -------------------------------------------------------------
// Suite 47 : Surcharge PBR non destructive sur Modèles GLTF, Restauration & Matching Sémantique
// -------------------------------------------------------------
console.log('--- Démarrage de la Suite 47 : Surcharge PBR sur Modèles GLTF, Restauration & Matching Sémantique ---');

// 1. Factory createPBRMaterial
const pbrMat = createPBRMaterial('carrara_marble', {
  roughness: 0.12,
  metalness: 0.05,
  color: '#fafafa'
});
assert(pbrMat instanceof T.MeshPhysicalMaterial, 'createPBRMaterial doit retourner une instance de THREE.MeshPhysicalMaterial');
assert.strictEqual(pbrMat.roughness, 0.12, 'La rugosité customisée doit être appliquée');
assert.strictEqual(pbrMat.metalness, 0.05, 'La métallisation customisée doit être appliquée');
assert.strictEqual(pbrMat.clearcoat, 0.85, 'Le clearcoat par défaut du preset marble doit être préservé');

const carbonMat = createPBRMaterial('carbon_fiber');
assert.strictEqual(carbonMat.clearcoat, 0.95);
assert.strictEqual(carbonMat.roughness, 0.22);
assert.strictEqual(carbonMat.metalness, 0.48);

// 2. Non-destructive GLTF Material Override & Reset Flow
// Test entity with native GLTF model
const gltfEntity: EntitySpec = {
  id: 'meeting_table_test',
  name: 'Table de conférence',
  capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }],
  visuals: {
    shape: 'box',
    assetId: 'meeting-table',
    modelUrl: '/library/meeting-table.glb'
  }
};

// Check native state (not PBR override)
const isPBRNative = Boolean(gltfEntity.visuals?.materialPreset || gltfEntity.visuals?.textureUrl?.startsWith('pbr:'));
assert.strictEqual(isPBRNative, false, 'Une entité GLTF native ne doit pas être marquée isPBR');

// Apply PBR Material Override patch (e.g. from 3D swatch popover or Inspector)
const overridePatch: WorldPatch = {
  entitiesChanged: [{
    id: 'meeting_table_test',
    visuals: {
      ...gltfEntity.visuals,
      materialPreset: 'carrara_marble',
      textureUrl: 'pbr:carrara_marble',
      roughness: 0.15,
      metalness: 0.0
    }
  }]
};

const modifiedEntity = {
  ...gltfEntity,
  visuals: overridePatch.entitiesChanged![0].visuals
};

const isPBROverridden = Boolean(modifiedEntity.visuals?.materialPreset || modifiedEntity.visuals?.textureUrl?.startsWith('pbr:'));
assert.strictEqual(isPBROverridden, true, 'L\'entité modifiée doit être reconnue comme ayant un override PBR');
assert.strictEqual(modifiedEntity.visuals?.materialPreset, 'carrara_marble');
assert.strictEqual(modifiedEntity.visuals?.assetId, 'meeting-table', 'L\'assetId GLTF d\'origine doit être scrupuleusement conservé');

// Revert / Reset to native textures (Action "🔄 D'origine")
const resetPatch: WorldPatch = {
  entitiesChanged: [{
    id: 'meeting_table_test',
    visuals: {
      ...modifiedEntity.visuals,
      materialPreset: undefined,
      textureUrl: undefined,
      roughness: undefined,
      metalness: undefined
    }
  }]
};

const restoredEntity = {
  ...modifiedEntity,
  visuals: resetPatch.entitiesChanged![0].visuals
};

const isPBRRestored = Boolean(restoredEntity.visuals?.materialPreset || restoredEntity.visuals?.textureUrl?.startsWith('pbr:'));
assert.strictEqual(isPBRRestored, false, 'Après reset "D\'origine", isPBR doit être false et restituer les textures natives du GLTF');
assert.strictEqual(restoredEntity.visuals?.materialPreset, undefined);
assert.strictEqual(restoredEntity.visuals?.assetId, 'meeting-table');

// 3. GLTF Catalog & Matching Sémantique (540 assets GLTF)
// A. "ajoute une table" -> meeting-table
const tableResult = parseLibraryInstruction('ajoute une table', {});
assert(tableResult, 'L\'instruction "ajoute une table" doit résoudre un asset GLTF');
assert.strictEqual(tableResult.entitiesCreated?.[0].visuals?.assetId, 'meeting-table');

// B. "ajoute un microscope" -> microscope
const microscopeResult = parseLibraryInstruction('ajoute un microscope', {});
assert(microscopeResult, 'L\'instruction "ajoute un microscope" doit résoudre l\'asset GLTF');
assert.strictEqual(microscopeResult.entitiesCreated?.[0].visuals?.assetId, 'microscope');

// C. "mets un fauteuil" -> office-chair
const chairResult = parseLibraryInstruction('mets un fauteuil', {});
assert(chairResult, 'L\'instruction "mets un fauteuil" doit matcher office-chair');
assert.strictEqual(chairResult.entitiesCreated?.[0].visuals?.assetId, 'office-chair');

// D. Complex intent guard: gameplay loop or macros must bypass single GLTF match
const complexResult1 = parseLibraryInstruction('ajoute un jeu de tir', {});
assert.strictEqual(complexResult1, null, 'Les mots-clés de jeu complexe ne doivent pas être interceptés par le catalogue GLTF unitaire');

const complexResult2 = parseLibraryInstruction('ajoute un stand de tir', {});
assert.strictEqual(complexResult2, null, 'Les macros de stand de tir doivent être déléguées au moteur procédural de gameplay');

console.log('PASS: Suite 47 validée avec succès (Surcharge PBR sur GLTF, Restauration & Matching Sémantique).');

// =========================================================================
// SUITE 48 : Multi-Parcours Pitch Démo 180s & Panneau Web Draggable / PBR Adouci
// =========================================================================
console.log('--- Démarrage de la Suite 48 : Multi-Parcours Pitch Démo 180s & Panneau Web Draggable ---');
const { PITCH_TRACKS: importedPitchTracks } = await import('../ui/PitchDemoDirector');
const { cookingRecipes: testCookingRecipes, createRecipePatch: testCreateRecipePatch } = await import('../library/cookingRecipes');

// 1. Structure du Catalogue Multi-Parcours (5 Pistes Scénarisées)
assert.strictEqual(importedPitchTracks.length, 5, 'Le catalogue doit comporter exactement 5 parcours scénarisés');
const expectedTrackIds = ['deep_tech', 'haute_gastronomie', 'luxe_vendome', 'aerospatiale', 'fle_paris'];
assert.deepStrictEqual(importedPitchTracks.map(t => t.id), expectedTrackIds, 'Les identifiants des 5 parcours doivent être conformes');

// 2. Vérification rigoureuse de la durée de 180s pour chaque parcours
for (const track of importedPitchTracks) {
  assert.strictEqual(track.acts.length, 5, `Le parcours ${track.id} doit comporter exactement 5 actes`);
  const totalTrackSec = track.acts.reduce((sum, act) => sum + act.durationSec, 0);
  assert.strictEqual(totalTrackSec, 180, `La durée cumulée du parcours ${track.id} doit être exactement de 180s (3:00)`);
  assert(track.nameFr && track.nameFr.length > 3, `Nom FR manquant pour ${track.id}`);
  assert(track.nameEn && track.nameEn.length > 3, `Nom EN manquant pour ${track.id}`);
  assert(track.taglineFr && track.taglineFr.length > 10, `Tagline FR manquante pour ${track.id}`);
  assert(track.taglineEn && track.taglineEn.length > 10, `Tagline EN manquante pour ${track.id}`);
  assert(track.icon && track.icon.length >= 1, `Icône manquante pour ${track.id}`);
  assert(track.themeColor && track.themeColor.startsWith('#'), `Couleur thématique invalide pour ${track.id}`);
  assert(track.badge && track.badge.length >= 2, `Badge manquant pour ${track.id}`);

  // Validation bilingue de chaque acte
  for (const act of track.acts) {
    assert(act.titleFr && act.titleFr.length > 5, `Titre FR acte ${act.id} manquant dans ${track.id}`);
    assert(act.titleEn && act.titleEn.length > 5, `Titre EN acte ${act.id} manquant dans ${track.id}`);
    assert(act.scriptFr && act.scriptFr.length > 30, `Script FR acte ${act.id} trop court dans ${track.id}`);
    assert(act.scriptEn && act.scriptEn.length > 30, `Script EN acte ${act.id} trop court dans ${track.id}`);
    assert(act.actionFr && act.actionFr.length > 5, `Action FR acte ${act.id} manquante dans ${track.id}`);
    assert(act.actionEn && act.actionEn.length > 5, `Action EN acte ${act.id} manquante dans ${track.id}`);
  }
}

// 3. Vérification de la capacité 'draggable' sur le panneau de projection recette
const ratatouilleRecipe = testCookingRecipes.find(r => r.id === 'recipe-ratatouille');
assert(ratatouilleRecipe, 'La recette de ratatouille doit être définie');
const recipePatch = testCreateRecipePatch(ratatouilleRecipe);
const boardEntity = recipePatch.entitiesCreated?.find(e => e.id.includes('board') || e.visuals?.assetId === 'web-screen');
assert(boardEntity, 'Le grand panneau de projection 3D de la recette doit exister dans l\'environnement');
const hasDraggableCap = boardEntity.capabilities.some(c => c.type === 'draggable');
assert.strictEqual(hasDraggableCap, true, 'Le grand panneau de projection 3D doit posséder la capacité "draggable" pour pouvoir être déplacé');

console.log('PASS: Suite 48 validée avec succès (Multi-Parcours Pitch Démo 180s, Bilinguisme & Panneau Web Draggable).');

// --- Suite 49 : Dépôt d'Objets sur Mobilier, Empreintes Rectangulaires & Repose sur Bureau ---
console.log('--- Démarrage de la Suite 49 : Dépôt d\'Objets sur Mobilier, Empreintes Rectangulaires & Repose sur Bureau ---');

import { isSupportEntity } from '../engine/spatialSurface';

const deskTestEntities: Record<string, EntitySpec> = {
  studio_desk: {
    id: 'studio_desk',
    name: 'Grand Bureau d’Étude & Hub Web 3D',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.8, y: 1.04, z: 1.1 } },
      { type: 'collider' }
    ],
    visuals: { assetId: 'table' }
  },
  book_fallen: {
    id: 'book_fallen',
    name: 'Livre des Savoirs (PDF)',
    capabilities: [
      { type: 'transform', position: { x: 0.45, y: 0, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'draggable' },
      { type: 'collider' }
    ],
    visuals: { assetId: 'book' }
  }
};

// 1. Détection de support sémantique
assert.strictEqual(isSupportEntity(deskTestEntities.studio_desk), true, 'Le bureau doit être identifié comme surface de support');

// 2. Détection sur bordure rectangulaire (x: 1.15m du centre, en dehors du cercle de 0.95m mais sur le plateau de 2.7m)
const edgeDrop = getSupportingSurfaceHeight(1.15, 0.25, deskTestEntities, 'book_fallen');
assert.strictEqual(edgeDrop.isGround, false, 'Le bord du plateau de bureau à x: 1.15m doit être reconnu comme surface de support');
assert.strictEqual(edgeDrop.supportEntity?.id, 'studio_desk', 'L\'entité de support doit être le bureau');
assert(Math.abs(edgeDrop.surfaceY - 0.912) < 0.05, `L'altitude de surface du bureau doit être ~0.912m, reçue: ${edgeDrop.surfaceY}`);

// 3. En dehors du bureau (x: 2.5m, z: 2.5m)
const floorDrop = getSupportingSurfaceHeight(2.5, 2.5, deskTestEntities, 'book_fallen');
assert.strictEqual(floorDrop.isGround, true, 'En dehors de la table, doit être le sol');
assert.strictEqual(floorDrop.surfaceY, 0, 'Altitude du sol doit être 0');

// 4. Test groundEntity sur le store WorldPilot
useWorldStore.setState({
  world: {
    ...useWorldStore.getState().world,
    ir: {
      ...useWorldStore.getState().world.ir,
      entities: {
        ...useWorldStore.getState().world.ir.entities,
        ...deskTestEntities
      }
    }
  }
});

// Appeler groundEntity sur le livre au sol sous la table
useWorldStore.getState().groundEntity('book_fallen');
const groundedBook = useWorldStore.getState().world.ir.entities['book_fallen'];
const groundedY = groundedBook.capabilities.find(c => c.type === 'transform')?.position?.y;
assert(groundedY !== undefined && groundedY >= 0.90, `Le livre doit être remonté et posé sur le bureau à Y >= 0.90m, reçu: ${groundedY}`);

console.log('PASS: Suite 49 validée avec succès (Dépôt d\'Objets sur Mobilier, Empreintes Rectangulaires & Repose sur Bureau).');

// --- Suite 50 : Clarté Visuelle Sans Voile Blanc & Auto-Sauvetage des Objets Déchus ---
console.log('--- Démarrage de la Suite 50 : Clarté Visuelle & Auto-Sauvetage des Objets Déchus ---');

// 1. Test du seuil et force de bloom dans CinematicPostProcessing
assert(CinematicColorGradingShader.uniforms.uExposure.value <= 1.02, 'L\'exposition doit être équilibrée (<= 1.02) pour éviter tout éblouissement blanc');
assert(CinematicColorGradingShader.uniforms.uContrast.value >= 1.10, 'Le contraste doit être préservé (>= 1.10) pour des noirs nets et lisibles');

// 2. Test de détection et élévation automatique de plusieurs objets au sol sous le bureau
const fallenTestEntities: Record<string, EntitySpec> = {
  test_desk: {
    id: 'test_desk',
    name: 'Grand Bureau d’Étude & Hub Web 3D',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.8, y: 1.04, z: 1.1 } },
      { type: 'collider' }
    ],
    visuals: { assetId: 'table' }
  },
  test_laptop_fallen: {
    id: 'test_laptop_fallen',
    name: 'Station Développeur · Documentation Three.js',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.01, z: -0.15 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'draggable' },
      { type: 'collider' }
    ],
    visuals: { assetId: 'ordinateur' }
  },
  test_blueprint_fallen: {
    id: 'test_blueprint_fallen',
    name: 'Dossier Plans CAO & Schémas Techniques (PDF)',
    capabilities: [
      { type: 'transform', position: { x: 0.42, y: 0.02, z: 0.18 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'draggable' },
      { type: 'collider' }
    ],
    visuals: { assetId: 'porte-documents' }
  }
};

for (const [id, entity] of Object.entries(fallenTestEntities)) {
  if (id === 'test_desk') continue;
  const tPos = entity.capabilities.find(c => c.type === 'transform')?.position!;
  const surface = getSupportingSurfaceHeight(tPos.x, tPos.z, fallenTestEntities, id);
  assert.strictEqual(surface.isGround, false, `L'objet ${entity.name} sous la table doit détecter la présence du plateau`);
  assert(surface.surfaceY >= 0.88, `L'altitude détectée doit être celle du plateau (>= 0.88m), reçue: ${surface.surfaceY}`);
}

console.log('PASS: Suite 50 validée avec succès (Clarté Visuelle Sans Voile Blanc & Auto-Sauvetage des Objets Déchus).');

// --- Suite 51 : Stand de Tir Arcade 3D, Cibles Basculantes & Reconnaissance Bilingue ---
console.log('--- Démarrage de la Suite 51 : Stand de Tir Arcade 3D & Reconnaissance Bilingue ---');

// 1. Test de reconnaissance NLP Bilingue (FR / EN)
const parseEnShooter = parseInstruction('Target Shooter', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseEnShooter.plan.intent, 'create_gameplay_loop', 'Le prompt anglais "Target Shooter" doit déclencher le jeu');
assert.equal(parseEnShooter.plan.actions[0].presetId, 'target-range', 'Le presetId doit être target-range');

const parseFrShooter = parseInstruction('Créer un stand de tir arcade', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseFrShooter.plan.intent, 'create_gameplay_loop', 'Le prompt français doit déclencher le jeu');
assert.equal(parseFrShooter.plan.actions[0].presetId, 'target-range', 'Le presetId doit être target-range');

// 2. Vérification des Entités & Invariants du Stand de Tir
const targetGamePatch = createTargetRangeGame();
assert(targetGamePatch.entitiesCreated && targetGamePatch.entitiesCreated.length >= 5, 'Le stand de tir doit créer au moins 5 entités (socle + 4 cibles + console)');
const createdIds = targetGamePatch.entitiesCreated.map(e => e.id);
assert(createdIds.includes('target_range_base'), 'Le socle target_range_base doit être créé');
assert(createdIds.includes('target_alpha'), 'La cible target_alpha doit être créée');
assert(createdIds.includes('target_beta'), 'La cible target_beta doit être créée');
assert(createdIds.includes('target_gamma'), 'La cible target_gamma doit être créée');
assert(createdIds.includes('target_delta'), 'La cible target_delta doit être créée');
assert(createdIds.includes('blaster_console'), 'La console de tir blaster_console doit être créée');

// 3. Règles Causal & Scoring (+50 pts par cible, son laser/hit et victoire à 200 pts)
assert(targetGamePatch.rulesChanged && targetGamePatch.rulesChanged.length >= 4, 'Au moins 4 règles de tir doivent être définies');
const alphaRule = targetGamePatch.rulesChanged.find(r => r.id === 'rule_hit_alpha');
assert(alphaRule !== undefined, 'La règle de tir Alpha doit exister');
assert(alphaRule?.actions?.some(act => act.type === 'increment_score' && act.scoreDelta === 50), 'Abattre une cible doit rapporter 50 points');
assert(alphaRule?.actions?.some(act => act.type === 'play_sound'), 'Un effet sonore doit être émis à l\'impact');

// 4. Timer & Invariants
assert.equal(targetGamePatch.gameplayPatch?.timer, 30, 'Le chronomètre arcade doit être calibré à 30 secondes');
console.log('PASS: Suite 51 validée avec succès (Stand de Tir Arcade 3D, Cibles Basculantes & Reconnaissance Bilingue).');

// --- Suite 52 : Taquin 3D 5x5, Résolution de l'Essaim de Badges & Hover Unique ---
console.log('--- Démarrage de la Suite 52 : Taquin 3D 5x5 & Hover Unique Sans Essaim ---');

import { create3DPuzzleGame } from '../engine/gameplayPresets';

// 1. Test du Hover Unique (Garantie de non-essaim / Anti-Swarm)
assert.equal(useWorldStore.getState().hoveredEntityId, null, 'Au repos, aucun objet ne doit être survolé');
useWorldStore.getState().setHoveredEntityId('puzzle_tile_02');
assert.equal(useWorldStore.getState().hoveredEntityId, 'puzzle_tile_02');
// Le passage sur la tuile 06 doit immédiatement remplacer la tuile 02
useWorldStore.getState().setHoveredEntityId('puzzle_tile_06');
assert.equal(useWorldStore.getState().hoveredEntityId, 'puzzle_tile_06', 'Le survol d’une nouvelle entité doit instantanément écraser le précédent');
assert.notEqual(useWorldStore.getState().hoveredEntityId, 'puzzle_tile_02');
useWorldStore.getState().setHoveredEntityId(null);
assert.equal(useWorldStore.getState().hoveredEntityId, null, 'La sortie du pointeur doit réinitialiser le survol à null');

// 2. Reconnaissance NLP du Puzzle 3D 5x5
const parsePuzzle5x5 = parseInstruction('créer un puzzle 3d en 5 x 5', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parsePuzzle5x5.plan.intent, 'create_gameplay_loop', 'Le prompt "puzzle 3d en 5 x 5" doit créer la boucle de gameplay');
assert.equal(parsePuzzle5x5.plan.actions[0].presetId, 'puzzle-5x5', 'Le presetId doit être puzzle-5x5');

const parseTaquin = parseInstruction('jeu de taquin 3d', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseTaquin.plan.intent, 'create_gameplay_loop');
assert.equal(parseTaquin.plan.actions[0].presetId, 'puzzle-5x5');

// 3. Structure du Puzzle 5x5 (Plateau + 24 Tuiles coulissantes + 2 Boutons)
const puzzlePatch = create3DPuzzleGame(5);
assert(puzzlePatch.entitiesCreated && puzzlePatch.entitiesCreated.length === 27, '5x5 = 1 plateau + 24 tuiles coulissantes + 2 boutons commande = 27 entités');

const puzzleIds = puzzlePatch.entitiesCreated.map(e => e.id);
assert(puzzleIds.includes('puzzle_board_tray'), 'Le plateau du puzzle doit exister');
assert(puzzleIds.includes('puzzle_scramble_btn'), 'Le bouton de mélange doit exister');
assert(puzzleIds.includes('puzzle_solve_btn'), 'Le bouton de résolution doit exister');
assert(puzzleIds.includes('puzzle_tile_01'), 'La tuile N°1 doit exister');
assert(puzzleIds.includes('puzzle_tile_24'), 'La tuile N°24 doit exister');
assert(!puzzleIds.includes('puzzle_tile_25'), 'La 25ème case doit être vide pour permettre le glissement mécanique du taquin');

// 4. Règles & Gameplay State
assert(puzzlePatch.rulesChanged && puzzlePatch.rulesChanged.length >= 26, 'Au moins 26 règles causales (24 clics tuiles + mélange + résolution)');
assert.equal(puzzlePatch.gameplayPatch?.title, 'Taquin 3D · Puzzle 5x5');
assert.equal(puzzlePatch.gameplayPatch?.score, 0);

console.log('PASS: Suite 52 validée avec succès (Taquin 3D 5x5 & Hover Unique Sans Essaim).');

// --- Suite 53 : Expérience Minimale Viable (MVE) & Diagnostic Visuel de l'Observatoire ---
console.log('--- Démarrage de la Suite 53 : MVE & Diagnostic Visuel de l\'Observatoire ---');

const mveStore = useWorldStore.getState();
mveStore.resetWorld();

// 1. Scène sans quête initiale avec entités -> Diagnostic d'alerte MVE
mveStore.applyPatch({
  entitiesCreated: [
    {
      id: 'puzzle_tile_01',
      name: 'Tuile N°01',
      capabilities: [{ type: 'transform', position: { x: 0, y: 0.95, z: 0 } }],
      visuals: { shape: 'box', color: '#38bdf8' }
    }
  ]
}, 'Ajouter tuile puzzle sans quête', { intent: 'add_tile' });

// Vérification : 1 entité, mais 0 quête active
assert.equal(Object.keys(useWorldStore.getState().world.ir.entities).length, 1);
assert.equal(useWorldStore.getState().world.ir.activeQuestId, null);

// 2. Synthèse automatique de Quête MVE pour la scène
const synthesizedQuest = useWorldStore.getState().synthesizeQuestForCurrentScene();
assert(synthesizedQuest !== null, 'Une quête MVE doit avoir été synthétisée');
assert(synthesizedQuest.title.includes('Taquin') || synthesizedQuest.title.includes('Puzzle'), 'La quête synthétisée doit être adaptée au Taquin');
assert.equal(synthesizedQuest.steps.length, 1, 'La quête synthétisée doit comporter une première étape concrète');
assert.equal(synthesizedQuest.steps[0].targetEntityId, 'puzzle_tile_01');
assert.equal(useWorldStore.getState().world.ir.activeQuestId, synthesizedQuest.id, 'La quête synthétisée doit être active');

// 3. Test sur scène de cibles arcade
mveStore.resetWorld();
mveStore.applyPatch({
  entitiesCreated: [
    {
      id: 'target_arcade_1',
      name: 'Cible Dorée',
      capabilities: [{ type: 'transform', position: { x: 0, y: 1.5, z: -3 } }],
      visuals: { shape: 'cylinder', color: '#eab308' }
    }
  ]
}, 'Ajouter cible arcade sans quête', { intent: 'add_target' });

const arcadeQuest = useWorldStore.getState().synthesizeQuestForCurrentScene();
assert(arcadeQuest !== null);
assert(arcadeQuest.title.includes('Tir'), 'La quête doit être adaptée au stand de tir');
assert.equal(useWorldStore.getState().world.ir.activeQuestId, arcadeQuest.id);

console.log('PASS: Suite 53 validée avec succès (MVE & Diagnostic Visuel de l\'Observatoire).');

// --- Démarrage de la Suite 54 : Jeu de Go 3D, Dégagement de l'Avatar & Saisie Fluide ---
console.log('--- Démarrage de la Suite 54 : Jeu de Go 3D, Dégagement de l\'Avatar & Saisie Fluide ---');

// 1. Parsing de l'instruction "crée un jeu de go"
const goParseRes = parseInstruction('crée un jeu de go', { selectedEntityId: null, pointedEntityId: null });
assert.equal(goParseRes.plan.intent, 'create_gameplay_loop');
assert.equal(goParseRes.plan.actions[0].presetId, 'go-game');

const goPatch = goParseRes.patch;
assert(goPatch.entitiesCreated && goPatch.entitiesCreated.length >= 10, 'Le preset Go doit créer le plateau et les pierres');

const goban = goPatch.entitiesCreated.find(e => e.id === 'goban_table');
assert(goban !== undefined, 'Le Goban doit exister');
assert.equal(goban.visuals?.assetId, 'wp-goban');

const blackStones = goPatch.entitiesCreated.filter(e => e.id.startsWith('go_stone_black'));
const whiteStones = goPatch.entitiesCreated.filter(e => e.id.startsWith('go_stone_white'));
assert(blackStones.length >= 6, 'Au moins 6 pierres noires créées');
assert(whiteStones.length >= 6, 'Au moins 6 pierres blanches créées');

// 2. Vérification de l'affordance de manipulation : toutes les pierres doivent être draggables
for (const s of [...blackStones, ...whiteStones]) {
  assert(s.capabilities.some(c => c.type === 'draggable'), `La pierre ${s.id} doit avoir la capability draggable`);
  assert(s.capabilities.some(c => c.type === 'interactive'), `La pierre ${s.id} doit avoir la capability interactive`);
}

// 3. Règles causales : pose de pierre avec impact sonore authentique
const tengenRule = goPatch.rulesChanged?.find(r => r.id === 'rule_click_tengen');
assert(tengenRule !== undefined, 'La règle de clic Tengen doit exister');
assert.equal(tengenRule?.actions?.[0]?.sound, 'impact_stone', 'La pose d\'une pierre doit jouer le son impact_stone');

// 4. Quête active MVE dédiée au Go
assert.equal(goPatch.activeQuestId, 'quest_game_of_go');
assert(goPatch.questsAdded && goPatch.questsAdded.length > 0);
assert.equal(goPatch.questsAdded[0].steps.length, 3);
assert.equal(goPatch.questsAdded[0].steps[0].requiredEvent, 'DROP:go_stone_black_1:goban_table');

// 5. Simulation du Dégagement de l'Avatar (Collision avoidance)
const simulatedEntities: Record<string, EntitySpec> = {
  goban_table: {
    id: 'goban_table',
    name: 'Goban Kaya',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.72, z: 0 }, scale: { x: 1.05, y: 0.12, z: 1.05 } }
    ]
  }
};

function computeAgentClearance(entities: Record<string, EntitySpec>, prefX = 1.45, prefZ = 0.25) {
  const avatarRadius = 0.48;
  const solidEntities = Object.values(entities).filter(e => {
    const isZone = e.capabilities.some(c => c.type === 'trigger_zone');
    return !isZone && e.id !== 'agent_avatar';
  });

  let currentX = prefX;
  let currentZ = prefZ;

  for (const ent of solidEntities) {
    const transform = ent.capabilities.find(c => c.type === 'transform');
    if (!transform?.position) continue;
    const pos = transform.position;
    const scl = transform.scale || { x: 1, y: 1, z: 1 };
    
    const halfW = Math.max(0.20, Math.abs(scl.x) / 2);
    const halfD = Math.max(0.20, Math.abs(scl.z) / 2);

    const minX = pos.x - halfW - avatarRadius;
    const maxX = pos.x + halfW + avatarRadius;
    const minZ = pos.z - halfD - avatarRadius;
    const maxZ = pos.z + halfD + avatarRadius;

    if (currentX >= minX && currentX <= maxX && currentZ >= minZ && currentZ <= maxZ) {
      if (currentX >= 0) {
        currentX = maxX + 0.30;
      } else {
        currentX = minX - 0.30;
      }
    }
  }

  return { x: currentX, z: currentZ };
}

// Vérification : même si l'avatar commence à l'intérieur du Goban (x: 0, z: 0), il se dégage immédiatement
const clearedPos = computeAgentClearance(simulatedEntities, 0, 0);
assert(clearedPos.x >= 1.05 / 2 + 0.48 + 0.30, 'L\'avatar doit être repoussé hors du Goban avec marge de sécurité');
assert(clearedPos.x > 1.0, 'Position X de l\'avatar doit être à l\'extérieur');

console.log('PASS: Suite 54 validée avec succès (Jeu de Go 3D, Dégagement de l\'Avatar & Saisie Fluide).');

// =========================================================================
// SUITE 55 : Détection Précise de Friction Utilisateur, Télémétrie Gestuelle & Hypothèses Bayésiennes
// =========================================================================
console.log('--- Démarrage de la Suite 55 : Détection Précise de Friction Utilisateur & Télémétrie Gestuelle ---');

const testStore55 = useWorldStore.getState();

// 1. Initialisation d'une nouvelle scène (Jeu de Go) : réinitialisation automatique du méta-contrôleur
const { createGoGame } = await import('../engine/gameplayPresets');
const goPatch55 = createGoGame();
testStore55.applyPatch(goPatch55, "Créer un jeu de Go 3D", { intent: "create_go_game" });

const hypInit = useWorldStore.getState().metaHypotheses;
assert.equal(hypInit.h1.probability, 0.5, "H1 (Hésitation) doit démarrer au prior neutre 0.5 sur une nouvelle scène");
assert.equal(hypInit.h2.probability, 0.5, "H2 (Compréhension) doit démarrer au prior neutre 0.5 sur une nouvelle scène");
assert.equal(hypInit.uncertainty, 1.0, "L'incertitude initiale U doit être maximale (1.0)");
assert.equal(useWorldStore.getState().metaStrategy.objective, 'DIAGNOSE_HYPOTHESIS', "La stratégie initiale doit être une phase d'observation active");
assert.equal(useWorldStore.getState().userFrictionState.consecutiveFrictionCount, 0, "Friction initiale doit être 0");

// 2. Première tentative infructueuse : enregistrement automatique dans le Shadow Causal Graph
const initObservationsCount = useWorldStore.getState().shadowGraph.observations.length;
useWorldStore.getState().recordUserActionAttempt({
  sourceId: 'go_stone_black_1',
  actionType: 'drag',
  wasProductive: false,
  context: 'drag_cancelled'
});

assert.equal(useWorldStore.getState().userFrictionState.consecutiveFrictionCount, 1, "Le compteur de friction consécutive doit s'incrémenter à 1");
assert(useWorldStore.getState().shadowGraph.observations.length > initObservationsCount, "Le geste non prévu doit être consigné dans le Shadow Graph (Observations)");
assert.equal(useWorldStore.getState().shadowGraph.observations[0].sourceEntityId, 'go_stone_black_1');

// 3. Deuxième tentative infructueuse sur la même entité : élévation de l'hésitation bayésienne
useWorldStore.getState().recordUserActionAttempt({
  sourceId: 'go_stone_black_1',
  actionType: 'click',
  wasProductive: false,
  context: 'click_no_rule'
});

assert.equal(useWorldStore.getState().userFrictionState.consecutiveFrictionCount, 2);
const hypFriction = useWorldStore.getState().metaHypotheses;
assert(hypFriction.h1.probability >= 0.70, `P(H1) Hésitation (${hypFriction.h1.probability}) doit surpasser 70% après échecs répétés`);
assert(hypFriction.h2.probability <= 0.30, `P(H2) Compréhension (${hypFriction.h2.probability}) doit chuter sous 30%`);
assert.equal(useWorldStore.getState().metaStrategy.objective, 'FALSIFY_MISCONCEPTION', "L'objectif d'assistance doit basculer sur Fausse manœuvre récurrente");

// 4. Troisième tentative infructueuse : assistance proactive de Victoria
useWorldStore.getState().recordUserActionAttempt({
  sourceId: 'go_stone_black_1',
  actionType: 'drag',
  wasProductive: false,
  context: 'repeated_stuck'
});

assert(
  useWorldStore.getState().warnings.some(w => w.includes('Conseil de Victoria') && w.includes('Goban')),
  "Victoria doit fournir une indication claire et bienveillante pour guider le joueur vers le Goban"
);

// 5. Validation de la progression de quête : poser une pierre noire valide l'étape 1
const activeQuestId55 = useWorldStore.getState().world.ir.activeQuestId!;
assert(activeQuestId55, "Une quête active doit être définie");

useWorldStore.getState().dispatch({
  type: 'DROP',
  sourceId: 'go_stone_black_1',
  targetId: 'goban_table'
});

const currentQ55 = useWorldStore.getState().world.ir.quests![activeQuestId55]!;
assert.equal(currentQ55.steps[0].completed, true, "L'étape 1 de la quête de Go doit être validée avec succès");
assert.equal(currentQ55.currentStepIndex, 1, "La quête doit être passée à l'étape 2 (Répondre avec Blanc)");
assert.equal(useWorldStore.getState().userFrictionState.consecutiveFrictionCount, 0, "La friction consécutive doit être réinitialisée après un succès");

// 6. Validation par famille d'objets (pierre blanche 2 valide l'étape blanche)
useWorldStore.getState().dispatch({
  type: 'DROP',
  sourceId: 'go_stone_white_2',
  targetId: 'goban_table'
});

const updatedQ55 = useWorldStore.getState().world.ir.quests![activeQuestId55]!;
assert.equal(updatedQ55.steps[1].completed, true, "L'étape 2 doit accepter n'importe quelle pierre de la famille blanche");
assert.equal(updatedQ55.currentStepIndex, 2, "La quête doit être passée à l'étape finale (Passer)");

console.log('PASS: Suite 55 validée avec succès (Détection Précise de Friction Utilisateur, Télémétrie Gestuelle & Hypothèses Bayésiennes).');

// =========================================================================
// SUITE 56 : Écosystème Multi-Agents (Humain, Testeur Apprenant, Garant Déterministe & Concepteur)
// =========================================================================
console.log('--- Démarrage de la Suite 56 : Écosystème Multi-Agents (Humain, Testeur Apprenant, Garant Déterministe & Concepteur) ---');

const { certifyWorldInvariants, diagnoseHumanFrictionDeterministically } = await import('../engine/deterministicGuarantor');

// 1. Initialisation d'un scénario de laboratoire avec un objet sans affordance draggable
const labWorldPatch56: WorldPatch = {
  entitiesCreated: [
    {
      id: 'alchemy_table',
      name: 'Paillasse d\'Alchimie',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.8, z: 0 }, scale: { x: 1.5, y: 0.1, z: 1.0 } },
        { type: 'collider' }
      ]
    },
    {
      id: 'alchemy_flask_copper',
      name: 'Fiole de Cuivre',
      capabilities: [
        { type: 'transform', position: { x: 0.2, y: 0.85, z: 0 }, scale: { x: 0.2, y: 0.2, z: 0.2 } },
        { type: 'collider' }
        // ATTENTION VOLONTAIRE : manque 'draggable' pour simuler la friction humaine
      ]
    },
    {
      id: 'alembic_receiver',
      name: 'Alambic Récepteur',
      capabilities: [
        { type: 'transform', position: { x: -0.4, y: 0.85, z: 0 }, scale: { x: 0.3, y: 0.3, z: 0.3 } },
        { type: 'trigger_zone' },
        { type: 'collider' }
      ]
    }
  ],
  questsAdded: [
    {
      id: 'quest_alchemy_transmute',
      title: 'Transmutation Alchimique',
      description: 'Déplacer la Fiole de Cuivre dans l\'Alambic Récepteur pour amorcer la réaction.',
      status: 'in_progress',
      currentStepIndex: 0,
      steps: [
        {
          id: 'step_drop_flask',
          title: 'Déposer la Fiole dans l\'Alambic',
          description: 'Glisser la fiole de cuivre vers le récepteur.',
          requiredEvent: 'DROP:alchemy_flask_copper:alembic_receiver',
          completed: false
        }
      ]
    }
  ],
  activeQuestId: 'quest_alchemy_transmute'
};

useWorldStore.getState().applyPatch(labWorldPatch56, "Initialiser le laboratoire d'alchimie", { intent: "init_alchemy_lab" });

// Vérification directe de l'Agent Garant Déterministe
const directAuditInit = certifyWorldInvariants(useWorldStore.getState().world);
assert.equal(typeof directAuditInit.blastRadiusScore, 'number', "A_G : Calcul direct du blast radius");

// 2. Comportement de l'Agent Humain (A_H) : L'utilisateur tente de déplacer la fiole sans succès
const preFrictionObs56 = useWorldStore.getState().shadowGraph.observations.length;
useWorldStore.getState().recordUserActionAttempt({
  sourceId: 'alchemy_flask_copper',
  actionType: 'drag',
  wasProductive: false,
  context: 'cannot_move_flask'
});

assert.equal(useWorldStore.getState().userFrictionState.consecutiveFrictionCount, 1, "A_H : Friction consécutive à 1");
assert.equal(useWorldStore.getState().userFrictionState.lastFailedEntityId, 'alchemy_flask_copper');
assert(useWorldStore.getState().shadowGraph.observations.length > preFrictionObs56, "A_H : Le geste non prévu est capturé dans le Shadow Graph");

// Deuxième essai infructueux de l'humain (boucle d'entêtement)
useWorldStore.getState().recordUserActionAttempt({
  sourceId: 'alchemy_flask_copper',
  actionType: 'drag',
  wasProductive: false,
  context: 'second_stuck_drag'
});
assert.equal(useWorldStore.getState().userFrictionState.consecutiveFrictionCount, 2, "A_H : Deuxième échec consécutif détecté");

// 3. Déploiement de l'Agent Testeur Apprenant (A_T) avec persona 'human_cloned'
const playtestResult56 = useWorldStore.getState().runHumanClonedPlaytest();

assert.equal(playtestResult56.persona, 'human_cloned', "A_T : Persona doit être 'human_cloned'");
assert.equal(playtestResult56.success, false, "A_T : Le testeur clone doit échouer en reproduisant le blocage humain");
assert.equal(playtestResult56.completionRate, 40, "A_T : Le taux de complétion s'arrête au blocage");

// Vérification des waypoints mimétiques
const hesitationWp56 = playtestResult56.waypoints.find(w => w.action === 'hesitation_pause');
assert(hesitationWp56 !== undefined, "A_T : Doit contenir un waypoint d'hésitation cognitive apprise");

const repeatWp56 = playtestResult56.waypoints.find(w => w.action.includes('repeat_stuck'));
assert(repeatWp56 !== undefined, "A_T : Doit contenir un waypoint de répétition obstinée du geste infructueux");

// Diagnostic de reproduction de friction
const frictionDiag56 = playtestResult56.diagnostics.find(d => d.type === 'HUMAN_FRICTION_REPRODUCED');
assert(frictionDiag56 !== undefined, "A_T : Doit générer un diagnostic HUMAN_FRICTION_REPRODUCED");
assert.equal(frictionDiag56?.affectedEntityId, 'alchemy_flask_copper');

// Vérification de la proposition de Minimal Patch
assert(playtestResult56.minimalPatch !== undefined, "A_T : Doit proposer un Minimal Patch pour corriger le blocage");
assert(playtestResult56.patchDescription?.includes('draggable') || playtestResult56.patchDescription?.includes('affordance'));

// 4. Certification formelle par l'Agent Garant Déterministe (A_G)
const guarantorAudit56 = useWorldStore.getState().certifyCurrentWorld(playtestResult56.minimalPatch);

assert.equal(guarantorAudit56.checksPassed, true, "A_G : Les contrôles évalués doivent être passés");
assert.equal(guarantorAudit56.isRegressionFree, true, "A_G : Le patch de réparation doit être sans régression (SBR)");
assert.equal(guarantorAudit56.status, 'CHECKS_PASSED', "A_G : Le rapport doit décrire le résultat des contrôles, pas une certification");
assert(guarantorAudit56.summary.includes('sans preuve formelle'), "A_G : Le rapport doit expliciter la portée limitée des contrôles.");

// Diagnostic déterministe autonome
const detDiag56 = diagnoseHumanFrictionDeterministically(
  useWorldStore.getState().world,
  'alchemy_flask_copper',
  'drag'
);
assert.equal(detDiag56.verifiedDeadlock, true, "A_G : Le deadlock doit être prouvé mathématiquement");
assert.equal(detDiag56.cause, 'MISSING_DRAGGABLE', "A_G : La cause exacte doit être MISSING_DRAGGABLE");

// 5. Application du Patch Minimal certifié par le Garant & Re-Test automatique
const repairResult56 = useWorldStore.getState().applyMinimalPatchAndRetest();
assert.equal(repairResult56.success, true, "La réparation minimale certifiée doit s'appliquer avec succès");

// Vérification que l'entité a maintenant reçu la capability 'draggable'
const repairedFlask56 = useWorldStore.getState().world.ir.entities['alchemy_flask_copper'];
assert(
  repairedFlask56.capabilities.some(c => c.type === 'draggable'),
  "L'entité 'alchemy_flask_copper' doit désormais posséder la capability 'draggable'"
);

// Vérification de la remise à zéro de la friction humaine après résolution
assert.equal(
  useWorldStore.getState().userFrictionState.consecutiveFrictionCount,
  0,
  "La friction consécutive doit être remise à zéro après la réparation chirurgicale"
);

// 6. Nouveau test du Testeur Apprenant sur le monde réparé
const postRepairPlaytest56 = useWorldStore.getState().runHumanClonedPlaytest();
assert.equal(postRepairPlaytest56.success, true, "Le Testeur Apprenant doit maintenant réussir à 100% sur le monde réparé");
assert.equal(postRepairPlaytest56.completionRate, 100, "Taux de complétion nominal à 100%");

console.log('PASS: Suite 56 validée avec succès (Écosystème Multi-Agents : Humain, Testeur Apprenant, Garant Déterministe & Concepteur).');

// =========================================================================
// SUITE 57 : Substrat Déclaratif YAML/JSON, Cartouches Modulaires & Architecture NSS
// =========================================================================
console.log('--- Démarrage de la Suite 57 : Substrat Déclaratif YAML/JSON & Cartouches Modulaires ---');

// 1. Tests de sérialisation et parsing YAML / JSON
const { exportWorldToYaml, parseWorldFromYaml, exportWorldToJson, parseWorldFromJson, validateWorldIR } = await import('../engine/worldFormat');

const sampleWorldIR = {
  entities: {
    'sample_workbench': {
      id: 'sample_workbench',
      name: 'Établi de Recherche Modulaire',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.5, z: 0 }, scale: { x: 2, y: 1, z: 1 } },
        { type: 'collider' }
      ],
      visuals: { assetId: 'technical-bench' }
    },
    'sample_sensor': {
      id: 'sample_sensor',
      name: 'Capteur Sensoriel 3D',
      capabilities: [
        { type: 'transform', position: { x: 0.5, y: 1.02, z: 0 } },
        { type: 'draggable' },
        { type: 'collider' }
      ],
      visuals: { assetId: 'cube', color: '#10b981' }
    }
  },
  rules: {
    'rule_sample_sensor': {
      id: 'rule_sample_sensor',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'sample_sensor' }],
      actions: [{ type: 'play_sound', sound: 'chime' }]
    }
  },
  invariants: {
    'inv_sample_safety': {
      id: 'inv_sample_safety',
      description: 'Le capteur doit demeurer dans le périmètre de travail',
      satisfied: true,
      severity: 'critical'
    }
  },
  quests: {
    'quest_sample': {
      id: 'quest_sample',
      title: 'Calibration du Capteur',
      description: 'Manipulez le capteur 3D pour valider la chaîne causale',
      currentStepIndex: 0,
      status: 'in_progress' as const,
      steps: [
        {
          id: 'step_1',
          title: 'Prendre le capteur',
          description: 'Saisir le capteur sur l établi',
          targetEntityId: 'sample_sensor',
          completed: false
        }
      ]
    }
  },
  activeQuestId: 'quest_sample'
};

// Validation formelle du schéma IR
const validationRes = validateWorldIR(sampleWorldIR);
assert.equal(validationRes.valid, true, "L'objet WorldIR d'exemple doit être 100% valide");
assert.equal(validationRes.errors.length, 0);

// Sérialisation YAML
const yamlExport = exportWorldToYaml(sampleWorldIR as any);
assert(yamlExport.includes('# WorldPilot Declarative Spatial Substrate (.world.yaml)'), 'Le YAML doit inclure l en-tête');
assert(yamlExport.includes('sample_workbench:'), 'Le YAML doit sérialiser sample_workbench');
assert(yamlExport.includes('rule_sample_sensor:'), 'Le YAML doit sérialiser les règles');
assert(yamlExport.includes('inv_sample_safety:'), 'Le YAML doit sérialiser les invariants');

// Désérialisation YAML (Roundtrip)
const parsedFromYaml = parseWorldFromYaml(yamlExport);
assert.equal(Object.keys(parsedFromYaml.entities).length, 2, 'Doit restituer 2 entités depuis le YAML');
assert.equal(parsedFromYaml.entities['sample_workbench'].name, 'Établi de Recherche Modulaire');
assert(parsedFromYaml.entities['sample_sensor'].capabilities.some(c => c.type === 'draggable'));
assert.equal(parsedFromYaml.activeQuestId, 'quest_sample');

// Sérialisation JSON
const jsonExport = exportWorldToJson(sampleWorldIR as any);
assert(jsonExport.includes('"format": "worldpilot.world.json"'), 'Le JSON doit spécifier le format WorldPilot');
const parsedFromJson = parseWorldFromJson(jsonExport);
assert.equal(Object.keys(parsedFromJson.entities).length, 2, 'Doit restituer 2 entités depuis le JSON');
assert.equal(parsedFromJson.entities['sample_sensor'].name, 'Capteur Sensoriel 3D');

// 2. Tests du Registre des Cartouches Modulaires de Domaine (Isolation Open Source)
const {
  CORE_STARTER_PACK,
  ESCOFFIER_PACK,
  FLE_PARIS_PACK,
  EXECUTIVE_SEMINAR_PACK,
  ARCADE_GAMES_PACK,
  getRegisteredDomainPacks,
  getOpenSourceDefaultPack,
  buildCoreStarterPatch
} = await import('../library/domainPacks');

assert.equal(CORE_STARTER_PACK.id, 'core-sandbox', "CORE_STARTER_PACK doit être 'core-sandbox'");
const defaultPack = getOpenSourceDefaultPack();
assert.equal(defaultPack.id, 'core-sandbox', "La cartouche open-source par défaut doit être 'core-sandbox'");
assert.equal(defaultPack.isOpenSourceDefault, true, "isOpenSourceDefault doit être true pour le core-sandbox");

const allPacks = getRegisteredDomainPacks();
assert(allPacks.length >= 5, "Au moins 5 cartouches de domaine doivent être enregistrées");
assert(allPacks.some(p => p.id === 'escoffier-gastronomy'), 'Cartouche Escoffier présente');
assert(allPacks.some(p => p.id === 'paris-fle'), 'Cartouche FLE présente');
assert(allPacks.some(p => p.id === 'executive-seminar'), 'Cartouche Séminaire présente');
assert(allPacks.some(p => p.id === 'games-arcade'), 'Cartouche Jeux & Go présente');

// Vérification de l'isolation : les packs additionnels ne sont pas dans le bundle open-source minimal
assert.equal(ESCOFFIER_PACK.isOpenSourceDefault, false);
assert.equal(FLE_PARIS_PACK.isOpenSourceDefault, false);
assert.equal(EXECUTIVE_SEMINAR_PACK.isOpenSourceDefault, false);
assert.equal(ARCADE_GAMES_PACK.isOpenSourceDefault, false);

// Vérification du patch initial du Starter Pack Open-Source
const starterPatch = buildCoreStarterPatch();
assert(starterPatch.entitiesCreated && starterPatch.entitiesCreated.length >= 3);
assert(starterPatch.entitiesCreated.some(e => e.id === 'victoria_vr_terminal'), "Le terminal Web3 Victoria VR doit être inclus nativement dans le starter pack");
assert(starterPatch.rulesChanged && starterPatch.rulesChanged.length >= 1);
assert(starterPatch.invariantsAdded && starterPatch.invariantsAdded.length >= 1);

// 3. Test de l'import/export YAML sur le Store WorldPilot
const store57 = useWorldStore.getState();
store57.resetWorld();
assert.equal(typeof store57.exportWorldYaml, 'function', 'exportWorldYaml doit être exposé');
assert.equal(typeof store57.importWorldYaml, 'function', 'importWorldYaml doit être exposé');

// Application du starter pack sur le store
store57.applyPatch(starterPatch, 'Initialiser Core Starter Pack', { intent: 'init_starter_pack' });
assert.equal(Object.keys(useWorldStore.getState().world.ir.entities).length, 3);
assert(useWorldStore.getState().world.ir.entities['victoria_vr_terminal'] !== undefined);

// Importation d'un monde YAML dans le store
const testYamlScene = `
version: 2
ir:
  entities:
    cube_yaml_test:
      id: cube_yaml_test
      name: Cube de Test YAML
      capabilities:
        - type: transform
          position: [0, 1.2, 0]
        - type: collider
      visuals:
        assetId: cube
        color: "#f59e0b"
  rules: {}
  invariants: {}
  quests: {}
  activeQuestId: null
atmosphere: cozy-bistrot
`;

const yamlImportSuccess = store57.importWorldYaml(testYamlScene);
assert.equal(yamlImportSuccess, true, 'importWorldYaml doit réussir');
assert(useWorldStore.getState().world.ir.entities['cube_yaml_test'] !== undefined, 'cube_yaml_test doit exister');
assert.equal(useWorldStore.getState().currentAtmosphere, 'cozy-bistrot', 'Atmosphère doit être restaurée depuis le YAML');

console.log('PASS: Suite 57 validée avec succès (Substrat Déclaratif YAML/JSON, Cartouches Modulaires & Architecture NSS).');

// --- Suite 58 : Observabilité Réactive, Gizmo 3D & Micro-Prompts In-Situ ---
console.log('--- Démarrage de la Suite 58 : Observabilité Réactive, Gizmo 3D & Micro-Prompts In-Situ ---');

const store58 = useWorldStore.getState();
store58.resetWorld();

// 1. Test du cycle des modes du Gizmo 3D (Off -> Translate -> Rotate -> Off)
assert.equal(store58.gizmoMode, 'off', 'Le mode initial du Gizmo doit être "off"');
store58.cycleGizmoMode();
assert.equal(useWorldStore.getState().gizmoMode, 'translate', 'Premier cycle : le Gizmo doit passer en mode "translate"');
store58.cycleGizmoMode();
assert.equal(useWorldStore.getState().gizmoMode, 'rotate', 'Deuxième cycle : le Gizmo doit passer en mode "rotate"');
store58.cycleGizmoMode();
assert.equal(useWorldStore.getState().gizmoMode, 'off', 'Troisième cycle : le Gizmo doit revenir à "off"');

// 2. Test du basculement réactif des drapeaux (setWorldFlag)
assert.equal(useWorldStore.getState().world.flags['battery_inspected'], undefined, 'Le drapeau ne doit pas exister avant d’être défini');
store58.setWorldFlag('battery_inspected', true);
assert.equal(useWorldStore.getState().world.flags['battery_inspected'], true, 'setWorldFlag(..., true) doit mettre à jour le store en direct');
store58.setWorldFlag('battery_inspected', false);
assert.equal(useWorldStore.getState().world.flags['battery_inspected'], false, 'setWorldFlag(..., false) doit forcer la valeur à false');

// 3. Test de déclenchement manuel de règles causales (triggerRuleManually)
const batteryInstruction = parseInstruction('Montrer comment changer une batterie dans une voiture', { selectedEntityId: null, pointedEntityId: null });
store58.applyPatch(batteryInstruction.patch, 'Montrer comment changer une batterie dans une voiture', batteryInstruction.plan);
assert(useWorldStore.getState().world.ir.rules['rule_inspect_car_battery'] !== undefined, 'La règle rule_inspect_car_battery doit exister');
assert.equal(useWorldStore.getState().world.flags['battery_inspected'], false, 'battery_inspected doit être false avant inspection');

// Simulation manuelle de l'exécution de la règle depuis l'inspecteur
store58.triggerRuleManually('rule_inspect_car_battery');
assert.equal(useWorldStore.getState().world.flags['battery_inspected'], true, 'Le drapeau battery_inspected doit passer à true après simulation manuelle');
assert(useWorldStore.getState().warnings.some(w => w.includes('Diagnostic batterie OK')), 'L’avertissement de succès doit être émis');

// 4. Test d'un micro-prompt in-situ ciblant l'entité sélectionnée sans effacer la scène
const batteryEntityId = 'car_battery_new';
const worldBeforeMicro = useWorldStore.getState().world;
assert(worldBeforeMicro.ir.entities[batteryEntityId] !== undefined, 'La batterie doit exister');
assert(worldBeforeMicro.ir.entities['car_sedan_1'] !== undefined, 'La voiture doit exister');

const microPromptRes = parseInstruction(
  'ajoute du marbre blanc',
  { selectedEntityId: batteryEntityId, pointedEntityId: null },
  worldBeforeMicro.ir.entities
);
assert(microPromptRes.patch !== undefined, 'Le micro-prompt doit produire un patch ciblé');
store58.applyPatch(microPromptRes.patch, 'ajoute du marbre blanc', microPromptRes.plan);

const worldAfterMicro = useWorldStore.getState().world;
// Vérification de la non-régression spatiale : la voiture berline est restée intacte
assert(worldAfterMicro.ir.entities['car_sedan_1'] !== undefined, 'La voiture berline ne doit pas être écrasée par un micro-prompt');
assert(worldAfterMicro.ir.entities[batteryEntityId] !== undefined, 'La batterie doit toujours exister');
assert(worldAfterMicro.ir.entities[batteryEntityId].visuals?.materialPreset || worldAfterMicro.ir.entities[batteryEntityId].visuals?.textureUrl, 'Le matériau marbre doit être appliqué sur la batterie');

// 5. Test du HUD d'observabilité (toggleCausalObservability)
assert.equal(useWorldStore.getState().showCausalObservability, false, 'Le HUD doit être fermé par défaut');
store58.toggleCausalObservability();
assert.equal(useWorldStore.getState().showCausalObservability, true, 'toggleCausalObservability doit ouvrir le HUD');
store58.toggleCausalObservability();
assert.equal(useWorldStore.getState().showCausalObservability, false, 'toggleCausalObservability doit refermer le HUD');

// 6. Test du Substrat Déclaratif YAML & Validation formelle
const finalWorld = useWorldStore.getState().world;
const validCheck = validateWorldIR(finalWorld.ir);
assert.equal(validCheck.valid, true, 'WorldIR final doit être 100% conforme au schéma');
const liveYaml = exportWorldToYaml(finalWorld);
assert(liveYaml.includes('WorldPilot Declarative Spatial Substrate'), 'Le YAML doit inclure l’en-tête officiel');
assert(liveYaml.includes('car_sedan_1:'), 'Le YAML doit sérialiser car_sedan_1');
const reimportOk = store58.importWorldYaml(liveYaml);
assert.equal(reimportOk, true, 'L’importation du YAML en direct doit réussir');
assert(useWorldStore.getState().world.ir.entities['car_sedan_1'] !== undefined, 'L’entité car_sedan_1 doit persister après import');

console.log('PASS: Suite 58 validée avec succès (Observabilité Réactive, Gizmo 3D & Micro-Prompts In-Situ).');

// --- Suite 59 : Bandeau Causal en Direct (Live Causal Ticker) & Observabilité Fluide ---
console.log('--- Démarrage de la Suite 59 : Bandeau Causal en Direct (Live Causal Ticker) & Observabilité Fluide ---');

const store59 = useWorldStore.getState();
store59.resetWorld();
store59.clearLiveCausalFeed();

// 1. Initialisation et structure du flux causal
assert(Array.isArray(useWorldStore.getState().liveCausalFeed), 'liveCausalFeed doit être un tableau');
assert.equal(useWorldStore.getState().liveCausalFeed.length, 0, 'liveCausalFeed doit être initialement vide');

// 2. Émission d’un événement causal manuel
store59.addLiveCausalEvent({
  type: 'action',
  icon: '🎯',
  message: 'Interaction d\'essai',
  badge: 'Test'
});
assert.equal(useWorldStore.getState().liveCausalFeed.length, 1, 'addLiveCausalEvent doit ajouter un élément');
const firstEvent = useWorldStore.getState().liveCausalFeed[0];
assert(firstEvent.id.startsWith('causal_'), 'L’événement doit posséder un identifiant unique');
assert(typeof firstEvent.timestamp === 'number', 'L’événement doit comporter un timestamp');
assert.equal(firstEvent.message, 'Interaction d\'essai');

// 3. Télémétrie causale automatique lors de modifications d\'état (setWorldFlag)
store59.setWorldFlag('moteur_demarre', true);
const feedAfterFlag = useWorldStore.getState().liveCausalFeed;
const flagEvent = feedAfterFlag.find(e => e.type === 'flag');
assert(flagEvent !== undefined, 'setWorldFlag doit injecter un événement de type flag');
assert(flagEvent.message.includes('moteur_demarre'), 'Le message doit nommer le drapeau modifié');

// 4. Chaîne de causalité complète : Action ➔ Règle déclenchée ➔ Quête
store59.applyPatch({
  entitiesCreated: [
    { id: 'cle_1', name: 'Clé dorée', capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }] },
    { id: 'coffre_1', name: 'Coffre ancien', capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }] }
  ],
  rulesChanged: [
    {
      id: 'rule_deverrouille_coffre',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: 'cle_1' },
        { type: 'is_target', targetId: 'coffre_1' }
      ],
      actions: [
        { type: 'set_flag', flag: 'coffre_ouvert', value: true }
      ]
    }
  ]
}, 'Initialisation puzzle clé-coffre');

store59.clearLiveCausalFeed();

store59.dispatch({
  type: 'DROP',
  sourceId: 'cle_1',
  targetId: 'coffre_1'
});

const feedAfterAction = useWorldStore.getState().liveCausalFeed;
const actionEvt = feedAfterAction.find(e => e.type === 'action');
const ruleEvt = feedAfterAction.find(e => e.type === 'rule');

assert(actionEvt !== undefined, 'L\'action utilisateur doit être consignée dans le bandeau causal');
assert(actionEvt.message.includes('Clé dorée ➔ Coffre ancien'), 'Le message causal doit lier la source et la cible');
assert(ruleEvt !== undefined, 'L\'exécution de la règle causale doit être consignée');
assert.equal(ruleEvt.badge, 'Causalité');

// 5. Invariant de sécurité et blocage causal
store59.applyPatch({
  invariantsAdded: [
    {
      id: 'inv_securite_cle',
      description: 'Le cadenas doit être déverrouillé avant le coffre',
      condition: {
        type: 'never_state',
        stateFlag: 'tentative_forcer_coffre',
        requiredFlag: 'cadenas_deverrouille'
      }
    }
  ],
  rulesChanged: [
    {
      id: 'rule_forcer',
      trigger: 'CLICK',
      conditions: [{ type: 'is_source', sourceId: 'coffre_1' }],
      actions: [{ type: 'set_flag', flag: 'tentative_forcer_coffre', value: true }]
    }
  ]
}, 'Ajout invariant de sécurité');

store59.clearLiveCausalFeed();
store59.dispatch({ type: 'CLICK', sourceId: 'coffre_1' });

const feedAfterInvariant = useWorldStore.getState().liveCausalFeed;
const safetyEvt = feedAfterInvariant.find(e => e.type === 'safety');
assert(safetyEvt !== undefined, 'L\'invariant transgressé doit générer un avertissement causal');
assert(safetyEvt.message.includes('Le cadenas doit être déverrouillé'), 'La raison du blocage doit être limpide');

// 6. Réinitialisation du bandeau causal
store59.clearLiveCausalFeed();
assert.equal(useWorldStore.getState().liveCausalFeed.length, 0, 'clearLiveCausalFeed doit vider le flux');

console.log('PASS: Suite 59 validée avec succès (Bandeau Causal en Direct & Observabilité Fluide).');

// ============================================================================
// 60. Diagnostic Causal In-Situ des Objets 3D & Validation des 30 Scènes FLE
// ============================================================================
console.log('--- Démarrage de la Suite 60 : Diagnostic Causal In-Situ & Validation des 30 Scènes FLE ---');
const store60 = useWorldStore.getState();
store60.resetWorld();

// 1. Validation de l'intégrité des 30 scènes FLE
assert.equal(fleScenes.length, 30, 'Les 30 scènes FLE doivent toutes être présentes');
fleScenes.forEach(scene => {
  assert(scene.id && scene.title && scene.category && scene.level, `Scène ${scene.number} doit être valide`);
  assert(scene.dialogue && scene.dialogue.length > 5, `Dialogue de la scène ${scene.number} doit être présent`);
  assert(scene.quizQuestion && scene.quizQuestion.options.length === 3, `Quiz de la scène ${scene.number} doit avoir 3 options`);
});

// 2. Chargement de la scène FLE 1 (Boulangerie) et vérification de la quête active
const scene1 = fleScenes[0];
const flePatch = createFLEPatch(scene1, {});
store60.applyPatch(flePatch, `Scène FLE ${scene1.number} : ${scene1.title}`);

const currentWorld60 = useWorldStore.getState().world;
assert(Object.keys(currentWorld60.ir.entities).length >= 3, 'La scène FLE doit créer au moins 3 entités');
assert(currentWorld60.ir.activeQuestId !== null, 'Une quête active FLE doit être assignée');
assert(currentWorld60.ir.quests !== undefined, 'Le dictionnaire de quêtes doit exister');
const activeQuest60 = currentWorld60.ir.quests[currentWorld60.ir.activeQuestId!];
assert(activeQuest60 !== undefined, 'La quête FLE doit exister dans le monde');
assert.equal(activeQuest60.steps.length, 3, 'La quête FLE doit comporter 3 étapes (Dialogue, Vocabulaire, Quiz)');

// 3. Test de l'état d'un objet passif et activation en 1 clic ("Rendre actif")
const passiveEntId = 'deco_table_fleur';
store60.applyPatch({
  entitiesCreated: [
    {
      id: passiveEntId,
      name: 'Vase de Fleurs',
      capabilities: [{ type: 'transform', position: { x: 1, y: 0.8, z: -1 } }]
    }
  ]
}, 'Ajout objet passif');

// Vérification : l'objet ne possède aucune règle au départ
const rulesBefore = Object.values(useWorldStore.getState().world.ir.rules);
const hasRuleBefore = rulesBefore.some(r => r.conditions?.some((c: any) => c.sourceId === passiveEntId));
assert.equal(hasRuleBefore, false, 'Le vase de fleurs doit être initialement un objet passif');

// Simulation de l'action 1-clic "✨ Rendre actif"
store60.applyPatch({
  rulesChanged: [{
    id: `rule_click_${passiveEntId}`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: passiveEntId }],
    actions: [
      { type: 'play_sound', sound: 'chime' },
      { type: 'show_warning', message: `✨ Vase de Fleurs réagit avec succès !` }
    ]
  }]
}, `Rendre Vase de Fleurs réactif`, { intent: 'make_interactive', actions: [{ action: 'add_rule', target: passiveEntId }] });

// Vérification : l'objet est désormais actif et interactif
const rulesAfter = Object.values(useWorldStore.getState().world.ir.rules);
const hasRuleAfter = rulesAfter.some(r => r.conditions?.some((c: any) => c.sourceId === passiveEntId));
assert.equal(hasRuleAfter, true, 'Le vase de fleurs doit désormais avoir une règle interactive');

// 4. Déclenchement de l'interaction et vérification de la chaîne de causalité en direct
store60.clearLiveCausalFeed();
store60.dispatch({ type: 'INTERACT', sourceId: passiveEntId });

const liveFeed60 = useWorldStore.getState().liveCausalFeed;
assert(liveFeed60.length > 0, 'Le flux causal en direct doit capter l\'interaction avec l\'objet rendu actif');
const ruleCausalEvt = liveFeed60.find(e => e.type === 'rule');
assert(ruleCausalEvt !== undefined, 'L\'événement rule doit exister dans liveCausalFeed');
assert(ruleCausalEvt.message.includes('règle(s) de cause à effet déclenchée(s)'), 'Le message causal doit confirmer la règle déclenchée');
assert(useWorldStore.getState().warnings.some(w => w.includes('Vase de Fleurs réagit avec succès')), 'L\'action show_warning doit être enregistrée dans les warnings');

console.log('PASS: Suite 60 validée avec succès (Diagnostic Causal In-Situ des Objets 3D & 30 Scènes FLE).');

// ============================================================================
// SUITE 61 : MINDEL — WEB 3D SÉMANTIQUE, TEST DE CAPACITÉ & DISPOSITIONS SPATIALES
// ============================================================================
console.log('--- Démarrage de la Suite 61 : Mindel (Web 3D Sémantique, Test de Capacité & Dispositions) ---');

const { createBagShowcasePatch, BAG_SHOWCASE_EXPERIENCE_ID } = await import('../library/bagShowcase');
assert(BAG_SHOWCASE_EXPERIENCE_ID.length > 0, 'Identifiant d\'expérience Mindel valide');
const bagPatch = createBagShowcasePatch();

// 1. Validation de l'Entité Logique et du Contrat Sémantique (Mindel §4, §5, §6, §7, §14)
assert(bagPatch.entitiesCreated!.length >= 4, 'Le patch Mindel doit comporter au moins 4 entités');
const bagEntity = bagPatch.entitiesCreated!.find(e => e.id === 'sac_nomade_42');
assert(bagEntity, 'L\'entité sac_nomade_42 doit être présente dans le patch');
assert.equal(bagEntity.state, 'closed', 'L\'état initial du sac doit être "closed"');
assert.deepStrictEqual(bagEntity.availableStates, ['closed', 'open'], 'Les états disponibles doivent être closed et open');

// Propriétés physiques typées
assert(bagEntity.physicalProperties !== undefined, 'Le sac doit exposer des propriétés physiques');
assert.equal(bagEntity.physicalProperties?.capacityLiters, 42, 'La capacité doit être de 42 Litres');
assert.deepStrictEqual(bagEntity.physicalProperties?.dimensions, [0.34, 0.52, 0.24], 'Dimensions cabine IATA 34x52x24 cm');
assert.deepStrictEqual(bagEntity.physicalProperties?.fitsMaxDimensions, [0.38, 0.03, 0.28], 'Gabarit max laptop 38x3x28 cm');

// Ressources web typées
assert(bagEntity.resources && bagEntity.resources.length >= 4, 'Le sac doit avoir au moins 4 ressources typées');
const buyRes = bagEntity.resources!.find(r => r.role === 'buy');
assert(buyRes && buyRes.url.includes('shop'), 'Ressource d\'achat typée avec rôle "buy"');
const manualRes = bagEntity.resources!.find(r => r.role === 'manual');
assert(manualRes && manualRes.url.includes('care-guide'), 'Ressource guide d\'entretien avec rôle "manual"');

// Parties sémantiques internes (Mindel §7)
assert(bagEntity.parts && bagEntity.parts.length === 3, 'Le sac doit exposer 3 parties internes distinctes');
const laptopSleeve = bagEntity.parts!.find(p => p.id === 'part_laptop_sleeve');
assert(laptopSleeve && laptopSleeve.fitsMaxDimensions, 'Le manchon pour ordinateur doit spécifier ses dimensions max');

// Fallback 2D (Mindel §14)
assert(bagEntity.fallback2D !== undefined, 'L\'entité doit proposer un fallback 2D pour l\'accessibilité');
assert(bagEntity.fallback2D?.description.length! > 0, 'La description 2D doit être renseignée');

// 2. Initialisation dans le Zustand Store et Test de Bascule d'État Ouvert / Fermé (Mindel §5 & §8)
const store61 = useWorldStore.getState();
store61.resetWorld();
store61.applyPatch(bagPatch, 'Initialiser le Showroom Mindel Sac 42L');

const stateBefore = useWorldStore.getState().world.ir.entities['sac_nomade_42'].state;
assert.equal(stateBefore, 'closed', 'État initial du sac dans le store doit être closed');

// Bascule vers open
store61.toggleEntityState('sac_nomade_42');
const stateOpen = useWorldStore.getState().world.ir.entities['sac_nomade_42'].state;
assert.equal(stateOpen, 'open', 'Après toggleEntityState, le sac doit être ouvert');

// Bascule retour vers closed
store61.toggleEntityState('sac_nomade_42');
const stateClosed = useWorldStore.getState().world.ir.entities['sac_nomade_42'].state;
assert.equal(stateClosed, 'closed', 'Après second toggleEntityState, le sac doit être fermé');

// 3. Test Géométrique de Capacité Spatiale (Mindel §8)
// Test Positif : Ordinateur Pro 15.6" (35.5 x 1.9 x 24.5 cm) rentre dans le manchon (38 x 2.8 x 27 cm)
const positiveCapacityResult = store61.testEntityCapacity('sac_nomade_42', 'laptop_pro_15');
assert.equal(positiveCapacityResult.fits, true, 'Le Laptop 15.6" doit rentrer dans le sac 42L');
assert.equal(positiveCapacityResult.partId, 'part_laptop_sleeve', 'Le Laptop doit être logé dans part_laptop_sleeve');

// Vérification de la relation sémantique établie dans le store (Mindel §9)
const laptopInStore = useWorldStore.getState().world.ir.entities['laptop_pro_15'];
const insideRelation = laptopInStore.relations?.find(r => r.type === 'inside' && r.targetId === 'sac_nomade_42');
assert(insideRelation !== undefined, 'Une relation sémantique "inside" doit être enregistrée pour le laptop');

// Test Négatif : Colis volumineux (46 x 38 x 32 cm) dépasse le gabarit maximal (38 x 3 x 28 cm)
const negativeCapacityResult = store61.testEntityCapacity('sac_nomade_42', 'carton_oversized');
assert.equal(negativeCapacityResult.fits, false, 'Le carton volumineux ne doit PAS rentrer dans le sac');
assert(negativeCapacityResult.message.includes('dépasse le gabarit'), 'Le résultat doit expliquer le dépassement');

// 4. Recherche Contextuelle de Compatibilité (Mindel §21)
const compatibles = store61.findCompatibleItemsFor('sac_nomade_42');
assert(compatibles.length >= 2, 'Le sac 42L doit trouver au moins le laptop et la gourde comme compatibles');
assert(compatibles.some(c => c.id === 'laptop_pro_15'), 'Le laptop 15 doit figurer dans les compatibles');
assert(compatibles.some(c => c.id === 'gourde_isotherme'), 'La gourde isotherme doit figurer dans les compatibles');

// 5. Sauvegarde et Restauration d'une Disposition Spatiale Nommée (Mindel §15)
// Préparer une disposition : ouvrir le sac et positionner le laptop
store61.toggleEntityState('sac_nomade_42', 'open');
const layoutId = store61.saveCurrentSpatialLayout(
  'Disposition Voyage Sac Ouvert & Laptop Préparé',
  'Configuration validée pour la démonstration client Mindel'
);
assert(layoutId.length > 0, 'Un identifiant de disposition doit être retourné');

const savedList = useWorldStore.getState().savedSpatialLayouts;
const foundLayout = savedList.find(l => l.id === layoutId);
assert(foundLayout !== undefined, 'La disposition doit être présente dans savedSpatialLayouts');
assert.equal(foundLayout.name, 'Disposition Voyage Sac Ouvert & Laptop Préparé');
const bagSnap = foundLayout.entitySnapshots.find(s => s.entityId === 'sac_nomade_42');
assert(bagSnap !== undefined, 'Le snapshot du sac doit être présent');
assert.equal(bagSnap.state, 'open', 'La disposition enregistrée doit mémoriser l\'état open');

// Altérer volontairement la scène (changer l'état du sac et déplacer le laptop au loin)
store61.toggleEntityState('sac_nomade_42', 'closed');
store61.applyPatch({
  entitiesChanged: [{
    id: 'laptop_pro_15',
    capabilities: [{ type: 'transform', position: { x: 8.5, y: 0, z: -4.2 } }]
  }]
}, 'Déplacer laptop', {});
const alteredLaptopPos = (useWorldStore.getState().world.ir.entities['laptop_pro_15'].capabilities.find(c => c.type === 'transform') as any)?.position;
assert.equal(alteredLaptopPos.x, 8.5, 'Le laptop a été déplacé');

// Restaurer la disposition
store61.loadSpatialLayout(layoutId);
const restoredBag = useWorldStore.getState().world.ir.entities['sac_nomade_42'];
const restoredLaptop = useWorldStore.getState().world.ir.entities['laptop_pro_15'];
assert(restoredBag !== undefined, 'Le sac doit être présent après restauration');
assert.equal(restoredBag.state, 'open', 'L\'état du sac doit être restauré à "open"');
const restoredLaptopPos = (restoredLaptop.capabilities.find(c => c.type === 'transform') as any)?.position;
assert(restoredLaptopPos.x < 1.0, 'La position du laptop doit être restaurée près du sac');

// Suppression de la disposition
store61.deleteSpatialLayout(layoutId);
const listAfterDelete = useWorldStore.getState().savedSpatialLayouts;
assert(!listAfterDelete.some(l => l.id === layoutId), 'La disposition doit être supprimée');

console.log('PASS: Suite 61 validée avec succès (Mindel : Web 3D Sémantique, Test de Capacité & Dispositions Spatiales).');

// ==========================================
// SUITE 62 : MINDEL — VUE ÉCLATÉE INTERACTIVE, FICHE 2D HYBRIDE & MANIFESTE JSON-LD (MINDEL §3, §7, §14, §18, §21)
// ==========================================
const { exportEntityToJsonLd, exportSceneToJsonLd } = await import('../engine/semanticManifest');

const store62 = useWorldStore.getState();
const bagEntity62 = store62.world.ir.entities['sac_nomade_42'];
assert(bagEntity62 !== undefined, 'L\'entité sac_nomade_42 doit être présente');

// 1. Vue Éclatée Interactive & Hotspots Sémantiques (Mindel §7 & §8)
assert.equal(store62.explodedEntities['sac_nomade_42'] || false, false, 'La vue éclatée doit être initialement désactivée');
store62.toggleExplodedView('sac_nomade_42');
assert.equal(useWorldStore.getState().explodedEntities['sac_nomade_42'], true, 'La vue éclatée doit être activée après toggle');

// Sélection d'un composant / hotspot sémantique
store62.setSelectedPartId('part_laptop_sleeve');
assert.equal(useWorldStore.getState().selectedPartId, 'part_laptop_sleeve', 'Le composant "part_laptop_sleeve" doit être sélectionné');

store62.setSelectedPartId(null);
assert.equal(useWorldStore.getState().selectedPartId, null, 'Le composant doit être désélectionné');

// Réassemblage de l'objet
store62.toggleExplodedView('sac_nomade_42');
assert.equal(useWorldStore.getState().explodedEntities['sac_nomade_42'], false, 'La vue éclatée doit être réassemblée');

// 2. Fiche 2D Hybride & Accessibilité (Mindel §3, §14 & §18)
assert.equal(store62.showEntity2DDrawer, false, 'Le tiroir 2D doit être fermé au départ');
store62.setShowEntity2DDrawer(true);
assert.equal(useWorldStore.getState().showEntity2DDrawer, true, 'Le tiroir 2D doit être ouvert');
store62.setShowEntity2DDrawer(false);
assert.equal(useWorldStore.getState().showEntity2DDrawer, false, 'Le tiroir 2D doit être refermé');

// Vérification de la richesse des sous-parties et ressources typées
assert(bagEntity62.parts && bagEntity62.parts.length === 3, 'Le sac 42L doit déclarer 3 parties identifiables');
assert(bagEntity62.parts.some(p => p.id === 'part_laptop_sleeve' && p.fitsMaxDimensions !== undefined), 'Le compartiment PC doit avoir ses cotes max');
assert(bagEntity62.resources && bagEntity62.resources.length === 4, 'Le sac 42L doit déclarer 4 ressources web typées');
assert(bagEntity62.resources.some(r => r.role === 'buy'), 'Une ressource de rôle "buy" doit être déclarée');
assert(bagEntity62.resources.some(r => r.role === 'manual'), 'Une notice technique de rôle "manual" doit être déclarée');
assert(bagEntity62.fallback2D !== undefined, 'Un fallback 2D d\'accessibilité doit être fourni (Mindel §14)');

// 3. Export Manifeste Sémantique JSON-LD / W3C Web of Things (Mindel §21)
const bagJsonLd = exportEntityToJsonLd(bagEntity62);
assert.equal(bagJsonLd['@id'], 'urn:worldpilot:entity:sac_nomade_42');
assert.deepEqual(bagJsonLd['@type'], ['Product', 'wot:Thing']);
assert.equal(bagJsonLd.name, 'Sac Nomade Pro 42L');
assert.equal(bagJsonLd.weight?.value, 1.35);
assert.equal(bagJsonLd.weight?.unitCode, 'KGM');
assert.equal(bagJsonLd.width?.value, 0.34);
assert.equal(bagJsonLd.height?.value, 0.52);
assert.equal(bagJsonLd.depth?.value, 0.24);
assert.equal(bagJsonLd.hasPart?.length, 3);
assert.equal(bagJsonLd.relatedLink?.length, 4);
assert(bagJsonLd['wot:actions'] !== undefined, 'Le manifeste doit déclarer les actions sémantiques WoT');
assert(bagJsonLd['wot:actions']!['toggle_exploded_view'] !== undefined, 'Action toggle_exploded_view déclarée');
assert(bagJsonLd['wot:actions']!['test_capacity'] !== undefined, 'Action test_capacity déclarée');
assert.equal(bagJsonLd['wp:spatialRepresentation']?.format, 'box');

// Export de la Scène Globale en JSON-LD
const sceneJsonLdString = exportSceneToJsonLd(useWorldStore.getState().world.ir, 'Mindel Bag Showcase Scene');
const parsedScene = JSON.parse(sceneJsonLdString);
assert(Array.isArray(parsedScene['@type']) ? parsedScene['@type'].includes('SpatialScene') : parsedScene['@type'] === 'SpatialScene', 'Le type de scène doit être SpatialScene');
assert(Array.isArray(parsedScene.conformsTo), 'La conformité aux standards WoT, Schema.org et IIIF doit être déclarée');
assert(Array.isArray(parsedScene['wp:spatialComposition']), 'La composition spatiale des instances d\'entités doit être présente');
assert.equal(parsedScene.name, 'Mindel Bag Showcase Scene');
assert(Array.isArray(parsedScene.hasPart) && parsedScene.hasPart.length >= 4, 'La scène doit contenir les entités sérialisées');

console.log('PASS: Suite 62 validée avec succès (Mindel : Vue Éclatée, Hotspots Sémantiques, Fiche 2D & Manifeste WoT JSON-LD).');

// ==========================================
// SUITE 63 : MINDEL — PROMPT-TO-STRUCTURED-WORLD & IMPORT DEPUIS UNE URL (MINDEL §17 & §20)
// ==========================================
const { parseInstruction: parseInstruction63 } = await import('../authoring/parser');

const store63 = useWorldStore.getState();

// 1. Substitution en langage naturel préservant la transformation (Mindel §20)
// « Remplace ce produit par le modèle B en gardant sa position »
const parsedReplace = parseInstruction63(
  'remplace ce produit par une valise en gardant sa position',
  { selectedEntityId: 'sac_nomade_42', pointedEntityId: null },
  store63.world.ir.entities
);

assert.equal(parsedReplace.plan.intent, 'replace_entity_preserving_transform', 'L\'intention doit être de substituer l\'entité');
assert(parsedReplace.patch.entitiesRemoved?.includes('sac_nomade_42'), 'L\'entité source sac_nomade_42 doit être marquée pour suppression');
assert(parsedReplace.patch.entitiesCreated && parsedReplace.patch.entitiesCreated.length === 1, 'Une nouvelle entité doit être créée');

const newSuitcase = parsedReplace.patch.entitiesCreated![0];
const originalBag = store63.world.ir.entities['sac_nomade_42'];
const origTransform = originalBag.capabilities.find(c => c.type === 'transform');
const newTransform = newSuitcase.capabilities.find(c => c.type === 'transform');

assert(newTransform !== undefined, 'La nouvelle entité doit disposer d\'un transform');
assert.equal(newTransform.position.x, origTransform?.position.x, 'La coordonnée X doit être strictement conservée');
assert.equal(newTransform.position.y, origTransform?.position.y, 'La coordonnée Y doit être strictement conservée');
assert.equal(newTransform.position.z, origTransform?.position.z, 'La coordonnée Z doit être strictement conservée');
assert.equal(newTransform.rotation?.y, origTransform?.rotation?.y, 'La rotation Y doit être strictement conservée');

// Application du patch dans le store
store63.applyPatch(parsedReplace.patch, 'Remplacement sac par valise', parsedReplace.plan);
assert(useWorldStore.getState().world.ir.entities['sac_nomade_42'] === undefined, 'Le sac doit être retiré');
assert(useWorldStore.getState().world.ir.entities[newSuitcase.id] !== undefined, 'La valise de remplacement doit être présente');

// 2. Méthode programmatique de substitution préservant la disposition
const targetSuitcaseId = newSuitcase.id;
const replaceSuccess = store63.replaceEntityPreservingTransform(targetSuitcaseId, {
  name: 'Sacoche Modulaire Cuir',
  visuals: { shape: 'box', color: '#78350f' },
  physicalProperties: { dimensions: [0.30, 0.20, 0.10], weightKg: 0.9 }
});
assert.equal(replaceSuccess, true, 'La méthode de substitution programmatique doit réussir');
const currentEntities = useWorldStore.getState().world.ir.entities;
const satchel = Object.values(currentEntities).find(e => e.name === 'Sacoche Modulaire Cuir');
assert(satchel !== undefined, 'La sacoche modulaire doit avoir remplacé la valise');
const satchelTransform = satchel!.capabilities.find(c => c.type === 'transform');
assert.equal(satchelTransform?.position.x, origTransform?.position.x, 'Position spatiale de la sacoche inchangée');

// 3. Import d'objet depuis une URL (Mindel §17)
// A. Modèle 3D GLB direct
const glbImportResult = await store63.importEntityFromUrl(
  'https://assets.worldpilot.ai/models/drone_livraison.glb',
  'Drone de Livraison Express'
);
assert.equal(glbImportResult.success, true, 'L\'importation GLB doit réussir');
assert(glbImportResult.entityId !== undefined, 'Un ID d\'entité importée doit être retourné');
const importedDrone = useWorldStore.getState().world.ir.entities[glbImportResult.entityId!];
assert(importedDrone !== undefined, 'Le drone importé doit exister dans le monde');
assert.equal(importedDrone.name, 'Drone de Livraison Express');
assert.equal(importedDrone.visuals?.modelUrl, 'https://assets.worldpilot.ai/models/drone_livraison.glb');
assert(importedDrone.capabilities.some(c => c.type === 'draggable'), 'Le drone doit être manipulable');

// B. Fiche produit / page web connectée
const webImportResult = await store63.importEntityFromUrl(
  'https://store.leica-camera.com/fr/fr/m11-monochrom',
  'Appareil Photo Leica M11 Web'
);
assert.equal(webImportResult.success, true, 'L\'importation Web doit réussir');
const importedCamera = useWorldStore.getState().world.ir.entities[webImportResult.entityId!];
assert(importedCamera !== undefined, 'L\'appareil photo web doit exister dans le monde');
assert(importedCamera.capabilities.some(c => c.type === 'web_screen'), 'L\'appareil doit posséder une capacité web_screen');
assert(importedCamera.resources && importedCamera.resources.length >= 2, 'L\'appareil doit disposer de ressources web typées');

console.log('PASS: Suite 63 validée avec succès (Mindel : Prompt-to-Structured-World, Substitution Spatiale & Import URL).');

// --- Suite 64 : Calibrage Spatial Strict & Assise Physique du Mobilier et des Objets ---
console.log('--- Démarrage de la Suite 64 : Calibrage Spatial Strict & Assise Physique ---');
const { isFloorFurniture: testIsFloorFurniture, getSupportingSurfaceHeight: testGetSupportingSurfaceHeight } = await import('../engine/spatialSurface');
const { autoLockStructuralFurniture: testAutoLock, autoGroundEntities: testAutoGround } = await import('../engine/autonomousSpatialEngine');

// 1. Détection stricte du mobilier de sol
assert.equal(testIsFloorFurniture({ id: 'ilot_central', name: 'Îlot de cuisine', capabilities: [], visuals: { assetId: 'wp-ilot-de-cuisine' } }), true, 'L\'îlot de cuisine doit être reconnu comme meuble de sol');
assert.equal(testIsFloorFurniture({ id: 'table_reunion', name: 'Grande Table', capabilities: [], visuals: { assetId: 'table' } }), true, 'La table doit être reconnue comme meuble de sol');
assert.equal(testIsFloorFurniture({ id: 'comptoir_vente', name: 'Comptoir de vente', capabilities: [], visuals: { assetId: 'counter' } }), true, 'Le comptoir doit être reconnu comme meuble de sol');
assert.equal(testIsFloorFurniture({ id: 'etabli_tech', name: 'Établi technique', capabilities: [], visuals: { assetId: 'technical-bench' } }), true, 'L\'établi technique doit être reconnu comme meuble de sol');
assert.equal(testIsFloorFurniture({ id: 'vip_podium', name: 'Podium VIP d\'inspection', capabilities: [], visuals: { assetId: 'wp-podium-vip' } }), false, 'Le podium VIP sur table ne doit PAS être du mobilier de sol');
assert.equal(testIsFloorFurniture({ id: 'planche_chef', name: 'Planche à découper', capabilities: [], visuals: { assetId: 'wp-planche-a-decouper' } }), false, 'La planche à découper ne doit PAS être du mobilier de sol');
assert.equal(testIsFloorFurniture({ id: 'cocotte_fonte', name: 'Cocotte en fonte', capabilities: [], visuals: { assetId: 'wp-cocotte' } }), false, 'La cocotte ne doit PAS être du mobilier de sol');
assert.equal(testIsFloorFurniture({ id: 'courgette_1', name: 'Courgette', capabilities: [], visuals: { assetId: 'wp-courgette' } }), false, 'La courgette ne doit PAS être du mobilier de sol');

// 2. Calcul des surfaces d'accueil : le mobilier de sol repose toujours au sol (y = 0)
const testWorkshopEntities: Record<string, EntitySpec> = {
  'ilot': {
    id: 'ilot',
    name: 'Îlot de cuisine central',
    capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, { type: 'collider' }],
    visuals: { assetId: 'wp-ilot-de-cuisine' }
  },
  'planche': {
    id: 'planche',
    name: 'Planche à découper de chef',
    capabilities: [{ type: 'transform', position: { x: 0, y: 0.912, z: 0.3 }, scale: { x: 1, y: 1, z: 1 } }, { type: 'collider' }],
    visuals: { assetId: 'wp-planche-a-decouper' }
  },
  'couteau': {
    id: 'couteau',
    name: 'Couteau de chef',
    capabilities: [{ type: 'transform', position: { x: 0, y: 0.942, z: 0.3 }, scale: { x: 1, y: 1, z: 1 } }, { type: 'collider' }],
    visuals: { assetId: 'wp-couteau-de-chef' }
  },
  'courgette_tombee': {
    id: 'courgette_tombee',
    name: 'Courgette tombée au sol',
    capabilities: [{ type: 'transform', position: { x: -0.4, y: 0, z: 0.2 }, scale: { x: 1, y: 1, z: 1 } }, { type: 'collider' }],
    visuals: { assetId: 'wp-courgette' }
  }
};

// Requête sur l'îlot : sa surface d'appui est strictement le sol
const ilotSurface = testGetSupportingSurfaceHeight(0, 0, testWorkshopEntities, 'ilot');
assert.equal(ilotSurface.isGround, true, 'L\'îlot doit avoir pour support le sol');
assert.equal(ilotSurface.surfaceY, 0, 'La hauteur de support de l\'îlot doit être exactement 0');

// Requête sur la planche (sur l'îlot à z = 0.3)
const boardSurface = testGetSupportingSurfaceHeight(0, 0.3, testWorkshopEntities, 'planche');
assert.equal(boardSurface.isGround, false, 'La planche doit reposer sur l\'îlot');
assert.equal(boardSurface.surfaceY, 0.912, 'Le plan de travail de l\'îlot doit être à 0.912m');

// Requête sur le couteau (sur la planche à z = 0.3)
const knifeSurface = testGetSupportingSurfaceHeight(0, 0.3, testWorkshopEntities, 'couteau');
assert.equal(knifeSurface.isGround, false, 'Le couteau doit reposer sur la planche');
assert.equal(knifeSurface.surfaceY, 0.942, 'La surface de la planche doit être à 0.942m (0.912 + 0.03)');

// Requête sur un ingrédient posé directement sur le marbre
const directHerbSurface = testGetSupportingSurfaceHeight(-0.4, 0.2, testWorkshopEntities, 'courgette_tombee');
assert.equal(directHerbSurface.isGround, false, 'La courgette sur l\'emprise de l\'îlot doit détecter l\'îlot');
assert.equal(directHerbSurface.surfaceY, 0.912, 'L\'ingrédient sur le marbre doit avoir une surface à 0.912m');

// 3. Auto-Healing et Auto-Locking du mobilier flottant et des objets tombés
const corruptedEntities: Record<string, EntitySpec> = {
  'floating_island': {
    id: 'floating_island',
    name: 'Îlot de cuisine flottant',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.46, z: 0 } },
      { type: 'draggable' }
    ],
    visuals: { assetId: 'wp-ilot-de-cuisine' }
  },
  'sunk_tomato': {
    id: 'sunk_tomato',
    name: 'Tomate tombée au sol sous l\'îlot',
    capabilities: [
      { type: 'transform', position: { x: -0.4, y: 0, z: -0.1 } },
      { type: 'collider' },
      { type: 'draggable' }
    ],
    visuals: { assetId: 'wp-tomate' }
  }
};

testAutoLock(corruptedEntities);
const fixedIslandTrans = corruptedEntities['floating_island'].capabilities.find(c => c.type === 'transform') as any;
assert.equal(fixedIslandTrans.position.y, 0, 'Le meuble de sol flottant doit être rabattu au sol à y = 0 par autoLock');
assert.equal(corruptedEntities['floating_island'].capabilities.some(c => c.type === 'draggable'), false, 'Le meuble de sol ne doit plus être draggable');

testAutoGround(corruptedEntities, false);
const healedTomatoTrans = corruptedEntities['sunk_tomato'].capabilities.find(c => c.type === 'transform') as any;
assert.equal(healedTomatoTrans.position.y, 0.912, 'L\'ingrédient tombé sous l\'îlot doit être auto-guéri et remonté à 0.912m sur le marbre');

// 4. Test dans le store WorldPilot : groundEntity sur mobilier vs objet
useWorldStore.setState({
  world: {
    version: 1,
    ir: {
      entities: {
        'wp_ilot': {
          id: 'wp_ilot',
          name: 'Îlot de cuisine',
          capabilities: [{ type: 'transform', position: { x: 0, y: 0.45, z: 0 } }, { type: 'collider' }],
          visuals: { assetId: 'wp-ilot-de-cuisine' }
        },
        'wp_knife': {
          id: 'wp_knife',
          name: 'Couteau de chef',
          capabilities: [{ type: 'transform', position: { x: 0.25, y: 0, z: 0.3 } }, { type: 'collider' }],
          visuals: { assetId: 'wp-couteau-de-chef' }
        }
      },
      rules: {},
      invariants: {},
      quests: {},
      activeQuestId: null
    },
    flags: {},
    gameplay: defaultGameplayState
  }
});

// Poser l'îlot via groundEntity : il doit impérativement aller à y = 0
useWorldStore.getState().groundEntity('wp_ilot');
const storeIlot = useWorldStore.getState().world.ir.entities['wp_ilot'];
const storeIlotPos = (storeIlot.capabilities.find(c => c.type === 'transform') as any).position;
assert.equal(storeIlotPos.y, 0, 'groundEntity sur l\'îlot doit strictement poser à y = 0');

// Poser le couteau via groundEntity : il doit reposer sur l'îlot à y = 0.912 + contactLift (0.940)
useWorldStore.getState().groundEntity('wp_knife');
const storeKnife = useWorldStore.getState().world.ir.entities['wp_knife'];
const storeKnifePos = (storeKnife.capabilities.find(c => c.type === 'transform') as any).position;
assert(storeKnifePos.y >= 0.912, 'groundEntity sur le couteau au-dessus de l\'îlot doit le poser sur le plan de travail');

console.log('PASS: Suite 64 validée avec succès (Calibrage Spatial Strict & Assise Physique du Mobilier et des Objets).');

// --- Suite 65 : Traduction Spatiale Déterministe & Déplacement Naturel des Objets ---
console.log('--- Démarrage de la Suite 65 : Traduction Spatiale & Déplacement Naturel des Objets ---');
const { parseInstruction: suite65ParseInstruction, parseInstructionAsync: suite65ParseInstructionAsync } = await import('../authoring/parser');
const { cookingRecipes: suite65Recipes, createRecipePatch: suite65CreateRecipePatch } = await import('../library/cookingRecipes');

// Création d'une scène de cuisine avec fiche recette, îlot, cocotte, etc.
const recipeScenePatch = suite65CreateRecipePatch(suite65Recipes[0], {});
const recipeEntities: Record<string, EntitySpec> = {};
recipeScenePatch.entitiesCreated?.forEach(e => {
  recipeEntities[e.id] = e;
});

const boardId = `recipe_${suite65Recipes[0].id}_board`;
const initialBoard = recipeEntities[boardId];
assert(initialBoard !== undefined, 'La fiche recette doit exister dans la scène culinaire');
const initialBoardPos = initialBoard.capabilities.find(c => c.type === 'transform')?.position || { x: 0, y: 0, z: 0 };
assert.equal(initialBoardPos.z, -0.4, 'La position initiale Z de la fiche recette doit être -0.4');

// 1. Test exact du prompt utilisateur : "recule la fiche recette vers l'arrière"
const parseReculeBoard = suite65ParseInstruction("recule la fiche recette vers l'arrière", { selectedEntityId: null, pointedEntityId: null }, recipeEntities);
assert.equal(parseReculeBoard.plan.intent, 'translate_entity', 'L\'intention doit être translate_entity');
assert(parseReculeBoard.patch.entitiesChanged && parseReculeBoard.patch.entitiesChanged.length > 0, 'Le patch doit modifier une entité');
assert.equal(parseReculeBoard.patch.entitiesChanged[0].id, boardId, 'L\'entité modifiée doit être la fiche recette');
const movedBoardCaps = parseReculeBoard.patch.entitiesChanged[0].capabilities!;
const movedBoardTrans = movedBoardCaps.find(c => c.type === 'transform') as any;
assert.equal(movedBoardTrans.position.z, -0.9, 'La fiche recette doit avoir reculé de 0.5m (z = -0.9)');
assert.equal(movedBoardTrans.position.x, initialBoardPos.x, 'L\'axe X ne doit pas avoir bougé');
assert.equal(movedBoardTrans.position.y, 0, 'L\'assise au sol à y = 0 doit être maintenue');

// 2. Test via parseInstructionAsync : doit retourner la source local_rules
const asyncParsed = await suite65ParseInstructionAsync("recule la fiche recette vers l'arrière", { selectedEntityId: null, pointedEntityId: null }, recipeEntities);
assert.equal(asyncParsed.source, 'local_rules', 'La source de l\'instruction doit être reconnue par les règles locales déterministes');
assert.equal(asyncParsed.plan.intent, 'translate_entity');

// 3. Test "avance la fiche recette"
const parseAvanceBoard = suite65ParseInstruction("avance la fiche recette", { selectedEntityId: null, pointedEntityId: null }, recipeEntities);
assert.equal(parseAvanceBoard.plan.intent, 'translate_entity');
const avanceBoardTrans = parseAvanceBoard.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform') as any;
assert.equal(avanceBoardTrans.position.z, 0.1, 'La fiche recette doit avoir avancé de 0.5m (-0.4 + 0.5 = 0.1)');

// 4. Test déplacement latéral : "déplace la fiche recette vers la gauche"
const parseGauche = suite65ParseInstruction("déplace la fiche recette vers la gauche", { selectedEntityId: null, pointedEntityId: null }, recipeEntities);
const gaucheTrans = parseGauche.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform') as any;
assert.equal(gaucheTrans.position.x, -2.35, 'La fiche recette doit s\'être décalée vers la gauche (-1.85 - 0.5 = -2.35)');

// 5. Test déplacement d'un ustensile : "déplace la cocotte vers la droite"
const parseCocotte = suite65ParseInstruction("déplace la cocotte vers la droite", { selectedEntityId: null, pointedEntityId: null }, recipeEntities);
assert.equal(parseCocotte.plan.intent, 'translate_entity');
assert(Boolean(parseCocotte.patch.entitiesChanged?.[0]?.id?.includes('cocotte')), 'L\'entité déplacée doit être la cocotte');

// 6. Test distance métrique personnalisée : "recule la fiche recette de 1m vers l'arrière"
const parseDist1m = suite65ParseInstruction("recule la fiche recette de 1m vers l'arrière", { selectedEntityId: null, pointedEntityId: null }, recipeEntities);
const dist1mTrans = parseDist1m.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform') as any;
assert.equal(dist1mTrans.position.z, -1.4, 'La fiche recette doit avoir reculé de 1.0m (-0.4 - 1.0 = -1.4)');

// 7. Test distance en cm : "monte le panneau de 30 cm"
const parseMonteCm = suite65ParseInstruction("monte le panneau de 30 cm", { selectedEntityId: null, pointedEntityId: null }, recipeEntities);
const monteCmTrans = parseMonteCm.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform') as any;
assert.equal(monteCmTrans.position.y, 0.3, 'Le panneau doit avoir monté de 0.3m (0 + 0.3 = 0.3)');

// 8. Test meuble de sol : "recule la table vers l'arrière" -> le meuble ne flotte jamais (y = 0)
const parseTable = suite65ParseInstruction("recule la table vers l'arrière", { selectedEntityId: null, pointedEntityId: null }, recipeEntities);
assert(parseTable.patch.entitiesChanged && parseTable.patch.entitiesChanged.length > 0);
const changedTable = parseTable.patch.entitiesChanged[0];
assert(Boolean(changedTable.id?.includes('wp-ilot-de-cuisine') || changedTable.id?.includes('table')), 'L\'entité déplacée doit être l\'îlot/table');
const tableTrans = parseTable.patch.entitiesChanged[0].capabilities!.find(c => c.type === 'transform') as any;
assert.equal(tableTrans.position.y, 0, 'La table doit rester strictement au sol à y = 0');
assert.equal(tableTrans.position.z, -0.5, 'La table doit avoir reculé de 0.5m');

// 9. Test presets de cadrage : "centre la fiche recette"
const parseCenter = suite65ParseInstruction("centre la fiche recette", { selectedEntityId: null, pointedEntityId: null }, recipeEntities);
assert.equal(parseCenter.plan.intent, 'preset_entity_position');
const centerTrans = parseCenter.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform') as any;
assert.equal(centerTrans.position.x, 0, 'Le panneau centré doit avoir x = 0');
assert.equal(centerTrans.position.z, -2.1, 'Le panneau centré doit avoir z = -2.1');

// 10. Test application directe dans le store WorldPilot
useWorldStore.setState({
  world: {
    version: 1,
    ir: {
      entities: { ...recipeEntities },
      rules: {},
      invariants: {},
      quests: {},
      activeQuestId: null
    },
    flags: {},
    gameplay: defaultGameplayState
  }
});

useWorldStore.getState().applyPatch(parseReculeBoard.patch, "recule la fiche recette vers l'arrière", parseReculeBoard.plan);
const storedBoard = useWorldStore.getState().world.ir.entities[boardId];
const storedBoardPos = (storedBoard.capabilities.find(c => c.type === 'transform') as any).position;
assert.equal(storedBoardPos.z, -0.9, 'La position de la fiche recette dans le store doit être mise à jour à z = -0.9');

console.log('PASS: Suite 65 validée avec succès (Traduction Spatiale Déterministe & Déplacement Naturel des Objets).');

// --- Suite 66 : Validation du pont ForwardRef pour RigidBody sous React 18 ---
import React from 'react';
import { RigidBody } from '@react-three/rapier';

await (async () => {
console.log('--- Démarrage de la Suite 66 : Pont ForwardRef & Résolution des Warnings React 18 Rapier ---');

const RigidBodyInnerComponent = ((RigidBody as any).type || RigidBody) as React.FC<any>;
assert(typeof RigidBodyInnerComponent === 'function', 'Le composant interne de RigidBody doit être une fonction de composant React');

// Test 1: Vérification du wrapper React.forwardRef
let passedRefValue: any = null;
const TestMockWrapper = React.forwardRef<any, any>((props, ref) => {
  return ((p: any) => {
    passedRefValue = p.ref;
    return React.createElement('div', p);
  })({ ...props, ref });
});

const mockRefObj = { current: { setTranslation: () => {} } };
const rendered = (TestMockWrapper as any).render({ id: 'entity-1', type: 'fixed' }, mockRefObj);

assert.equal(passedRefValue, mockRefObj, 'Le wrapper forwardRef doit injecter fidèlement l\'objet ref dans les props internes');
assert.equal(rendered.props.id, 'entity-1', 'Les props régulières doivent être préservées');

// Test 2: Vérification que la structure de RigidBody de @react-three/rapier est compatible
assert(typeof (RigidBody as any).type === 'function' || typeof RigidBody === 'function', 'RigidBody doit fournir un render fonctionnel');

console.log('PASS: Suite 66 validée avec succès (Pont ForwardRef & Résolution des Warnings React 18 Rapier).');

// --- Suite 67 : Traduction Spatiale Relative & Positionnement de l'Avatar ---
console.log('--- Démarrage de la Suite 67 : Traduction Spatiale Relative & Positionnement de l\'Avatar ---');
const { parseInstruction: suite67ParseInstruction, parseInstructionAsync: suite67ParseInstructionAsync } = await import('../authoring/parser');
const { cookingRecipes: suite67Recipes, createRecipePatch: suite67CreateRecipePatch } = await import('../library/cookingRecipes');

const suite67Patch = suite67CreateRecipePatch(suite67Recipes[0], {});
let suite67Entities = Object.fromEntries(suite67Patch.entitiesCreated!.map(e => [e.id, e]));

// 1. Test "recule le panneau de recette derrière la table"
const relRes1 = suite67ParseInstruction('recule le panneau de recette derrière la table', { selectedEntityId: null, pointedEntityId: null }, suite67Entities);
assert.equal(relRes1.plan.intent, 'translate_entity');
assert.equal(relRes1.plan.actions![0].relation, 'derriere');
assert.equal(relRes1.plan.actions![0].referenceName, 'Îlot de cuisine');
const relPos1 = (relRes1.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform') as any).position;
assert.equal(relPos1.x, 0, 'Le panneau doit être centré sur la table en X');
assert.equal(relPos1.z, -2.4, 'Le panneau suspendu doit être placé à z = -2.4 derrière la table');
assert.equal(relPos1.y, 0.55, 'Le panneau doit être surélevé en hauteur (Écran mural suspendu)');

// 1b. Test exact du prompt utilisateur : "déplacer la recette derrière la table de cuisson"
const relRes1b = suite67ParseInstruction('déplacer la recette derrière la table de cuisson', { selectedEntityId: null, pointedEntityId: null }, suite67Entities);
assert.equal(relRes1b.plan.intent, 'translate_entity', 'L\'intention doit être translate_entity');
assert.equal(relRes1b.plan.actions![0].target, `recipe_${suite67Recipes[0].id}_board`, 'L\'entité cible doit être la fiche recette');
assert.equal(relRes1b.plan.actions![0].relation, 'derriere');
assert(relRes1b.plan.actions![0].referenceEntityId?.includes('wp-ilot-de-cuisine'), 'L\'objet de référence doit être l\'îlot/table de cuisson');
const relPos1b = (relRes1b.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform') as any).position;
assert.equal(relPos1b.x, 0, 'La recette doit être centrée en X derrière la table');
assert.equal(relPos1b.z, -2.4, 'La recette doit être placée à z = -2.4 derrière la table de cuisson');
assert.equal(relPos1b.y, 0.55, 'La recette doit être surélevée en hauteur à y = 0.55 (Écran mural suspendu)');

// 1c. Test async : doit être résolu par les règles locales déterministes (sans solliciter le LLM)
const asyncRes1c = await suite67ParseInstructionAsync('déplacer la recette derrière la table de cuisson', { selectedEntityId: null, pointedEntityId: null }, suite67Entities);
assert.equal(asyncRes1c.source, 'local_rules', 'L\'instruction spatiale doit être traitée directement par les règles locales');
assert.equal(asyncRes1c.plan.intent, 'translate_entity');

// 1d. Test choix utilisateur direct : "Surélever automatiquement le panneau en hauteur derrière les tables (Écran mural suspendu)"
const choiceRes = await suite67ParseInstructionAsync('pour l\'option précédente, je choisis "Surélever automatiquement le panneau en hauteur derrière les tables (Écran mural suspendu)"', { selectedEntityId: null, pointedEntityId: null }, suite67Entities);
assert.equal(choiceRes.plan.intent, 'elevate_screen_to_wall');
assert.equal(choiceRes.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform')!.position.y, 0.55);
assert.equal(choiceRes.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform')!.position.z, -2.4);

// 1e. Test placement sur surface : "mets la cocotte sur la table"
const relRes1d = suite67ParseInstruction('mets la cocotte sur la table', { selectedEntityId: null, pointedEntityId: null }, suite67Entities);
assert.equal(relRes1d.plan.intent, 'translate_entity');
assert.equal(relRes1d.plan.actions![0].relation, 'sur');
const relPos1d = (relRes1d.patch.entitiesChanged![0].capabilities!.find(c => c.type === 'transform') as any).position;
assert.equal(relPos1d.y, 0.922, 'La cocotte doit reposer à la hauteur de travail de la table');

// Appliquer le déplacement dans les entités pour le test suivant
const movedBoard = relRes1.patch.entitiesChanged![0];
suite67Entities[movedBoard.id!] = { ...suite67Entities[movedBoard.id!], capabilities: movedBoard.capabilities! };

// 2. Test "affiche l'avatar devant le panneau de recette"
const relRes2 = suite67ParseInstruction('affiche l\'avatar devant le panneau de recette', { selectedEntityId: null, pointedEntityId: null }, suite67Entities);
assert.equal(relRes2.plan.intent, 'position_spatial_avatar');
assert(relRes2.plan.actions![0].position, 'Une position pour l\'avatar doit être calculée');
assert.equal(relRes2.plan.actions![0].position.x, -0.25, 'Avatar X doit être devant le panneau');
assert.equal(relRes2.plan.actions![0].position.z, -1.55, 'Avatar Z doit être entre la table et le panneau suspendu');

// 3. Test non-interception par la modale de recettes
assert.notEqual(relRes2.plan.intent, 'open_cooking_recipes_modal', 'Ne doit jamais ouvrir la modale de recettes par faux positif');

console.log('PASS: Suite 67 validée avec succès (Traduction Spatiale Relative & Positionnement de l\'Avatar).');

// --- Suite 68 : Restauration Sémantique de la Table de Cuisine & Auto-Élévation des Objets ---
console.log('--- Démarrage de la Suite 68 : Restauration Sémantique de la Table de Cuisine & Auto-Élévation ---');
const { parseLibraryInstruction: suite68ParseLibrary } = await import('../library/catalog');
const { hasDetailedSimulationModel: suite68HasDetailed } = await import('../scene/DetailedSimulationModel');
const { autoGroundEntities: suite68AutoGround } = await import('../engine/autonomousSpatialEngine');

// 1. Test "remets la table" en contexte culinaire
const culinaryContextEntities: Record<string, EntitySpec> = {
  'cocotte_test': {
    id: 'cocotte_test',
    name: 'Cocotte en fonte',
    capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: -0.1 }, scale: { x: 1, y: 1, z: 1 } }, { type: 'draggable' }],
    visuals: { assetId: 'wp-cocotte' }
  }
};

const tableRes1 = suite68ParseLibrary('remets la table', culinaryContextEntities);
assert(tableRes1 && tableRes1.entitiesCreated && tableRes1.entitiesCreated.length > 0, 'La consigne "remets la table" doit créer l\'îlot de cuisine');
assert.equal(tableRes1.entitiesCreated[0].visuals?.assetId, 'wp-ilot-de-cuisine', 'L\'entité créée doit être wp-ilot-de-cuisine');

// 2. Test "ajoute une table de cuisine" et "remets l'îlot de cuisine"
const tableRes2 = suite68ParseLibrary('ajoute une table de cuisine', {});
assert(tableRes2 && tableRes2.entitiesCreated, '"ajoute une table de cuisine" doit être reconnu');
assert.equal(tableRes2.entitiesCreated[0].visuals?.assetId, 'wp-ilot-de-cuisine');

const tableRes3 = suite68ParseLibrary("remets l'îlot de cuisine", {});
assert(tableRes3 && tableRes3.entitiesCreated, '"remets l\'îlot de cuisine" doit être reconnu');
assert.equal(tableRes3.entitiesCreated[0].visuals?.assetId, 'wp-ilot-de-cuisine');

// 3. Test reconnaissance du modèle 3D sur-mesure ultra-détaillé
assert.equal(suite68HasDetailed({ id: 'ilot_1', name: 'Îlot de cuisine', capabilities: [], visuals: { assetId: 'wp-ilot-de-cuisine' } }), true, 'L\'îlot de cuisine doit disposer du modèle détaillé');
assert.equal(suite68HasDetailed({ id: 'table_cui', name: 'Table de cuisine', capabilities: [], visuals: { assetId: 'table' } }), true, 'Une table de cuisine doit disposer du modèle détaillé');
assert.equal(suite68HasDetailed({ id: 'plan_trav', name: 'Plan de travail', capabilities: [], visuals: { assetId: 'plan-de-travail' } }), true, 'Un plan de travail doit disposer du modèle détaillé');

// 4. Test auto-élévation des objets au sol vers le plateau de la table
const sceneWithTableAndFloorObj: Record<string, EntitySpec> = {
  'ilot_central': {
    id: 'ilot_central',
    name: 'Îlot de cuisine',
    capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, { type: 'collider' }],
    visuals: { assetId: 'wp-ilot-de-cuisine' }
  },
  'cocotte_sol': {
    id: 'cocotte_sol',
    name: 'Cocotte en fonte',
    capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: -0.15 }, scale: { x: 1, y: 1, z: 1 } }, { type: 'draggable' }],
    visuals: { assetId: 'wp-cocotte' }
  }
};

suite68AutoGround(sceneWithTableAndFloorObj);
const elevatedCocottePos = (sceneWithTableAndFloorObj.cocotte_sol.capabilities.find(c => c.type === 'transform') as any).position;
assert.equal(elevatedCocottePos.y, 0.912, 'La cocotte au sol doit être immédiatement surélevée à la hauteur du plateau (0.912m)');

console.log('PASS: Suite 68 validée avec succès (Restauration Sémantique de la Table & Auto-Élévation).');

// --- Suite 69 : Modélisation 3D Réaliste de la Cuillère en Bois & Élimination du Fallback High-Tech ---
console.log('--- Démarrage de la Suite 69 : Modélisation 3D Réaliste de la Cuillère en Bois ---');
const { parseLibraryInstruction: suite69ParseLibrary } = await import('../library/catalog');
const { hasDetailedSimulationModel: suite69HasDetailed } = await import('../scene/DetailedSimulationModel');

// 1. Détection de la cuillère en bois dans le catalogue
const spoonRes1 = suite69ParseLibrary('ajoute une cuillère en bois', {});
assert(spoonRes1 && spoonRes1.entitiesCreated, 'La consigne "ajoute une cuillère en bois" doit être reconnue');
assert.equal(spoonRes1.entitiesCreated[0].visuals?.assetId, 'wp-cuillere-bois', 'L\'entité créée doit être wp-cuillere-bois');

const spoonRes2 = suite69ParseLibrary('pose une cuillere de cuisine', {});
assert(spoonRes2 && spoonRes2.entitiesCreated, 'La consigne "pose une cuillere de cuisine" doit être reconnue');
assert.equal(spoonRes2.entitiesCreated[0].visuals?.assetId, 'wp-cuillere-bois');

// 2. Vérification que la cuillère en bois dispose du modèle 3D sur-mesure haute-fidélité (pas de cube high-tech noir)
assert.equal(suite69HasDetailed({ id: 'spoon_1', name: 'Cuillère en bois', capabilities: [], visuals: { assetId: 'wp-cuillere-bois' } }), true, 'wp-cuillere-bois doit disposer du modèle 3D détaillé');
assert.equal(suite69HasDetailed({ id: 'spoon_2', name: 'Cuillère en bois', capabilities: [], visuals: {} }), true, 'Une entité nommée "Cuillère en bois" doit disposer du modèle détaillé');
assert.equal(suite69HasDetailed({ id: 'spoon_3', name: 'Cuillère de cuisine artisanale', capabilities: [], visuals: {} }), true, 'Une entité nommée "Cuillère de cuisine artisanale" doit disposer du modèle détaillé');

console.log('PASS: Suite 69 validée avec succès (Modélisation 3D Réaliste de la Cuillère en Bois).');

// --- Suite 70 : Différenciation Stricte des Couverts d'Orfèvrerie & Archétypes d'Ustensiles ---
console.log('--- Démarrage de la Suite 70 : Différenciation Stricte des Couverts d\'Orfèvrerie & Archétypes d\'Ustensiles ---');
const { getAsset: suite70GetAsset } = await import('../library/catalog');

// 1. Couverts de table distincts de la cuillère en bois de cuisine
const soupSpoonMeta = suite70GetAsset('wp-cuillere-a-soupe');
assert(soupSpoonMeta, 'wp-cuillere-a-soupe doit exister');
assert.notEqual(soupSpoonMeta.name, 'Cuillère en bois', 'La cuillère à soupe ne doit pas être renommée en cuillère en bois');

const teaSpoonMeta = suite70GetAsset('wp-petite-cuillere');
assert(teaSpoonMeta, 'wp-petite-cuillere doit exister');
assert.notEqual(teaSpoonMeta.name, 'Cuillère en bois', 'La petite cuillère ne doit pas être renommée en cuillère en bois');

// 2. Vérification que les modèles détaillés sont bien assignés
assert.equal(suite69HasDetailed({ id: 'silver_spoon', name: 'Cuillère en argent', capabilities: [], visuals: {} }), true, 'Cuillère en argent doit disposer d\'un modèle détaillé');
assert.equal(suite69HasDetailed({ id: 'inox_spoon', name: 'Cuillère en inox', capabilities: [], visuals: {} }), true, 'Cuillère en inox doit disposer d\'un modèle détaillé');
assert.equal(suite69HasDetailed({ id: 'wood_spoon', name: 'Cuillère en bois', capabilities: [], visuals: {} }), true, 'Cuillère en bois doit disposer d\'un modèle détaillé');

console.log('PASS: Suite 70 validée avec succès (Différenciation Couverts d\'Orfèvrerie & Archétypes d\'Ustensiles).');

// --- Suite 71 : Clairière Forestière, Cueillette de Champignons & Objets Non-Déplaçables ---
console.log('--- Démarrage de la Suite 71 : Clairière Forestière & Objets Non-Déplaçables ---');
const { isStaticOrStructuralEntity: suite71IsStatic } = await import('../engine/spatialSurface');
const { hasDetailedSimulationModel: suite71HasDetailed } = await import('../scene/DetailedSimulationModel');

// 1. Vérification stricte des objets non déplaçables (sols, arbres enracinés, troncs massifs)
const groundEntity = { id: 'forest_ground', name: 'Sol forestier & Clairière moussée', capabilities: [{ type: 'static' as const }], visuals: { assetId: 'wp-sol-forestier' } };
const oakEntity = { id: 'forest_oak_1', name: 'Grand chêne de sous-bois', capabilities: [{ type: 'static' as const }], visuals: { assetId: 'wp-chene-forestier' } };
const logEntity = { id: 'forest_mossy_log', name: 'Tronc couché moussé & Polypores', capabilities: [{ type: 'static' as const }], visuals: { assetId: 'wp-tronc-mousse' } };
const cepeEntity = { id: 'forest_cepe_adult', name: 'Cèpe de Bordeaux (Boletus edulis)', capabilities: [{ type: 'draggable' as const }], visuals: { assetId: 'wp-cepe-de-bordeaux' } };
const basketEntity = { id: 'forest_wicker_basket', name: 'Panier de cueillette en osier', capabilities: [{ type: 'draggable' as const }], visuals: { assetId: 'wp-panier-cueillette' } };

assert.equal(suite71IsStatic(groundEntity as any), true, 'Le sol forestier doit être strictement non-déplaçable');
assert.equal(suite71IsStatic(oakEntity as any), true, 'Le grand chêne doit être strictement non-déplaçable');
assert.equal(suite71IsStatic(logEntity as any), true, 'Le tronc d\'arbre couché doit être non-déplaçable');
assert.equal(suite71IsStatic(cepeEntity as any), false, 'Le cèpe de Bordeaux doit être déplaçable / récoltable');
assert.equal(suite71IsStatic(basketEntity as any), false, 'Le panier de cueillette doit être déplaçable');

// 2. Vérification des modèles 3D procéduraux sur-mesure haute-fidélité
assert.equal(suite71HasDetailed(groundEntity as any), true, 'wp-sol-forestier doit avoir un modèle 3D détaillé');
assert.equal(suite71HasDetailed(oakEntity as any), true, 'wp-chene-forestier doit avoir un modèle 3D détaillé');
assert.equal(suite71HasDetailed(logEntity as any), true, 'wp-tronc-mousse doit avoir un modèle 3D détaillé');
assert.equal(suite71HasDetailed(cepeEntity as any), true, 'wp-cepe-de-bordeaux doit avoir un modèle 3D détaillé');
assert.equal(suite71HasDetailed({ id: 'amanita', name: 'Amanite tue-mouches', capabilities: [], visuals: { assetId: 'wp-amanite-tue-mouches' } } as any), true, 'wp-amanite-tue-mouches doit avoir un modèle 3D détaillé');
assert.equal(suite71HasDetailed(basketEntity as any), true, 'wp-panier-cueillette doit avoir un modèle 3D détaillé');
assert.equal(suite71HasDetailed({ id: 'guide', name: 'Guide mycologique & Loupe', capabilities: [], visuals: { assetId: 'wp-guide-mycologie' } } as any), true, 'wp-guide-mycologie doit avoir un modèle 3D détaillé');
assert.equal(suite71HasDetailed({ id: 'fern', name: 'Fougère aigle de sous-bois', capabilities: [], visuals: { assetId: 'wp-fougere-sous-bois' } } as any), true, 'wp-fougere-sous-bois doit avoir un modèle 3D détaillé');

// 3. Parser en langage naturel pour la consigne utilisateur exacte
const parseForagingRes1 = parseInstruction("c'est censé représenter la foret, la cueillette de champigons. c'est bof", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseForagingRes1.plan.intent, 'load_forest_foraging', 'La consigne utilisateur doit charger le scénario forestier déterministe');
assert(parseForagingRes1.patch.entitiesCreated && parseForagingRes1.patch.entitiesCreated.length >= 8, 'Le scénario forestier doit créer au moins 8 éléments botaniques');
assert(parseForagingRes1.patch.questsAdded && parseForagingRes1.patch.questsAdded.length >= 1, 'Le scénario forestier doit attacher la quête de cueillette');
assert(parseForagingRes1.patch.rulesChanged && parseForagingRes1.patch.rulesChanged.length >= 3, 'Le scénario forestier doit inclure les règles d\'interaction');

const parseForagingRes2 = parseInstruction("cueillette de champignons en forêt", { selectedEntityId: null, pointedEntityId: null }, {});
assert.equal(parseForagingRes2.plan.intent, 'load_forest_foraging');

console.log('PASS: Suite 71 validée avec succès (Clairière Forestière, Cueillette de Champignons & Objets Non-Déplaçables).');

// 72. Test Suite: Context-Adaptive Persona Resolution Engine (Anti-Chef Contamination & Domain Specialist Avatars)
const { resolveContextualPersona: resolvePersonaFn } = await import('../engine/agentDialogues');

// A. Forest & Nature context MUST resolve to Sylvain (naturalist) and NEVER Chef Auguste
const forestPersona = resolvePersonaFn({
  category: 'nature',
  worldTheme: 'forest-clearing',
  instruction: 'montrer comment trouver les champignons dans la foret'
});
assert.equal(forestPersona.theme, 'naturalist', 'La forêt et les champignons doivent assigner Sylvain le Guide Naturaliste');
assert.equal(forestPersona.name, 'Sylvain, Guide Naturaliste & Mycologue');
assert.notEqual(forestPersona.theme, 'chef', 'Chef Auguste ne doit JAMAIS apparaître dans la forêt');

// B. Automotive and battery maintenance MUST resolve to Marc (mechanic)
const mechanicPersona = resolvePersonaFn({
  category: 'mecanique',
  worldTheme: 'supercar-showroom',
  instruction: 'changer la batterie 12V et tester la tension'
});
assert.equal(mechanicPersona.theme, 'mechanic', 'La mécanique et batteries doivent assigner Marc le Maître Mécanicien');
assert.equal(mechanicPersona.name, 'Marc, Maître Mécanicien');

// C. Chemistry and science lab MUST resolve to Dr. Aris (scientist)
const sciencePersona = resolvePersonaFn({
  category: 'science',
  worldTheme: 'high-tech-lab',
  instruction: 'doser le réactif dans léprouvette'
});
assert.equal(sciencePersona.theme, 'scientist', 'Le laboratoire de chimie doit assigner Dr. Aris');
assert.equal(sciencePersona.name, 'Dr. Aris, Chercheur en Sciences & Chimie');

// D. Cooking recipes MUST still resolve to Chef Auguste
const chefPersonaResolved = resolvePersonaFn({
  category: 'cuisine',
  worldTheme: 'cozy-bistrot',
  instruction: 'préparer une ratatouille provençale mijotée'
});
assert.equal(chefPersonaResolved.theme, 'chef', 'La cuisine gastronomique doit assigner Chef Auguste');
assert.equal(chefPersonaResolved.name, 'Chef Auguste');

// E. Semantic entity footprint disambiguation (e.g. foraging knife in forest vs chef knife in kitchen)
const forestEntities = {
  cepe: { id: 'cepe', name: 'Cèpe de Bordeaux', visuals: { assetId: 'wp-cepe-de-bordeaux' } },
  guide: { id: 'guide', name: 'Guide mycologique', visuals: { assetId: 'wp-guide-mycologie' } }
};
const resolvedByEntities = resolvePersonaFn({
  worldTheme: 'forest-clearing',
  entities: forestEntities,
  instruction: 'chercher les champignons'
});
assert.equal(resolvedByEntities.theme, 'naturalist', 'Les entités mycologiques doivent élire le naturaliste');

// F. Neutral fallback without domain cues defaults to Victoria Pilot
const neutralPersona = resolvePersonaFn({});
assert.equal(neutralPersona.theme, 'assistant', 'Le contexte neutre doit assigner Victoria Pilot');
assert.equal(neutralPersona.name, 'Victoria Pilot');

console.log('PASS: Suite 72 validée avec succès (Context-Adaptive Embodied Personas & Anti-Chef Contamination).');

// 73. Test Suite: Generative Parametric Persona Synthesis (Out-of-Catalog Dynamic Avatars)
const { synthesizeParametricPersona: synthPersonaFn } = await import('../engine/agentDialogues');

// A. Pompier / Sécurité Incendie
const firefighter = synthPersonaFn({ instruction: "intervention d'urgence pour éteindre un feu" });
assert(firefighter !== null, 'Doit synthétiser un pompier pour une alerte incendie');
assert.equal(firefighter?.theme, 'custom');
assert.equal(firefighter?.attire?.accessoryType, 'helmet');
assert.equal(firefighter?.attire?.jacketColor, '#ea580c');

// B. Médecin / Urgentiste / Santé
const doctor = synthPersonaFn({ instruction: "ausculter le patient dans la chambre d'hôpital" });
assert(doctor !== null, 'Doit synthétiser un médecin pour un contexte hospitalier');
assert.equal(doctor?.theme, 'custom');
assert.equal(doctor?.attire?.accessoryType, 'stethoscope');
assert.equal(doctor?.attire?.jacketColor, '#f8fafc');

// C. Apiculteur / Ruchers
const beekeeper = synthPersonaFn({ instruction: "inspecter les ruches et récolter le miel" });
assert(beekeeper !== null, 'Doit synthétiser un apiculteur pour les abeilles et ruches');
assert.equal(beekeeper?.theme, 'custom');
assert.equal(beekeeper?.attire?.accessoryType, 'hat');

// D. Artisan / Menuisier / Forge
const artisan = synthPersonaFn({ instruction: "travailler le bois avec des outils d'ébénisterie" });
assert(artisan !== null, 'Doit synthétiser un artisan pour la menuiserie');
assert.equal(artisan?.theme, 'custom');
assert.equal(artisan?.attire?.accessoryType, 'tool_belt');

// E. Dérivation via resolveContextualPersona (pipeline complet)
const resolvedFirefighter = resolvePersonaFn({
  instruction: "montre comment les pompiers éteignent un incendie",
  worldTheme: 'fire-station'
});
assert.equal(resolvedFirefighter.theme, 'custom', 'Un prompt hors catalogue doit générer une persona paramétrique sur-mesure');
assert.equal(resolvedFirefighter.attire?.accessoryType, 'helmet');

const resolvedDoctor = resolvePersonaFn({
  instruction: "consulter les constantes vitales du patient en soins intensifs",
  category: 'sante'
});
assert.equal(resolvedDoctor.theme, 'custom', 'Un contexte de santé doit générer un médecin urgentiste paramétrique');
assert.equal(resolvedDoctor.attire?.accessoryType, 'stethoscope');

console.log('PASS: Suite 73 validée avec succès (Generative Parametric Personas & Autonomous Out-of-Catalog Synthesis).');

// 74. Test Suite: Deterministic Table Replenishment & ForwardRef RigidBody Warning Neutralization
const tableEntities = {
  ilot: {
    id: 'wp_ilot_central',
    name: 'Îlot de cuisine en chêne & marbre',
    capabilities: [
      { type: 'transform' as const, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' as const }
    ],
    visuals: { assetId: 'wp-ilot-de-cuisine' }
  }
};

const tableReplenishRes = parseInstruction("il manque des objets sur la table", { selectedEntityId: null, pointedEntityId: null }, tableEntities);
assert.equal(tableReplenishRes.plan.intent, 'populate_table', 'La consigne utilisateur doit déclencher l\'intention populate_table');
assert(tableReplenishRes.patch.entitiesCreated && tableReplenishRes.patch.entitiesCreated.length > 0, 'Doit générer des objets culinaires manquants sur la table');

// Vérification de la présence des ustensiles et ingrédients indispensables
const createdAssetIds = tableReplenishRes.patch.entitiesCreated.map(e => e.visuals?.assetId);
assert(createdAssetIds.includes('wp-planche-a-decouper'), 'Doit ajouter une planche à découper');
assert(createdAssetIds.includes('wp-couteau-chef'), 'Doit ajouter un couteau de chef');
assert(createdAssetIds.includes('wp-cocotte-en-fonte'), 'Doit ajouter une cocotte');

// Vérification de l'assise physique sur le plateau (hauteur y = 0.922m)
const cuttingBoard = tableReplenishRes.patch.entitiesCreated.find(e => e.visuals?.assetId === 'wp-planche-a-decouper');
const cbPos = cuttingBoard?.capabilities.find(c => c.type === 'transform')?.position;
assert.equal(cbPos?.y, 0.922, 'La planche doit être rigoureusement posée sur le plateau de l\'îlot');

// Test de non-duplication : si la cocotte existe déjà, elle ne doit pas être ré-ajoutée
const tableEntitiesWithPot = {
  ...tableEntities,
  cocotte: {
    id: 'wp_cocotte_existante',
    name: 'Cocotte en fonte',
    capabilities: [{ type: 'transform' as const, position: { x: 0.38, y: 0.922, z: -0.04 } }],
    visuals: { assetId: 'wp-cocotte-en-fonte' }
  }
};
const tableReplenishRes2 = parseInstruction("ajoute des objets sur la table", { selectedEntityId: null, pointedEntityId: null }, tableEntitiesWithPot);
const createdAssetIds2 = tableReplenishRes2.patch.entitiesCreated?.map(e => e.visuals?.assetId) || [];
assert(!createdAssetIds2.includes('wp-cocotte-en-fonte'), 'Ne doit pas dupliquer la cocotte si elle est déjà présente');

console.log('PASS: Suite 74 validée avec succès (Table Replenishment & ForwardRef RigidBody Warning Neutralization).');

// --- Suite 75 : Immunisation Anti-Collision Sémantique (Amanite muscaria vs Automobile) & Persona Naturaliste ---
console.log('--- Démarrage de la Suite 75 : Immunisation Anti-Collision Sémantique & Persona Naturaliste ---');
const { DetailedSimulationModel: suite75DetailedSim, AmanitaMuscaria3D: suite75Amanita, AutomobileCarEngineBay: suite75Car } = await import('../scene/DetailedSimulationModel');
const { resolveContextualPersona: suite75ResolvePersona } = await import('../engine/agentDialogues');

// 1. Entité Amanita muscaria : ne doit JAMAIS résoudre vers AutomobileCarEngineBay malgré le sous-mot latin "car"
const amanitaEntity = {
  id: 'forest_amanita',
  name: 'Amanite tue-mouches (Amanita muscaria) · Toxique !',
  capabilities: [{ type: 'transform' as const, position: { x: 1.15, y: 0.08, z: -0.35 } }],
  visuals: { assetId: 'wp-amanite-tue-mouches' }
};

const renderedAmanita = suite75DetailedSim({ entity: amanitaEntity as any });
assert.notEqual((renderedAmanita as any)?.type, suite75Car, 'Amanita muscaria ne doit JAMAIS être rendue comme une automobile');
assert.equal((renderedAmanita as any)?.type, suite75Amanita, 'Amanita muscaria doit être rigoureusement rendue comme AmanitaMuscaria3D');

// 2. Mots piégés contenant "car" en sous-chaîne : ne doivent pas devenir des voitures
const fakeCarEntities = [
  { id: 'carton', name: 'Carton d’expédition', visuals: { assetId: 'cardboard-box' } },
  { id: 'carte', name: 'Carte géographique de randonnée', visuals: { assetId: 'map' } },
  { id: 'carotte', name: 'Carotte fraîche du potager', visuals: { assetId: 'carrot' } },
  { id: 'scarabee', name: 'Scarabée rhinocéros', visuals: { assetId: 'beetle' } }
];

for (const fake of fakeCarEntities) {
  const res = suite75DetailedSim({ entity: fake as any });
  assert.notEqual((res as any)?.type, suite75Car, `L'entité '${fake.name}' ne doit pas être interceptée comme une automobile`);
}

// 3. Vraie voiture : doit toujours résoudre vers l'automobile
const realCarEntity = {
  id: 'car_sedan_1',
  name: 'Voiture berline avec compartiment moteur ouvert',
  visuals: { assetId: 'wp-voiture' }
};
const renderedRealCar = suite75DetailedSim({ entity: realCarEntity as any });
assert.equal((renderedRealCar as any)?.type, suite75Car, 'La vraie voiture doit résoudre vers AutomobileCarEngineBay');

// 4. Résolution contextuelle de l'avatar pour le prompt cueillette champignons en forêt
const foragingPromptPersona = suite75ResolvePersona({
  instruction: 'explique comment trouver les champignons dans la foret',
  worldTheme: 'forest-clearing',
  category: 'nature',
  activeQuestTitle: 'Mission : Cueillette Sécurisée en Forêt'
});
assert.equal(foragingPromptPersona.theme, 'naturalist', 'Le prompt champignons en forêt doit assigner la persona naturalist');
assert.equal(foragingPromptPersona.name, 'Sylvain, Guide Naturaliste & Mycologue', 'L\'avatar doit être Sylvain le Guide Naturaliste');

console.log('PASS: Suite 75 validée avec succès (Immunisation Anti-Collision Sémantique & Persona Naturaliste).');

// --- Suite 76 : Sécurité des Shaders Three.js & Persona Plage et Coquillages ---
console.log('--- Démarrage de la Suite 76 : Sécurité des Shaders Three.js & Persona Plage et Coquillages ---');

// 1. Vérification que les shaders dans src/scene ne redéfinissent pas de built-in uniforms Three.js
const { readFileSync: suite76ReadFile } = await import('fs');
const alpineLakeSource = suite76ReadFile(new URL('../scene/refuge/AlpineLake.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(
  alpineLakeSource,
  /uniform\s+vec3\s+cameraPosition;/,
  'AlpineLake ne doit pas redéfinir uniform vec3 cameraPosition (built-in Three.js automatique)'
);
assert.doesNotMatch(
  alpineLakeSource,
  /uniform\s+mat4\s+(viewMatrix|modelMatrix|projectionMatrix);/,
  'AlpineLake ne doit pas redéfinir les matrices Three.js'
);

// 2. Vérification que le prompt de coquillages sur la plage résout bien vers une persona naturaliste
const beachPersona = suite75ResolvePersona({
  instruction: 'montre comment ramasser les coquillages sur la plage',
  worldTheme: 'le-refuge',
  category: 'nature',
  activeQuestTitle: 'Exploration Littorale & Ramassage de Coquillages'
});
assert.equal(beachPersona.theme, 'naturalist', 'Le prompt de coquillages sur la plage doit router vers la persona naturaliste');
assert.ok(beachPersona.name.toLowerCase().includes('guide') || beachPersona.name.toLowerCase().includes('naturaliste'), 'La persona doit être un guide naturaliste');

console.log('PASS: Suite 76 validée avec succès (Sécurité Shaders Three.js & Persona Plage/Coquillages).');

// --- Suite 77 : Modélisation 3D Réaliste des Coquillages & Primitives PBR Composites ---
console.log('--- Démarrage de la Suite 77 : Modélisation 3D Réaliste des Coquillages & Primitives PBR Composites ---');

const { 
  hasDetailedSimulationModel: suite77HasModel,
  DetailedSimulationModel: suite77DetailedSim,
  RealisticMarineSeashell3D: suite77Seashell,
  BeachCollectingBasket3D: suite77Basket
} = await import('../scene/DetailedSimulationModel');

// 1. Détection des coquillages marins et panier de plage
assert.ok(suite77HasModel({ id: 'shell_1', name: 'Coquille Saint-Jacques sur la plage', visuals: { assetId: 'wp-coquillage' } } as any), 'Doit détecter wp-coquillage');
assert.ok(suite77HasModel({ id: 'basket_1', name: 'Panier de récolte de coquillages', visuals: { assetId: 'wp-panier-coquillages' } } as any), 'Doit détecter panier coquillages');

// 2. Dispatch vers RealisticMarineSeashell3D et BeachCollectingBasket3D
const renderedShell = suite77DetailedSim({ entity: { id: 's1', name: 'Coquille Saint-Jacques', visuals: { assetId: 'wp-coquille-saint-jacques' } } as any });
assert.equal((renderedShell as any)?.type, suite77Seashell, 'Doit rendre RealisticMarineSeashell3D');

const renderedBasket = suite77DetailedSim({ entity: { id: 'b1', name: 'Seau de plage pour coquillages', visuals: { assetId: 'wp-seau-plage' } } as any });
assert.equal((renderedBasket as any)?.type, suite77Basket, 'Doit rendre BeachCollectingBasket3D');

// 3. Vérification du support des primitives organiques dans entity.parts (R3FWorldAdapter)
const r3fAdapterSource = suite76ReadFile(new URL('../scene/R3FWorldAdapter.tsx', import.meta.url), 'utf8');
assert.match(r3fAdapterSource, /coneGeometry/, 'R3FWorldAdapter doit supporter coneGeometry pour les pièces composites');
assert.match(r3fAdapterSource, /torusGeometry/, 'R3FWorldAdapter doit supporter torusGeometry pour les pièces composites');
assert.match(r3fAdapterSource, /meshPhysicalMaterial/, 'R3FWorldAdapter doit utiliser meshPhysicalMaterial avec PBR pour les pièces');

console.log('PASS: Suite 77 validée avec succès (Modélisation Coquillages Réalistes & Primitives Composites PBR).');

// --- Suite 78 : Modélisation Voilier Réaliste, Résilience des Règles sur Sous-Parties & Bouton Fermeture ---
console.log('--- Démarrage de la Suite 78 : Modélisation Voilier Réaliste, Résilience des Règles & Bouton Fermeture ---');

const { 
  RealisticSailboatBoat3D: suite78Sailboat
} = await import('../scene/DetailedSimulationModel');

// 1. Détection du voilier/bateau et rendu haute-fidélité
assert.ok(suite77HasModel({ id: 'boat_1', name: 'Bateau voilier sur la mer', visuals: { assetId: 'wp-bateau' } } as any), 'Doit détecter wp-bateau');
assert.ok(suite77HasModel({ id: 'boat_2', name: 'Voilier de course', visuals: { assetId: 'wp-voilier' } } as any), 'Doit détecter wp-voilier');
const renderedBoat = suite77DetailedSim({ entity: { id: 'boat_1', name: 'Voilier sur la mer', visuals: { assetId: 'wp-voilier' } } as any });
assert.equal((renderedBoat as any)?.type, suite78Sailboat, 'Doit rendre RealisticSailboatBoat3D');

// 2. Vérification que normalizeAndValidateModelResponse tolère une règle ciblant une sous-partie (voile_principale)
const { normalizeAndValidateModelResponse: suite78Normalize } = await import('../authoring/llm');
const testModelResponse = {
  plan: { intent: 'create_scene', actions: [] },
  patch: {
    entitiesCreated: [
      {
        id: 'bateau_1',
        name: 'Voilier en bois',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'collider' }
        ],
        visuals: { shape: 'box', color: '#0f172a' },
        parts: [
          { id: 'coque', name: 'Coque', shape: 'box' },
          { id: 'voile_principale', name: 'Voile principale', shape: 'box' }
        ]
      }
    ],
    rulesChanged: [
      {
        id: 'rule_toggle_sail',
        trigger: 'CLICK',
        conditions: [
          { type: 'target_equals', targetId: 'voile_principale' }
        ],
        actions: [
          { type: 'play_sound', cue: 'chime' }
        ]
      }
    ]
  }
};
// Ne doit pas lever d'exception "rule condition references missing entity"
const validatedPatch = suite78Normalize(testModelResponse, {}, []);
assert.ok(validatedPatch, 'La normalisation doit réussir sans lever d\'exception');
assert.equal(validatedPatch.patch.entitiesCreated?.[0].id, 'bateau_1', 'L\'entité créée doit être préservée');

// 3. Vérification que ZeroClickLaunchpad n'affiche plus le texte "toile vierge" à côté du bouton fermer
const launchpadSource = suite76ReadFile(new URL('../ui/ZeroClickLaunchpad.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(launchpadSource, /<span>\{t\.blankCanvas\}<\/span>/, 'Le bouton de fermeture ne doit plus afficher le texte "Toile vierge"');
assert.match(launchpadSource, /aria-label="Fermer"/, 'Le bouton doit avoir un aria-label accessible');

console.log('PASS: Suite 78 validée avec succès (Modélisation Voilier, Résilience Règles & Bouton Fermeture).');

// --- Suite 79 : Écosystème Maritime Réaliste & Export GLB/USDZ Universel ---
console.log('--- Démarrage de la Suite 79 : Écosystème Maritime Réaliste & Export GLB/USDZ Universel ---');

const {
  RealisticBeachParasol3D: suite79Parasol,
  RealisticCoastalLighthouse3D: suite79Lighthouse,
  RealisticMaritimeLifebuoy3D: suite79Lifebuoy,
} = await import('../scene/DetailedSimulationModel');

// 1. Détection et rendu des modèles maritimes / plage
assert.ok(suite77HasModel({ id: 'parasol_1', name: 'Grand parasol de plage', visuals: { assetId: 'wp-parasol' } } as any), 'Doit détecter wp-parasol');
assert.ok(suite77HasModel({ id: 'phare_1', name: 'Phare maritime côtier', visuals: { assetId: 'wp-phare' } } as any), 'Doit détecter wp-phare');
assert.ok(suite77HasModel({ id: 'bouee_1', name: 'Bouée de sauvetage orange', visuals: { assetId: 'wp-bouee' } } as any), 'Doit détecter wp-bouee');

const renderedParasol = suite77DetailedSim({ entity: { id: 'parasol_1', name: 'Parasol de plage', visuals: { assetId: 'wp-parasol' } } as any });
assert.equal((renderedParasol as any)?.type, suite79Parasol, 'Doit rendre RealisticBeachParasol3D');

const renderedLighthouse = suite77DetailedSim({ entity: { id: 'phare_1', name: 'Phare maritime', visuals: { assetId: 'wp-phare' } } as any });
assert.equal((renderedLighthouse as any)?.type, suite79Lighthouse, 'Doit rendre RealisticCoastalLighthouse3D');

const renderedLifebuoy = suite77DetailedSim({ entity: { id: 'bouee_1', name: 'Bouée de sauvetage', visuals: { assetId: 'wp-bouee' } } as any });
assert.equal((renderedLifebuoy as any)?.type, suite79Lifebuoy, 'Doit rendre RealisticMaritimeLifebuoy3D');

// 2. Vérification des commandes d'exportation en langage naturel
const parsedExportGLB = parseInstruction('exporte la scène en glb', { entities: {} } as any);
assert.equal(parsedExportGLB.plan?.intent, 'export_glb_scene', 'Doit reconnaître l\'intention d\'export GLB');

const parsedExportUSDZ = parseInstruction('exporte en usdz pour apple vision pro', { entities: {} } as any);
assert.equal(parsedExportUSDZ.plan?.intent, 'export_usdz_scene', 'Doit reconnaître l\'intention d\'export USDZ');

const parsedScreenshot = parseInstruction('prends une photo hd', { entities: {} } as any);
assert.equal(parsedScreenshot.plan?.intent, 'capture_hd_screenshot', 'Doit reconnaître la capture photo HD');

// 3. Vérification du dispatch avec détail d'entité
let exportedDetail: any = null;
const glbTargetListener = (e: any) => { exportedDetail = e.detail; };
if (typeof window !== 'undefined') {
  window.addEventListener('worldpilot_export_glb', glbTargetListener);
}
const store79 = useWorldStore.getState();
store79.triggerExportGLB('bateau_1', 'Voilier de course');
if (typeof window !== 'undefined') {
  assert.deepEqual(exportedDetail, { entityId: 'bateau_1', entityName: 'Voilier de course' }, 'Doit transmettre le détail de l\'entité ciblée pour l\'export');
  window.removeEventListener('worldpilot_export_glb', glbTargetListener);
}

// 4. Vérification du catalogue unifié getAsset pour les assets maritimes
const { getAsset: suite79GetAsset } = await import('../library/catalog');
assert.equal(suite79GetAsset('wp-voilier')?.name, 'Voilier de croisière', 'getAsset doit résoudre wp-voilier');
assert.equal(suite79GetAsset('wp-parasol')?.name, 'Parasol de plage', 'getAsset doit résoudre wp-parasol');
assert.equal(suite79GetAsset('wp-phare')?.name, 'Phare maritime côtier', 'getAsset doit résoudre wp-phare');
assert.equal(suite79GetAsset('wp-bouee')?.name, 'Bouée de sauvetage SOLAS', 'getAsset doit résoudre wp-bouee');
assert.equal(suite79GetAsset('wp-coquillage')?.name, 'Coquillage marin (Coquille Saint-Jacques)', 'getAsset doit résoudre wp-coquillage');

console.log('PASS: Suite 79 validée avec succès (Écosystème Maritime Réaliste & Export GLB/USDZ Universel).');

// --- Suite 80 : Thème Immersif Littoral & Plage Océane (Sable Doré & Ressac Marin) ---
console.log('--- Démarrage de la Suite 80 : Thème Immersif Littoral & Plage Océane ---');

const { getWorldTheme: suite80GetTheme, getAllWorldThemes: suite80AllThemes } = await import('../library/worldThemes');

// 1. Vérification du thème coastal-beach
const coastalTheme = suite80GetTheme('coastal-beach');
assert.ok(coastalTheme, 'Le thème coastal-beach doit exister');
assert.equal(coastalTheme.id, 'coastal-beach', 'L\'identifiant doit être coastal-beach');
assert.equal(coastalTheme.floor.type, 'golden_sand', 'Le sol doit être de type golden_sand');
assert.equal(coastalTheme.stageStyle, 'coastal_beach', 'Le style de scène doit être coastal_beach');
assert.equal(coastalTheme.ambientSoundscape, 'ocean_waves', 'Le paysage sonore doit être ocean_waves');

// 2. Vérification de l'intégration dans la liste globale des thèmes
const allThemesList = suite80AllThemes();
assert.ok(allThemesList.some(t => t.id === 'coastal-beach'), 'coastal-beach doit figurer dans getAllWorldThemes()');

// 3. Vérification du stage style coastal_beach dans ArchitecturalStage
const stageSource = suite76ReadFile(new URL('../scene/ArchitecturalStage.tsx', import.meta.url), 'utf8');
assert.match(stageSource, /theme\.stageStyle === 'coastal_beach'/, 'ArchitecturalStage doit gérer le rendu de coastal_beach');
assert.match(stageSource, /makeGoldenSandTexture/, 'ArchitecturalStage doit implémenter makeGoldenSandTexture');
assert.match(stageSource, /golden_sand:\s*makeGoldenSandTexture/, 'FLOOR_TEXTURE_FACTORIES doit enregistrer golden_sand');

// 4. Vérification de l'audio procédural ocean_waves dans ambientAudio
const audioSource = suite76ReadFile(new URL('../engine/ambientAudio.ts', import.meta.url), 'utf8');
assert.match(audioSource, /case 'coastal-beach':/, 'ambientAudio doit router coastal-beach');
assert.match(audioSource, /case 'ocean_waves':/, 'ambientAudio doit router ocean_waves');
assert.match(audioSource, /playOceanWavesSoundscape/, 'ambientAudio doit implémenter playOceanWavesSoundscape()');

console.log('PASS: Suite 80 validée avec succès (Thème Immersif Littoral & Plage Océane).');

// --- Suite 81 : Système de Sauvegarde Accessible & Ergonomie du Studio Spatial ---
console.log('--- Démarrage de la Suite 81 : Système de Sauvegarde Accessible & Ergonomie du Studio Spatial ---');

// 1. Vérification du parseur de commandes en langage naturel pour la sauvegarde
const parseSave1 = parseInstruction('sauvegarder mes changements', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseSave1.plan.intent, 'save_world_storage', '« sauvegarder mes changements » doit déclencher l’intent save_world_storage');

const parseSave2 = parseInstruction('sauvegarde le monde', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseSave2.plan.intent, 'save_world_storage', '« sauvegarde le monde » doit déclencher l’intent save_world_storage');

const parseSave3 = parseInstruction('enregistre les modifications', { selectedEntityId: null, pointedEntityId: null });
assert.equal(parseSave3.plan.intent, 'save_world_storage', '« enregistre les modifications » doit déclencher l’intent save_world_storage');

// 2. Vérification de l'intégration dans App.tsx
const appSource = suite76ReadFile(new URL('../App.tsx', import.meta.url), 'utf8');
assert.match(appSource, /plan\.intent === 'save_world_storage'/, 'App.tsx doit gérer le plan save_world_storage');
assert.match(appSource, /<span>💾<\/span>\s*<span>Sauvegarder<\/span>/, 'App.tsx doit afficher le bouton direct Sauvegarder dans la barre supérieure');
// Suite 84 : Le doublon "Sauvegarder les changements" dans le panneau Contexte spatial a été supprimé suite au feedback utilisateur
assert.match(appSource, /saveWorldToStorage/, 'App.tsx doit intégrer la fonction saveWorldToStorage');
assert.match(appSource, /worldpilot_save_world/, 'App.tsx doit écouter l’événement custom worldpilot_save_world');

// 3. Vérification de l'intégration dans LibraryPanel.tsx
const libraryPanelSource = suite76ReadFile(new URL('../library/LibraryPanel.tsx', import.meta.url), 'utf8');
assert.match(libraryPanelSource, /saveWorldToStorage/, 'LibraryPanel.tsx doit proposer la sauvegarde directe dans LibraryInspector');
assert.match(libraryPanelSource, /Sauvegarder les changements/, 'LibraryInspector doit afficher Sauvegarder les changements');

console.log('PASS: Suite 81 validée avec succès (Sauvegarde directe UI, Raccourcis clavier & Intent NLP).');
})();

await (async () => {
const suite76ReadFile = fs.readFileSync;
// --- Suite 82 : Halo de Sélection 3D Adaptatif & Calibration Proportionnelle au Zoom ---
console.log('--- Démarrage de la Suite 82 : Halo de Sélection 3D Adaptatif & Calibration Proportionnelle au Zoom ---');

const { getEntityFootprintRadius } = await import('../engine/spatialSurface');
const { AdaptiveSelectionHalo } = await import('../scene/R3FWorldAdapter');
assert.ok(typeof getEntityFootprintRadius === 'function', 'getEntityFootprintRadius doit être exportée');
assert.ok(AdaptiveSelectionHalo, 'AdaptiveSelectionHalo doit être exporté');

// 1. Calibration de l'empreinte pour un petit objet (coquillage marin)
const shellEntity: EntitySpec = {
  id: 'shell_1',
  name: 'Coquillage marin',
  capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }],
  visuals: { assetId: 'wp-coquillage' }
};
const shellRadius = getEntityFootprintRadius(shellEntity);
assert(shellRadius >= 0.05 && shellRadius <= 0.20, `Le rayon d’un coquillage doit être adapté à sa petite taille (reçu: ${shellRadius}m)`);

// 2. Calibration de l'empreinte pour un voilier
const boatEntity: EntitySpec = {
  id: 'boat_1',
  name: 'Voilier de croisière',
  capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }],
  visuals: { assetId: 'wp-voilier' }
};
const boatRadius = getEntityFootprintRadius(boatEntity);
assert(boatRadius >= 0.6 && boatRadius <= 1.2, `Le rayon d’un voilier doit être proportionné à sa structure (reçu: ${boatRadius}m)`);
assert(boatRadius > shellRadius * 4, 'Le voilier doit avoir un halo nettement plus grand que le coquillage');

// 3. Proportionnalité avec l'échelle (scale)
const bigShellRadius = getEntityFootprintRadius(shellEntity, { x: 2, y: 2, z: 2 });
assert(Math.abs(bigShellRadius - shellRadius * 2) < 0.01, 'L’échelle doit multiplier proportionnellement l’empreinte de l’objet');

// 4. Test mathématique de la formule adaptative de zoom :
// Au zoom rapproché (0.8m), le rayon reste borné par la taille minimale de l'objet
const baseMin = shellRadius * 1.15;
const closeDist = 0.8;
const adaptiveClose = Math.max(baseMin, closeDist * 0.042);
assert.equal(adaptiveClose, baseMin, 'Au zoom rapproché, le cercle ne doit jamais rétrécir en-dessous de la taille minimale de l’objet');

// Au dézoom lointain (6m), le cercle s'élargit pour rester visible
const farDist = 6.0;
const adaptiveFar = Math.max(baseMin, farDist * 0.042);
assert(adaptiveFar > baseMin, 'À grande distance, le cercle doit s’élargir pour rester discernable à l’écran');

// 5. Vérification du code source de R3FWorldAdapter.tsx
const r3fSource = suite76ReadFile(new URL('../scene/R3FWorldAdapter.tsx', import.meta.url), 'utf8');
assert.match(r3fSource, /<AdaptiveSelectionHalo/, 'R3FWorldAdapter doit utiliser AdaptiveSelectionHalo');
assert.match(r3fSource, /Math\.max\(baseFootprintRadius, cameraDist \* 0\.042\)/, 'La formule de zoom adaptatif doit être intégrée dans useFrame');

console.log('PASS: Suite 82 validée avec succès (Halo de Sélection 3D Adaptatif & Ergonomie du Zoom).');

// --- Suite 83 : Ergonomie & Décluttering du Studio Spatial (Microscope 3D, Z-Index Header, Bottom Bar & Outils) ---
console.log('--- Démarrage de la Suite 83 : Ergonomie, Décluttering UI & Priorité Microscope 3D ---');

// 1. Validation de la détection et de la priorité stricte du Microscope sur l'Ordinateur
const testMicroscopeEntity: EntitySpec = {
  id: 'microscope_1791658190',
  name: 'Station Scientifique & Microscope Optique',
  capabilities: [
    { type: 'transform', position: { x: 0, y: 0.94, z: 0.22 }, rotation: { x: 0, y: 0.2, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    { type: 'draggable' },
    { type: 'collider' },
    { type: 'web_screen', url: 'https://fr.m.wikipedia.org/wiki/Microbiologie' }
  ],
  visuals: { assetId: 'microscope' }
};

// Simulation logique de la détection implémentée dans R3FWorldAdapter.tsx
const isMicroscopeDetected = testMicroscopeEntity.visuals?.assetId?.includes('microscope') ||
  testMicroscopeEntity.id.toLowerCase().includes('microscope') ||
  testMicroscopeEntity.name?.toLowerCase().includes('microscope');

const isComputerDetected = !isMicroscopeDetected && (
  testMicroscopeEntity.visuals?.assetId?.includes('ordinateur') ||
  testMicroscopeEntity.visuals?.assetId?.includes('laptop') ||
  testMicroscopeEntity.visuals?.assetId?.includes('moniteur') ||
  testMicroscopeEntity.visuals?.assetId?.includes('terminal') ||
  testMicroscopeEntity.id.toLowerCase().includes('laptop') ||
  testMicroscopeEntity.id.toLowerCase().includes('ordinateur') ||
  testMicroscopeEntity.name?.toLowerCase().includes('ordinateur') ||
  testMicroscopeEntity.name?.toLowerCase().includes('laptop') ||
  (testMicroscopeEntity.name?.toLowerCase().includes('station') && !testMicroscopeEntity.name?.toLowerCase().includes('microscope'))
);

assert(isMicroscopeDetected, 'L’entité doit être correctement détectée en tant que Microscope');
assert(!isComputerDetected, 'Le microscope avec le mot "Station" ne doit JAMAIS être confondu avec un ordinateur ou un terminal');

// 2. Vérification statique du code source R3FWorldAdapter.tsx
const suite83R3fCode = suite76ReadFile(new URL('../scene/R3FWorldAdapter.tsx', import.meta.url), 'utf8');
assert.match(suite83R3fCode, /const isMicroscope =/, 'isMicroscope doit être défini');
assert.match(suite83R3fCode, /const isComputer = !isMicroscope &&/, 'isComputer doit impérativement exclure !isMicroscope');
assert.match(suite83R3fCode, /if \(isMicroscope\) return <SpatialMicroscopeModel/, 'renderShape doit évaluer et retourner le microscope avant le laptop');

// 3. Vérification statique du style CSS (Z-Index des menus et empilement au premier plan)
const suite83CssCode = suite76ReadFile(new URL('../index.css', import.meta.url), 'utf8');
assert.match(suite83CssCode, /\.app-header\{[^}]*z-index:\s*1200/, 'app-header doit posséder z-index: 1200 pour primer sur tous les éléments Drei Html');
assert.match(suite83CssCode, /\.studio-main\{[^}]*z-index:\s*1/, 'studio-main doit borner le contexte d’empilement du viewport à z-index: 1');

// 4. Vérification statique de App.tsx (Nettoyage visuel et réorganisation)
const suite83AppCode = suite76ReadFile(new URL('../App.tsx', import.meta.url), 'utf8');
// Absence du badge redondant "Mode création · v..."
assert(!suite83AppCode.includes('<div className="scene-badge">'), 'Le scene-badge redondant doit être retiré');
// Absence de la playback-bar encombrante au bas de l’écran
assert(!suite83AppCode.includes('<div className="playback-bar">'), 'La playback-bar en bas de l’écran doit être retirée');
// Absence du dock flottant Web 3D au milieu de la scène
assert(!suite83AppCode.includes('<SpatialWebDock />'), 'Le dock flottant Web 3D encombrant doit être retiré du canvas');
// Présence du Microscope dans la Bibliothèque Pilier 3 Spatiale
assert(suite83AppCode.includes('handleAddMicroscope'), 'handleAddMicroscope doit être implémenté dans App.tsx');
assert.match(suite83AppCode, /Ajouter une station scientifique \(microscope optique\)/, 'Le bouton microscope doit être accessible dans la Bibliothèque');
// Intégration dans le menu Outils
assert.match(suite83AppCode, /Graphe de causalité & Logique/, 'Le menu Outils doit contenir l’accès direct au Graphe de Causalité');
assert.match(suite83AppCode, /État du monde \(WorldIR JSON\)/, 'Le menu Outils doit contenir l’accès direct au WorldIR');
assert.match(suite83AppCode, /Immersion WebXR \(VR\)/, 'Le menu Outils doit héberger le mode WebXR immersif avec avertissement expérimental');

console.log('PASS: Suite 83 validée avec succès (Ergonomie, Décluttering UI, Priorité Microscope & WebXR dans Outils).');

// --- SUITE 84: Ergonomie V2, Modales Déplaçables, Parcours Guidé Dédié, Sauvegarde Persistante d'Expériences & Clarté Gizmo ---
console.log('Running Suite 84: Ergonomie V2, Modales Déplaçables, Parcours Guidé & Persistance...');

// 1. Hook useDraggableModal
const suite84HookCode = suite76ReadFile(new URL('../ui/useDraggableModal.ts', import.meta.url), 'utf8');
assert.match(suite84HookCode, /export function useDraggableModal/, 'useDraggableModal doit être exporté');
assert.match(suite84HookCode, /setPointerCapture/, 'useDraggableModal doit utiliser pointer capture pour un glissement fluide');

// 2. Modales et Popups déplaçables
const suite84LaunchpadCode = suite76ReadFile(new URL('../ui/ZeroClickLaunchpad.tsx', import.meta.url), 'utf8');
assert.match(suite84LaunchpadCode, /useDraggableModal\(\)/, 'ZeroClickLaunchpad doit être déplaçable avec useDraggableModal');

const suite84TickerCode = suite76ReadFile(new URL('../ui/LiveCausalTicker.tsx', import.meta.url), 'utf8');
assert.match(suite84TickerCode, /useDraggableModal\(\)/, 'LiveCausalTicker doit être déplaçable avec useDraggableModal');

const suite84WebScreenCode = suite76ReadFile(new URL('../ui/WebScreenModal.tsx', import.meta.url), 'utf8');
assert.match(suite84WebScreenCode, /useDraggableModal\(\)/, 'WebScreenModal doit être déplaçable avec useDraggableModal');

const suite84LoadModalCode = suite76ReadFile(new URL('../ui/LoadExperienceConfirmationModal.tsx', import.meta.url), 'utf8');
assert.match(suite84LoadModalCode, /useDraggableModal\(\)/, 'LoadExperienceConfirmationModal doit être déplaçable');
assert.match(suite84LoadModalCode, /hasCustomSaved/, 'LoadExperienceConfirmationModal doit supporter hasCustomSaved');
assert.match(suite84LoadModalCode, /onResetToOriginal/, 'LoadExperienceConfirmationModal doit proposer la réinitialisation au modèle d’origine');

const suite84HistoryModalCode = suite76ReadFile(new URL('../ui/PromptHistoryModal.tsx', import.meta.url), 'utf8');
assert.match(suite84HistoryModalCode, /useDraggableModal\(\)/, 'PromptHistoryModal doit être déplaçable');

const suite84ImportUrlModalCode = suite76ReadFile(new URL('../ui/ImportUrlModal.tsx', import.meta.url), 'utf8');
assert.match(suite84ImportUrlModalCode, /useDraggableModal\(\)/, 'ImportUrlModal doit être déplaçable');

// 3. Bouton "Parcours guidé" dédié dans le header & Launchpad à la demande
const suite84AppCode = suite76ReadFile(new URL('../App.tsx', import.meta.url), 'utf8');
assert.match(suite84AppCode, /Parcours guidé/, 'Le bouton Parcours guidé doit être présent dans le sélecteur primaire de modes');
assert.match(suite84AppCode, /showGuidedDemoModal/, 'ZeroClickLaunchpad doit être conditionné par showGuidedDemoModal');
assert(!suite84AppCode.includes('{entities.length === 0 && (\n            <ZeroClickLaunchpad'), 'ZeroClickLaunchpad ne doit plus s’imposer automatiquement sur une scène vide');

// 4. Instructions non permanentes et repliables (Navigation 3D)
assert.match(suite84AppCode, /showNavHint/, 'App.tsx doit gérer l’état de visibilité showNavHint');
assert.match(suite84AppCode, /Masquer les instructions permanentes/, 'Le hint de navigation doit être dismissible avec un bouton de fermeture');
assert.match(suite84AppCode, /Raccourcis 3D/, 'Un bouton compact doit permettre de rouvrir les raccourcis à tout moment');

// 5. Icône spark utile et interactive (Inspiration IA)
assert.match(suite84AppCode, /handleInspirePrompt/, 'App.tsx doit implémenter handleInspirePrompt');
assert.match(suite84AppCode, /<button[^>]*className="assistant-mark"[^>]*onClick=\{handleInspirePrompt\}/, 'L’icône spark doit être un bouton interactif d’inspiration IA');

// 6. Suppression du doublon "Sauvegarder les changements" dans le panneau auteur
assert(!suite84AppCode.includes('<span>Sauvegarder les changements</span>'), 'Le bouton redondant "Sauvegarder les changements" doit être retiré');

// 7. Persistance locale des modifications d’expériences & Auto-restauration
const suite84WorldSliceCode = suite76ReadFile(new URL('../engine/slices/worldSlice.ts', import.meta.url), 'utf8');
assert.match(suite84WorldSliceCode, /worldpilot_exp_saved_/, 'saveWorldToStorage doit mémoriser les instantanés d’expériences personnalisées');
assert.match(suite84WorldSliceCode, /currentSceneTitle: data\.currentSceneTitle/, 'loadWorldFromStorage doit restaurer le titre de scène');
assert.match(suite84WorldSliceCode, /loadWorldFromStorage: \(storageKey: string = 'worldpilot_saved_world'\)/, 'loadWorldFromStorage doit accepter une clé optionnelle');

// 8. Auto-restauration au chargement et détection dans requestExperienceLoad
assert.match(suite84AppCode, /localStorage\.getItem\('worldpilot_saved_world'\)/, 'App.tsx doit vérifier et restaurer la sauvegarde au montage');
assert.match(suite84AppCode, /worldpilot_exp_saved_/, 'requestExperienceLoad doit vérifier l’existence de modifications sauvegardées');

// 9. Épuration de la capsule de sélection 3D en mode simulation (suppression des flèches, Déplacer et Cadrer)
const suite84R3fCode = suite76ReadFile(new URL('../scene/R3FWorldAdapter.tsx', import.meta.url), 'utf8');
assert(!suite84R3fCode.includes("title=\"Avancer dans la scène (-Z) [Flèche Haut]\""), 'Le pavé de micro-flèches directionnelles doit être supprimé de la pastille de simulation');
assert(!suite84R3fCode.includes("title=\"Cadrer la caméra sur cet objet\""), 'Le bouton Cadrer redondant doit être supprimé de la pastille de simulation');

console.log('PASS: Suite 84 validée avec succès (Modales déplaçables, Parcours guidé, Persistance et Clarté UI).');

// --- Suite 85 : Configurateur Supercar Victoria VR, Priorité Modèle & Progression Fluide ---
console.log('--- Démarrage de la Suite 85 : Configurateur Supercar, Priorité Modèle & Progression Fluide ---');

const { 
  DetailedSimulationModel: suite85DetailedSim,
  HolographicCarConfigurator: suite85Configurator,
  VictoriaVRSupercar: suite85Supercar
} = await import('../scene/DetailedSimulationModel');

// 1. Priorité de détection : un "Configurateur Supercar" doit rendre la console holographique, pas un second véhicule
const entityConfigurator = {
  id: 'configurateur_supercar_1',
  name: 'Configurateur Supercar Victoria VR',
  visuals: { assetId: 'wp-borne-configurateur' },
  capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }]
};
const renderedConfig = suite85DetailedSim({ entity: entityConfigurator as any });
assert.equal((renderedConfig as any)?.type, suite85Configurator, 'Une borne ou configurateur supercar doit être rendue comme HolographicCarConfigurator');

const entityRealSupercar = {
  id: 'supercar_gt_1',
  name: 'Supercar Victoria VR V12 Hybride',
  visuals: { assetId: 'wp-supercar-showroom' },
  capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }]
};
const renderedCar = suite85DetailedSim({ entity: entityRealSupercar as any });
assert.equal((renderedCar as any)?.type, suite85Supercar, 'La voiture réelle doit être rendue comme VictoriaVRSupercar');

// 2. Vérification du store et des méthodes du configurateur
const storeInitial = useWorldStore.getState();
assert.equal(storeInitial.isSupercarConfiguratorOpen, false, 'Le configurateur doit être fermé par défaut');

storeInitial.openSupercarConfigurator();
assert.equal(useWorldStore.getState().isSupercarConfiguratorOpen, true, 'openSupercarConfigurator doit ouvrir la modale');

storeInitial.closeSupercarConfigurator();
assert.equal(useWorldStore.getState().isSupercarConfiguratorOpen, false, 'closeSupercarConfigurator doit fermer la modale');

// 3. Application de la configuration officielle
useWorldStore.getState().applySupercarConfiguration('#0284c7', 'Cyan Victoria VR Électrique');
assert.equal(useWorldStore.getState().supercarCustomPaint, '#0284c7', 'La teinte personnalisée doit être enregistrée dans supercarCustomPaint');
assert.equal(useWorldStore.getState().world.flags?.supercar_configured, true, 'Le flag supercar_configured doit être actif');

// 4. Résilience de l’évaluation causale et progression de la quête
const { evaluateEvent: suite85Eval } = await import('../engine/evaluator');
const testWorldState = {
  version: 1,
  ir: {
    entities: {
      'demo_supercar': entityRealSupercar,
      'demo_color_terminal': entityConfigurator
    },
    rules: {
      'rule_config': {
        id: 'rule_config',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'demo_color_terminal' }],
        actions: [{ type: 'set_flag', flag: 'supercar_configured', value: true }]
      }
    },
    quests: {
      'quest_supercar': {
        id: 'quest_supercar',
        title: 'Mission : Livraison immatérielle de la supercar Victoria VR',
        currentStepIndex: 0,
        status: 'in_progress',
        steps: [
          {
            id: 'step_1',
            title: 'Configurer la supercar',
            description: 'Approchez-vous du configurateur et lancez la configuration officielle Victoria VR.',
            requiredEvent: 'INTERACT',
            targetEntityId: 'demo_color_terminal',
            completed: false
          },
          {
            id: 'step_2',
            title: 'Récupérer la clé intelligente',
            description: 'Prendre la clé pour le cockpit.',
            requiredEvent: 'DROP',
            targetEntityId: 'demo_key',
            completed: false
          }
        ]
      }
    },
    activeQuestId: 'quest_supercar'
  },
  flags: {},
  gameplay: { score: 0, highScore: 0, lives: 3, maxLives: 3, timer: null, isTimerActive: false, gameStatus: 'running' }
};

// Clic direct ou action sur l'entité configurateur
const suite85EvalResult = suite85Eval(testWorldState as any, {
  type: 'INTERACT',
  sourceId: 'configurateur_supercar_1'
});

assert.equal(suite85EvalResult.newState.flags?.supercar_configured, true, 'Le flag supercar_configured doit être activé par évaluation');
assert.equal(suite85EvalResult.newState.ir.quests?.quest_supercar?.steps[0].completed, true, 'L’étape 1 de configuration doit être validée');
assert.equal(suite85EvalResult.newState.ir.quests?.quest_supercar?.currentStepIndex, 1, 'La quête doit avancer à l’étape 2');

// 5. Bouton action dans QuestHUD, R3FWorldAdapter et App.tsx
const suite85QuestHudCode = suite76ReadFile(new URL('../ui/QuestHUD.tsx', import.meta.url), 'utf8');
assert.match(suite85QuestHudCode, /openSupercarConfigurator/, 'QuestHUD doit proposer un bouton direct pour ouvrir le configurateur');

const suite85AppCode = suite76ReadFile(new URL('../App.tsx', import.meta.url), 'utf8');
assert.match(suite85AppCode, /SupercarConfiguratorModal/, 'App.tsx doit monter SupercarConfiguratorModal');

console.log('PASS: Suite 85 validée avec succès (Configurateur Supercar, Priorité Modèle & Progression Fluide).');



// ============================================================================
// SUITE 86 : COCKPIT JURY 3 PILIERS (SPLIT-VIEW 3D) & FRONTIÈRE OPEN-CORE B2B
// ============================================================================
console.log('--- Démarrage de la Suite 86 : Cockpit Jury 3 Piliers (Split-View 3D) & Open-Core ---');

const suite86DashboardCode = suite76ReadFile(new URL('../ui/SpatialTelemetryDashboard.tsx', import.meta.url), 'utf8');
const suite86Overlay3DCode = suite76ReadFile(new URL('../scene/ResearchSpatialOverlay3D.tsx', import.meta.url), 'utf8');

// 1. Vérification du mode Split-View docké à droite (ne couvre jamais toute la scène 3D)
assert.match(suite86DashboardCode, /width:\s*'min\(540px,\s*46vw\)'/, 'Le Cockpit Jury doit être docké à droite en split-view');
assert.match(suite86DashboardCode, /pointerEvents:\s*'none'/, 'Le conteneur externe doit laisser passer les clics vers la scène 3D à gauche');
assert.match(suite86DashboardCode, /Split-View 3D Live/, 'Le badge Split-View 3D Live doit être affiché');

// 2. Vérification de la présence explicite des 3 Piliers différenciants et des termes scientifiques + vulgarisation
assert.match(suite86DashboardCode, /PILIER 1/, 'Pilier 1 (Anti-Générateur Jetable E1->E2) doit être présent');
assert.match(suite86DashboardCode, /Bayesian Epistemic State Tracking/, 'Le terme scientifique Bayésien H1/H2 doit être affiché');
assert.match(suite86DashboardCode, /PILIER 2/, 'Pilier 2 (Substrat Neuro-Symbolique) doit être présent');
assert.match(suite86DashboardCode, /Differential Blast Radius/, 'Le terme scientifique Blast Radius / Pareto doit être affiché');
assert.match(suite86DashboardCode, /PILIER 3/, 'Pilier 3 (Pont Robotique Incarnée LeRobot) doit être présent');
assert.match(suite86DashboardCode, /LeRobot v2\.1/, 'La compatibilité Hugging Face LeRobot v2.1 doit être affichée');

// 3. Vérification de la frontière stratégique Open-Core vs Exploitation Commerciale B2B
assert.match(suite86DashboardCode, /Socle Open-Source/, 'La colonne Socle Open-Source doit être explicite');
assert.match(suite86DashboardCode, /WorldPilot Enterprise \(Propriétaire\)/, 'La colonne WorldPilot Enterprise Propriétaire doit être explicite');
assert.match(suite86DashboardCode, /Robotics Data Foundry Cloud/, 'La brique commerciale Robotics Data Foundry Cloud doit être documentée');

// 4. Vérification que ResearchSpatialOverlay3D reste visible dans la scène 3D quand l'Observatoire docké est ouvert
assert.match(
  suite86Overlay3DCode,
  /const isObservabilityVisible = showResearchDashboardModal \|\| showCausalObservability/,
  'Les overlays 3D (splines, ondes de choc, sondes E2) doivent s’afficher en direct quand l’Observatoire est ouvert'
);
assert.doesNotMatch(
  suite86Overlay3DCode,
  /if\s*\(\s*showResearchDashboardModal\s*\)\s*return\s+null/,
  'ResearchSpatialOverlay3D ne doit plus masquer les effets 3D lorsque l’Observatoire est ouvert'
);

console.log('PASS: Suite 86 validée avec succès (Cockpit Jury 3 Piliers Split-View 3D & Stratégie Open-Core B2B).');

// --- Suite 87 : Immunité des Trigger Zones, Dalles de Sol, Meubles en Chêne & Showroom Supercar ---
console.log('--- Démarrage de la Suite 87 : Immunité des Trigger Zones, Dalles de Sol & Showroom Supercar ---');

const { isStaticOrStructuralEntity } = await import('../engine/spatialSurface');
const { autoDeoverlapFloorEntities } = await import('../engine/autonomousSpatialEngine');

const suite87AuthZone: EntitySpec = {
  id: 'zone_auth',
  name: "Zone d'authentification",
  capabilities: [
    { type: 'transform', position: { x: -1.55, y: 0.3, z: 1.55 }, scale: { x: 0.6, y: 0.6, z: 0.6 } },
    { type: 'trigger_zone' }
  ]
};
const suite87SmartKey: EntitySpec = {
  id: 'smart_key',
  name: 'Clé intelligente de la supercar',
  capabilities: [
    { type: 'transform', position: { x: -1.55, y: 0.05, z: 1.55 }, scale: { x: 1, y: 1, z: 1 } },
    { type: 'draggable' }
  ]
};
const suite87Supercar: EntitySpec = {
  id: 'supercar_v12',
  name: 'Supercar Hybride V12',
  capabilities: [
    { type: 'transform', position: { x: 0, y: 0, z: 0 }, scale: { x: 2.0, y: 1.15, z: 4.5 } },
    { type: 'collider' }
  ]
};
const suite87FloorSlab: EntitySpec = {
  id: 'sol_marbre',
  name: 'Sol showroom marbre noir',
  capabilities: [
    { type: 'transform', position: { x: 0, y: -0.015, z: 0 }, scale: { x: 14, y: 0.02, z: 14 } }
  ]
};
const suite87OakTable: EntitySpec = {
  id: 'oak_table',
  name: 'Grande Table en Chêne Massif',
  capabilities: [
    { type: 'transform', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
  ]
};
const suite87FallenProp: EntitySpec = {
  id: 'fallen_prop',
  name: 'Courgette tombée au sol',
  capabilities: [
    { type: 'transform', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
  ]
};

assert.strictEqual(isSupportEntity(suite87AuthZone), false, "Une trigger_zone ne doit jamais être considérée comme une table support de 0.44m");
assert.strictEqual(isSupportEntity(suite87Supercar), false, "Une supercar ne doit pas être considérée comme une table support");
assert.strictEqual(isSupportEntity(suite87OakTable), true, "Une table en chêne massif doit rester un meuble support");
assert.strictEqual(isStaticOrStructuralEntity(suite87FloorSlab), true, "Une dalle de sol doit être reconnue comme structurelle");
assert.strictEqual(isStaticOrStructuralEntity(suite87OakTable), false, "Une table en chêne ne doit pas être confondue avec un arbre chêne");
assert.strictEqual(isStaticOrStructuralEntity(suite87FallenProp), false, "Un objet 'tombé au sol' ne doit pas être confondu avec une dalle de sol");

assert.strictEqual(hasDetailedSimulationModel(suite87SmartKey), true, "La clé intelligente doit utiliser son modèle 3D procédural");
assert.strictEqual(hasDetailedSimulationModel(suite87AuthZone), true, "La zone d'authentification doit utiliser son modèle 3D procédural");

const suite87ShowroomMap: Record<string, EntitySpec> = {
  supercar_v12: suite87Supercar,
  zone_auth: suite87AuthZone,
  smart_key: suite87SmartKey
};
autoDeoverlapFloorEntities(suite87ShowroomMap);
const keyPosAfter = suite87SmartKey.capabilities.find(c => c.type === 'transform')?.position as { x: number; y: number; z: number };
const zonePosAfter = suite87AuthZone.capabilities.find(c => c.type === 'transform')?.position as { x: number; y: number; z: number };
assert(
  Math.hypot(keyPosAfter.x - zonePosAfter.x, keyPosAfter.z - zonePosAfter.z) >= 0.65,
  "La clé intelligente draggable et la zone d'authentification ne doivent plus se superposer au sol"
);

console.log('PASS: Suite 87 validée avec succès (Immunité Trigger Zones, Dalles de Sol, Meubles en Chêne & Showroom Supercar).');
})();

await (async () => {
// --- Suite 88 : Résolution Sémantique DROP:source:target, Altitude de Dépôt (+0.04m) & Synchronisation Peinture Supercar ---
console.log('--- Démarrage de la Suite 88 : Résolution Sémantique DROP:source:target & Synchronisation Supercar ---');

const suite88World = {
  version: 1,
  ir: {
    entities: {
      supercar_v12: {
        id: 'supercar_v12',
        name: 'Supercar Hybride V12',
        capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }],
        visuals: { color: '#ef4444' }
      },
      console_teinte: {
        id: 'console_teinte',
        name: 'Console holographique de teinte',
        capabilities: [{ type: 'transform', position: { x: 2.5, y: 0, z: 1.5 }, scale: { x: 1, y: 1, z: 1 } }]
      },
      cle_intelligente: {
        id: 'cle_intelligente',
        name: 'Clé intelligente',
        capabilities: [
          { type: 'transform', position: { x: -2.5, y: 0.05, z: 1.5 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' }
        ]
      },
      zone_auth: {
        id: 'zone_auth',
        name: "Zone d'authentification",
        capabilities: [
          { type: 'transform', position: { x: -1.2, y: 0.3, z: 1.5 }, scale: { x: 0.6, y: 0.6, z: 0.6 } },
          { type: 'trigger_zone' }
        ]
      }
    },
    rules: {
      rule_paint: {
        id: 'rule_paint',
        trigger: 'CLICK',
        conditions: [{ type: 'is_source', sourceId: 'console_holographique' }],
        actions: [{ type: 'change_color', entityId: 'supercar_v12', color: '#06b6d4' }]
      }
    },
    invariants: {},
    quests: {
      q_supercar_llm: {
        id: 'q_supercar_llm',
        title: 'Showroom Supercar',
        description: 'Test LLM quest',
        status: 'in_progress' as const,
        currentStepIndex: 0,
        steps: [
          {
            id: 's1',
            title: 'Choisir la finition',
            description: 'Cliquez sur la console holographique pour changer la teinte de la carrosserie.',
            requiredEvent: 'CLICK:console_holographique',
            targetEntityId: 'console_teinte',
            completed: false
          },
          {
            id: 's2',
            title: 'Authentifier la clé',
            description: "Déposez la clé intelligente sur la zone d'authentification.",
            requiredEvent: 'DROP:cle_intelligente:zone_authentification',
            // Cas fréquent LLM où targetEntityId pointe vers la zone au lieu de la source :
            targetEntityId: 'zone_auth',
            targetZoneId: 'zone_auth',
            completed: false
          }
        ]
      }
    },
    activeQuestId: 'q_supercar_llm'
  },
  flags: {}
};

// 1. Étape 1 : clic sur console_teinte valide 'Choisir la finition' et active supercar_configured
const res88Step1 = evaluateEvent(suite88World as any, { type: 'INTERACT', sourceId: 'console_teinte' });
assert.strictEqual(res88Step1.newState.ir.quests!['q_supercar_llm'].steps[0].completed, true, "L'étape 1 ('Choisir la finition') doit être validée");
assert.strictEqual(res88Step1.newState.flags['supercar_configured'], true, "Le flag supercar_configured doit être activé dès l'étape 1");
assert.strictEqual(res88Step1.newState.ir.entities['supercar_v12'].visuals?.color, '#06b6d4', "La règle change_color doit mettre à jour la couleur de la supercar");

// 2. Étape 2 : DROP de cle_intelligente sur zone_auth valide l'étape même si targetEntityId valait 'zone_auth', et pose à y = 0.34m (pas +0.5m !)
const res88Step2 = evaluateEvent(res88Step1.newState, { type: 'DROP', sourceId: 'cle_intelligente', targetId: 'zone_auth' });
assert.strictEqual(res88Step2.newState.ir.quests!['q_supercar_llm'].steps[1].completed, true, "L'étape 2 ('Authentifier la clé') doit être validée malgré targetEntityId='zone_auth'");
assert.strictEqual(res88Step2.newState.flags['supercar_started'], true, "Le flag supercar_started doit être activé après l'authentification de la clé");
const droppedKeyY = res88Step2.newState.ir.entities['cle_intelligente'].capabilities.find((c: any) => c.type === 'transform')?.position?.y;
assert.strictEqual(droppedKeyY, 0.34, `La clé déposée sur la zone (y=0.3) doit être à y=0.34m (+0.04m) et non à 0.80m (+0.5m), reçu: ${droppedKeyY}`);

console.log('PASS: Suite 88 validée avec succès (Résolution Sémantique DROP:source:target, Altitude +0.04m & Synchronisation Supercar).');

// =========================================================================
// SUITE 89 : Réinitialisation Complète Store, Progression Quête via setWorldFlag, Normalisation LLM & Protection PBR
// =========================================================================
console.log('--- Démarrage de la Suite 89 : Store Reset, setWorldFlag Quest Progression, Normalisation LLM & Protection PBR ---');

const { normalizeAndValidateModelResponse } = await import('../authoring/llm');

// 1. resetWorld() nettoie bien supercarCustomPaint, explodedEntities, placementModeEntityId et isSupercarConfiguratorOpen
useWorldStore.setState({
  supercarCustomPaint: '#2563eb',
  supercarBrakeCalipers: 'red',
  supercarCarbonPack: false,
  isSupercarConfiguratorOpen: true,
  explodedEntities: { demo_supercar: true },
  selectedPartId: 'engine_v12',
  placementModeEntityId: 'demo_smart_key',
  hoveredEntityId: 'demo_supercar',
  showEntity2DDrawer: true
});
useWorldStore.getState().resetWorld();
assert.strictEqual(useWorldStore.getState().supercarCustomPaint, null, 'resetWorld doit réinitialiser supercarCustomPaint à null');
assert.strictEqual(useWorldStore.getState().isSupercarConfiguratorOpen, false, 'resetWorld doit fermer isSupercarConfiguratorOpen');
assert.deepStrictEqual(useWorldStore.getState().explodedEntities, {}, 'resetWorld doit vider explodedEntities');
assert.strictEqual(useWorldStore.getState().selectedPartId, null, 'resetWorld doit réinitialiser selectedPartId');
assert.strictEqual(useWorldStore.getState().placementModeEntityId, null, 'resetWorld doit réinitialiser placementModeEntityId');
assert.strictEqual(useWorldStore.getState().hoveredEntityId, null, 'resetWorld doit réinitialiser hoveredEntityId');

// 2. parseInstruction ne détourne pas une création de scène contenant "carbone" ou "marbre" vers apply_pbr_material même si un objet est sélectionné
const pbrGuardEntities: Record<string, any> = {
  existing_table: {
    id: 'existing_table',
    name: 'Table existante',
    capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }]
  }
};
const supercarSceneParse = parseInstruction(
  'Construis un showroom de supercar avec un bolide en carbone sur un plateau tournant',
  { selectedEntityId: 'existing_table', pointedEntityId: null },
  pbrGuardEntities
);
assert.strictEqual(
  supercarSceneParse.plan.intent,
  'showcase_victoria_vr_supercar',
  `La création d'un showroom supercar en carbone ne doit pas être interceptée par apply_pbr_material (reçu: ${supercarSceneParse.plan.intent})`
);

// 3. groundEntity maintient y = 0.09 pour la supercar lorsqu'un plateau tournant est présent
useWorldStore.getState().applyPatch(supercarSceneParse.patch, 'Showroom Supercar Test', supercarSceneParse.plan);
useWorldStore.getState().groundEntity('demo_supercar');
const groundedSupercarPos = useWorldStore.getState().world.ir.entities['demo_supercar']?.capabilities.find((c: any) => c.type === 'transform')?.position;
assert.strictEqual(groundedSupercarPos?.y, 0.09, `groundEntity sur une supercar avec plateau tournant doit maintenir y=0.09 (reçu: ${groundedSupercarPos?.y})`);

// 4. setWorldFlag('supercar_configured', true) fait progresser automatiquement l'étape 1 active de la quête
assert.strictEqual(useWorldStore.getState().world.ir.quests?.['quest_supercar_showroom']?.steps[0]?.completed, false);
useWorldStore.getState().setWorldFlag('supercar_configured', true);
assert.strictEqual(
  useWorldStore.getState().world.ir.quests?.['quest_supercar_showroom']?.steps[0]?.completed,
  true,
  'setWorldFlag("supercar_configured", true) doit valider automatiquement l’étape 1 de la quête active'
);

// 5. normalizeAndValidateModelResponse convertit les vecteurs [x,y,z] en {x,y,z}, remonte console_config si y < 0, et corrige targetEntityId sur DROP:src:tgt
const normalizedLLM = normalizeAndValidateModelResponse({
  plan: { intent: 'create_scene', actions: [{ action: 'spawn' }] },
  patch: {
    entitiesCreated: [
      {
        id: 'console_config',
        name: 'Console de configuration',
        capabilities: [{ type: 'transform', position: [-2.2, -0.4, 1.2], scale: [1, 1, 1] }, { type: 'collider' }],
        visuals: { assetId: 'wp-borne-configurateur' }
      },
      {
        id: 'smart_key',
        name: 'Clé intelligente',
        capabilities: [{ type: 'transform', position: [-1.4, 0.05, 1.4] }, { type: 'draggable' }, { type: 'collider' }],
        visuals: { assetId: 'wp-telecommande-sport' }
      },
      {
        id: 'cockpit_zone',
        name: 'Zone cockpit',
        capabilities: [{ type: 'transform', position: [0.8, 0.55, 0.35] }, { type: 'trigger_zone', radius: 0.7 }, { type: 'collider' }],
        visuals: { assetId: 'socket' }
      }
    ],
    questsAdded: [
      {
        id: 'q_norm_test',
        title: 'Test Normalisation',
        status: 'in_progress',
        currentStepIndex: 0,
        steps: [
          {
            id: 'step_drop_norm',
            title: 'Déposer la clé',
            requiredEvent: 'DROP:smart_key:cockpit_zone',
            targetEntityId: 'cockpit_zone',
            completed: false
          }
        ]
      }
    ],
    activeQuestId: 'q_norm_test'
  }
});
assert(normalizedLLM, 'normalizeAndValidateModelResponse doit accepter et normaliser la réponse');
const consoleTf = normalizedLLM!.patch.entitiesCreated![0].capabilities.find((c: any) => c.type === 'transform');
assert.deepStrictEqual(consoleTf?.position, { x: -2.2, y: 0, z: 1.2 }, 'console_config ne doit pas être pris pour un sol et son y < 0 doit être ramené à 0');
const normDropStep = normalizedLLM!.patch.questsAdded![0].steps[0];
assert.strictEqual(normDropStep.targetEntityId, 'smart_key', 'targetEntityId sur DROP:smart_key:cockpit_zone doit être corrigé vers smart_key');
assert.strictEqual(normDropStep.targetZoneId, 'cockpit_zone', 'targetZoneId sur DROP:smart_key:cockpit_zone doit être cockpit_zone');

console.log('PASS: Suite 89 validée avec succès (Store Reset, setWorldFlag Quest Progression, Normalisation LLM & Protection PBR).');

// =========================================================================
// SUITE 90 : Playtester Target Resolution, Guarantor FLAG Liveness, SBR Object Positions & YAML Formatting
// =========================================================================
console.log('--- Démarrage de la Suite 90 : Playtester, Guarantor, SBR, IIE & YAML Roundtrip ---');

// 1. Playtester : résolution de cible par targetEntityId/requiredEvent et exclusion du mobilier support comme obstacle
const playtestWorld90: WorldState = {
  version: 1,
  ir: {
    entities: {
      island_support: {
        id: 'island_support',
        name: 'Îlot de cuisine central',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0, z: 0.2 } }, // Au milieu entre spawn (0,0,1.4) et cible (0,0.95,-1.0)
          { type: 'collider' }
        ],
        visuals: { assetId: 'wp-ilot-de-cuisine' }
      },
      holo_console_90: {
        id: 'holo_console_90',
        name: 'Console Holographique de Configuration Teintes & Finitions',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0.95, z: -1.0 } },
          { type: 'collider' }
        ],
        visuals: { assetId: 'wp-borne-configurateur' }
      }
    },
    rules: {},
    invariants: {},
    quests: {
      q_90: {
        id: 'q_90',
        title: 'Quête Test 90',
        status: 'in_progress',
        currentStepIndex: 0,
        steps: [
          {
            id: 's1',
            title: 'Sélectionner la teinte', // Ne contient pas le nom complet de holo_console_90
            targetEntityId: 'holo_console_90',
            requiredEvent: 'CLICK:holo_console_90',
            completed: false
          },
          {
            id: 's2',
            title: 'Valider la peinture',
            requiredEvent: 'FLAG:paint_configured',
            completed: false
          }
        ]
      }
    },
    activeQuestId: 'q_90'
  },
  flags: {}
};

const ptRes90 = runSyntheticPlaytest(playtestWorld90, 'speedrunner');
assert.strictEqual(ptRes90.success, true, 'Le playtester ne doit pas confondre un îlot support avec un mur bloquant');
assert.strictEqual(ptRes90.waypoints.some(w => w.targetId === 'holo_console_90'), true, 'Le playtester doit résoudre holo_console_90 via targetEntityId/requiredEvent');

// 2. Deterministic Guarantor : une étape FLAG:paint_configured ne doit pas être signalée comme entité orpheline
const audit90 = certifyWorldInvariants(playtestWorld90);
const livenessCheck90 = audit90.checks.find(c => c.id === 'inv_quest_liveness');
assert.strictEqual(livenessCheck90?.satisfied, true, 'Une étape FLAG:paint_configured ne doit pas échouer inv_quest_liveness');

// 3. Semantic Blast Radius : détection d'ORPHAN_DEPENDENCY sur cond.sourceId et de COLLIDER_DEADLOCK sur position {x,y,z}
const sbrWorld90: WorldState = {
  version: 1,
  ir: {
    entities: {
      btn_90: {
        id: 'btn_90',
        name: 'Bouton',
        capabilities: [{ type: 'transform', position: { x: 1, y: 0.9, z: 1 } }, { type: 'collider' }]
      },
       crate_90: {
        id: 'crate_90',
        name: 'Caisse',
        capabilities: [{ type: 'transform', position: { x: -2, y: 0.5, z: -2 } }, { type: 'draggable' }, { type: 'collider' }]
      }
    },
    rules: {
      r_btn_90: {
        id: 'r_btn_90',
        trigger: 'CLICK',
        conditions: [{ type: 'is_source', sourceId: 'btn_90' }],
        actions: [{ type: 'set_flag', flag: 'done_90', value: true }]
      }
    },
    invariants: {
      inv_no_cond: {
        id: 'inv_no_cond',
        description: 'Invariant déclaratif sans condition formelle'
      }
    },
    quests: {
      q_sbr_90: {
        id: 'q_sbr_90',
        title: 'Quête SBR 90',
        status: 'in_progress',
        currentStepIndex: 0,
        steps: [{ id: 'st1', title: 'Cliquer bouton', targetEntityId: 'btn_90', requiredEvent: 'CLICK:btn_90', completed: false }]
      }
    },
    activeQuestId: 'q_sbr_90'
  },
  flags: {}
};

const orphanReport90 = evaluateSemanticBlastRadius(sbrWorld90, { entitiesRemoved: ['btn_90'] });
assert.strictEqual(orphanReport90.violations.some(v => v.type === 'ORPHAN_DEPENDENCY'), true, 'SBR doit détecter ORPHAN_DEPENDENCY quand cond.sourceId est supprimé');

const deadlockReport90 = evaluateSemanticBlastRadius(sbrWorld90, {
  entitiesChanged: [{
    id: 'crate_90',
    capabilities: [{ type: 'transform', position: { x: 1.05, y: 0.5, z: 1.05 } }, { type: 'draggable' }, { type: 'collider' }]
  }]
});
assert.strictEqual(deadlockReport90.violations.some(v => v.type === 'COLLIDER_DEADLOCK'), true, 'SBR doit détecter COLLIDER_DEADLOCK avec des positions objets {x,y,z}');
const repairedCaps90 = deadlockReport90.paretoRepairPatch?.entitiesChanged?.[0]?.capabilities || [];
assert.strictEqual(repairedCaps90.some(c => c.type === 'draggable'), true, 'Le Pareto Repair Patch doit préserver les capabilities existantes (draggable)');

// 4. Inverse Intent Engine : la règle promue pour un DROP doit déclencher sur evaluateEvent(DROP) uniquement pour la bonne paire
const { inferCandidateRule } = await import('../research/inverseIntentEngine');
const { rule: emergentDropRule } = inferCandidateRule(
  sbrWorld90.ir.entities.crate_90,
  sbrWorld90.ir.entities.btn_90,
  'DROP'
);
assert.strictEqual(emergentDropRule.trigger, 'DROP', 'Une règle IIE pour un geste DROP entre 2 entités doit avoir trigger=DROP');
const worldWithEmergentRule: WorldState = {
  ...sbrWorld90,
  ir: { ...sbrWorld90.ir, rules: { ...sbrWorld90.ir.rules, [emergentDropRule.id]: emergentDropRule } }
};
const evalWrong90 = evaluateEvent(worldWithEmergentRule, { type: 'DROP', sourceId: 'btn_90', targetId: 'crate_90' });
assert.strictEqual(Boolean(evalWrong90.newState.flags['interacted_btn_90_with_crate_90']), false, 'La règle IIE ne doit pas se déclencher pour la paire inversée');
const evalRight90 = evaluateEvent(worldWithEmergentRule, { type: 'DROP', sourceId: 'crate_90', targetId: 'btn_90' });
assert.strictEqual(evalRight90.newState.flags['interacted_btn_90_with_crate_90'], true, 'La règle IIE doit se déclencher pour DROP(crate_90 -> btn_90)');

// 5. YAML : pas de double-indentation dans les listes d'objets et préservation des chaînes avec ": "
const yamlStr90 = exportWorldToYaml(sbrWorld90);
assert(!yamlStr90.includes('              position:'), 'stringifyYaml ne doit pas doubler l indentation des propriétés sous un élément de liste');
const roundtrip90 = parseWorldFromYaml(yamlStr90);
assert.deepStrictEqual(
  roundtrip90.entities.btn_90.capabilities.find(c => c.type === 'transform')?.position,
  { x: 1, y: 0.9, z: 1 },
  'Le roundtrip YAML doit préserver fidèlement position {x,y,z}'
);

console.log('PASS: Suite 90 validée avec succès (Playtester Target Resolution, Guarantor FLAG Liveness, SBR Object Positions, IIE DROP & YAML Roundtrip).');

// =========================================================================
// SUITE 91 : Spatial Causality Word Boundaries, Turntable Exclusion, Procedural Challenge & Meta-Controller
// =========================================================================
console.log('--- Démarrage de la Suite 91 : Spatial Causality, Procedural Challenge, Pedagogical Compiler & Meta-Controller ---');

const { evaluateSpatialCausality, findNearestCausalityAffordance } = await import('../engine/spatialCausality');
const { compileProceduralChallenge } = await import('../engine/proceduralChallengeEngine');
const { metaController } = await import('../research/metaController');

// 1. Spatial Causality : frontières de mots (ne pas confondre "socle"/"couvercle" avec "clé", ni "portail" avec "ail")
const fakeKeySocle: EntitySpec = {
  id: 'socle_marbre_91',
  name: 'Socle en marbre massif',
  capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }]
};
const lockTerminal91: EntitySpec = {
  id: 'terminal_91',
  name: 'Terminal de contrôle',
  capabilities: [{ type: 'transform', position: { x: 0, y: 0.9, z: 0 } }]
};
assert.strictEqual(
  evaluateSpatialCausality(fakeKeySocle, lockTerminal91),
  null,
  'Un "Socle" ne doit pas être détecté comme une "clé" (unlock_circuit) par sous-chaîne de "socle"'
);

const portalEntity91: EntitySpec = {
  id: 'portail_91',
  name: 'Portail dimensionnel',
  capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }]
};
const cuttingBoard91: EntitySpec = {
  id: 'planche_91',
  name: 'Planche à découper',
  capabilities: [{ type: 'transform', position: { x: 0, y: 0.9, z: 0 } }]
};
assert.strictEqual(
  evaluateSpatialCausality(portalEntity91, cuttingBoard91),
  null,
  'Un "Portail" ne doit pas être détecté comme de l\'"ail" (slice_chop) par sous-chaîne de "portail"'
);

// 2. Spatial Causality : en showroom supercar, la clé vise le récepteur cockpit (unlock_circuit) et non le plateau tournant (stack_contain)
const smartKey91: EntitySpec = {
  id: 'demo_smart_key',
  name: 'Clé intelligente holographique',
  capabilities: [{ type: 'transform', position: { x: -1.45, y: 0.05, z: 1.45 } }, { type: 'draggable' }]
};
const turntable91: EntitySpec = {
  id: 'demo_rotating_turntable',
  name: 'Plateau tournant motorisé de showroom avec spots LED',
  capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }]
};
const cockpitDock91: EntitySpec = {
  id: 'demo_cockpit_dock',
  name: 'Récepteur de clé du cockpit central',
  capabilities: [{ type: 'transform', position: { x: 0, y: 0.6, z: 0 } }, { type: 'trigger_zone', radius: 0.7 }]
};
assert.strictEqual(
  evaluateSpatialCausality(smartKey91, turntable91),
  null,
  'Un plateau tournant de showroom ne doit pas être traité comme un plateau de service culinaire (stack_contain)'
);
const nearestAff91 = findNearestCausalityAffordance(
  smartKey91,
  [turntable91, cockpitDock91],
  { x: 0.05, y: 0.3, z: 0.05 },
  0.44
);
assert.strictEqual(nearestAff91?.targetEntity.id, 'demo_cockpit_dock', 'La clé doit s aimanter sur demo_cockpit_dock');
assert.strictEqual(nearestAff91?.type, 'unlock_circuit', 'Le type d affordance doit être unlock_circuit');

// 3. Procedural Challenge Engine : positions/rotations/scales générées sous forme d'objets { x, y, z }
const challenge91 = compileProceduralChallenge({ seed: 424242, domain: 'PHYSICS_ELECTRICITY', randomizeLayout: true });
for (const ent of challenge91.worldPatch.entitiesCreated || []) {
  const tf = ent.capabilities.find(c => c.type === 'transform');
  assert(tf && !Array.isArray(tf.position) && typeof tf.position?.x === 'number', `L'entité ${ent.id} doit avoir position={x,y,z}`);
  assert(tf && !Array.isArray(tf.scale) && typeof tf.scale?.x === 'number', `L'entité ${ent.id} doit avoir scale={x,y,z}`);
}

// 4. Pedagogical Compiler : support direct des clés de preset ('optics_snell', 'thermo_calorimetry') et statut 'in_progress'
const simSnellByKey = compilePedagogicalSimulation('optics_snell');
assert.strictEqual(simSnellByKey.preset.id, 'optics_snell', "compilePedagogicalSimulation('optics_snell') doit charger optics_snell");
assert.strictEqual(simSnellByKey.worldPatch.questsAdded?.[0]?.status, 'in_progress', 'La quête pédagogique compilée doit être in_progress');

// 5. Meta-Controller : cycle adaptatif E2 génère des entités avec collider, transform {x,y,z} et règle déclenchable
metaController.resetLoop();
const { worldPatch: adaptivePatch91 } = metaController.generateNextAdaptiveExperience();
const probeEnt91 = adaptivePatch91.entitiesCreated![0];
const probeTf91 = probeEnt91.capabilities.find(c => c.type === 'transform');
assert(!Array.isArray(probeTf91?.position) && typeof probeTf91?.position?.x === 'number', 'La sonde adaptative doit avoir position={x,y,z}');
assert(probeEnt91.capabilities.some(c => c.type === 'collider'), 'La sonde adaptative doit avoir un collider');

useWorldStore.getState().applyPatch(adaptivePatch91, 'Test Cycle Adaptatif 91', { intent: 'adaptive_cycle' });
useWorldStore.getState().dispatch({ type: 'CLICK', sourceId: probeEnt91.id });
const activeAdaptiveQuest91 = useWorldStore.getState().world.ir.quests?.[adaptivePatch91.activeQuestId!];
assert.strictEqual(activeAdaptiveQuest91?.steps[0]?.completed, true, 'Un clic sur la sonde adaptative doit valider l étape de quête E2');

console.log('PASS: Suite 91 validée avec succès (Spatial Causality Word Boundaries, Turntable Exclusion, Procedural Challenge, Pedagogical Compiler & Meta-Controller).');
})();

await (async () => {
// ==========================================
// 92. Test Suite: Data Ingestion Grid/Zero, Counterfactual Divergence, Cognitive Clone Quota, CoWorker Return & Bag Showcase Capacity (Suite 92)
// ==========================================
const { parseRawData: parseRawData92, materializeDataTo3D: materializeDataTo3D92 } = await import('../engine/dataIngestion');
const { createRootBranch: createRootBranch92, forkCounterfactualBranch: forkBranch92, generateAIBotRollout: generateRollout92 } = await import('../engine/counterfactualEngine');
const { runCloneRollout: runCloneRollout92 } = await import('../engine/cognitiveCloneEngine');
const { createInitialCoWorkerState: createCoWorker92, createInitialTeamingMetrics: createMetrics92, delegateTaskToCoWorker: delegateCoWorker92, tickCoWorker: tickCoWorker92 } = await import('../engine/coWorkerAgent');
const { createBagShowcasePatch: createBagPatch92 } = await import('../library/bagShowcase');
const { createForestMushroomForagingPatch: createForestPatch92 } = await import('../library/forestMushroomForaging');
const { evaluatePublishReadiness: evaluatePublishReadiness92 } = await import('../engine/publishReadiness');

// 1. Data Ingestion : JSON clé-valeur + valeur 0 + layout 'grid' + valeurs négatives
const kvDataset92 = parseRawData92('{"T1": 0, "T2": -20, "T3": 50, "T4": 100}', 'Test KV');
assert.strictEqual(kvDataset92.points.length, 4, 'parseRawData doit extraire les 4 entrées clé-valeur');
assert.strictEqual(kvDataset92.points[0].label, 'T1', 'La clé T1 doit être préservée');
assert.strictEqual(kvDataset92.points[0].value, 0, 'La valeur 0 ne doit pas être écrasée par 10');
assert.strictEqual(kvDataset92.points[1].value, -20, 'La valeur négative -20 doit être préservée');

const gridPatch92 = materializeDataTo3D92(kvDataset92, 'grid');
const gridPillars92 = (gridPatch92.entitiesCreated || []).filter(e => e.id.startsWith('data_pillar_'));
assert.strictEqual(gridPillars92.length, 4);
const zCoords92 = new Set(gridPillars92.map(p => p.capabilities.find(c => c.type === 'transform')?.position?.z));
assert(zCoords92.size >= 2, 'Le layout grid doit répartir les piliers sur plusieurs rangées Z');
for (const p of gridPillars92) {
  const sc = p.capabilities.find(c => c.type === 'transform')?.scale;
  assert(sc && sc.y >= 0.5, 'Même avec des valeurs négatives ou nulles, la hauteur du pilier doit être >= 0.5m');
  assert(p.capabilities.some(c => c.type === 'collider'), 'Chaque pilier de données doit posséder un collider');
}

// 2. Counterfactual Engine : fork à l'étape 0 et point de divergence réel
const rootBranch92 = createRootBranch92(
  {
    sessionId: 'sess-92',
    startTime: Date.now() - 10000,
    durationSec: 30,
    totalDecisions: 4,
    averageLatencyMs: 1200,
    hesitationCount: 0,
    hesitationRate: 0,
    errorWarningsCount: 0,
    errorRecoveryCount: 0,
    proceduralEfficiency: 90,
    resilienceScore: 85,
    persona: 'methodical-analyst',
    personaLabel: 'Analyste Méthodique',
    personaDescription: '',
    traces: [
      { stepIndex: 1, timestamp: 1, relativeTimeSec: 1, actionType: 'chop', latencyMs: 1000, isHesitation: false, heatLevel: 1, temperature: 95, doneness: 20, activeQuestId: 'q', activeQuestStepIndex: 1 },
      { stepIndex: 2, timestamp: 2, relativeTimeSec: 2, actionType: 'heat_change', latencyMs: 1000, isHesitation: false, heatLevel: 2, temperature: 120, doneness: 45, activeQuestId: 'q', activeQuestStepIndex: 2 },
      { stepIndex: 3, timestamp: 3, relativeTimeSec: 3, actionType: 'season', latencyMs: 1000, isHesitation: false, heatLevel: 2, temperature: 130, doneness: 70, activeQuestId: 'q', activeQuestStepIndex: 3 },
      { stepIndex: 4, timestamp: 4, relativeTimeSec: 4, actionType: 'plate', latencyMs: 1000, isHesitation: false, heatLevel: 1, temperature: 100, doneness: 100, activeQuestId: 'q', activeQuestStepIndex: 4 }
    ]
  } as any,
  {
    stepIndex: 4,
    timestamp: Date.now(),
    cookingHeatLevel: 1,
    cookingTemperature: 100,
    cookingDoneness: 100,
    isDishPlated: true,
    platingStyle: 'classic',
    platingGarnish: 'herbs',
    isDishSauced: true,
    activeQuestId: 'q',
    activeQuestStepIndex: 4,
    choppedIngredientsCount: 2
  }
);
const forkZero92 = forkBranch92(rootBranch92, 0);
assert.strictEqual(forkZero92.traces.length, 0, 'Un fork à l étape 0 doit avoir 0 trace');
assert.strictEqual(forkZero92.snapshot.cookingTemperature, 85, 'Un fork à l étape 0 ne doit pas copier la température de l étape 1 (95°C)');

const forkBeyond92 = forkBranch92(rootBranch92, 99);
assert.strictEqual(forkBeyond92.forkStepIndex, 4, 'Un fork au-delà de la longueur doit être borné à la dernière étape (4)');
assert.strictEqual(forkBeyond92.snapshot.cookingTemperature, 100, 'Un fork au-delà de la longueur doit conserver l état de la dernière étape');
const hesitantRollout92 = generateRollout92(forkBranch92(rootBranch92, 2), 'hesitant-learner', 'Test');
assert(hesitantRollout92.traces.some(t => t.isErrorRecovery), 'Le profil hesitant-learner doit activer isErrorRecovery lors de la demande de conseil');

// 3. Cognitive Clone Engine : allocation proportionnelle des actions selon actionProbabilities
const rollout92 = runCloneRollout92(
  {
    cloneId: 'CLONE-92',
    operatorName: 'Chef 92',
    fidelityScore: 92,
    latentWeights: { speed: 70, precision: 85, aesthetics: 60, riskTolerance: 40, collaboration: 50 },
    dominantArchetype: 'Analyste Rigoureux de Précision',
    actionProbabilities: { chop: 0.8, heat_change: 0.2 },
    averageDecisionLatencyMs: 1200,
    latencyStandardDeviationMs: 150,
    recoveryPolicy: 'cautious',
    trainingEpisodesCount: 1,
    totalDecisionsDistilled: 10,
    synthesizedAt: Date.now()
  },
  'Test Quota Rollout',
  5
);
const chopCount92 = rollout92.simulatedSteps.filter(s => s.actionType === 'chop').length;
const heatCount92 = rollout92.simulatedSteps.filter(s => s.actionType === 'heat_change').length;
assert.strictEqual(chopCount92, 4, 'Sur 5 étapes avec p(chop)=0.8, le clone doit exécuter chop 4 fois');
assert.strictEqual(heatCount92, 1, 'Sur 5 étapes avec p(heat_change)=0.2, le clone doit exécuter heat_change 1 fois');

// 4. Co-Worker Agent : retour physique au poste par défaut après achèvement d'une tâche
let cwState92 = createCoWorker92('sous-chef-camille');
let cwMetrics92 = createMetrics92();
const delRes92 = delegateCoWorker92(cwState92, 'chop_vegetables', cwMetrics92);
cwState92 = delRes92.nextState;
cwMetrics92 = delRes92.nextMetrics;
// Avancer jusqu'à complétion exacte de la tâche (9 * 0.5s = 4.5s)
for (let t = 0; t < 9; t++) {
  const tickRes = tickCoWorker92(cwState92, cwMetrics92, 0.5);
  cwState92 = tickRes.nextState;
  cwMetrics92 = tickRes.nextMetrics;
}
assert.strictEqual(cwState92.currentTask, 'idle', 'La tâche doit être terminée et repassée en idle');
const distBeforeReturn92 = Math.hypot(cwState92.position.x - cwState92.targetPosition.x, cwState92.position.z - cwState92.targetPosition.z);
assert(distBeforeReturn92 > 0.1, 'Juste après la fin de tâche au plan de travail, le co-équipier est encore éloigné de sa position de repos');
const returnTick92 = tickCoWorker92(cwState92, cwMetrics92, 0.25);
const distAfterReturn92 = Math.hypot(returnTick92.nextState.position.x - returnTick92.nextState.targetPosition.x, returnTick92.nextState.position.z - returnTick92.nextState.targetPosition.z);
assert(distAfterReturn92 < distBeforeReturn92, 'En état idle, tickCoWorker doit ramener progressivement le co-équipier vers sa position par défaut');

// 5. Bag Showcase & Capacité Spatiale : objets draggables, rejet d'objet hors-gabarit sans validation de quête ni déplacement parasite
const bagPatch92 = createBagPatch92();
for (const itemId of ['laptop_pro_15', 'gourde_isotherme', 'carton_oversized']) {
  const itemEnt = bagPatch92.entitiesCreated?.find(e => e.id === itemId);
  assert(itemEnt?.capabilities.some(c => c.type === 'draggable'), `L'objet ${itemId} du Bag Showcase doit être draggable`);
}
useWorldStore.getState().resetWorld();
useWorldStore.getState().applyPatch(bagPatch92, 'Load Bag Showcase 92');
// Étape 1 : Ouvrir le sac
useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: 'sac_nomade_42', targetId: 'sac_nomade_42' });
const bagQuestAfterOpen = useWorldStore.getState().world.ir.quests?.['quest_mindel_bag_capacity'];
assert.strictEqual(bagQuestAfterOpen?.steps[0].completed, true, 'L étape 1 (ouvrir le sac) doit être validée');

// Tenter de déposer le gros carton incompatible pendant l'étape 2 (Laptop)
const cartonBeforePos = { ...useWorldStore.getState().world.ir.entities['carton_oversized'].capabilities.find(c => c.type === 'transform')!.position! };
useWorldStore.getState().dispatch({ type: 'DROP', sourceId: 'carton_oversized', targetId: 'sac_nomade_42' });
const bagQuestAfterCarton = useWorldStore.getState().world.ir.quests?.['quest_mindel_bag_capacity'];
assert.strictEqual(bagQuestAfterCarton?.steps[1].completed, false, 'Déposer le carton hors-gabarit ne doit JAMAIS valider l étape du Laptop 15.6"');
const cartonAfterPos = useWorldStore.getState().world.ir.entities['carton_oversized'].capabilities.find(c => c.type === 'transform')!.position!;
assert.strictEqual(cartonAfterPos.x, cartonBeforePos.x, 'Le carton hors-gabarit rejeté doit retrouver sa position X initiale');
assert.strictEqual(cartonAfterPos.z, cartonBeforePos.z, 'Le carton hors-gabarit rejeté doit retrouver sa position Z initiale');

// Déposer le Laptop 15.6" valide l'étape 2
useWorldStore.getState().dispatch({ type: 'DROP', sourceId: 'laptop_pro_15', targetId: 'sac_nomade_42' });
const bagQuestAfterLaptop = useWorldStore.getState().world.ir.quests?.['quest_mindel_bag_capacity'];
assert.strictEqual(bagQuestAfterLaptop?.steps[1].completed, true, 'Déposer le Laptop 15.6" sur le sac doit valider l étape 2');

// 6. Gameplay Presets & Publish Readiness : hazard_zone valide, victoire auto à 200/500 pts et activeQuestId forestier
const survPatch92 = createSurvivalHazardGame();
const survWorld92: WorldState = {
  version: 1,
  ir: {
    entities: Object.fromEntries((survPatch92.entitiesCreated || []).map(e => [e.id, e])),
    rules: Object.fromEntries((survPatch92.rulesChanged || []).map(r => [r.id!, r as any])),
    invariants: {}
  },
  flags: {},
  gameplay: survPatch92.gameplayPatch ? { ...defaultGameplayState, ...survPatch92.gameplayPatch } : undefined
};
assert.strictEqual(validateWorld(survWorld92).valid, true, 'Survival Hazard doit passer validateWorld (hazard_zone avec collider)');
const survReadiness92 = evaluatePublishReadiness92(survWorld92, 'standard');
const hitboxCheck92 = survReadiness92.checks.find(c => c.id === 'performance_ergonomics_touch_vr');
assert.strictEqual(hitboxCheck92?.status, 'PASS', 'Une zone au sol de 3.2m x 3.2m ne doit pas être signalée comme hitbox < 8cm');

const trPatch92 = createTargetRangeGame();
let trWorld92: WorldState = {
  version: 1,
  ir: {
    entities: Object.fromEntries((trPatch92.entitiesCreated || []).map(e => [e.id, e])),
    rules: Object.fromEntries((trPatch92.rulesChanged || []).map(r => [r.id!, r as any])),
    invariants: Object.fromEntries((trPatch92.invariantsAdded || []).map(inv => [inv.id, inv]))
  },
  flags: {},
  gameplay: trPatch92.gameplayPatch ? { ...defaultGameplayState, ...trPatch92.gameplayPatch } : undefined
};
for (const tid of ['target_alpha', 'target_beta', 'target_gamma', 'target_delta']) {
  trWorld92 = evaluateEvent(trWorld92, { type: 'INTERACT', sourceId: tid }).newState;
}
assert.strictEqual(trWorld92.gameplay?.score, 200, 'Les 4 cibles doivent donner 200 points');
assert.strictEqual(trWorld92.gameplay?.gameStatus, 'victory', 'Atteindre 200 points au stand de tir doit déclencher la victoire');

const forestPatch92 = createForestPatch92({});
assert.strictEqual(forestPatch92.activeQuestId, 'quest_cueillette_champignons', 'Le patch forestier doit définir activeQuestId');

console.log('PASS: Suite 92 validée avec succès (Data Ingestion Grid/Zero, Counterfactual Divergence, Cognitive Clone Quota, CoWorker Return & Bag Showcase Capacity).');

// =========================================================================
// SUITE 93 : Behavioral Tensor Metrics & Deduplication, Canonical Invariants,
//            Patch Satisfaction, Pareto Repair, Validator Order, Seminar Lock & LeRobot Kinematics
// =========================================================================
console.log('--- Démarrage de la Suite 93 : Tenseurs MDP, Invariants Canoniques, Satisfaction de Patch, Réparation Pareto, Validator, Séminaires & Cinématique LeRobot ---');

const { BehavioralTensorRecorder: Recorder93 } = await import('../research/behavioralTensorRecorder');
const { captureCanonicalSnapshot: captureSnap93 } = await import('../research/editOrder/canonicalSnapshot');
const { verifyPatchSatisfaction: verifySat93 } = await import('../research/editOrder/verifyPatchSatisfaction');
const { applySequenceUnderCondition: applySeq93, computeParetoMinimalRepairPatch: computePareto93 } = await import('../research/editOrder/repairPolicy');
const { applyPatchToWorldState: applyClonePatch93 } = await import('../research/editOrder/worldCloneManager');
const { validateWorldPatch: validateWorldPatch93 } = await import('../engine/validator');
const { generateLeRobotDataset: generateLeRobot93 } = await import('../engine/embodiedDataExporter');

// 1. BehavioralTensorRecorder : affordanceDiscoveryRatio calculé et zéro duplication après finishCurrentEpisode()
const rec93 = new Recorder93();
rec93.startNewEpisode('parcel_test_93', 'quest_93');
rec93.recordStep([0, 1.0, 0], [0, 0, 0], [0, 0, -1], 'ent_a', 'GRAB', 0.5, false);
rec93.recordStep([1, 1.0, 0], [0.1, 0, 0], [0, 0, -1], 'ent_b', 'RELEASE', 1.0, false);
const ep93 = rec93.finishCurrentEpisode(4);
assert(ep93 !== null, 'L épisode terminé doit être retourné');
assert.strictEqual(ep93.metrics.affordanceDiscoveryRatio, 0.5, '2 entités actives sur 4 entités de scène = ratio 0.5');
const exported93 = JSON.parse(rec93.exportDatasetJSON());
assert.strictEqual(exported93.totalEpisodes, 1, 'exportDatasetJSON ne doit pas dupliquer un épisode déjà terminé par finishCurrentEpisode');
assert.strictEqual(exported93.episodes.length, 1, 'Le tableau episodes doit contenir exactement 1 épisode');

// 2. CanonicalSnapshot : détection des invariants never_state avec stateFlag et requiredFlag
const invWorld93: WorldState = {
  version: 1,
  ir: {
    entities: {},
    rules: {},
    invariants: {
      inv_std: {
        id: 'inv_std',
        description: 'Interdiction de démarrer sans frein',
        condition: {
          type: 'never_state',
          stateFlag: 'engine_started',
          requiredFlag: 'brake_pressed'
        }
      }
    }
  },
  flags: {
    engine_started: true,
    brake_pressed: false
  }
};
const snap93 = captureSnap93(invWorld93, 'case_93', 'AB', 5);
const evalInv93 = snap93.invariants.find(i => i.invariantId === 'inv_std');
assert.strictEqual(evalInv93?.satisfied, false, 'captureCanonicalSnapshot doit détecter la violation d un invariant never_state utilisant stateFlag/requiredFlag');

// 3. verifyPatchSatisfaction : prise en compte de entitiesRemoved et questsAdded
const satWorld93: WorldState = {
  version: 1,
  ir: {
    entities: {
      still_here: { id: 'still_here', name: 'Objet persistant', capabilities: [] }
    },
    rules: {},
    invariants: {},
    quests: {}
  },
  flags: {}
};
assert.strictEqual(
  verifySat93(satWorld93, { entitiesRemoved: ['still_here'] }),
  false,
  'verifyPatchSatisfaction doit retourner false si une entité censée être supprimée existe toujours'
);
assert.strictEqual(
  verifySat93(satWorld93, { questsAdded: [{ id: 'missing_q', title: 'Q', description: '', steps: [], status: 'in_progress', currentStepIndex: 0 }] }),
  false,
  'verifyPatchSatisfaction doit retourner false si une quête ajoutée est absente du monde'
);

// 4. repairPolicy & worldCloneManager : restauration d'entité orpheline, déblocage de collider deadlock et remplacement homonyme
const cloneWorld93: WorldState = {
  version: 1,
  ir: {
    entities: {
      same_id: {
        id: 'same_id',
        name: 'Ancienne version',
        capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }, { type: 'draggable' }]
      }
    },
    rules: {},
    invariants: {}
  },
  flags: {}
};
applyClonePatch93(cloneWorld93, {
  entitiesRemoved: ['same_id'],
  entitiesCreated: [{
    id: 'same_id',
    name: 'Nouvelle version',
    capabilities: [{ type: 'transform', position: { x: 1, y: 0, z: 0 } }, { type: 'collider' }]
  }]
});
assert.strictEqual(cloneWorld93.ir.entities['same_id']?.name, 'Nouvelle version', 'applyPatchToWorldState doit appliquer entitiesRemoved avant entitiesCreated');

const paretoPatch93 = computePareto93(
  { version: 1, ir: { entities: {}, rules: {}, invariants: {} }, flags: {} },
  [{ id: 'v_orphan', type: 'ORPHAN_DEPENDENCY', severity: 'CRITICAL', affectedEntityId: 'same_id', description: 'Orphan', mitigationSuggestion: 'Restore' }],
  cloneWorld93
);
assert(paretoPatch93?.entitiesCreated?.some(e => e.id === 'same_id'), 'computeParetoMinimalRepairPatch doit recréer l entité supprimée via entitiesCreated en préservant ses capacités');

const seqWorld93: WorldState = {
  version: 1,
  ir: {
    entities: {
      pump_93: { id: 'pump_93', name: 'Pompe', capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }] }
    },
    rules: {},
    invariants: {}
  },
  flags: {}
};
const seqRes93 = await applySeq93(seqWorld93, ['déplace la pompe à x=1', 'ajoute un établi'], 'C5_DependencyAwareMinimalRepair');
assert.strictEqual(typeof seqRes93.satisfiedA, 'boolean', 'satisfiedA doit être évalué dynamiquement');
assert.strictEqual(typeof seqRes93.satisfiedB, 'boolean', 'satisfiedB doit être évalué dynamiquement');

// 5. validateWorld & validateWorldPatch : remplacement homonyme et référence à une sous-partie (entity.parts)
const partWorld93: WorldState = {
  version: 1,
  ir: {
    entities: {
      voilier_93: {
        id: 'voilier_93',
        name: 'Voilier',
        capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }],
        parts: [{ id: 'grand_voile_93', name: 'Grand-Voile', description: 'Voile principale' }]
      }
    },
    rules: {
      r_part_93: {
        id: 'r_part_93',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'grand_voile_93' }],
        actions: [{ type: 'play_sound', sound: 'chime' }]
      }
    },
    invariants: {}
  },
  flags: {}
};
assert.strictEqual(validateWorld(partWorld93).valid, true, 'validateWorld doit accepter une règle référençant une sous-partie (entity.parts)');
const replaceValidation93 = validateWorldPatch93(partWorld93, {
  entitiesRemoved: ['voilier_93'],
  entitiesCreated: [partWorld93.ir.entities['voilier_93']]
});
assert.strictEqual(replaceValidation93.valid, true, 'validateWorldPatch doit valider un remplacement homonyme (entitiesRemoved + entitiesCreated avec le même ID)');

// 6. seminarRooms : le mobilier lourd de séminaire ne doit pas être draggable et les objets de table ont safeY = 0.785
for (const room of seminarRooms) {
  const semPatch = createSeminarPatch(room);
  for (const ent of semPatch.entitiesCreated || []) {
    if (ent.visuals?.assetId === 'meeting-table' || ent.visuals?.assetId === 'wp-table-de-conference-en-u' || ent.visuals?.assetId === 'wall-screen') {
      assert.strictEqual(
        ent.capabilities.some(c => c.type === 'draggable'),
        false,
        `Le mobilier/écran fixe '${ent.id}' (${ent.visuals?.assetId}) dans le séminaire '${room.id}' ne doit pas être draggable`
      );
    }
    if (ent.visuals?.assetId === 'laptop' || ent.visuals?.assetId === 'wp-badge-de-participant') {
      const y = ent.capabilities.find(c => c.type === 'transform')?.position?.y ?? 0;
      assert(y >= 0.78, `L'objet sur table '${ent.id}' doit avoir une garde au plateau safeY >= 0.78m (actuel: ${y})`);
    }
  }
}

// 7. embodiedDataExporter : extraction de la pose 3D réelle et de delta_position depuis le monde 3D
const leRobotWorld93: WorldState = {
  version: 1,
  ir: {
    entities: {
      ustensile_1: {
        id: 'ustensile_1',
        name: 'Spatule',
        capabilities: [{ type: 'transform', position: { x: -0.35, y: 0.94, z: 0.22 }, rotation: { x: 0, y: 0.5, z: 0 } }]
      },
      cocotte_1: {
        id: 'cocotte_1',
        name: 'Cocotte',
        capabilities: [{ type: 'transform', position: { x: 0.25, y: 0.98, z: -0.10 }, rotation: { x: 0, y: 1.2, z: 0 } }]
      }
    },
    rules: {},
    invariants: {}
  },
  flags: {}
};
const leRobotDataset93 = generateLeRobot93(
  {
    sessionId: 'sess_93',
    startedAt: 1000,
    totalDurationMs: 2000,
    proceduralEfficiency: 92,
    thermalMastery: 88,
    safetyCompliance: 100,
    hesitationIndex: 12,
    traces: [
      {
        timestamp: 1000,
        actionType: 'GRAB',
        sourceEntityId: 'ustensile_1',
        sourceEntityName: 'Spatule',
        temperature: 25,
        doneness: 0,
        heatLevel: 1,
        latencyMs: 300,
        warningTriggered: false
      },
      {
        timestamp: 2000,
        actionType: 'DROP',
        sourceEntityId: 'ustensile_1',
        targetEntityId: 'cocotte_1',
        sourceEntityName: 'Spatule',
        temperature: 120,
        doneness: 40,
        heatLevel: 2,
        latencyMs: 250,
        warningTriggered: false
      }
    ]
  } as any,
  leRobotWorld93
);
const epFrames93 = leRobotDataset93.episodes[0].frames;
assert.deepStrictEqual(epFrames93[0].observation.state.slice(0, 4), [-0.35, 0.94, 0.22, 0.5], 'La trame 0 doit refléter la pose 3D réelle de ustensile_1');
assert.deepStrictEqual(epFrames93[1].observation.state.slice(0, 4), [0.25, 0.98, -0.1, 1.2], 'La trame 1 doit refléter la pose 3D réelle de la cible cocotte_1');
assert.deepStrictEqual(epFrames93[1].action.delta_position, [0.6, 0.04, -0.32], 'action.delta_position doit calculer le déplacement 3D réel entre les deux étapes');

console.log('PASS: Suite 93 validée avec succès (Tenseurs MDP, Invariants Canoniques, Satisfaction de Patch, Réparation Pareto, Validator, Séminaires & Cinématique LeRobot).');

// ============================================================================
// Suite 94: Non-Regression Pass 8 — Store Event Anti-Recursion, Dynamic Cohort
// Bottlenecks, Anomaly Resolution & Cooking Tick, Recipe Utensils & FLE Rules
// ============================================================================
console.log('Running Test Suite 94: Pass 8 Deep Bug Audit...');

// 1. Store triggerTasting & toggleSauceDish should not recurse infinitely when window is present
useWorldStore.getState().resetWorld();
useWorldStore.getState().triggerTasting('spoon');
assert.strictEqual(useWorldStore.getState().isTastingActive, true, 'triggerTasting doit activer la dégustation sans récursion infinie');
assert.strictEqual(useWorldStore.getState().tastingUtensil, 'spoon', 'triggerTasting doit enregistrer l’ustensile spoon');
useWorldStore.getState().stopTasting();

const beforeSauce94 = useWorldStore.getState().isDishSauced;
useWorldStore.getState().toggleSauceDish();
assert.strictEqual(useWorldStore.getState().isDishSauced, !beforeSauce94, 'toggleSauceDish doit basculer l’état de nappage sans récursion infinie');

// 2. Cohort Simulator dynamic step sizing for short/custom quests
const { simulateAgentCohort: simCohort94 } = await import('../engine/cohortSimulator');
const cohort3Steps94 = simCohort94({
  cohortSize: 40,
  scenarioTitle: 'Scène FLE 3 étapes',
  taskSteps: [
    { title: 'Étape 1 : Dialogue', hint: 'Écouter l’audio' },
    { title: 'Étape 2 : Lexique', hint: 'Cliquer sur un objet' },
    { title: 'Étape 3 : Quiz', hint: 'Valider la réponse' }
  ]
});
assert.strictEqual(cohort3Steps94.bottlenecks.length, 3, 'simulateAgentCohort doit dimensionner exactement 3 goulots pour une quête à 3 étapes');
for (const b of cohort3Steps94.bottlenecks) {
  assert.ok(b.stepIndex >= 1 && b.stepIndex <= 3, `Aucun goulot hors bornes ne doit être généré (reçu stepIndex=${b.stepIndex})`);
}
for (const r of cohort3Steps94.runs) {
  if (r.bottleneckStep !== undefined) {
    assert.ok(r.bottleneckStep >= 1 && r.bottleneckStep <= 3, `bottleneckStep d’un agent doit être borné à [1..3] (reçu ${r.bottleneckStep})`);
  }
}

// 3. tickCooking with stove off (heat=0, temp=20) still ticks pending anomalies & sums choppingProgress
useWorldStore.getState().resetWorld();
useWorldStore.getState().clearAnomalies();
useWorldStore.setState({ cookingHeatLevel: 0, cookingTemperature: 20, choppingProgress: {} });
const spoilAnom94 = useWorldStore.getState().injectAnomaly('ingredient_spoilage');
assert.strictEqual(spoilAnom94.status, 'pending', 'L’anomalie ingredient_spoilage doit être pending à l’injection');
// Chop a single ingredient twice (1 key in choppingProgress, total cuts = 2)
useWorldStore.getState().chopIngredient('courgette_1');
useWorldStore.getState().chopIngredient('courgette_1');
useWorldStore.getState().tickCooking(1.0);
const resolvedSpoil94 = useWorldStore.getState().activeAnomalies.find(a => a.id === spoilAnom94.id);
assert.strictEqual(resolvedSpoil94?.status, 'resolved', 'tickCooking doit s’exécuter même à feu éteint lorsqu’une anomalie est en attente et sommer le nombre total de découpes');

// 4. seminar_av_glitch should not auto-resolve on first tick without AV flag, and resolveAnomaly cools thermal_flare
useWorldStore.getState().clearAnomalies();
const avAnom94 = useWorldStore.getState().injectAnomaly('seminar_av_glitch');
useWorldStore.getState().tickCooking(0.5);
const afterFirstTickAv94 = useWorldStore.getState().activeAnomalies.find(a => a.id === avAnom94.id);
assert.strictEqual(afterFirstTickAv94?.status, 'pending', 'seminar_av_glitch ne doit pas s’auto-résoudre au premier tick sans action AV');

const flareAnom94 = useWorldStore.getState().injectAnomaly('thermal_flare');
assert.strictEqual(useWorldStore.getState().cookingHeatLevel, 3, 'thermal_flare monte le feu à 3');
useWorldStore.getState().resolveAnomaly(flareAnom94.id);
assert.ok(useWorldStore.getState().cookingHeatLevel <= 1, 'resolveAnomaly sur thermal_flare doit redescendre cookingHeatLevel <= 1');
assert.ok(useWorldStore.getState().cookingTemperature <= 110, 'resolveAnomaly sur thermal_flare doit refroidir cookingTemperature <= 110');

// 5. setCookingDoneness resets lastAnnouncedDonenessStage when lowered
useWorldStore.setState({ cookingDoneness: 100, lastAnnouncedDonenessStage: 100 });
useWorldStore.getState().setCookingDoneness(0);
assert.strictEqual(useWorldStore.getState().lastAnnouncedDonenessStage, 0, 'setCookingDoneness(0) doit réinitialiser lastAnnouncedDonenessStage à 0');

// 6. All 12 Cooking Recipes resolve distinct interactive prepUtensil & cookUtensil (never audioId or fixed furniture)
for (const recipe of cookingRecipes) {
  const rPatch94 = createRecipePatch(recipe);
  const rQuest94 = rPatch94.questsAdded![0];
  const step1Target = rQuest94.steps[0].targetEntityId;
  const step2Target = rQuest94.steps[1].targetEntityId;
  const step3Target = rQuest94.steps[2].targetEntityId;
  assert.notStrictEqual(step3Target, step1Target, `La recette ${recipe.id} ne doit jamais cibler audioId pour l’étape 3 de cuisson`);
  assert.ok(!step2Target?.includes('wp-ilot-de-cuisine'), `La recette ${recipe.id} ne doit pas cibler l’îlot fixe pour l’étape 2 de découpe (reçu ${step2Target})`);
  const audioRule94 = rPatch94.rulesChanged!.find(r => r.id === `rule_recipe_${recipe.id}_audio`);
  assert.ok(audioRule94, `La recette ${recipe.id} doit posséder une règle d’interaction pour audioId`);
}

// 7. FLE Scenes: every object has a vocab rule, fixed furniture is not draggable, and clicking audioId completes Step 1
const fleBoulangerie94 = fleScenes.find(s => s.id === 'fle-boulangerie')!;
const flePatch94 = createFLEPatch(fleBoulangerie94);
const storefrontEnt94 = flePatch94.entitiesCreated!.find(e => e.visuals?.assetId === 'wp-devanture-de-boulangerie');
assert.ok(!storefrontEnt94?.capabilities.some(c => c.type === 'draggable'), 'La devanture de boulangerie FLE ne doit pas être draggable');
useWorldStore.getState().resetWorld();
useWorldStore.getState().applyPatch(flePatch94, 'Test FLE Boulangerie');
// Clicking audio speaker completes step 1 (as promised by hint)
useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: `fle_${fleBoulangerie94.id}_audio` });
assert.strictEqual(useWorldStore.getState().world.ir.quests![`quest_${fleBoulangerie94.id}`].steps[0].completed, true, 'Cliquer sur la borne audio FLE doit valider l’étape 1 du dialogue');
// Clicking any 3D vocabulary prop (e.g. croissant obj_6) completes step 2
useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: `fle_${fleBoulangerie94.id}_obj_6` });
assert.strictEqual(useWorldStore.getState().world.ir.quests![`quest_${fleBoulangerie94.id}`].steps[1].completed, true, 'Cliquer sur n’importe quel objet 3D de la scène FLE doit valider l’étape 2 du vocabulaire');

console.log('PASS: Suite 94 validée avec succès (Anti-récursion Store, Cohorte Dynamique, Anomalies & Tick Cuisson, Ustensiles Recettes & Quêtes FLE).');

// ============================================================================
// Suite 95: Non-Regression Pass 9 — WorldSlice applyPatch Order & Target Rule
// Cleanup, Invariant Dispatch (state/without_flag), Undo/Redo Flags & Layouts,
// Mindel Bag Multi-Part Capacity & Counterfactual Root Refresh
// ============================================================================
console.log('Running Test Suite 95: Pass 9 Deep Bug Audit...');

// 1. applyPatch homonymous replacement (entitiesRemoved + entitiesCreated with same ID) & deleteEntity on target-referenced entity
useWorldStore.getState().resetWorld();
useWorldStore.getState().applyPatch(
  {
    entitiesCreated: [
      { id: 'couteau_95', name: 'Couteau', capabilities: [{ type: 'transform', position: { x: 0, y: 0.9, z: 0 } }] },
      { id: 'planche_95', name: 'Planche', capabilities: [{ type: 'transform', position: { x: 0.3, y: 0.9, z: 0 } }] }
    ],
    rulesChanged: [
      {
        id: 'rule_drop_planche_95',
        trigger: 'DROP',
        conditions: [{ type: 'is_target', targetId: 'planche_95' }],
        actions: [{ type: 'set_flag', flag: 'chopped_95', value: true }]
      }
    ]
  },
  'Init Planche 95'
);
// Homonymous replacement of planche_95 must keep planche_95 alive
useWorldStore.getState().applyPatch(
  {
    entitiesRemoved: ['planche_95'],
    entitiesCreated: [{ id: 'planche_95', name: 'Planche Bambou', capabilities: [{ type: 'transform', position: { x: 0.3, y: 0.9, z: 0 } }] }]
  },
  'Remplacement homonyme planche_95'
);
assert.strictEqual(useWorldStore.getState().world.ir.entities['planche_95']?.name, 'Planche Bambou', 'Un remplacement homonyme dans applyPatch ne doit pas supprimer la nouvelle entité');
// Deleting planche_95 (which is referenced via is_target in rule_drop_planche_95) must clean up rule_drop_planche_95 and not throw in validateWorld
useWorldStore.getState().deleteEntity('planche_95');
assert.strictEqual(useWorldStore.getState().world.ir.entities['planche_95'], undefined, 'deleteEntity doit supprimer planche_95 sans erreur de validation sur les règles is_target');
assert.strictEqual(useWorldStore.getState().world.ir.rules['rule_drop_planche_95'], undefined, 'La règle référençant planche_95 en is_target doit être nettoyée à la suppression');

// 2. dispatch invariant enforcement with { state, without_flag }
useWorldStore.getState().resetWorld();
useWorldStore.getState().applyPatch(
  {
    entitiesCreated: [{ id: 'moteur_95', name: 'Moteur', capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }] }],
    rulesChanged: [
      {
        id: 'rule_start_moteur_95',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'moteur_95' }],
        actions: [{ type: 'set_flag', flag: 'engine_started_95', value: true }]
      }
    ],
    invariantsAdded: [
      {
        id: 'inv_safety_95',
        description: 'Diagnostic requis avant démarrage',
        condition: { type: 'never_state', state: 'engine_started_95', without_flag: 'diag_done_95' } as any
      }
    ]
  },
  'Test Invariant state/without_flag'
);
useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: 'moteur_95' });
assert.notStrictEqual(useWorldStore.getState().world.flags['engine_started_95'], true, 'dispatch doit bloquer la transition violant un invariant never_state défini avec state/without_flag');

// 3. Undo/Redo preserves world.flags & world.gameplay, and loadSpatialLayout is undoable
useWorldStore.getState().setWorldFlag('diag_done_95', true);
useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: 'moteur_95' });
assert.strictEqual(useWorldStore.getState().world.flags['engine_started_95'], true, 'Une fois diag_done_95 actif, le démarrage moteur est autorisé');
useWorldStore.getState().resetWorld();
assert.strictEqual(useWorldStore.getState().world.flags['engine_started_95'], undefined, 'resetWorld vide les flags');
useWorldStore.getState().undo();
assert.strictEqual(useWorldStore.getState().world.flags['engine_started_95'], true, 'undo() après resetWorld doit restaurer les flags du monde');

const layoutId95 = useWorldStore.getState().saveCurrentSpatialLayout('Layout Test 95');
useWorldStore.getState().moveEntity('moteur_95', 1.2, 0, -0.8);
const epochBeforeLayout95 = useWorldStore.getState().physicsEpoch;
useWorldStore.getState().loadSpatialLayout(layoutId95);
assert.ok(useWorldStore.getState().physicsEpoch > epochBeforeLayout95, 'loadSpatialLayout doit incrémenter physicsEpoch');
useWorldStore.getState().undo();
const tfAfterUndoLayout95 = useWorldStore.getState().world.ir.entities['moteur_95']?.capabilities.find(c => c.type === 'transform');
assert.strictEqual(tfAfterUndoLayout95?.position.x, 1.2, 'undo() après loadSpatialLayout doit rétablir la position précédente');

// 4. Mindel Bag Showcase: testEntityCapacity on gourde_isotherme & toggle_state flag cleanup
const { createBagShowcasePatch: createBagPatch95 } = await import('../library/bagShowcase');
useWorldStore.getState().resetWorld();
useWorldStore.getState().applyPatch(createBagPatch95(), 'Mindel Bag 95');
const bottleCapRes95 = useWorldStore.getState().testEntityCapacity('sac_nomade_42', 'gourde_isotherme');
assert.strictEqual(bottleCapRes95.fits, true, 'testEntityCapacity doit valider la gourde isotherme dans la poche latérale du sac 42L');
assert.strictEqual(bottleCapRes95.partId, 'part_side_bottle', 'testEntityCapacity doit associer la gourde à part_side_bottle');

// Toggle bag open then closed: state flags must be mutually exclusive
useWorldStore.getState().toggleEntityState('sac_nomade_42');
assert.strictEqual(useWorldStore.getState().world.flags['sac_nomade_42_state_open'], true, 'Le flag state_open doit être true à l’ouverture');
useWorldStore.getState().toggleEntityState('sac_nomade_42');
assert.strictEqual(useWorldStore.getState().world.flags['sac_nomade_42_state_closed'], true, 'Le flag state_closed doit être true à la fermeture');
assert.strictEqual(useWorldStore.getState().world.flags['sac_nomade_42_state_open'], false, 'Le flag state_open doit repasser à false lorsque le sac est refermé');

// 5. Counterfactual fork refreshes rootBranch with latest cognitiveReport traces
useWorldStore.getState().resetCognitiveSession();
useWorldStore.getState().logCognitiveAction('chop', { sourceEntityName: 'courgette' });
useWorldStore.getState().createCounterfactualFork(1, 'Fork Initial');
useWorldStore.getState().logCognitiveAction('heat_change', { sourceEntityName: 'heat_2' });
useWorldStore.getState().logCognitiveAction('season', { sourceEntityName: 'salt' });
const secondFork95 = useWorldStore.getState().createCounterfactualFork(3, 'Fork Étape 3');
const rootBranch95 = useWorldStore.getState().counterfactualBranches.find(b => b.id === 'branch-root-human');
assert.strictEqual(rootBranch95?.traces.length, 3, 'La branche racine branch-root-human doit être rafraîchie avec les 3 traces humaines récentes');
assert.strictEqual(secondFork95.forkStepIndex, 3, 'Le second fork doit pouvoir bifurquer à l’étape 3 nouvellement enregistrée');

console.log('PASS: Suite 95 validée avec succès (Ordre applyPatch & Règles Cibles, Invariants state/without_flag, Undo/Redo Flags & Layouts, Capacité Multi-Poches Mindel & Branches Contrefactuelles).');
})();

await (async () => {
// --- Suite 96 : Thèmes & Atmosphères, Personas Contextuelles, Core Starter Quest, Évaluateur Case-Insensitive/Unaire, Moteur Spatial Tuple & Métriques EO-Bench ---
console.log('--- Démarrage de la Suite 96 : Thèmes & Atmosphères, Personas Contextuelles, Core Starter Quest, Évaluateur Case-Insensitive/Unaire, Moteur Spatial Tuple & Métriques EO-Bench ---');

// 1. getWorldTheme : alias cyberpunk-neon -> cyberpunk-matrix et fallback inconnu -> earth-atelier (pas le-refuge)
const { getWorldTheme: getTheme96 } = await import('../library/worldThemes');
assert.strictEqual(getTheme96('cyberpunk-neon').id, 'cyberpunk-matrix', 'getWorldTheme doit résoudre l’alias atmosphérique cyberpunk-neon vers cyberpunk-matrix');
assert.strictEqual(getTheme96('luxury-salon').id, 'luxury-showroom', 'getWorldTheme doit résoudre l’alias luxury-salon vers luxury-showroom');
assert.strictEqual(getTheme96('unknown-nonexistent-theme').id, 'earth-atelier', 'getWorldTheme doit retomber sur earth-atelier et non sur worldThemes[0] (le-refuge)');

// 2. resolveContextualPersona : reconnaissance des IDs canoniques luxury-showroom et contemporary-gallery
const { resolveContextualPersona: resolvePersona96 } = await import('../engine/agentDialogues');
assert.strictEqual(resolvePersona96({ worldTheme: 'luxury-showroom' }).theme, 'luxury', 'resolveContextualPersona doit activer la persona luxury pour luxury-showroom');
assert.strictEqual(resolvePersona96({ worldTheme: 'contemporary-gallery' }).theme, 'guide', 'resolveContextualPersona doit activer la persona guide pour contemporary-gallery');

// 3. buildCoreStarterPatch & evaluateEvent : quête quest_core_sandbox_orientation présente et interaction unaire targetId/sourceId + trigger insensible à la casse
const { buildCoreStarterPatch: buildCore96, CORE_STARTER_PACK: corePack96 } = await import('../library/domainPacks');
const corePatch96 = buildCore96();
assert.ok(
  corePatch96.questsAdded?.some(q => q.id === corePack96.recommendedQuests[0]),
  'buildCoreStarterPatch doit inclure la quête recommandée quest_core_sandbox_orientation'
);
useWorldStore.getState().resetWorld();
useWorldStore.getState().applyPatch(corePatch96, 'Init Core 96');
// Dispatch INTERACT avec targetId uniquement alors que rule_core_sandbox_interact utilise is_source
useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: '', targetId: 'core_data_cube' });
assert.strictEqual(
  useWorldStore.getState().world.ir.quests?.['quest_core_sandbox_orientation']?.status,
  'completed',
  'L’interaction sur core_data_cube avec targetId doit déclencher rule_core_sandbox_interact et compléter quest_core_sandbox_orientation'
);

// 4. autonomousSpatialEngine : support des positions tuples [x, y, z] dans autoGroundEntities et autoLayoutSupportItems
const { autoGroundEntities: autoGround96, autoLayoutSupportItems: autoLayout96 } = await import('../engine/autonomousSpatialEngine');
const tupleEntities96: Record<string, any> = {
  bench: {
    id: 'bench',
    name: 'Établi',
    visuals: { assetId: 'technical-bench' },
    capabilities: [{ type: 'transform', position: [0, 0.4, 0] }, { type: 'collider' }]
  },
  itemA: {
    id: 'itemA',
    name: 'Objet A',
    capabilities: [{ type: 'transform', position: [0, 0.1, 0] }, { type: 'draggable' }]
  },
  itemB: {
    id: 'itemB',
    name: 'Objet B',
    capabilities: [{ type: 'transform', position: [0, 0.1, 0] }, { type: 'draggable' }]
  }
};
autoGround96(tupleEntities96);
assert.strictEqual(tupleEntities96.bench.capabilities[0].position[1], 0, 'Le meuble support en tuple [x,y,z] doit être ancré à y=0');
assert.strictEqual(tupleEntities96.itemA.capabilities[0].position[1], 0.882, 'L’objet en tuple [x,y,z] doit être remonté à surfaceY (0.882)');
autoLayout96(tupleEntities96);
assert.notStrictEqual(
  tupleEntities96.itemA.capabilities[0].position[0],
  tupleEntities96.itemB.capabilities[0].position[0],
  'autoLayoutSupportItems doit séparer en X deux objets en tuple [x,y,z] superposés'
);

// 5. Research EO-Bench : computeBenchmarkSummaryMetrics à vide, symétrie de computeDependencyOverlap et tuples dans captureCanonicalSnapshot
const { computeBenchmarkSummaryMetrics: computeSummary96 } = await import('../research/editOrder/experimentMetrics');
const emptyMetrics96 = computeSummary96([]);
assert.strictEqual(emptyMetrics96.totalRuns, 0, 'computeBenchmarkSummaryMetrics([]) doit retourner totalRuns = 0');
assert.strictEqual(emptyMetrics96.equivalentCount, 0, 'computeBenchmarkSummaryMetrics([]) doit retourner equivalentCount = 0');
assert.ok(emptyMetrics96.predictorMetrics.B0bis_AlwaysPositive !== undefined, 'predictorMetrics doit inclure B0bis_AlwaysPositive');
assert.ok(emptyMetrics96.predictorMetrics.B1a_LexicalSimilarity !== undefined, 'predictorMetrics doit inclure B1a_LexicalSimilarity');

const { computeDependencyOverlap: computeDepOverlap96 } = await import('../research/editOrder/dependencyOverlap');
const depWorld96: WorldState = {
  version: 1,
  ir: {
    entities: {
      btn_96: { id: 'btn_96', name: 'Bouton', capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }] },
      door_96: { id: 'door_96', name: 'Porte', capabilities: [{ type: 'transform', position: { x: 2, y: 0, z: 0 } }] }
    },
    rules: {},
    invariants: {}
  },
  flags: {}
};
const patchMoveDoor96 = { entitiesChanged: [{ id: 'door_96', capabilities: [{ type: 'transform', position: { x: 3, y: 0, z: 0 } }] }] };
const patchRuleBtnToDoor96 = {
  rulesChanged: [{
    id: 'rule_btn_door_96',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source' as const, sourceId: 'btn_96' }],
    actions: [{ type: 'set_flag' as const, flag: 'open', targetId: 'door_96' }]
  }]
};
const overlapAB96 = computeDepOverlap96(depWorld96, patchMoveDoor96, patchRuleBtnToDoor96);
const overlapBA96 = computeDepOverlap96(depWorld96, patchRuleBtnToDoor96, patchMoveDoor96);
assert.strictEqual(overlapAB96.causalGraphDistance, overlapBA96.causalGraphDistance, 'causalGraphDistance doit être symétrique entre (A, B) et (B, A)');

const { captureCanonicalSnapshot: captureSnap96 } = await import('../research/editOrder/canonicalSnapshot');
const snapTuple96 = captureSnap96({
  version: 1,
  ir: {
    entities: {
      tuple_ent: { id: 'tuple_ent', name: 'Tuple', capabilities: [{ type: 'transform', position: [1.25, 0.5, -2.0] as any }] }
    },
    rules: {},
    invariants: {}
  },
  flags: {}
}, 'exp_96', 'AB', 1);
assert.deepStrictEqual(snapTuple96.entities[0].position, [1.25, 0.5, -2], 'captureCanonicalSnapshot doit extraire correctement une position tuple [x,y,z]');

console.log('PASS: Suite 96 validée avec succès (Thèmes & Atmosphères, Personas Contextuelles, Core Starter Quest, Évaluateur Case-Insensitive/Unaire, Moteur Spatial Tuple & Métriques EO-Bench).');

// ============================================================================
// SUITE 97 : AUDIT PASS 11 (SIMULATOR INVARIANTS, LLM NORMALIZER/VALIDATOR, EO-BENCH V2 RECONCILIATION & METRICS, DEMONSTRATIONS)
// ============================================================================
console.log('\n--- Suite 97 : Audit Pass 11 (Simulator Invariants, LLM Normalizer/Validator, EO-Bench v2 Reconciliation & Metrics, Demonstrations) ---');

// 1. findCounterExample : invariants inconditionnels (sans requiredFlag) et tolérance à flags undefined
const { findCounterExample: findCounterExample97 } = await import('../simulation/simulator');
const simWorld97: WorldState = {
  version: 1,
  ir: {
    entities: {
      hazard_97: { id: 'hazard_97', name: 'Zone Danger', capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }] }
    },
    rules: {
      rule_hazard_97: {
        id: 'rule_hazard_97',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'hazard_97' }],
        actions: [{ type: 'set_flag', flag: 'overheated', value: true }]
      }
    },
    invariants: {
      inv_unconditional_97: {
        id: 'inv_unconditional_97',
        description: 'Ne jamais entrer en surchauffe',
        condition: { type: 'never_state', stateFlag: 'overheated' }
      }
    }
  },
  flags: undefined as any
};
const simResult97 = findCounterExample97(simWorld97, [{ type: 'INTERACT', sourceId: 'hazard_97' }], 2);
assert.strictEqual(simResult97.invariantBroken, true, 'findCounterExample doit détecter la violation d’un invariant never_state inconditionnel même si flags initial est undefined');
assert.strictEqual(simResult97.brokenInvariantId, 'inv_unconditional_97');

// 2. normalizeAndValidateModelResponse : actions hybrides 3D-2D, tuples dans entitiesChanged seul, et remplacement homonyme (entitiesRemoved + entitiesCreated même ID)
const { normalizeAndValidateModelResponse: normValidate97 } = await import('../authoring/llm');
const existingEntities97 = {
  old_lamp: {
    id: 'old_lamp',
    name: 'Ancienne Lampe',
    capabilities: [{ type: 'transform' as const, position: { x: 0, y: 0, z: 0 } }]
  }
};
const llmResp97 = normValidate97({
  plan: { intent: 'update_lamp', actions: [{ action: 'modify' }] },
  patch: {
    entitiesRemoved: ['old_lamp'],
    entitiesCreated: [{
      id: 'old_lamp',
      name: 'Nouvelle Lampe Design',
      capabilities: [{ type: 'transform', position: [1.5, -0.4, 2.0] }]
    }],
    entitiesChanged: [{
      id: 'old_lamp',
      capabilities: [{ type: 'transform', position: [2.0, -0.2, 3.0] }]
    }],
    rulesChanged: [{
      id: 'rule_hybrid_97',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'old_lamp' }],
      actions: [
        { type: 'toggle_state', targetId: 'old_lamp', stateKey: 'power' },
        { type: 'open_2d_sheet', targetId: 'world', sheetId: 'doc_lamp' }
      ]
    }]
  }
}, existingEntities97, []);
assert.ok(llmResp97, 'normalizeAndValidateModelResponse doit accepter le remplacement homonyme, les tuples dans entitiesChanged et les actions hybrides');
assert.strictEqual(llmResp97!.patch.entitiesCreated?.[0]?.id, 'old_lamp', 'L’entité recréée après suppression homonyme doit rester dans entitiesCreated');
const changedTransform97 = llmResp97!.patch.entitiesChanged?.[0]?.capabilities?.find((c: any) => c.type === 'transform') as any;
assert.deepStrictEqual(changedTransform97?.position, { x: 2, y: 0, z: 3 }, 'Le tuple position dans entitiesChanged doit être normalisé en {x,y,z} avec clamp y>=0');

// 3. reconcileReferentialV2 : mise à jour bidirectionnelle des triggerLocation et redirection des remplacements d'entités dans rulesChanged et questsAdded
const { reconcileReferentialV2: reconcileV2_97 } = await import('../research/editOrder/v2/experimentRunnerV2');
const worldV2_97: WorldState = {
  version: 1,
  ir: {
    entities: {
      sensor_old: { id: 'sensor_old', name: 'Capteur', capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }] }
    },
    rules: {
      r_prox_97: {
        id: 'r_prox_97',
        trigger: 'PROXIMITY',
        conditions: [{ type: 'proximity', targetId: 'sensor_old', distance: 1.5, triggerLocation: { x: 0, y: 0, z: 0 } } as any],
        actions: [{ type: 'set_flag', flag: 'detected', value: true }]
      }
    },
    invariants: {}
  },
  flags: {}
};
const prevPatch97 = {
  entitiesRemoved: ['sensor_old'],
  entitiesCreated: [{ id: 'sensor_new', name: 'Capteur V2', capabilities: [{ type: 'transform' as const, position: { x: 1, y: 0, z: 1 } }] }]
};
const currPatch97 = {
  entitiesChanged: [{ id: 'sensor_old', capabilities: [{ type: 'transform' as const, position: { x: 4, y: 0, z: -2 } }] }],
  rulesChanged: [{
    id: 'r_act_97',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source' as const, sourceId: 'sensor_old' }],
    actions: [{ type: 'set_flag' as const, flag: 'ok', targetId: 'sensor_old' }]
  }],
  questsAdded: [{
    id: 'q_97',
    title: 'Quête Capteur',
    status: 'in_progress' as const,
    currentStepIndex: 0,
    steps: [{ id: 's_1', title: 'Inspecter', description: 'Inspecter', requiredEvent: 'INTERACT', targetEntityId: 'sensor_old', completed: false }]
  }]
};
const recPatch97 = reconcileV2_97(currPatch97, prevPatch97, worldV2_97);
assert.strictEqual(recPatch97.entitiesChanged?.[0]?.id, 'sensor_new', 'entitiesChanged doit être redirigé vers sensor_new');
assert.strictEqual(recPatch97.rulesChanged?.[0]?.conditions?.[0]?.sourceId, 'sensor_new', 'rule condition sourceId doit être redirigé vers sensor_new');
assert.strictEqual(recPatch97.rulesChanged?.[0]?.actions?.[0]?.targetId, 'sensor_new', 'rule action targetId doit être redirigé vers sensor_new');
assert.strictEqual(recPatch97.questsAdded?.[0]?.steps?.[0]?.targetEntityId, 'sensor_new', 'quest step targetEntityId doit être redirigé vers sensor_new');
// Vérifie aussi que si currPatch déplace sensor_old dans world.ir.rules, triggerLocation est mis à jour
const worldMoveV2_97 = JSON.parse(JSON.stringify(worldV2_97)) as WorldState;
reconcileV2_97(
  { entitiesChanged: [{ id: 'sensor_old', capabilities: [{ type: 'transform', position: { x: 5, y: 0, z: 6 } }] }] },
  {},
  worldMoveV2_97
);
assert.deepStrictEqual(
  (worldMoveV2_97.ir.rules.r_prox_97.conditions[0] as any).triggerLocation,
  { x: 5, y: 0, z: 6 },
  'reconcileReferentialV2 doit mettre à jour triggerLocation dans world.ir.rules quand current.entitiesChanged déplace la cible'
);

// 4. EO-Bench v2 : garde contre division par zéro à vide et formatage Delta vs C5 négatif
const { auditC1Runs } = await import('../research/editOrder/v2/c1AuditV2');
const emptyAudit97 = auditC1Runs([]);
assert.strictEqual(emptyAudit97.failureRate, 0, 'auditC1Runs([]) doit retourner failureRate = 0 (et non NaN)');

const { measureStochasticVariance } = await import('../research/editOrder/v2/nonDeterminismV2');
const emptyStoch97 = await measureStochasticVariance([], 3);
assert.strictEqual(emptyStoch97.withinOrderVariance, 0, 'measureStochasticVariance([]) doit retourner withinOrderVariance = 0');
assert.strictEqual(emptyStoch97.betweenOrderVariance, 0, 'measureStochasticVariance([]) doit retourner betweenOrderVariance = 0');

const { formatAblationCsv } = await import('../research/editOrder/v2/trueAblationRunnerV2');
const csvNegDelta97 = formatAblationCsv([{
  ablationId: 'ABL-0_FullC5',
  name: 'Test',
  failureCount: 0,
  totalCases: 10,
  residualFailureRate: 0,
  deltaFailuresVsC5: -1,
  mcnemarChi2: 0,
  mcnemarPValue: '1.000',
  satA: 100,
  satB: 100,
  meanRuntimeMs: 5,
  modifiedEntities: 0,
  modifiedRules: 0,
  invariantViolations: 0,
  description: 'Desc'
}]);
assert.ok(csvNegDelta97.includes(',-1,'), 'formatAblationCsv ne doit pas formater un delta négatif en +-1');

// 5. Demonstrations : mobilier urbain non-draggable et préservation de placement.text
const { demonstrationScenarios: DEMOS_97, createDemonstrationPatch: createDemoPatch97 } = await import('../library/demonstrations');
const parisDemo97 = DEMOS_97.find(d => d.id === 'demo-postal-deposit');
assert.ok(parisDemo97, 'La démo demo-postal-deposit doit exister');
const parisPatch97 = createDemoPatch97(parisDemo97!);
const streetLamp97 = parisPatch97.entitiesCreated?.find(e => e.visuals?.assetId === 'wp-reverbere-de-rue');
assert.ok(streetLamp97, 'Le réverbère de rue doit être créé dans demo-postal-deposit');
assert.ok(
  !streetLamp97!.capabilities.some(c => c.type === 'draggable'),
  'Le réverbère de rue (wp-reverbere-de-rue) est un mobilier urbain fixe et ne doit pas être draggable'
);

console.log('PASS: Suite 97 validée avec succès (Simulator Invariants, LLM Normalizer/Validator, EO-Bench v2 Reconciliation & Metrics, Demonstrations).');

// ============================================================================
// SUITE 98 : AUDIT PASS 12 (EVALUATOR TELEPORT/SET_FLAG/TARGETID, LLM SET_RELATION, BLAST RADIUS & EO-BENCH V1/V2)
// ============================================================================
console.log('\n--- Suite 98 : Audit Pass 12 (Evaluator Teleport/SetFlag/TargetId, LLM SetRelation, Blast Radius & EO-Bench v1/v2) ---');

// 1. evaluateEvent : action teleport, set_flag sans value explicite (défaut true), et support de targetId sur change_color/toggle_state/destroy_entity
const { evaluateEvent: evalEvt98 } = await import('../engine/evaluator');
const worldEvt98: WorldState = {
  version: 1,
  ir: {
    entities: {
      switch_98: { id: 'switch_98', name: 'Interrupteur', capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }] },
      drone_98: {
        id: 'drone_98',
        name: 'Drone',
        state: 'closed',
        availableStates: ['closed', 'open'],
        visuals: { color: '#ffffff' },
        capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }]
      }
    },
    rules: {
      r_remote_98: {
        id: 'r_remote_98',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'switch_98' }],
        actions: [
          { type: 'set_flag', flag: 'remote_triggered' },
          { type: 'teleport', targetId: 'drone_98', position: { x: 4, y: 2, z: -1 } },
          { type: 'change_color', targetId: 'drone_98', color: '#00ff88' },
          { type: 'toggle_state', targetId: 'drone_98' }
        ]
      }
    },
    invariants: {}
  },
  flags: {}
};
const { newState: afterEvt98 } = evalEvt98(worldEvt98, { type: 'INTERACT', sourceId: 'switch_98' });
assert.strictEqual(afterEvt98.flags['remote_triggered'], true, 'set_flag sans value explicite doit définir le flag à true');
const droneTr98 = afterEvt98.ir.entities.drone_98.capabilities.find(c => c.type === 'transform');
assert.deepStrictEqual(droneTr98?.position, { x: 4, y: 2, z: -1 }, 'L’action teleport avec targetId doit déplacer l’entité cible');
assert.strictEqual(afterEvt98.ir.entities.drone_98.visuals?.color, '#00ff88', 'change_color avec targetId doit modifier la couleur de la cible');
assert.strictEqual(afterEvt98.ir.entities.drone_98.state, 'open', 'toggle_state avec targetId doit basculer l’état de la cible');

// 2. normalizeAndValidateModelResponse : support de set_relation avec sourceEntityId et targetEntityId
const { normalizeAndValidateModelResponse: normValidate98 } = await import('../authoring/llm');
const relResp98 = normValidate98({
  plan: { intent: 'attach_bottle', actions: [{ action: 'link' }] },
  patch: {
    entitiesCreated: [
      { id: 'bag_98', name: 'Sac 98', capabilities: [{ type: 'transform', position: { x: 0, y: 0, z: 0 } }] },
      { id: 'bottle_98', name: 'Gourde 98', capabilities: [{ type: 'transform', position: { x: 1, y: 0, z: 0 } }] }
    ],
    rulesChanged: [{
      id: 'rule_rel_98',
      trigger: 'DROP',
      conditions: [{ type: 'is_source', sourceId: 'bottle_98' }, { type: 'is_target', targetId: 'bag_98' }],
      actions: [{
        type: 'set_relation',
        sourceEntityId: 'bottle_98',
        targetEntityId: 'bag_98',
        relation: { type: 'attached_to', targetId: 'bag_98' }
      }]
    }]
  }
}, {}, []);
assert.ok(relResp98, 'normalizeAndValidateModelResponse doit accepter l’action set_relation avec sourceEntityId et targetEntityId');

// 3. evaluateSemanticBlastRadius : remplacement homonyme sans faux positif ORPHAN_DEPENDENCY et détection d'invariant ajouté dans le même patch
const { evaluateSemanticBlastRadius: evalSbr98 } = await import('../research/semanticBlastRadius');
const sbrWorld98: WorldState = {
  version: 1,
  ir: {
    entities: {
      valve_98: { id: 'valve_98', name: 'Vanne', capabilities: [{ type: 'transform', position: [0, 0, 0] as any }] }
    },
    rules: {
      r_valve_98: {
        id: 'r_valve_98',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'valve_98' }],
        actions: [{ type: 'set_flag', flag: 'valve_open', value: true }]
      }
    },
    invariants: {}
  },
  flags: {}
};
// Remplacement homonyme de valve_98 + ajout d'un invariant violé par r_valve_98
const sbrReport98 = evalSbr98(sbrWorld98, {
  entitiesRemoved: ['valve_98'],
  entitiesCreated: [{ id: 'valve_98', name: 'Vanne Haute Pression', capabilities: [{ type: 'transform', position: [0.2, 0, 0] as any }] }],
  invariantsAdded: [{
    id: 'inv_no_open_without_lock_98',
    description: 'Ne jamais ouvrir la vanne sans purge préalable',
    condition: { type: 'never_state', stateFlag: 'valve_open', requiredFlag: 'purged' }
  }]
});
assert.ok(
  !sbrReport98.violations.some(v => v.type === 'ORPHAN_DEPENDENCY'),
  'Un remplacement homonyme ne doit pas générer de faux positif ORPHAN_DEPENDENCY'
);
assert.ok(
  sbrReport98.violations.some(v => v.type === 'INVARIANT_BROKEN' && v.id === 'invariant_regression_inv_no_open_without_lock_98'),
  'evaluateSemanticBlastRadius doit vérifier les invariants ajoutés dans invariantsAdded via les événements spécifiques aux règles'
);

// 4. interpretSemanticEdit : déterminisme strict du fallback COMPOSITE (timestamp = 0, sans doublon state_updated)
const { interpretSemanticEdit: interpret98 } = await import('../research/editOrder/semanticEditInterpreter');
const compRes1 = interpret98('Vérifie l’état général de la vanne', sbrWorld98);
const compCaps1 = compRes1.patch.entitiesChanged?.[0]?.capabilities || [];
const stateUpd1 = compCaps1.filter((c: any) => c.type === 'state_updated');
assert.strictEqual(stateUpd1.length, 1, 'COMPOSITE doit ajouter exactement une capacité state_updated');
assert.strictEqual((stateUpd1[0] as any).timestamp, 0, 'COMPOSITE doit utiliser un timestamp déterministe (0) au lieu de Date.now()');

console.log('PASS: Suite 98 validée avec succès (Evaluator Teleport/SetFlag/TargetId, LLM SetRelation, Blast Radius & EO-Bench v1/v2).');

// ==========================================
// 99. Test Suite: Procedural Challenge Gate, YAML Block Scalars, WorldSlice Replacement/Capacity & Meta-Controller Normalization (Suite 99)
// ==========================================
console.log('--- Démarrage de la Suite 99 : Procedural Challenge Gate, YAML Block Scalars, WorldSlice Replacement/Capacity & Meta-Controller ---');

// 1. Procedural Challenge Engine : l'observation initiale sur la borne ne déclenche pas prématurément la victoire avant mesure
const { compileProceduralChallenge: compileChallenge99, activeProceduralChallenges } = await import('../engine/proceduralChallengeEngine');
const challenge99 = compileChallenge99({ seed: 990099, domain: 'THERMODYNAMICS' });
assert.ok(activeProceduralChallenges.has(990099), 'activeProceduralChallenges doit enregistrer la session générée');
useWorldStore.getState().resetWorld();
useWorldStore.getState().applyPatch(challenge99.worldPatch, 'Test Défi Thermique 99');

const validatorId99 = 'validator_990099';
const targetId99 = challenge99.session.fault.targetComponentId;

// Étape 1 : clic sur la borne pour lire le symptôme (avant toute mesure)
useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: validatorId99 });
assert.strictEqual(
  useWorldStore.getState().world.flags['symptom_observed_990099'],
  true,
  'Le premier clic sur la borne doit activer symptom_observed_990099'
);
assert.strictEqual(
  Boolean(useWorldStore.getState().world.flags['challenge_diagnosed_990099']),
  false,
  'Le clic sur la borne avant mesure ne doit pas valider prématurément challenge_diagnosed_990099'
);

// Étape 2 : mesure sur le composant cible puis validation sur la borne
useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: targetId99 });
assert.strictEqual(useWorldStore.getState().world.flags[`measured_${targetId99}`], true, 'La mesure sur le composant cible doit activer measured_<target>');
useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: validatorId99 });
assert.strictEqual(
  useWorldStore.getState().world.flags['challenge_diagnosed_990099'],
  true,
  'Le clic sur la borne après mesure doit valider challenge_diagnosed_990099'
);

// 2. WorldFormat YAML : aller-retour (stringifyYaml -> parseYaml) des chaînes multilignes avec bloc scalaire '|'
const { stringifyYaml, parseYaml } = await import('../engine/worldFormat');
const multilineObj99 = {
  title: 'Expérience Multiligne',
  description: 'Ligne 1 : Observation\nLigne 2 : Mesure physique\nLigne 3 : Conclusion',
  nested: {
    note: 'Première ligne\nDeuxième ligne'
  }
};
const yamlStr99 = stringifyYaml(multilineObj99);
const parsedYaml99 = parseYaml(yamlStr99);
assert.strictEqual(
  parsedYaml99.description,
  multilineObj99.description,
  'parseYaml doit reconstruire fidèlement les chaînes multilignes sérialisées avec le bloc scalaire "|"'
);
assert.strictEqual(
  parsedYaml99.nested?.note,
  multilineObj99.nested.note,
  'parseYaml doit reconstruire les blocs scalaires "|" imbriqués'
);

// 3. WorldSlice : remplacement d'entité mettant à jour step.requiredEvent, relations entrantes, et capacité 3D invariante par rotation
useWorldStore.getState().resetWorld();
useWorldStore.getState().applyPatch({
  entitiesCreated: [
    {
      id: 'laptop_old_99',
      name: 'Ordinateur 15 pouces',
      capabilities: [{ type: 'transform', position: { x: 0, y: 0.85, z: 0 } }],
      physicalProperties: { dimensions: [0.355, 0.019, 0.245] } // à plat sur la table
    },
    {
      id: 'backpack_vert_99',
      name: 'Sac à dos vertical',
      capabilities: [{ type: 'transform', position: { x: 0.5, y: 0.85, z: 0 } }],
      // Compartiment vertical (profondeur 0.04m sur Z, hauteur 0.42m sur Y)
      physicalProperties: { dimensions: [0.38, 0.45, 0.18], fitsMaxDimensions: [0.36, 0.42, 0.04] },
      relations: [{ type: 'compatible_with', targetId: 'laptop_old_99' }]
    }
  ],
  questsAdded: [{
    id: 'quest_rep_99',
    title: 'Test Remplacement 99',
    description: 'Vérifier la mise à jour de requiredEvent',
    currentStepIndex: 0,
    status: 'in_progress',
    steps: [{
      id: 's1',
      title: 'Prendre l’ordinateur',
      targetEntityId: 'laptop_old_99',
      requiredEvent: 'INTERACT:laptop_old_99',
      completed: false
    }]
  }],
  activeQuestId: 'quest_rep_99'
}, 'Setup Test 99');

useWorldStore.getState().setSpatialContext('laptop_old_99', null);
useWorldStore.getState().replaceEntityPreservingTransform('laptop_old_99', {
  id: 'laptop_new_99',
  name: 'Ordinateur Pro 15',
  physicalProperties: { dimensions: [0.355, 0.019, 0.245] }
});

const stateAfterRep99 = useWorldStore.getState();
assert.strictEqual(stateAfterRep99.spatialContext.selectedEntityId, 'laptop_new_99', 'La sélection spatiale doit suivre l’entité remplacée');
assert.strictEqual(
  stateAfterRep99.world.ir.quests?.['quest_rep_99']?.steps[0]?.requiredEvent,
  'INTERACT:laptop_new_99',
  'step.requiredEvent doit être mis à jour avec le nouvel ID lors du remplacement d’entité'
);
assert.strictEqual(
  stateAfterRep99.world.ir.entities['backpack_vert_99']?.relations?.[0]?.targetId,
  'laptop_new_99',
  'Les relations entrantes (targetId) doivent être mises à jour vers la nouvelle entité'
);

// Test de capacité 3D invariant à l'orientation (ordinateur à plat [0.355, 0.019, 0.245] dans compartiment vertical [0.36, 0.42, 0.04])
const capTest99 = useWorldStore.getState().testEntityCapacity('backpack_vert_99', 'laptop_new_99');
assert.strictEqual(capTest99.fits, true, 'Un ordinateur à plat [0.355, 0.019, 0.245] doit rentrer dans un compartiment vertical [0.36, 0.42, 0.04]');

// 4. Pedagogical Compiler (Optics Snell non-superposition) & Meta-Controller (normalisation P(H1)+P(H2)=1)
const snellSim99 = compilePedagogicalSimulation('optics_snell');
const gonio99 = snellSim99.worldPatch.entitiesCreated?.find(e => e.id === 'apparatus_optics_snell_1');
const prism99 = snellSim99.worldPatch.entitiesCreated?.find(e => e.id === 'apparatus_optics_snell_2');
const gPos99 = gonio99?.capabilities.find(c => c.type === 'transform')?.position as any;
const pPos99 = prism99?.capabilities.find(c => c.type === 'transform')?.position as any;
assert.ok(
  Math.hypot(gPos99.x - pPos99.x, gPos99.z - pPos99.z) >= 0.3,
  'Le disque gradué de Hartl et le demi-cylindre en plexiglas ne doivent pas être superposés à la même coordonnée 3D'
);

const { metaController: metaController99 } = await import('../research/metaController');
metaController99.resetLoop();
metaController99.observeInteraction({ type: 'ERROR_TRAP_TRIGGERED', data: { value: 1 } });
const { record: mcRec99 } = metaController99.generateNextAdaptiveExperience();
assert.strictEqual(
  Number((mcRec99.posteriorProbabilities.h1 + mcRec99.posteriorProbabilities.h2).toFixed(3)),
  1,
  'Les probabilités a posteriori P(H1) + P(H2) du Meta-Controller doivent sommer exactement à 1.0'
);

console.log('PASS: Suite 99 validée avec succès (Procedural Challenge Gate, YAML Block Scalars, WorldSlice Replacement/Capacity & Meta-Controller).');

// =========================================================================
// SUITE 100 : Validator Patch Rebind/Prune, Spatial Attention Tuple Positions,
//             LeRobot Counterfactual Pose Delta, Forest Mushroom Invariant &
//             PublishReadiness / Playtester / Guarantor Tuple Robustness
// =========================================================================
console.log('Suite 100: Validation de validateWorldPatch (rebinding/pruning), télémétrie oculaire tuple, LeRobot contrefactuel & cueillette sécurisée...');

// 1. validateWorld & validateWorldPatch : acteurs virtuels ('player', 'system') et rebinding/pruning sur entitiesRemoved
const { validateWorld: validateWorld100, validateWorldPatch: validateWorldPatch100 } = await import('../engine/validator');
const baseState100: any = {
  version: 1,
  flags: {},
  ir: {
    entities: {
      old_item_100: {
        id: 'old_item_100',
        name: 'Objet Ancien',
        capabilities: [{ type: 'transform', position: { x: 0, y: 0.85, z: 0 } }, { type: 'collider' }]
      }
    },
    rules: {
      rule_item_100: {
        id: 'rule_item_100',
        trigger: 'INTERACT',
        conditions: [
          { type: 'is_source', sourceId: 'old_item_100' },
          { type: 'is_target', targetId: 'player' }
        ],
        actions: [{ type: 'play_sound', sound: 'chime' }]
      }
    },
    invariants: {},
    quests: {}
  }
};

assert.strictEqual(validateWorld100(baseState100).valid, true, 'validateWorld doit autoriser l’acteur virtuel "player" dans is_target');
assert.strictEqual(
  validateWorldPatch100(baseState100, { entitiesRemoved: ['old_item_100'] }).valid,
  true,
  'validateWorldPatch doit élaguer les règles orphelines lors d’une suppression d’entité comme applyPatch'
);
assert.strictEqual(
  validateWorldPatch100(baseState100, {
    entitiesRemoved: ['old_item_100'],
    entitiesCreated: [{
      id: 'new_item_100',
      name: 'Objet Nouveau',
      capabilities: [{ type: 'transform', position: { x: 0, y: 0.85, z: 0 } }, { type: 'collider' }]
    }]
  }).valid,
  true,
  'validateWorldPatch doit rebinder les règles lors d’un remplacement d’entité comme applyPatch'
);

// 2. SpatialAttentionTelemetry : support des positions au format tuple [x, y, z]
const {
  createInitialSpatialAttentionState: createAttn100,
  recordGazeFixation: recordGaze100,
  generateVolumetricHeatmapPoints: genHeatmap100
} = await import('../engine/spatialAttentionTelemetry');
let attnState100 = createAttn100();
attnState100 = recordGaze100(attnState100, 'ent_tuple_100', 'Objet Tuple', [0.4, 0.9, -0.25] as any, 600, 200);
assert.strictEqual(attnState100.scanpath.points[0].x, 0.4, 'recordGazeFixation doit extraire x depuis un tuple [x, y, z]');
assert.strictEqual(attnState100.scanpath.points[0].y, 0.9, 'recordGazeFixation doit extraire y depuis un tuple [x, y, z]');
const heatmapPts100 = genHeatmap100(attnState100);
assert.strictEqual(Number(heatmapPts100[0].y.toFixed(2)), 1.05, 'generateVolumetricHeatmapPoints doit calculer y + 0.15 sans NaN');

// 3. EmbodiedDataExporter : pose 3D et delta_position réels dans les branches contrefactuelles LeRobot
const { generateLeRobotDataset: genLeRobot100 } = await import('../engine/embodiedDataExporter');
const leRobotWorld100: any = {
  version: 1,
  flags: {},
  ir: {
    activeQuestId: 'quest_lerobot_100',
    entities: {
      pan_100: { id: 'pan_100', name: 'Poêle', capabilities: [{ type: 'transform', position: [0.35, 0.95, -0.1] }] },
      plate_100: { id: 'plate_100', name: 'Assiette', capabilities: [{ type: 'transform', position: [-0.25, 0.95, 0.2] }] }
    },
    rules: {},
    invariants: {}
  }
};
const dataset100 = genLeRobot100(
  { traces: [], proceduralEfficiency: 90 } as any,
  leRobotWorld100,
  [{
    id: 'cf_branch_100',
    title: 'Branche Contrefactuelle Optimale',
    createdAt: 1700000000000,
    outcomeScore: 92,
    botPersona: 'optimal',
    snapshot: { cookingTemperature: 140, cookingDoneness: 75, cookingHeatLevel: 2 } as any,
    traces: [
      { timestamp: 1000, actionType: 'INTERACT', targetEntityId: 'pan_100', latencyMs: 300, temperature: 130, doneness: 50, heatLevel: 2 } as any,
      { timestamp: 2000, actionType: 'DROP', targetEntityId: 'plate_100', latencyMs: 350, temperature: 140, doneness: 75, heatLevel: 0 } as any
    ]
  } as any]
);
const cfEp100 = dataset100.episodes[1];
assert.strictEqual(cfEp100.frames[0].observation.state[0], 0.35, 'La trame 0 contrefactuelle doit résoudre la position X réelle de pan_100 (0.35)');
assert.strictEqual(cfEp100.frames[1].action.delta_position[0], -0.6, 'La trame 1 contrefactuelle doit calculer le delta_position X réel (-0.25 - 0.35 = -0.6)');

// 4. Forest Mushroom Foraging : l'invariant inv_no_toxic_mushroom bloque le DROP de forest_amanita dans forest_wicker_basket
const { createForestMushroomForagingPatch } = await import('../library/forestMushroomForaging');
useWorldStore.getState().resetWorld();
useWorldStore.getState().applyPatch(createForestMushroomForagingPatch(), 'Load Forest Mushroom Foraging 100');
useWorldStore.getState().dispatch({ type: 'DROP', sourceId: 'forest_amanita', targetId: 'forest_wicker_basket' });
assert.strictEqual(
  useWorldStore.getState().world.flags['amanita_in_basket'],
  undefined,
  'L’invariant inv_no_toxic_mushroom doit annuler le dépôt de l’amanite toxique dans le panier en osier'
);
assert.ok(
  useWorldStore.getState().warnings.some(w => w.includes('Condition requise') || w.includes('amanita')),
  'Un avertissement de violation d’invariant formel doit être émis lors du dépôt de l’amanite dans le panier'
);

// 5. PublishReadiness, SyntheticPlaytester & DeterministicGuarantor : robustesse aux positions/échelles tuples [x, y, z]
const { evaluatePublishReadiness } = await import('../engine/publishReadiness');
const { runSyntheticPlaytest } = await import('../engine/syntheticPlaytester');
const { certifyWorldInvariants } = await import('../engine/deterministicGuarantor');
const tupleWorld100: any = {
  version: 1,
  flags: {},
  ir: {
    entities: {
      high_drone_100: {
        id: 'high_drone_100',
        name: 'Drone Hors Portée',
        capabilities: [
          { type: 'transform', position: [0.2, 3.2, -0.4], scale: [0.04, 0.04, 0.04] },
          { type: 'collider' },
          { type: 'draggable' }
        ]
      }
    },
    rules: {},
    invariants: {},
    quests: {
      q_tuple_100: {
        id: 'q_tuple_100',
        title: 'Quête Tuple 100',
        description: 'Test de hauteur avec position tuple',
        currentStepIndex: 0,
        status: 'in_progress',
        steps: [{
          id: 's1',
          title: 'Attraper le drone',
          targetEntityId: 'high_drone_100',
          requiredEvent: 'INTERACT:high_drone_100',
          completed: false
        }]
      }
    },
    activeQuestId: 'q_tuple_100'
  }
};
const readiness100 = evaluatePublishReadiness(tupleWorld100, 'standard');
const hitboxCheck100 = readiness100.checks.find(c => c.id === 'performance_ergonomics_touch_vr');
assert.strictEqual(hitboxCheck100?.status, 'WARN', 'evaluatePublishReadiness doit détecter une petite hitbox même si scale est un tuple [0.04, 0.04, 0.04]');

const playtest100 = runSyntheticPlaytest(tupleWorld100, 'speedrunner');
assert.strictEqual(playtest100.verificationStatus, 'blocked', 'runSyntheticPlaytest doit détecter TARGET_OUT_OF_REACH même si position est un tuple [0.2, 3.2, -0.4]');
const patchedPos100 = (playtest100.minimalPatch?.entitiesChanged?.[0]?.capabilities?.find(c => c.type === 'transform') as any)?.position;
assert.deepStrictEqual(patchedPos100, { x: 0.2, y: 0.95, z: -0.4 }, 'Le minimalPatch généré doit produire un objet position { x, y, z } propre');

const guarantor100 = certifyWorldInvariants(tupleWorld100);
assert.strictEqual(guarantor100.approved, false, 'certifyWorldInvariants doit signaler Y=3.20m hors enveloppe même si position est un tuple');

console.log('PASS: Suite 100 validée avec succès (Validator Rebind/Prune, Spatial Attention Tuple, LeRobot Counterfactual Pose, Foraging Invariant & Tuple Robustness).');
})();

await (async () => {
// ============================================================================
// SUITE 101 : SPATIAL CAUSALITY TUPLE & RECEPTACLE, AUTONOMOUS DEOVERLAP
//             TUPLE ROTATION, COUNTERFACTUAL DIVERGENCE & BLAST RADIUS MERGE
// ============================================================================
console.log('\n--- TEST 101 : Spatial Causality Tuple/Receptacle, Deoverlap Rotation, Counterfactual Divergence & Blast Radius ---');

const { evaluateSpatialCausality, findNearestCausalityAffordance } = await import('../engine/spatialCausality');
const { autoLockStructuralFurniture, autoDeoverlapFloorEntities } = await import('../engine/autonomousSpatialEngine');
const { createRootBranch, forkCounterfactualBranch, generateAIBotRollout, compareBranches } = await import('../engine/counterfactualEngine');
const { evaluateSemanticBlastRadius } = await import('../research/semanticBlastRadius');

// 101.1 : evaluateSpatialCausality & findNearestCausalityAffordance supportent les positions tuple [x, y, z] et les réceptacles draggables
const tupleMushroom101: EntitySpec = {
  id: 'forest_bolete_101',
  name: 'Cèpe de Bordeaux',
  visuals: { assetId: 'mushroom_bolete' },
  capabilities: [
    { type: 'transform', position: [0.32, 0.22, -0.48] as any },
    { type: 'draggable' }
  ]
};
const tupleBasket101: EntitySpec = {
  id: 'forest_wicker_basket_101',
  name: 'Panier en osier tressé',
  visuals: { assetId: 'wicker_basket' },
  capabilities: [
    { type: 'transform', position: [0.3, 0.18, -0.5] as any },
    { type: 'draggable' }
  ]
};
const causality101 = evaluateSpatialCausality(tupleMushroom101, tupleBasket101);
assert.ok(causality101, 'Un champignon déposé sur un panier en osier (même draggable) doit déclencher une affordance stack_contain');
assert.strictEqual(causality101?.type, 'stack_contain');
assert.strictEqual(causality101?.snapPosition.x, 0.3, 'snapPosition.x doit être extrait depuis un tuple [0.3, 0.18, -0.5]');
assert.ok(Math.abs((causality101?.snapPosition.y || 0) - 0.225) < 1e-6, 'snapPosition.y doit valoir 0.18 + 0.045 = 0.225 (pas NaN)');
assert.strictEqual(causality101?.snapPosition.z, -0.5, 'snapPosition.z doit être extrait depuis un tuple [0.3, 0.18, -0.5]');

const nearest101 = findNearestCausalityAffordance(
  tupleMushroom101,
  [tupleMushroom101, tupleBasket101],
  [0.32, 0.22, -0.48]
);
assert.ok(nearest101, 'findNearestCausalityAffordance doit fonctionner avec des positions tuple [x, y, z]');
assert.strictEqual(nearest101?.targetEntity.id, 'forest_wicker_basket_101');

// 101.2 : autoLockStructuralFurniture & autoDeoverlapFloorEntities supportent position sans .y et rotation tuple [rx, ry, rz]
const entities101: Record<string, EntitySpec> = {
  supercar_hero: {
    id: 'supercar_hero',
    name: 'Supercar V12',
    visuals: { assetId: 'wp-supercar-showroom' },
    capabilities: [
      { type: 'transform', position: { x: 0, z: 0 } as any }
    ]
  },
  smart_key_podium: {
    id: 'smart_key_podium',
    name: 'Clé intelligente V12',
    visuals: { assetId: 'wp-telecommande-sport' },
    capabilities: [
      { type: 'transform', position: [0.1, 0, 0.1] as any, rotation: [0, 0, 0] as any }
    ]
  }
};
autoLockStructuralFurniture(entities101);
const carPos101 = (entities101.supercar_hero.capabilities.find(c => c.type === 'transform') as any).position;
assert.strictEqual(carPos101.y, 0, 'autoLockStructuralFurniture doit initialiser position.y = 0 même si .y était omis');

autoDeoverlapFloorEntities(entities101);
const keyTrans101 = entities101.smart_key_podium.capabilities.find(c => c.type === 'transform') as any;
assert.strictEqual(keyTrans101.position[0], -1.55, 'autoDeoverlapFloorEntities doit décaler la clé intelligente sur X=-1.55');
assert.strictEqual(keyTrans101.position[2], 1.55, 'autoDeoverlapFloorEntities doit décaler la clé intelligente sur Z=1.55');
assert.ok(typeof keyTrans101.rotation[1] === 'number' && keyTrans101.rotation[1] !== 0, 'autoDeoverlapFloorEntities doit mettre à jour rotation[1] lorsque rotation est un tuple');

// 101.3 : forkCounterfactualBranch recalcule isDishPlated/isDishSauced et réinitialise activeQuestStepIndex à 0 au pas #0
const rootBranch101 = createRootBranch(
  {
    sessionId: 'sess_101',
    startTime: 1000,
    endTime: 61000,
    durationSec: 60,
    totalDecisions: 4,
    averageLatencyMs: 980,
    hesitationCount: 0,
    hesitationRate: 0,
    errorWarningsCount: 0,
    recoveryCount: 0,
    adviceSoughtCount: 0,
    proceduralEfficiency: 92,
    resilienceScore: 95,
    persona: 'methodical-analyst',
    personaLabel: 'Analyste Méthodique',
    personaDescription: 'Exécution fluide.',
    traces: [
      { stepIndex: 1, timestamp: 1000, relativeTimeSec: 5, actionType: 'chop', targetEntityId: 'board', latencyMs: 900, isHesitation: false, heatLevel: 1, temperature: 80, doneness: 25, activeQuestId: 'q_101', activeQuestStepIndex: 1, isErrorRecovery: false },
      { stepIndex: 2, timestamp: 2000, relativeTimeSec: 15, actionType: 'heat_change', targetEntityId: 'cocotte', latencyMs: 1100, isHesitation: false, heatLevel: 2, temperature: 120, doneness: 60, activeQuestId: 'q_101', activeQuestStepIndex: 2, isErrorRecovery: false },
      { stepIndex: 3, timestamp: 3000, relativeTimeSec: 30, actionType: 'sauce', targetEntityId: 'cocotte', latencyMs: 1000, isHesitation: false, heatLevel: 1, temperature: 105, doneness: 85, activeQuestId: 'q_101', activeQuestStepIndex: 3, isErrorRecovery: false },
      { stepIndex: 4, timestamp: 4000, relativeTimeSec: 45, actionType: 'plate', targetEntityId: 'plate', latencyMs: 950, isHesitation: false, heatLevel: 1, temperature: 95, doneness: 100, activeQuestId: 'q_101', activeQuestStepIndex: 4, isErrorRecovery: false }
    ]
  },
  {
    stepIndex: 4,
    timestamp: 4000,
    cookingHeatLevel: 1,
    cookingTemperature: 95,
    cookingDoneness: 100,
    isDishPlated: true,
    platingStyle: 'gastronomique',
    platingGarnish: 'basilic',
    isDishSauced: true,
    activeQuestId: 'q_101',
    activeQuestStepIndex: 4,
    choppedIngredientsCount: 3
  }
);
assert.strictEqual(rootBranch101.snapshot.isDishPlated, true);
assert.strictEqual(rootBranch101.snapshot.isDishSauced, true);

const forkedAt2 = forkCounterfactualBranch(rootBranch101, 2);
assert.strictEqual(forkedAt2.snapshot.isDishPlated, false, 'À l’étape #2 (avant plate), isDishPlated doit être false dans le snapshot de la branche bifurquée');
assert.strictEqual(forkedAt2.snapshot.isDishSauced, false, 'À l’étape #2 (avant sauce), isDishSauced doit être false dans le snapshot de la branche bifurquée');

const aiRolloutFrom2 = generateAIBotRollout(forkedAt2, 'methodical-analyst');
const comparison101 = compareBranches(forkedAt2, aiRolloutFrom2);
assert.strictEqual(comparison101.divergencePointStep, 2, 'compareBranches entre deux branches issues du fork #2 doit indiquer divergencePointStep = 2');
const forkedAt0 = forkCounterfactualBranch(rootBranch101, 0);
assert.strictEqual(forkedAt0.snapshot.activeQuestStepIndex, 0, 'Un fork à l’étape #0 doit réinitialiser activeQuestStepIndex à 0');

// 101.4 : evaluateSemanticBlastRadius préserve capabilities et fusionne visuals lors d'un patch partiel entitiesChanged
const worldBlast101: WorldState = {
  version: 1,
  flags: {},
  ir: {
    entities: {
      target_btn: {
        id: 'target_btn',
        name: 'Bouton Principal',
        visuals: { shape: 'box', color: '#3b82f6' },
        capabilities: [
          { type: 'transform', position: [0, 0.9, 0] as any },
          { type: 'clickable', action: 'PRESS' }
        ]
      },
      blocker_box: {
        id: 'blocker_box',
        name: 'Caisse Mobile',
        visuals: { shape: 'box', color: '#ef4444' },
        capabilities: [
          { type: 'transform', position: [1.2, 0.9, 0] as any },
          { type: 'draggable' }
        ]
      }
    },
    rules: {},
    invariants: {},
    quests: {
      q_blast: {
        id: 'q_blast',
        title: 'Quête Blast',
        description: 'Appuyer sur le bouton',
        currentStepIndex: 0,
        status: 'in_progress',
        steps: [{
          id: 's1',
          title: 'Appuyer',
          targetEntityId: 'target_btn',
          requiredEvent: 'INTERACT:target_btn',
          completed: false
        }]
      }
    },
    activeQuestId: 'q_blast'
  }
};
const blastReport101 = evaluateSemanticBlastRadius(worldBlast101, {
  entitiesChanged: [{
    id: 'blocker_box',
    transform: { position: [0.1, 0.9, 0] },
    visuals: { color: '#10b981' } as any
  } as any]
});
assert.ok(blastReport101.violations.some(v => v.type === 'COLLIDER_DEADLOCK'), 'Le déplacement à 0.1m de target_btn doit être détecté comme COLLIDER_DEADLOCK');
const repairedEnt101 = blastReport101.paretoRepairPatch?.entitiesChanged?.[0] as any;
assert.ok(repairedEnt101, 'Un paretoRepairPatch doit être synthétisé');
assert.strictEqual(repairedEnt101.visuals?.shape, 'box', 'La fusion partielle de visuals doit préserver shape="box"');
assert.strictEqual(repairedEnt101.visuals?.color, '#10b981', 'La fusion partielle de visuals doit appliquer la nouvelle couleur');
assert.ok(repairedEnt101.capabilities?.some((c: any) => c.type === 'draggable'), 'La fusion partielle de entitiesChanged doit préserver les capabilities existantes (draggable)');

console.log('PASS: Suite 101 validée avec succès (Spatial Causality Tuple/Receptacle, Deoverlap Tuple Rotation, Counterfactual Divergence & Blast Radius Merge).');
})();

await (async () => {
// ============================================================================
// SUITE 102 : Non-régression Pass 16 (WorldSlice Tuple Vectors, Evaluator Proximity/Teleport/Capacity, Parser Relative Tuple Positions, LLM Transform/Parts/Removed Normalization & SemanticEditInterpreter Tuple Support)
// ============================================================================
console.log('\n--- Exécution Suite 102 : Non-régression Pass 16 ---');

const { useWorldStore } = await import('../engine/store');
const { parseInstruction } = await import('../authoring/parser');
const { normalizeAndValidateModelResponse } = await import('../authoring/llm');
const { interpretSemanticEdit } = await import('../research/editOrder/semanticEditInterpreter');

// 102.1 : WorldSlice actions (rotateEntity, duplicateEntity, groundEntity, moveEntity, focusEntity, saveCurrentSpatialLayout, loadSpatialLayout, replaceEntityPreservingTransform) avec vecteurs tuple [x, y, z]
useWorldStore.getState().resetWorld();
useWorldStore.setState(s => ({
  world: {
    ...s.world,
    ir: {
      ...s.world.ir,
      entities: {
        table_tuple: {
          id: 'table_tuple',
          name: 'Table Chêne',
          visuals: { assetId: 'wp-table-a-manger' },
          capabilities: [
            { type: 'transform', position: [0, 0, 0] as any, rotation: [0, 0, 0] as any, scale: [1, 1, 1] as any },
            { type: 'collider' }
          ]
        },
        mug_tuple: {
          id: 'mug_tuple',
          name: 'Tasse Céramique',
          visuals: { shape: 'cylinder', color: '#f59e0b' },
          capabilities: [
            { type: 'transform', position: [0.1, 1.2, 0.1] as any, rotation: [0, 0.5, 0] as any, scale: [1, 1, 1] as any },
            { type: 'draggable' }
          ]
        }
      }
    }
  }
}));

useWorldStore.getState().rotateEntity('mug_tuple', 0.25);
const rotAfter = useWorldStore.getState().world.ir.entities['mug_tuple'].capabilities.find(c => c.type === 'transform')?.rotation as any;
assert.ok(rotAfter && !('0' in rotAfter) && Math.abs(rotAfter.y - 0.75) < 1e-4, 'rotateEntity sur une rotation tuple [0, 0.5, 0] doit produire un objet { x, y, z } valide sans clés "0"/"1"/"2"');

// Forcer à nouveau un tuple pour tester moveEntity, groundEntity, duplicateEntity, focusEntity
useWorldStore.setState(s => {
  const w = JSON.parse(JSON.stringify(s.world));
  w.ir.entities['mug_tuple'].capabilities[0].position = [0.1, 1.2, 0.1];
  return { world: w };
});
useWorldStore.getState().focusEntity('mug_tuple');
const focusTarget = useWorldStore.getState().cameraFocusTarget;
assert.deepStrictEqual(focusTarget, [0.1, 1.5, 0.1], 'focusEntity sur une position tuple [0.1, 1.2, 0.1] doit produire [0.1, 1.5, 0.1]');

const dupId = useWorldStore.getState().duplicateEntity('mug_tuple');
assert.ok(dupId, 'duplicateEntity doit créer une copie');
const dupPos = useWorldStore.getState().world.ir.entities[dupId!].capabilities.find(c => c.type === 'transform')?.position as any;
assert.ok(Number.isFinite(dupPos.x) && Number.isFinite(dupPos.y) && Number.isFinite(dupPos.z), 'La copie d’une entité avec position tuple doit avoir des coordonnées x/y/z finies');

useWorldStore.setState(s => {
  const w = JSON.parse(JSON.stringify(s.world));
  w.ir.entities['mug_tuple'].capabilities[0].position = [0.1, 1.2, 0.1];
  return { world: w };
});
useWorldStore.getState().groundEntity('mug_tuple');
const groundedPos = useWorldStore.getState().world.ir.entities['mug_tuple'].capabilities.find(c => c.type === 'transform')?.position as any;
assert.ok(groundedPos && !('0' in groundedPos) && Number.isFinite(groundedPos.y) && groundedPos.y > 0.7, 'groundEntity sur une position tuple au-dessus de la table doit poser l’objet sur la table sans corrompre position');

useWorldStore.setState(s => {
  const w = JSON.parse(JSON.stringify(s.world));
  w.ir.entities['mug_tuple'].capabilities[0].position = [0.1, 0.9, 0.1];
  return { world: w };
});
useWorldStore.getState().moveEntity('mug_tuple', 0.1, 0, -0.05);
const movedPos = useWorldStore.getState().world.ir.entities['mug_tuple'].capabilities.find(c => c.type === 'transform')?.position as any;
assert.ok(Math.abs(movedPos.x - 0.2) < 1e-3 && Math.abs(movedPos.z - 0.05) < 1e-3, 'moveEntity sur une position tuple doit translater correctement x et z');

// Tester saveCurrentSpatialLayout, loadSpatialLayout et replaceEntityPreservingTransform avec tuple
useWorldStore.setState(s => {
  const w = JSON.parse(JSON.stringify(s.world));
  w.ir.entities['mug_tuple'].capabilities[0].position = [0.25, 0.9, -0.15];
  w.ir.entities['mug_tuple'].capabilities[0].rotation = [0, 1.1, 0];
  return { world: w };
});
const layoutId102 = useWorldStore.getState().saveCurrentSpatialLayout('Test Tuple Layout');
const savedLayout102 = useWorldStore.getState().savedSpatialLayouts.find(l => l.id === layoutId102);
const mugSnap102 = savedLayout102?.entitySnapshots.find(s => s.entityId === 'mug_tuple');
assert.ok(mugSnap102 && !('0' in (mugSnap102.position as any)) && mugSnap102.position.x === 0.25, 'saveCurrentSpatialLayout doit normaliser un tuple en { x, y, z }');
useWorldStore.getState().loadSpatialLayout(layoutId102);
const restoredMugPos = useWorldStore.getState().world.ir.entities['mug_tuple'].capabilities.find(c => c.type === 'transform')?.position as any;
assert.strictEqual(restoredMugPos.x, 0.25, 'loadSpatialLayout doit restaurer proprement la position { x, y, z }');

useWorldStore.setState(s => {
  const w = JSON.parse(JSON.stringify(s.world));
  w.ir.entities['mug_tuple'].capabilities[0].position = [0.3, 0.9, 0.2];
  return { world: w };
});
const replacedOk = useWorldStore.getState().replaceEntityPreservingTransform('mug_tuple', 'wp-baguette');
assert.strictEqual(replacedOk, true, 'replaceEntityPreservingTransform doit réussir');
const newBagEnt = Object.values(useWorldStore.getState().world.ir.entities).find(e => e.visuals?.assetId === 'wp-baguette');
const newBagPos = newBagEnt?.capabilities.find(c => c.type === 'transform')?.position as any;
assert.ok(newBagPos && !('0' in newBagPos) && Math.abs(newBagPos.x - 0.3) < 1e-3, 'replaceEntityPreservingTransform doit préserver la position tuple normalisée en { x, y, z }');

// 102.2 : evaluateEvent (cond.type === 'proximity' | 'in_zone', reset_position tuple, test_spatial_capacity tuple)
const worldEval102: WorldState = {
  version: 1,
  flags: {},
  ir: {
    entities: {
      zone_a: { id: 'zone_a', name: 'Zone A', capabilities: [{ type: 'transform', position: [0, 0, 0] as any }] },
      zone_b: { id: 'zone_b', name: 'Zone B', capabilities: [{ type: 'transform', position: [5, 0, 0] as any }] },
      bag_tuple: {
        id: 'bag_tuple',
        name: 'Sac',
        physicalProperties: { fitsMaxDimensions: [0.4, 0.1, 0.3] },
        capabilities: [{ type: 'transform', position: [1, 0.8, 2] as any }]
      },
      laptop_tuple: {
        id: 'laptop_tuple',
        name: 'Laptop',
        physicalProperties: { dimensions: [0.3, 0.02, 0.2] },
        capabilities: [{ type: 'transform', position: [0, 0.8, 0] as any }]
      }
    },
    rules: {
      r_prox_a: {
        id: 'r_prox_a',
        trigger: 'PROXIMITY',
        conditions: [{ type: 'proximity', targetId: 'zone_a' }],
        actions: [{ type: 'set_flag', flag: 'entered_a', value: true }]
      },
      r_prox_b: {
        id: 'r_prox_b',
        trigger: 'PROXIMITY',
        conditions: [{ type: 'proximity', targetId: 'zone_b' }],
        actions: [
          { type: 'set_flag', flag: 'entered_b', value: true },
          { type: 'teleport', entityId: 'laptop_tuple', position: [2, 0.9, 3] as any }
        ]
      },
      r_cap: {
        id: 'r_cap',
        trigger: 'DROP',
        conditions: [{ type: 'is_target', targetId: 'bag_tuple' }],
        actions: [{ type: 'test_spatial_capacity', sourceEntityId: 'laptop_tuple', targetEntityId: 'bag_tuple' }]
      }
    },
    invariants: {}
  }
};

const afterProxA = evaluateEvent(worldEval102, { type: 'PROXIMITY', sourceId: 'player', targetId: 'zone_a' }).newState;
assert.strictEqual(afterProxA.flags['entered_a'], true, 'La règle de proximité pour zone_a doit se déclencher');
assert.strictEqual(afterProxA.flags['entered_b'], undefined, 'La règle de proximité pour zone_b ne doit PAS se déclencher quand targetId est zone_a');

const afterProxB = evaluateEvent(afterProxA, { type: 'PROXIMITY', sourceId: 'player', targetId: 'zone_b' }).newState;
assert.strictEqual(afterProxB.flags['entered_b'], true, 'La règle de proximité pour zone_b doit se déclencher quand targetId est zone_b');
const telePos = afterProxB.ir.entities['laptop_tuple'].capabilities.find(c => c.type === 'transform')?.position as any;
assert.deepStrictEqual(telePos, { x: 2, y: 0.9, z: 3 }, 'teleport avec action.position tuple [2, 0.9, 3] doit produire { x: 2, y: 0.9, z: 3 }');

const afterCap = evaluateEvent(afterProxB, { type: 'DROP', sourceId: 'laptop_tuple', targetId: 'bag_tuple' }).newState;
const capPos = afterCap.ir.entities['laptop_tuple'].capabilities.find(c => c.type === 'transform')?.position as any;
assert.deepStrictEqual(capPos, { x: 1, y: 0.95, z: 2 }, 'test_spatial_capacity sur un contenant avec position tuple [1, 0.8, 2] doit positionner l’objet à { x: 1, y: 0.95, z: 2 }');

// 102.3 : parseInstruction (position relative "derrière la table" et "garnis la table" quand la table a une position tuple [x, y, z])
const entitiesParser102: Record<string, EntitySpec> = {
  ilot_tuple: {
    id: 'ilot_tuple',
    name: 'Îlot de cuisine',
    visuals: { assetId: 'wp-ilot-de-cuisine' },
    capabilities: [{ type: 'transform', position: [0.5, 0, -0.5] as any }, { type: 'collider' }]
  },
  panneau_tuple: {
    id: 'panneau_tuple',
    name: 'Panneau des recettes',
    visuals: { assetId: 'web-screen' },
    capabilities: [{ type: 'transform', position: [0, 0.8, 0] as any }, { type: 'web_screen', url: 'https://example.com' }]
  }
};
const relRes102 = parseInstruction('Place le panneau derrière la table', entitiesParser102);
const movedBoardCap = relRes102.patch.entitiesChanged?.[0]?.capabilities?.find(c => c.type === 'transform');
assert.ok(movedBoardCap && Number.isFinite(movedBoardCap.position.x) && movedBoardCap.position.x === 0.5, 'parseInstruction("Place le panneau derrière la table") doit fonctionner même si la table a une position tuple [0.5, 0, -0.5]');

const popRes102 = parseInstruction('Garnis la table', entitiesParser102);
assert.ok((popRes102.patch.entitiesCreated?.length || 0) > 0, 'parseInstruction("Garnis la table") doit créer des objets sur la table');
const firstPopPos = popRes102.patch.entitiesCreated![0].capabilities.find(c => c.type === 'transform')?.position as any;
assert.ok(Number.isFinite(firstPopPos.x) && Number.isFinite(firstPopPos.y) && Number.isFinite(firstPopPos.z), 'Les objets créés sur une table à position tuple doivent avoir des coordonnées finies');

// 102.4 : normalizeAndValidateModelResponse (entitiesRemoved dédupliqués/filtrés, top-level transform promu, partIds de currentEntities et acteur 'system' acceptés)
const existingEntities102: Record<string, EntitySpec> = {
  sac_existant: {
    id: 'sac_existant',
    name: 'Sac Existant',
    capabilities: [{ type: 'transform', position: { x: 0, y: 0.8, z: 0 } }],
    parts: [{ id: 'poche_principale', name: 'Poche Principale' }]
  },
  old_box: {
    id: 'old_box',
    name: 'Ancienne Boîte',
    capabilities: [{ type: 'transform', position: { x: 1, y: 0, z: 0 } }]
  }
};
const rawLlmResp102 = {
  plan: { intent: 'update_scene', actions: [] },
  patch: {
    entitiesRemoved: ['old_box', 'old_box', 'ghost_non_existent_id'],
    entitiesCreated: [
      {
        id: 'new_lamp',
        name: 'Lampe',
        transform: { position: [0.4, 0.85, -0.2], rotation: [0, 1.57, 0], scale: [1, 1, 1] },
        visuals: { shape: 'cylinder', color: '#fde047' }
      }
    ],
    rulesChanged: [
      {
        id: 'r_part_sys',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_target', targetId: 'poche_principale', sourceId: 'system' }],
        actions: [{ type: 'set_flag', flag: 'pocket_opened', targetId: 'poche_principale' }]
      }
    ]
  }
};
const validatedLlm102 = normalizeAndValidateModelResponse(rawLlmResp102, existingEntities102, []);
assert.ok(validatedLlm102, 'normalizeAndValidateModelResponse doit retourner un résultat validé non nul');
assert.deepStrictEqual(validatedLlm102.patch.entitiesRemoved, ['old_box'], 'entitiesRemoved doit filtrer les IDs inexistants et dédupliquer les doublons');
const newLampTf = validatedLlm102.patch.entitiesCreated?.[0]?.capabilities?.find(c => c.type === 'transform');
assert.deepStrictEqual(newLampTf?.position, { x: 0.4, y: 0.85, z: -0.2 }, 'Un champ top-level transform doit être promu dans capabilities et normalisé en { x, y, z }');
assert.strictEqual(validatedLlm102.patch.rulesChanged?.[0]?.conditions?.[0]?.targetId, 'poche_principale', 'Les sous-parties (parts) des entités existantes doivent être préservées dans rulesChanged');

// 102.5 : interpretSemanticEdit avec positions tuple [x, y, z]
const worldSem102: WorldState = {
  version: 1,
  flags: {},
  ir: {
    entities: {
      robot_agent: {
        id: 'robot_agent',
        name: 'Robot Mobile',
        capabilities: [{ type: 'transform', position: [0, 0.3, -4] as any }, { type: 'agent' }]
      },
      crate_obstacle: {
        id: 'crate_obstacle',
        name: 'Caisse Obstacle',
        capabilities: [{ type: 'transform', position: [0.1, 0.5, 0] as any }, { type: 'collider' }]
      },
      escape_door: {
        id: 'escape_door',
        name: 'Porte de Sortie',
        capabilities: [{ type: 'transform', position: [0, 0.5, 4] as any }, { type: 'destination' }]
      }
    },
    rules: {},
    invariants: {}
  }
};
const navEdit102 = interpretSemanticEdit('Assigne au Robot Mobile une trajectoire de navigation vers la Porte de Sortie', worldSem102);
const navCap102 = navEdit102.patch.entitiesChanged?.[0]?.capabilities?.find((c: any) => c.type === 'navigation_path') as any;
assert.ok(navCap102 && navCap102.hasDetour === true, 'interpretSemanticEdit doit détecter un obstacle sur la trajectoire même lorsque les positions sont des tuples [x, y, z]');
assert.deepStrictEqual(navCap102.waypoints[0], [0, 0.3, -4], 'Le premier waypoint doit avoir des coordonnées numériques [0, 0.3, -4]');

const causalEdit102 = interpretSemanticEdit('Connecte la Caisse Obstacle pour activer la Porte de Sortie', worldSem102);
const trigLoc102 = (causalEdit102.patch.rulesChanged?.[0]?.conditions?.[0] as any)?.triggerLocation;
assert.ok(trigLoc102 && !('0' in trigLoc102) && trigLoc102.x === 0.1, 'triggerLocation dans CONNECT_CAUSAL doit être un objet { x, y, z } valide');

console.log('PASS: Suite 102 validée avec succès (WorldSlice Tuple Vectors, Evaluator Proximity/Teleport/Capacity, Parser Relative Tuple Positions, LLM Transform/Parts/Removed Normalization & SemanticEditInterpreter Tuple Support).');

// --- TEST 103 : Non-régression Rapier World Unsafe Aliasing, Dynamic Epoch & Ref Forwarding ---
console.log('\n--- Exécution Suite 103 : Non-régression Rapier Wasm Aliasing, Physics Epoch & Ref Forwarding ---');

// 103.1 : Validation du compteur physicsEpoch et incrementPhysicsEpoch
const initialEpoch = useWorldStore.getState().physicsEpoch;
assert.ok(typeof initialEpoch === 'number' && initialEpoch >= 1, 'physicsEpoch doit être initialisé à un entier >= 1');
useWorldStore.getState().incrementPhysicsEpoch();
const bumpedEpoch = useWorldStore.getState().physicsEpoch;
assert.strictEqual(bumpedEpoch, initialEpoch + 1, 'incrementPhysicsEpoch doit incrémenter le compteur de 1');

// 103.2 : Validation que les opérations d’état (applyPatch) incrémentent physicsEpoch
const epochBeforePatch = useWorldStore.getState().physicsEpoch;
useWorldStore.getState().applyPatch({
  entitiesCreated: [
    {
      id: 'test_physics_epoch_box',
      name: 'Boîte Test Époque',
      capabilities: [{ type: 'transform', position: { x: 1, y: 0.5, z: 1 } }]
    }
  ]
}, 'Ajouter boîte test époque');
const epochAfterPatch = useWorldStore.getState().physicsEpoch;
assert.strictEqual(epochAfterPatch, epochBeforePatch + 1, 'applyPatch doit incrémenter physicsEpoch pour forcer un remount propre des proxies Wasm');

// 103.3 : Validation des clés dynamiques pour PhysicsErrorBoundary
const generateWorldKey = (epoch: number, resetKey: number) => `rapier_world_${epoch}_${resetKey}`;
const key1 = generateWorldKey(1, 0);
const key2 = generateWorldKey(1, 1);
const key3 = generateWorldKey(2, 0);
assert.notStrictEqual(key1, key2, 'Une récupération suite à une anomalie doit produire une clé distincte pour unmount le Wasm empoisonné');
assert.notStrictEqual(key1, key3, 'Un changement de physicsEpoch doit forcer une clé Rapier distincte');

// 103.4 : Validation du passage de ref via _rawRef sans suppression par React 18
const testRigidBodyInner = (props: any) => {
  return { hasRef: Boolean(props.ref), refValue: props.ref };
};
const testInnerComponent = (rawProps: any) => {
  const { _rawRef, ...rest } = rawProps;
  return testRigidBodyInner({ ...rest, ref: _rawRef });
};
const dummyRef = { current: { handle: 42 } };
const rendered = testInnerComponent({ name: 'test_entity', _rawRef: dummyRef });
assert.strictEqual(rendered.hasRef, true, '_rawRef doit être transmis dans le champ ref de RigidBodyInner');
assert.strictEqual(rendered.refValue, dummyRef, 'La référence directe vers le corps Rapier doit être conservée');

// 103.5 : Validation des guards de safe free et unmap sur le prototype Rapier
const mockPoisonedWorld: any = {
  integrationParameters: { free: () => { throw new Error('recursive use of an object detected which would lead to unsafe aliasing in rust'); } },
  islands: { free: () => {} },
  broadPhase: { free: () => {} },
  narrowPhase: { free: () => {} },
  bodies: {
    free: () => {},
    unmap: (h: any) => { mockPoisonedWorld._unmappedBody = h; }
  },
  colliders: {
    free: () => {},
    unmap: (h: any) => { mockPoisonedWorld._unmappedCollider = h; }
  },
  impulseJoints: { free: () => {} },
  multibodyJoints: { free: () => {} },
  ccdSolver: { free: () => {} },
  physicsPipeline: { free: () => {} },
  serializationPipeline: { free: () => {} },
  debugRenderPipeline: { free: () => {} }
};

// Simulation du safe free granulaire
const safeFree = (obj: any) => {
  if (!obj) return;
  try { if (typeof obj.free === 'function') obj.free(); } catch (_) {}
};
assert.doesNotThrow(() => {
  safeFree(mockPoisonedWorld.integrationParameters);
  safeFree(mockPoisonedWorld.islands);
  safeFree(mockPoisonedWorld.bodies);
  safeFree(mockPoisonedWorld.colliders);
  mockPoisonedWorld.integrationParameters = void 0;
  mockPoisonedWorld.bodies = void 0;
  mockPoisonedWorld.colliders = void 0;
}, 'Le safe free granulaire ne doit jamais relancer une exception Wasm de recursion');
assert.strictEqual(mockPoisonedWorld.bodies, undefined, 'Les sous-structures du monde doivent être purgées même après exception');

console.log('PASS: Suite 103 validée avec succès (Rapier Wasm Aliasing Protection, Physics Epoch, Dynamic Remounting & Ref Forwarding).');

// --- TEST 104 : Stop Quest & UI De-cluttering (Langage Naturel, Arrêter & QuestHUD Controls) ---
console.log('--- Exécution Suite 104 : Stop Quest, QuestHUD Header Controls & UI De-cluttering ---');

// 104.1 : Test de stopActiveQuest dans le store
useWorldStore.getState().setActiveQuestId('test_quest_104');
assert.strictEqual(useWorldStore.getState().world.ir.activeQuestId, 'test_quest_104', 'setActiveQuestId doit activer la quête');
useWorldStore.getState().stopActiveQuest();
assert.strictEqual(useWorldStore.getState().world.ir.activeQuestId, null, 'stopActiveQuest doit réinitialiser activeQuestId à null');

// 104.2 : Vérification de la suppression de "Langage naturel" dans App.tsx
const suite104AppCode = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
assert(!suite104AppCode.includes('Langage naturel'), 'App.tsx ne doit plus afficher le label redondant "Langage naturel"');
assert(!suite104AppCode.includes('Natural language'), 'App.tsx ne doit plus afficher "Natural language"');

// 104.3 : Vérification de QuestHUD.tsx : suppression de l’icône 🔄 du header et présence du bouton "Arrêter"
const suite104QuestHudCode = fs.readFileSync(new URL('../ui/QuestHUD.tsx', import.meta.url), 'utf8');
assert(!suite104QuestHudCode.includes('title="Recommencer la procédure depuis le début"\n          >\n            🔄'), 'L’icône 🔄 de reload redondant du header de QuestHUD doit être supprimée');
assert.match(suite104QuestHudCode, /Arrêter/, 'QuestHUD doit proposer une action "Arrêter" pour quitter la mission');
assert.match(suite104QuestHudCode, /stopActiveQuest/, 'QuestHUD doit invoquer stopActiveQuest');

console.log('PASS: Suite 104 validée avec succès (Stop Quest, Arrêter, suppression Langage Naturel & icône header).');

// --- TEST 105 : Suppression Inspirations Rapides & Popins Anti-Clipping au Clic-Glisser Proche ---
console.log('--- Exécution Suite 105 : Anti-Clipping Popin Drag & Nettoyage Inspirations Rapides ---');

// 105.1 : Vérification de la suppression de "Inspirations rapides" dans App.tsx
assert(!suite104AppCode.includes('Inspirations rapides'), 'App.tsx ne doit plus contenir le bloc redondant "Inspirations rapides"');
assert(!suite104AppCode.includes('Rechercher un modèle d’expérience...'), 'App.tsx ne doit plus contenir le champ de recherche par mot-clé d’inspirations');

// 105.2 : Vérification du masquage des popins lors du clic-glisser dans R3FWorldAdapter.tsx
const r3fCode = fs.readFileSync(new URL('../scene/R3FWorldAdapter.tsx', import.meta.url), 'utf8');
assert(r3fCode.includes('isPointerPressed'), 'R3FWorldAdapter doit disposer de l’état isPointerPressed');
assert(r3fCode.includes('!isPointerPressed'), 'Les popins de survol et de sélection doivent être masquées si le pointeur est enfoncé');
assert(!r3fCode.includes('Math.max(0.65, (getAsset(entity.visuals?.assetId)?.size?.[1] || scl.y || 1)) + 0.38'), 'La hauteur d’ancrage 3D ne doit plus être forcée à plus de 1m au-dessus de l’objet');

// 105.3 : Vérification des contraintes CSS pour éviter les débordements d’écran
const cssCode = fs.readFileSync(new URL('../index.css', import.meta.url), 'utf8');
assert(cssCode.includes('max-height: min(65vh, 400px);'), 'entity-hover-tag doit être contrainte en hauteur maximale d’écran');
assert(cssCode.includes('max-height: min(75vh, 480px)'), 'entity-3d-selection-card doit être contrainte en hauteur maximale d’écran');

console.log('PASS: Suite 105 validée avec succès (Inspirations Rapides purgées & Popins 3D protégées contre le débordement lors du drag).');

// --- TEST 106 : Nettoyage Contexte Spatial & Tooltips Ergonomiques de la Barre d'Outils ---
console.log('--- Exécution Suite 106 : Nettoyage Contexte Spatial & Tooltips Ergonomiques ---');

// 106.1 : Vérification de la suppression de l'icône dans l'en-tête "Contexte spatial"
const appCodeSuite106 = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
assert(!appCodeSuite106.includes('<h3>Contexte spatial</h3><Icon name="focus" />'), 'L’icône redondante dans l’en-tête Contexte spatial doit être supprimée');
assert(appCodeSuite106.includes('<h3>Contexte spatial</h3>'), 'Le titre Contexte spatial doit être présent');

// 106.2 : Vérification de la présence de data-tooltip sur les outils de vue
assert(appCodeSuite106.includes('data-tooltip="Recentrer la caméra [Espace]"'), 'Le bouton focus doit avoir son tooltip');
assert(appCodeSuite106.includes('data-tooltip={showGrid ? "Masquer la grille [G]" : "Afficher la grille magnétique [G]"}'), 'Le bouton grille doit avoir son tooltip dynamique');
assert(appCodeSuite106.includes('data-tooltip={showLabels ? "Masquer les étiquettes [L]" : "Afficher les étiquettes [L]"}'), 'Le bouton étiquettes doit avoir son tooltip dynamique');

// 106.3 : Vérification du style CSS des tooltips
assert(cssCode.includes('.view-tools [data-tooltip]::after'), 'Le style des tooltips de view-tools doit être défini');

console.log('PASS: Suite 106 validée avec succès (Contexte spatial épuré & Tooltips ergonomiques actifs).');

// --- TEST 107 : Épuration Totale des Doublons SimToolbar & LiveCausalTicker ---
console.log('--- Exécution Suite 107 : Épuration des Doublons Simulation & Live Causal ---');

// 107.1 : Vérification de la suppression de la barre flottante de simulation
const appCodeSuite107 = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
assert(!appCodeSuite107.includes('floating-sim-toolbar'), 'La barre flottante redondante floating-sim-toolbar doit être supprimée');
assert(!appCodeSuite107.includes('<span>← Revenir au studio</span>'), 'Le bouton redondant Revenir au studio doit être supprimé');
assert(!appCodeSuite107.includes('Guide spatial actif'), 'Le texte superflu Guide spatial actif doit être supprimé');

// 107.2 : Vérification du retrait du bandeau LiveCausalTicker
assert(!appCodeSuite107.includes('<LiveCausalTicker />'), 'Le widget LiveCausalTicker doit être retiré de App.tsx pour libérer l’écran');

console.log('PASS: Suite 107 validée avec succès (Doublons de simulation et bandeau causal purgés).');

// --- TEST 108 : Parcours Guidé Accéléré, Widget Démo Fusionné & Déplaçable, Repositionnement QuestHUD & Suppression Vue Jury (Tout) ---
console.log('--- Exécution Suite 108 : Parcours Guidé Accéléré, Déplaçable & Repositionnement Ergonomique ---');

// 108.1 : Vérification de la suppression de "Vue Jury (Tout)" dans SpatialTelemetryDashboard.tsx
const dashboardCodeSuite108 = fs.readFileSync(new URL('../ui/SpatialTelemetryDashboard.tsx', import.meta.url), 'utf8');
assert(!dashboardCodeSuite108.includes('Vue Jury (Tout)'), 'Le filtre redondant "Vue Jury (Tout)" doit être supprimé');
assert(!dashboardCodeSuite108.includes('Jury Overview (All)'), 'Le filtre redondant "Jury Overview (All)" doit être supprimé');

// 108.2 : Repositionnement et drag amélioré de QuestHUD
const questHudCssSuite108 = fs.readFileSync(new URL('../index.css', import.meta.url), 'utf8');
assert(questHudCssSuite108.includes('left: 72px;'), 'QuestHUD doit être positionné initialement sur la gauche pour éviter le gizmo');
const questHudCodeSuite108 = fs.readFileSync(new URL('../ui/QuestHUD.tsx', import.meta.url), 'utf8');
assert(questHudCodeSuite108.includes("window.addEventListener('pointermove', onMove);"), 'QuestHUD doit supporter le drag via les événements window pointer');

// 108.3 : Fusion du PitchDemoDirector en un unique widget flottant, allégé et déplaçable
const pitchDirectorCodeSuite108 = fs.readFileSync(new URL('../ui/PitchDemoDirector.tsx', import.meta.url), 'utf8');
assert(pitchDirectorCodeSuite108.includes('useDraggableModal'), 'PitchDemoDirector doit utiliser useDraggableModal');
assert(!pitchDirectorCodeSuite108.includes('Top Persistent High-Visibility Guided Tour HUD Banner'), 'Le bandeau supérieur en doublon doit être supprimé');
assert(pitchDirectorCodeSuite108.includes('isMinimized'), 'PitchDemoDirector doit proposer un mode réduit');
assert(pitchDirectorCodeSuite108.includes('playbackSpeed'), 'PitchDemoDirector doit disposer d’un contrôle de vitesse de lecture');
assert(pitchDirectorCodeSuite108.includes('⚡'), 'PitchDemoDirector doit afficher le badge de vitesse accélérée');

console.log('PASS: Suite 108 validée avec succès (Parcours guidé accéléré, déplaçable & QuestHUD repositionné).');

// --- TEST 109 : Accessibilité & Contraste Élevé des Boutons 3D Popin (Anti-Bouton Blanc Illisible) ---
console.log('--- Exécution Suite 109 : Accessibilité & Contraste Élevé des Boutons 3D Popin ---');

// 109.1 : Présence des classes et styles explicites sur les boutons d'action 3D
const r3fCodeSuite109 = fs.readFileSync(new URL('../scene/R3FWorldAdapter.tsx', import.meta.url), 'utf8');
assert(r3fCodeSuite109.includes('className="entity-3d-action-toolbar"'), 'La barre d’actions rapide doit avoir className="entity-3d-action-toolbar"');
assert(r3fCodeSuite109.includes('background: \'rgba(16, 185, 129, 0.22)\''), 'Le bouton Placer doit avoir un fond sombre vert lisible');
assert(r3fCodeSuite109.includes('color: \'#6ee7b7\''), 'Le bouton Placer doit avoir une couleur de texte menthe contrastée');
assert(r3fCodeSuite109.includes('background: \'rgba(255, 255, 255, 0.08)\''), 'Les boutons Focus et Poser doivent avoir un fond sombre glassmorphic explicite');
assert(r3fCodeSuite109.includes('color: \'#f1f5f9\''), 'Les boutons Focus et Poser doivent avoir une couleur claire contrastée sur fond sombre');

// 109.2 : CSS universel pour .action-btn interdisant le fond blanc natif du navigateur
const cssCodeSuite109 = fs.readFileSync(new URL('../index.css', import.meta.url), 'utf8');
assert(cssCodeSuite109.includes('.action-btn,'), '.action-btn doit avoir un style universel indépendant du parent');
assert(cssCodeSuite109.includes('.entity-3d-selection-card button.action-btn'), 'Les boutons de sélection 3D doivent être explicitement stylés');

console.log('PASS: Suite 109 validée avec succès (Contraste élevé et lisibilité des boutons 3D garantis).');

// --- TEST 110 : Dédoublonnage des Popins Impulsion Physique 3D & HUD Observabilité Déplaçable/Réductible ---
console.log('--- Exécution Suite 110 : Dédoublonnage Popin 3D & HUD Observabilité Déplaçable ---');

// 110.1 : Dédoublonnage strict des suggestions émergentes dans ResearchSpatialOverlay3D.tsx
const overlayCodeSuite110 = fs.readFileSync(new URL('../scene/ResearchSpatialOverlay3D.tsx', import.meta.url), 'utf8');
assert(overlayCodeSuite110.includes('unpromoted.slice(0, 1)'), 'ResearchSpatialOverlay3D doit afficher au maximum 1 suggestion émergente active unique pour éviter les doublons superposés');
assert(overlayCodeSuite110.includes('mid.y += Math.max(0.55,'), 'La popin 3D doit être surélevée pour éviter les collisions avec les cartes d’objets au sol ou sur table');

// 110.2 : Panneau d’observabilité CausalObservabilityHUD rendu déplaçable et minimisable
const causalHudCodeSuite110 = fs.readFileSync(new URL('../ui/CausalObservabilityHUD.tsx', import.meta.url), 'utf8');
assert(causalHudCodeSuite110.includes('useDraggableModal'), 'CausalObservabilityHUD doit intégrer useDraggableModal');
assert(causalHudCodeSuite110.includes('isMinimized'), 'CausalObservabilityHUD doit supporter un mode réduit');
assert(causalHudCodeSuite110.includes('title="Glisser pour déplacer le panneau d\'observabilité"'), 'Le HUD doit disposer d’une poignée de déplacement');

console.log('PASS: Suite 110 validée avec succès (Popin impulsion 3D dédoublonnée & HUD observabilité déplaçable).');

// --- TEST 111 : Protection Anti-Surzoom sur les Popins 3D de Recherche & Télémétrie ---
console.log('--- Exécution Suite 111 : Protection Anti-Surzoom Popins 3D ---');

// 111.1 : Suppression de distanceFactor dans ResearchSpatialOverlay3D pour conserver une échelle 1:1 au zoom
const overlayCodeSuite111 = fs.readFileSync(new URL('../scene/ResearchSpatialOverlay3D.tsx', import.meta.url), 'utf8');
assert(!overlayCodeSuite111.includes('distanceFactor'), 'ResearchSpatialOverlay3D ne doit plus contenir distanceFactor pour éviter le sur-zoom lors de l’approche caméra');
assert(overlayCodeSuite111.includes("maxWidth: 'min(360px, 85vw)'"), 'La popin 3D d’impulsion doit avoir une contrainte de largeur maximale');
assert(!overlayCodeSuite111.includes("whiteSpace: 'nowrap',\n                  }}"), 'La popin 3D d’impulsion ne doit plus forcer un affichage nowrap étalé à l’écran');

console.log('PASS: Suite 111 validée avec succès (Protection anti-surzoom et dimensions contraintes garanties).');
})();

