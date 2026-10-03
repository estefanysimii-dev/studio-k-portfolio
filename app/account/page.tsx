import StudioShell from "@/components/studio-shell";

export default function AccountPage() {
  return (
    <StudioShell eyebrow="CONTA" title="Minha Conta">
      <div className="account-grid">
        <section className="profile-card glass-panel">
          <div className="account-avatar">SK</div>
          <div>
            <span className="section-eyebrow">VISITANTE</span>
            <h1>Discord não conectado</h1>
            <p>Conecte sua conta para liberar identificação automática e benefícios.</p>
          </div>
        </section>

        <section className="glass-panel account-connect">
          <span className="section-eyebrow">VINCULAR CONTA</span>
          <h2>Conectar com Discord</h2>
          <p>Nenhum ID, usuário ou e-mail deve ser preenchido manualmente.</p>
          <button className="btn btn-primary">Conectar com Discord</button>
        </section>
      </div>
    </StudioShell>
  );
}
