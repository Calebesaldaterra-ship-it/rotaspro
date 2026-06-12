#!/bin/bash
cd "$(dirname "$0")"

echo "Enviando código para o GitHub..."
git remote add origin https://github.com/Calebesaldaterra-ship-it/rotaspro.git 2>/dev/null || \
  git remote set-url origin https://github.com/Calebesaldaterra-ship-it/rotaspro.git

git branch -M main
git push -u origin main

echo ""
echo "Código enviado! Agora vá ao Vercel para fazer o deploy."
read -p "Pressione Enter para fechar..."
