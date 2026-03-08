from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    resumes = db.relationship('Resume', backref='user', lazy=True)
    job_descriptions = db.relationship('JobDescription', backref='user', lazy=True)

class Resume(db.Model):
    __tablename__ = 'resumes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filepath = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    ats_score = db.Column(db.Float, nullable=True)
    parsed_data = db.Column(db.JSON, nullable=True) # JSON containing structured resume data
    
    analyses = db.relationship('AnalysisHistory', backref='resume', lazy=True)

class JobDescription(db.Model):
    __tablename__ = 'job_descriptions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    job_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Embedding typically managed in Chroma, but we can store ID reference here
    vector_id = db.Column(db.String(255), nullable=True)

    analyses = db.relationship('AnalysisHistory', backref='job_description', lazy=True)

class AnalysisHistory(db.Model):
    __tablename__ = 'analysis_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('job_descriptions.id'), nullable=False)
    analyzed_on = db.Column(db.DateTime, default=datetime.utcnow)
    match_score = db.Column(db.Float, nullable=True)
    missing_skills = db.Column(db.JSON, nullable=True) # List of missing skills
    ai_feedback = db.Column(db.Text, nullable=True)
