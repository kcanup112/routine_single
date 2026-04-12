import uvicorn
import sys
import os

if __name__ == "__main__":
    # Disable reload when running as executable (PyInstaller)
    is_executable = getattr(sys, 'frozen', False)
    is_dev = os.environ.get("ENVIRONMENT", "development") == "development" and not is_executable
    
    # Use multiple workers in production for better throughput
    workers = 1 if is_dev else int(os.environ.get("WEB_CONCURRENCY", 4))
    reload_mode = is_dev
    
    # Use SaaS multi-tenant version
    uvicorn.run(
        "app.main_saas:app",
        host="0.0.0.0",
        port=8000,
        reload=reload_mode,
        workers=workers,
    )
