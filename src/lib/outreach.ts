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
  | "flows";

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
    connected: false,
    handle: "@skyline.realty",
    subtitle: "Reply to DMs and comments on your reels from one inbox.",
    tabs: ["inbox", "contacts"],
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
export type TemplateStatus = "Approved" | "In review" | "Rejected";

export interface WaTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  body: string;
  /** How many times it has been sent. */
  sent: number;
  updated: string;
}

export const TEMPLATES: WaTemplate[] = [
  {
    id: "t1",
    name: "new_listing_alert",
    category: "Marketing",
    language: "English",
    status: "Approved",
    body: "Hi {{1}}, a new {{2}} just listed in {{3}} at {{4}}. Want me to send photos and the floor plan?",
    sent: 1840,
    updated: "2 days ago",
  },
  {
    id: "t2",
    name: "site_visit_reminder",
    category: "Utility",
    language: "English",
    status: "Approved",
    body: "Hi {{1}}, this is a reminder for your site visit on {{2}} at {{3}}. Reply 1 to confirm or 2 to reschedule.",
    sent: 642,
    updated: "5 days ago",
  },
  {
    id: "t3",
    name: "price_drop_update",
    category: "Marketing",
    language: "Hindi",
    status: "In review",
    body: "नमस्ते {{1}}, {{2}} की कीमत अब {{3}} है। क्या मैं आपको विवरण भेजूं?",
    sent: 0,
    updated: "6 hours ago",
  },
  {
    id: "t4",
    name: "login_otp",
    category: "Authentication",
    language: "English",
    status: "Approved",
    body: "{{1}} is your verification code. It is valid for 10 minutes. Do not share it with anyone.",
    sent: 3120,
    updated: "1 week ago",
  },
  {
    id: "t5",
    name: "festive_offer_diwali",
    category: "Marketing",
    language: "English",
    status: "Rejected",
    body: "Happy Diwali {{1}}. Book this week and save {{2}} on select homes. Limited units.",
    sent: 0,
    updated: "3 days ago",
  },
];

export const TEMPLATE_STATUS_TONE: Record<TemplateStatus, "good" | "warm" | "cold"> = {
  Approved: "good",
  "In review": "warm",
  Rejected: "cold",
};

/* ------------------------------- broadcasts ------------------------------- */

export type BroadcastStatus = "Sent" | "Sending" | "Scheduled" | "Draft";

export interface Broadcast {
  id: string;
  name: string;
  template: string;
  audience: number;
  delivered: number;
  read: number;
  replied: number;
  status: BroadcastStatus;
  when: string;
}

export const BROADCASTS: Broadcast[] = [
  {
    id: "b1",
    name: "Baner launch invite",
    template: "new_listing_alert",
    audience: 1240,
    delivered: 1212,
    read: 968,
    replied: 142,
    status: "Sent",
    when: "Yesterday, 11:00 AM",
  },
  {
    id: "b2",
    name: "Weekend open house",
    template: "site_visit_reminder",
    audience: 560,
    delivered: 320,
    read: 180,
    replied: 24,
    status: "Sending",
    when: "Today, 10:30 AM",
  },
  {
    id: "b3",
    name: "Kharadi price revision",
    template: "price_drop_update",
    audience: 880,
    delivered: 0,
    read: 0,
    replied: 0,
    status: "Scheduled",
    when: "Sat, 9:00 AM",
  },
  {
    id: "b4",
    name: "NRI investor list",
    template: "new_listing_alert",
    audience: 0,
    delivered: 0,
    read: 0,
    replied: 0,
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
  lastContacted: string;
  optedIn: boolean;
}

export const CONTACTS: OutreachContact[] = [
  {
    id: "ct1",
    name: "Ketan Mehta",
    initials: "KM",
    phone: "+91 98231 55012",
    tags: ["Office space", "Baner"],
    lastContacted: "10m ago",
    optedIn: true,
  },
  {
    id: "ct2",
    name: "Rohit Jadhav",
    initials: "RJ",
    phone: "+91 99700 41288",
    tags: ["3BHK", "Kharadi"],
    lastContacted: "25m ago",
    optedIn: true,
  },
  {
    id: "ct3",
    name: "Rahul Sharma",
    initials: "RS",
    phone: "+91 98190 27640",
    tags: ["Office space"],
    lastContacted: "1h ago",
    optedIn: true,
  },
  {
    id: "ct4",
    name: "Meena Iyer",
    initials: "MI",
    phone: "+91 98860 77245",
    tags: ["2BHK", "Wakad", "Ready to move"],
    lastContacted: "3h ago",
    optedIn: true,
  },
  {
    id: "ct5",
    name: "Imran Khan",
    initials: "IK",
    phone: "+91 99300 21884",
    tags: ["Investor"],
    lastContacted: "Yesterday",
    optedIn: false,
  },
  {
    id: "ct6",
    name: "Priya Nair",
    initials: "PN",
    phone: "+91 97654 33120",
    tags: ["3BHK"],
    lastContacted: "2 days ago",
    optedIn: true,
  },
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
