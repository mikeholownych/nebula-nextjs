import json
import os
from pathlib import Path

# Load GA4 configuration
ga_config_path = Path('./.ga4_config.json')

if not ga_config_path.exists():
    print('ERROR: GA4 config file not found')
    exit(1)

with open(ga_config_path, 'r') as f:
    ga_config = json.load(f)

PROPERTY_ID = ga_config['property_id']
API_SECRET = ga_config['api_secret']

# Generate GA4 measurement protocol URL template
def ga4_measurement_protocol(event_name, params=None):
    if params is None:
        params = {}
        
    # Create event data
    event_data = {
        'events': [{
            'name': event_name,
            'params': params
        }]
    }
    
    # Convert to JSON
    payload = json.dumps(event_data)
    
    # Create URL
    url = f'https://www.google-analytics.com/mp/collect?api_secret={API_SECRET}&'
    return url, payload

# Key elements to track on landing page
tracking_elements = {
    'page_view': {
        'description': 'Track initial page load',
        'params': {
            'page_location': 'https://nebulacomponents.shop',
            'page_title': 'Landing Page',
            'page_type': 'landing'
        }
    },
    'cta_click': {
        'description': 'Track CTA button clicks',
        'params': {
            'button_id': 'audit-submit-btn',
            'button_text': 'Get Your Free Audit Now',
            'button_type': 'primary'
        }
    },
    'form_submit': {
        'description': 'Track form submissions',
        'params': {
            'form_id': 'audit-form',
            'form_type': 'free_audit'
        }
    },
    'download_request': {
        'description': 'Track download requests',
        'params': {
            'download_type': 'fix_kit',
            'download_format': 'pdf'
        }
    },
    'subscription_signup': {
        'description': 'Track subscription signups',
        'params': {
            'plan': 'weekly_insights',
            'frequency': 'weekly'
        }
    },
    'roi_calculation': {
        'description': 'Track ROI calculator usage',
        'params': {
            'feature': 'roi_calculator'
        }
    }
}

print('=== GA4 CONVERSION TRACKING CODE GENERATOR ===')
print(f'Property ID: {PROPERTY_ID}')
print(f'API Secret: {API_SECRET}')

for element_id, element_data in tracking_elements.items():
    url, payload = ga4_measurement_protocol(element_id, element_data['params'])
    
    print(f'\\n--- {element_data["description"]} ---')
    print(f'Event Name: {element_id}')
    print(f'Parameters: {element_data["params"]}')
    print(f'Measurement Protocol URL: {url}')
    print(f'Payload: {payload}')
    
    # Generate JavaScript snippet for this tracking
    js_snippet = f'''
// Track {element_id}
document.addEventListener('DOMContentLoaded', function() {{
    // Get or create GA4 dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Push event to dataLayer
    window.dataLayer.push({{
        'event': '{element_id}',
        'event_params': {json.dumps(element_data['params'])}
    }});
}});
'''

    print('JavaScript Snippet:')
    print(js_snippet)

print('\\n=== IMPLEMENTATION INSTRUCTIONS ===')
print('1. Add the following script tag to your HTML head section:')
print(f'<script src=\"https://www.googletagmanager.com/gtag/js?id={PROPERTY_ID}\"></script>')
print('''
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ''' + f"'{PROPERTY_ID}'" + ''');
</script>
''')

print('\\n2. Add the JavaScript snippets for each tracking element to appropriate event handlers')
print('\\n3. Test tracking using GA4 real-time reports')