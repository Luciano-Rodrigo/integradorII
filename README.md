# Descarte Certo

Plataforma para localizar pontos de descarte de eletrônicos, baterias e outros materiais, solicitar o cadastro de organizações receptoras e revisar essas solicitações.

## O que funciona

- Busca locais reais de descarte com dados do OpenStreetMap e usa a localização autorizada pelo navegador.
- Cria contas comuns por e-mail e senha.
- Permite que uma pessoa autenticada solicite o cadastro de uma organização receptora.
- Restringe a página `/configuracoes` a administradores, que podem aprovar ou recusar solicitações.

## Configuração na Railway

1. Adicione um serviço **PostgreSQL** ao mesmo projeto.
2. No serviço web, configure as variáveis:

   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `AUTH_SECRET=` uma chave longa e aleatória
   - `ADMIN_EMAIL=` o e-mail da conta que será administradora

3. Faça o deploy a partir da branch `main`. A migração do banco é executada antes de iniciar o serviço.
4. Crie uma conta com o e-mail definido em `ADMIN_EMAIL`; ela receberá o perfil de administrador.
5. Em **Networking**, gere o domínio público do serviço.

O mapa usa OpenStreetMap e Overpass. Informações que não existem na base pública, como condição de coleta, são exibidas como não informadas.
