export type StudioSite = {
  brandName: string;
  brandTagline: string;
  logoUrl: string;
  homeBackgroundUrl: string;
  controlBackgroundUrl: string;
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  discordInviteUrl: string;
  adminRoleIds: string[];
};

export type StudioItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  coverUrl: string;
  modelUrl: string;
  videoUrl?: string;
  gifUrl?: string;
  galleryUrls?: string[];
  featured: boolean;
  published: boolean;
  created?: string;
  updated?: string;
};

export type StudioProduct = StudioItem & {
  priceCents: number;
  botProductId?: string;
};

export type StudioAsset = {
  id: string;
  originalName: string;
  filename: string;
  ext: string;
  visibility: "public" | "private";
  size: number;
  created: string;
  publicUrl: string;
};

export type StudioMe = {
  authenticated: boolean;
  canControl: boolean;
  user?: { id: string; username: string; name: string; avatar?: string };
  member?: {
    id?: string;
    name?: string;
    roles?: { id: string; name: string }[];
    administrator?: boolean;
    manageGuild?: boolean;
    inGuild?: boolean;
    avatar?: string;
  };
};

export type StudioStatus = {
  botOnline: boolean;
  storeOpen: boolean;
  ticketsOpen: boolean;
  openTickets: number;
  pendingOrders: number;
  updatedAt: string;
};

export type StudioPublicState = {
  site: StudioSite;
  status: StudioStatus;
  items: StudioItem[];
  products: StudioProduct[];
  feedbacks: unknown[];
  me: StudioMe;
};

export type StudioControlState = StudioPublicState & {
  authorized: boolean;
  assets: StudioAsset[];
  user?: { name?: string; id?: string };
  discord?: {
    oauthConfigured: boolean;
    redirectUri: string;
    publicOrigin: string;
    botConnected: boolean;
  };
};
