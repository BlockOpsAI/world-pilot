# WorldPilot — Statut d'Audit Final (EO-Bench v2)

| Critère d'évaluation | Statut | Justification factuelle |
|---|---|---|
| **Ground truth independent** | **PASS** | Découle strictement de Delta(WAB, WBA) > tau calculé par behavioralEquivalence.ts. |
| **No programmed failures** | **PARTIAL** | Ruptures de navigation proxifiées sur graphe de clairance dans le runner headless CLI. |
| **EntityOverlap cohort independent** | **PASS** | Définie exclusivement par EntityOverlap(A,B) = 0 (N=116, prévalence 47.4%). |
| **B1a available** | **PASS** | B1a_LexicalSimilarity (Jaccard sur tokens) évaluée séparément. |
| **B1b true embedding baseline** | **PARTIAL** | Projection dense pseudo-aléatoire 64D normalisée L2 (B1b_DenseTextRepresentation64D), et non modèle type BERT/RoBERTa. |
| **Always Positive available** | **PASS** | B0bis_AlwaysPositive documentée dans toutes les tables et matrices. |
| **Thresholds validation-only** | **PASS** | theta = 0.50 étalonné sur VALIDATION (N=35) au max F1, scellé dans predictor_thresholds.json. |
| **TEST genuinely held out** | **PARTIAL** | Exécuté lors du bench batch scellé sans qu'aucun réglage n'ait été modifié à partir de ses sorties. |
| **Group split** | **PASS** | Partitionnement hermétique par famille de mondes (zéro fuite environnementale). |
| **Raw confusion matrices** | **PASS** | Données TP, FP, TN, FN unitaires disponibles dans confusion_matrices.json. |
| **Bootstrap CIs** | **PASS** | 2000 itérations de bootstrap déterministe (seed 4242) pour tous les indicateurs. |
| **B6 vs B3 paired bootstrap** | **PASS** | B6_vs_B3_bootstrap.csv consignant delta AUROC et AUPRC avec IC 95%. |
| **B6 vs embedding paired bootstrap** | **PASS** | B6_vs_embedding_bootstrap.csv consignant delta AUROC et AUPRC avec IC 95%. |
| **True ablations** | **PASS** | 13 configurations réelles (ABL-0 à ABL-8, ABL-D0 à ABL-D3) exécutées sur N=200. |
| **Exact McNemar** | **PASS** | Calcul exact binomial bilatéral pour l'ensemble des paires discordantes. |
| **Holm correction** | **PASS** | Ajustement séquentiel de Holm-Bonferroni sur l'ensemble des 12 tests d'ablation. |
| **C1 multi-label audit** | **PASS** | 200 cas analysés unitairement dans C1_FAILURE_AUDIT.jsonl avec IC 95% Wilson. |
| **Runtime instrumentation** | **PASS** | Compteurs fins (blastRadius, modelChecker, repair, hash) dans runtime_raw.jsonl. |
| **Headless proxy disclosed** | **PASS** | Limites documentées en toute transparence dans HEADLESS_PROXY_LIMITATION.md. |
| **Engine validation available** | **PASS** | Évaluation géométrique continue 3D indépendante sous Three.js r165 (15/15 navigation C5 validées >= 0.210m vs 1 collision + 14 empiétements C4, 8/8 C0 validés, quête documentée dans C5_INDEPENDENT_GEOMETRIC_VALIDATION.csv). |
| **Replay available** | **PASS** | Rejoueur pas-à-pas déterministe opérationnel en ligne de commande. |
