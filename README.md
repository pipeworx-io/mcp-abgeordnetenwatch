# mcp-abgeordnetenwatch

Abgeordnetenwatch MCP — German federal & state parliament data.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Abgeordnetenwatch data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
