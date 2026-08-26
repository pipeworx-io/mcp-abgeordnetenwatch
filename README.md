# mcp-abgeordnetenwatch

Abgeordnetenwatch MCP — German federal & state parliament data.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `list_parliaments` | List German parliaments tracked by Abgeordnetenwatch: the federal Bundestag, all 16 state Landtage, and the EU parliament. Returns id, short name and full official name for each. Use the ids to scope politician or poll queries. |
| `search_politicians` | Search German federal and state politicians by name (surname or partial surname, contains-match). Returns matching politicians with party, year of birth and sex. Example: name "Scholz" or "Merz". Use get_politician with a returned id for the full profile. |
| `get_politician` | Get the full profile of a single German politician by Abgeordnetenwatch id: name, party, year of birth, sex, education and residence. Get the id from search_politicians. |
| `list_polls` | List recorded parliamentary votes/polls (Abstimmungen) with their title and date. Optionally scope to a single legislative period via period_id (a parliament-period id). Returns most recent polls first. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "abgeordnetenwatch": {
      "url": "https://gateway.pipeworx.io/abgeordnetenwatch/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/abgeordnetenwatch/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Abgeordnetenwatch data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
