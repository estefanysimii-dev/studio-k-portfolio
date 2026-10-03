import StudioShell from "@/components/studio-shell";
import Icon from "@/components/icons";

export default function DiscordPage() {
  return (
    <StudioShell eyebrow="DISCORD" title="Vínculo de conta">
      <section className="discord-hero">
        <div className="discord-copy">
          <span className="section-eyebrow">CONECTE SUA CONTA</span>
          <h1>DISCORD<br/><span>STUDIO K</span></h1>
          <p>
            Use sua conta oficial do Discord para acessar o ecossistema Studio K.
            A identificação deve acontecer via OAuth2 no backend.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary">Conectar com Discord <Icon name="arrow" /></button>
            <button className="btn btn-outline">Entrar no servidor</button>
          </div>
        </div>

        <div className="oauth-card glass-panel">
          <div className="oauth-icon">🔒</div>
          <span className="section-eyebrow">DISCORD OAUTH2</span>
          <h2>Conta vinculada com segurança</h2>
          <p>O botão acima deve redirecionar para o fluxo OAuth2 oficial do Discord.</p>
          <div className="benefit-list">
            <span>✓ Identificação pelo Discord User ID</span>
            <span>✓ Bot reconhece o usuário</span>
            <span>✓ Permissões podem ser sincronizadas</span>
          </div>
        </div>
      </section>
    </StudioShell>
  );
}
