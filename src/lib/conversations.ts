/**
 * Mock conversation history for an agent (design mode, no backend). Gives each
 * agent a realistic, template-flavoured set of past calls and chats with
 * transcripts, so builders can see how their agent talks and performs.
 */
import type { TemplateId } from "@/lib/agents";

export type ConvChannel = "voice" | "chat";
export type OutcomeTone = "good" | "warm" | "cold" | "neutral";

export interface ConvTurn {
  who: "agent" | "customer";
  text: string;
}

export interface Conversation {
  id: string;
  channel: ConvChannel;
  customer: string;
  phone?: string;
  when: string;
  /** Duration for a call, or message count for a chat. */
  meta: string;
  outcome: string;
  tone: OutcomeTone;
  summary: string;
  captured?: { label: string; value: string }[];
  transcript: ConvTurn[];
}

const LEAD_QUALIFIER: Conversation[] = [
  {
    id: "c1",
    channel: "voice",
    customer: "Aarti Sharma",
    phone: "+91 98201 44231",
    when: "2h ago",
    meta: "3m 41s",
    outcome: "Site visit booked",
    tone: "good",
    summary: "3BHK in Baner, budget around 2 Cr, booked a Saturday visit.",
    captured: [
      { label: "Budget", value: "₹2 Cr" },
      { label: "Location", value: "Baner" },
      { label: "Configuration", value: "3BHK" },
      { label: "Timeline", value: "3 months" },
    ],
    transcript: [
      { who: "agent", text: "Hi, thanks for your interest in our Baner project. Can I ask a couple of quick questions to help you better?" },
      { who: "customer", text: "Sure, I'm looking for a 3BHK." },
      { who: "agent", text: "Lovely. What budget are you working with?" },
      { who: "customer", text: "Around 2 crore, give or take." },
      { who: "agent", text: "That works well. Our 3BHK homes in Baner start at ₹1.95 Cr and are RERA-registered. Would you like to come and see one this weekend?" },
      { who: "customer", text: "Yes, Saturday is good." },
      { who: "agent", text: "Done. I've booked Saturday 4 PM and I'll send you the location pin on WhatsApp. See you then." },
    ],
  },
  {
    id: "c2",
    channel: "chat",
    customer: "Rohan Mehta",
    when: "Yesterday",
    meta: "9 messages",
    outcome: "Callback scheduled",
    tone: "warm",
    summary: "Asked about possession date and home loan, wants a call back on Monday.",
    captured: [
      { label: "Location", value: "Kharadi" },
      { label: "Home loan", value: "Needs help" },
    ],
    transcript: [
      { who: "customer", text: "Is the Kharadi project ready to move in?" },
      { who: "agent", text: "Possession is December next year, and it is RERA-registered. Are you looking for a 2 or 3BHK?" },
      { who: "customer", text: "3BHK. Do you help with home loans?" },
      { who: "agent", text: "Yes, we have tie-ups with leading banks for up to 90% financing. I can have our team check your eligibility. When is a good time to call you?" },
      { who: "customer", text: "Monday morning works." },
      { who: "agent", text: "Noted. Our sales team will call you Monday morning. I'll also send the floor plans on WhatsApp." },
    ],
  },
  {
    id: "c3",
    channel: "voice",
    customer: "Imran Khan",
    phone: "+91 99300 21884",
    when: "Yesterday",
    meta: "4m 18s",
    outcome: "Hot lead",
    tone: "good",
    summary: "Investor looking at two units, ready to book a token this week.",
    captured: [
      { label: "Purpose", value: "Investment" },
      { label: "Units", value: "2" },
      { label: "Timeline", value: "This week" },
    ],
    transcript: [
      { who: "agent", text: "Hi, thanks for calling about our project. How can I help?" },
      { who: "customer", text: "I'm an investor. What kind of rental yield are these seeing?" },
      { who: "agent", text: "Homes in this micro-market are renting at a healthy yield, and prices have appreciated steadily. Are you considering one unit or more?" },
      { who: "customer", text: "Probably two, if the numbers work." },
      { who: "agent", text: "Great. For two units I can request our sales head to share a special payment plan. Shall I connect you today?" },
      { who: "customer", text: "Yes, please. I'd like to book a token this week." },
      { who: "agent", text: "Perfect, I'm flagging this as a priority and our sales head will call you within the hour." },
    ],
  },
  {
    id: "c4",
    channel: "voice",
    customer: "Priya Nair",
    phone: "+91 97654 33120",
    when: "2 days ago",
    meta: "1m 12s",
    outcome: "Out of budget",
    tone: "cold",
    summary: "Wanted a 3BHK under 1 Cr, beyond our current range.",
    captured: [
      { label: "Budget", value: "₹90 L" },
      { label: "Configuration", value: "3BHK" },
    ],
    transcript: [
      { who: "agent", text: "Hi, thanks for your interest. What are you looking for?" },
      { who: "customer", text: "A 3BHK, but my budget is around 90 lakh." },
      { who: "agent", text: "I appreciate you sharing that. Our 3BHK homes here start a little above that. We do have 2BHK options closer to your budget. Would those interest you?" },
      { who: "customer", text: "No, I really need a 3BHK. Thanks anyway." },
      { who: "agent", text: "Understood. If your plans change, we are happy to help. I'll note your requirement in case a matching option comes up." },
    ],
  },
  {
    id: "c5",
    channel: "chat",
    customer: "Sneha Patil",
    when: "3 days ago",
    meta: "5 messages",
    outcome: "Brochure shared",
    tone: "neutral",
    summary: "Asked for the brochure and price list, will decide later.",
    captured: [{ label: "Configuration", value: "2BHK" }],
    transcript: [
      { who: "customer", text: "Can you send me the brochure?" },
      { who: "agent", text: "Of course. Are you interested in a 2 or 3BHK so I send the right price list?" },
      { who: "customer", text: "2BHK for now." },
      { who: "agent", text: "Sent the 2BHK brochure and price list to your WhatsApp. Would you like to visit the site this week?" },
      { who: "customer", text: "Let me go through it first, I'll get back." },
    ],
  },
];

const SITE_VISIT: Conversation[] = [
  {
    id: "c1",
    channel: "voice",
    customer: "Vikram Joshi",
    phone: "+91 98220 11763",
    when: "1h ago",
    meta: "2m 03s",
    outcome: "Visit booked",
    tone: "good",
    summary: "Booked a Sunday 11 AM visit, location pin sent.",
    captured: [{ label: "Visit", value: "Sun 11 AM" }],
    transcript: [
      { who: "agent", text: "Hi, I'd love to set up your visit to our project. What day works best for you?" },
      { who: "customer", text: "Maybe this Sunday." },
      { who: "agent", text: "Sunday is open. Would morning around 11 suit you?" },
      { who: "customer", text: "Yes, 11 is fine." },
      { who: "agent", text: "Booked for Sunday 11 AM. I'm sending the location pin now and will remind you on Saturday evening." },
    ],
  },
  {
    id: "c2",
    channel: "chat",
    customer: "Neha Reddy",
    when: "Yesterday",
    meta: "6 messages",
    outcome: "Rescheduled",
    tone: "warm",
    summary: "Moved her visit from Saturday to next Tuesday evening.",
    captured: [{ label: "Visit", value: "Tue 6 PM" }],
    transcript: [
      { who: "customer", text: "I can't make it on Saturday anymore." },
      { who: "agent", text: "No problem. When would you like to reschedule to?" },
      { who: "customer", text: "Sometime next week, evening preferably." },
      { who: "agent", text: "Tuesday 6 PM is available. Shall I move your visit there?" },
      { who: "customer", text: "Yes, that works." },
      { who: "agent", text: "Updated to Tuesday 6 PM. I've sent a fresh confirmation and will remind you that morning." },
    ],
  },
  {
    id: "c3",
    channel: "voice",
    customer: "Sameer Gupta",
    phone: "+91 99876 55021",
    when: "2 days ago",
    meta: "0m 48s",
    outcome: "No answer",
    tone: "neutral",
    summary: "Reminder call for tomorrow's visit, left a message.",
    transcript: [
      { who: "agent", text: "Hi, this is a reminder about your site visit tomorrow at 4 PM. I'll send the location pin again on WhatsApp. See you there." },
    ],
  },
  {
    id: "c4",
    channel: "chat",
    customer: "Anjali Verma",
    when: "4 days ago",
    meta: "7 messages",
    outcome: "Visit booked",
    tone: "good",
    summary: "Booked a weekend visit and asked for parking and metro distance.",
    captured: [{ label: "Visit", value: "Sat 5 PM" }],
    transcript: [
      { who: "customer", text: "How far is the project from the metro?" },
      { who: "agent", text: "About a 7 minute drive from the nearest metro station, with good road connectivity. Would you like to see it in person?" },
      { who: "customer", text: "Sure. Is there visitor parking?" },
      { who: "agent", text: "Yes, there is ample visitor parking. What day suits you for a visit?" },
      { who: "customer", text: "Saturday evening." },
      { who: "agent", text: "Booked Saturday 5 PM. I'll share the location pin and a reminder. See you then." },
    ],
  },
];

const RECEPTIONIST: Conversation[] = [
  {
    id: "c1",
    channel: "voice",
    customer: "Unknown caller",
    phone: "+91 90040 22119",
    when: "30m ago",
    meta: "1m 36s",
    outcome: "Details captured",
    tone: "warm",
    summary: "Asked about price range and RERA, left number for the sales team.",
    captured: [{ label: "Interest", value: "2/3BHK" }],
    transcript: [
      { who: "agent", text: "Namaste, thank you for calling. How can I help you today?" },
      { who: "customer", text: "What is the price range and is it RERA approved?" },
      { who: "agent", text: "Yes, our projects are RERA-registered, with 2 and 3BHK homes from ₹95 L to ₹2.4 Cr. May I take your number so our sales team can share the details?" },
      { who: "customer", text: "Sure, note it down." },
      { who: "agent", text: "Got it. Our team will call you shortly with the full price list." },
    ],
  },
  {
    id: "c2",
    channel: "chat",
    customer: "Karan Singh",
    when: "Yesterday",
    meta: "4 messages",
    outcome: "FAQ answered",
    tone: "neutral",
    summary: "Asked about amenities and possession date.",
    transcript: [
      { who: "customer", text: "What amenities does the project have?" },
      { who: "agent", text: "A clubhouse, gym, swimming pool, landscaped gardens, and 24x7 security. Possession is from December next year." },
      { who: "customer", text: "Okay, thanks." },
      { who: "agent", text: "Happy to help. If you'd like, I can have our team share the brochure on WhatsApp." },
    ],
  },
  {
    id: "c3",
    channel: "voice",
    customer: "Meena Iyer",
    phone: "+91 98860 77245",
    when: "3 days ago",
    meta: "2m 11s",
    outcome: "Routed to sales",
    tone: "good",
    summary: "Serious buyer, connected to the sales team during the call.",
    transcript: [
      { who: "agent", text: "Namaste, thank you for calling. How can I help?" },
      { who: "customer", text: "I want to buy a 3BHK and book this month." },
      { who: "agent", text: "Wonderful. Let me connect you to our sales head right away so you get the best plan." },
      { who: "customer", text: "Please do." },
      { who: "agent", text: "Connecting you now. Thank you for your interest." },
    ],
  },
];

const FEEDBACK: Conversation[] = [
  {
    id: "c1",
    channel: "voice",
    customer: "Deepak Rao",
    phone: "+91 99020 31188",
    when: "5h ago",
    meta: "2m 52s",
    outcome: "Hot lead",
    tone: "good",
    summary: "Loved the project after the visit, wants the payment plan.",
    captured: [{ label: "Interest", value: "Hot" }],
    transcript: [
      { who: "agent", text: "Hello, thanks for visiting us. I'd like to hear your honest thoughts on the project." },
      { who: "customer", text: "I really liked it, the amenities are great." },
      { who: "agent", text: "That's wonderful to hear. Is there anything holding you back?" },
      { who: "customer", text: "Just want to understand the payment options." },
      { who: "agent", text: "I can share our current payment plan and an EMI option that many buyers find comfortable. Shall I have our team send it over?" },
      { who: "customer", text: "Yes, please." },
    ],
  },
  {
    id: "c2",
    channel: "voice",
    customer: "Lata Kulkarni",
    phone: "+91 98330 90112",
    when: "Yesterday",
    meta: "1m 47s",
    outcome: "Price objection",
    tone: "warm",
    summary: "Liked the home but felt the price was high, open to an EMI plan.",
    captured: [{ label: "Interest", value: "Warm" }],
    transcript: [
      { who: "agent", text: "Hello, thanks for visiting. What did you think of the project?" },
      { who: "customer", text: "It was nice, but the price felt a bit high." },
      { who: "agent", text: "I understand, many buyers feel that at first. Could I share our payment plan and an EMI option that makes it more comfortable?" },
      { who: "customer", text: "Okay, send it across." },
      { who: "agent", text: "Done. I'll have our team WhatsApp you the plan today." },
    ],
  },
  {
    id: "c3",
    channel: "chat",
    customer: "Faisal Ahmed",
    when: "3 days ago",
    meta: "5 messages",
    outcome: "Needs time",
    tone: "neutral",
    summary: "Comparing two projects, will decide in a couple of weeks.",
    captured: [{ label: "Interest", value: "Cold" }],
    transcript: [
      { who: "agent", text: "Thanks for visiting us. How was your experience?" },
      { who: "customer", text: "Good, but I'm comparing with another project." },
      { who: "agent", text: "That's fair. Is there anything specific you're weighing between the two?" },
      { who: "customer", text: "Mostly location and price. I'll decide in two weeks." },
      { who: "agent", text: "Understood. I'll check back with you then. Thank you for your time." },
    ],
  },
];

const PAYMENT: Conversation[] = [
  {
    id: "c1",
    channel: "voice",
    customer: "Suresh Menon",
    phone: "+91 98450 22310",
    when: "1h ago",
    meta: "1m 28s",
    outcome: "Payment confirmed",
    tone: "good",
    summary: "Confirmed the milestone payment, link shared on WhatsApp.",
    transcript: [
      { who: "agent", text: "Hi, I have a quick update on your booking. Is now a good time?" },
      { who: "customer", text: "Yes, go ahead." },
      { who: "agent", text: "Your next milestone payment is due on the 15th. I can WhatsApp you the payment link and receipt. Shall I?" },
      { who: "customer", text: "Please send it." },
      { who: "agent", text: "Sent. You'll get the receipt automatically once the payment is done." },
    ],
  },
  {
    id: "c2",
    channel: "chat",
    customer: "Ritu Bansal",
    when: "Yesterday",
    meta: "6 messages",
    outcome: "Docs pending",
    tone: "warm",
    summary: "Reminded about KYC documents, will upload by Friday.",
    captured: [{ label: "Pending", value: "KYC" }],
    transcript: [
      { who: "agent", text: "Hi, this is a quick reminder that a couple of KYC documents are still pending for your booking." },
      { who: "customer", text: "Oh right, which ones?" },
      { who: "agent", text: "Your PAN copy and address proof. You can upload them on the link I'm sharing. When can you do this?" },
      { who: "customer", text: "I'll do it by Friday." },
      { who: "agent", text: "Perfect. I'll send a gentle reminder on Friday morning. Thank you." },
    ],
  },
  {
    id: "c3",
    channel: "voice",
    customer: "Arjun Desai",
    phone: "+91 99670 14528",
    when: "4 days ago",
    meta: "0m 39s",
    outcome: "No answer",
    tone: "neutral",
    summary: "EMI reminder call, left a message with the due date.",
    transcript: [
      { who: "agent", text: "Hi, a quick reminder that your EMI is due on the 10th. I'll WhatsApp you the payment link. Thank you." },
    ],
  },
];

const CUSTOM: Conversation[] = [
  {
    id: "c1",
    channel: "chat",
    customer: "Website visitor",
    when: "2h ago",
    meta: "5 messages",
    outcome: "Details captured",
    tone: "warm",
    summary: "Asked what the assistant can do and left contact details.",
    transcript: [
      { who: "customer", text: "What can you help me with?" },
      { who: "agent", text: "I can answer questions about our projects, share details, and connect you with our team. What would you like to know?" },
      { who: "customer", text: "Tell me about your ongoing projects." },
      { who: "agent", text: "We have ongoing residential projects across the city. May I take your number so our team can share the options that fit you?" },
      { who: "customer", text: "Sure." },
    ],
  },
  {
    id: "c2",
    channel: "voice",
    customer: "Unknown caller",
    phone: "+91 90210 88431",
    when: "Yesterday",
    meta: "1m 09s",
    outcome: "FAQ answered",
    tone: "neutral",
    summary: "General enquiry about the company and projects.",
    transcript: [
      { who: "agent", text: "Hi, I'm your assistant. How can I help you today?" },
      { who: "customer", text: "Just wanted to know more about your company." },
      { who: "agent", text: "We are a real-estate developer with RERA-registered projects across the city. Would you like me to share details of a specific area?" },
      { who: "customer", text: "Maybe later, thanks." },
    ],
  },
];

const BY_TEMPLATE: Record<TemplateId, Conversation[]> = {
  "lead-qualifier": LEAD_QUALIFIER,
  receptionist: RECEPTIONIST,
  "site-visit": SITE_VISIT,
  feedback: FEEDBACK,
  payment: PAYMENT,
  custom: CUSTOM,
};

export function conversationsFor(templateId: TemplateId): Conversation[] {
  return BY_TEMPLATE[templateId] ?? CUSTOM;
}

export function conversationStats(convs: Conversation[]) {
  return {
    total: convs.length,
    calls: convs.filter((c) => c.channel === "voice").length,
    chats: convs.filter((c) => c.channel === "chat").length,
    wins: convs.filter((c) => c.tone === "good").length,
  };
}
