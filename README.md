# Routine Scheduler - Multi-Tenant SaaS

A modern full-stack application for managing class schedules, teachers, subjects, and departments at educational institutions.

## Technology Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **Pydantic**: Data validation using Python type annotations
- **SQLite**: Database (easily switchable to PostgreSQL)
- **Uvicorn**: ASGI server

### Frontend
- **React**: UI library
- **Material-UI (MUI)**: React component library
- **React Router**: Navigation
- **Axios**: HTTP client
- **Vite**: Build tool

## Project Structure

```
kec-routine-scheduler/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/         # API endpoints
│   │   ├── core/               # Config & database
│   │   ├── models/             # Database models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   └── main.py            # FastAPI app
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```powershell
cd backend
```

2. Create a virtual environment:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

3. Install dependencies:
```powershell
pip install -r requirements.txt
```

4. Create a `.env` file (copy from `.env.example`):
```powershell
copy .env.example .env
```

5. Run the backend server:
```powershell
python run.py
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
```powershell
cd frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Start the development server:
```powershell
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Features

### Current Features
- ✅ Department management (CRUD)
- ✅ Teacher management (CRUD)
- ✅ Subject management (CRUD)
- ✅ Class management (CRUD)
- ✅ Schedule management
- ✅ Responsive UI with Material-UI
- ✅ RESTful API with FastAPI
- ✅ Database models with SQLAlchemy

### Upcoming Features
- 🔄 Advanced schedule generation
- 🔄 Conflict detection
- 🔄 PDF export for schedules
- 🔄 User authentication
- 🔄 Role-based access control

## API Endpoints

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create a department
- `GET /api/departments/{id}` - Get department by ID
- `PUT /api/departments/{id}` - Update department
- `DELETE /api/departments/{id}` - Delete department

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create a teacher
- `GET /api/teachers/{id}` - Get teacher by ID
- `PUT /api/teachers/{id}` - Update teacher
- `DELETE /api/teachers/{id}` - Delete teacher

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create a subject
- `GET /api/subjects/{id}` - Get subject by ID
- `PUT /api/subjects/{id}` - Update subject
- `DELETE /api/subjects/{id}` - Delete subject

### Schedules
- `GET /api/schedules` - Get all schedules
- `POST /api/schedules` - Create a schedule
- `GET /api/schedules/class/{id}` - Get schedule by class
- `GET /api/schedules/teacher/{id}` - Get schedule by teacher
- `DELETE /api/schedules/{id}` - Delete schedule

## Development

### Running Tests
```powershell
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production

#### Backend
```powershell
cd backend
# Set production environment variables
# Deploy using gunicorn or similar ASGI server
```

#### Frontend
```powershell
cd frontend
npm run build
# Deploy the dist/ folder to a web server
```

## Database Migration

The application uses Alembic for database migrations (optional):

```powershell
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
