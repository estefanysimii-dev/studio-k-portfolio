"use client";

import { useState } from "react";
import StudioShell from "@/components/studio-shell";
import { useStudio } from "@/components/studio-provider";

export default function AccountPage() {
  const { state, refresh } = useStudio();
  const [busy, setBusy] = useState(false);
  const me = state.me;

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/studio/logout", { method: "POST" });
      await fetch("/api/logout", { method: "POST" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudioShell eyebrow="CONTA" title="Minha Conta">
      <div className="account-grid">
        <section className="profile-card glass-panel">
          {me.user?.avatar ? <img className="account-avatar image" src={me.user.avatar} alt="" /> : <div className="account-avatar">SK</div>}
          <div>
            <span className="section-eyebrow">{me.authenticated ? "DISCORD CONECTADO" : "VISITANTE"}</span>
            <h1>{me.authenticated ? (me.user?.name || me.user?.username) : "Discord não conectado"}</h1>
            <p>
              {me.authenticated
                ? "Sua identidade do Discord está vinculada ao ecossistema Studio K pelo seu Discord User ID."
                : "Conecte sua conta para identificação automática, benefícios e acesso administrativo quando autorizado."}
            </p>
            {me.authenticated && <div className="account-id">ID: {me.user?.id}</div>}
          </div>
        </section>

        <section className="glass-panel account-connect">
          <span className="section-eyebrow">{me.authenticated ? "SESSÃO" : "VINCULAR CONTA"}</span>
          <h2>{me.authenticated ? "Conta sincronizada" : "Conectar com Discord"}</h2>
          <p>Nenhum ID, usuário ou e-mail precisa ser preenchido manualmente. A identificação ocorre pelo OAuth2 oficial do Discord.</p>
          {me.authenticated ? (
            <div className="hero-actions">
              {me.canControl && <a className="btn btn-primary" href="/control">Abrir Central de Controle</a>}
              <button className="btn btn-outline" type="button" disabled={busy} onClick={logout}>{busy ? "Saindo..." : "Sair"}</button>
            </div>
          ) : (
            <a className="btn btn-primary" href="/api/oauth/start?next=/account">Conectar com Discord</a>
          )}
        </section>
      </div>
    </StudioShell>
  );
}
