#!/bin/bash
# Run this once to set up persistent credential loading
# Creates systemd user service to load credentials on startup

mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/nebula-credentials.service << 'SYSTEMD'
[Unit]
Description=Load Nebula Credentials
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'export $(cat ~/.hermes/secrets/agentmail.key); echo "Credentials loaded"'
RemainAfterExit=yes

[Install]
WantedBy=default.target
SYSTEMD

systemctl --user daemon-reload
systemctl --user enable nebula-credentials.service
systemctl --user start nebula-credentials.service

echo "[OK] Credentials service installed"
echo "[CHECK] systemctl --user status nebula-credentials.service"
