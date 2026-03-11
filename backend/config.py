"""
Memora – Configuration
Loads settings from environment variables / .env file.
"""
from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (one level above backend/)
_project_root = Path(__file__).parent.parent
load_dotenv(_project_root / ".env", override=False)


class Settings:
    # LLM — OpenAI-compatible providers (Gemini/OpenAI/Groq/Ollama...)
    # Gemini can be used via OpenAI-compatible endpoint:
    # https://generativelanguage.googleapis.com/v1beta/openai/
    llm_api_key: str = os.getenv("LLM_API_KEY", os.getenv("GEMINI_API_KEY", ""))
    llm_model: str = os.getenv("LLM_MODEL", os.getenv("GEMINI_MODEL", "gemini-2.0-flash"))
    llm_base_url: str = os.getenv(
        "LLM_BASE_URL",
        "https://generativelanguage.googleapis.com/v1beta/openai/",
    )

    # Mode
    use_demo_mode: bool = os.getenv("USE_DEMO_MODE", "true").lower() == "true"

    # Gmail
    gmail_credentials_file: str = os.getenv(
        "GMAIL_CREDENTIALS_FILE", "credentials/gmail_credentials.json"
    )
    gmail_token_file: str = os.getenv(
        "GMAIL_TOKEN_FILE", "credentials/gmail_token.json"
    )
    gmail_max_results: int = int(os.getenv("GMAIL_MAX_RESULTS", "20"))

    # Data
    data_dir: Path = _project_root / os.getenv("DATA_DIR", "data")
    uploads_dir: Path = _project_root / "data" / "uploads"

    # Server
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    def validate(self) -> None:
        """Raise if critical env vars are missing."""
        if not self.llm_api_key:
            raise EnvironmentError(
                "LLM_API_KEY is not set. Add LLM_API_KEY (or GEMINI_API_KEY) to .env."
            )


settings = Settings()
