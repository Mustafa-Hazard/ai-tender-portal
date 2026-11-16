from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Tender Portal API"
    database_url: str = "sqlite+pysqlite:///./tender.db"
    redis_url: str = "redis://localhost:6379/0"

    storage_dir: str = "storage"
    max_upload_mb: int = 25
    stale_after_hours: int = 72

    # JWT Authentication & Security
    jwt_secret_key: str = "ai-tender-portal-secure-production-jwt-secret-key-2026-pakistan"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 480  # 8 hours

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
