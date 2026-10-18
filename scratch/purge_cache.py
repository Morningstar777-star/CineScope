import sqlite3

with sqlite3.connect("backend/cinescope_cache.db") as conn:
    c = conn.cursor()
    c.execute("DELETE FROM cache_store WHERE cache_key LIKE '%171627%'")
    print("Purged cache for 171627. Total cache rows remaining:", conn.execute("SELECT count(*) FROM cache_store").fetchone()[0])
