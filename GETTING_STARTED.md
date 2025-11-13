# Guia de Início - Sistema de Gerenciamento de Escalas

Este guia te levará passo a passo pela instalação e primeiro uso do sistema.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** (versão 20.10 ou superior)
- **Docker Compose** (versão 2.0 ou superior)

Para verificar se está instalado:
```bash
docker --version
docker compose version
```

## 🚀 Passo 1: Iniciar o Sistema

### 1.1 Navegue até o diretório do projeto

```bash
cd /home/augusto/workspace/escala
```

### 1.2 Inicie os containers

```bash
docker compose up -d --build
```

Este comando irá:
- ⬇️  Baixar as imagens necessárias (Node.js 18 Alpine, PostgreSQL 15)
- 🔨 Construir a imagem do backend
- 🗄️  Criar o banco de dados PostgreSQL
- 🚀 Iniciar o servidor backend na porta 3001

**Aguarde aproximadamente 30-60 segundos** para que os serviços inicializem completamente.

### 1.3 Verifique se está tudo rodando

```bash
docker compose ps
```

Saída esperada:
```
NAME                IMAGE                  STATUS      PORTS
escala-backend      escala-backend         Up          0.0.0.0:3001->3000/tcp
escala-db           postgres:15-alpine     Up (healthy) 0.0.0.0:5432->5432/tcp
```

### 1.4 Teste o health check

```bash
curl http://localhost:3001/health
```

Resposta esperada:
```json
{"status":"ok","timestamp":"2025-11-10T15:40:15.001Z"}
```

✅ Se você viu a resposta acima, o sistema está funcionando!

## 👤 Passo 2: Criar o Usuário Administrador

Execute o script de inicialização do admin:

```bash
docker compose exec backend node init-admin.js
```

Saída esperada:
```
Creating admin user...
Connected to PostgreSQL database
Admin user created successfully:
  Email: admin@escala.mil.br
  Password: admin123
  Role: admin

⚠️  IMPORTANT: Change the admin password after first login!
```

### Credenciais do Administrador

- **Email**: `admin@escala.mil.br`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Por segurança, altere esta senha após o primeiro uso!

## 🧪 Passo 3: Testar o Sistema

### 3.1 Execute o script de testes automatizado

```bash
./test-api.sh
```

Este script irá:
- ✓ Testar o health check
- ✓ Fazer login como administrador
- ✓ Criar um usuário comum de teste
- ✓ Listar usuários
- ✓ Testar proteção de rotas
- ✓ Validar autenticação JWT

Se todos os testes passarem, você verá:
```
========================================
   Testes concluídos!
========================================
```

### 3.2 Teste manual com curl

#### Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escala.mil.br","password":"admin123"}'
```

Copie o `token` da resposta. Você usará este token para as próximas requisições.

#### Listar usuários (requer token de admin):
```bash
TOKEN="cole_seu_token_aqui"
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN"
```

## 📄 Passo 4: Upload de PDF

### 4.1 Prepare um arquivo PDF

O PDF deve conter uma tabela com as seguintes colunas:
- Serviço/Evento
- Data (formato: DD/MM/YYYY)
- Horário (formato: HH:MM)
- Posto/Graduação
- ID Militar
- Nome do servidor

Exemplo de formato esperado:
```
SERVIÇO          DATA        HORÁRIO    POSTO/GRAD    ID MILITAR    NOME
Plantão Geral    15/11/2025  08:00      SGT           12345         Silva Santos
Escolta          16/11/2025  14:00      CB            67890         João Souza
```

### 4.2 Faça o upload

Substitua `/caminho/para/seu.pdf` pelo caminho do seu arquivo:

```bash
TOKEN="seu_token_de_admin"
curl -X POST http://localhost:3001/api/schedules/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/caminho/para/seu.pdf"
```

Resposta esperada (sucesso):
```json
{
  "success": true,
  "count": 10,
  "message": "Successfully extracted and stored 10 schedule entries",
  "rows": [...]
}
```

### 4.3 Verifique as escalas extraídas

```bash
curl -X GET http://localhost:3001/api/schedules \
  -H "Authorization: Bearer $TOKEN"
```

## � Comportamento de Upload (Importante)

O sistema **preserva registros existentes** ao fazer upload de novas planilhas:

- ✅ **Registros anteriores NÃO são deletados** - todas as escalas anteriores permanecem no banco
- ✅ **Duplicatas são automaticamente detectadas e ignoradas** - usando critério de unicidade
- ✅ **Proteção em nível de banco de dados** - índice único garante integridade mesmo se houver erro no código
- 🔍 **Critério de unicidade**: Data + Serviço + Posto/Grad + Nome

### Exemplo de resposta com duplicatas

Ao fazer upload de um PDF que contém escalas já cadastradas:

```json
{
  "success": true,
  "count": 15,             // novos registros inseridos
  "skipped": 128,          // duplicatas ignoradas
  "total_extracted": 143,  // total extraído do PDF
  "message": "Successfully processed 143 entries: 15 inserted, 128 duplicates skipped"
}
```

### Vantagens desta abordagem

- **Histórico preservado**: Você pode fazer upload de múltiplas planilhas sem perder dados
- **Segurança**: Duplicatas são automaticamente filtradas, evitando dados duplicados
- **Flexibilidade**: Pode re-processar PDFs antigos sem problemas
- **Auditoria**: Todos os registros históricos permanecem no sistema

### Limpeza manual (se necessário)

Se precisar limpar o banco e recomeçar:

```bash
# Acessar o banco de dados
docker compose exec postgres psql -U escala_user -d escala_db

# Deletar todas as escalas
DELETE FROM schedules;

# Reiniciar a sequência do ID
ALTER SEQUENCE schedules_id_seq RESTART WITH 1;

# Sair
\q
```

## �👥 Passo 5: Criar e Testar Usuário Comum

### 5.1 Criar um novo usuário

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"sgt.silva@exemplo.com",
    "password":"senha123",
    "name":"Silva Santos",
    "military_id":"12345",
    "rank":"SGT",
    "role":"user"
  }'
```

### 5.2 Login como usuário comum

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sgt.silva@exemplo.com","password":"senha123"}'
```

### 5.3 Consultar as próprias escalas

```bash
USER_TOKEN="token_do_usuario"
curl -X GET http://localhost:3001/api/schedules/my \
  -H "Authorization: Bearer $USER_TOKEN"
```

Este endpoint retorna **apenas** as escalas do usuário logado (baseado no nome ou ID militar).

## 🔍 Comandos Úteis

### Ver logs do backend em tempo real
```bash
docker compose logs -f backend
```

### Ver logs do banco de dados
```bash
docker compose logs -f postgres
```

### Entrar no container do backend
```bash
docker compose exec backend sh
```

### Acessar o PostgreSQL
```bash
docker compose exec postgres psql -U escala_user -d escala_db
```

Comandos SQL úteis:
```sql
-- Ver todas as tabelas
\dt

-- Ver usuários cadastrados
SELECT id, email, name, rank, role FROM users;

-- Ver escalas
SELECT * FROM schedules ORDER BY date;

-- Ver alterações detectadas
SELECT * FROM schedule_changes WHERE notified = false;
```

Para sair do psql: `\q`

### Reiniciar os containers
```bash
docker compose restart
```

### Parar os containers
```bash
docker compose down
```

### Parar e remover dados (CUIDADO!)
```bash
docker compose down -v
```

## 🐛 Solução de Problemas

### Erro: "port is already allocated"

Outro serviço está usando a porta 3001. Você pode:

1. Parar o outro serviço
2. Ou alterar a porta no `docker-compose.yml`:
   ```yaml
   ports:
     - "3002:3000"  # Mude 3001 para 3002
   ```

### Erro: "Cannot connect to database"

Aguarde alguns segundos para o PostgreSQL inicializar completamente. Verifique o status:
```bash
docker compose ps
```

O status de `escala-db` deve ser "Up (healthy)".

### PDF não extrai dados corretamente

O parser de PDF atual usa heurísticas simples. Para PDFs com layouts complexos:

1. Verifique os logs do backend:
   ```bash
   docker compose logs backend
   ```

2. Ajuste o serviço de extração em:
   ```
   backend/src/services/pdfExtractor.service.js
   ```

3. Reinicie o container:
   ```bash
   docker compose restart backend
   ```

### Esqueci a senha do admin

1. Acesse o banco de dados:
   ```bash
   docker compose exec postgres psql -U escala_user -d escala_db
   ```

2. Delete o usuário admin:
   ```sql
   DELETE FROM users WHERE email = 'admin@escala.mil.br';
   ```

3. Recrie o admin:
   ```bash
   docker compose exec backend node init-admin.js
   ```

## 🎓 Próximos Passos

Agora que você tem o sistema funcionando:

1. ✅ Leia a [documentação completa](README.md)
2. 📱 Planeje a integração com o aplicativo móvel
3. 🔒 Configure as variáveis de ambiente de produção
4. 📊 Implemente relatórios e dashboards
5. 🔔 Configure notificações push

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker compose logs -f`
2. Revise este guia novamente
3. Consulte o [README.md](README.md) para mais detalhes
4. Verifique o [PRD](prd.md) para entender os requisitos

---

**Parabéns!** 🎉 Você concluiu a instalação do Sistema de Gerenciamento de Escalas.
