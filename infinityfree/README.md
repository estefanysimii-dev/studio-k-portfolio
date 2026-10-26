# Studio K no InfinityFree — cutover Wisp preparado

O portfólio continua em `https://studiokatelier.infinityfreeapp.com`. Este código
prepara o gateway PHP e o Next.js para o backend `https://studiok-api.wisp.uno`.
**O pacote e o PR não alteram o site publicado.** A publicação deve acontecer
somente depois de validar o backend restaurado, os callbacks e os fluxos abaixo.

## Build e configuração

`npm ci` e `npm run build:infinityfree` geram `dist-infinityfree/`. O destino padrão
é Wisp. O job de CI define `STUDIO_BACKEND_URL=https://studiok-api.wisp.uno` para
os builds InfinityFree e Next.js, além de `STUDIO_PUBLIC_URL` com a origem acima.
Para gerar explicitamente o mesmo pacote no PowerShell:

```powershell
$env:STUDIO_BACKEND_URL = 'https://studiok-api.wisp.uno'
npm run build:infinityfree
```

`STUDIO_BACKEND_URL` aceita somente uma origem HTTPS sem caminho, credenciais,
query string ou fragmento. O build valida o valor antes de escrevê-lo no gateway.
Não há chave de API, segredo de webhook, token Discord ou credencial FTP no pacote.

A entrada PHP mantém os componentes React, cookies HttpOnly, conclusão do OAuth,
mídia com Range e metadados. O servidor, SQLite, bot, Pix e conversores pertencem
ao backend. `npm run build` continua gerando a aplicação Next.js como alternativa.

## Validação antes do corte

1. No backend restaurado, configure `PUBLIC_URL` e `PORTFOLIO_BACKEND_URL` como
   `https://studiok-api.wisp.uno`; mantenha `PORTFOLIO_PUBLIC_URL` como a origem
   InfinityFree. Preserve banco, `encryption.key`, mídias e credenciais originais.
2. Adicione `https://studiok-api.wisp.uno/api/oauth/discord/callback` no Discord e
   `https://studiok-api.wisp.uno/api/oauth/google/callback` no Google. Mantenha os
   callbacks antigos durante os testes; não rotacione chaves nem apague sessões.
3. Valide HTTPS/health, conta Discord, Staff/Central, dados reais, gravação de
   configurações, mídia/preview, tickets e entrega. Não execute dois bots com o
   mesmo token. A troca do domínio do painel exige novo login nesse domínio.
4. Confirme os testes e builds. Somente então publique o conteúdo de
   `dist-infinityfree/` em `/htdocs`, incluindo `.htaccess`, e valide novamente pelo
   endereço público. A CI existente publica por FTP apenas em push para `main`;
   um PR gera artefatos de revisão e não executa essa etapa.

O domínio antigo `*.up.railway.app` pertence ao Railway e não acompanha o backend.
A orientação histórica de preservá-lo não se aplica ao corte para Wisp.

## Pix PurinCash

O checkout exibe QR, Copia e Cola, validade e aviso de sandbox recebidos do backend;
Minha Conta permite recuperar a cobrança existente sem criar outro pedido. O total
do Pix do carrinho corresponde ao grupo inteiro e deve ser pago uma única vez.
Chaves PurinCash e segredo do webhook ficam exclusivamente no backend. Sem ativação
ou configuração completa, permanece o Pix manual. A confirmação vem do servidor,
e uma simulação não libera itens reais. Tarifas de pagamento são separadas da
hospedagem. Nenhuma cobrança real faz parte da validação local deste pacote.

## Limitação da hospedagem

O filtro JavaScript/cookies do InfinityFree pode impedir robôs externos de ler os
metadados OpenGraph. Previews do Discord nesse domínio precisam ser verificados
e não são garantidos pela hospedagem. O ClothTool não é alterado por este corte.
