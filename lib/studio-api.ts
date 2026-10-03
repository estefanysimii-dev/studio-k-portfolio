import type { StudioCheckout, StudioControlState, StudioOrder, StudioPublicState } from "./studio-types";

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
  publicState: () => request<StudioPublicState>("public-state"),
  controlState: () => request<StudioControlState>("control/state"),
  saveSite: (body: unknown) =>
    request("control/site", { method: "PUT", body: JSON.stringify(body) }),
  createItem: (body: unknown) =>
    request("control/items", { method: "POST", body: JSON.stringify(body) }),
  updateItem: (id: string, body: unknown) =>
    request(`control/items/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteItem: (id: string) =>
    request(`control/items/${encodeURIComponent(id)}`, { method: "DELETE" }),
  createProduct: (body: unknown) =>
    request("control/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: string, body: unknown) =>
    request(`control/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id: string) =>
    request(`control/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
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
  myOrders: () => request<{ orders: StudioOrder[] }>("me/orders"),
  orderDelivery: (id: string) =>
    request<{ delivery: string; instructions: string; productName: string }>(`me/orders/${encodeURIComponent(id)}/delivery`),
  logout: () => request("logout", { method: "POST" })
};
