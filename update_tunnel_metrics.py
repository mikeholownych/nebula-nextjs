import json
import time

def update_metrics():
    try:
        with open('/home/mike/nebula/tunnel_metrics.json', 'r') as f:
            metrics = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        metrics = {'uptime': 0, 'total_time': 0}
    else:
        if 'uptime' not in metrics:
            metrics['uptime'] = 0
        if 'total_time' not in metrics:
            metrics['total_time'] = 0

    metrics['total_time'] += 1
    if tunnel_is_responsive():
        metrics['uptime'] += 1

    with open('/home/mike/nebula/tunnel_metrics.json', 'w') as f:
        json.dump(metrics, f)

def tunnel_is_responsive():
    # Placeholder for actual tunnel check logic
    return True

update_metrics()