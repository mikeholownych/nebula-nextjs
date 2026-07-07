# Tools Map — Auto vs Manual

## CONNECTS AUTOMATICALLY
| Tool | What it does | Connected since |
|------|-------------|-----------------|
| Apify (balm_snowflake) | Scrapes LinkedIn engagers from post comments/likes | √ |
| AgentMail (nebulashop@agentmail.to) | Sends audit emails, deliverability, open tracking | √ |
| Stripe | Checkout for $97 fix pack, $1,497 retainer | √ (via buy.stripe.com) |

## CONNECTS MANUALLY (needs user action)
| Tool | What's missing | To automate |
|------|---------------|-------------|
| LinkedIn feed read | Claude cannot natively read LinkedIn feed | Use Apify on-demand scrape |
| LinkedIn DM send | Claude writes DMs; user sends manually | Buffer / Taplio scheduling |
| Notion content calendar | Can read/write via ntn CLI | Already wired — manual trigger |
| Gmail | Pulls email threads for reply drafting | Via AgentMail for audits only |
| Post to LinkedIn/X | Claude writes; user copies + pastes | Scheduling via Buffer or Typefully |

## RULE
If a tool icon has a red X in the infographic, Claude can write/create but not publish.
Always write in Claude. Publish via the manual bridge tool.
