#!/bin/bash
# Nebula Components - Email Queue Processor
# Called every 5 minutes by cron

curl -s "http://localhost:3000/api/email/process?action=process" 2>/dev/null || echo "Email processor failed"
