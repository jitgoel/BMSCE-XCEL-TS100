import { useRef, useState } from "react";
import axios from "axios";

function ResumeUpload({ setResult }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const uploadResume = async (file) => {
    if (!file) {
      return;
    }

    setError("");
    setUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("http://localhost:8000/analyze", formData);
      setResult(response.data);
    } catch (err) {
      setError("Upload failed. Please check your backend and try again.");
      setResult(null);
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    uploadResume(file);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    uploadResume(file);
  };

  return (
    <section className="upload-card">
      <p className="upload-title">Analyze Your Resume</p>
      <p className="upload-subtitle">Drag and drop your file here or upload from device.</p>

      <div
        className={`dropzone ${dragActive ? "active" : ""}`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <div className="upload-icon">UP</div>
        <p>PDF / DOC / DOCX</p>
        <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()}>
          {uploading ? "Analyzing..." : "Upload Resume"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={onFileChange}
          hidden
        />
      </div>

      {fileName && <p className="file-name">Selected: {fileName}</p>}
      {error && <p className="upload-error">{error}</p>}
    </section>
  );
}

export default ResumeUpload;
