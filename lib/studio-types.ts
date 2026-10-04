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
  priority?: number;
  startsAt?: string;
  endsAt?: string;
  pages?: string[];
  audience?: "all" | "guest" | "member";
  maxViews?: number;
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
  gender?: "unisex" | "feminino" | "masculino";
  neon?: boolean;
  stockMode?: "unlimited" | "digital" | "limited" | "slots" | "numbered";
  stockLimit?: number;
  limitedLabel?: string;
  postPurchaseRoleId?: string;
  soldCount?: number;
  viewsToday?: number;
  favoritesTotal?: number;
  remaining?: number | null;
  available?: boolean;
};

export type StudioBundle = {
  id: string;
  name: string;
  description: string;
  productIds: string[];
  minItems: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  tiers?: { minItems: number; discountType: "percent" | "fixed"; discountValue: number }[];
  giftProductId?: string;
  active: boolean;
  created?: string;
  updated?: string;
};

export type StudioCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl: string;
  productIds: string[];
  itemIds: string[];
  active: boolean;
  startsAt: string;
  endsAt: string;
};

export type StudioMission = {
  id: string;
  title: string;
  description: string;
  type: "view_product" | "favorite_products" | "purchases" | "feedbacks" | "join_discord" | "visit_path";
  target: number;
  targetId: string;
  xp: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
  progress?: number;
  complete?: boolean;
  claimed?: boolean;
};

export type StudioBanner = {
  id: string;
  title: string;
  text: string;
  imageUrl: string;
  href: string;
  placement: "all" | "home" | "products" | "portfolio" | "popup";
  active: boolean;
  startsAt: string;
  endsAt: string;
};

export type StudioRoleBenefit = {
  id: string;
  roleId: string;
  label: string;
  discountPercent: number;
  stackWithCoupon: boolean;
  productIds: string[];
  excludedProductIds?: string[];
  collectionIds: string[];
  active: boolean;
};

export type StudioSchedule = {
  id: string;
  kind: "product_publish" | "product_unpublish" | "collection_activate" | "collection_deactivate" | "banner_activate" | "banner_deactivate";
  targetId: string;
  runAt: string;
  status: "scheduled" | "done" | "failed" | "cancelled";
  error: string;
};

export type StudioGalleryItem = {
  id: string;
  userId: string;
  name: string;
  caption: string;
  imageUrl: string;
  productIds: string[];
  status: "pending" | "approved" | "rejected";
  created?: string;
};

export type StudioLookbook = {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  productIds: string[];
  active: boolean;
};

export type StudioNotification = {
  id: string;
  type: string;
  title: string;
  text: string;
  href: string;
  read: boolean;
  created: string;
};

export type StudioCartItem = { productId: string; quantity: number };

export type StudioCartQuote = {
  items: {
    productId: string;
    name: string;
    quantity: number;
    basePrice: number;
    unitPrice: number;
    dropDiscount?: number;
    dropPercent?: number;
    roleDiscount: number;
    roleBenefit?: { id: string; label: string; discountPercent: number; stackWithCoupon?: boolean } | null;
    subtotal: number;
    gift?: boolean;
  }[];
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  total: number;
  appliedBundles: { id: string; name: string; discount: number; giftProductId?: string; giftName?: string }[];
  coupon?: { code: string; discount: number } | null;
};

export type StudioRecommendation = {
  productId: string;
  score: number;
  reason: string;
};

export type StudioActivityItem = {
  id: string;
  type: string;
  title: string;
  text: string;
  href: string;
  created: string;
};

export type StudioCommerceState = {
  bundles: StudioBundle[];
  collections: StudioCollection[];
  missions: StudioMission[];
  banners: StudioBanner[];
  roleBenefits?: StudioRoleBenefit[];
  schedules?: StudioSchedule[];
  gallery: StudioGalleryItem[];
  lookbooks: StudioLookbook[];
  leaderboard: { enabled: boolean } | { userId: string; studioId?: string; score: number }[];
  feedbackAutomation?: { enabled: boolean; delayHours: number };
  activity?: StudioActivityItem[];
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
    bonusXp?: number;
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

export type StudioTicket = {
  id: string;
  channel_id: string;
  category: string;
  status: string;
  state: string;
  priority: string;
  created: string;
  updated: string;
  claimed_by?: string;
  claimedName?: string;
  closed_reason?: string;
  transcriptAvailable?: boolean;
  notes?: { actor: string; note: string; private: number; created: string }[];
};

export type StudioTicketMessage = {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  customer: boolean;
  bot: boolean;
  content: string;
  attachments: { name: string; url: string }[];
  created: string;
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
  edition?: { number: number; total: number; label: string } | null;
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
  commerce?: StudioCommerceState;
  personal?: {
    cart: StudioCartItem[];
    notifications: StudioNotification[];
    missions: StudioMission[];
    recommendations: StudioRecommendation[];
    leaderboardOptIn?: boolean;
    restockSubscriptions?: string[];
  };
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
  avgTicket: number;
  topCoupons: { label: string; value: number }[];
  clicks: number;
  searches: number;
  filters: number;
  checkoutErrors: number;
  cartUpdates: number;
  cartCheckouts: number;
  cartSessions: number;
  cartCheckoutSessions: number;
  cartAbandonment: number;
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
  clickPoints: { path: string; label: string; x: number; y: number; created: string }[];
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
  commerce?: StudioCommerceState;
  versions?: {
    id: string;
    entityType: string;
    entityId: string;
    before: unknown;
    after: unknown;
    actor: string;
    action: string;
    created: string;
  }[];
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
