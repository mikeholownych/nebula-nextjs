import json

with open('/home/mike/nebula/tunnel_metrics.json', 'r') as f:
    metrics = json.load(f)

uptime_percentage = metrics.get('uptime_percentage', 0)
print(f'Uptime Percentage: {uptime_percentage}%')