#!/bin/bash

# Check for new emails in the inbox
echo 'Checking inbox for new emails...'

# Use the hermes CLI to check the inbox
hermes email check --limit 1 --respond

# If no new emails are found, exit
if [ $? -ne 0 ]; then
  echo 'No new emails found.'
  exit 0
fi

# Respond to the email
echo 'Responding to the email...'

# Use the hermes CLI to respond to the email
hermes email respond --id $EMAIL_ID --subject 'Re: Your Inquiry' --body 'Thank you for your inquiry. We will get back to you shortly.'

# Log the response type
echo 'Response type: Auto-responder for DUAL FUNNEL'