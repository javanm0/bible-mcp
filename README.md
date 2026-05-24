# Bible MCP Server

A remote MCP server that gives AI assistants like Claude direct access to Scripture. **MCP** is a standard that lets AI models call external tools during a conversation — so instead of relying on training data, the AI fetches live, accurate Bible text on demand.

## Available Tools

| Tool | Description |
|---|---|
| `get_passage` | Fetch a specific verse or passage by natural language reference — "John 3:16", "Romans 8:1-4", "Psalm 23". |
| `get_chapter` | Retrieve an entire chapter — "Genesis 1", "John 3", "Revelation 22". |
| `get_context` | Return the verses surrounding a given reference — useful for reading a passage in context after a search hit. |
| `search_bible` | Full-text keyword search across the Bible — "love your enemies", "faith without works". |
| `list_books` | List all books of the Bible with chapter counts for any supported translation. |

## Add to Claude

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bible": {
      "url": "https://api.scripturescope.com/api/mcp"
    }
  }
}
```