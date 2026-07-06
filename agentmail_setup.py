"""Wrapper to use the AgentMail adapter.
This file now delegates the raw API handling to nebula.adapters.agentmail.
"""
from .adapters.agentmail import create_inbox, api

def main():
    inbox_id, response = create_inbox()
    if inbox_id:
        print(f"✅ Inbox created: {inbox_id}")
        with open("/home/mike/nebula/.inbox_id", "w") as f:
            f.write(str(inbox_id))
    else:
        print("❌ Failed to create inbox", response)

if __name__ == "__main__":
    main()
