import os; print(sum(os.path.getsize(f) for f in os.listdir("/home/mike/nebula/email_replies") if os.path.isfile(f)))
