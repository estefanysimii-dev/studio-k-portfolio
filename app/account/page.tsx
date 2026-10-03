"use client";

import { useEffect, useState } from "react";
import StudioShell from "@/components/studio-shell";
import { studioApi } from "@/lib/studio-api";
import { useStudio } from "@/components/studio-provider";
import type { StudioOrder } from "@/lib/studio-types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const statusLabel: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pagamento aprovado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  expired: "Expirado"
};

export default function AccountPage() {
  const { state, refresh } = useStudio();
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<StudioOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [delivery, setDelivery] = useState<{ id: string; value: string; instructions: string } | null>(null);
  const [error, setError] = useState("");
  const me = state.me;

  const loadOrders = async () => {
    if (!me.authenticated) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    setError("");
    try {
      const result = await studioApi.myOrders();
      setOrders(result.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar seus pedidos.");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => { void loadOrders(); }, [me.authenticated, me.user?.id]);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/studio/logout", { method: "POST" });
      await fetch("/api/logout", { method: "POST" });
      await refresh();
      setOrders([]);
    } finally {
      setBusy(false);
    }
  };

  const recoverDelivery = async (order: StudioOrder) => {
    setError("");
    try {
      const result = await studioApi.orderDelivery(order.id);
      setDelivery({ id: order.id, value: result.delivery, instructions: result.instructions || "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível recuperar a entrega.");
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
                : "Conecte sua conta para identificação automática, benefícios, pedidos e acesso administrativo quando autorizado."}
            </p>
            {me.authenticated && <div className="account-id">ID: {me.user?.id}</div>}
            {!!me.member?.roles?.length && (
              <div className="account-roles">
                {me.member.roles.slice(0, 12).map((role) => <span key={role.id}>{role.name}</span>)}
              </div>
            )}
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

      {me.authenticated && (
        <section className="account-orders glass-panel">
          <div className="section-heading compact-heading">
            <div>
              <span className="section-eyebrow">PEDIDOS + ENTREGAS</span>
              <h2>Minha biblioteca Studio K</h2>
            </div>
            <button className="btn btn-outline compact" type="button" onClick={() => void loadOrders()} disabled={ordersLoading}>
              {ordersLoading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {error && <div className="control-notice error">{error}</div>}

          {orders.length ? (
            <div className="account-order-list">
              {orders.map((order) => (
                <article className="account-order-row" key={order.id}>
                  <div>
                    <span className="meta-line">#{order.id.slice(0, 8)}</span>
                    <strong>{order.productName}</strong>
                    <small>{statusLabel[order.status] || order.status} · {money.format(order.price / 100)}</small>
                  </div>
                  {order.deliveryType === "digital" && ["paid", "delivered"].includes(order.status) && (
                    <button className="btn btn-outline compact" type="button" onClick={() => void recoverDelivery(order)}>Ver entrega</button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">{ordersLoading ? "Carregando pedidos..." : "Nenhum pedido vinculado a esta conta."}</p>
          )}

          {delivery && (
            <div className="delivery-box">
              <span className="section-eyebrow">ENTREGA DIGITAL · #{delivery.id.slice(0, 8)}</span>
              <pre>{delivery.value}</pre>
              {delivery.instructions && <p>{delivery.instructions}</p>}
              <button className="btn btn-outline compact" type="button" onClick={() => setDelivery(null)}>Fechar</button>
            </div>
          )}
        </section>
      )}
    </StudioShell>
  );
}
