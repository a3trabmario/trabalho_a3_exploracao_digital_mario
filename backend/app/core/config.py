from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ExpliLab API"
    debug: bool = False
    database_name: str
    database_user: str
    database_password: str
    database_host: str = "127.0.0.1"
    database_port: int = 3306
    jwt_secret: str
    jwt_expire_minutes: int = 60
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()