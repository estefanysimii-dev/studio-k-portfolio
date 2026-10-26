"use client";

import { useEffect, useState } from "react";
import type { StudioCheckout } from "@/lib/studio-types";

export default function PixPayment({ payment }: { payment: StudioCheckout["payment"] }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const expires = payment.expiresAt ? Date.parse(payment.expiresAt) : NaN;
  const expired = payment.status === "expired" || (Number.isFinite(expires) && now >= expires);
  const code = payment.brCode || payment.pixKey;
  const image = payment.qrCodeImage || "";
  const safeImage = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(image)
    || /^https:\/\//.test(image);

  useEffect(() => {
    setCopied(false);
    setCopyError(false);
    setNow(Date.now());
    if (!Number.isFinite(expires)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [code, expires]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="pix-payment">
      {payment.sandbox && <p className="control-notice">Ambiente de testes. Não efetue pagamentos reais.</p>}
      {(payment.orderCount || 0) > 1 && typeof payment.amountCents === "number" && <p>Este Pix cobre os {payment.orderCount} itens do carrinho: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payment.amountCents / 100)} no total. Pague o código apenas uma vez.</p>}
      {payment.status === "paid" ? <p role="status">{payment.sandbox ? "Simulação confirmada. Nenhum item real será entregue." : "Pagamento confirmado. Acompanhe a entrega em Minha Conta."}</p> : ["unknown", "unavailable", "review", "creating"].includes(payment.status || "") ? <p role="status">{payment.instructions || "A cobrança precisa de conferência. Consulte seus pedidos ou fale com a equipe antes de tentar outro pagamento."}</p> : expired ? <p role="status">Esta cobrança expirou. Verifique seus pedidos antes de tentar novamente.</p> : code ? (
        <>
          {safeImage && <img className="pix-payment-qr" src={image} alt="QR Code para pagamento Pix" width={220} height={220} />}
          <label htmlFor={`pix-${payment.paymentId || "manual"}`}>{payment.brCode ? "Pix Copia e Cola" : "Chave Pix"}</label>
          <textarea id={`pix-${payment.paymentId || "manual"}`} className="pix-payment-code" readOnly value={code} onFocus={(event) => event.currentTarget.select()} rows={3} />
          <button className="btn btn-primary" type="button" onClick={() => void copy()}>{copied ? "Pix copiado" : "Copiar Pix"}</button>
          {copyError && <p role="status">Selecione o código acima para copiá-lo manualmente.</p>}
          {payment.recipient && <p>Recebedor: {payment.recipient}</p>}
          {Number.isFinite(expires) && <p>Válido até {new Date(expires).toLocaleString("pt-BR")}.</p>}
          {payment.instructions && <p>{payment.instructions}</p>}
          {payment.provider === "purincash" && !payment.sandbox && <p>A entrega será liberada após a confirmação do pagamento. Acompanhe em Minha Conta.</p>}
        </>
      ) : <p>O pagamento ainda precisa ser configurado pela equipe STUDIO K - CREATIVE LAB.</p>}
    </div>
  );
}
