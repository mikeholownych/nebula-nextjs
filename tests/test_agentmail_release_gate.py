from agentmail_client import AgentMailClient
from outbound_release_gate import DeliveryPurpose, GateDecision


class RecordingGate:
    def __init__(self, allowed: bool, reason: str = "reserved", validate_allowed: bool = True):
        self.allowed = allowed
        self.reason = reason
        self.validate_allowed = validate_allowed
        self.reservations = []
        self.validations = []
        self.completions = []

    def reserve(self, recipient, client_id, *, purpose):
        self.reservations.append((recipient, client_id, purpose))
        return GateDecision(self.allowed, self.reason, client_id)

    def validate(self, client_id):
        self.validations.append(client_id)
        reason = "validated" if self.validate_allowed else "outreach_disabled"
        return GateDecision(self.validate_allowed, reason, client_id)

    def complete(self, client_id, *, sent, reason=""):
        self.completions.append((client_id, sent, reason))


class FakeAgentMailClient(AgentMailClient):
    def __init__(self, gate, result=None):
        self.provider_calls = []
        self.result = result or {"message_id": "msg-1"}
        super().__init__(key="test-key", gate=gate, transport=self._fake_transport)

    def _fake_transport(self, method, path, data=None):
        self.provider_calls.append((method, path, data))
        return dict(self.result)


def test_send_does_not_call_provider_when_release_gate_blocks():
    gate = RecordingGate(False, "lead_bounced")
    client = FakeAgentMailClient(gate)
    result = client.send(
        to=["blocked@example.com"],
        subject="No send",
        text="Body",
        client_id="campaign:blocked:step1",
    )
    assert result["_reason"] == "lead_bounced"
    assert client.provider_calls == []
    assert gate.validations == []


def test_preflight_policy_change_blocks_provider_after_reservation():
    gate = RecordingGate(True, validate_allowed=False)
    client = FakeAgentMailClient(gate)
    result = client.send(
        to=["lead@example.com"],
        subject="No send",
        text="Body",
        client_id="campaign:lead:step1",
    )
    assert result["_reason"] == "outreach_disabled"
    assert client.provider_calls == []
    assert gate.validations == ["campaign:lead:step1"]


def test_generic_request_rejects_direct_delivery_endpoint():
    gate = RecordingGate(True)
    client = FakeAgentMailClient(gate)
    result = client._req(
        "POST", "/inboxes/test/messages/send", {"to": ["lead@example.com"]}
    )
    assert result["_reason"] == "direct_delivery_forbidden"
    assert client.provider_calls == []
    assert gate.reservations == []


def test_audit_send_passes_idempotency_key_and_records_success():
    gate = RecordingGate(True)
    client = FakeAgentMailClient(gate)
    result = client.send_audit(
        to=["lead@example.com"],
        subject="Audit ready",
        text="Body",
        client_id="audit:lead:delivery",
    )
    assert result["message_id"] == "msg-1"
    assert gate.reservations == [
        ("lead@example.com", "audit:lead:delivery", DeliveryPurpose.AUDIT_DELIVERY)
    ]
    assert gate.completions == [("audit:lead:delivery", True, "")]
    assert client.provider_calls[0][2]["client_id"] == "audit:lead:delivery"


def test_provider_error_is_recorded_without_backup_provider():
    gate = RecordingGate(True)
    client = FakeAgentMailClient(gate, {"_error": 500, "_body": "down"})
    result = client.send_audit(
        to=["lead@example.com"],
        subject="Audit ready",
        text="Body",
        client_id="audit:lead:delivery",
    )
    assert result["_error"] == 500
    assert gate.completions == [("audit:lead:delivery", False, "500")]
    assert len(client.provider_calls) == 1


def test_missing_client_id_is_derived_deterministically_by_scope():
    gate = RecordingGate(True)
    client = FakeAgentMailClient(gate)
    first = client.send(to=["lead@example.com"], subject="Same", text="Body")
    second = client.send(to=["lead@example.com"], subject="Same", text="Body")
    audit = client.send_audit(to=["lead@example.com"], subject="Same", text="Body")
    assert first["client_id"].startswith("auto:")
    assert first["client_id"] == second["client_id"]
    assert audit["client_id"].startswith("audit:")


def test_reply_does_not_call_provider_when_release_gate_blocks():
    gate = RecordingGate(False, "lead_unsubscribed")
    client = FakeAgentMailClient(gate)
    result = client.reply(
        "msg-inbound-1",
        recipient="lead@example.com",
        text="Reply body",
        client_id="reply:msg-inbound-1",
    )
    assert result["_reason"] == "lead_unsubscribed"
    assert client.provider_calls == []
