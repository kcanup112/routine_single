=====================================
KEC ROUTINE SCHEDULER - DEPLOYMENT
=====================================

Version: 1.0
Build Date: 2025-11-06 08:17:48

=====================================
QUICK START
=====================================

1. Double-click "START_ALL.bat" to start both backend and frontend servers

2. Open your web browser and go to:
   http://localhost:3000

3. To stop the servers, double-click "STOP_ALL.bat"

=====================================
MANUAL START
=====================================

If you want to start servers individually:

1. Backend Server:
   - Double-click "START_BACKEND.bat"
   - API will be available at http://localhost:8000

2. Frontend Server:
   - Double-click "START_FRONTEND.bat"
   - Application will be available at http://localhost:3000

=====================================
SYSTEM REQUIREMENTS
=====================================

- Windows 10 or higher
- 2 GB RAM minimum (4 GB recommended)
- 100 MB disk space
- Python 3.x (for frontend HTTP server)

=====================================
PORTS USED
=====================================

- Backend API: 8000
- Frontend: 3000
- Student View: 3001

Make sure these ports are not in use by other applications.

=====================================
TROUBLESHOOTING
=====================================

Problem: "Port already in use" error
Solution: Close any applications using ports 8000, 3000, or 3001
         Or change ports in the .env file (Backend folder)

Problem: Backend won't start
Solution: Make sure kec_routine.db is in the Backend folder
         Check Windows Firewall settings

Problem: Frontend shows blank page
Solution: Make sure Backend is running first
         Clear browser cache and refresh

=====================================
FEATURES
=====================================

- Create and manage class routines
- Assign teachers and subjects
- Multi-subject lab support
- Teacher conflict detection
- Export to Excel (day-wise, class-wise)
- Student view deployment
- Drag-and-drop scheduling

=====================================
SUPPORT
=====================================

For support or questions, contact your system administrator.

Database Location: Backend\kec_routine.db
Logs: Check the Backend folder for error logs

=====================================
