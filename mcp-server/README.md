# @somyung/mcp-server

MCP (Model Context Protocol) server for Korean Saju (사주팔자) child temperament analysis. Lets AI assistants like Claude and ChatGPT calculate Four Pillars of Destiny and provide personalized child personality insights.

## What It Does

This server calculates the **Four Pillars** and **Five Element balance** from a child's birth data, then returns structured temperament data that the AI host interprets naturally. No API keys needed — all calculation is local.

### Tools

| Tool | Description |
|------|-------------|
| `analyze_child_temperament` | Calculate Four Pillars + element balance + personality traits + learning style + parent tips |
| `compare_siblings` | Compare two children's temperaments, compatibility, and parenting approaches |
| `explain_five_elements` | Detailed explanation of any element (wood/fire/earth/metal/water) |

## Install

```bash
npm install -g @somyung/mcp-server
```

Or clone and build:

```bash
git clone https://github.com/somyung/mcp-server.git
cd mcp-server
npm install
npm run build
```

## Configure with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

### If installed globally via npm:

```json
{
  "mcpServers": {
    "somyung-saju": {
      "command": "somyung-mcp"
    }
  }
}
```

### If cloned locally:

```json
{
  "mcpServers": {
    "somyung-saju": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

### Using npx (no install):

```json
{
  "mcpServers": {
    "somyung-saju": {
      "command": "npx",
      "args": ["-y", "@somyung/mcp-server"]
    }
  }
}
```

## Configure with Claude Code

```bash
claude mcp add somyung-saju node /absolute/path/to/mcp-server/dist/index.js
```

## Usage Examples

Once configured, ask your AI assistant:

- "My daughter was born on 2020-05-15 at 14:30. What's her temperament?"
- "Compare my two kids: son born 2018-03-20 10:00 and daughter born 2021-07-08 15:30"
- "What does the Fire element mean for a child?"
- "My son's birth date is 2019-11-22 (don't know the time). What's his personality like?"

The AI will automatically call the appropriate tool and interpret the results.

## How It Works

1. **Birth data** is parsed (date, optional time, gender)
2. **Four Pillars** (년주/월주/일주/시주) are calculated using solar terms (절기) for accurate month pillars
3. **Five Element balance** is computed from all 8 characters (4 stems + 4 branches)
4. **Temperament profile** is assembled: dominant/weakest elements, personality traits, learning style, social style, emotional patterns, and parenting tips
5. The AI host receives structured data and provides a natural, conversational interpretation

If birth time is not provided, noon (12:00) is used as an estimate, and the response notes this limitation.

## Element Quick Reference

| Element | Korean | Traits | Learning Style |
|---------|--------|--------|---------------|
| Wood (목/木) | Creative, independent, growth-oriented | Self-paced, autonomous |
| Fire (화/火) | Passionate, expressive, warm | Short bursts, active, social |
| Earth (토/土) | Stable, nurturing, reliable | Routine, familiar environment |
| Metal (금/金) | Precise, principled, focused | Structured, step-by-step |
| Water (수/水) | Intuitive, sensitive, adaptable | Quiet, flexible timing |

## Publishing to Smithery

To register on the [Smithery MCP Registry](https://smithery.ai):

1. Create `smithery.yaml` in the project root:

```yaml
name: somyung-saju
description: Korean Saju (Four Pillars) child temperament analysis
icon: yin_yang
startCommand:
  type: stdio
  configSchema:
    type: object
    properties: {}
  commandFunction: |-
    (config) => ({
      command: 'node',
      args: ['dist/index.js']
    })
```

2. Push to a public GitHub repository
3. Go to [smithery.ai/new](https://smithery.ai/new) and submit your repo URL

## Development

```bash
npm install
npm run dev      # Run with tsx (hot reload)
npm run build    # Compile TypeScript
npm start        # Run compiled version
```

## License

MIT
