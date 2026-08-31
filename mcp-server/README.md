# somyung-saju-mcp

MCP (Model Context Protocol) server for **Korean Saju (사주팔자) child temperament analysis**.

Lets AI assistants such as Claude calculate a child's Four Pillars of Destiny and return
their innate temperament, learning style, and parenting guidance — as a framework for
understanding a child, not a prediction of their future.

No API key. No network calls. All calculation runs locally.

Built by [SoMyung](https://somyung.cc), created by SungHa — a certified Myeongri Psychology
Counselor (명리심리상담사 1급) with an MS in Decision Making and Applied Analytics, and a
parent of three.

## Tools

| Tool | Description |
|------|-------------|
| `analyze_child_temperament` | Four Pillars + Five Element balance + personality traits + learning style + parenting tips |
| `compare_siblings` | Compare two children's temperaments, how they clash, and how to mediate |
| `explain_five_elements` | Detailed explanation of any element (wood / fire / earth / metal / water) |

## Install

```bash
npm install -g somyung-saju-mcp
```

Or run it without installing (see the npx config below).

## Configure with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS
(`%APPDATA%\Claude\claude_desktop_config.json` on Windows).

**Using npx — no install:**

```json
{
  "mcpServers": {
    "somyung-saju": {
      "command": "npx",
      "args": ["-y", "somyung-saju-mcp"]
    }
  }
}
```

**If installed globally:**

```json
{
  "mcpServers": {
    "somyung-saju": {
      "command": "somyung-mcp"
    }
  }
}
```

Restart Claude Desktop after editing the config.

## Configure with Claude Code

```bash
claude mcp add somyung-saju -- npx -y somyung-saju-mcp
```

## Usage

Once configured, just ask:

- "My daughter was born on 2020-05-15 at 14:30. What's her temperament?"
- "Compare my two kids: son born 2018-03-20 10:00 and daughter born 2021-07-08 15:30"
- "What does the Fire element mean for a child?"
- "My son was born 2019-11-22, I don't know the time. What's his personality like?"

The assistant calls the right tool and interprets the structured result conversationally.

## How it works

1. **Birth data** is parsed (date, optional time, gender).
2. **Four Pillars** (년주 / 월주 / 일주 / 시주) are calculated using solar terms (절기), so the
   month pillar is correct rather than approximated from the calendar month.
3. **Five Element balance** is computed across all eight characters — four heavenly stems
   (천간) and four earthly branches (지지).
4. **A temperament profile** is assembled: dominant and weakest elements, personality traits,
   learning style, social style, emotional patterns, and parenting tips.
5. The AI host receives structured data and gives a natural interpretation.

Four pillars, each drawn from the 60-term sexagenary cycle, yield **518,400 distinct
profiles** — about 32,400 times more granular than MBTI's 16 types.

Without a birth time, noon is used as an estimate and the response says so. Three pillars
still give roughly 70% of the analysis: core temperament and element balance.

## The five elements

| Element | Korean | Traits | Learning style |
|---------|--------|--------|----------------|
| Wood | 목 / 木 | Creative, independent, growth-oriented | Self-paced, autonomous |
| Fire | 화 / 火 | Passionate, expressive, warm | Short bursts, active, social |
| Earth | 토 / 土 | Stable, nurturing, reliable | Routine, familiar environment |
| Metal | 금 / 金 | Precise, principled, focused | Structured, step-by-step |
| Water | 수 / 水 | Intuitive, sensitive, adaptable | Quiet, flexible timing |

## Scope

This server describes innate temperament tendencies. It does **not** provide medical,
psychiatric, or educational diagnosis, and does not predict future events.

## Development

```bash
git clone https://github.com/ers123/somyung-saju-mcp.git
cd somyung-saju-mcp
npm install
npm run dev      # run with tsx (hot reload)
npm run build    # compile TypeScript
npm start        # run the compiled server
```

## Related

Full 8-section premium reports, in ten languages, are at
[somyung.cc](https://somyung.cc) — including a free preview.

## License

MIT — see [LICENSE](./LICENSE).
