"""
Routine Scheduler - Multi-Tenant Unified Launcher
Starts both backend and frontend servers from a single executable
"""
import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path
import signal

def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    # When running as PyInstaller executable, use the directory containing the .exe
    # When running as script, use current directory
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        base_path = os.path.dirname(sys.executable)
    else:
        # Running as script
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

class ServerManager:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.running = True
        
    def start_backend(self):
        """Start the FastAPI backend server"""
        print("🚀 Starting Backend Server...")
        backend_dir = get_resource_path("backend")
        backend_exe = os.path.join(backend_dir, "KEC_Routine_Backend.exe")
        
        if os.path.exists(backend_exe):
            self.backend_process = subprocess.Popen(
                [backend_exe],
                cwd=backend_dir,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            print("✅ Backend server started on http://localhost:8000")
            return True
        else:
            print(f"❌ Backend executable not found: {backend_exe}")
            return False
    
    def start_frontend(self):
        """Start the frontend server using Python's HTTP server"""
        print("🚀 Starting Frontend Server...")
        frontend_dir = get_resource_path("frontend")
        
        if os.path.exists(frontend_dir):
            self.frontend_process = subprocess.Popen(
                [sys.executable, "-m", "http.server", "3000"],
                cwd=frontend_dir,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            print("✅ Frontend server started on http://localhost:3000")
            return True
        else:
            print(f"❌ Frontend directory not found: {frontend_dir}")
            return False
    
    def open_browser(self):
        """Open web browser to the application"""
        print("\n🌐 Opening browser...")
        time.sleep(2)  # Wait for servers to fully start
        webbrowser.open("http://localhost:3000")
    
    def stop_servers(self):
        """Stop both servers"""
        print("\n🛑 Stopping servers...")
        if self.backend_process:
            self.backend_process.terminate()
            print("✅ Backend stopped")
        if self.frontend_process:
            self.frontend_process.terminate()
            print("✅ Frontend stopped")
    
    def run(self):
        """Main execution"""
        print("=" * 60)
        print("   ROUTINE SCHEDULER")
        print("   Unified Application Launcher")
        print("=" * 60)
        print()
        
        # Start servers
        backend_started = self.start_backend()
        if not backend_started:
            print("\n❌ Failed to start backend server!")
            input("Press Enter to exit...")
            return
        
        time.sleep(2)  # Give backend time to start
        
        frontend_started = self.start_frontend()
        if not frontend_started:
            print("\n❌ Failed to start frontend server!")
            self.stop_servers()
            input("Press Enter to exit...")
            return
        
        # Open browser
        self.open_browser()
        
        print("\n" + "=" * 60)
        print("   APPLICATION RUNNING")
        print("=" * 60)
        print("\n📍 Access Points:")
        print("   • Main Application: http://localhost:3000")
        print("   • Backend API:      http://localhost:8000")
        print("   • API Docs:         http://localhost:8000/docs")
        print("\n⚠️  Keep this window open while using the application")
        print("   Press Ctrl+C to stop all servers and exit")
        print("=" * 60)
        print()
        
        # Keep running until interrupted
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n⚠️  Shutdown requested...")
        finally:
            self.stop_servers()
            print("\n✅ Application closed successfully")
            print("\nPress Enter to exit...")
            input()

def main():
    manager = ServerManager()
    manager.run()

if __name__ == "__main__":
    main()
