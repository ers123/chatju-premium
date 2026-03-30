# SoMyung Asset Generation Prompts

## Guidelines

### Visual Identity
- **Color palette**: Cream (#FEFDFB), Dark green (#1A3D2E), Gold (#B8922D), Dark brown (#2A2420)
- **Element colors**: Wood=#5A7A66, Fire=#A85544, Earth=#B8922D, Metal=#6B7578, Water=#556B7E
- **Aesthetic**: Korean traditional (hanbok, hanok, ink wash) meets modern minimalism
- **Typography**: Nanum Myeongjo (serif headings) + Pretendard (body) in actual product
- **Mood**: Warm, contemplative, trustworthy. NOT mystical, NOT spooky, NOT cheesy fortune-teller
- **Key symbol**: yin-yang (☯) — use subtly, not as main focus

### Image Rules
- All images: NO TEXT in the generated image (text will be overlaid in code/design tool)
- Include clean space for text overlay (bottom third or designated area)
- Professional quality — think premium Korean skincare brand, not generic astrology app

### File Naming
- Save as: `element-{name}.png`, `og-{lang}.png`, `tiktok-{type}.png`, etc.
- Place in: `frontend/public/assets/images/marketing/`

---

## 1. Five Element Type Cards (5 images, 1080x1080)

Use for: Instagram shareable result cards, landing page, marketing materials

```json
[
  {
    "id": "element-wood",
    "prompt": "Minimalist Korean-aesthetic watercolor illustration. A serene young tree sapling with gentle green leaves growing from rich soil, hanbok-inspired decorative border. Muted sage green (#5A7A66) and cream palette. Small yin-yang symbol in corner. Clean text area at bottom third. 1080x1080. Professional, warm, not cartoon. No text in image.",
    "aspect_ratio": "1:1"
  },
  {
    "id": "element-fire",
    "prompt": "Minimalist Korean-aesthetic watercolor illustration. A gentle warm candle flame with soft golden-red glow, traditional Korean paper lantern motifs, elegant brush stroke accents. Warm terracotta (#A85544) and cream palette. Yin-yang in corner. Clean text area at bottom third. 1080x1080. Contemplative, warm. No text.",
    "aspect_ratio": "1:1"
  },
  {
    "id": "element-earth",
    "prompt": "Minimalist Korean-aesthetic watercolor illustration. Rolling gentle hills with a Korean hanok house nestled among them, stable grounded composition. Warm gold (#B8922D) and cream palette. Yin-yang in corner. Text area at bottom. 1080x1080. Serene, protective. No text.",
    "aspect_ratio": "1:1"
  },
  {
    "id": "element-metal",
    "prompt": "Minimalist Korean-aesthetic watercolor illustration. A polished traditional Korean bell with clean geometric patterns, silver moonlight aesthetic. Cool gray (#6B7578) and cream palette. Yin-yang in corner. Text area at bottom. 1080x1080. Precise, refined. No text.",
    "aspect_ratio": "1:1"
  },
  {
    "id": "element-water",
    "prompt": "Minimalist Korean-aesthetic watercolor illustration. A calm stream flowing through misty Korean mountain landscape, ink wash painting influence. Steel blue (#556B7E) and cream palette. Yin-yang in corner. Text area at bottom. 1080x1080. Deep, intuitive. No text.",
    "aspect_ratio": "1:1"
  }
]
```

---

## 2. OG Hero Images (3 images, 1200x630)

Use for: OpenGraph/Twitter card meta images per market

```json
[
  {
    "id": "og-hero-en",
    "prompt": "Professional social media card. Parent's hand gently holding child's hand, subtle yin-yang overlay. Warm cream and forest green (#1A3D2E) palette. Modern, not mystical. Clean area for text overlay. 1200x630. Trustworthy, premium feel. No text.",
    "aspect_ratio": "1.91:1"
  },
  {
    "id": "og-hero-ko",
    "prompt": "Professional social media card. Korean mother tenderly watching her child play, traditional Korean aesthetic with modern twist. Warm hanok tones, cream and deep green palette. Area for Korean text overlay. 1200x630. Emotional, culturally authentic. No text.",
    "aspect_ratio": "1.91:1"
  },
  {
    "id": "og-hero-ja",
    "prompt": "Professional social media card. Elegant East Asian aesthetic blending Korean and Japanese design. Parent and child silhouette with five elements subtly displayed. Sophisticated palette. 1200x630. Clean, trustworthy. No text.",
    "aspect_ratio": "1.91:1"
  }
]
```

---

## 3. TikTok Thumbnails (3 images, 1080x1920)

Use for: TikTok/Reels video thumbnails

```json
[
  {
    "id": "tiktok-thumb-reaction",
    "prompt": "TikTok thumbnail frame. Open space on left for person overlay, Korean astrology chart with five colorful element symbols on right. Bold accents. Vertical 1080x1920 format. High contrast, attention-grabbing. No text.",
    "aspect_ratio": "9:16"
  },
  {
    "id": "tiktok-thumb-vs",
    "prompt": "TikTok thumbnail. Split screen design. Left side gray/dull, right side gold/exciting. VS symbol in center. Bold, modern, social-media-optimized layout. 1080x1920 vertical. No text.",
    "aspect_ratio": "9:16"
  },
  {
    "id": "tiktok-thumb-sibling",
    "prompt": "TikTok thumbnail. Two child silhouettes side by side, one with red-orange fire glow, one with blue water glow. Contrasting elements. Korean aesthetic. 1080x1920. No text.",
    "aspect_ratio": "9:16"
  }
]
```

---

## 4. Infographic: 518,400 vs 16 (1 image, 1080x1350)

Use for: Instagram carousel first slide, ads, blog posts

```json
{
  "id": "infographic-precision",
  "prompt": "Clean data visualization infographic. Left: small grid of 16 plain squares. Right: massive galaxy-like cloud of countless tiny dots/stars. Dramatic scale contrast. Dark background (#2A2420) with gold (#B8922D) and white accents. Modern, tech-forward with subtle Korean design motifs. 1080x1350 portrait. No text.",
  "aspect_ratio": "4:5"
}
```

---

## 5. Sibling Comparison Card (1 image, 1080x1080)

Use for: Shareable sibling comparison result, Instagram

```json
{
  "id": "sibling-comparison",
  "prompt": "Side-by-side temperament comparison card design. Two rounded card panels next to each other, each with child silhouette area, element symbol area, trait tag area, and mini balance chart area. Gentle yin-yang connecting symbol between panels. Cream background, Korean accents, warm and playful. 1080x1080. No text.",
  "aspect_ratio": "1:1"
}
```

---

## 6. Social Media Ad Creatives (3 images, 1080x1080)

Use for: Instagram/Facebook paid ads (Week 8+)

```json
[
  {
    "id": "ad-en-parents",
    "prompt": "Social media ad. Photo-realistic: diverse parent looking lovingly but puzzled at their child. Warm lighting, modern home setting. Clean text overlay area. 1080x1080. Emotional, relatable. No text.",
    "aspect_ratio": "1:1"
  },
  {
    "id": "ad-ja-uranai",
    "prompt": "Social media ad for Japanese audience. Elegant illustration blending Korean four pillars symbols with modern UI mockup. Sophisticated purple and gold palette. Clean text overlay area. 1080x1080. No text.",
    "aspect_ratio": "1:1"
  },
  {
    "id": "ad-ko-emotional",
    "prompt": "Social media ad for Korean parents. Emotional: Korean mother and child, warm sunset lighting, translucent overlay of five element symbols. Premium feel. 1080x1080. No text.",
    "aspect_ratio": "1:1"
  }
]
```

---

## 7. Suno Music Prompts (2 tracks)

### 7-1. TikTok Branded Sound (8-15 seconds)
```
A warm, mystical 10-second jingle blending Korean gayageum plucking with modern lo-fi beats. Gentle, curious, parent-child warmth. Discovery and wonder mood, not fortune-telling. 80 BPM, C major, ending with soft chime.
```
**Tags**: `lo-fi, korean traditional fusion, warm, short, jingle`
**Save as**: `somyung-tiktok-sound.mp3`

### 7-2. Result Reveal BGM (30-60 seconds)
```
45-second ambient track for personality reveal moment. Start quiet with subtle Korean daegeum flute, layer modern ambient pads. Crescendo at 20 seconds, then warm resolution. Emotional, meaningful, not spooky. Like unwrapping a gentle gift.
```
**Tags**: `ambient, korean fusion, emotional, reveal`
**Save as**: `somyung-reveal-bgm.mp3`

---

## 8. VEO Video Prompts (optional, for later)

### 8-1. Result Reveal Animation (5-10 seconds)
```json
{
  "id": "reveal-animation",
  "prompt": "A yin-yang symbol slowly rotating, then splitting into five colored streams (green, red, gold, gray, blue) that flow outward and form the shape of a child. Korean aesthetic, warm tones, gentle particle effects. 5 seconds, loop-friendly. Dark background.",
  "duration": "5s",
  "use": "Result page loading animation, TikTok intro clip"
}
```

### 8-2. Brand Intro (3 seconds)
```json
{
  "id": "brand-intro",
  "prompt": "The yin-yang symbol materializes from golden particles, then the text area appears below for SoMyung branding. Korean calligraphic brush stroke animation. Dark background, gold accents. 3 seconds.",
  "duration": "3s",
  "use": "TikTok video intro/outro, brand stinger"
}
```
