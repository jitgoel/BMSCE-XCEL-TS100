"use client";

import React, { useState, useRef, useCallback } from "react";
import { uploadResume } from "@/lib/api";
import { useCandidate } from "@/context/CandidateContext";
import { useToast } from "@/components/Toast";

const ACCEPTED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

type UploadState = "idle" | "uploading" | "parsing" | "done" | "error";

interface ResumeUploadProps {
    onComplete: () => void;
}

export default function ResumeUpload({ onComplete }: ResumeUploadProps) {
    const [dragOver, setDragOver] = useState(false);
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState("");
    const [fileSize, setFileSize] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setCandidateId, setParsedData } = useCandidate();
    const { showToast } = useToast();

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const validateFile = (file: File): boolean => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(ext)) {
            showToast("Invalid file type. Please upload a PDF, DOC, or DOCX file.", "error");
            return false;
        }
        if (file.size > MAX_SIZE) {
            showToast("File is too large. Maximum size is 10MB.", "error");
            return false;
        }
        return true;
    };

    const handleUpload = useCallback(
        async (file: File) => {
            if (!validateFile(file)) return;

            setFileName(file.name);
            setFileSize(formatFileSize(file.size));
            setUploadState("uploading");
            setProgress(0);

            try {
                const result = await uploadResume(file, (pct) => {
                    setProgress(pct);
                    if (pct >= 100) {
                        setUploadState("parsing");
                    }
                });

                setCandidateId(result.candidate_id);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setParsedData(result.parsed_data as any);
                setUploadState("done");
                showToast("Resume parsed successfully!", "success");

                // Brief delay to show success state before transitioning
                setTimeout(() => {
                    onComplete();
                }, 1200);
            } catch (err) {
                setUploadState("error");
                showToast(
                    err instanceof Error ? err.message : "Upload failed. Please try again.",
                    "error"
                );
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [setCandidateId, setParsedData, showToast, onComplete]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleUpload(file);
        },
        [handleUpload]
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
        },
        [handleUpload]
    );

    const resetUpload = () => {
        setUploadState("idle");
        setProgress(0);
        setFileName("");
        setFileSize("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            {/* Header */}
            <div className="text-center mb-12 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-accent)] bg-violet-500/5 mb-6">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-sm text-violet-300 font-medium">
                        AI-Powered Resume Analysis
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                    Welcome to{" "}
                    <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Pixelmind
                    </span>
                </h1>
                <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto">
                    Upload your resume to get started. Our AI will extract and structure your profile instantly.
                </p>
            </div>

            {/* Upload Zone */}
            <div
                className={`upload-zone w-full max-w-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 animate-fade-in-up ${dragOver ? "drag-over" : ""
                    } ${uploadState !== "idle" ? "pointer-events-none" : ""}`}
                style={{ animationDelay: "0.15s" }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => uploadState === "idle" && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="resume-upload-input"
                />

                {uploadState === "idle" && (
                    <div className="flex flex-col items-center gap-5">
                        {/* Upload Icon */}
                        <div className={`relative ${dragOver ? "animate-float" : ""}`}>
                            <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-violet-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                    />
                                </svg>
                            </div>
                            {dragOver && (
                                <div className="absolute inset-0 rounded-2xl animate-pulse-glow" />
                            )}
                        </div>

                        <div className="text-center">
                            <p className="text-lg font-medium text-[var(--text-primary)] mb-1">
                                {dragOver ? "Drop your resume here" : "Drag & drop your resume"}
                            </p>
                            <p className="text-sm text-[var(--text-muted)]">
                                or{" "}
                                <span className="text-violet-400 font-medium cursor-pointer hover:underline">
                                    browse files
                                </span>
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)]">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                PDF
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)]">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                DOC
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)]">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                DOCX
                            </span>
                            <span className="text-[var(--text-muted)]">Max 10MB</span>
                        </div>
                    </div>
                )}

                {/* Uploading State */}
                {uploadState === "uploading" && (
                    <div className="w-full flex flex-col items-center gap-5 animate-fade-in">
                        <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <svg
                                className="w-7 h-7 text-violet-400 animate-spin-slow"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-[var(--text-primary)]">Uploading{"\u2026"}</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                {fileName} · {fileSize}
                            </p>
                        </div>
                        <div className="w-full max-w-sm">
                            <div className="progress-track">
                                <div className="progress-bar h-full" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] text-center mt-2">
                                {progress}%
                            </p>
                        </div>
                    </div>
                )}

                {/* Parsing State */}
                {uploadState === "parsing" && (
                    <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
                        <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <svg
                                className="w-7 h-7 text-violet-400 animate-spin-slow"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 16.5m14.8-1.2s.933.693 1.2 1.2M5 16.5l-.8.4M5 16.5l.933.693M19.8 15.3l.2.1"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-[var(--text-primary)]">
                                Parsing resume{"\u2026"}
                            </p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                AI is extracting your profile data
                            </p>
                        </div>
                        {/* Skeleton loader */}
                        <div className="w-full max-w-sm space-y-3">
                            <div className="skeleton h-4 w-3/4 mx-auto" />
                            <div className="skeleton h-4 w-full" />
                            <div className="skeleton h-4 w-5/6 mx-auto" />
                            <div className="flex gap-2 justify-center mt-4">
                                <div className="skeleton h-7 w-16 rounded-full" />
                                <div className="skeleton h-7 w-20 rounded-full" />
                                <div className="skeleton h-7 w-14 rounded-full" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Done State */}
                {uploadState === "done" && (
                    <div className="flex flex-col items-center gap-4 animate-scale-in">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 50, animation: "checkmark 0.4s ease-out 0.2s forwards", strokeDashoffset: 50 }} />
                            </svg>
                        </div>
                        <p className="font-medium text-emerald-400">Resume parsed successfully!</p>
                        <p className="text-sm text-[var(--text-muted)]">{fileName}</p>
                    </div>
                )}

                {/* Error State */}
                {uploadState === "error" && (
                    <div className="flex flex-col items-center gap-4 animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="font-medium text-red-400">Upload failed</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                resetUpload();
                            }}
                            className="btn-secondary text-sm px-6 py-2 mt-2 pointer-events-auto"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            {uploadState === "idle" && (
                <p
                    className="mt-8 text-xs text-[var(--text-muted)] animate-fade-in-up"
                    style={{ animationDelay: "0.3s" }}
                >
                    Your data is processed securely and never shared
                </p>
            )}
        </div>
    );
}
