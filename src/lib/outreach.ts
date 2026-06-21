/**
 * Outreach mock data (design mode, no backend). The Outreach section is a
 * multi-channel messaging hub: a WhatsApp Business inbox where an AI agent
 * handles conversations and the realtor can take over, plus message templates,
 * broadcasts, contacts, and automated chat flows.
 *
 * Everything here is client-side seed data (same pattern as src/lib/agents.ts
 * and src/lib/conversations.ts). When a backend is ready, a developer should
 * replace these readers with the real WhatsApp Business / Gupshup endpoints:
 *   - threads + messages   GET  /api/v1/orgs/{org}/outreach/{platform}/threads
 *   - send a message       POST /api/v1/orgs/{org}/outreach/{platform}/threads/{id}/messages
 *   - templates            GET  /api/v1/orgs/{org}/outreach/whatsapp/templates
 *   - broadcasts           GET  /api/v1/orgs/{org}/outreach/whatsapp/broadcasts
 *   - contacts             GET  /api/v1/orgs/{org}/outreach/contacts
 *   - chat flows           GET  /api/v1/orgs/{org}/outreach/whatsapp/flows
 * The shapes below describe what each view expects.
 */

export type PlatformKey = "whatsapp" | "facebook" | "instagram";

export type TabKey =
  | "inbox"
  | "templates"
  | "broadcasts"
  | "contacts"
  | "flows"
  // Instagram is a publishing channel, not a chat inbox, so it has its own tabs.
  | "compose"
  | "posts";

export interface OutreachPlatform {
  key: PlatformKey;
  label: string;
  /** Connection state drives the connection card and the inbox empty state. */
  connected: boolean;
  /** Phone number (WhatsApp) or @handle (Facebook / Instagram). */
  handle: string;
  /** WhatsApp messaging credits, shown as a chip. */
  balance?: string;
  /** Platform-aware page subtitle (fixes the Figma's WhatsApp/Facebook mix-up). */
  subtitle: string;
  /** Which tabs this platform exposes. */
  tabs: TabKey[];
}

export const PLATFORMS: OutreachPlatform[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    connected: true,
    handle: "+91 95270 49765",
    balance: "₹2.40",
    subtitle: "Reply to enquiries, send templates, and run broadcasts from one inbox.",
    tabs: ["inbox", "templates", "broadcasts", "contacts", "flows"],
  },
  {
    key: "facebook",
    label: "Facebook",
    connected: true,
    handle: "Skyline Realty",
    subtitle: "Answer Page messages and comments without leaving the dashboard.",
    tabs: ["inbox", "contacts"],
  },
  {
    key: "instagram",
    label: "Instagram",
    connected: true,
    handle: "@skylinerealty",
    subtitle: "Publish reels and photo posts to your Instagram Business account.",
    tabs: ["compose", "posts"],
  },
];

export function platformByKey(key: PlatformKey): OutreachPlatform {
  return PLATFORMS.find((p) => p.key === key) ?? PLATFORMS[0];
}

export const TAB_LABELS: Record<TabKey, string> = {
  inbox: "Inbox",
  templates: "Templates",
  broadcasts: "Broadcasts",
  contacts: "Contacts",
  flows: "Chat Flows",
  compose: "Compose",
  posts: "Posts",
};

/* --------------------------------- inbox ---------------------------------- */

export interface OutreachMessage {
  id: string;
  from: "contact" | "agent";
  /** For agent messages: was it the AI or a human teammate who replied. */
  by?: "ai" | "human";
  text: string;
  /** Display time, e.g. "9:45 AM". */
  time: string;
  /** Delivery state for agent messages (drives the read ticks). */
  status?: "sent" | "delivered" | "read";
}

export interface OutreachThread {
  id: string;
  platform: PlatformKey;
  name: string;
  initials: string;
  /** Phone (WhatsApp) or handle (FB / IG). */
  contact: string;
  online: boolean;
  unread: number;
  /** Relative time of the last message, e.g. "10m". */
  lastTime: string;
  /** Whether the AI is currently handling this thread (vs. a human). */
  aiHandling: boolean;
  messages: OutreachMessage[];
}

const WHATSAPP_THREADS: OutreachThread[] = [
  {
    id: "wa-ketan",
    platform: "whatsapp",
    name: "Ketan Mehta",
    initials: "KM",
    contact: "+91 98231 55012",
    online: true,
    unread: 2,
    lastTime: "10m",
    aiHandling: true,
    messages: [
      {
        id: "m1",
        from: "contact",
        text: "Hi, I'm looking for a 1200 sqft office space in Baner. My budget is around ₹75K per month.",
        time: "9:45 AM",
      },
      {
        id: "m2",
        from: "agent",
        by: "ai",
        text: "Hello Ketan, thanks for reaching out to TryThat.ai. We have some good office spaces in Baner that fit your requirement. Quick question to narrow it down: are you looking for furnished or unfurnished space?",
        time: "9:47 AM",
        status: "read",
      },
      {
        id: "m3",
        from: "contact",
        text: "Furnished would be preferred. Also, I'll need dedicated parking for at least 4 cars.",
        time: "9:49 AM",
      },
      {
        id: "m4",
        from: "contact",
        text: "Yes please, also let me know about site visit slots this week.",
        time: "9:50 AM",
      },
    ],
  },
  {
    id: "wa-rohit",
    platform: "whatsapp",
    name: "Rohit Jadhav",
    initials: "RJ",
    contact: "+91 99700 41288",
    online: true,
    unread: 1,
    lastTime: "25m",
    aiHandling: true,
    messages: [
      {
        id: "m1",
        from: "contact",
        text: "I saw your 3BHK listing in Kharadi. Is it still available?",
        time: "9:20 AM",
      },
      {
        id: "m2",
        from: "agent",
        by: "ai",
        text: "Hi Rohit, yes the 3BHK in Kharadi is available. It is a RERA-registered project with possession from December next year. Would you like the floor plan and price list?",
        time: "9:22 AM",
        status: "read",
      },
      {
        id: "m3",
        from: "contact",
        text: "Can we schedule a site visit this weekend?",
        time: "9:31 AM",
      },
    ],
  },
  {
    id: "wa-rahul",
    platform: "whatsapp",
    name: "Rahul Sharma",
    initials: "RS",
    contact: "+91 98190 27640",
    online: false,
    unread: 0,
    lastTime: "1h",
    aiHandling: false,
    messages: [
      {
        id: "m1",
        from: "contact",
        text: "What floor is the office on? Is there a lift?",
        time: "8:40 AM",
      },
      {
        id: "m2",
        from: "agent",
        by: "human",
        text: "Hi Rahul, it is on the 4th floor and the building has two passenger lifts and one service lift. Happy to walk you through it on a visit.",
        time: "8:52 AM",
        status: "read",
      },
    ],
  },
  {
    id: "wa-meena",
    platform: "whatsapp",
    name: "Meena Iyer",
    initials: "MI",
    contact: "+91 98860 77245",
    online: false,
    unread: 0,
    lastTime: "3h",
    aiHandling: true,
    messages: [
      {
        id: "m1",
        from: "contact",
        text: "Do you have any 2BHK ready to move in under 90 lakh?",
        time: "6:10 AM",
      },
      {
        id: "m2",
        from: "agent",
        by: "ai",
        text: "Hi Meena, yes we have a ready 2BHK in Wakad at ₹88 L, all inclusive. I can share photos and the brochure. Shall I?",
        time: "6:12 AM",
        status: "delivered",
      },
    ],
  },
];

const FACEBOOK_THREADS: OutreachThread[] = [
  {
    id: "fb-aditya",
    platform: "facebook",
    name: "Aditya Kulkarni",
    initials: "AK",
    contact: "Messaged your Page",
    online: false,
    unread: 1,
    lastTime: "12m",
    aiHandling: true,
    messages: [
      {
        id: "m1",
        from: "contact",
        text: "Saw your reel on the Baner project. What's the starting price?",
        time: "10:02 AM",
      },
      {
        id: "m2",
        from: "agent",
        by: "ai",
        text: "Hi Aditya, the Baner project starts at ₹1.25 Cr for a 2BHK. Would you like me to send the full price list and floor plans?",
        time: "10:03 AM",
        status: "read",
      },
    ],
  },
  {
    id: "fb-sneha",
    platform: "facebook",
    name: "Sneha Patil",
    initials: "SP",
    contact: "Commented on a post",
    online: false,
    unread: 0,
    lastTime: "2h",
    aiHandling: false,
    messages: [
      {
        id: "m1",
        from: "contact",
        text: "Is the clubhouse ready or still under construction?",
        time: "8:15 AM",
      },
      {
        id: "m2",
        from: "agent",
        by: "human",
        text: "Hi Sneha, the clubhouse is ready and operational. You're welcome to see it on a visit this week.",
        time: "8:40 AM",
        status: "read",
      },
    ],
  },
];

const THREADS: Record<PlatformKey, OutreachThread[]> = {
  whatsapp: WHATSAPP_THREADS,
  facebook: FACEBOOK_THREADS,
  instagram: [],
};

export function threadsFor(platform: PlatformKey): OutreachThread[] {
  return THREADS[platform] ?? [];
}

/** Latest message preview for a thread (used in the contact list). */
export function lastMessage(thread: OutreachThread): OutreachMessage | undefined {
  return thread.messages[thread.messages.length - 1];
}

/* ------------------------------- templates -------------------------------- */

export type TemplateCategory = "Marketing" | "Utility" | "Authentication";
export type TemplateStatus = "Approved" | "Pending" | "Rejected";
/** Template composition, used for the "All Types" filter. */
export type TemplateKind = "Standard" | "Media" | "Interactive";
/** What a quick-reply / call-to-action button does (drives its icon). */
export type TemplateButtonKind = "url" | "call" | "reply" | "copy";

export interface TemplateButton {
  label: string;
  kind: TemplateButtonKind;
}

export interface WaTemplate {
  id: string;
  /** API-style name, e.g. new_property_launch. */
  name: string;
  /** Human display name shown in the preview header. */
  title: string;
  category: TemplateCategory;
  kind: TemplateKind;
  language: string;
  status: TemplateStatus;
  /** Whether the template carries a header image. */
  hasMedia: boolean;
  /** Bold first line of the message (optional). */
  heading?: string;
  /** Body rendered with sample values, so the preview reads like a real chat. */
  body: string;
  buttons: TemplateButton[];
  /** How many times it has been sent. */
  sent: number;
  updated: string;
}

export const TEMPLATES: WaTemplate[] = [
  {
    id: "t1",
    name: "new_property_launch",
    title: "New Property Launch",
    category: "Marketing",
    kind: "Media",
    language: "English",
    status: "Approved",
    hasMedia: true,
    heading: "Skyline Vista is now live",
    body: "Hi Ketan, 2 and 3 BHK homes at Baner IT Park start at ₹1.25 Cr. Early bird offers close on 31 Mar.",
    buttons: [
      { label: "View Brochure", kind: "url" },
      { label: "Talk to Sales", kind: "call" },
    ],
    sent: 1840,
    updated: "2 days ago",
  },
  {
    id: "t2",
    name: "special_launch_price",
    title: "Special Offer",
    category: "Marketing",
    kind: "Media",
    language: "English",
    status: "Approved",
    hasMedia: true,
    heading: "Limited time: pre-launch price",
    body: "Hi Ketan, pre-launch pricing for Skyline Vista is open this week only. Save up to ₹4 L on select 3 BHK homes.",
    buttons: [
      { label: "Book Now", kind: "url" },
      { label: "Schedule Call", kind: "call" },
    ],
    sent: 612,
    updated: "5 days ago",
  },
  {
    id: "t3",
    name: "special_offer_new",
    title: "Special Offer New",
    category: "Marketing",
    kind: "Media",
    language: "English",
    status: "Pending",
    hasMedia: true,
    heading: "Festive launch pricing",
    body: "Hi Ketan, this Diwali book a home at Skyline Vista and save on stamp duty. Offer valid till 5 Nov.",
    buttons: [
      { label: "Book Now", kind: "url" },
      { label: "Schedule Call", kind: "call" },
    ],
    sent: 0,
    updated: "6 hours ago",
  },
  {
    id: "t4",
    name: "site_visit_invite",
    title: "Site Visit Invite",
    category: "Marketing",
    kind: "Interactive",
    language: "English",
    status: "Approved",
    hasMedia: false,
    heading: "You're invited for a site visit 🏡",
    body: "Hi Ketan, we'd love to show you around Baner IT Park, the home that fits what you're looking for. Does Sat, 25 Jan at 11 AM work?",
    buttons: [
      { label: "Confirm Visit", kind: "reply" },
      { label: "Pick Another Time", kind: "reply" },
    ],
    sent: 388,
    updated: "1 day ago",
  },
  {
    id: "t5",
    name: "site_visit_reminder",
    title: "Site Visit Reminder",
    category: "Utility",
    kind: "Interactive",
    language: "English",
    status: "Approved",
    hasMedia: false,
    heading: "Your visit is confirmed",
    body: "Hi Ketan, a reminder for your visit to Skyline Vista, Baner on Sat, 25 Jan at 11 AM. Reply to confirm or reschedule.",
    buttons: [
      { label: "Confirm", kind: "reply" },
      { label: "Reschedule", kind: "reply" },
    ],
    sent: 642,
    updated: "5 days ago",
  },
  {
    id: "t6",
    name: "price_drop_update",
    title: "Price Update",
    category: "Marketing",
    kind: "Standard",
    language: "Hindi",
    status: "Pending",
    hasMedia: false,
    body: "नमस्ते केतन, स्काईलाइन विस्टा में 3 BHK की कीमत अब ₹1.4 करोड़ है। क्या मैं आपको विवरण भेजूं?",
    buttons: [],
    sent: 0,
    updated: "6 hours ago",
  },
  {
    id: "t7",
    name: "login_otp",
    title: "Login OTP",
    category: "Authentication",
    kind: "Standard",
    language: "English",
    status: "Approved",
    hasMedia: false,
    body: "123456 is your TryThat.ai verification code. It is valid for 10 minutes. Do not share it with anyone.",
    buttons: [{ label: "Copy Code", kind: "copy" }],
    sent: 3120,
    updated: "1 week ago",
  },
  {
    id: "t8",
    name: "festive_offer_diwali",
    title: "Diwali Offer",
    category: "Marketing",
    kind: "Media",
    language: "English",
    status: "Rejected",
    hasMedia: true,
    heading: "Happy Diwali, Ketan ✨",
    body: "Celebrate the festival in a new home. Book this week and save ₹2 L on select homes at Skyline Vista. Limited units.",
    buttons: [
      { label: "Book Now", kind: "url" },
      { label: "View Homes", kind: "url" },
    ],
    sent: 0,
    updated: "3 days ago",
  },
];

export const TEMPLATE_STATUS_TONE: Record<TemplateStatus, "good" | "warm" | "cold"> = {
  Approved: "good",
  Pending: "warm",
  Rejected: "cold",
};

/* ------------------------------- broadcasts ------------------------------- */

export type BroadcastStatus = "Sent" | "Sending" | "Scheduled" | "Draft";

export interface Broadcast {
  id: string;
  name: string;
  template: string;
  /** Total recipients. */
  audience: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  status: BroadcastStatus;
  when: string;
}

export const BROADCASTS: Broadcast[] = [
  {
    id: "b1",
    name: "Baner launch invite",
    template: "new_listing_alert",
    audience: 1240,
    sent: 1240,
    delivered: 1212,
    read: 968,
    replied: 142,
    failed: 28,
    status: "Sent",
    when: "18 Jun 2026",
  },
  {
    id: "b2",
    name: "Weekend open house",
    template: "site_visit_reminder",
    audience: 560,
    sent: 340,
    delivered: 320,
    read: 180,
    replied: 24,
    failed: 20,
    status: "Sending",
    when: "19 Jun 2026",
  },
  {
    id: "b3",
    name: "Kharadi price revision",
    template: "price_drop_update",
    audience: 880,
    sent: 0,
    delivered: 0,
    read: 0,
    replied: 0,
    failed: 0,
    status: "Scheduled",
    when: "21 Jun 2026",
  },
  {
    id: "b4",
    name: "NRI investor list",
    template: "new_listing_alert",
    audience: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    replied: 0,
    failed: 0,
    status: "Draft",
    when: "Not scheduled",
  },
];

export const BROADCAST_STATUS_TONE: Record<BroadcastStatus, "good" | "warm" | "info" | "neutral"> = {
  Sent: "good",
  Sending: "warm",
  Scheduled: "info",
  Draft: "neutral",
};

/* -------------------------------- contacts -------------------------------- */

export interface OutreachContact {
  id: string;
  name: string;
  initials: string;
  phone: string;
  tags: string[];
  /** How the contact entered the system: Manual, Import, WhatsApp, Broadcast. */
  source: string;
  /** Date the contact was added, e.g. "19 Jun 2026". */
  added: string;
}

/** Common real-estate CRM tags offered as quick-add suggestions. */
export const CONTACT_TAGS = [
  "Buyer",
  "Seller",
  "Tenant",
  "Landlord",
  "Investor",
  "NRI",
  "Hot lead",
  "Warm lead",
  "Premium",
  "Site visit",
  "Loan needed",
  "Follow-up",
];

export const CONTACTS: OutreachContact[] = [
  { id: "ct1", name: "Ketan Mehta", initials: "KM", phone: "+91 98231 55012", tags: ["Buyer", "Office space"], source: "WhatsApp", added: "19 Jun 2026" },
  { id: "ct2", name: "Rohit Jadhav", initials: "RJ", phone: "+91 99700 41288", tags: ["Buyer", "3BHK", "Hot lead"], source: "WhatsApp", added: "19 Jun 2026" },
  { id: "ct3", name: "Rahul Sharma", initials: "RS", phone: "+91 98190 27640", tags: ["Tenant", "Office space"], source: "Manual", added: "18 Jun 2026" },
  { id: "ct4", name: "Meena Iyer", initials: "MI", phone: "+91 98860 77245", tags: ["Buyer", "2BHK", "Ready to move"], source: "Import", added: "18 Jun 2026" },
  { id: "ct5", name: "Imran Khan", initials: "IK", phone: "+91 99300 21884", tags: ["Investor", "Premium"], source: "Manual", added: "17 Jun 2026" },
  { id: "ct6", name: "Priya Nair", initials: "PN", phone: "+91 97654 33120", tags: ["Buyer", "3BHK"], source: "Broadcast", added: "17 Jun 2026" },
  { id: "ct7", name: "Vikram Joshi", initials: "VJ", phone: "+91 98220 11763", tags: ["Buyer", "Villa", "Premium"], source: "Manual", added: "16 Jun 2026" },
  { id: "ct8", name: "Neha Reddy", initials: "NR", phone: "+91 99876 55021", tags: ["Tenant", "2BHK", "Site visit"], source: "WhatsApp", added: "16 Jun 2026" },
  { id: "ct9", name: "Sameer Gupta", initials: "SG", phone: "+91 99300 88214", tags: ["Investor", "NRI"], source: "Import", added: "15 Jun 2026" },
  { id: "ct10", name: "Anjali Verma", initials: "AV", phone: "+91 98191 44520", tags: ["Buyer", "3BHK", "Follow-up"], source: "Manual", added: "14 Jun 2026" },
  { id: "ct11", name: "Karan Singh", initials: "KS", phone: "+91 90040 22119", tags: ["Tenant", "Office space"], source: "Manual", added: "13 Jun 2026" },
  { id: "ct12", name: "Deepak Rao", initials: "DR", phone: "+91 99020 31188", tags: ["Buyer", "Penthouse", "Premium"], source: "Broadcast", added: "12 Jun 2026" },
  { id: "ct13", name: "Lata Kulkarni", initials: "LK", phone: "+91 98330 90112", tags: ["Tenant", "2BHK"], source: "Import", added: "11 Jun 2026" },
  { id: "ct14", name: "Faisal Ahmed", initials: "FA", phone: "+91 98860 70245", tags: ["Buyer", "3BHK", "Warm lead"], source: "Manual", added: "10 Jun 2026" },
];

/* ------------------------------- chat flows ------------------------------- */

export interface ChatFlow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  runs: number;
}

export const CHAT_FLOWS: ChatFlow[] = [
  {
    id: "f1",
    name: "New enquiry welcome",
    trigger: "First message received",
    action: "Greet, ask budget and location, hand off to the AI agent",
    enabled: true,
    runs: 1840,
  },
  {
    id: "f2",
    name: "After hours auto-reply",
    trigger: "Message received after 8 PM",
    action: "Send a holding reply and book a morning callback",
    enabled: true,
    runs: 612,
  },
  {
    id: "f3",
    name: "Site visit confirmation",
    trigger: "Visit booked",
    action: "Send location pin and a reminder the evening before",
    enabled: true,
    runs: 388,
  },
  {
    id: "f4",
    name: "Re-engage cold leads",
    trigger: "No reply for 7 days",
    action: "Send a fresh listing that matches their budget",
    enabled: false,
    runs: 96,
  },
];

/* --------------------------- chat flow builder ---------------------------- */
/**
 * A flow is a TREE of nodes (single parent each). Branch nodes (question,
 * condition) have several labeled branches; linear nodes (start, message,
 * delay) have one; end has none. The builder auto-arranges and auto-connects
 * from this shape, so the user never positions or wires nodes by hand.
 * Design mode only: stored in localStorage (tt_chat_flows), like tt_agents.
 */

export type FlowNodeKind = "start" | "message" | "question" | "condition" | "delay" | "end";

export interface FlowBranch {
  id: string;
  /** "" for a linear output; "Yes"/"No" for a condition; a reply option for a question. */
  label: string;
  /** Child node id, or null for an open "add step" slot. */
  to: string | null;
}

export interface FlowNodeConfig {
  // message
  text?: string;
  templateName?: string | null;
  media?: "image" | "video" | null;
  quickReplies?: string[];
  // question
  question?: string;
  // condition (branches are fixed Yes / No)
  matchType?: "contains" | "equals" | "starts_with";
  keyword?: string;
  // delay
  delayValue?: number;
  delayUnit?: "minutes" | "hours" | "days";
}

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  branches: FlowBranch[];
  config: FlowNodeConfig;
}

export interface Flow {
  id: string;
  name: string;
  enabled: boolean;
  runs: number;
  nodes: Record<string, FlowNode>;
  rootId: string;
  updatedAt: number;
}

export const FLOW_KIND_LABEL: Record<FlowNodeKind, string> = {
  start: "Start",
  message: "Send message",
  question: "Ask question",
  condition: "Condition",
  delay: "Delay",
  end: "End",
};

/** Kinds the user can add from the palette (everything except the fixed Start). */
export const FLOW_PALETTE: FlowNodeKind[] = ["message", "question", "condition", "delay", "end"];

let _nid = 0;
function nid(prefix = "n"): string {
  _nid += 1;
  return `${prefix}-${_nid.toString(36)}-${Date.now().toString(36)}`;
}

function branch(label = ""): FlowBranch {
  return { id: nid("b"), label, to: null };
}

/** A fresh node of a kind, with sensible default branches + config. */
export function newFlowNode(kind: FlowNodeKind): FlowNode {
  switch (kind) {
    case "start":
      return { id: nid(), kind, branches: [branch()], config: {} };
    case "message":
      return { id: nid(), kind, branches: [branch()], config: { text: "" } };
    case "question":
      return { id: nid(), kind, branches: [branch("Interested"), branch("Not now")], config: { question: "" } };
    case "condition":
      return { id: nid(), kind, branches: [branch("Yes"), branch("No")], config: { matchType: "contains", keyword: "" } };
    case "delay":
      return { id: nid(), kind, branches: [branch()], config: { delayValue: 1, delayUnit: "hours" } };
    case "end":
      return { id: nid(), kind, branches: [], config: {} };
  }
}

/* ------------------------------- templates -------------------------------- */

interface FlowSpec {
  kind: FlowNodeKind;
  config?: FlowNodeConfig;
  next?: FlowSpec | null;
  branches?: { label: string; next: FlowSpec | null }[];
}

function buildFlow(name: string, enabled: boolean, runs: number, spec: FlowSpec): Flow {
  const nodes: Record<string, FlowNode> = {};
  function add(s: FlowSpec): string {
    const node = newFlowNode(s.kind);
    if (s.config) node.config = { ...node.config, ...s.config };
    if ((s.kind === "question" || s.kind === "condition") && s.branches) {
      node.branches = s.branches.map((b) => ({ id: nid("b"), label: b.label, to: b.next ? add(b.next) : null }));
    } else if (s.kind !== "end") {
      node.branches = [{ id: nid("b"), label: "", to: s.next ? add(s.next) : null }];
    }
    nodes[node.id] = node;
    return node.id;
  }
  const rootId = add(spec);
  return { id: nid("flow"), name, enabled, runs, nodes, rootId, updatedAt: Date.now() };
}

export interface FlowTemplate {
  key: string;
  label: string;
  desc: string;
  build: () => Flow;
}

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    key: "blank",
    label: "Blank flow",
    desc: "Start from scratch with just a trigger",
    build: () => buildFlow("Untitled flow", false, 0, { kind: "start", next: null }),
  },
  {
    key: "welcome",
    label: "Welcome new lead",
    desc: "Greet, qualify, and route the enquiry",
    build: () =>
      buildFlow("New enquiry welcome", true, 1840, {
        kind: "start",
        next: {
          kind: "message",
          config: { text: "Hi {{first_name}}, thanks for reaching out to Skyline Realty. I can help you find the right home." },
          next: {
            kind: "question",
            config: { question: "What are you looking for?" },
            branches: [
              { label: "Buy", next: { kind: "message", config: { text: "Great. What is your budget and preferred area?" }, next: { kind: "end" } } },
              { label: "Rent", next: { kind: "message", config: { text: "Sure. Share your budget and locality and I will send options." }, next: { kind: "end" } } },
              { label: "Just browsing", next: { kind: "end" } },
            ],
          },
        },
      }),
  },
  {
    key: "after-hours",
    label: "After-hours auto-reply",
    desc: "Hold the lead and book a morning callback",
    build: () =>
      buildFlow("After hours auto-reply", true, 612, {
        kind: "start",
        next: {
          kind: "message",
          config: { text: "Thanks for your message. Our team is offline right now and will get back to you in the morning." },
          next: {
            kind: "delay",
            config: { delayValue: 10, delayUnit: "hours" },
            next: {
              kind: "message",
              config: { text: "Good morning {{first_name}}. When is a good time to call you back today?" },
              next: { kind: "end" },
            },
          },
        },
      }),
  },
  {
    key: "site-visit",
    label: "Site-visit confirmation",
    desc: "Confirm or reschedule a booked visit",
    build: () =>
      buildFlow("Site visit confirmation", true, 388, {
        kind: "start",
        next: {
          kind: "message",
          config: { text: "Hi {{first_name}}, your site visit to Skyline Vista is booked for Sat at 11 AM." },
          next: {
            kind: "question",
            config: { question: "Does that still work for you?" },
            branches: [
              { label: "Confirm", next: { kind: "message", config: { text: "Perfect, see you then. I will share the location pin shortly." }, next: { kind: "end" } } },
              { label: "Reschedule", next: { kind: "message", config: { text: "No problem. Which day suits you better?" }, next: { kind: "end" } } },
            ],
          },
        },
      }),
  },
  {
    key: "re-engage",
    label: "Re-engage cold leads",
    desc: "Win back leads who went quiet",
    build: () =>
      buildFlow("Re-engage cold leads", false, 96, {
        kind: "start",
        next: {
          kind: "message",
          config: { text: "Hi {{first_name}}, still looking for a home in Baner? A new 3 BHK just listed at ₹1.25 Cr." },
          next: {
            kind: "condition",
            config: { matchType: "contains", keyword: "yes" },
            branches: [
              { label: "Yes", next: { kind: "message", config: { text: "Lovely. I will send the brochure and we can book a visit." }, next: { kind: "end" } } },
              { label: "No", next: { kind: "end" } },
            ],
          },
        },
      }),
  },
];

/* --------------------------------- store ---------------------------------- */

const FLOWS_KEY = "tt_chat_flows";

export function listFlows(): Flow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FLOWS_KEY);
    return raw ? (JSON.parse(raw) as Flow[]) : [];
  } catch {
    return [];
  }
}

export function getFlow(id: string): Flow | null {
  return listFlows().find((f) => f.id === id) ?? null;
}

export function saveFlow(flow: Flow): void {
  if (typeof window === "undefined") return;
  const all = listFlows().filter((f) => f.id !== flow.id);
  all.unshift({ ...flow, updatedAt: Date.now() });
  try {
    localStorage.setItem(FLOWS_KEY, JSON.stringify(all));
  } catch {
    /* quota or unavailable; ignore in design mode */
  }
}

export function deleteFlow(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FLOWS_KEY, JSON.stringify(listFlows().filter((f) => f.id !== id)));
  } catch {
    /* ignore */
  }
}

/** Seed the demo flows once, on first run, so the list is not empty. */
export function seedFlowsIfEmpty(): void {
  if (typeof window === "undefined") return;
  if (listFlows().length > 0) return;
  FLOW_TEMPLATES.filter((t) => t.key !== "blank").forEach((t) => saveFlow(t.build()));
}

/* ------------------------------ derived bits ------------------------------ */

/** Trigger + action summary for the flow list card. */
export function flowSummary(f: Flow): { trigger: string; action: string } {
  const steps = Object.keys(f.nodes).length - 1; // exclude start
  const root = f.nodes[f.rootId];
  const firstId = root?.branches[0]?.to;
  const first = firstId ? f.nodes[firstId] : null;
  if (!first) return { trigger: "First message received", action: "No steps yet" };
  const extra = steps - 1;
  const action = `${FLOW_KIND_LABEL[first.kind]}${extra > 0 ? ` + ${extra} more step${extra === 1 ? "" : "s"}` : ""}`;
  return { trigger: "First message received", action };
}

/** Problems with a single node (drives the validation dot + hints). */
export function nodeIssues(n: FlowNode): string[] {
  const out: string[] = [];
  if (n.kind === "message" && !n.config.text?.trim() && !n.config.templateName) out.push("Add a message");
  if (n.kind === "question") {
    if (!n.config.question?.trim()) out.push("Add a question");
    if (n.branches.length < 2) out.push("Add at least 2 reply options");
  }
  if (n.kind === "condition" && !n.config.keyword?.trim()) out.push("Add a keyword to match");
  if (n.kind === "delay" && !(n.config.delayValue && n.config.delayValue > 0)) out.push("Set a wait time");
  if ((n.kind === "question" || n.kind === "condition") && n.branches.some((b) => !b.to)) {
    out.push("Connect each branch to a next step");
  }
  return out;
}

/** All node-level issues across the flow. */
export function flowIssues(f: Flow): { nodeId: string; issues: string[] }[] {
  return Object.values(f.nodes)
    .map((n) => ({ nodeId: n.id, issues: nodeIssues(n) }))
    .filter((x) => x.issues.length > 0);
}

/* ============================ instagram posts ============================= */
/*
 * The Instagram channel is a publishing studio (not a chat inbox): the realtor
 * composes a reel or a photo post, previews it in a live phone mockup, and
 * publishes (or schedules) it. Published + scheduled posts are kept locally,
 * same pattern as the chat flows above. A developer wiring the backend would
 * replace these readers with the Instagram Graph publish endpoints:
 *   - create media container  POST /api/v1/orgs/{org}/channels/instagram/media
 *   - publish container        POST /api/v1/orgs/{org}/channels/instagram/media/{id}/publish
 *   - list published media     GET  /api/v1/orgs/{org}/channels/instagram/media
 */

export type IgPostKind = "reel" | "photo" | "carousel";
export type IgPostStatus = "published" | "scheduled";

export const IG_ACCOUNT = "@skylinerealty";

export interface IgPost {
  id: string;
  kind: IgPostKind;
  status: IgPostStatus;
  caption: string;
  /** Slide images. For a reel this holds the single cover frame. */
  media: string[];
  /** Reel video source (sample clip in design mode). */
  videoUrl?: string | null;
  account: string;
  /** Published or scheduled time (ms epoch). */
  at: number;
  likes: number;
  comments: number;
  /** Reels only. */
  views?: number;
}

const IG_POSTS_KEY = "tt_ig_posts";
const IG_SEEDED_KEY = "tt_ig_seeded";

// Self-contained seed media so this module stays independent of the mock layer.
const IG_SEED_IMG = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80",
];
const IG_SEED_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

const DAY = 86_400_000;

/** The starter posts shown the first time the Posts tab is opened. */
function seedPosts(now: number): IgPost[] {
  return [
    {
      id: "ig-seed-1",
      kind: "reel",
      status: "published",
      caption:
        "Step inside this 3 BHK in Raheja Vistas, NIBM. Floor-to-ceiling light and a view that does the selling for us.\n\n#PuneRealEstate #NIBM #3BHK #PropertyTour",
      media: [IG_SEED_IMG[0]],
      videoUrl: IG_SEED_VIDEO,
      account: IG_ACCOUNT,
      at: now - 2 * DAY,
      likes: 1840,
      comments: 96,
      views: 24300,
    },
    {
      id: "ig-seed-2",
      kind: "carousel",
      status: "published",
      caption:
        "Skyline Residence, Baner. Four bedrooms, two balconies, and a skyline you will not get tired of.\n\n#Baner #LuxuryHomes #Pune",
      media: [IG_SEED_IMG[1], IG_SEED_IMG[4], IG_SEED_IMG[3]],
      account: IG_ACCOUNT,
      at: now - 5 * DAY,
      likes: 1260,
      comments: 54,
    },
    {
      id: "ig-seed-3",
      kind: "photo",
      status: "published",
      caption: "New listing in Wakad. A garden apartment that stays cool through summer. DM for a visit.\n\n#Wakad #Pune #ForRent",
      media: [IG_SEED_IMG[2]],
      account: IG_ACCOUNT,
      at: now - 9 * DAY,
      likes: 740,
      comments: 23,
    },
    {
      id: "ig-seed-4",
      kind: "reel",
      status: "scheduled",
      caption: "Coming soon: a walkthrough of the Koregaon Park villa. Save this one.\n\n#KoregaonPark #Villa #Pune",
      media: [IG_SEED_IMG[5]],
      videoUrl: IG_SEED_VIDEO,
      account: IG_ACCOUNT,
      at: now + 2 * DAY,
      likes: 0,
      comments: 0,
    },
  ];
}

export function listIgPosts(): IgPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(IG_POSTS_KEY);
    return raw ? (JSON.parse(raw) as IgPost[]) : [];
  } catch {
    return [];
  }
}

export function saveIgPost(post: IgPost): void {
  if (typeof window === "undefined") return;
  const all = listIgPosts().filter((p) => p.id !== post.id);
  all.unshift(post);
  try {
    localStorage.setItem(IG_POSTS_KEY, JSON.stringify(all));
  } catch {
    /* quota or unavailable; ignore in design mode */
  }
}

export function deleteIgPost(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(IG_POSTS_KEY, JSON.stringify(listIgPosts().filter((p) => p.id !== id)));
  } catch {
    /* ignore */
  }
}

/**
 * Seed the demo posts exactly once (tracked by a sentinel, not by emptiness),
 * so opening the studio shows a populated gallery even if the realtor has
 * already published their own post first. Their posts stay on top.
 */
export function seedIgPosts(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(IG_SEEDED_KEY)) return;
    const existing = listIgPosts();
    localStorage.setItem(IG_POSTS_KEY, JSON.stringify([...existing, ...seedPosts(Date.now())]));
    localStorage.setItem(IG_SEEDED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Reduce a kind + slide count to the post kind actually shown (carousel when >1). */
export function igKindFor(base: "reel" | "photo", slides: number): IgPostKind {
  if (base === "reel") return "reel";
  return slides > 1 ? "carousel" : "photo";
}
