import sqlite3

conn = sqlite3.connect("backend/cinescope_cache.db")
c = conn.cursor()
c.execute("SELECT key FROM cache WHERE key LIKE '%171627%'")
rows = c.fetchall()
print("Cached keys for 171627:", [r[0] for r in rows])
