# Descarte Certo

Plataforma para localizar pontos de descarte de eletrônicos, baterias e outros materiais, solicitar o cadastro de organizações receptoras e revisar essas solicitações.

## O que funciona

- Mostra no mapa apenas receptores cadastrados pela administração e usa a localização autorizada pelo navegador.
- Cria contas comuns por e-mail e senha; o cadastro público não pode criar administradores.
- Permite que uma pessoa autenticada solicite o cadastro de uma organização receptora.
- Restringe a página `/configuracoes` a administradores, que podem criar e listar acessos, criar administradores, cadastrar receptores e aprovar ou recusar solicitações.

## Configuração na Railway

1. Adicione um serviço **PostgreSQL** ao mesmo projeto.
2. No serviço web, configure as variáveis:

   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `AUTH_SECRET=` uma chave longa e aleatória
   - `ADMIN_INITIAL_EMAIL=` e-mail do primeiro administrador
   - `ADMIN_INITIAL_PASSWORD=` senha do primeiro administrador, com no mínimo 12 caracteres

3. Faça o deploy a partir da branch `main`. A migração do banco é executada antes de iniciar o serviço.
4. O primeiro administrador é criado pelo servidor apenas se ainda não houver nenhum admin. Depois, crie todos os demais acessos pela página **Configurações**.
5. Em **Networking**, gere o domínio público do serviço.

O mapa base usa OpenStreetMap. Os marcadores exibidos são exclusivamente receptores cadastrados pela administração.
