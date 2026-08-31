# MCP server

The SoMyung MCP server lives in its own repository:

**https://github.com/ers123/somyung-saju-mcp** — published as
[`somyung-saju-mcp`](https://www.npmjs.com/package/somyung-saju-mcp) on npm and
listed on [Smithery](https://smithery.ai/servers/harmonyon24/somyung-saju).

It used to sit in `mcp-server/` here. It was moved out because it has no
coupling to this codebase — it imports nothing from `frontend/` or `backend/`,
makes no network calls, and needs no API key; the Saju calculation is entirely
local. Keeping a copy inside this private monorepo only let the two drift, and
they did: the public repo gained the MCPB manifest, the bundle build script and
the release workflow while this copy stood still. A stale duplicate of a
published package is also a live risk of releasing from the wrong one.

Releases run from that repository via npm trusted publishing (OIDC):

```bash
npm version patch && git push --follow-tags
```

The removed files remain in this repository's git history.
