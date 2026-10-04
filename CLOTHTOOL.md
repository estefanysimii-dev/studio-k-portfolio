# ClothTool na Central

A aba **ClothTool** está em `/control?tab=clothtool`, dentro da proteção Staff já existente. Permite autorizar o código apresentado pelo aplicativo Windows, listar conexões da própria conta e revogar sessões ou autorizações pendentes.

As requisições usam `control/clothtool` pelo gateway `/api/studio/`. O gateway PHP do InfinityFree já aceita esses caminhos de controle e encaminha a sessão HttpOnly ao backend; nenhuma credencial do site é repassada ao aplicativo. A rota alternativa de logout também encerra a sessão no backend.

Publicação: workflow existente `Studio K CI`, build InfinityFree, testes, build Next e FTP. O servidor `studio-k-backend` precisa conter `server/clothtool.js` antes do uso da aba.

O aplicativo Windows atualizado é distribuído como pacote privado/local. Não há um link de download público para a ferramenta.


## Retorno para o aplicativo Windows

Depois que um código é autorizado na aba ClothTool, a Central tenta abrir automaticamente o protocolo `studiok-clothtool://authorized`. A versão do desktop a partir de `1.3.0-studiok.7` registra esse protocolo no perfil do Windows e ativa a instância do ClothTool que já está aberta. Nenhum cookie, bearer token ou dado de conta é enviado pelo deep link; a autorização continua sendo concluída pelo polling seguro em `/api/clothtool/token`.

Se o navegador bloquear a abertura automática, a Central mantém um botão **Abrir ClothTool Studio K** para repetir a chamada ao protocolo.
