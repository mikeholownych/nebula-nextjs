from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from platform_api.routes.newsletter import BUSINESS_ADDRESS, UNSUBSCRIBE_URL


def test_confirmation_template_compliance_and_html():
    source = Path(__file__).resolve().parents[1] / "platform_api" / "routes" / "newsletter.py"
    text = source.read_text()
    assert BUSINESS_ADDRESS in text
    assert UNSUBSCRIBE_URL in text
    assert 'List-Unsubscribe' in text
    assert 'List-Unsubscribe-Post' in text
    assert 'html=html' in text
    assert 'If you did not request this email' in text
    assert 'Confirm my subscription' in text
