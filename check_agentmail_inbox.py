import agentmail

def check_inbox():
    inbox = agentmail.inboxes.get_all_messages
    replies = [msg for msg in inbox if msg["type"] == "reply"]
    auto_responders = [msg for msg in inbox if msg["type"] == "auto_responder"]
    sales = [msg for msg in replies if msg["content"].lower().startswith("purchase")]
    return len(replies), [msg["from"] for msg in replies], len(sales)

reply_count, repliers, sales_count = check_inbox()
print(f"Current reply count: {reply_count}\nRepliers: {repliers}\nSales detected: {sales_count}")
