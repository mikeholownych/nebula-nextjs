IMAP_SERVER = "imap.agentmail.to"
IMAP_PORT = 993
IMAP_USERNAME = "nebulashop@agentmail.to"
with open("/home/mike/.hermes/secrets/agentmail.key", 'r') as f:
    IMAP_PASSWORD = f.read().strip()
