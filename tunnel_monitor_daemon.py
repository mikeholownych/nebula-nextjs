#!/usr/bin/env python3
"""
Tunnel Monitor & Auto-Restarter
Continuously monitors cloudflared process and restarts if it crashes
"""
import subprocess
import time
import signal
import os
import sys
from datetime import datetime

TUNNEL_ID = "8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2"
LOG_FILE = "/home/mike/nebula/tunnel_monitor.log"
MAX_RESTARTS = 10
RESTART_WINDOW = 3600  # 1 hour

def log(msg):
    timestamp = datetime.now().isoformat()
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def start_tunnel():
    """Start the cloudflared tunnel process"""
    log(f"🚀 Starting tunnel {TUNNEL_ID}...")
    try:
        proc = subprocess.Popen(
            ["/usr/local/bin/cloudflared", "tunnel", "run", TUNNEL_ID],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        log(f"✅ Tunnel started (PID {proc.pid})")
        return proc
    except Exception as e:
        log(f"❌ Failed to start tunnel: {e}")
        return None

def health_check():
    """Check if tunnel is responding"""
    try:
        result = subprocess.run(
            ["curl", "-sI", "https://nebulacomponents.shop/"],
            capture_output=True,
            timeout=5
        )
        if result.returncode == 0 and b"200" in result.stdout:
            return True
    except:
        pass
    return False

def main():
    log("=== Tunnel Monitor Started ===")
    
    restart_count = 0
    restart_times = []
    
    while True:
        proc = start_tunnel()
        if not proc:
            time.sleep(10)
            continue
        
        # Monitor process
        while proc.poll() is None:
            time.sleep(5)
            
            # Check if healthy
            if not health_check():
                log("⚠️  Health check failed, terminating tunnel...")
                proc.terminate()
                break
        
        # Process exited/crashed
        exit_code = proc.returncode
        log(f"🔴 Tunnel crashed (exit code: {exit_code})")
        
        # Track restarts
        now = time.time()
        restart_times = [t for t in restart_times if now - t < RESTART_WINDOW]
        
        if len(restart_times) >= MAX_RESTARTS:
            log(f"🚨 CRITICAL: {MAX_RESTARTS} restarts in {RESTART_WINDOW}s, exiting")
            sys.exit(1)
        
        restart_times.append(now)
        restart_count += 1
        log(f"📊 Restart #{restart_count} ({len(restart_times)} in last hour)")
        
        time.sleep(5)  # Brief delay before restart

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("🛑 Tunnel monitor stopped by user")
        sys.exit(0)
