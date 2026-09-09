"""Test Citable CRO integration and executive report generation."""

import unittest
from unittest.mock import patch, MagicMock
from platform_api.services.citable_service import (
    MIN_CITABLE_VERSION,
    CITABLE_RELEASE_COMMIT,
    citable_version,
    generate_citable_implementation_kit,
    generate_citable_remediation_verification,
    installed_citable_version,
    resolve_citable_bin,
    run_citable_analysis,
)
from platform_api.routes.report_routes import router


class TestCitableCroIntegration(unittest.TestCase):
    def test_citable_requires_v117_or_newer(self):
        self.assertEqual(MIN_CITABLE_VERSION, (1, 17, 0))
        self.assertTrue(citable_version('1.17.0') >= MIN_CITABLE_VERSION)
        self.assertFalse(citable_version('1.16.0') >= MIN_CITABLE_VERSION)

    def test_citable_bin_resolution(self):
        binary = resolve_citable_bin()
        self.assertIsNotNone(binary, "Citable binary must be resolvable on the system")

    def test_report_routes_has_citable_endpoint(self):
        routes = [r.path for r in router.routes]
        self.assertIn("/api/report/citable", routes, "GET /api/report/citable must be registered")

    @patch("subprocess.run")
    def test_v117_result_envelope_is_unwrapped_with_release_metadata(self, mock_subproc):
        mock_subproc.side_effect = [
            MagicMock(returncode=0, stdout='1.17.0', stderr=''),
            MagicMock(
                returncode=0,
                stdout='{"citable_output_schema":"1.0","tool_version":"1.17.0","generated_at":"2026-09-08T00:00:00Z","result":{"conversion_status":"needs_attention","findings":[{"detector_id":"CRO-021","severity":"high","summary":"Wallet readiness gap","detector_version":1,"methodology":"deterministic"}]}}',
            ),
        ]

        result = run_citable_analysis("https://example.com", client_name="Acme Corp")

        self.assertEqual(result["citable_version"], "1.17.0")
        self.assertEqual(result["cro"]["conversion_status"], "needs_attention")
        self.assertEqual(result["findings"][0]["condition_id"], "CRO-021")
        self.assertEqual(result["findings"][0]["detector_version"], 1)
        self.assertEqual(result["findings"][0]["methodology"], "deterministic")

    @patch("subprocess.run")
    def test_run_citable_analysis_mocked(self, mock_subproc):
        mock_cro = MagicMock()
        mock_cro.returncode = 0
        mock_cro.stdout = '{"status": 200, "conversion_status": "ready", "ctas": [{"text": "Free Audit", "isPrimary": true}], "findings": [{"detector_id": "CRO-005", "severity": "medium", "summary": "Headline scent gap"}, {"detector_id": "CRO-006", "severity": "high", "summary": "Message scent gap"}]}'

        mock_version = MagicMock(returncode=0, stdout='1.17.0', stderr='')
        mock_subproc.side_effect = [mock_version, mock_cro]

        result = run_citable_analysis("https://example.com", client_name="Acme Corp")
        self.assertEqual(result["status"], "completed")
        self.assertGreaterEqual(len(result["findings"]), 2)
        self.assertIn("<!DOCTYPE html>", result["executive_brief_html"])
        self.assertIn("# Executive", result["executive_deck_md"])
        self.assertIn("Citable v1.17.0", result["executive_brief_html"])

    @patch("subprocess.run")
    def test_installed_citable_version_rejects_stale(self, mock_subproc):
        mock_subproc.return_value = MagicMock(returncode=0, stdout='1.16.0', stderr='')
        with self.assertRaises(RuntimeError) as ctx:
            installed_citable_version("/mock/citable")
        self.assertIn("below the required", str(ctx.exception))

    @patch("subprocess.run")
    def test_run_citable_analysis_provenance_and_integrity_hash(self, mock_subproc):
        mock_version = MagicMock(returncode=0, stdout='1.17.0', stderr='')
        mock_cro = MagicMock(
            returncode=0,
            stdout='{"citable_output_schema":"1.0","tool_version":"1.17.0","generated_at":"2026-09-08T00:00:00Z","result":{"conversion_status":"needs_attention","findings":[{"detector_id":"CRO-021","severity":"high","summary":"Wallet readiness gap","detector_version":1,"methodology":"deterministic","revalidation_requirement":"same_condition_inspection"}]}}',
        )
        mock_subproc.side_effect = [mock_version, mock_cro]

        result = run_citable_analysis("https://example.com", client_name="Acme Corp")

        self.assertEqual(result["citable_version"], "1.17.0")
        self.assertEqual(result["citable_release_commit"], CITABLE_RELEASE_COMMIT)
        self.assertEqual(len(result["citable_release_commit"]), 40)
        self.assertIn("integrity_hash", result)
        self.assertEqual(len(result["integrity_hash"]), 64)

        # Provenance on finding
        finding = result["findings"][0]
        self.assertEqual(finding["condition_id"], "CRO-021")
        self.assertEqual(finding["detector_version"], 1)
        self.assertEqual(finding["tool_version"], "1.17.0")
        self.assertEqual(finding["methodology"], "deterministic")
        self.assertEqual(finding["revalidation_requirement"], "same_condition_inspection")

        # Sealed run manifest
        run_id = result["run_id"]
        from pathlib import Path
        import json
        manifest_path = Path(__file__).resolve().parents[1] / ".citable" / "runs" / run_id / "manifest.json"
        self.assertTrue(manifest_path.exists(), f"manifest.json must exist at {manifest_path}")
        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(manifest_data["run_id"], run_id)
        self.assertEqual(manifest_data["integrity_hash"], result["integrity_hash"])
        self.assertEqual(manifest_data["citable_version"], "1.17.0")
        self.assertEqual(manifest_data["citable_release_commit"], CITABLE_RELEASE_COMMIT)

    def test_implementation_kit_generation(self):
        audit_data = {
            "id": "11111111-2222-3333-4444-555555555555",
            "url": "https://example.com",
            "findings": [
                {
                    "condition_id": "CRO-005",
                    "label": "Headline scent gap",
                    "issue": "H1 does not match referring query",
                    "fix": "Align H1 copy with search intent",
                    "impact": 7.5,
                    "effort": 2,
                }
            ],
        }
        kit = generate_citable_implementation_kit(audit_data)
        self.assertEqual(kit["target_condition_id"], "CRO-005")
        self.assertEqual(kit["finding"]["condition_id"], "CRO-005")
        self.assertIn("acceptance_tests", kit)
        self.assertIn("deployment_and_rollback", kit)
        self.assertIn("re_audit_instructions", kit)
        self.assertIn("boundary_notice", kit)
        self.assertIn("integrity_hash", kit)
        self.assertEqual(len(kit["integrity_hash"]), 64)
        # Verify boundary: no conversion lift claimed
        self.assertNotIn("guarantee conversion", kit["boundary_notice"].lower())

    def test_remediation_verification_generation(self):
        audit_data = {
            "id": "11111111-2222-3333-4444-555555555555",
            "url": "https://example.com",
            "findings": [
                {
                    "condition_id": "CRO-005",
                    "label": "Headline scent gap",
                    "issue": "H1 does not match referring query",
                    "fix": "Align H1 copy with search intent",
                    "impact": 7.5,
                    "effort": 2,
                }
            ],
        }
        verif = generate_citable_remediation_verification(audit_data)
        self.assertEqual(verif["condition_id"], "CRO-005")
        self.assertEqual(verif["status"], "pending_reobservation")
        self.assertIn("before_state", verif)
        self.assertIn("after_state", verif)
        self.assertIn("boundary_notice", verif)
        self.assertIn("integrity_hash", verif)
        self.assertEqual(len(verif["integrity_hash"]), 64)
        self.assertIn("differentiation", verif["boundary_notice"].lower())


if __name__ == "__main__":
    unittest.main()
