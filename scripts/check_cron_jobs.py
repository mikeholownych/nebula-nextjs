import subprocess; print(subprocess.run(["systemctl", "status", "hermes-cron"], capture_output=True).stdout.decode())
