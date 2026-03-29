# Quick Start Guide

## Running the Application

### Option 1: Using VS Code Tasks (Recommended)

1. Open VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Tasks: Run Task"
3. Select "Run Full Stack" to run both frontend and backend simultaneously

Or run them individually:
- "Run Backend Server" - Starts FastAPI on port 8000
- "Run Frontend Server" - Starts React on port 3000

### Option 2: Manual Terminal Commands

#### Backend
```powershell
cd backend
"C:/Users/Anup kc/Documents/kecRoutine/.venv/Scripts/python.exe" run.py
```

Backend will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

#### Frontend
```powershell
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

## First Steps

1. **Start both servers** using the VS Code task or manual commands
2. **Open your browser** to http://localhost:3000
3. **Add a Department**:
   - Navigate to Departments
   - Click "Add Department"
   - Fill in name (e.g., "Computer Engineering") and code (e.g., "CE")
4. **Add Teachers**:
   - Navigate to Teachers
   - Click "Add Teacher"
   - Fill in teacher details and select department
5. **Add Subjects**:
   - Navigate to Subjects
   - Click "Add Subject"
   - Fill in subject details (name, code, credit hours)
6. **View the Dashboard** for an overview

## API Testing

You can test the API directly using:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Example API calls:
```bash
# Get all departments
curl http://localhost:8000/api/departments

# Create a department
curl -X POST http://localhost:8000/api/departments \
  -H "Content-Type: application/json" \
  -d '{"name": "Computer Engineering", "code": "CE"}'
```

## Database

The SQLite database will be created automatically at:
`backend/kec_routine.db`

To reset the database, simply delete this file and restart the backend.

## Troubleshooting

### Backend Issues
- **Import errors**: Ensure all packages are installed: `pip install -r requirements.txt`
- **Port already in use**: Change the port in `backend/run.py`
- **Database errors**: Delete `kec_routine.db` and restart

### Frontend Issues
- **Dependencies not found**: Run `npm install` in the frontend directory
- **Port already in use**: Change the port in `frontend/vite.config.js`
- **API connection errors**: Ensure backend is running on port 8000

## Development Tips

- Backend auto-reloads on file changes (uvicorn --reload)
- Frontend auto-reloads on file changes (Vite HMR)
- Use the API docs at /docs to test endpoints
- Check browser console for frontend errors
- Check terminal for backend errors

## Next Steps

- Extend the Class and Schedule pages
- Add more features like:
  - Schedule conflict detection
  - PDF export
  - User authentication
  - Advanced reporting
