export const defaultSystemPrompt = `# AI Voice Agent System Prompt — Nextify Pro

You are the AI Voice Agent for Nextify Pro, a modern digital agency specializing in:
- Website Design & Development
- AI-Powered Advertising Services
- Brand Growth Solutions
- Creative Digital Marketing Systems

Your role is to speak naturally like a real business consultant — not like a robotic assistant. You are friendly, confident, professional, persuasive, and solution-oriented.

## Core Personality & Tone
- **Professional Yet Accessible**: Sound like a knowledgeable partner. Avoid sounding scripted or overly corporate. Speak clearly and naturally. Use simple explanations instead of technical jargon unless the client asks.
- **Confident & Grounded**: Speak with certainty about Nextify Pro's capabilities. Never sound hesitant.
- **Conversational Voice Design**: Keep responses short and engaging. Ask thoughtful follow-up questions. Use transitions naturally (e.g., "Absolutely.", "That makes sense.", "Here's what I'd recommend.").

## Services Knowledge
- **Website Design**: Business/portfolio websites, E-commerce, mobile-responsive, SEO-friendly, fast-loading, AI-UX optimization.
- **AI-Powered Ads**: AI-generated creatives, performance marketing, social media ads, targeting & campaign optimization.

## Pricing
- **Website Design**: Starter (₹15k-30k), Business (₹35k-75k), Premium (₹1L+).
- **AI Ads**: Basic Monthly (₹10k+), Growth (₹25k+), Full AI Systems (Custom).`;

export const presetClients = [
  {
    id: "skeptical_ecom",
    name: "Aarav Sharma",
    business: "D2C Apparel Brand Owner",
    challenge: "High customer acquisition costs (CAC) and poor website conversion rate.",
    budget: "Medium (₹40,000 for web, ₹20,000/mo for ads)",
    avatar: "👔",
    initialMessage: "Hi, I hear you guys do AI ads. Honestly, we run Meta ads but our returns are terrible. How is Nextify Pro any different?"
  },
  {
    id: "local_bakery",
    name: "Priya Patel",
    business: "Artisanal Bakery & Cafe Chain",
    challenge: "Wants to expand online orders but doesn't have a modern e-commerce site.",
    budget: "Low-to-Medium (₹25,000 one-time budget)",
    avatar: "🍰",
    initialMessage: "Hello! I run a bakery. We want to start taking online orders directly instead of paying high commissions to Swiggy/Zomato. What can you build for us?"
  },
  {
    id: "saas_founder",
    name: "Vikram Malhotra",
    business: "B2B SaaS Startup Founder",
    challenge: "Needs high-quality landing pages and a lead generation engine for enterprises.",
    budget: "Premium (₹1,50,000+ budget)",
    avatar: "🚀",
    initialMessage: "Hey, we are looking for a premium product landing page with dynamic UI and clear CTA integrations to drive software trials. What's your approach?"
  }
];

export const objectionCards = [
  {
    id: "pricing",
    objection: "Your pricing is too high.",
    recommendedResponse: "I completely understand. A lot of clients initially compare price first, but what usually matters most is the long-term return. Our focus isn't just creating a website or running ads — it's building a system that helps your business grow consistently. That said, we do offer flexible solutions depending on your goals and budget.",
    hint: "Reframe around value, focus on return on investment, and offer scalability."
  },
  {
    id: "think",
    objection: "I need to think about it.",
    recommendedResponse: "Of course. This is an important decision. Before you decide, would it help if I briefly explained what approach I'd personally recommend for your business based on what you shared?",
    hint: "Acknowledge the weight of the decision, then offer a personalized recommendation framework to maintain engagement."
  },
  {
    id: "cheaper",
    objection: "Another agency offered it cheaper.",
    recommendedResponse: "That's very common. The biggest difference usually comes down to quality, strategy, support, and long-term performance. Many lower-cost solutions focus only on delivery, while we focus on actual business growth and conversion results.",
    hint: "Acknowledge commonality, differentiate on quality, strategy, support, and business conversion results."
  }
];
