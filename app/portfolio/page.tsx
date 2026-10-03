import StudioShell from "@/components/studio-shell";
import ShowcaseCard from "@/components/showcase-card";

export default function PortfolioPage() {
  return (
    <StudioShell eyebrow="PORTFÓLIO" title="Arquivo Studio K">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">SEM PREÇOS · APENAS EXPOSIÇÃO</span>
          <h1 className="page-title">Portfólio</h1>
          <p className="page-subtitle">Projetos, roupas, materiais e experimentos 3D selecionados.</p>
        </div>
      </div>

      <div className="filter-row">
        {["Todos", "Feminino", "Masculino", "Camisetas", "Calças", "Acessórios", "Neon"].map((f, i) => (
          <button className={i === 0 ? "filter-chip active" : "filter-chip"} key={f}>{f}</button>
        ))}
      </div>

      <div className="showcase-grid">
        <ShowcaseCard eyebrow="FEMININO" title="Polo + Manguito" copy="Modelagem, integração de peças e materialização para FiveM." meta="3D · GTA V · FIVEM" />
        <ShowcaseCard eyebrow="NEON" title="Emissive Nightwear" copy="Projeto com brilho noturno e controle de material emissivo." meta="EMISSIVE · NIGHT" />
        <ShowcaseCard eyebrow="TEXTURE" title="Gradient Studies" copy="Exploração de degradês, contraste e resposta visual dentro do jogo." meta="DDS · MATERIAL" />
        <ShowcaseCard eyebrow="CONVERSION" title="Game-to-FiveM" copy="Adaptação de modelos externos para o pipeline do GTA V / FiveM." meta="RIG · WEIGHTS · UV" />
      </div>
    </StudioShell>
  );
}
