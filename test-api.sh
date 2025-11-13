#!/bin/bash

# Script de teste da API Escala
# Teste completo das funcionalidades principais

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   Teste da API Sistema de Escalas${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# 1. Health Check
echo -e "${YELLOW}1. Testando Health Check...${NC}"
HEALTH=$(curl -s $BASE_URL/health)
if echo $HEALTH | grep -q "ok"; then
    echo -e "${GREEN}✓ Health check OK${NC}"
    echo "   $HEALTH"
else
    echo -e "${RED}✗ Health check FAILED${NC}"
    exit 1
fi
echo ""

# 2. Login Admin
echo -e "${YELLOW}2. Fazendo login como administrador...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escala.mil.br","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login FAILED${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ Login bem-sucedido${NC}"
    echo "   Token: ${TOKEN:0:50}..."
fi
echo ""

# 3. Teste do endpoint /me
echo -e "${YELLOW}3. Testando endpoint /api/auth/me...${NC}"
ME_RESPONSE=$(curl -s -X GET $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

if echo $ME_RESPONSE | grep -q "admin@escala.mil.br"; then
    echo -e "${GREEN}✓ Endpoint /me OK${NC}"
    echo "   $ME_RESPONSE"
else
    echo -e "${RED}✗ Endpoint /me FAILED${NC}"
    echo "   Response: $ME_RESPONSE"
fi
echo ""

# 4. Criar usuário comum
echo -e "${YELLOW}4. Criando usuário comum de teste...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"teste@exemplo.com",
    "password":"senha123",
    "name":"Soldado Teste",
    "military_id":"12345",
    "rank":"SD",
    "role":"user"
  }')

if echo $REGISTER_RESPONSE | grep -q "User created successfully\|User already exists"; then
    echo -e "${GREEN}✓ Usuário criado/existe${NC}"
else
    echo -e "${RED}✗ Criação de usuário FAILED${NC}"
    echo "   Response: $REGISTER_RESPONSE"
fi
echo ""

# 5. Listar usuários
echo -e "${YELLOW}5. Listando todos os usuários (admin)...${NC}"
USERS_RESPONSE=$(curl -s -X GET $BASE_URL/api/users \
  -H "Authorization: Bearer $TOKEN")

USER_COUNT=$(echo $USERS_RESPONSE | grep -o '"id":' | wc -l)
echo -e "${GREEN}✓ Encontrados $USER_COUNT usuário(s)${NC}"
echo ""

# 6. Listar escalas (deve estar vazio inicialmente)
echo -e "${YELLOW}6. Listando escalas (admin)...${NC}"
SCHEDULES_RESPONSE=$(curl -s -X GET $BASE_URL/api/schedules \
  -H "Authorization: Bearer $TOKEN")

if echo $SCHEDULES_RESPONSE | grep -q '\[\]'; then
    echo -e "${GREEN}✓ Nenhuma escala cadastrada ainda (esperado)${NC}"
else
    SCHEDULE_COUNT=$(echo $SCHEDULES_RESPONSE | grep -o '"id":' | wc -l)
    echo -e "${GREEN}✓ Encontradas $SCHEDULE_COUNT escala(s)${NC}"
fi
echo ""

# 7. Teste de upload de PDF (se houver arquivo)
echo -e "${YELLOW}7. Teste de upload de PDF...${NC}"
if [ -f "PREVISAO DA ESCALA DE SERVIÇOA.pdf" ]; then
    echo "   Arquivo PDF encontrado, fazendo upload..."
    UPLOAD_RESPONSE=$(curl -s -X POST $BASE_URL/api/schedules/upload \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@PREVISAO DA ESCALA DE SERVIÇOA.pdf")
    
    if echo $UPLOAD_RESPONSE | grep -q "success"; then
        echo -e "${GREEN}✓ Upload bem-sucedido${NC}"
        echo "   $UPLOAD_RESPONSE"
    else
        echo -e "${RED}✗ Upload FAILED${NC}"
        echo "   Response: $UPLOAD_RESPONSE"
    fi
elif [ -f "test-schedule.pdf" ]; then
    echo "   Arquivo test-schedule.pdf encontrado, fazendo upload..."
    UPLOAD_RESPONSE=$(curl -s -X POST $BASE_URL/api/schedules/upload \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@test-schedule.pdf")
    
    if echo $UPLOAD_RESPONSE | grep -q "success"; then
        echo -e "${GREEN}✓ Upload bem-sucedido${NC}"
        echo "   $UPLOAD_RESPONSE"
    else
        echo -e "${RED}✗ Upload FAILED${NC}"
        echo "   Response: $UPLOAD_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠ Nenhum arquivo PDF encontrado para testar upload${NC}"
    echo "   Coloque um arquivo 'PREVISAO DA ESCALA DE SERVIÇOA.pdf' ou 'test-schedule.pdf' no diretório"
fi
echo ""

# 8. Login como usuário comum
echo -e "${YELLOW}8. Testando login como usuário comum...${NC}"
USER_LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","password":"senha123"}')

USER_TOKEN=$(echo $USER_LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$USER_TOKEN" ]; then
    echo -e "${RED}✗ Login de usuário comum FAILED${NC}"
else
    echo -e "${GREEN}✓ Login de usuário comum bem-sucedido${NC}"
    
    # 9. Testar minhas escalas
    echo -e "${YELLOW}9. Consultando minhas escalas...${NC}"
    MY_SCHEDULES=$(curl -s -X GET $BASE_URL/api/schedules/my \
      -H "Authorization: Bearer $USER_TOKEN")
    
    if echo $MY_SCHEDULES | grep -q '\[\]'; then
        echo -e "${GREEN}✓ Sem escalas para este usuário (esperado se não houver upload)${NC}"
    else
        MY_COUNT=$(echo $MY_SCHEDULES | grep -o '"id":' | wc -l)
        echo -e "${GREEN}✓ Encontradas $MY_COUNT escala(s) para este usuário${NC}"
        echo "   $MY_SCHEDULES"
    fi
fi
echo ""

# 10. Teste de acesso negado
echo -e "${YELLOW}10. Testando proteção de rotas admin...${NC}"
FORBIDDEN=$(curl -s -X GET $BASE_URL/api/users \
  -H "Authorization: Bearer $USER_TOKEN")

if echo $FORBIDDEN | grep -q "Admin access required\|error"; then
    echo -e "${GREEN}✓ Proteção de rotas funcionando corretamente${NC}"
else
    echo -e "${RED}✗ Usuário comum conseguiu acessar rota admin!${NC}"
fi
echo ""

echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}   Testes concluídos!${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Resumo:"
echo "  - API está rodando em $BASE_URL"
echo "  - Admin: admin@escala.mil.br / admin123"
echo "  - User: teste@exemplo.com / senha123"
echo ""
echo "Para ver logs do backend:"
echo "  docker compose logs -f backend"
echo ""
