# LinkedIn Outreach Board (Notion placeholder)

## Columns (to be created in Notion)
- **Prospect Name** (text)
- **Company** (text)
- **LinkedIn URL** (url)
- **Signal Source** (select: post_commenter / profile_view / job_change)
- **Connection Sent** (date)
- **Connection Accepted** (checkbox)
- **Value‑First DM Sent** (date)
- **Reply Received** (checkbox)
- **Soft Ask Sent** (date)
- **Call Booked** (date)
- **Break‑Up Sent** (date)
- **Notes** (text)

## Views to create
1. **Pipeline** – Kanban view by stage (Connection → Value → Soft Ask → Booked → Done).
2. **Metrics** – Table view with filters for dates; roll‑up fields to calculate:
   - Accept Rate = #Accepted / #Sent
   - Reply Rate = #Reply / #Accepted
   - CTC Conversion = #Booked / #Reply
   - Show Rate = #Booked / #Value‑First DM

## Automation suggestions (later)
- Use Notion API + n8n to automatically move rows when a LinkedIn action is logged.
- Trigger a reminder when a prospect stays >48 h in a stage.

*This markdown file serves as the blueprint for the actual Notion board you will create manually or via Notion API.*