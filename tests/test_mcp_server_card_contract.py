import json
from pathlib import Path

CARD = Path(__file__).parents[1] / 'customer-portal/public/.well-known/mcp/server-card.json'


def test_mcp_server_card_matches_live_tool_contract():
    card = json.loads(CARD.read_text())
    assert card['serverInfo']['version'] == '1.29.0'
    assert card['transport']['endpoint'] == 'https://mcp.nebulacomponents.com/mcp'
    assert card['authentication']['required'] is False
    assert {tool['name'] for tool in card['tools']} == {
        'run_audit', 'compare_audits', 'recent_audits', 'get_audit', 'get_fix_instructions',
    }


def test_mcp_server_card_does_not_advertise_customer_changes():
    text = CARD.read_text().lower()
    assert 'applied a customer change' not in text
    assert 'proposed' not in text or 'artifact' in text
