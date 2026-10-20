from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_fallback_models: str = "gemini-3-flash-preview,gemini-flash-lite-latest"
    gemini_timeout_ms: int = 20000
    frontend_origin: str = "http://localhost:5173"
    frontend_origin_regex: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
