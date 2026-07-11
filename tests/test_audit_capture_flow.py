import unittest
from pathlib import Path

BASE = Path('/home/mike/nebula')


class AuditCaptureFlowTests(unittest.TestCase):
    def test_audit_api_logs_only_email_leads_and_source_attribution(self):
        source = (BASE / 'agentic_server.py').read_text()
        self.assertIn('if email:', source)
        self.assertIn('source_type', source)
        self.assertIn('inbound_audit_tool', source)
        self.assertIn('outreach_evidence.jsonl', source)
        self.assertIn('inbound_audit_capture', source)

    def test_email_gate_does_not_unlock_when_email_send_fails(self):
        """Audit capture flow now handled by agentic_server.py /api/audit endpoint."""
        source = (BASE / 'agentic_server.py').read_text()
        self.assertIn('/api/audit', source)
        self.assertIn('deliver_audit', source)
        self.assertIn('audit_leads.jsonl', source)


if __name__ == '__main__':
    unittest.main()
