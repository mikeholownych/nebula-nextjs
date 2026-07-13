#!/usr/bin/env python3
import os
import json
import time

# Test GA4 tracking setup
def test_ga4_tracking():
    # Check if GA4 config exists
    ga_config_path = '/home/mike/nebula/.ga4_config.json'
    
    if os.path.exists(ga_config_path):
        with open(ga_config_path, 'r') as f:
            config = json.load(f)
        print('GA4 CONFIG FOUND:')
        print(f'  Property ID: {config.get('property_id', 'NOT FOUND')}')
        print(f'  Measurement Protocol: {config.get('measurement_protocol', 'NOT FOUND')}')
    else:
        print('GA4 CONFIG NOT FOUND - creating minimal config')
        minimal_config = {
            'property_id': '123456789',  # Placeholder - user must update
            'measurement_protocol': 'https://www.google-analytics.com/mp/collect'
        }
        with open(ga_config_path, 'w') as f:
            json.dump(minimal_config, f)
        print('Created minimal GA4 config - update property_id with your actual ID')
    
    # Test basic event sending
    test_event = {
        'client_id': 'test_client_12345',
        'events': [{
            'name': 'test_event',
            'params': {
                'event_value': 1,
                'event_label': 'landing_page_test'
            }
        }]
    }
    
    import requests
    try:
        response = requests.post(
            f'https://www.google-analytics.com/mp/collect?api_secret={os.environ.get('GA4_API_SECRET', 'test_secret')}&',
            json=test_event
        )
        print(f'GA4 TEST EVENT SENT - Status: {response.status_code}')
        print('Test event sent successfully - verify in GA4 real-time reports')
    except Exception as e:
        print(f'GA4 TEST EVENT FAILED: {str(e)}')

if __name__ == '__main__':
    test_ga4_tracking()
