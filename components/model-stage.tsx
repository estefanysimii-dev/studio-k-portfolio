import Icon from "./icons";

export default function ModelStage() {
  return (
    <div className="model-stage glass-panel">
      <div className="model-orbit orbit-a" />
      <div className="model-orbit orbit-b" />
      <div className="model-placeholder">
        <Icon name="cube" />
      </div>
      <div className="model-halo" />
      <div className="model-controls">
        <button aria-label="Girar modelo">360°</button>
        <button aria-label="Resetar câmera">Reset</button>
        <button aria-label="Tela cheia">Tela cheia</button>
      </div>
      <div className="model-hint">Arraste para girar · scroll para zoom</div>
    </div>
  );
}
