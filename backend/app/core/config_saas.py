import os
from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Routine Scheduler"
    VERSION: str = "3.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Institution
    INSTITUTION_TYPE: str = "engineering"  # "engineering" or "school"
    
    # Database
    DATABASE_URL: str = "postgresql://kec_admin:change_me_in_production@localhost:5432/kec_routine"
    
    # Redis
    REDIS_URL: str = "redis://:redis_password@localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # CORS - can be string (comma-separated) or list
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8000"
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@yourapp.com"
    
    # Resend
    RESEND_API_KEY: str = ""
    
    # SMTP2GO
    MAIL_API_KEY: str = ""
    
    # Web Push (VAPID)
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_CLAIM_EMAIL: str = "mailto:admin@kec.edu.np"
    
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
