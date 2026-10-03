# Studio K no InfinityFree

`npm ci` e `npm run build:infinityfree` geram `dist-infinityfree/`.
Envie somente o conteúdo dessa pasta para `/htdocs`, incluindo `.htaccess`.
Nenhuma credencial é incluída no pacote. Node.js é necessário apenas para gerar os arquivos.

A interface reutiliza os componentes React existentes. A entrada PHP substitui as rotas
do Next.js para APIs, cookie HttpOnly, conclusão do OAuth, mídia com Range e metadados.
O servidor, SQLite, Discord, Pix e conversão de arquivos continuam no Railway.

Configure `PORTFOLIO_PUBLIC_URL=https://studiokatelier.infinityfreeapp.com` e
`PORTFOLIO_BACKEND_URL=https://studiokbot.up.railway.app` no backend depois de validar
o HTTPS. Registre `https://studiokbot.up.railway.app/api/oauth/discord/callback` no Discord.
Preserve o `PUBLIC_URL` e as URIs existentes para os fluxos legados de verificação e Google
do bot. Nunca coloque tokens Discord ou FTP em arquivos públicos.

Publicação validada em 03/10/2026: HTTPS, dados reais, conta autenticada, acesso Staff à
Central, gravação das configurações, navegação e persistência do tema. A rádio está
desativada, aguardando uma fonte configurada. A hospedagem antiga `studiokoficial` na
Netlify foi desativada de forma reversível.

O InfinityFree usa um filtro JavaScript/cookies que pode impedir robôs externos de
ler os metadados OpenGraph. Os metadados são gerados, mas previews do Discord nesse
domínio precisam ser verificados e não são garantidos pela hospedagem.

`npm run build` continua gerando o Next.js existente para o Railway. O fluxo atual
permanece disponível como alternativa durante a migração. O ClothTool não foi alterado.
