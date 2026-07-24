import subprocess
import sys

def recover():
    # Example placeholder: restart the actual tunnel service once
    result = subprocess.run(
        ['sudo', 'systemctl', 'restart', 'cloudflared-tunnel.service'],
        capture_output=True,
        text=True,
        timeout=60,
    )

    if result.returncode != 0:
        print("Tunnel recovery failed")
        print(result.stderr)
        return 1

    print("Tunnel recovery completed")
    return 0

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "recover":
        raise SystemExit(recover())
