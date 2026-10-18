import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Settings class
class Settings:
    ROOT_DIR: Path = ROOT_DIR
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    FRONTEND_PORT: int = int(os.getenv("FRONTEND_PORT", "5173"))
    
    # LLM / Groq
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GROQ_FAST_MODEL: str = os.getenv("GROQ_FAST_MODEL", "openai/gpt-oss-20b")
    
    # Local LAYA Engine
    USE_LAYA_LOCAL: bool = os.getenv("USE_LAYA_LOCAL", "true").lower() in ("true", "1", "yes")
    LAYA_MODEL_PATH: str = os.getenv("LAYA_MODEL_PATH", "convaiinnovations/laya")
    
    # Search providers
    DEFAULT_SEARCH_PROVIDER: str = os.getenv("DEFAULT_SEARCH_PROVIDER", "duckduckgo")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    BRAVE_SEARCH_API_KEY: str = os.getenv("BRAVE_SEARCH_API_KEY", "")
    TMDB_API_KEY: str = os.getenv("TMDB_API_KEY", "")
    
    # Cache
    CACHE_DB_PATH: Path = ROOT_DIR / "backend" / "cinescope_cache.db"
    CACHE_TTL_HOURS: int = int(os.getenv("CACHE_TTL_HOURS", "24"))

settings = Settings()
