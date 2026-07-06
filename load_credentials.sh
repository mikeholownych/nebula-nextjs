#!/bin/bash
# Load AgentMail credentials from secure storage

SECRETS_DIR="$HOME/.hermes/secrets"
KEY_FILE="$SECRETS_DIR/agentmail.key"

if [ ! -f "$KEY_FILE" ]; then
    echo "[ERROR] AgentMail key not found at $KEY_FILE"
    echo "[HELP] Copy key to: $KEY_FILE"
    exit 1
fi

export AGENTMAIL_API_KEY=$(cat "$KEY_FILE")
echo "[OK] AgentMail credentials loaded"
