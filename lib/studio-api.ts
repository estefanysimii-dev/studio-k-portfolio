import type { StudioCheckout, StudioControlState, StudioOrder, StudioProduct, StudioPublicState } from "./studio-types";

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
