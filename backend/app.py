from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.models import db
from backend.routes.api import api_bp
import os

def create_app(config_class=Config):
app = Flask(**name**)
app.config.from_object(config_class)

```
# Initialize extensions  
db.init_app(app)  
CORS(app)  # Enable CORS for all routes  

# Register API blueprint  
app.register_blueprint(api_bp, url_prefix='/api')  

# Ensure upload folder exists  
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)  

# Health check route  
@app.route('/health', methods=['GET'])  
def health_check():  
    return jsonify({"status": "healthy", "message": "AI Resume API is running."}), 200  

# Create tables if they don't exist  
with app.app_context():  
    db.create_all()  

return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
