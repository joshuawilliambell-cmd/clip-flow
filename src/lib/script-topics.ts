import type { TeamMemberCount } from "@/lib/template";
import { INTRO_SCRIPTS } from "@/lib/intro-script";

/** Official teleprompter script the employee is presenting. */
export type ScriptTopicId =
  | "team-intro"
  | "cdl-legal-protection"
  | "commercial-diesel-bulk-def"
  | "fastfill-cng"
  | "fleet-payment-card-management"
  | "fleet-solutions"
  | "freight-factoring"
  | "lex-billing"
  | "connect-portal"
  | "fleet-fuel-card"
  | "fleet-view"
  | "truck-care-speedco"
  | "truck-wash"
  | "quikq"
  | "rfid-cardless";

export type ScriptPipCue = {
  /** Spoken phrase that must appear in the script (matched like teammate names). */
  cue: string;
  /** Public path under /fleet-pip/ */
  image: string;
  /** Short label shown on the PIP card / timeline. */
  label: string;
};

export type ScriptTopic = {
  id: ScriptTopicId;
  /** Dropdown label */
  label: string;
  description: string;
  /** True only for Fleet Hub teammate intros. */
  isTeamIntro: boolean;
  /** Target teleprompter duration in seconds. */
  targetSeconds: number;
  /** Product PIP cues (ignored for team-intro). */
  pips: ScriptPipCue[];
  /** Official script body, or null when team-intro (uses INTRO_SCRIPTS). */
  script: string | null;
};

const OPEN =
  "Hey, [Customer Name], [Your Name] with Love's here. I am your [Your Job Title], and I can help you with things like [Your Job Duties].";

export const SCRIPT_TOPICS: ScriptTopic[] = [
  {
    id: "team-intro",
    label: "Team Intro",
    description: "Introduce yourself and teammates in the customer's Fleet Hub.",
    isTeamIntro: true,
    targetSeconds: 60,
    pips: [],
    script: null,
  },
  {
    id: "cdl-legal-protection",
    label: "CDL Legal Protection",
    description: "TVC Pro-Driver CDL legal protection for fleets.",
    isTeamIntro: false,
    targetSeconds: 75,
    pips: [
      {
        cue: "CDL legal protection",
        image: "/fleet-pip/14a-cdl-legal-protection.png",
        label: "CDL legal protection",
      },
    ],
    script: `${OPEN} I wanted to explain the CDL legal protection program available through Love's fleet solutions — powered with TVC Pro-Driver. This program is built for professional drivers and fleets that need to protect CDLs when tickets and violations happen. Covered support can include moving violations, non-moving violations, and serious traffic violations, plus help with DataQ challenges when records need to be corrected. For covered cases, the program is designed so drivers are not left paying attorney fees out of pocket for those matters, and members get access to a large nationwide network of CDL-focused attorneys. There can also be discounts on network attorney fees for other legal matters outside the core covered list. The business reason is simple: tickets cost money, court time takes drivers off the road, and CDL risk hits the whole fleet. Legal protection helps reduce that disruption. If you want details on coverage for your drivers or how to enroll, reach out anytime and I can walk you through the next step. Thanks again.`,
  },
  {
    id: "commercial-diesel-bulk-def",
    label: "Commercial Diesel & Bulk DEF",
    description: "Commercial diesel, bulk DEF, and major fleet payment networks.",
    isTeamIntro: false,
    targetSeconds: 90,
    pips: [
      {
        cue: "commercial diesel",
        image: "/fleet-pip/01a-commercial-diesel.png",
        label: "Commercial diesel",
      },
      {
        cue: "Bulk DEF",
        image: "/fleet-pip/01b-bulk-def.png",
        label: "Bulk DEF",
      },
      {
        cue: "fleet payment networks",
        image: "/fleet-pip/01c-fleet-payment-networks.png",
        label: "Fleet payment networks",
      },
    ],
    script: `${OPEN} I wanted to talk with you about commercial diesel and bulk DEF at Love's. Love's Travel Stops are built for commercial trucks. Your drivers can fuel with commercial diesel on the truck islands — not the retail front pumps — and keep rolling with less downtime. Many locations also offer diesel blends, so you can match what your fleet needs on the road. Bulk DEF is available in dedicated DEF lanes at Love's locations across the country. That means your drivers can top off DEF while they fuel, without a separate stop or jug-filling hassle. Retail DEF is also available inside when you need a smaller amount. We work with the major fleet payment networks your company already uses — including networks like Comdata, EFS, TCH, WEX, Voyager, Fleet One, and others, plus LEX, which is short for Love's Express — so settling up at the pump stays simple for your drivers and your back office. If you want help mapping locations on your lanes, comparing fuel programs, or getting your payment methods set up cleanly, reach out anytime and I can walk you through it. Thanks again.`,
  },
  {
    id: "fastfill-cng",
    label: "Fast-Fill CNG for Class 8",
    description: "Class 8 fast-fill CNG at select Love's locations.",
    isTeamIntro: false,
    targetSeconds: 60,
    pips: [
      {
        cue: "Fast-Fill CNG",
        image: "/fleet-pip/08a-fastfill-cng.png",
        label: "Fast-Fill CNG",
      },
    ],
    script: `${OPEN} I wanted to mention Fast-Fill CNG for Class 8 trucks at Love's. At select Love's locations, we offer fast-fill compressed natural gas for Class 8 commercial trucks. That matters if your fleet runs CNG power — you need fill speeds and sites that fit a heavy-duty truck, not a light-duty retail setup. CNG availability varies by location, so the important first step is matching your lanes to Love's sites that offer Class 8 fast-fill. From there, we can help your drivers know where to stop and how fueling fits into your broader Love's fuel program. If CNG is part of your fleet strategy, reach out anytime and I can help identify locations and next steps. Thanks again.`,
  },
  {
    id: "fleet-payment-card-management",
    label: "Fleet Payment & Card Management",
    description: "Card rules, limits, reports, and payment visibility.",
    isTeamIntro: false,
    targetSeconds: 75,
    pips: [
      {
        cue: "card management",
        image: "/fleet-pip/06a-card-management.png",
        label: "Card management",
      },
    ],
    script: `${OPEN} I wanted to cover Love's fleet payment and card management tools. Once your fleet account is set up, you are not stuck with a one-size-fits-all card. You can manage who gets a card, what they are allowed to buy, and where they can fuel. That includes purchase policies, product limits, driver prompts, and fueling network controls — so your policies travel with the driver. Your office can review transactions, export reports, watch available credit, and see payments as they post. That helps you catch issues early, keep spend aligned with policy, and give accounting the files they need. These tools work with LEX — short for Love's Express — and the broader Love's fleet billing setup, so card control and payment visibility stay in one program instead of scattered across spreadsheets. If you want help building card rules for your drivers or cleaning up how payments and reports flow to your back office, reach out anytime and I can help. Thanks again.`,
  },
  {
    id: "fleet-solutions",
    label: "Fleet Solutions & Sales Support",
    description: "Fleet Solutions experts and account support.",
    isTeamIntro: false,
    targetSeconds: 75,
    pips: [
      {
        cue: "Fleet Solutions",
        image: "/fleet-pip/09a-fleet-solutions.png",
        label: "Fleet Solutions",
      },
    ],
    script: `${OPEN} I wanted to introduce Love's Fleet Solutions and how our fleet sales support works. Fleet Solutions is the Love's team that helps commercial fleets lower cost per mile and put the right programs in place. That can include commercial diesel, truck care and tires, credit and billing programs, freight factoring, and legal solutions for drivers — depending on what your company needs. You are not left to figure it out alone. Fleet Solution experts and Client Management support work with fleets across the country to open accounts, explain options in plain language, and stay with you after signup when questions come up. If you tell us how many trucks you run and which areas matter most — fuel, maintenance, billing, factoring, or legal — we can point you to the right next step and the right people. When you are ready, reach out and I can connect you with Fleet Solutions support or help you get started myself. Thanks again.`,
  },
  {
    id: "freight-factoring",
    label: "Freight Factoring",
    description: "Love's Financial freight factoring for cash flow.",
    isTeamIntro: false,
    targetSeconds: 75,
    pips: [
      {
        cue: "freight factoring",
        image: "/fleet-pip/13a-freight-factoring.png",
        label: "Freight factoring",
      },
    ],
    script: `${OPEN} I wanted to talk about freight factoring through Love's Financial. Freight factoring helps your company turn invoices into cash faster so you can cover fuel, maintenance, insurance, payroll, and other operating needs without waiting on slow-paying customers. Love's Financial offers factoring built for trucking businesses that need reliable cash flow. Funding options can be as fast as about sixty minutes, with additional three-hour and same-day choices depending on the setup. Advance rates can go up high — up to around ninety-nine percent access to invoice cash in the right situations — so more of your money is working for the business sooner. Factoring with Love's can also connect into the broader Love's relationship, including opportunities tied to LEX credit — Love's Express — for fueling needs. If cash flow timing is a pain point for your fleet, reach out anytime and I can help you explore Love's Financial factoring in plain language. Thanks again.`,
  },
  {
    id: "lex-billing",
    label: "LEX Billing & Credit Card",
    description: "LEX (Love's Express) billing card for Love's locations.",
    isTeamIntro: false,
    targetSeconds: 105,
    pips: [
      {
        cue: "LEX",
        image: "/fleet-pip/02a-lex-billing.png",
        label: "LEX",
      },
      {
        cue: "LEX credit card",
        image: "/fleet-pip/02b-lex-credit-card.png",
        label: "LEX credit card",
      },
    ],
    script: `${OPEN} I wanted to walk you through LEX — short for Love's Express — and the LEX credit card. That is Love's own fleet fuel card for your drivers. LEX is a billing card made for Love's. Your drivers use it at Love's Travel Stops and Speedco. It is not a general all-brand fleet card — it is built for fueling and buying at Love's. With LEX, your fleet gets consistent, competitive pricing. There are no application fees, no transaction fees, and no account maintenance fees. Cards and RFID tags are free. You get the fuel cash price on top of already competitive rates, and drivers can also use the card for in-store merchandise and services at Love's. Premium Wi-Fi is included with LEX transactions. You stay in control. You can set purchase policies, product limits, and driver prompts. RFID and cardless options help cut fueling time and protect against fuel theft. Even if some of your trucks still use other major fleet payment networks — like Comdata, EFS, TCH, WEX, Voyager, and others — Love's accepts those too. LEX is simply the Love's card program when you want Love's pricing, Love's controls, and Love's reporting in one place. If you would like to apply or get a quick walkthrough, reach out anytime and I can help you get set up. Thanks again.`,
  },
  {
    id: "connect-portal",
    label: "Love's Connect Portal",
    description: "Online portal for Love's fuel data and documents.",
    isTeamIntro: false,
    targetSeconds: 90,
    pips: [
      {
        cue: "Connect Portal",
        image: "/fleet-pip/04a-connect-portal.png",
        label: "Connect Portal",
      },
      {
        cue: "Fuel Dashboard",
        image: "/fleet-pip/04b-fuel-dashboard.png",
        label: "Fuel Dashboard",
      },
    ],
    script: `${OPEN} I wanted to show you what the Love's Connect Portal does for your fleet. Connect is the online portal where you manage and review your Love's account activity. It is a one-stop shop with a secure login and a streamlined invoice process, and it works on computers and phones. Inside Connect, administrators can see monthly fuel performance and fuel goals, review daily fuel transactions, open fleet documents like contracts and invoices, get updates through the message center, and manage who from your company is approved to use the portal. On the Fuel Dashboard you can see gallons purchased, progress toward your fuel goal, account balance, available credit, and today's fuel price. You can make a payment there too. You will also find areas like Document Center, Truck Care Dashboard, Manage Users, and Payments when you need them. In short: when your drivers fuel and service at Love's, Connect is where your office goes to see the data and pull the documents. If you would like a quick walkthrough of Connect for your team, reach out anytime and I can help. Thanks again.`,
  },
  {
    id: "fleet-fuel-card",
    label: "Love's Fleet Fuel Card Options",
    description: "LEX at Love's plus TVC for broader truck-stop coverage.",
    isTeamIntro: false,
    targetSeconds: 90,
    pips: [
      {
        cue: "LEX credit card",
        image: "/fleet-pip/03a-lex-fleet-fuel-card.png",
        label: "LEX credit card",
      },
      {
        cue: "TVC Fuel Card",
        image: "/fleet-pip/03b-tvc-fuel-card.png",
        label: "TVC Fuel Card",
      },
    ],
    script: `${OPEN} I wanted to explain Love's fleet fuel card options in plain terms. If your trucks mostly run Love's, the LEX credit card — short for Love's Express — is your Love's fleet fuel card. Drivers use it at Love's Travel Stops and Speedco. There are no application or transaction fees, and it is accepted at Love's locations nationwide. You get competitive Love's pricing, spending controls, and clean reporting for your Love's activity. If your drivers also fuel outside the Love's network, we can talk about the TVC Fuel Card option. That is a prepaid card with no credit check and no load fees, and it is accepted at a much wider set of major truck stops — tens of thousands of locations — while still fitting into Love's financial solutions for your fleet. Many fleets use LEX for Love's stops and keep other network cards for everywhere else. Either way, the goal is the same: drivers fuel without cash or personal cards, and your company keeps better control of cost and spend. If you want help choosing the right card mix for your routes, reach out anytime and I can walk you through it. Thanks again.`,
  },
  {
    id: "fleet-view",
    label: "Love's Fleet V.I.E.W.",
    description: "Digital fleet maintenance platform.",
    isTeamIntro: false,
    targetSeconds: 105,
    pips: [
      {
        cue: "Fleet V.I.E.W.",
        image: "/fleet-pip/12a-fleet-view.png",
        label: "Fleet V.I.E.W.",
      },
    ],
    script: `${OPEN} I wanted to introduce Love's Fleet V.I.E.W. — our digital fleet maintenance platform. Fleet V.I.E.W. is a cloud-based system that connects shop activity and fleet operations so you can see maintenance work in real time, on the web or on the go. The idea is simple: repair assets faster, understand true cost, and stay ahead of downtime. With Fleet V.I.E.W., your team gets an intuitive repair workflow, parts and inventory tools, and reporting that shows where money is going. It can use AI to help with third-party invoices and fault codes, and it can flag OEM and aftermarket warranty opportunities during repairs so less warranty money is left on the table. You can run digital inspections in the field, turn defects or telematics fault codes into repair orders, and pull odometer, engine hours, and location data to trigger preventative maintenance reminders. It also connects with systems fleets already use — including options like McLeod — so expenses and service alerts can flow into your existing process. Unlike a lot of traditional software, Love's positions Fleet V.I.E.W. with no up-front cost, unlimited users, and modules included — so more of your team can actually use it. If you want a demo or want to see how it would fit your maintenance program, reach out anytime and I can help set that up. Thanks again.`,
  },
  {
    id: "truck-care-speedco",
    label: "Love's Truck Care & Speedco",
    description: "Commercial truck care, tires, PM, and roadside.",
    isTeamIntro: false,
    targetSeconds: 105,
    pips: [
      {
        cue: "Truck Care",
        image: "/fleet-pip/10a-truck-care-speedco.png",
        label: "Truck Care",
      },
      {
        cue: "commercial tires",
        image: "/fleet-pip/10b-commercial-tires.png",
        label: "Commercial tires",
      },
      {
        cue: "preventative maintenance",
        image: "/fleet-pip/10c-oil-pm.png",
        label: "Oil & PM",
      },
      {
        cue: "roadside assistance",
        image: "/fleet-pip/10d-roadside-assistance.png",
        label: "Roadside assistance",
      },
    ],
    script: `${OPEN} I wanted to walk you through Love's Truck Care and Speedco — our commercial truck service network. Love's Truck Care and Speedco is built for fleets and professional drivers who need to stay moving. With hundreds of locations nationwide and more than a thousand maintenance bays, your trucks can get service on the routes they already run. We cover the core work that keeps a fleet productive: commercial tires — including major brands, repairs, installs, and Love's retreads — plus oil changes and preventative maintenance with certified technicians. We also handle light mechanical repairs, batteries, DOT inspections, and related services so more jobs can be finished in one stop. If a truck breaks down away from a shop, Love's emergency roadside assistance is available twenty-four hours a day with mobile diesel technicians for tires, batteries, light mechanical, fuel delivery, and more. For OEM support, many locations offer International warranty work and Freightliner ExpressPoint support, so warranty and recall needs can be handled through trained Love's technicians. The goal is simple: less downtime, trusted commercial service, and a nationwide network your drivers can count on. If you want help finding locations on your lanes or setting up fleet maintenance support, reach out anytime and I can help. Thanks again.`,
  },
  {
    id: "truck-wash",
    label: "Love's Truck Wash",
    description: "Automated commercial truck wash at select locations.",
    isTeamIntro: false,
    targetSeconds: 60,
    pips: [
      {
        cue: "Truck Wash",
        image: "/fleet-pip/11a-truck-wash.png",
        label: "Truck Wash",
      },
    ],
    script: `${OPEN} I wanted to tell you about Love's Truck Wash. At select Love's locations, we offer fast, automated truck wash bays built for commercial equipment. Drivers can get a cost-effective clean in minutes and get back on the road without a long delay. A clean truck is not just about looks. It helps with inspections, brand image for your company, and keeping equipment presentable for customers and shippers. Because washes are at select Love's sites, we can help you identify which stops on your lanes offer the service. If truck wash matters for your fleet standards, reach out anytime and I can help map locations or fold wash stops into your Love's plan. Thanks again.`,
  },
  {
    id: "quikq",
    label: "QuikQ",
    description: "QuikQ portal for LEX card and transaction management.",
    isTeamIntro: false,
    targetSeconds: 75,
    pips: [
      {
        cue: "QuikQ",
        image: "/fleet-pip/05a-quikq.png",
        label: "QuikQ",
      },
    ],
    script: `${OPEN} I wanted to explain QuikQ and how it supports your Love's fleet account. QuikQ is the platform that powers key parts of LEX account setup and day-to-day card management. LEX is short for Love's Express. After your fleet is approved, your team uses the QuikQ carrier tools to get drivers and cards ready and keep the account running smoothly. In QuikQ, you can manage fuel cards, update employee and security details, run transaction reports, export activity for your back office, and check credit, payments, and history in near real time. If a transaction looks wrong, support tools help you see whether it completed, is still processing, or needs attention. Think of QuikQ as the working system behind the scenes for LEX card and transaction management — so your fleet office can control cards and review spend without chasing paper. If your team needs help logging in, setting up cards, or running the first reports, reach out anytime and I can walk you through it. Thanks again.`,
  },
  {
    id: "rfid-cardless",
    label: "RFID Cardless Fueling",
    description: "RFID tags and cardless commercial fueling at Love's.",
    isTeamIntro: false,
    targetSeconds: 75,
    pips: [
      {
        cue: "RFID",
        image: "/fleet-pip/07a-rfid-cardless.png",
        label: "RFID",
      },
    ],
    script: `${OPEN} I wanted to talk about RFID and cardless commercial fueling at Love's. RFID stands for radio frequency identification. In plain terms, it lets your trucks fuel at Love's without the driver pulling out a plastic card every time. Tags are simple to install, and they help speed up the fueling process at the island. RFID also helps protect against fuel theft, because the fuel event is tied to the authorized equipment — not whatever card happens to be in someone's hand. Cardless fueling and secure swipe options give your fleet more control at the pump. This technology is available at Love's Travel Stops and Speedco locations, so your drivers can use it on the routes they already run. If you want help getting tags ordered or understanding how RFID fits with your LEX account — Love's Express — reach out anytime and I can walk you through it. Thanks again.`,
  },
];

/** Dropdown order: Team Intro first, then A–Z by label. */
export const SCRIPT_TOPIC_DROPDOWN_OPTIONS: ScriptTopic[] = [
  SCRIPT_TOPICS.find((t) => t.id === "team-intro")!,
  ...SCRIPT_TOPICS.filter((t) => t.id !== "team-intro").sort((a, b) =>
    a.label.localeCompare(b.label),
  ),
];

export const DEFAULT_SCRIPT_TOPIC: ScriptTopicId = "team-intro";

export function getScriptTopic(id: ScriptTopicId): ScriptTopic {
  return SCRIPT_TOPICS.find((t) => t.id === id) ?? SCRIPT_TOPICS[0];
}

export function isScriptTopicId(value: string): value is ScriptTopicId {
  return SCRIPT_TOPICS.some((t) => t.id === value);
}

/** Official script text for a topic (team-intro uses teammate count). */
export function officialScriptForTopic(
  topicId: ScriptTopicId,
  teamMemberCount: TeamMemberCount,
): string {
  const topic = getScriptTopic(topicId);
  if (topic.isTeamIntro) return INTRO_SCRIPTS[teamMemberCount].script;
  return topic.script ?? INTRO_SCRIPTS[0].script;
}

export function targetSecondsForTopic(topicId: ScriptTopicId): number {
  return getScriptTopic(topicId).targetSeconds;
}

/** How many PIP slots a product topic needs (0 for team-intro). */
export function pipCountForTopic(topicId: ScriptTopicId): number {
  const topic = getScriptTopic(topicId);
  if (topic.isTeamIntro) return 0;
  return Math.min(4, topic.pips.length) as 0 | 1 | 2 | 3 | 4;
}
