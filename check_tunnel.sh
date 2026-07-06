#!/bin/bash
LOG_FILE="/home/mike/nebula/tunnel_manager.log"
DOWN_COUNT=0

while true
do
    if grep -q "Tunnel is down" $LOG_FILE
    then
        let DOWN_COUNT+=1
        if [ $DOWN_COUNT -eq 3 ]
        then
            echo "Tunnel has been down for 3 consecutive checks. Sending alert."
            # Add alert sending logic here
            DOWN_COUNT=0
        fi
    else
        DOWN_COUNT=0
    fi
    sleep 300
done
