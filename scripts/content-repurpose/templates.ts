/**
 * SoMyung Content Repurpose — Templates & Content Bank
 *
 * 50+ pre-written social media snippets organized by category.
 * All content avoids "fortune-telling" — uses "temperament analysis" / "personality mapping".
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentSnippet {
  id: string;
  category: Category;
  platform: Platform[];
  text: string;
  hashtags?: string[];
}

export type Category =
  | "stat-comparison"
  | "element-tip"
  | "myth-vs-reality"
  | "quote"
  | "engagement-question"
  | "parent-tip"
  | "sibling-twin"
  | "korean-astrology-fact"
  | "product-mention";

export type Platform = "twitter" | "threads" | "linkedin" | "newsletter";

export const DEFAULT_HASHTAGS = [
  "#KoreanAstrology",
  "#Saju",
  "#ParentingTips",
  "#ChildTemperament",
  "#KWave",
];

// ---------------------------------------------------------------------------
// Tweet Templates (< 280 chars before hashtags)
// ---------------------------------------------------------------------------

export const TWEET_TEMPLATES: string[] = [
  // Hook patterns — fill {HOOK} and {BODY}
  "{HOOK}\n\n{BODY}",
  "Most parents don't know this:\n\n{BODY}",
  "Unpopular parenting opinion:\n\n{BODY}",
  "Your child isn't difficult. They're {BODY}",
  "Stop labeling kids.\n\nStart understanding them.\n\n{BODY}",
];

export const THREAD_TEMPLATES: string[] = [
  // Educational thread opener
  "I used to think all kids learned the same way.\n\nThen I discovered the Five Elements framework — a 1,000-year-old Korean system that maps temperament with startling accuracy.\n\nHere's what changed for our family:\n\n{BODY}",
  // Myth-busting thread
  "\"Isn't Saju just fortune-telling?\"\n\nI get this question a lot. Short answer: no.\n\nSaju is a structured temperament analysis based on your birth data — year, month, day, and hour.\n\nThink of it as the Korean equivalent of chronobiology.\n\n{BODY}",
  // Relatable parent scenario
  "My daughter refused to do homework for the third night in a row.\n\nI was about to lose it. Then I remembered her element profile: strong Fire energy.\n\nFire kids need movement and variety — not silence and repetition.\n\nWe switched to flashcards on a walk. Homework done in 15 minutes.\n\n{BODY}",
];

// ---------------------------------------------------------------------------
// Content Bank — 50+ snippets
// ---------------------------------------------------------------------------

export const CONTENT_BANK: ContentSnippet[] = [
  // ── Stat Comparison (518,400 vs 12/16) ──────────────────────────────
  {
    id: "stat-01",
    category: "stat-comparison",
    platform: ["twitter"],
    text: "MBTI gives you 1 of 16 labels.\n\nSaju gives you 1 of 518,400 unique profiles.\n\nYour child is not a type. They're one of a kind.",
  },
  {
    id: "stat-02",
    category: "stat-comparison",
    platform: ["twitter"],
    text: "Western astrology: 12 signs.\nMBTI: 16 types.\nSaju: 518,400 unique combinations.\n\nWhich one do you think captures your child better?",
  },
  {
    id: "stat-03",
    category: "stat-comparison",
    platform: ["twitter"],
    text: "518,400.\n\nThat's the number of unique temperament profiles in Korean Saju analysis.\n\nYour child isn't an Aries or an INFP. They're something far more specific.",
  },
  {
    id: "stat-04",
    category: "stat-comparison",
    platform: ["twitter", "threads"],
    text: "You wouldn't diagnose a patient with just their blood type.\n\nSo why are we mapping children's personalities with only 16 categories?",
  },
  {
    id: "stat-05",
    category: "stat-comparison",
    platform: ["twitter"],
    text: "The hour you were born changes everything in Saju.\n\nSame birthday, different hour = completely different temperament map.\n\nThat's why twins can be so different.",
  },

  // ── Element Tips (Wood, Fire, Earth, Metal, Water) ──────────────────
  {
    id: "elem-wood-01",
    category: "element-tip",
    platform: ["twitter", "threads"],
    text: "Wood element children are natural planners. They thrive with growth-oriented goals. Give them a garden, a project, or a business idea — and watch them bloom.",
  },
  {
    id: "elem-wood-02",
    category: "element-tip",
    platform: ["twitter"],
    text: "Your Wood-dominant child isn't stubborn.\n\nThey're deeply rooted in their convictions.\n\nChannel that energy into leadership, not conflict.",
  },
  {
    id: "elem-fire-01",
    category: "element-tip",
    platform: ["twitter", "threads"],
    text: "Fire element kids light up every room — but burn out fast.\n\nShort bursts of activity > long study sessions.\n\nLet them move, create, perform.",
  },
  {
    id: "elem-fire-02",
    category: "element-tip",
    platform: ["twitter"],
    text: "A Fire child who seems \"too loud\" is actually communicating passion.\n\nDon't quiet them. Direct them.",
  },
  {
    id: "elem-earth-01",
    category: "element-tip",
    platform: ["twitter", "threads"],
    text: "Earth element children are the caregivers of the playground.\n\nThey need stability, routine, and the feeling of being needed.\n\nDisruption hits them harder than other kids.",
  },
  {
    id: "elem-earth-02",
    category: "element-tip",
    platform: ["twitter"],
    text: "Is your child the one who worries about everyone else's feelings?\n\nThat's strong Earth energy.\n\nTeach them it's okay to put themselves first sometimes.",
  },
  {
    id: "elem-metal-01",
    category: "element-tip",
    platform: ["twitter", "threads"],
    text: "Metal element kids crave structure and precision. They're the ones who line up their toys perfectly.\n\nDon't call it OCD. It's how they process the world.",
  },
  {
    id: "elem-metal-02",
    category: "element-tip",
    platform: ["twitter"],
    text: "A Metal child's need for justice isn't them being \"difficult.\"\n\nIt's their core temperament.\n\nThey will always fight for what's fair.",
  },
  {
    id: "elem-water-01",
    category: "element-tip",
    platform: ["twitter", "threads"],
    text: "Water element children are deep thinkers and natural observers.\n\nThey might seem shy, but they're absorbing everything.\n\nGive them space to reflect before expecting answers.",
  },
  {
    id: "elem-water-02",
    category: "element-tip",
    platform: ["twitter"],
    text: "Water kids flow around obstacles instead of pushing through them.\n\nThat's not weakness. That's adaptability.\n\nThe most underrated superpower.",
  },

  // ── Parent Tips ─────────────────────────────────────────────────────
  {
    id: "parent-01",
    category: "parent-tip",
    platform: ["twitter", "threads"],
    text: "Parent tip: Before choosing an extracurricular, check your child's element balance.\n\nA Water child forced into competitive sports may shut down.\nA Fire child in quiet piano lessons may act out.\n\nAlignment > ambition.",
  },
  {
    id: "parent-02",
    category: "parent-tip",
    platform: ["twitter"],
    text: "The best parenting hack isn't a new app or method.\n\nIt's understanding your child's natural temperament — and working WITH it, not against it.",
  },
  {
    id: "parent-03",
    category: "parent-tip",
    platform: ["twitter", "threads"],
    text: "Your parenting style has an element too.\n\nWhen a Metal parent raises a Fire child, clashes are inevitable — unless both understand the dynamic.\n\nSelf-awareness starts with the parent.",
  },
  {
    id: "parent-04",
    category: "parent-tip",
    platform: ["twitter"],
    text: "\"Why won't my child listen?\"\n\nMaybe they're listening perfectly — just processing differently.\n\nWood kids need logic. Fire kids need excitement. Water kids need time.",
  },
  {
    id: "parent-05",
    category: "parent-tip",
    platform: ["twitter"],
    text: "Stop comparing your children to each other.\n\nThey literally have different elemental compositions.\n\nDifferent blueprints. Different strengths. Both perfect.",
  },
  {
    id: "parent-06",
    category: "parent-tip",
    platform: ["threads", "linkedin"],
    text: "The biggest parenting mistake I see: treating all children the same \"because it's fair.\"\n\nFairness isn't sameness. It's giving each child what THEY need.\n\nA Fire child needs freedom to explore. An Earth child needs reassurance and routine. A Metal child needs clear rules.\n\nSaju helps you see what each child actually needs — not what parenting books say all children need.",
  },

  // ── Myth vs Reality ─────────────────────────────────────────────────
  {
    id: "myth-01",
    category: "myth-vs-reality",
    platform: ["twitter", "threads"],
    text: "Myth: Saju is fortune-telling.\nReality: Saju is temperament analysis based on astronomical data at birth.\n\nNo crystal balls. No vague predictions. Just structured personality mapping.",
  },
  {
    id: "myth-02",
    category: "myth-vs-reality",
    platform: ["twitter"],
    text: "Myth: Your Saju is your destiny.\nReality: Your Saju is your starting point.\n\nIt shows tendencies, not limitations. How you raise a child matters more than their chart.",
  },
  {
    id: "myth-03",
    category: "myth-vs-reality",
    platform: ["twitter", "threads"],
    text: "Myth: Only Koreans use Saju.\nReality: Saju (Four Pillars) is practiced across East Asia — Korea, China, Japan, Vietnam.\n\nIt's one of the oldest personality frameworks in human history.",
  },
  {
    id: "myth-04",
    category: "myth-vs-reality",
    platform: ["twitter"],
    text: "\"Isn't this just superstition?\"\n\nSaju uses the exact time, date, month, and year of birth to map temperament.\n\nIt's closer to chronobiology than horoscopes.",
  },
  {
    id: "myth-05",
    category: "myth-vs-reality",
    platform: ["twitter"],
    text: "Myth: All children born on the same day are the same.\nReality: The birth HOUR creates 12 different profiles per day.\n\nThat's why Saju captures what zodiac signs miss.",
  },

  // ── Quotes ──────────────────────────────────────────────────────────
  {
    id: "quote-01",
    category: "quote",
    platform: ["twitter", "threads"],
    text: "\"Every child is a different kind of flower, and all together, they make this world a beautiful garden.\"\n\nSaju helps you figure out which flower yours is — so you can give them the right soil.",
  },
  {
    id: "quote-02",
    category: "quote",
    platform: ["twitter"],
    text: "\"Children are not things to be molded, but people to be unfolded.\" — Jess Lair\n\nUnderstanding temperament is the first step to unfolding.",
  },
  {
    id: "quote-03",
    category: "quote",
    platform: ["twitter"],
    text: "\"Don't ask what's wrong with your child. Ask what happened to their environment.\"\n\nElement analysis helps you build the right environment for the right child.",
  },
  {
    id: "quote-04",
    category: "quote",
    platform: ["twitter", "linkedin"],
    text: "\"The greatest gift you can give your child is understanding.\"\n\nNot toys. Not tutors. Understanding.\n\nKnow their element. Know their nature. Parent accordingly.",
  },

  // ── Engagement Questions ────────────────────────────────────────────
  {
    id: "engage-01",
    category: "engagement-question",
    platform: ["twitter"],
    text: "What element is your child?\n\nWood: The planner\nFire: The performer\nEarth: The nurturer\nMetal: The perfectionist\nWater: The thinker\n\nDrop yours below.",
  },
  {
    id: "engage-02",
    category: "engagement-question",
    platform: ["twitter"],
    text: "Quick poll: Does your child's personality match their zodiac sign?\n\nMost parents say no.\n\nThat's because zodiac only uses 1 of the 4 pillars Saju analyzes.",
  },
  {
    id: "engage-03",
    category: "engagement-question",
    platform: ["twitter"],
    text: "If you could understand ONE thing about your child's temperament that no one has explained before — what would it be?",
  },
  {
    id: "engage-04",
    category: "engagement-question",
    platform: ["twitter"],
    text: "Raise your hand if you've ever felt like parenting advice doesn't apply to YOUR kid.\n\nThat's because generic advice ignores temperament. Every child needs a different approach.",
  },
  {
    id: "engage-05",
    category: "engagement-question",
    platform: ["twitter"],
    text: "Parents of multiple kids: Are your children completely different personalities?\n\nSaju explains exactly why — even siblings with the same parents have wildly different element charts.",
  },

  // ── Sibling / Twin ─────────────────────────────────────────────────
  {
    id: "sibling-01",
    category: "sibling-twin",
    platform: ["twitter", "threads"],
    text: "Twins born minutes apart can have completely different Saju charts.\n\nIf the birth crosses an hour boundary, the Hour Pillar shifts — changing their entire temperament map.\n\nThis is why twins can be so different.",
  },
  {
    id: "sibling-02",
    category: "sibling-twin",
    platform: ["twitter"],
    text: "\"My kids are so different — how is that possible?\"\n\nBecause they were born in different years, months, days, and hours.\n\n4 different pillars = 4 different blueprints.",
  },
  {
    id: "sibling-03",
    category: "sibling-twin",
    platform: ["twitter"],
    text: "Sibling rivalry often comes from element clashes.\n\nA Metal older sibling + Wood younger sibling = natural tension.\n\nUnderstanding this changes everything.",
  },

  // ── Korean Astrology Facts ──────────────────────────────────────────
  {
    id: "fact-01",
    category: "korean-astrology-fact",
    platform: ["twitter", "threads"],
    text: "In Korea, Saju analysis is a normal part of life.\n\nParents check their baby's chart at birth. Couples check compatibility before marriage.\n\nIt's not mystical — it's cultural infrastructure.",
  },
  {
    id: "fact-02",
    category: "korean-astrology-fact",
    platform: ["twitter"],
    text: "The Four Pillars of Destiny (사주팔자) use 10 Heavenly Stems and 12 Earthly Branches.\n\n10 x 12 x 10 x 12 x 10 x 12 x 10 x 12 = 518,400 combinations.\n\nThat's precision.",
  },
  {
    id: "fact-03",
    category: "korean-astrology-fact",
    platform: ["twitter"],
    text: "Saju has been refined for over 1,000 years.\n\nIt survived because it works — parents kept using it to understand their children, generation after generation.",
  },
  {
    id: "fact-04",
    category: "korean-astrology-fact",
    platform: ["twitter", "threads"],
    text: "The Five Elements aren't just abstract concepts:\n\nWood = growth, flexibility\nFire = passion, expression\nEarth = stability, nurturing\nMetal = structure, justice\nWater = wisdom, adaptability\n\nEvery child is a unique blend.",
  },
  {
    id: "fact-05",
    category: "korean-astrology-fact",
    platform: ["twitter"],
    text: "K-Wave brought K-pop, K-drama, and K-beauty to the world.\n\nNext up: K-parenting — understanding your child through the lens of Korean temperament analysis.",
  },

  // ── Product Mentions (subtle) ───────────────────────────────────────
  {
    id: "product-01",
    category: "product-mention",
    platform: ["twitter"],
    text: "We built SoMyung because every child deserves to be understood — not categorized.\n\n518,400 unique profiles. AI-powered. Based on 1,000 years of Korean wisdom.\n\nsomyung.cc",
  },
  {
    id: "product-02",
    category: "product-mention",
    platform: ["twitter", "threads"],
    text: "Curious about your child's element balance?\n\nSoMyung generates a full temperament report in under 60 seconds — based on their exact birth data.\n\nNo sign-up needed for the free preview.\n\nsomyung.cc",
  },
  {
    id: "product-03",
    category: "product-mention",
    platform: ["threads", "linkedin"],
    text: "We combined 1,000 years of Korean Saju wisdom with modern AI to create something new:\n\nA temperament report that's as unique as your child.\n\nNo vague zodiac descriptions. No 1-of-16 labels. A full personality map from 518,400 possible combinations.\n\nTry it free at somyung.cc",
  },
  {
    id: "product-04",
    category: "product-mention",
    platform: ["twitter"],
    text: "SoMyung = 소명 = \"calling\" in Korean.\n\nEvery child has one. We help you discover it.\n\nsomyung.cc",
  },
  {
    id: "product-05",
    category: "product-mention",
    platform: ["twitter"],
    text: "Free Saju preview. No account needed. 60 seconds.\n\nFind out your child's dominant element today.\n\nsomyung.cc",
  },
];

// ---------------------------------------------------------------------------
// Daily content rotation data
// ---------------------------------------------------------------------------

export const ELEMENT_ROTATION = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;
export type Element = (typeof ELEMENT_ROTATION)[number];

export const ELEMENT_DAILY_TIPS: Record<Element, string[]> = {
  Wood: [
    "Wood children thrive when they have a clear plan. Help them set a small goal today.",
    "Let your Wood child lead a family activity this week — they're natural organizers.",
    "Wood energy craves growth. A new book, skill, or puzzle will light them up.",
    "If your Wood child is being rigid, they may feel blocked. Ask what's frustrating them.",
    "Wood kids respond well to logic. Explain the 'why' behind every rule.",
    "A walk in nature recharges Wood energy like nothing else.",
  ],
  Fire: [
    "Fire children need to MOVE. 20 minutes of physical play before homework changes everything.",
    "Let your Fire child perform today — a song, a joke, a story. They need an audience.",
    "Fire kids burn bright but burn out fast. Short focused bursts > long marathons.",
    "Is your Fire child being 'dramatic'? They're processing emotions through expression. Let them.",
    "Fire energy loves novelty. Rotate activities often to keep them engaged.",
    "A bored Fire child will create chaos. Give them a creative outlet before it happens.",
  ],
  Earth: [
    "Earth children need routine. Even small disruptions can throw off their whole day.",
    "Let your Earth child help with cooking or caregiving — it feeds their nurturing nature.",
    "Earth kids worry about others before themselves. Check in: 'How are YOU feeling?'",
    "Stability is medicine for Earth energy. Keep bedtimes and mealtimes consistent.",
    "Earth children are the glue of friend groups. Celebrate their empathy openly.",
    "When an Earth child seems clingy, they need reassurance, not independence training.",
  ],
  Metal: [
    "Metal children need clear, fair rules. Inconsistency feels deeply wrong to them.",
    "Let your Metal child organize something today — their desk, a drawer, a plan.",
    "Metal kids have a strong sense of justice. If they argue a point, hear them out.",
    "Precision matters to Metal energy. Don't rush them through tasks that require care.",
    "A Metal child's criticism is often self-directed first. Build their confidence gently.",
    "Metal energy appreciates quality over quantity. One good book > five mediocre ones.",
  ],
  Water: [
    "Water children need processing time. Don't demand instant answers.",
    "Let your Water child observe before participating. Watching IS learning for them.",
    "Water kids are deeply intuitive. Trust their gut feelings — they're usually right.",
    "A quiet Water child isn't disengaged. They're absorbing everything around them.",
    "Water energy flows around obstacles. Teach problem-solving, not head-on confrontation.",
    "Bedtime conversations unlock Water children. They open up when the pressure is off.",
  ],
};

export const WEEKLY_PARENTING_INSIGHTS: string[] = [
  "This week's parenting insight: Your child's worst behavior often reveals their strongest element. The Fire child who can't sit still has boundless creative energy. The Metal child who argues every point has an unshakeable moral compass.",
  "This week's parenting insight: Homework battles? Match the method to the element. Fire = gamify it. Water = let them think first. Wood = give them a plan. Earth = sit nearby. Metal = set clear expectations.",
  "This week's parenting insight: The way you discipline should match your child's element. Fire kids need cooling down, not shame. Metal kids need fair reasoning. Earth kids need reassurance that you still love them.",
  "This week's parenting insight: Screen time affects each element differently. Water kids go deeper (good). Fire kids get overstimulated (bad). Earth kids use it socially (neutral). Metal kids get perfectionist about games (watch out).",
  "This week's parenting insight: Morning routines by element. Wood: checklist on the wall. Fire: race-the-timer game. Earth: do it together. Metal: same order every day. Water: gentle wake-up with buffer time.",
];

export const KOREAN_ASTROLOGY_WEEKLY: string[] = [
  "This week in Korean astrology: The Five Elements aren't just personality types — they describe how energy moves. Wood grows upward, Fire spreads outward, Earth centers, Metal contracts inward, Water flows downward.",
  "This week in Korean astrology: In Saju, your Day Pillar represents your core self. Your Year Pillar is your social mask. They can be very different — which is why first impressions don't always match the real person.",
  "This week in Korean astrology: Element interactions matter as much as individual elements. Wood feeds Fire. Fire creates Earth (ash). Earth contains Metal. Metal collects Water (condensation). Water nourishes Wood. A beautiful cycle.",
  "This week in Korean astrology: The concept of 'yin' and 'yang' within each element doubles the complexity. Yang Wood is a mighty oak. Yin Wood is a flexible vine. Same element, completely different energy.",
  "This week in Korean astrology: Korean parents have used Saju for centuries to choose names, plan education paths, and understand family dynamics. It's not superstition — it's an integrated parenting framework.",
];

export const ENGAGEMENT_QUESTIONS_WEEKLY: string[] = [
  "Parents: What's one thing about your child that no personality test has ever captured?",
  "Do you parent your children differently based on their personalities? Or do you try to be consistent across all of them?",
  "What's the most surprising thing you've learned about your child's temperament?",
  "If you could give your child one superpower based on their personality, what would it be?",
  "Have you ever changed your parenting approach based on learning something new about your child's nature? What happened?",
];
