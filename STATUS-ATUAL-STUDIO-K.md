# Studio K — Estado atual do site

Snapshot: 03/10/2026

## Fonte de verdade

- Frontend: `estefanysimii-dev/studio-k-portfolio`
- Frontend main: `821358c06fe21bf96fb40fe06f09609997d23c67`
- Backend/bot: `estefanysimii-dev/studio-k-backend`
- Backend main: `b57b977b5caee6001ab58c9eeac0acb74c18343d`
- Backend/API/Bot em produção no Railway.
- Frontend Next.js também está publicado no Railway como espelho atualizado.
- Publicação InfinityFree preparada e documentada para `https://studiokatelier.infinityfreeapp.com`; a publicação foi validada em 03/10/2026 conforme documentação do projeto.
- O antigo `studiokoficial.netlify.app` continua com deploy antigo e não deve ser tratado como fonte de verdade da versão atual.

## Interface pública

### Home
- Identidade Studio K em preto/roxo, glass, glow e fundo dinâmico.
- Banner configurável.
- Tagline e hero configuráveis pela Central.
- Projetos em destaque.
- Viewer 3D integrado.
- Botões internos e externos tratados separadamente; links externos abrem em nova guia.

### Portfólio
- Sem preços.
- Projetos por categoria.
- Páginas individuais.
- GLB/GLTF 360°, zoom, auto-rotação, reset, fullscreen e variantes quando disponíveis.
- Galeria de imagem/GIF/vídeo.
- Metadados OpenGraph por projeto no fluxo Next.js; no InfinityFree o PHP gera metadados, mas previews externos podem depender das limitações da hospedagem.

### Produtos
- Preço, galeria multimídia e 3D.
- Página individual.
- Checkout integrado ao backend/bot.
- Cupom, Pix, histórico de pedidos e recuperação de entrega digital quando aplicável.
- Integração de anúncio manual e automático no Discord.

### Discord / Conta
- OAuth2 automático.
- Discord User ID é a identidade principal.
- Conta exibe avatar, usuário, cargos, pedidos e entregas.
- Acesso à Central depende dos cargos Staff configurados no servidor.

## Central de Controle

Abas atuais:
- Visão geral
- Site
- Portfólio
- Produtos
- Mídia
- Conversor 3D
- Integrações

Recursos:
- Editar identidade, tagline, hero, backgrounds, logo e link Discord.
- CRUD de projetos e produtos.
- Biblioteca de mídia.
- BLEND / FBX / OBJ -> GLB no backend com Blender.
- PSD -> preview PNG mantendo fonte privada.
- Canal padrão de anúncios Discord.
- Anúncio automático ao publicar produto.
- Anúncio manual em outro canal.
- Somente canais compatíveis e com permissões do bot são listados.
- Produto continua salvo mesmo se anúncio automático falhar.

## Rádio Studio K

Implementação atual NÃO usa Spotify como fonte de reprodução.

O backend possui schema legado para `spotify`, porém o frontend atual desativa essa opção e usa:
- programação sincronizada com arquivos de áudio próprios;
- transmissão HLS ao vivo.

Programação própria:
- lista de faixas com título, URL e duração;
- horário-base controlado pelo servidor;
- todos os visitantes calculam a mesma faixa e a mesma posição;
- shuffle determinístico por rodada, sem repetição dentro da rodada;
- pausar e retomar leva novamente ao ponto ao vivo;
- relógio ressincronizado periodicamente com o backend.

HLS:
- procura a borda ao vivo;
- usa suporte nativo ou `hls.js`.

Player:
- iniciar/pausar;
- voltar ao vivo;
- volume persistido em localStorage;
- compacto/expandido;
- posição esquerda/direita;
- opção de mostrar ou esconder na Central;
- tentativa de autoplay, respeitando as regras do navegador.

Espectro/glow:
- para áudio próprio/HLS acessível por CORS, usa Web Audio API/AnalyserNode e mede graves/agudos reais;
- se a fonte não puder ser analisada, a interface usa apenas animação decorativa;
- Spotify não fornece PCM para esse uso.

PENDÊNCIA IMPORTANTE:
- o requisito original de colar uma playlist do Spotify na Central e usá-la como rádio NÃO está implementado na versão atual.

## Tema

- Tema escuro e claro globais.
- Toggle no topbar.
- Persistência em `localStorage`.
- Inicialização inline antes da hidratação para evitar flash de tema incorreto.
- Tema claro mantém a identidade roxa Studio K.

## Backend e segurança

- Express + Discord.js.
- Helmet.
- Rate limit.
- Validação Zod.
- Same-origin em rotas mutáveis.
- Sessões e cookies seguros.
- OAuth2 server-side.
- Secrets permanecem no Railway.
- Arquivos-fonte privados não são expostos publicamente.
- Adapter PHP do InfinityFree usa allowlist de rotas, cookie HttpOnly e proxy para o Railway.
- Repositórios são públicos, mas credenciais não devem existir no código.

## Deploy e validação

Frontend CI mais recente:
- `npm run build:infinityfree` aprovado.
- PHP do adapter InfinityFree sem erros de sintaxe.
- testes: 4 aprovados / 0 falhas.
- Next.js build compilado com sucesso.
- npm reporta 2 vulnerabilidades no frontend: 1 moderada e 1 alta.
- existem avisos de dependências/depreciação (`punycode`, `url.parse`) e aviso de módulo no teste do radio clock.

Backend CI mais recente:
- testes: 34 aprovados / 0 falhas.
- npm reporta 0 vulnerabilidades.
- Railway deploy atual concluído com sucesso.

## Studio K ID — progressão e ecossistema

Implementado:
- configuração persistente de XP e níveis pela Central;
- ranks configuráveis com nome, ícone, raridade e nível mínimo;
- badges, títulos equipáveis, conquistas persistentes e perks;
- perks visuais no cartão (`Collector Frame`, `Neon Aura`, `Icon Aura`);
- aba **Studio K ID** na Central;
- mapeamento opcional de rank -> cargo do Discord;
- comandos do bot `/perfil`, `/id` e `/rank` usando a mesma engine;
- sincronização de rank após favoritos, compras entregues e feedbacks quando a automação de cargos está ativada;
- endpoint versionado de identidade do ecossistema.

## Viewer 3D — variantes administráveis

Além das variantes internas do GLB, projetos e produtos agora podem cadastrar variantes externas:
- nome;
- cor hexadecimal;
- URL de GLB/GLTF;
- poster opcional.

O viewer exibe swatches e troca o modelo em tempo real. Hotspots, iluminação, comparação, zoom, fullscreen e variantes internas continuam preservados.

## Analytics 2.0

Além do funil original, o sistema agora registra:
- tempo de permanência;
- profundidade de scroll;
- origem/referrer;
- visitante recorrente;
- cliques;
- buscas no catálogo;
- filtros do portfólio;
- páginas de saída;
- erros de checkout;
- tempo médio observado por produto.

A Central mostra essas métricas junto ao funil, receita e produtos mais observados.

## Kiki contextual 2.0

A assistente agora pode reagir a:
- produto revisitado várias vezes;
- produto já favoritado;
- level-up do Studio K ID;
- nova conquista;
- drop próximo do encerramento;
- rank e título equipado;
- produto relacionado a compras anteriores.

## Pontos que ainda precisam de atenção

1. Spotify playlist permanece fora do escopo por decisão atual; não alterar até nova solicitação.
2. Resolver as 2 vulnerabilidades reportadas pelo npm no frontend.
3. Atualizar o README raiz: ele ainda descreve partes antigas como starter/placeholder e não representa o estado atual.
4. Definir oficialmente um único domínio público/canônico; o código Next ainda possui fallbacks/metadados apontando para Netlify, enquanto a publicação atual foi adaptada para InfinityFree.
5. Validar OpenGraph/preview do Discord no domínio InfinityFree; a própria hospedagem pode bloquear crawlers.
6. Fazer QA visual completo em desktop/mobile para tema claro, rádio, viewer 3D, checkout, OAuth e Central.
7. ClothToolStudioK continua propositalmente reservado e não deve ser alterado nesta fase.

## Regra de continuidade

A partir deste snapshot, futuras alterações no Studio K devem considerar:
- InfinityFree/Railway como arquitetura ativa;
- GitHub `main` como fonte de verdade;
- preservar OAuth, bot, Pix, CRUD, mídia, 3D, anúncios e temas;
- não regressar para formulários manuais de vínculo Discord;
- Portfólio sem preço e Produtos com preço;
- ClothTool somente na etapa final.
