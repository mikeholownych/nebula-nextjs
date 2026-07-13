from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
SERVER = (BASE / "agentic_server.py").read_text()


def test_api_health_is_proxied_to_webhook_health_route():
    assert 'return self._proxy_to(9000, "/health")' in SERVER


def test_clean_privacy_url_redirects_to_existing_html_page():
    assert '"/privacy-policy": "/privacy-policy.html"' in SERVER


def test_paid_traffic_leak_map_redirects_to_existing_lead_magnet():
    assert '"/learning-center/paid-traffic-leak-map": "/lead-magnets/paid-traffic-leak-checklist"' in SERVER
    assert 'os.path.join(DIR, "public", "lead-magnets", f"{rel}.html")' in SERVER


def test_deprecated_checkout_variants_redirect_to_canonical_checkout():
    for old_route in (
        "/create_97_checkout.html",
        "/launch_page_97.html",
        "/checkout_v2.html",
        "/checkout-impulse.html",
    ):
        assert f'"{old_route}": "/checkout.html"' in SERVER


def test_active_server_has_no_legacy_97_offer_attribution():
    assert "audit_first_97_checkout" not in SERVER
    assert "audit_first_147_checkout" in SERVER


def test_newsletter_form_has_a_post_handler_and_subscriber_ledger():
    assert 'if path == "/newsletter":' in SERVER
    assert "newsletter_subscribers.jsonl" in SERVER
    assert "valid email is required" in SERVER


def test_crm_admin_endpoints_require_bearer_auth():
    assert "def _admin_authorized(self):" in SERVER
    assert '"/home/mike/.hermes/secrets/nebula_admin_token"' in SERVER
    assert 'return self._send_json(401, {"error": "unauthorized"})' in SERVER


def test_demo_booking_validates_input_and_uses_current_agentmail_secret():
    assert 'return self._send_json(400, {"error": "valid email is required"})' in SERVER
    assert '"/home/mike/.hermes/secrets/agentmail.key"' in SERVER
    assert 'open("/tmp/am_key")' not in SERVER


def test_audit_rejects_invalid_targets_as_client_errors():
    assert "except ValueError as e:" in SERVER
    assert 'return self._send_json(400, {"error": str(e)})' in SERVER


def test_server_is_threaded_so_audits_do_not_block_health_or_checkout():
    assert "socketserver.ThreadingTCPServer" in SERVER
    assert "socketserver.TCPServer((host, PORT), AgenticHandler)" not in SERVER


def test_static_fallback_denies_source_code_ledgers_and_internal_directories():
    assert "def _static_path_allowed(self, path):" in SERVER
    for token in ('".py"', '".json"', '".jsonl"', '".md"', '".git"', '"ops"', '"governance"', '"tests"'):
        assert token in SERVER
    assert 'return self.send_error(404)' in SERVER
