"""
Student Tech Hub - Backend API
Built with Python and FastAPI

This file sets up a lightweight REST API for the Student Tech Hub.
It includes:
1. CORS middleware configuration (allows frontend to talk to backend)
2. GET /api/events endpoint returning technical events data
3. POST /api/register endpoint accepting student registrations
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Initialize FastAPI application
app = FastAPI(
    title="Student Tech Hub API",
    description="A beginner-friendly API providing events and registration for students.",
    version="1.0.0"
)

# -----------------------------------------------------------------------------
# CORS Configuration
# -----------------------------------------------------------------------------
# Cross-Origin Resource Sharing (CORS) is necessary because the frontend
# and backend usually run on different ports (e.g., frontend on 5500 or file://,
# and backend on 8000). Setting allow_origins to ["*"] allows local requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],            # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],            # Allows all headers
)

# -----------------------------------------------------------------------------
# Data Models (Pydantic)
# -----------------------------------------------------------------------------
class Event(BaseModel):
    id: int
    title: str
    category: str
    date: str
    time: str
    location: str
    description: str
    speaker: str

class StudentRegistration(BaseModel):
    name: str
    email: str
    event_id: Optional[int] = None
    event_title: Optional[str] = None

# -----------------------------------------------------------------------------
# In-Memory Sample Data (No complex database needed!)
# -----------------------------------------------------------------------------
SAMPLE_EVENTS = [
    {
        "id": 1,
        "title": "Intro to Web Development & APIs",
        "category": "Web Dev",
        "date": "October 15, 2026",
        "time": "4:00 PM - 6:00 PM",
        "location": "Tech Lab 201 & Online",
        "description": "Learn HTML, CSS, JavaScript, and how to connect frontends to Python REST APIs.",
        "speaker": "Sarah Jenkins (Full-Stack Engineer)"
    },
    {
        "id": 2,
        "title": "AI & Machine Learning Crash Course",
        "category": "Artificial Intelligence",
        "date": "October 22, 2026",
        "time": "5:30 PM - 7:30 PM",
        "location": "Auditorium Hall B",
        "description": "A hands-on overview of Python AI libraries, machine learning concepts, and practical prompts.",
        "speaker": "Dr. Alex Rivera (AI Researcher)"
    },
    {
        "id": 3,
        "title": "Annual Campus Hackathon 2026",
        "category": "Hackathon",
        "date": "November 5-6, 2026",
        "time": "Weekend (48 Hours)",
        "location": "Innovation Center",
        "description": "Form a team, build an innovative software project in 48 hours, and win prizes from industry sponsors.",
        "speaker": "Student Tech Hub Community"
    },
    {
        "id": 4,
        "title": "Cloud & DevOps Fundamentals",
        "category": "Cloud Computing",
        "date": "November 18, 2026",
        "time": "3:00 PM - 5:00 PM",
        "location": "Online via Zoom",
        "description": "Understand cloud infrastructure, Linux servers, and continuous deployment workflows.",
        "speaker": "Marcus Vance (DevOps Architect)"
    },
    {
        "id": 5,
        "title": "Open Source Contribution Workshop",
        "category": "Open Source",
        "date": "December 2, 2026",
        "time": "4:30 PM - 6:30 PM",
        "location": "Tech Lab 104",
        "description": "Learn Git, GitHub, branching, and make your very first open-source pull request with mentors.",
        "speaker": "Elena Rostova (Open Source Lead)"
    }
]

# Simple in-memory list to store received registrations during server runtime
registrations_db = []


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@app.get("/")
def read_root():
    """Welcome route / health check."""
    return {
        "message": "Welcome to the Student Tech Hub API!",
        "status": "healthy",
        "docs_url": "http://127.0.0.1:8000/docs",
        "endpoints": {
            "GET /api/events": "Fetch all upcoming technical events",
            "POST /api/register": "Register a student with name and email"
        }
    }


@app.get("/api/events")
def get_events():
    """
    Returns the list of upcoming technical events.
    Called by the frontend 'Load Events' button or on page load.
    """
    return {
        "success": True,
        "total": len(SAMPLE_EVENTS),
        "events": SAMPLE_EVENTS
    }


@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register_student(student: StudentRegistration):
    """
    Accepts a student's name and email, validates them, and stores the registration.
    """
    name_clean = student.name.strip()
    email_clean = student.email.strip()

    # Basic validation
    if not name_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student name is required."
        )

    if not email_clean or "@" not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required."
        )

    # Store registration in memory
    registration_record = {
        "id": len(registrations_db) + 1,
        "name": name_clean,
        "email": email_clean,
        "event_id": student.event_id,
        "event_title": student.event_title or "General Community Membership"
    }
    registrations_db.append(registration_record)

    return {
        "success": True,
        "message": f"Awesome, {name_clean}! You have successfully registered.",
        "registration": registration_record
    }


@app.get("/api/registrations")
def get_registrations():
    """
    Helper endpoint to inspect current in-memory registrations.
    """
    return {
        "count": len(registrations_db),
        "registrations": registrations_db
    }
