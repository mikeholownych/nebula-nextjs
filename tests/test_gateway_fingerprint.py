from gateway_fingerprint import enrich_gateway_evidence, fingerprint_hostname


def test_fingerprint_known_security_gateways():
    assert fingerprint_hostname("mx-us.mimecast.com").security_gateway_vendor == "mimecast"
    assert fingerprint_hostname("cluster1.us.proofpoint.com").security_gateway_vendor == "proofpoint"
    assert fingerprint_hostname("mx.ess.barracudanetworks.com").security_gateway_vendor == "barracuda"


def test_fingerprint_separates_mailbox_provider_from_security_gateway():
    result = fingerprint_hostname("mx.zoho.com.au")
    assert result.receiving_provider == "zoho"
    assert result.security_gateway_vendor == "unknown"
    assert result.gateway_confidence == "unknown"


def test_fingerprint_microsoft_exchange_online_protection():
    result = fingerprint_hostname("mail.protection.outlook.com")
    assert result.receiving_provider == "microsoft_365"
    assert result.security_gateway_vendor == "microsoft_eop"
    assert result.gateway_confidence == "medium"


def test_enriches_mailcheck_evidence_without_mutating_original():
    evidence = {
        "dns": [{"mx_records": [{"hostname": "mx.google.com"}]}],
        "smtp": [{"mx_hostname": "mx.google.com", "banner": "mx.google.com ESMTP"}],
    }
    enriched = enrich_gateway_evidence(evidence)
    assert "gateway_enrichment" not in evidence
    assert enriched["gateway_enrichment"]["receiving_provider"] == "google_workspace"
    assert enriched["gateway_enrichment"]["security_gateway_vendor"] == "unknown"
    assert enriched["gateway_enrichment"]["evidence_basis"] == ["dns.mx_records", "smtp.mx_hostname", "smtp.banner"]


def test_unknown_hostname_is_fail_closed():
    result = fingerprint_hostname("mail.example-customer.net")
    assert result.receiving_provider == "unknown"
    assert result.security_gateway_vendor == "unknown"
    assert result.gateway_confidence == "unknown"
