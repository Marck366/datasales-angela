from __future__ import annotations

from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str
    db_port: int = 3306
    db_name: str
    db_user: str
    db_password: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 8

    anthropic_api_key: str
    allowed_origins: str = "http://localhost:5173"
    allowed_hosts: str = "localhost,127.0.0.1"
    ai_pii_processing_enabled: bool = False
    log_hash_salt: str | None = None
    global_rate_limit_per_minute: int = Field(default=300, ge=1)
    ai_rate_limit_per_minute: int = Field(default=20, ge=1)

    environment: str = "development"  # "production" en prod

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def cookie_secure(self) -> bool:
        return self.is_production

    @property
    def database_url(self) -> str:
        return (
            f"mysql+aiomysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def hosts_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]

    @property
    def cookie_samesite(self) -> str:
        return "strict" if self.is_production else "lax"

    @property
    def effective_log_hash_salt(self) -> str:
        return self.log_hash_salt or self.jwt_secret

    @model_validator(mode="after")
    def validate_security_settings(self):
        if self.jwt_algorithm != "HS256":
            raise ValueError("JWT_ALGORITHM no permitido")
        if len(self.jwt_secret) < 32:
            raise ValueError("JWT_SECRET debe tener al menos 32 caracteres")
        if self.is_production:
            if "*" in self.origins_list:
                raise ValueError("ALLOWED_ORIGINS no puede incluir '*' en produccion")
            if any("localhost" in origin or "127.0.0.1" in origin for origin in self.origins_list):
                raise ValueError("ALLOWED_ORIGINS no puede incluir localhost en produccion")
            if not self.log_hash_salt or len(self.log_hash_salt) < 32:
                raise ValueError("LOG_HASH_SALT debe tener al menos 32 caracteres en produccion")
        return self

    class Config:
        env_file = "../.env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
