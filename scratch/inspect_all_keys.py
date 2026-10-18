import sqlite3

with sqlite3.connect("backend/cinescope_cache.db") as conn:
    c = conn.cursor()
    c.execute("SELECT cache_key FROM cache_store")
    keys = [r[0] for r in c.fetchall()]
    print(f"Total keys: {len(keys)}")
    for k in keys:
        print(" -", k)
