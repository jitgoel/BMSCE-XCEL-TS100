from flask import Blueprint, request, jsonify, current_app
import os

api_bp = Blueprint('api', __name__)

@api_bp.route('/upload', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith(('.pdf', '.docx')):
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        # Here we will later call the parsing service
        return jsonify({
            "message": "File uploaded successfully",
            "filename": file.filename,
            "parsed_preview": {"skills": ["Python", "Flask"], "experience": []} # Mock response for now
        }), 200
        
    return jsonify({"error": "Invalid file type. Only PDF and DOCX are allowed."}), 400

@api_bp.route('/analyze', methods=['POST'])
def analyze_resume():
    data = request.json
    # Expected data: {"resume_id": 123, "job_description": "We need a Python developer..."}
    # Here we will later call the Scoring and RAG matching engine
    
    return jsonify({
        "status": "success",
        "ats_score": 85,
        "match_percentage": 90,
        "missing_skills": ["Docker", "AWS"],
        "feedback": "Your resume is a strong match, but lacks cloud experience."
    }), 200

@api_bp.route('/cover-letter', methods=['POST'])
def generate_cover_letter():
    data = request.json
    # Expected data: {"resume_id": 123, "job_description": "We need a Python developer..."}
    
    # Here we will call LangChain LLM
    mock_letter = "Dear Hiring Manager,\n\nI am excited to apply for this role..."
    
    return jsonify({
        "status": "success",
        "cover_letter": mock_letter
    }), 200

@api_bp.route('/analytics', methods=['GET'])
def get_analytics():
    # Return mock analytics data for the dashboard
    return jsonify({
        "total_analyzed": 150,
        "average_score": 72.5,
        "top_missing_skills": ["AWS", "Kubernetes", "React", "TypeScript", "CI/CD"],
        "trend_data": [60, 65, 68, 75, 80],
        "trend_labels": ["Jan", "Feb", "Mar", "Apr", "May"]
    }), 200
