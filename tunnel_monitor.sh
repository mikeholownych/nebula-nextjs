#!/bin/bash

# Check tunnel status and send alert if down for more than 3 consecutive checks

COUNT=0

while true; do
    if! python3 /home/mike/nebula/tunnel_manager.py check_tunnel_status; then
        COUNT=$((COUNT+1))
        if [ $COUNT -ge 3 ]; then
            echo "Tunnel down for 15 minutes. Sending alert." >> /home/mike/nebula/tunnel_manager.log
            # Add alert sending logic here
            exit 1
        fi
    else
        COUNT=0
    fi
    sleep 300
done
