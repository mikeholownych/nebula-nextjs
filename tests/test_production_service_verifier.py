from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "verify_production_services.sh"


def test_production_verifier_proves_port_3000_listener_belongs_to_site_unit():
    source = SCRIPT.read_text()

    assert "ss -ltnp 'sport = :3000'" in source
    assert '"/proc/$listener_pid/cgroup"' in source
    assert '[[ -n "$listener_pid" ]]' in source
    assert '"$listener_cgroup_rel" == "$site_cgroup_rel"' in source
    assert "port 3000 listener PID" in source
