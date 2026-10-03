import StudioShell from "@/components/studio-shell";

export default function ControlPage() {
  return (
    <StudioShell eyebrow="CENTRAL" title="Controle Studio K">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">ADMINISTRAÇÃO</span>
          <h1 className="page-title">Central de Controle</h1>
          <p className="page-subtitle">Painel com a mesma identidade visual do Studio K.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {[
          ["Projetos", "24"],
          ["Produtos", "12"],
          ["Usuários", "1.284"],
          ["Mídias", "86"]
        ].map(([label, value]) => (
          <article className="metric-card glass-panel" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-grid">
        <section className="glass-panel admin-card">
          <span className="section-eyebrow">ATIVIDADE</span>
          <h2>Alterações recentes</h2>
          <p>Use este espaço para logs, alterações de produtos, mídia e publicações.</p>
        </section>
        <section className="glass-panel admin-card">
          <span className="section-eyebrow">ATALHOS</span>
          <h2>Publicação rápida</h2>
          <p>Cadastre portfólio, produto, mídia ou modelo 3D por aqui.</p>
        </section>
      </div>
    </StudioShell>
  );
}
