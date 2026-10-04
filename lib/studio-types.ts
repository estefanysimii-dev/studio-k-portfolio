export type AssistantCampaignType = "promotion" | "combo" | "news" | "bestseller" | "motivation" | "cute";

export type AssistantCampaign = {
  id: string;
  type: AssistantCampaignType;
  title: string;
  text: string;
  ctaLabel: string;
  href: string;
  priceCents: number;
  oldPriceCents: number;
  active: boolean;
};

export type StudioAssistantConfig = {
  enabled: boolean;
  intervalSeconds: number;
  imageUrl: string;
  campaigns: AssistantCampaign[];
};

export type StudioSite = {
  radio?: RadioConfig;
  assistant?: StudioAssistantConfig;
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
  memberDiscountPercent: number;
  memberBenefitTitle: string;
  memberBenefitDescription: string;
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

export type StudioViewerHotspot = {
  id: string;
  label: string;
  position: string;
  normal: string;
};

export type StudioViewerVariant = {
  id: string;
  label: string;
  colorHex: string;
  modelUrl: string;
  posterUrl?: string;
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
  compareModelUrl?: string;
  viewerHotspots?: StudioViewerHotspot[];
  viewerVariants?: StudioViewerVariant[];
  featured: boolean;
  published: boolean;
  created?: string;
  updated?: string;
};

export type StudioProduct = StudioItem & {
  priceCents: number;
  botProductId?: string;
};

export type StudioDrop = {
  id: string;
  title: string;
  description: string;
  productId: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  channelId: string;
  announceDiscord: boolean;
  published: boolean;
  status?: "draft" | "scheduled" | "active" | "ended";
  created?: string;
  updated?: string;
  announcedAt?: string;
  announcementMessageId?: string;
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

export type StudioMemberRarity = "common" | "rare" | "epic" | "legendary";

export type StudioMemberBadge = {
  id: string;
  label: string;
  icon: string;
  rarity: StudioMemberRarity;
  description?: string;
};

export type StudioMemberTitle = {
  id: string;
  label: string;
  rarity: StudioMemberRarity;
  description: string;
  unlocked: boolean;
};

export type StudioAchievement = {
  id: string;
  label: string;
  description: string;
  icon: string;
  rarity: StudioMemberRarity;
  unlocked: boolean;
  unlockedAt: string;
};

export type StudioPerk = {
  id: string;
  label: string;
  description: string;
  icon: string;
  rarity: StudioMemberRarity;
  unlocked: boolean;
  progress: number;
  target: number;
};

export type StudioIdRankConfig = {
  id: string;
  label: string;
  icon: string;
  rarity: StudioMemberRarity;
  minLevel: number;
};

export type StudioIdBadgeCondition =
  | "always"
  | "early-member"
  | "discord-member"
  | "supporter"
  | "purchases"
  | "neon-lover"
  | "feedbacks"
  | "level"
  | "favorites";

export type StudioIdBadgeConfig = {
  id: string;
  label: string;
  icon: string;
  rarity: StudioMemberRarity;
  description: string;
  condition: StudioIdBadgeCondition;
  value: number;
  enabled: boolean;
};

export type StudioIdConfig = {
  enabled: boolean;
  xp: {
    base: number;
    discordMember: number;
    purchase: number;
    feedback: number;
    favorite: number;
  };
  levelStep: number;
  earlyMemberLimit: number;
  thresholds: {
    collectorPurchases: number;
    profileFramePurchases: number;
    creatorLevel: number;
    levelFive: number;
    insiderLevel: number;
    iconLevel: number;
  };
  supporterRolePattern: string;
  features: {
    badges: boolean;
    achievements: boolean;
    perks: boolean;
  };
  ranks: StudioIdRankConfig[];
  badges: StudioIdBadgeConfig[];
  discordRankSync: {
    enabled: boolean;
    roleIds: Record<string, string>;
  };
};

export type StudioMemberProfile = {
  studioId: string;
  joinedAt: string;
  level: number;
  xp: number;
  levelFloor: number;
  nextLevelXp: number;
  rank: { id: string; label: string; icon: string; rarity: StudioMemberRarity };
  equippedTitle: { id: string; label: string; rarity: StudioMemberRarity };
  titles: StudioMemberTitle[];
  discountPercent: number;
  badges: StudioMemberBadge[];
  achievements: StudioAchievement[];
  perks: StudioPerk[];
  favorites: { items: string[]; products: string[] };
  stats: {
    purchases: number;
    lifetimeSpend: number;
    feedbacks: number;
    favorites: number;
    tickets: number;
    openTickets: number;
  };
  purchasedProductIds: string[];
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
  profile?: StudioMemberProfile;
  favorites?: { items: string[]; products: string[] };
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

export type StudioFeedback = {
  id: string;
  rating: number;
  comment: string;
  source: string;
  reference: string;
  name: string;
  avatar: string;
  submittedAt: string;
  visible?: boolean;
  order?: number;
  meta?: {
    service?: number | null;
    speed?: number | null;
    resolution?: number | null;
  };
};

export type StudioPublicState = {
  site: StudioSite;
  status: StudioStatus;
  items: StudioItem[];
  products: StudioProduct[];
  drops: StudioDrop[];
  feedbacks: StudioFeedback[];
  me: StudioMe;
};

export type StudioAnalytics = {
  days: number;
  pageViews: number;
  uniqueVisitors: number;
  returningVisitors: number;
  productViews: number;
  portfolioViews: number;
  favoriteAdds: number;
  checkoutStarts: number;
  ordersCreated: number;
  paidOrders: number;
  revenue: number;
  clicks: number;
  searches: number;
  filters: number;
  checkoutErrors: number;
  avgPageSeconds: number;
  avgScrollDepth: number;
  checkoutAbandonment: number;
  checkoutConversion: number;
  viewToOrder: number;
  topProducts: {
    id: string;
    name: string;
    views: number;
    favorites: number;
    checkouts: number;
    orders: number;
    dwellSeconds: number;
    avgDwellSeconds: number;
  }[];
  topSources: { label: string; value: number }[];
  topClicks: { label: string; value: number }[];
  topSearches: { label: string; value: number }[];
  exitPages: { label: string; value: number }[];
  daily: {
    day: string;
    pageViews: number;
    productViews: number;
    checkouts: number;
    orders: number;
  }[];
};

export type StudioControlState = StudioPublicState & {
  authorized: boolean;
  studioIdConfig?: StudioIdConfig;
  analytics?: StudioAnalytics;
  assets: StudioAsset[];
  user?: { name?: string; id?: string };
  discord?: {
    oauthConfigured: boolean;
    redirectUri: string;
    publicOrigin: string;
    botConnected: boolean;
    channels?: { id: string; name: string; type?: number }[];
    roles?: { id: string; name: string }[];
  };
};
