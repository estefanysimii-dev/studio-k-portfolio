"use client";

import StudioShell from "@/components/studio-shell";
import Icon from "@/components/icons";
import { useStudio } from "@/components/studio-provider";
import { externalLinkProps } from "@/lib/links";

export default function DiscordPage() {
  const { state } = useStudio();
  const invite = state.site.discordInviteUrl || "#";

  return (
    <StudioShell eyebrow="DISCORD" title="Vínculo de conta">
      <section className="discord-hero">
        <div className="discord-copy">
          <span className="section-eyebrow">ECOSSISTEMA STUDIO K</span>
          <h1>DISCORD<br/><span>STUDIO K</span></h1>
          <p>
            A mesma conta do Discord identifica você no site e permite que o bot reconheça permissões, cargos e acesso à Central de Controle.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="/api/oauth/start?next=/account">Conectar com Discord <Icon name="arrow" /></a>
            <a className={`btn btn-outline ${invite === "#" ? "disabled" : ""}`} href={invite} {...externalLinkProps(invite)}>Entrar no servidor</a>
          </div>
        </div>

        <div className="oauth-card glass-panel">
          <div className="oauth-icon"><img src="/studio-assets/studio-k-logo.webp" alt="Studio K" /></div>
          <span className="section-eyebrow">DISCORD OAUTH2</span>
          <h2>Uma identidade para todo o Studio K</h2>
          <p>O Discord User ID é a chave comum entre site, Central e bot. O login não exige que você digite seu usuário manualmente.</p>
          <div className="benefit-list">
            <span>✓ Identificação automática pelo Discord User ID</span>
            <span>✓ Cargos do servidor podem liberar a Central</span>
            <span>✓ Bot e site compartilham a mesma identidade</span>
          </div>
        </div>
      </section>
    </StudioShell>
  );
}
