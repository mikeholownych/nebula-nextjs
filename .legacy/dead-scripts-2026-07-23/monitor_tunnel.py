import time

def check_log():
    with open('/home/mike/nebula/tunnel_manager.log', 'r') as f:
        lines = f.readlines()
    if len(lines) >= 3 and all('Tunnel is down' in line for line in lines[-3:]):
        with open('/home/mike/nebula/alert.txt', 'w') as f:
            f.write('Tunnel has been down for more than 15 minutes')

while True:
    check_log()
    time.sleep(300)