"use client";

import { useEffect, useMemo, useState } from "react";
import StudioShell from "@/components/studio-shell";
import FavoriteButton from "@/components/favorite-button";
import AccountMissions from "@/components/account-missions";
import AccountTickets from "@/components/account-tickets";
import AccountCommunity from "@/components/account-community";
import AccountActivity from "@/components/account-activity";
import Icon from "@/components/icons";
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
const rarityLabel: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário"
};

export default function AccountPage() {
  const { state, refresh } = useStudio();
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<StudioOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [delivery, setDelivery] = useState<{ id: string; value: string; instructions: string } | null>(null);
  const [titleBusy, setTitleBusy] = useState("");
  const [error, setError] = useState("");
  const me = state.me;
  const profile = me.profile;
  const favoriteIds = me.favorites || profile?.favorites || { items: [], products: [] };

  const favoriteItems = useMemo(
    () => state.items.filter((item) => favoriteIds.items.includes(item.id)),
    [state.items, favoriteIds.items]
  );
  const favoriteProducts = useMemo(
    () => state.products.filter((item) => favoriteIds.products.includes(item.id)),
    [state.products, favoriteIds.products]
  );

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

  const equipTitle = async (titleId: string) => {
    setTitleBusy(titleId);
    setError("");
    try {
      await studioApi.setProfileTitle(titleId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível equipar este título.");
    } finally {
      setTitleBusy("");
    }
  };

  if (!me.authenticated) {
    return (
      <StudioShell eyebrow="CONTA" title="Minha Conta">
        <section className="account-guest glass-panel">
          <div className="account-guest-mark">K</div>
          <span className="section-eyebrow">STUDIO K ID</span>
          <h1>Sua identidade dentro do ecossistema Studio K.</h1>
          <p>
            Conecte seu Discord para criar seu Studio K ID, salvar favoritos, acompanhar compras,
            liberar badges, benefícios e evoluir seu perfil.
          </p>
          <a className="btn btn-primary" href="/api/oauth/start?next=/account">
            Criar meu Studio K ID <Icon name="arrow" />
          </a>
        </section>
      </StudioShell>
    );
  }

  const xpFloor = profile?.levelFloor || 0;
  const xpTarget = profile?.nextLevelXp || Math.max(300, xpFloor + 300);
  const xpCurrent = profile?.xp || xpFloor;
  const xpProgress = Math.max(0, Math.min(100, ((xpCurrent - xpFloor) / Math.max(1, xpTarget - xpFloor)) * 100));
  const memberSince = profile?.joinedAt ? new Date(profile.joinedAt) : null;
  const memberSinceLabel = memberSince && !Number.isNaN(memberSince.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(memberSince)
    : "agora";

  return (
    <StudioShell eyebrow="CONTA" title="Minha Conta">
      <section className="studio-id-layout">
        <article className={[
          "studio-id-card",
          `studio-rank-${profile?.rank?.id || "member"}`,
          profile?.perks?.some((perk) => perk.id === "profile-frame" && perk.unlocked) ? "has-collector-frame" : "",
          profile?.perks?.some((perk) => perk.id === "neon-aura" && perk.unlocked) ? "has-neon-aura" : "",
          profile?.perks?.some((perk) => perk.id === "icon-aura" && perk.unlocked) ? "has-icon-aura" : ""
        ].filter(Boolean).join(" ")}>
          <div className="studio-id-card-glow" aria-hidden="true" />
          <div className="studio-id-top">
            <div className="studio-id-brand">
              <img src="/studio-assets/studio-k-logo.webp" alt="" />
              <div>
                <span>STUDIO K ID</span>
                <small>IDENTIDADE DIGITAL</small>
              </div>
            </div>
            <span className={`studio-id-status rarity-${profile?.rank?.rarity || "common"}`}><i /> {profile?.rank?.label || "Studio Member"}</span>
          </div>

          <div className="studio-id-person">
            {me.user?.avatar
              ? <img src={me.user.avatar} alt="" />
              : <div className="studio-id-avatar-fallback">{(me.user?.name || me.user?.username || "K").slice(0, 1).toUpperCase()}</div>}
            <div>
              <h1>{me.user?.name || me.user?.username || "Membro Studio K"}</h1>
              <span>@{me.user?.username || "studio-k"}</span>
              <small className={`studio-id-equipped-title rarity-text-${profile?.equippedTitle?.rarity || "common"}`}>
                {profile?.equippedTitle?.label || "Studio K Member"}
              </small>
            </div>
          </div>

          <div className="studio-id-code">
            <small>STUDIO K ID</small>
            <strong>{profile?.studioId || "SK-•••••"}</strong>
          </div>

          <div className="studio-id-level">
            <div>
              <span>LEVEL {profile?.level || 1}</span>
              <small>{profile?.xp || 0} XP</small>
            </div>
            <div className="studio-id-progress"><i style={{ width: `${xpProgress}%` }} /></div>
            <small>{Math.max(0, xpTarget - xpCurrent)} XP para o próximo nível</small>
          </div>

          <div className="studio-id-foot">
            <span>MEMBRO DESDE {memberSinceLabel.toUpperCase()}</span>
            <strong>{profile?.discountPercent ? `${profile.discountPercent}% OFF` : "STUDIO K MEMBER"}</strong>
          </div>
        </article>

        <article className="account-profile-panel glass-panel">
          <div className="account-profile-head">
            <div>
              <span className="section-eyebrow">PERFIL STUDIO K</span>
              <h2>Seu espaço no ecossistema.</h2>
              <p>Compras, favoritos, badges e benefícios evoluem junto com sua atividade no Studio K.</p>
            </div>
            <div className="hero-actions">
              {me.canControl && <a className="btn btn-primary compact" href="/control">Central de Controle</a>}
              <button className="btn btn-outline compact" type="button" disabled={busy} onClick={logout}>
                {busy ? "Saindo..." : "Sair"}
              </button>
            </div>
          </div>

          <div className="account-stat-grid">
            <div><span>Compras</span><strong>{profile?.stats.purchases || 0}</strong></div>
            <div><span>Investido</span><strong>{money.format((profile?.stats.lifetimeSpend || 0) / 100)}</strong></div>
            <div><span>Favoritos</span><strong>{profile?.stats.favorites || 0}</strong></div>
            <div><span>Feedbacks</span><strong>{profile?.stats.feedbacks || 0}</strong></div>
            <div><span>Tickets</span><strong>{profile?.stats.tickets || 0}</strong></div>
            <div><span>Abertos</span><strong>{profile?.stats.openTickets || 0}</strong></div>
          </div>

          <div className="account-badges">
            <div className="section-mini-head">
              <span>BADGES</span>
              <small>{profile?.badges.length || 0} desbloqueados</small>
            </div>
            <div className="account-badge-row">
              {profile?.badges.length ? profile.badges.map((badge) => (
                <span
                  className={`account-badge rarity-${badge.rarity || "common"}`}
                  key={badge.id}
                  title={badge.description || badge.label}
                >
                  <i>{badge.icon}</i>{badge.label}<small>{rarityLabel[badge.rarity] || badge.rarity}</small>
                </span>
              )) : <span className="muted">Continue explorando o Studio K para desbloquear badges.</span>}
            </div>
          </div>

          {!!me.member?.roles?.length && (
            <div className="account-badges account-discord-roles">
              <div className="section-mini-head"><span>CARGOS DO DISCORD</span></div>
              <div className="account-badge-row">
                {me.member.roles.slice(0, 12).map((role) => <span className="account-role" key={role.id}>{role.name}</span>)}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="account-evolution-grid">
        <article className="account-evolution-panel glass-panel">
          <div className="section-mini-head">
            <span>TÍTULOS EQUIPÁVEIS</span>
            <small>{profile?.titles?.filter((title) => title.unlocked).length || 0} desbloqueados</small>
          </div>
          <p className="account-evolution-copy">Escolha o título que aparece junto ao seu Studio K ID.</p>
          <div className="account-title-list">
            {profile?.titles?.map((title) => {
              const active = profile?.equippedTitle?.id === title.id;
              return (
                <button
                  type="button"
                  key={title.id}
                  disabled={!title.unlocked || !!titleBusy}
                  className={`account-title-option rarity-${title.rarity} ${active ? "active" : ""} ${title.unlocked ? "" : "locked"}`.trim()}
                  onClick={() => void equipTitle(title.id)}
                  title={title.description}
                >
                  <span>{title.label}</span>
                  <small>{active ? "Equipado" : title.unlocked ? (titleBusy === title.id ? "Equipando..." : rarityLabel[title.rarity]) : "Bloqueado"}</small>
                </button>
              );
            })}
          </div>
        </article>

        <article className="account-evolution-panel glass-panel">
          <div className="section-mini-head">
            <span>CONQUISTAS</span>
            <small>{profile?.achievements?.filter((achievement) => achievement.unlocked).length || 0}/{profile?.achievements?.length || 0}</small>
          </div>
          <p className="account-evolution-copy">Seu histórico fica ligado ao Studio K ID e não depende do dispositivo.</p>
          <div className="account-achievement-list">
            {profile?.achievements?.map((achievement) => (
              <div className={`account-achievement rarity-${achievement.rarity} ${achievement.unlocked ? "unlocked" : "locked"}`.trim()} key={achievement.id}>
                <i>{achievement.icon}</i>
                <div>
                  <strong>{achievement.label}</strong>
                  <span>{achievement.description}</span>
                  <small>
                    {achievement.unlocked && achievement.unlockedAt
                      ? `Desbloqueado em ${new Intl.DateTimeFormat("pt-BR").format(new Date(achievement.unlockedAt))}`
                      : "Ainda bloqueado"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="account-evolution-panel glass-panel">
          <div className="section-mini-head">
            <span>PERKS DO ECOSSISTEMA</span>
            <small>{profile?.perks?.filter((perk) => perk.unlocked).length || 0} ativos</small>
          </div>
          <p className="account-evolution-copy">Benefícios e efeitos que evoluem com compras, atividade e participação.</p>
          <div className="account-perk-list">
            {profile?.perks?.map((perk) => {
              const progress = Math.max(0, Math.min(100, (perk.progress / Math.max(1, perk.target)) * 100));
              return (
                <div className={`account-perk rarity-${perk.rarity} ${perk.unlocked ? "unlocked" : "locked"}`.trim()} key={perk.id}>
                  <div className="account-perk-head">
                    <span><i>{perk.icon}</i>{perk.label}</span>
                    <small>{perk.unlocked ? "ATIVO" : `${perk.progress}/${perk.target}`}</small>
                  </div>
                  <p>{perk.description}</p>
                  <div className="account-perk-progress"><i style={{ width: `${progress}%` }} /></div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="account-favorites glass-panel">
        <div className="section-heading compact-heading">
          <div>
            <span className="section-eyebrow">WISHLIST</span>
            <h2>Meus favoritos</h2>
            <p className="page-subtitle">Tudo que você marcou para rever depois fica salvo no seu Studio K ID.</p>
          </div>
          <a className="btn btn-outline compact" href="/products">Explorar produtos</a>
        </div>

        {(favoriteProducts.length || favoriteItems.length) ? (
          <div className="account-favorite-grid">
            {favoriteProducts.map((item) => (
              <article className="account-favorite-card" key={`product-${item.id}`}>
                <a href={`/products/${item.id}`} className="account-favorite-thumb">
                  {item.coverUrl || item.gifUrl
                    ? <img src={item.coverUrl || item.gifUrl} alt={item.name} />
                    : <Icon name="cube" />}
                </a>
                <div>
                  <span>PRODUTO · {item.category || "STUDIO K"}</span>
                  <strong><a href={`/products/${item.id}`}>{item.name}</a></strong>
                  <small>{item.priceCents > 0 ? money.format(item.priceCents / 100) : "Sob consulta"}</small>
                </div>
                <FavoriteButton kind="products" itemId={item.id} />
              </article>
            ))}
            {favoriteItems.map((item) => (
              <article className="account-favorite-card" key={`item-${item.id}`}>
                <a href={`/portfolio/${item.id}`} className="account-favorite-thumb">
                  {item.coverUrl || item.gifUrl
                    ? <img src={item.coverUrl || item.gifUrl} alt={item.name} />
                    : <Icon name="spark" />}
                </a>
                <div>
                  <span>PORTFÓLIO · {item.category || "STUDIO K"}</span>
                  <strong><a href={`/portfolio/${item.id}`}>{item.name}</a></strong>
                  <small>Projeto Studio K</small>
                </div>
                <FavoriteButton kind="items" itemId={item.id} />
              </article>
            ))}
          </div>
        ) : (
          <div className="account-empty-favorites">
            <span>♡</span>
            <strong>Você ainda não favoritou nada.</strong>
            <p>Use o coração nos produtos e projetos para montar sua própria seleção.</p>
          </div>
        )}
      </section>

      <AccountMissions />
      <AccountTickets />
      <AccountCommunity />
      <AccountActivity />

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
                  {order.edition && <small className="order-edition">{order.edition.label} · #{String(order.edition.number).padStart(2, "0")}/{order.edition.total}</small>}
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
    </StudioShell>
  );
}
