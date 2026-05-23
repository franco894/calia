#!/bin/bash
echo "🚀 Iniciando configuración de Git para Cal-IA..."
cd /Users/francosolari/calia

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
  git init
  git branch -M main
  echo "✅ Repositorio Git inicializado localmente en rama principal 'main'."
fi

# Add all files
git add .

# Commit changes
git commit -m "feat: modo claro, completar macros y tutoriales"
echo "✅ Cambios guardados en un commit local."

echo ""
echo "--------------------------------------------------------"
echo "🔑 Para subirlo a GitHub, necesitamos vincular un repositorio."
echo "Selecciona cómo deseas proceder:"
echo "1) Crear y subir automáticamente con GitHub CLI (si lo tienes instalado)."
echo "2) Crear manualmente en github.com y vincularlo aquí."
echo "--------------------------------------------------------"

read -p "Elige una opción (1 o 2): " opcion

if [ "$opcion" == "1" ]; then
  echo "🔮 Intentando crear repositorio en GitHub usando gh CLI..."
  gh repo create calia --public --source=. --remote=origin --push
  echo "✅ ¡Subido con éxito a GitHub!"
else
  echo "🌐 Por favor, ve a https://github.com/new"
  echo "1. Crea un repositorio vacío con el nombre 'calia'."
  echo "2. Copia la URL del repositorio creado."
  echo ""
  read -p "Pega la URL de tu repositorio de GitHub (ej: https://github.com/tu-usuario/calia.git): " repo_url
  
  if [ ! -z "$repo_url" ]; then
    git remote remove origin 2>/dev/null
    git remote add origin "$repo_url"
    echo "🔮 Subiendo cambios a GitHub..."
    git push -u origin main
    echo "✅ ¡Subido con éxito a GitHub!"
  else
    echo "❌ No se proporcionó ninguna URL. Commit guardado localmente."
  fi
fi
