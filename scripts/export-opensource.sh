#!/usr/bin/env bash
set -euo pipefail

# WorldPilot · Automated Open Source Mirror Exporter
# Exports the clean, public subset of WorldPilot to the public repository:
# https://github.com/BlockOpsAI/world-pilot.git

PUBLIC_REPO_URL="https://github.com/BlockOpsAI/world-pilot.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
EXPORT_DIR="/tmp/worldpilot-public-export"

echo "🚀 [1/5] Préparation de l'export Open Source vers $PUBLIC_REPO_URL..."

# Nettoyage du dossier temporaire
rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR"

# Synchronisation sélective avec filtre .opensourceignore
echo "📦 [2/5] Copie sélective des fichiers autorisés (exclusion des recherches internes, secrets et archives)..."
cd "$ROOT_DIR"
rsync -a --exclude-from=".opensourceignore" \
  --exclude=".git" \
  --exclude="mobile/build" \
  --exclude="mobile/.dart_tool" \
  ./ "$EXPORT_DIR/"

# Vérification de l'intégrité et de la compilation autonome
echo "🧪 [3/5] Test de compilation autonome (Vite / TypeScript)..."
cd "$EXPORT_DIR"
ln -s "$ROOT_DIR/node_modules" "$EXPORT_DIR/node_modules"
npm run build
rm "$EXPORT_DIR/node_modules"

# Initialisation du dépôt public
echo "🔧 [4/5] Initialisation du dépôt Git public..."
git init -b main
git config user.name "Bruno Delb"
git config user.email "brunodelb@gmail.com"
git add .
git commit -m "feat: release WorldPilot Open Source (Apache 2.0) for Victoria VR Hackathon"

# Push vers le dépôt GitHub public
echo "⬆️ [5/5] Déploiement vers $PUBLIC_REPO_URL..."
git remote add origin "$PUBLIC_REPO_URL"
unset GH_TOKEN || true
unset GITHUB_TOKEN || true
git push -u origin main --force

echo ""
echo "🎉 [SUCCÈS] Le dépôt public officiel WorldPilot est en ligne et à jour :"
echo "👉 https://github.com/BlockOpsAI/world-pilot"
