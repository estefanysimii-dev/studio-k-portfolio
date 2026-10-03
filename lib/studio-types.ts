export type StudioSite = {
  radio?: RadioConfig;
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
  defaultAnnouncementChannelId: string;
  autoAnnounceProducts: boolean;
  adminRoleIds: string[];
};

export type RadioConfig = {
  enabled: boolean;
  name: string;
  source: 'spotify' | 'schedule' | 'hls';
  spotifyUrl: string;
  streamUrl: string;
  tracks: { title: string; url: string; duration: number }[];
  shuffle?: boolean;
  epochMs: number;
  position: 'left' | 'right';
  compact: boolean;
  showInControl: boolean;
  autoplay: boolean;
  defaultVolume: number;
  analyze: boolean;
};

export type RadioSnapshot = { radio: RadioConfig; serverNowMs: number };

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
  sourceAssetId?: string;
  generated?: boolean;
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

export type StudioOrder = {
  id: string;
  productId: string;
  productName: string;
  price: number;
  status: string;
  created: string;
  expires?: string;
  approvedAt?: string;
  deliveredAt?: string;
  couponCode?: string;
  discount?: number;
  error?: string;
  deliveryType?: "digital" | "service";
};

export type StudioCheckout = {
  id: string;
  status: string;
  price: number;
  expires?: string;
  productName: string;
  payment: {
    pixKey: string;
    recipient: string;
    instructions: string;
  };
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
    channels?: { id: string; name: string; type?: number }[];
  };
};
