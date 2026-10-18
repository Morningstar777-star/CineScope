import sqlite3
import json
import time
from typing import Optional, Any
from pathlib import Path
from app.config import settings

class CacheService:
    """
    Two-tier caching service:
    1. Fast in-memory dictionary for instant sub-millisecond retrieval.
    2. SQLite persistent database for durable caching across server restarts.
    """
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.CACHE_DB_PATH
        self.memory_cache = {}
        self._init_db()

    def _init_db(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cache_store (
                    cache_key TEXT PRIMARY KEY,
                    data_json TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    expires_at REAL NOT NULL,
                    category TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_store(expires_at)")

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        # 1. Check memory cache
        if key in self.memory_cache:
            data, exp = self.memory_cache[key]
            if now < exp:
                return data
            else:
                del self.memory_cache[key]

        # 2. Check SQLite
        try:
            with sqlite3.connect(self.db_path) as conn:
                cur = conn.cursor()
                cur.execute("SELECT data_json, expires_at FROM cache_store WHERE cache_key = ?", (key,))
                row = cur.fetchone()
                if row:
                    data_json, expires_at = row
                    if now < expires_at:
                        parsed = json.loads(data_json)
                        self.memory_cache[key] = (parsed, expires_at)
                        return parsed
                    else:
                        conn.execute("DELETE FROM cache_store WHERE cache_key = ?", (key,))
        except Exception as e:
            print(f"[CacheService] Warning reading cache for {key}: {e}")
        return None

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None, category: str = "general"):
        if ttl_seconds is None:
            ttl_seconds = settings.CACHE_TTL_HOURS * 3600
        now = time.time()
        expires_at = now + ttl_seconds
        
        # Memory
        self.memory_cache[key] = (value, expires_at)
        
        # SQLite
        try:
            val_json = json.dumps(value, default=str)
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO cache_store (cache_key, data_json, created_at, expires_at, category)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(cache_key) DO UPDATE SET
                        data_json=excluded.data_json,
                        created_at=excluded.created_at,
                        expires_at=excluded.expires_at,
                        category=excluded.category
                """, (key, val_json, now, expires_at, category))
        except Exception as e:
            print(f"[CacheService] Error setting cache for {key}: {e}")

    def clear_expired(self):
        now = time.time()
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("DELETE FROM cache_store WHERE expires_at < ?", (now,))
        except Exception:
            pass

    def delete(self, key_pattern: str):
        """Invalidates cache entries matching a SQL LIKE pattern."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("DELETE FROM cache_store WHERE cache_key LIKE ?", (key_pattern,))
            # Clear matching in-memory cache keys
            prefix = key_pattern.replace("%", "")
            keys_to_del = [k for k in self.memory_cache.keys() if prefix in k]
            for k in keys_to_del:
                del self.memory_cache[k]
        except Exception as e:
            print(f"[CacheService] Error deleting cache for {key_pattern}: {e}")

cache_service = CacheService()

