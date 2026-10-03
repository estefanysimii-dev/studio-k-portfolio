# Studio K Portfolio UI

Starter visual em Next.js para reproduzir a linguagem aprovada do Studio K:

- dark premium
- roxo neon / violeta
- glass panels
- sidebar fixa
- topbar
- glow controlado
- luz ambiental que reage ao cursor
- hero preparado para visualizador 3D
- Portfólio separado de Produtos
- página Discord preparada para OAuth2
- Central de Controle seguindo a mesma identidade

## 1. Pré-requisitos

Instale:
- Node.js 20+ (ou versão LTS atual)
- npm
- VS Code

## 2. Rodar localmente

Abra um terminal dentro desta pasta:

```bash
npm install
npm run dev
```

Depois abra:

```text
http://localhost:3000
```

## 3. Estrutura

```text
app/
  page.tsx
  portfolio/page.tsx
  products/page.tsx
  discord/page.tsx
  account/page.tsx
  control/page.tsx
  globals.css

components/
  ambient-light.tsx
  icons.tsx
  model-stage.tsx
  showcase-card.tsx
  studio-shell.tsx
```

## 4. Onde trocar a logo

No componente:

```text
components/studio-shell.tsx
```

Localize:

```tsx
<div className="brand-mark">K</div>
```

e substitua por:

```tsx
<img className="brand-logo" src="/media/logo-studio-k.png" alt="Studio K" />
```

Depois copie sua logo para:

```text
public/media/logo-studio-k.png
```

Adicione ao `globals.css`:

```css
.brand-logo {
  width: 54px;
  height: 54px;
  object-fit: contain;
}
```

## 5. Onde colocar o background

Copie sua imagem para:

```text
public/media/studio-k-bg.webp
```

Então, no `body` de `app/globals.css`, adicione uma camada:

```css
body {
  background:
    linear-gradient(rgba(5,5,8,.72), rgba(5,5,8,.9)),
    url("/media/studio-k-bg.webp") center / cover fixed,
    #050508;
}
```

Para manter leitura:
- overlay preto entre 65% e 85%
- blur somente em pseudo-elemento de fundo, nunca nos textos
- cards continuam com glass blur

## 6. Como trocar o placeholder 3D

O componente:

```text
components/model-stage.tsx
```

é um placeholder visual.

Quando o viewer 3D estiver pronto, substitua apenas o conteúdo central por seu `<Canvas />` do React Three Fiber.

Sugestão futura:

```bash
npm install three @react-three/fiber @react-three/drei
```

E usar GLB/GLTF no frontend.

## 7. Portfólio x Produtos

O starter já mantém:

- `/portfolio`: sem preço
- `/products`: com preço

Não misture essas regras.

## 8. Discord OAuth2

A página `/discord` é apenas interface visual.

O botão "Conectar com Discord" deverá posteriormente apontar para seu backend:

```text
GET /api/auth/discord
```

Fluxo recomendado:

```text
site
→ backend
→ Discord OAuth2
→ callback
→ Discord User ID
→ sessão
→ site
```

Nunca coloque no frontend:
- DISCORD_CLIENT_SECRET
- BOT_TOKEN
- refresh token
- credenciais privadas

## 9. Hospedagem

Frontend:
- Netlify ou Vercel

Backend:
- Railway

Domínios recomendados:

```text
studiok.com.br
control.studiok.com.br
api.studiok.com.br
```

A Central de Controle pode ser mantida no mesmo frontend usando `/control` inicialmente.

## 10. Próxima etapa

Depois do visual:
1. integrar logo e backgrounds reais
2. viewer GLB/GLTF
3. banco/API
4. OAuth2 Discord
5. painel CRUD
6. storage de mídia
7. integração bot
8. ClothToolStudioK por último
