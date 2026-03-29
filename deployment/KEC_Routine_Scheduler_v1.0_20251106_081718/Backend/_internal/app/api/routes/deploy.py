from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import os

router = APIRouter()

class DeployData(BaseModel):
    classes: List[Dict[str, Any]]
    subjects: List[Dict[str, Any]]
    teachers: List[Dict[str, Any]]
    routines: List[Dict[str, Any]]
    days: List[Dict[str, Any]]
    periods: List[Dict[str, Any]]
    programmes: List[Dict[str, Any]]
    semesters: List[Dict[str, Any]]

@router.post("/static-page")
async def deploy_static_page(data: DeployData):
    try:
        # Create deploy directory if it doesn't exist
        deploy_dir = os.path.join(os.path.dirname(__file__), '../../../deploy')
        os.makedirs(deploy_dir, exist_ok=True)
        
        # Save data as JSON for the static server
        data_file = os.path.join(deploy_dir, 'routine_data.json')
        with open(data_file, 'w') as f:
            json.dump(data.dict(), f, indent=2, default=str)
        
        # Create the HTML file
        html_content = generate_html_page()
        html_file = os.path.join(deploy_dir, 'index.html')
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return {
            "success": True,
            "message": "Static page deployed successfully",
            "url": "http://localhost:3001"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_html_page():
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KEC Class Routine - Student View</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            background: #FBF3D1;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
        }
        
        .header {
            background: #C5C7BC;
            color: #333;
            padding: 30px;
            text-align: center;
            border-bottom: 4px solid #DEDED1;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .header p {
            font-size: 1.1em;
            font-weight: 600;
            color: #555;
        }
        
        .controls {
            padding: 20px 30px;
            background: #FBF3D1;
            border-bottom: 3px solid #DEDED1;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .control-group label {
            font-size: 0.85em;
            color: #333;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        select {
            padding: 10px 15px;
            border: 2px solid #C5C7BC;
            border-radius: 8px;
            font-size: 1em;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            background: white;
            cursor: pointer;
            min-width: 200px;
            transition: all 0.3s;
        }
        
        select:hover {
            border-color: #333;
        }
        
        select:focus {
            outline: none;
            border-color: #333;
        }
        
        .routine-container {
            padding: 30px;
            overflow-x: auto;
            background: white;
        }
        
        .no-routine {
            text-align: center;
            padding: 60px 20px;
            color: #666;
            font-size: 1.2em;
            font-weight: 600;
        }
        
        .class-info {
            background: #FBF3D1;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 2px solid #DEDED1;
        }
        
        .class-info h2 {
            color: #333;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .class-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 10px;
        }
        
        .info-item {
            background: white;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #DEDED1;
        }
        
        .info-item strong {
            color: #333;
            display: block;
            margin-bottom: 5px;
            font-size: 0.85em;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-item div {
            color: #555;
            font-weight: 600;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
        }
        
        th {
            background: #C5C7BC;
            color: #333;
            padding: 15px 10px;
            text-align: center;
            font-weight: 700;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 12px 10px;
            border: 2px solid #DEDED1;
            text-align: center;
            font-size: 0.85em;
        }
        
        tbody tr:nth-child(even) {
            background: #FBF3D1;
        }
        
        tbody tr:hover {
            background: #DEDED1;
        }
        
        .day-cell {
            background: #C5C7BC;
            color: #333;
            font-weight: 700;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .subject-cell {
            background: white;
            min-height: 80px;
        }
        
        .subject-name {
            font-weight: 700;
            color: #333;
            margin-bottom: 5px;
            font-size: 0.95em;
        }
        
        .subject-code {
            color: #666;
            font-size: 0.8em;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .teacher-name {
            color: #555;
            font-size: 0.8em;
            font-weight: 600;
        }
        
        .room-info {
            color: #666;
            font-size: 0.75em;
            margin-top: 3px;
            font-weight: 600;
        }
        
        .lab-session {
            background: #E8F4F8 !important;
            border: 2px solid #5DADE2;
        }
        
        .lab-badge {
            display: inline-block;
            background: #5DADE2;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.7em;
            font-weight: 700;
            margin-top: 3px;
            letter-spacing: 0.5px;
        }
        
        .multi-lab-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .lab-subject-item {
            padding: 8px;
            background: rgba(93, 173, 226, 0.1);
            border-radius: 4px;
            border: 1px solid #DEDED1;
        }
        
        .lab-subject-item:not(:last-child) {
            border-bottom: 1px solid #DEDED1;
            padding-bottom: 10px;
        }
        
        .break-cell {
            background: #FFF9E6 !important;
            color: #856404;
            font-weight: 700;
            font-size: 0.9em;
            border: 2px solid #FFC107;
        }
        
        .lc-cell {
            background: #E8F4F8 !important;
            color: #0c5460;
            font-weight: 700;
            font-size: 0.9em;
            border: 2px solid #17A2B8;
        }
        
        .footer {
            background: #FBF3D1;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 3px solid #DEDED1;
            font-weight: 600;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            font-size: 1.2em;
            color: #333;
            font-weight: 700;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .controls, .footer {
                display: none;
            }
            
            .container {
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Kantipur Engineering College</h1>
            <p>Class Routine - Student View</p>
        </div>
        
        <div class="controls">
            <div class="control-group">
                <label for="programmeSelect">Programme</label>
                <select id="programmeSelect">
                    <option value="">Select Programme</option>
                </select>
            </div>
            
            <div class="control-group">
                <label for="semesterSelect">Year/Part</label>
                <select id="semesterSelect" disabled>
                    <option value="">Select Year/Part</option>
                </select>
            </div>
            
            <div class="control-group">
                <label for="classSelect">Class</label>
                <select id="classSelect" disabled>
                    <option value="">Select Class</option>
                </select>
            </div>
        </div>
        
        <div class="routine-container">
            <div id="loadingMessage" class="loading">
                Loading routine data...
            </div>
            <div id="routineContent" style="display: none;"></div>
        </div>
        
        <div class="footer">
            <p style="margin-top: 5px; font-size: 0.85em;">Last updated: <span id="lastUpdated"></span></p>
        </div>
    </div>
    
    <script>
        let allData = null;
        
        // Load routine data
        async function loadData() {
            try {
                const response = await fetch('/data');
                allData = await response.json();
                
                document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
                document.getElementById('loadingMessage').style.display = 'none';
                
                populateProgrammes();
            } catch (error) {
                console.error('Error loading data:', error);
                document.getElementById('loadingMessage').innerHTML = 
                    '<p style="color: red;">Failed to load routine data. Please refresh the page.</p>';
            }
        }
        
        function populateProgrammes() {
            const programmeSelect = document.getElementById('programmeSelect');
            const uniqueProgrammes = new Map();
            
            console.log('All data:', allData);
            console.log('Classes:', allData.classes);
            
            // Get unique programmes from classes
            allData.classes.forEach(cls => {
                console.log('Class:', cls);
                if (cls.programme_id && !uniqueProgrammes.has(cls.programme_id)) {
                    uniqueProgrammes.set(cls.programme_id, cls.programme_name || cls.programme_code);
                }
            });
            
            console.log('Unique programmes:', uniqueProgrammes);
            
            if (uniqueProgrammes.size === 0) {
                console.error('No programmes found in class data');
                document.getElementById('loadingMessage').innerHTML = 
                    '<p style="color: red;">No programmes found. Please deploy again from admin panel.</p>';
                document.getElementById('loadingMessage').style.display = 'block';
                return;
            }
            
            uniqueProgrammes.forEach((name, id) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                programmeSelect.appendChild(option);
            });
        }
        
        document.getElementById('programmeSelect').addEventListener('change', function(e) {
            const programmeId = parseInt(e.target.value);
            const semesterSelect = document.getElementById('semesterSelect');
            const classSelect = document.getElementById('classSelect');
            
            // Reset dependent selects
            semesterSelect.innerHTML = '<option value="">Select Year/Part</option>';
            classSelect.innerHTML = '<option value="">Select Class</option>';
            semesterSelect.disabled = true;
            classSelect.disabled = true;
            document.getElementById('routineContent').style.display = 'none';
            
            if (!programmeId) return;
            
            // Get unique semesters for this programme
            const uniqueSemesters = new Map();
            allData.classes
                .filter(cls => cls.programme_id === programmeId)
                .forEach(cls => {
                    if (cls.semester_id && !uniqueSemesters.has(cls.semester_id)) {
                        uniqueSemesters.set(cls.semester_id, cls.semester_name);
                    }
                });
            
            uniqueSemesters.forEach((name, id) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                semesterSelect.appendChild(option);
            });
            
            semesterSelect.disabled = false;
        });
        
        document.getElementById('semesterSelect').addEventListener('change', function(e) {
            const programmeId = parseInt(document.getElementById('programmeSelect').value);
            const semesterId = parseInt(e.target.value);
            const classSelect = document.getElementById('classSelect');
            
            classSelect.innerHTML = '<option value="">Select Class</option>';
            classSelect.disabled = true;
            document.getElementById('routineContent').style.display = 'none';
            
            if (!semesterId) return;
            
            // Get classes for this programme and semester
            const classes = allData.classes.filter(cls => 
                cls.programme_id === programmeId && cls.semester_id === semesterId
            );
            
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.id;
                option.textContent = cls.name;
                classSelect.appendChild(option);
            });
            
            classSelect.disabled = false;
        });
        
        document.getElementById('classSelect').addEventListener('change', function(e) {
            const classId = parseInt(e.target.value);
            
            if (!classId) {
                document.getElementById('routineContent').style.display = 'none';
                return;
            }
            
            displayRoutine(classId);
        });
        
        function displayRoutine(classId) {
            const selectedClass = allData.classes.find(c => c.id === classId);
            if (!selectedClass) return;
            
            // Get routines for this class
            const classRoutines = allData.routines.filter(r => r.class_id === classId);
            
            // Build routine grid
            const routineGrid = {};
            classRoutines.forEach(routine => {
                const key = `${routine.day_id}-${routine.period_id}`;
                routineGrid[key] = routine;
            });
            
            // Generate HTML
            let html = `
                <div class="class-info">
                    <h2>${selectedClass.name}</h2>
                    <div class="class-info-grid">
                        <div class="info-item">
                            <strong>Programme</strong>
                            ${selectedClass.programme_name || selectedClass.programme_code}
                        </div>
                        <div class="info-item">
                            <strong>Year/Part</strong>
                            ${selectedClass.semester_name}
                        </div>
                        <div class="info-item">
                            <strong>Room</strong>
                            ${selectedClass.room_no || 'N/A'}
                        </div>
                        <div class="info-item">
                            <strong>Section</strong>
                            ${selectedClass.section || 'N/A'}
                        </div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Days \\ Time</th>
            `;
            
            // Add period headers
            allData.periods.forEach(period => {
                html += `<th>${period.start_time.substring(0, 5)} - ${period.end_time.substring(0, 5)}</th>`;
            });
            
            html += `
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            // Add rows for each day
            allData.days.forEach(day => {
                html += `<tr><td class="day-cell">${day.name}</td>`;
                
                const renderedPeriods = new Set();
                
                allData.periods.forEach((period, periodIndex) => {
                    // Skip if this period was already rendered as part of a multi-period cell
                    if (renderedPeriods.has(period.id)) {
                        return;
                    }
                    
                    const key = `${day.id}-${period.id}`;
                    const routine = routineGrid[key];
                    
                    if (routine) {
                        const subject = allData.subjects.find(s => s.id === routine.subject_id);
                        const teacher = allData.teachers.find(t => t.id === routine.lead_teacher_id);
                        const numPeriods = routine.num_periods || 1;
                        const colspan = numPeriods > 1 ? ` colspan="${numPeriods}"` : '';
                        
                        // Mark the periods as rendered
                        for (let i = 0; i < numPeriods; i++) {
                            const nextPeriod = allData.periods[periodIndex + i];
                            if (nextPeriod) {
                                renderedPeriods.add(nextPeriod.id);
                            }
                        }
                        
                        if (routine.subject_code === 'BREAK') {
                            html += `<td class="break-cell"${colspan}>Break</td>`;
                        } else if (routine.subject_code === 'LC') {
                            html += `<td class="lc-cell"${colspan}>Library Consultation</td>`;
                        } else {
                            const isLab = routine.is_lab || false;
                            const labClass = isLab ? ' lab-session' : '';
                            
                            // Check if this is a multi-subject lab
                            const isMultiSubjectLab = routine.lab_subjects && Array.isArray(routine.lab_subjects) && routine.lab_subjects.length > 0;
                            
                            html += `<td class="subject-cell${labClass}"${colspan}>`;
                            
                            if (isMultiSubjectLab) {
                                // Render multiple lab subjects
                                html += `<div class="multi-lab-container">`;
                                routine.lab_subjects.forEach((labSubject, index) => {
                                    const labSubjectData = allData.subjects.find(s => s.id === labSubject.subject_id);
                                    const labTeacher = allData.teachers.find(t => t.id === labSubject.lead_teacher_id);
                                    const labAssist1 = allData.teachers.find(t => t.id === labSubject.assist_teacher_1_id);
                                    const labAssist2 = allData.teachers.find(t => t.id === labSubject.assist_teacher_2_id);
                                    
                                    html += `<div class="lab-subject-item">`;
                                    html += `<div class="subject-name">${labSubject.subject_name || labSubjectData?.name || 'N/A'}</div>`;
                                    html += `<div class="subject-code">${labSubjectData?.code || ''}</div>`;
                                    
                                    // Build teacher string
                                    const teachers = [labTeacher, labAssist1, labAssist2]
                                        .filter(t => t)
                                        .map(t => t.abbreviation || t.name)
                                        .join(' + ');
                                    
                                    if (teachers) {
                                        html += `<div class="teacher-name">${teachers}</div>`;
                                    }
                                    
                                    if (labSubject.lab_room) {
                                        html += `<div class="room-info">${labSubject.lab_room}`;
                                        if (labSubject.group) {
                                            html += ` - ${labSubject.group}`;
                                        }
                                        html += `</div>`;
                                    }
                                    
                                    html += `<div class="lab-badge">LAB</div>`;
                                    html += `</div>`;
                                });
                                html += `</div>`;
                            } else {
                                // Render single subject
                                html += `<div class="subject-name">${routine.subject_name || subject?.name || 'N/A'}</div>`;
                                html += `<div class="subject-code">${routine.subject_code || subject?.code || ''}</div>`;
                                
                                if (teacher) {
                                    html += `<div class="teacher-name">${teacher.abbreviation || teacher.name}</div>`;
                                }
                                
                                if (routine.room_no) {
                                    html += `<div class="room-info">${routine.room_no}</div>`;
                                }
                                
                                if (isLab) {
                                    html += `<div class="lab-badge">LAB</div>`;
                                }
                            }
                            
                            html += `</td>`;
                        }
                    } else {
                        html += `<td class="subject-cell"></td>`;
                    }
                });
                
                html += `</tr>`;
            });
            
            html += `
                    </tbody>
                </table>
            `;
            
            document.getElementById('routineContent').innerHTML = html;
            document.getElementById('routineContent').style.display = 'block';
        }
        
        // Load data on page load
        loadData();
    </script>
</body>
</html>
"""
