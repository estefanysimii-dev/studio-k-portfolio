# Preparação da migração do portfólio para Cloudflare Workers

**Estado:** preparação isolada, ainda não publicada. Não mesclar este PR antes de validar build, login e APIs.

## Motivo da escolha

Este repositório é um aplicativo Next.js 15 com Route Handlers em `app/api`, autenticação Discord, sessões, páginas dinâmicas, área de controle e APIs. Cloudflare Pages com exportação estática **não** preserva essas funções. O destino adequado a testar é **Cloudflare Workers com OpenNext**. O bot Discord (processo Node.js contínuo) e o banco SQLite **não** são migrados para Workers.

## Pré-requisitos

1. Acesso ao projeto Cloudflare e autorização para o repositório GitHub `estefanysimii-dev/studio-k-portfolio`.
2. Um backend Node.js alcançável por HTTPS. O antigo `studio-k-backend` aparece offline no Railway em 24/10/2026.
3. Antes de qualquer migração do backend: backup verificável do volume Railway `studio-k-data` em `/app/data`, incluindo `studio-k.sqlite`, `encryption.key` e demais arquivos persistentes. Não eliminar o volume antes de validar a restauração.
4. Node.js/npm local. NÃO inserir segredos no Git.

## Preparar em uma cópia de trabalho desta branch

```sh
npm ci
npm install --save-dev @opennextjs/cloudflare@latest wrangler@latest
npm run build
npx opennextjs-cloudflare build
npx opennextjs-cloudflare preview
```

O comando `npm install` deve atualizar **package.json e package-lock.json**; fazer commit de ambos nesta branch antes de habilitar build contínuo. Esses pacotes ainda não foram instalados, e esta branch **não foi testada** em ambiente Cloudflare.

O arquivo `wrangler.jsonc` configura o Worker e os recursos estáticos do OpenNext. O `open-next.config.ts` é opcional: o adaptador consegue gerá-lo no build. Se for adicionado cache R2, configurar explicitamente o bucket e bindings de acordo com a documentação atual.

## Variáveis e integrações a conferir

No ambiente Cloudflare Workers, configurar **apenas pelo painel de variáveis**:

- `STUDIO_BACKEND_URL`: origem HTTPS do backend Node.js ativo.
- `STUDIO_PUBLIC_URL`: URL HTTPS **exata** do novo frontend, primeiro para testes (ex.: o endereço `.workers.dev` entregue pela Cloudflare), depois o domínio definitivo.

No backend, revisar `PORTFOLIO_PUBLIC_URL`, `PUBLIC_URL`, `PORTFOLIO_BACKEND_URL`, `COOKIE_SECURE` e as origens permitidas conforme as URLs definitivas. No Discord Developer Portal, revisar os callbacks OAuth2. Nunca publicar `DISCORD_TOKEN`, `DISCORD_CLIENT_SECRET`, chaves de criptografia nem arquivos SQLite no repositório.

## Publicação (somente após validar tudo)

1. Testar login e retorno do OAuth2; verificação de cookie HttpOnly/Secure e logout.
2. Testar APIs públicas e autenticadas, CRUD da central, produtos, pedidos, mídias, upload/download e integração do bot.
3. Testar links diretos para `/portfolio/...`, `/products/...` e Open Graph/metadados.
4. Verificar site com URLs novas, SSL e sem redirecionamentos em loop.
5. Com o backend ativo e os dados íntegros, executar publicação em Workers usando `npx opennextjs-cloudflare deploy`, após autenticar `npx wrangler login`.
6. Apenas depois da validação de produção, trocar o endereço principal e aposentar hospedagens antigas.

**Não** publicar um export Vite/InfinityFree como se fosse um site totalmente funcional na Cloudflare Pages: `infinityfree/index.php` implementa proxy de API, cookies de login e SEO por rota, e PHP não roda na Cloudflare Pages.

Documentação:
- https://opennext.js.org/cloudflare/get-started
- https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
