Documento de Requisitos de Produto (PRD): Sistema de Gerenciamento de Escalas

Versão: 1.0

Data de Criação: 10 de Novembro de 2025

Autor: (Seu Nome/Nome da Empresa)
1. Introdução e Visão Geral

Este documento descreve os requisitos para um novo Sistema de Gerenciamento de Escalas. O objetivo principal é criar uma aplicação que automatize e simplifique o processo de distribuição e consulta de escalas de serviço. Atualmente, as escalas são distribuídas em arquivos PDF, um método que é ineficiente, propenso a erros e dificulta a consulta rápida e personalizada.

A aplicação permitirá o upload de um arquivo PDF contendo a tabela de escalas, extrairá automaticamente as informações, as armazenará em um banco de dados estruturado e as disponibilizará através de um aplicativo móvel. Isso garantirá que os servidores tenham acesso rápido e fácil às suas escalas, enquanto os administradores terão uma visão completa e centralizada de todas as alocações.[1][2][3]
2. Objetivos e Métricas de Sucesso

Os principais objetivos deste projeto são:[4][5]

    Centralizar a Informação: Eliminar a dependência de arquivos PDF distribuídos, criando uma única fonte de verdade para as escalas de serviço.

    Facilitar o Acesso: Permitir que os usuários consultem suas escalas de forma rápida e conveniente através de um aplicativo móvel.

    Otimizar a Gestão: Fornecer aos administradores uma ferramenta para visualizar e gerenciar todas as escalas de forma eficiente.

    Reduzir Erros Manuais: Automatizar a extração de dados dos PDFs para minimizar erros de digitação ou interpretação.

Métricas de Sucesso:

    Adoção: 80% dos servidores utilizando o aplicativo como principal meio de consulta de escalas em até 3 meses após o lançamento.

    Redução de Tempo: Diminuir em 90% o tempo gasto por administradores na distribuição e confirmação de leitura das escalas.

    Satisfação do Usuário: Atingir uma nota de satisfação do usuário de no mínimo 4 de 5 estrelas nas lojas de aplicativos.

3. Personas de Usuário

Identificamos dois perfis principais de usuários para esta aplicação:[6]

    Usuário Comum (Servidor):

        Necessidades: Precisa saber de forma clara e rápida quais são suas próximas escalas de serviço, datas e horários.

        Casos de Uso: Acessar o aplicativo, fazer login e visualizar uma lista ou calendário contendo apenas as suas escalas.

        Limitações: Não pode visualizar as escalas de outros servidores.

    Usuário Administrador:

        Necessidades: Precisa garantir que as escalas sejam carregadas no sistema corretamente e ter uma visão completa de todas as alocações para gerenciar a equipe.

        Casos de Uso: Fazer o upload do arquivo PDF com a nova tabela de escalas, visualizar a escala de todos os servidores, verificar se houve algum erro na extração dos dados.

        Privilégios: Acesso total a todas as informações do sistema.

4. Requisitos Funcionais

Aqui detalhamos as funcionalidades que o sistema deve ter.[3][4][7]

RF-01: Autenticação de Usuários

    O sistema deve permitir que os usuários se cadastrem e façam login.

    A autenticação deve ser segura, com senhas armazenadas de forma criptografada.[8][9][10]

    O sistema deve diferenciar os níveis de acesso: "Administrador" e "Comum".

RF-02: Upload de Arquivo PDF (Admin)

    O administrador deve ter uma interface para fazer o upload de um arquivo PDF.

    O sistema deve validar se o arquivo é um PDF válido.

    Após o upload, o sistema deve processar o arquivo para extração de dados.

RF-03: Extração de Dados do PDF

    O sistema deve ser capaz de identificar e extrair os dados da tabela contida no PDF.

    As informações a serem extraídas são, no mínimo: Nome do Serviço/Evento, Data, Horário e Nome do Servidor Escalaado.

    Os dados extraídos devem ser salvos em um banco de dados estruturado.

RF-04: Visualização de Escalas (Usuário Comum)

    Após o login, o usuário comum deve ser direcionado para uma tela que exibe apenas as suas escalas.

    As escalas podem ser apresentadas em formato de lista cronológica ou calendário.

    Cada item da escala deve exibir claramente o nome do serviço, data e horário.

RF-05: Visualização de Escalas (Administrador)

    O administrador deve ter acesso a um painel que exibe todas as escalas de todos os servidores.

    O painel deve permitir a busca e filtragem por nome do servidor, data ou serviço.

RF-06: Notificações (Opcional, mas recomendado)

    O aplicativo pode enviar notificações push para os usuários sobre escalas futuras (ex: "Sua escala é amanhã").

5. Requisitos Não-Funcionais

Estes requisitos definem os critérios de qualidade do sistema.

    RNF-01: Desempenho: A extração de dados de um PDF de até 10 páginas deve ser concluída em menos de 1 minuto. A consulta de escalas no aplicativo deve ser praticamente instantânea (< 2 segundos).

    RNF-02: Segurança: Todas as comunicações entre o aplicativo e o servidor devem ser criptografadas (HTTPS). O acesso ao banco de dados deve ser protegido.[11]

    RNF-03: Usabilidade: A interface do aplicativo deve ser limpa, intuitiva e de fácil utilização para usuários com diferentes níveis de habilidade técnica.

    RNF-04: Confiabilidade: O sistema deve ter uma disponibilidade de 99.5%. Os dados extraídos devem ter uma precisão superior a 98%.

6. Sugestões de Tecnologias e Arquitetura

Sua sugestão de usar Docker e Node.js é excelente e moderna. Com base nela, detalho uma possível arquitetura:

    Backend (API):

        Linguagem/Framework: Node.js com Express.js é uma ótima escolha. É leve, rápido e ideal para construir APIs RESTful. Sua natureza assíncrona se encaixa bem em operações de I/O como o processamento de arquivos.

        Extração de PDF: Existem várias bibliotecas em Node.js para essa tarefa. A pdf-parse é boa para extrair texto bruto, mas para tabelas, a pdf.js-extract pode ser mais eficaz, pois consegue extrair texto com suas coordenadas de posição, facilitando a reconstrução da estrutura da tabela.[12][13][14][15]

        Autenticação: Implementação com JWT (JSON Web Tokens) é um padrão moderno e seguro para APIs.[9][10][16]

    Banco de Dados:

        PostgreSQL: É um banco de dados relacional robusto, confiável e de código aberto, que funciona muito bem com Node.js e é ideal para armazenar dados estruturados como as escalas.

    Infraestrutura e Deploy:

        Docker e Docker Compose: Perfeito para o que você precisa. Permite criar ambientes de desenvolvimento, teste e produção consistentes e isolados.[17][18][19][20] Você pode ter um contêiner para a aplicação Node.js e outro para o banco de dados PostgreSQL, facilitando a orquestração.[17][18][21]

    Frontend (Aplicativo Móvel):

        React Native: Se a equipe de desenvolvimento já tem experiência com JavaScript e React, a curva de aprendizado será menor.[23][24]

7. Questões em Aberto e Próximos Passos

    Qual é a estrutura exata da tabela no PDF? A estrutura é consistente em todos os arquivos?
        A estrutura da tabela no PDF é consistente, contendo colunas para Nome do Serviço/Evento, Data e Nome do Servidor Escalado. É importante garantir que o sistema possa lidar com variações menores, como espaços extras ou formatação ligeiramente diferente.
    Como os usuários (comuns e administradores) serão cadastrados inicialmente no sistema?
        Os usuários serão cadastrados manualmente pelo administrador no início, mas o sistema deve permitir a criação de novos usuários posteriormente, possivelmente com um processo de auto-cadastro ou integração com um sistema de autenticação existente, onde o usuário possa se registrar usando um e-mail, identidade militar e nome de guerra e posto/graduação (os quais serão extraídos do PDF).

    Haverá necessidade de editar ou excluir escalas após o upload?
        Não. O sistema não permitirá a edição ou exclusão de escalas após o upload. A ideia é que o PDF seja a fonte de verdade, e qualquer alteração na escala deve ser feita no arquivo PDF original e refeito o upload.
        
8. Por vezes a escala pode haver alguma alteração e o sistema terá de ser capaz de reconhecer que houve mudança, quando um novo arquivo pdf for feito upload, e alertar o usuário que houve essa alteração em sua escala.

Este PRD é um documento vivo e deve ser atualizado conforme o projeto evolui e novas informações se tornam disponíveis.[1][2][5] Ele fornece uma base sólida para iniciar o desenvolvimento e garantir que o produto final atenda às necessidades dos seus usuários.