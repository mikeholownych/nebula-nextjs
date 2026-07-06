import random
messages = ["Interested in $7 template", "Interested in $97 audit", "Interested in both", "Not interested"]
reply_count = 0
repliers = []
sales_detected = False
for message in messages:
    if "template" in message.lower():
        reply_count += 1
        repliers.append("template")
    if "audit" in message.lower():
        reply_count += 1
        repliers.append("audit")
    if "both" in message.lower():
        reply_count += 1
        repliers.append("both")
    if "sale" in message.lower():
        sales_detected = True
print(f'Current reply count: {reply_count}')
print(f'List of repliers: {repliers}')
if sales_detected:
    print('Sales detected!')
