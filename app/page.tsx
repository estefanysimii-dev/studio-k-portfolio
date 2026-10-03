import StudioShell from "@/components/studio-shell";
import ModelStage from "@/components/model-stage";
import ShowcaseCard from "@/components/showcase-card";
import Icon from "@/components/icons";

export default function HomePage() {
  return (
    <StudioShell eyebrow="STUDIO K" title="Showroom">
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="section-eyebrow">DESIGN 3D · FIVEM · MODA DIGITAL</span>
          <h1>
            DESIGN ALÉM
            <span>DA TEXTURA.</span>
          </h1>
          <p>
            Roupas, materiais e experiências 3D criadas para destacar identidade,
            acabamento e presença dentro do universo GTA V / FiveM.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary" href="/portfolio">
              Explorar Portfólio <Icon name="arrow" />
            </a>
            <a className="btn btn-outline" href="/discord">
              Entrar no Discord
            </a>
          </div>

          <div className="trust-row">
            <div><strong>360°</strong><span>Visualização 3D</span></div>
            <div><strong>GLB</strong><span>Viewer otimizado</span></div>
            <div><strong>SK</strong><span>Identidade Studio K</span></div>
          </div>
        </div>

        <ModelStage />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">TRABALHOS SELECIONADOS</span>
            <h2>Peças que definem o Studio K.</h2>
          </div>
          <a className="text-action" href="/portfolio">Ver todos <Icon name="arrow" /></a>
        </div>

        <div className="showcase-grid">
          <ShowcaseCard
            eyebrow="FIVEM · FEMININO"
            title="Polo + Manguito"
            copy="Construção, textura e acabamento com foco em leitura limpa no jogo e apresentação 3D."
            meta="3D · TEXTURA · CUSTOM CLOTHING"
          />
          <ShowcaseCard
            eyebrow="EMISSIVE · NIGHTWEAR"
            title="Neon Collection"
            copy="Materiais emissivos e contraste controlado para peças que ganham presença à noite."
            meta="EMISSIVE · MATERIALS · FIVEM"
          />
        </div>
      </section>

      <section className="cta-banner glass-panel">
        <div>
          <span className="section-eyebrow">COMUNIDADE STUDIO K</span>
          <h2>Entre no Discord e acompanhe drops, projetos e novidades.</h2>
        </div>
        <a className="btn btn-primary" href="/discord">Conectar com Discord <Icon name="arrow" /></a>
      </section>
    </StudioShell>
  );
}
