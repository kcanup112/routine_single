import uvicorn
import sys

if __name__ == "__main__":
    # Disable reload when running as executable (PyInstaller)
    is_executable = getattr(sys, 'frozen', False)
    reload_mode = False if is_executable else True
    
    # Use SaaS multi-tenant version
    uvicorn.run("app.main_saas:app", host="0.0.0.0", port=8000, reload=reload_mode)
