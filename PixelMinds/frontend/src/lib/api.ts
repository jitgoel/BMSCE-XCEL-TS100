const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadResume(
    file: File,
    onProgress?: (progress: number) => void
): Promise<{ candidate_id: string; parsed_data: Record<string, unknown> }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable && onProgress) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.detail || "Upload failed"));
                    }
                } catch {
                    reject(new Error("Invalid response from server"));
                }
            } else {
                try {
                    const errData = JSON.parse(xhr.responseText);
                    reject(new Error(errData.detail || `Upload failed (${xhr.status})`));
                } catch {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Network error — could not reach server"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload was cancelled"));
        });

        xhr.open("POST", `${API_BASE}/api/resume/upload`);
        xhr.send(formData);
    });
}

export async function getCandidateData(
    candidateId: string
): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/resume/${candidateId}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to fetch candidate data");
    }
    return res.json();
}

export async function submitOnboarding(
    candidateId: string,
    answers: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/onboarding/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, answers }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to submit onboarding");
    }
    return res.json();
}

// ─── AI Interview Endpoints ─────────────────────────────────

export async function startInterview(
    candidateId: string,
    jobRole: string,
    technicalFirst: boolean = true
): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            candidate_id: candidateId,
            job_role: jobRole,
            technical_first: technicalFirst
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to start interview");
    }
    return res.json();
}

export async function answerInterview(
    sessionId: string,
    answer: string
): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/interview/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answer }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to submit answer");
    }
    return res.json();
}

export async function getInterviewSession(
    sessionId: string
): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/api/interview/session/${sessionId}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to fetch interview session");
    }
    return res.json();
}
