# Studio K no InfinityFree

`npm ci` e `npm run build:infinityfree` geram `dist-infinityfree/`.
Envie somente o conteúdo dessa pasta para `/htdocs`, incluindo `.htaccess`.
Nenhuma credencial é incluída no pacote. Node.js é necessário apenas para gerar os arquivos.

A interface reutiliza os componentes React existentes. A entrada PHP substitui as rotas
do Next.js para APIs, cookie HttpOnly, conclusão do OAuth, mídia com Range e metadados.
O servidor, SQLite, Discord, Pix e conversão de arquivos continuam no Railway.

Configure `PORTFOLIO_PUBLIC_URL=https://studiokatelier.infinityfreeapp.com` no backend
depois de validar o HTTPS do novo site. Mantenha `PUBLIC_URL` no endereço do backend:
a URI de retorno registrada no Discord não muda. Nunca coloque tokens Discord ou FTP em arquivos públicos.

O InfinityFree usa um filtro JavaScript/cookies que pode impedir robôs externos de
ler os metadados OpenGraph. Os metadados são gerados, mas previews do Discord nesse
domínio precisam ser verificados e não são garantidos pela hospedagem.

`npm run build` continua gerando o Next.js existente para o Railway. O fluxo atual
permanece disponível como alternativa durante a migração. O ClothTool não foi alterado.
