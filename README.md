# Sistema de Gerenciamento de Escalas

Sistema completo para upload, extração e consulta de escalas de serviço a partir de arquivos PDF.

## 🚀 Tecnologias

- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT
- **Extração de PDF**: pdf-parse
- **Containerização**: Docker + Docker Compose

## 📋 Pré-requisitos

- Docker
- Docker Compose

## 🔧 Instalação e Execução

### 1. Clone o repositório

```bash
cd /home/augusto/workspace/escala
```

### 2. Inicie os containers

```bash
docker compose up -d --build
```

Isso irá:
- Criar e iniciar o container do PostgreSQL na porta 5432
- Criar e iniciar o container do backend Node.js na porta 3001
- Executar o script de inicialização do banco de dados
- Instalar todas as dependências automaticamente

**Nota**: A API estará disponível em `http://localhost:3001`

### 3. Verifique se os serviços estão rodando

```bash
docker compose ps
```

Você deverá ver dois containers rodando:
- `escala-db` (PostgreSQL)
- `escala-backend` (API Node.js)

Teste o health check:
```bash
curl http://localhost:3001/health
```

### 4. Crie o usuário administrador

```bash
docker compose exec backend node init-admin.js
```

Credenciais padrão:
- **Email**: admin@escala.mil.br
- **Password**: admin123

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

### 5. Execute os testes automatizados

```bash
./test-api.sh
```

Este script testa todos os endpoints da API e valida a autenticação.

## 📚 Documentação da API

### Autenticação

#### Registrar novo usuário
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "name": "Nome Completo",
  "military_id": "12345",
  "rank": "SGT",
  "role": "user"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@escala.mil.br",
  "password": "admin123"
}
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@escala.mil.br",
    "name": "Administrador",
    "role": "admin"
  }
}
```

#### Obter dados do usuário autenticado
```bash
GET /api/auth/me
Authorization: Bearer {token}
```

### Escalas

#### Upload de PDF (Admin apenas)
```bash
POST /api/schedules/upload
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

file: [arquivo.pdf]
```

#### Listar todas as escalas (Admin apenas)
```bash
GET /api/schedules
Authorization: Bearer {admin_token}
```

#### Obter minhas escalas (Usuário comum)
```bash
GET /api/schedules/my
Authorization: Bearer {user_token}
```

#### Obter alterações não notificadas (Admin apenas)
```bash
GET /api/schedules/changes
Authorization: Bearer {admin_token}
```

### Usuários (Admin apenas)

#### Listar todos os usuários
```bash
GET /api/users
Authorization: Bearer {admin_token}
```

#### Obter usuário específico
```bash
GET /api/users/:id
Authorization: Bearer {admin_token}
```

## 🧪 Testando a API

### Usando curl

1. **Login como admin**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escala.mil.br","password":"admin123"}'
```

2. **Upload de PDF**:
```bash
TOKEN="seu_token_aqui"
curl -X POST http://localhost:3001/api/schedules/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/caminho/para/seu.pdf"
```

3. **Ver todas as escalas**:
```bash
curl http://localhost:3001/api/schedules \
  -H "Authorization: Bearer $TOKEN"
```

### Health Check

```bash
curl http://localhost:3001/health
```

### Interface Web

Acesse o navegador em:
```
http://localhost:3001/
```

Você verá uma página com:
- Status do sistema
- Lista de endpoints disponíveis
- Credenciais de teste
- Documentação rápida

### API Info (JSON)

```bash
curl http://localhost:3001/api
```

### Script de Teste Automatizado

Execute o script completo de testes:
```bash
./test-api.sh
```

## 📂 Estrutura do Projeto

```
escala/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Configuração PostgreSQL
│   │   ├── controllers/
│   │   │   ├── auth.controller.js   # Autenticação
│   │   │   ├── schedule.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js   # JWT middleware
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Schedule.js
│   │   │   └── ScheduleChange.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── schedule.routes.js
│   │   │   └── user.routes.js
│   │   ├── services/
│   │   │   └── pdfExtractor.service.js
│   │   └── server.js
│   ├── uploads/                      # PDFs enviados
│   ├── Dockerfile
│   ├── package.json
│   └── init-admin.js                 # Script para criar admin
├── database/
│   └── init.sql                      # Schema inicial
└── docker-compose.yml
```

## 🔍 Logs e Debugging

### Ver logs do backend
```bash
docker-compose logs -f backend
```

### Ver logs do PostgreSQL
```bash
docker-compose logs -f postgres
```

### Acessar o container do backend
```bash
docker-compose exec backend sh
```

### Acessar o PostgreSQL
```bash
docker-compose exec postgres psql -U escala_user -d escala_db
```

## 🛑 Parar os serviços

```bash
docker compose down
```

Para remover também os volumes (dados do banco):
```bash
docker compose down -v
```

## 🎯 Início Rápido (TL;DR)

```bash
# Iniciar containers
docker compose up -d --build

# Criar admin
docker compose exec backend node init-admin.js

# Testar API
./test-api.sh

# Fazer login e obter token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escala.mil.br","password":"admin123"}'

# Upload de PDF (substitua TOKEN pelo token recebido)
curl -X POST http://localhost:3001/api/schedules/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@seu-arquivo.pdf"
```

## 🔒 Segurança

- Senhas são armazenadas com hash bcrypt
- Autenticação via JWT com expiração de 7 dias
- Endpoints administrativos protegidos
- Validação de tipos de arquivo (apenas PDF)
- Variáveis de ambiente para configurações sensíveis

## 📝 Próximos Passos

- [ ] Implementar notificações push para alterações de escala
- [ ] Criar aplicativo móvel (React Native)
- [ ] Adicionar testes automatizados
- [ ] Melhorar parser de PDF para layouts complexos
- [ ] Implementar paginação nas listagens
- [ ] Adicionar filtros avançados de busca

## 📄 Licença

Este projeto é de uso interno.

## 👥 Autores

Sistema desenvolvido para automatizar o gerenciamento de escalas de serviço.
