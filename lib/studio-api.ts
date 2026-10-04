import type { StudioCartItem, StudioCartQuote, StudioCheckout, StudioControlState, StudioOrder, StudioProduct, StudioPublicState, StudioTicket, StudioTicketMessage } from "./studio-types";

export type StudioProductMutation = StudioProduct & {
  _announcement?: {
    attempted: boolean;
    ok: boolean;
    error?: string;
    messageId?: string;
    botProductId?: string;
    channelId?: string;
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/studio/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || "Não foi possível concluir a solicitação.");
  }
  return data as T;
}

export const studioApi = {
  radio: () => request<import('./studio-types').RadioSnapshot>('radio'),
  track: (body: { sessionId: string; event: "page_view" | "page_leave" | "product_view" | "product_dwell" | "portfolio_view" | "search" | "filter" | "click" | "checkout_start" | "checkout_error"; itemKind?: "product" | "portfolio" | "page"; itemId?: string; path?: string; meta?: Record<string, string | number | boolean | null> }) =>
    fetch("/api/studio/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(() => undefined),
  publicState: () => request<StudioPublicState>("public-state"),
  controlState: () => request<StudioControlState>("control/state"),
  saveSite: (body: unknown) =>
    request("control/site", { method: "PUT", body: JSON.stringify(body) }),
  saveStudioIdConfig: (body: import("./studio-types").StudioIdConfig) =>
    request<import("./studio-types").StudioIdConfig>("control/studio-id", { method: "PUT", body: JSON.stringify(body) }),
  saveFeedbackModeration: (body: { order: string[]; hidden: string[] }) =>
    request<{ ok: boolean; moderation: { order: string[]; hidden: string[] }; feedbacks: import("./studio-types").StudioFeedback[] }>(
      "control/feedbacks",
      { method: "PUT", body: JSON.stringify(body) }
    ),
  saveCommerce: <T = unknown>(kind: string, body: unknown) =>
    request<T>(`control/commerce/${encodeURIComponent(kind)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCommerce: (kind: string, id: string) =>
    request(`control/commerce/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, { method: "DELETE" }),
  saveLeaderboardConfig: (enabled: boolean) =>
    request<{ enabled: boolean }>("control/leaderboard", { method: "PUT", body: JSON.stringify({ enabled }) }),
  restoreVersion: (id: string) =>
    request(`control/versions/${encodeURIComponent(id)}/restore`, { method: "POST", body: "{}" }),
  createItem: (body: unknown) =>
    request("control/items", { method: "POST", body: JSON.stringify(body) }),
  updateItem: (id: string, body: unknown) =>
    request(`control/items/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteItem: (id: string) =>
    request(`control/items/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createProduct: (body: unknown) =>
    request<StudioProductMutation>("control/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: string, body: unknown) =>
    request<StudioProductMutation>(`control/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id: string) =>
    request(`control/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createDrop: (body: unknown) =>
    request<import("./studio-types").StudioDrop>("control/drops", { method: "POST", body: JSON.stringify(body) }),
  updateDrop: (id: string, body: unknown) =>
    request<import("./studio-types").StudioDrop>(`control/drops/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteDrop: (id: string) =>
    request(`control/drops/${encodeURIComponent(id)}`, { method: "DELETE" }),
  syncBotProduct: (id: string) =>
    request<{ ok: boolean; botProductId: string }>(`control/products/${encodeURIComponent(id)}/sync-bot`, { method: "POST", body: "{}" }),
  announceProduct: (id: string, channelId: string) =>
    request<{ ok: boolean; messageId: string }>(`control/products/${encodeURIComponent(id)}/announce`, {
      method: "POST",
      body: JSON.stringify({ channelId })
    }),
  uploadTicket: (name: string, isPublic: boolean) =>
    request<{ uploadUrl: string; expiresIn: number }>("control/upload-ticket", {
      method: "POST",
      body: JSON.stringify({ name, public: isPublic })
    }),
  processAsset: (id: string) =>
    request<{ publicUrl: string; kind: "model" | "preview" }>(`control/assets/${encodeURIComponent(id)}/process`, {
      method: "POST",
      body: "{}"
    }),
  createOrder: (productId: string, couponCode = "") =>
    request<StudioCheckout>(`products/${encodeURIComponent(productId)}/order`, {
      method: "POST",
      body: JSON.stringify({ couponCode })
    }),
  search: (q: string) =>
    request<{ results: { kind: string; id: string; title: string; subtitle: string; href: string; score: number }[] }>(`search?q=${encodeURIComponent(q)}`),
  recommendations: (productId: string) =>
    request<{ recommendations: import("./studio-types").StudioRecommendation[] }>(`products/${encodeURIComponent(productId)}/recommendations`),
  myCart: (couponCode = "") =>
    request<{ cart: StudioCartItem[]; quote: StudioCartQuote }>(`me/cart${couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : ""}`),
  saveCart: (items: StudioCartItem[], couponCode = "") =>
    request<{ cart: StudioCartItem[]; quote: StudioCartQuote }>("me/cart", { method: "PUT", body: JSON.stringify({ items, couponCode }) }),
  checkoutCart: (couponCode = "") =>
    request<{ groupId: string; orderIds: string[]; total: number; quote: StudioCartQuote; payment: StudioCheckout["payment"] }>("me/cart/checkout", { method: "POST", body: JSON.stringify({ couponCode }) }),
  myNotifications: () => request<{ notifications: import("./studio-types").StudioNotification[] }>("me/notifications"),
  markNotification: (id: string, read = true) =>
    request<{ notifications: import("./studio-types").StudioNotification[] }>(`me/notifications/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ read }) }),
  readAllNotifications: () =>
    request<{ notifications: import("./studio-types").StudioNotification[] }>("me/notifications/read-all", { method: "POST", body: "{}" }),
  claimMission: (id: string) =>
    request<{ result: unknown; profile: import("./studio-types").StudioMemberProfile }>(`me/missions/${encodeURIComponent(id)}/claim`, { method: "POST", body: "{}" }),
  setLeaderboardOptIn: (enabled: boolean) =>
    request<{ enabled: boolean }>("me/leaderboard", { method: "PUT", body: JSON.stringify({ enabled }) }),
  myTickets: () => request<{ tickets: StudioTicket[] }>("me/tickets"),
  ticketMessages: (id: string) => request<{ messages: StudioTicketMessage[] }>(`me/tickets/${encodeURIComponent(id)}/messages`),
  replyTicket: (id: string, text: string) =>
    request<{ ok: boolean; id: string; created: string }>(`me/tickets/${encodeURIComponent(id)}/reply`, { method: "POST", body: JSON.stringify({ text }) }),
  myProfile: () => request<{ profile: import("./studio-types").StudioMemberProfile; favorites: { items: string[]; products: string[] } }>("me/profile"),
  setProfileTitle: (titleId: string) =>
    request<{ ok: boolean; equippedTitle: import("./studio-types").StudioMemberProfile["equippedTitle"]; profile: import("./studio-types").StudioMemberProfile }>(
      "me/profile/title",
      { method: "PUT", body: JSON.stringify({ titleId }) }
    ),
  ecosystemIdentity: () => request<{
    schemaVersion: number;
    subject: string;
    issuedAt: string;
    identity: { studioId: string; discordId: string; username: string; displayName: string; avatar: string };
    progression: { level: number; xp: number; rank: import("./studio-types").StudioMemberProfile["rank"]; title: import("./studio-types").StudioMemberProfile["equippedTitle"] };
    entitlements: { discountPercent: number; badges: import("./studio-types").StudioMemberBadge[]; perks: Omit<import("./studio-types").StudioPerk, "progress" | "target">[] };
  }>("me/ecosystem"),
  setFavorite: (kind: "items" | "products", id: string, favorite: boolean) =>
    request<{ ok: boolean; favorite: boolean; favorites: { items: string[]; products: string[] }; profile: import("./studio-types").StudioMemberProfile }>(
      `me/favorites/${kind}/${encodeURIComponent(id)}`,
      { method: "PUT", body: JSON.stringify({ favorite }) }
    ),
  myOrders: () => request<{ orders: StudioOrder[] }>("me/orders"),
  orderDelivery: (id: string) =>
    request<{ delivery: string; instructions: string; productName: string }>(`me/orders/${encodeURIComponent(id)}/delivery`),
  logout: () => request("logout", { method: "POST" })
};
