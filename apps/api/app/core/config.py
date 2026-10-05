from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Tender Portal API"
    database_url: str = "postgresql+psycopg://tender:tender@localhost:5432/tender"
    redis_url: str = "redis://localhost:6379/0"

    storage_dir: str = "storage"
    max_upload_mb: int = 25
    stale_after_hours: int = 72

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
