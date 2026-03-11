# ChatJu Additional Guideline

This document provides guidance for building upon ChatJu Premium from DynamoJudge.

---

## 1. Codebase Relationship

| Project | Location | Purpose |
|---------|----------|---------|
| ChatJu Premium | `/Users/yohan/Projects/fortune/chatju-premium` | AI-powered fortune interpretation service |
| Original Manse Calculator | `/Users/yohan/Projects/fortune/manse/mansae.js` | Standalone Four Pillars calculation |
| DynamoJudge | `/Users/yohan/Projects/dynamojudge` | Rule-based judgment system (no AI) |

**DynamoJudge** is a purpose-built fork that focuses on **deterministic, rule-based judgment** rather than AI interpretation. It removes bad options at bad times instead of providing fortune-telling predictions.

---

## 2. Key Logic Differences

| Feature | ChatJu Premium | DynamoJudge | Notes |
|---------|---------------|-------------|-------|
| Element counting | Stems only (max 4) | Stems + Branches (max 8) | DJ more accurate |
| Hour pillar hanja | Missing | Complete | Critical gap in CJ |
| Lunar date input | No | Yes (with leap month) | DJ more flexible |
| Time phases | No | 3 phases (EXP/CON/CTR) | DJ unique |
| Decision rules | No | 30 rules | DJ core feature |
| AI interpretation | OpenAI GPT-4o | None | CJ unique feature |

### Element Counting Detail

**ChatJu Premium** counts elements from the **4 Heavenly Stems only**:
- Year stem, Month stem, Day stem, Hour stem
- Maximum count: 4

**DynamoJudge** counts elements from **both Stems and Branches** (8 characters):
- 4 Heavenly Stems + 4 Earthly Branches
- Maximum count: 8
- Aligns with traditional 사주팔자 (Four Pillars, Eight Characters) methodology

### Time Phase System (DynamoJudge Only)

DynamoJudge introduces temporal risk phases:
- **EXP (Expansion)**: Favorable for growth-oriented decisions
- **CON (Contraction)**: Cautious period, avoid major commitments
- **CTR (Contradiction)**: High-risk period, defer critical decisions

---

## 3. What to Port: ChatJu → DynamoJudge

If you want to enhance DynamoJudge with ChatJu Premium features:

### Database Persistence (Supabase)
- User history and reading storage
- Session management
- Port if: User wants to track past judgments

### AI Interpretation Layer
- OpenAI GPT-4o integration
- Natural language explanations
- Port if: Want human-readable interpretations alongside rule output

### Payment Integration Patterns
- Stripe/payment gateway setup
- Subscription management
- Port if: Monetization is needed

---

## 4. What to Port: DynamoJudge → ChatJu

**Critical fixes to improve ChatJu Premium accuracy:**

### Branch Element Counting (Critical)
```typescript
// ChatJu counts stems only - INCOMPLETE
const elements = countStemElements(pillars);

// DynamoJudge counts stems + branches - CORRECT
const elements = countAllElements(pillars); // Stems + Branches
```

**Impact**: Element counting difference can cause **33% variance** in readings.

### Lunar Date Input Support
- Allows users to input birth dates in lunar calendar
- Supports leap month (윤달) handling
- Improves accessibility for users who only know their lunar birthday

### Hour Pillar Hanja
- ChatJu Premium has incomplete hour pillar hanja mapping
- DynamoJudge provides complete coverage for all 12 hours (시)

### Input Validation Layer
- Robust date/time validation
- Edge case handling (e.g., midnight births, date boundaries)
- Improves reliability of calculations

---

## 5. Integration Guidelines

### Sharing Authentication

To reuse ChatJu's auth system in DynamoJudge:

1. Extract auth middleware from ChatJu Premium
2. Configure shared Supabase project or use same auth provider
3. Ensure JWT tokens are compatible across both services

### Sharing Manse Calculation Logic

**Option A: Monorepo Approach**
- Extract manse calculator to shared package
- Import in both projects

**Option B: API Approach**
- Create dedicated manse calculation API
- Both projects call the same endpoint

**Option C: Copy with Sync**
- Maintain copies in both projects
- Document sync process for updates

### API Boundary Recommendations

```
┌─────────────────────────────────────────────────────┐
│                    Client                           │
└───────────────┬───────────────────┬─────────────────┘
                │                   │
        ┌───────▼───────┐   ┌───────▼───────┐
        │   ChatJu API  │   │ DynamoJudge   │
        │ (AI Interpret)│   │    (Rules)    │
        └───────┬───────┘   └───────┬───────┘
                │                   │
        ┌───────▼───────────────────▼───────┐
        │      Shared Manse Calculator      │
        │        (Core 4 Pillars)           │
        └───────────────────────────────────┘
```

**Recommended boundaries:**
- Manse calculation: Shared library
- Element analysis: Shared library
- Rule evaluation: DynamoJudge only
- AI interpretation: ChatJu only
- User data: Separate or shared based on product needs

---

## 6. Critical Accuracy Note

### The 33% Variance Problem

Traditional 사주팔자 (Four Pillars of Destiny) is called "Eight Characters" because it analyzes:
- 4 Heavenly Stems (天干)
- 4 Earthly Branches (地支)

**ChatJu Premium's stem-only counting misses half the picture.**

Example analysis for the same birth data:

| Element | ChatJu (Stems) | DynamoJudge (All) | Difference |
|---------|----------------|-------------------|------------|
| WOOD    | 1              | 2                 | +100%      |
| FIRE    | 2              | 3                 | +50%       |
| EARTH   | 0              | 2                 | +200%      |
| METAL   | 1              | 1                 | 0%         |
| WATER   | 0              | 0                 | 0%         |

**Recommendation**: Always use DynamoJudge's full 8-character element counting for accurate Five Element analysis. This aligns with:
- Traditional Korean 사주 methodology
- Classical Chinese 八字 (Ba Zi) practice
- Academic references on Four Pillars analysis

---

## Quick Reference

### Files to Review

| Purpose | ChatJu Premium | DynamoJudge |
|---------|---------------|-------------|
| Manse calculation | Uses mansae.js | `src/lib/manse.ts` |
| Element counting | Inline/scattered | `src/lib/manse.ts` |
| AI interpretation | API routes | N/A |
| Rule engine | N/A | `src/lib/rule-engine.ts` |
| Type definitions | Varies | `src/types/index.ts` |

### Migration Checklist

When porting features:

- [ ] Review source implementation thoroughly
- [ ] Identify type differences between projects
- [ ] Test with identical input data
- [ ] Verify output consistency
- [ ] Update documentation in both projects
