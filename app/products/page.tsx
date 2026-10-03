import StudioShell from "@/components/studio-shell";
import Icon from "@/components/icons";

const products = [
  { name: "Polo Premium", price: "R$ 49,90", tag: "3D + Texturas" },
  { name: "Neon Pack", price: "R$ 69,90", tag: "Emissive" },
  { name: "Custom Clothing", price: "Sob consulta", tag: "Serviço" }
];

export default function ProductsPage() {
  return (
    <StudioShell eyebrow="PRODUTOS" title="Studio K Store">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">PRODUTOS COM VALOR</span>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Peças digitais com imagem, vídeo, GIF e visualização 3D quando disponível.</p>
        </div>
      </div>

      <div className="product-grid">
        {products.map((p) => (
          <article className="product-card glass-panel" key={p.name}>
            <div className="product-thumb">
              <Icon name="cube" />
            </div>
            <span className="meta-line">{p.tag}</span>
            <h3>{p.name}</h3>
            <strong>{p.price}</strong>
            <a className="btn btn-primary" href="#">Ver produto <Icon name="arrow" /></a>
          </article>
        ))}
      </div>
    </StudioShell>
  );
}
