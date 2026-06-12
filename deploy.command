#!/bin/bash
cd "$(dirname "$0")"

echo "==============================="
echo "  RotasPro — Deploy no Vercel  "
echo "==============================="
echo ""

# Garante que o Vercel CLI está instalado
if ! command -v vercel &>/dev/null; then
  echo "Instalando Vercel CLI..."
  npm install -g vercel
fi

echo "Fazendo deploy... (na primeira vez vai pedir login)"
echo ""
vercel --prod

echo ""
echo "Deploy concluído! Copie a URL acima e:"
echo "1. Cole em ASAAS_WEBHOOK_URL no painel Vercel"
echo "2. Cadastre o webhook no Asaas"
echo ""
read -p "Pressione Enter para fechar..."
