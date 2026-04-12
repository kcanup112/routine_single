import os
from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Routine Scheduler SaaS"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://kec_admin:change_me_in_production@localhost:5432/kec_routine_saas"
    
    # Redis
    REDIS_URL: str = "redis://:redis_password@localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # CORS - can be string (comma-separated) or list
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8000,http://kec.localhost:3000,http://*.localhost:3000"
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@yourapp.com"
    
    # Subscription
    TRIAL_DAYS: int = 14
    GRACE_PERIOD_DAYS: int = 7
    
    # Payment
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    KHALTI_SECRET_KEY: str = ""
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS as list"""
        if isinstance(self.ALLOWED_ORIGINS, str):
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(',')]
        return self.ALLOWED_ORIGINS
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
