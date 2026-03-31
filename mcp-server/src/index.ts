#!/usr/bin/env node

/**
 * SoMyung MCP Server — Korean Saju Child Temperament Analysis
 *
 * Provides Three tools:
 *   1. analyze_child_temperament — Four Pillars + element balance + personality profile
 *   2. compare_siblings — Side-by-side comparison of two children
 *   3. explain_five_elements — Detailed explanation of any element
 *
 * The server does CALCULATION only — the AI host (Claude, ChatGPT) provides
 * the natural language interpretation based on the structured data returned.
 *
 * Transport: stdio (standard for MCP)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  calculateTemperament,
  getElementDetails,
  ELEMENT_TRAITS,
  type TemperamentProfile,
} from "./saju-calculator.js";

// ─── Server Setup ────────────────────────────────────────────────────

const server = new McpServer({
  name: "somyung-saju",
  version: "1.0.0",
});

// ─── Helper: Format Temperament for AI ───────────────────────────────

function formatTemperamentResult(profile: TemperamentProfile): string {
  const { fourPillars, dayMaster, elementBalance, birthInfo } = profile;
  const nameLabel = birthInfo.childName ? ` (${birthInfo.childName})` : "";
  const genderLabel = birthInfo.gender === "M" ? "Boy" : "Girl";
  const timeNote = birthInfo.timeProvided
    ? ""
    : "\n[Note: Birth time was not provided. Hour pillar is estimated using noon (12:00). For more accurate results, provide the exact birth time.]";

  return `# Saju Child Temperament Analysis${nameLabel}

## Birth Information
- Date: ${birthInfo.date}
- Time: ${birthInfo.time ?? "Not provided (estimated at noon)"}
- Gender: ${genderLabel}${timeNote}

## Four Pillars (사주팔자)
| Pillar | Korean | Hanja | Element |
|--------|--------|-------|---------|
| Year (년주) | ${fourPillars.year.korean} | ${fourPillars.year.hanja} | ${fourPillars.year.element} |
| Month (월주) | ${fourPillars.month.korean} | ${fourPillars.month.hanja} | ${fourPillars.month.element} |
| Day (일주) | ${fourPillars.day.korean} | ${fourPillars.day.hanja} | ${fourPillars.day.element} |
| Hour (시주) | ${fourPillars.hour.korean} | ${fourPillars.hour.hanja} | ${fourPillars.hour.element} |

## Day Master (일간)
- ${dayMaster.stem} (${dayMaster.hanja}) — ${dayMaster.element} (${dayMaster.elementKo}/${dayMaster.elementHanja})

## Five Element Balance (오행)
- Wood (목/木): ${elementBalance.wood}
- Fire (화/火): ${elementBalance.fire}
- Earth (토/土): ${elementBalance.earth}
- Metal (금/金): ${elementBalance.metal}
- Water (수/水): ${elementBalance.water}

**Dominant Element: ${profile.dominantElement}**
**Weakest Element: ${profile.weakestElement}**

## ${profile.elementDescription}

## Personality Traits
${profile.personalityTraits.map((t) => `- ${t}`).join("\n")}

## Learning Style
${profile.learningStyle}

## Social Style
${profile.socialStyle}

## Emotional Pattern
${profile.emotionalPattern}

## Tips for Parents
${profile.parentTips.map((t) => `- ${t}`).join("\n")}

---
*For a detailed 8-section premium report with fortune cycles, relationship analysis, and personalized guidance, visit [somyung.cc](https://somyung.cc)*`;
}

// ─── Tool: analyze_child_temperament ─────────────────────────────────

server.tool(
  "analyze_child_temperament",
  "Calculate a child's Four Pillars of Destiny (사주팔자) and return their temperament profile including dominant element, personality traits, learning style, and parenting tips based on Korean Saju astrology.",
  {
    birthDate: z.string().describe("Birth date in YYYY-MM-DD format"),
    birthTime: z
      .string()
      .optional()
      .describe("Birth time in HH:MM format (24h). If omitted, noon is used as estimate."),
    gender: z.enum(["M", "F"]).describe("Child's gender: M for male, F for female"),
    childName: z
      .string()
      .optional()
      .describe("Child's name (optional, used for personalization)"),
  },
  async ({ birthDate, birthTime, gender, childName }) => {
    try {
      const profile = calculateTemperament(
        birthDate,
        birthTime ?? null,
        gender,
        childName ?? null,
      );

      return {
        content: [
          {
            type: "text" as const,
            text: formatTemperamentResult(profile),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error calculating temperament: ${message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ─── Tool: compare_siblings ──────────────────────────────────────────

const childSchema = z.object({
  birthDate: z.string().describe("Birth date in YYYY-MM-DD format"),
  birthTime: z
    .string()
    .optional()
    .describe("Birth time in HH:MM format (24h)"),
  gender: z.enum(["M", "F"]).describe("Child's gender"),
  childName: z.string().optional().describe("Child's name"),
});

server.tool(
  "compare_siblings",
  "Compare the Saju temperament profiles of two siblings to understand their differences, compatibilities, and how to parent each child differently.",
  {
    child1: childSchema.describe("First child's birth information"),
    child2: childSchema.describe("Second child's birth information"),
  },
  async ({ child1, child2 }) => {
    try {
      const profile1 = calculateTemperament(
        child1.birthDate,
        child1.birthTime ?? null,
        child1.gender,
        child1.childName ?? null,
      );
      const profile2 = calculateTemperament(
        child2.birthDate,
        child2.birthTime ?? null,
        child2.gender,
        child2.childName ?? null,
      );

      const name1 = child1.childName ?? "Child 1";
      const name2 = child2.childName ?? "Child 2";

      const traits1 = ELEMENT_TRAITS[profile1.dominantElement];
      const traits2 = ELEMENT_TRAITS[profile2.dominantElement];

      // Check element interaction
      const compatible = traits1.compatibleElements.includes(profile2.dominantElement);
      const conflicting = traits1.conflictElements.includes(profile2.dominantElement);

      let relationshipNote: string;
      if (compatible) {
        relationshipNote = `${name1} (${profile1.dominantElement}) and ${name2} (${profile2.dominantElement}) have naturally compatible energies. Their elements support each other in the generation cycle (상생/相生).`;
      } else if (conflicting) {
        relationshipNote = `${name1} (${profile1.dominantElement}) and ${name2} (${profile2.dominantElement}) have elements in the control cycle (상극/相剋). This doesn't mean conflict — it means they challenge each other to grow. With awareness, this dynamic becomes a strength.`;
      } else {
        relationshipNote = `${name1} (${profile1.dominantElement}) and ${name2} (${profile2.dominantElement}) have a neutral elemental relationship. They operate on different wavelengths, which means less natural friction but also less automatic understanding.`;
      }

      const text = `# Sibling Temperament Comparison

## ${name1} vs ${name2}

### Element Profiles
| Aspect | ${name1} | ${name2} |
|--------|----------|----------|
| Birth Date | ${child1.birthDate} | ${child2.birthDate} |
| Dominant Element | ${profile1.dominantElement} | ${profile2.dominantElement} |
| Weakest Element | ${profile1.weakestElement} | ${profile2.weakestElement} |
| Day Master | ${profile1.dayMaster.stem} (${profile1.dayMaster.hanja}) — ${profile1.dayMaster.element} | ${profile2.dayMaster.stem} (${profile2.dayMaster.hanja}) — ${profile2.dayMaster.element} |

### Element Balance Comparison
| Element | ${name1} | ${name2} |
|---------|----------|----------|
| Wood (목) | ${profile1.elementBalance.wood} | ${profile2.elementBalance.wood} |
| Fire (화) | ${profile1.elementBalance.fire} | ${profile2.elementBalance.fire} |
| Earth (토) | ${profile1.elementBalance.earth} | ${profile2.elementBalance.earth} |
| Metal (금) | ${profile1.elementBalance.metal} | ${profile2.elementBalance.metal} |
| Water (수) | ${profile1.elementBalance.water} | ${profile2.elementBalance.water} |

### Sibling Relationship Dynamic
${relationshipNote}

### Learning Style Differences
- **${name1}** (${profile1.dominantElement}): ${profile1.learningStyle}
- **${name2}** (${profile2.dominantElement}): ${profile2.learningStyle}

### Social Style Differences
- **${name1}**: ${profile1.socialStyle}
- **${name2}**: ${profile2.socialStyle}

### Key Personality Differences
**${name1} (${profile1.dominantElement}):**
${profile1.personalityTraits.map((t) => `- ${t}`).join("\n")}

**${name2} (${profile2.dominantElement}):**
${profile2.personalityTraits.map((t) => `- ${t}`).join("\n")}

### Parenting Tips for Each
**For ${name1} (${profile1.dominantElement}):**
${profile1.parentTips.map((t) => `- ${t}`).join("\n")}

**For ${name2} (${profile2.dominantElement}):**
${profile2.parentTips.map((t) => `- ${t}`).join("\n")}

---
*For a detailed 8-section premium report with fortune cycles, relationship analysis, and personalized guidance, visit [somyung.cc](https://somyung.cc)*`;

      return {
        content: [{ type: "text" as const, text }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error comparing siblings: ${message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ─── Tool: explain_five_elements ─────────────────────────────────────

server.tool(
  "explain_five_elements",
  "Explain what a specific Five Element (오행) means for a child's personality, learning, and development in Korean Saju astrology.",
  {
    element: z
      .enum(["wood", "fire", "earth", "metal", "water"])
      .describe("The Five Element to explain"),
  },
  async ({ element }) => {
    const details = getElementDetails(element);

    const text = `# ${details.emoji} ${element.charAt(0).toUpperCase() + element.slice(1)} Element (${details.elementKo}/${details.elementHanja})

## What It Means
${details.description}

## Personality Traits
${details.personality.map((t) => `- ${t}`).join("\n")}

## Strengths
${details.strengths.map((s) => `- ${s}`).join("\n")}

## Challenges
${details.challenges.map((c) => `- ${c}`).join("\n")}

## Learning Style
${details.learningStyle}

## Social Style
${details.socialStyle}

## Emotional Pattern
${details.emotionalPattern}

## Parenting Tips
${details.parentTips.map((t) => `- ${t}`).join("\n")}

## Element Relationships
- **Generation cycle (상생):** ${details.generationCycle.generatedBy} generates ${element}, ${element} generates ${details.generationCycle.generates}
- **Control cycle (상극):** ${element} controls ${details.controlCycle.controls}, controlled by ${details.controlCycle.controlledBy}
- **Compatible with:** ${details.compatibleElements.join(", ")}
- **Challenging with:** ${details.conflictElements.join(", ")}

---
*For a detailed 8-section premium report with fortune cycles, relationship analysis, and personalized guidance, visit [somyung.cc](https://somyung.cc)*`;

    return {
      content: [{ type: "text" as const, text }],
    };
  },
);

// ─── Start Server ────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SoMyung MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
