# ClothTool na Central

A aba **ClothTool** está em `/control?tab=clothtool`, dentro da proteção Staff já existente. Permite autorizar o código apresentado pelo aplicativo Windows, listar conexões da própria conta e revogar sessões ou autorizações pendentes.

As requisições usam `control/clothtool` pelo gateway `/api/studio/`. O gateway PHP do InfinityFree já aceita esses caminhos de controle e encaminha a sessão HttpOnly ao backend; nenhuma credencial do site é repassada ao aplicativo. A rota alternativa de logout também encerra a sessão no backend.

Publicação: workflow existente `Studio K CI`, build InfinityFree, testes, build Next e FTP. O servidor `studio-k-backend` precisa conter `server/clothtool.js` antes do uso da aba.

O aplicativo Windows atualizado é distribuído como pacote privado/local. Não há um link de download público para a ferramenta.
