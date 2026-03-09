"use client";

import React from "react";
import { useCandidate, ParsedData } from "@/context/CandidateContext";

interface ResumePreviewProps {
    onContinue: () => void;
}

export default function ResumePreview({ onContinue }: ResumePreviewProps) {
    const { parsedData } = useCandidate();

    if (!parsedData) return null;

    const data = parsedData as ParsedData;

    return (
        <div className="min-h-screen flex flex-col items-center px-6 py-12 overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-10 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">
                        Resume Parsed Successfully
                    </span>
                </div>
                <h2 className="text-3xl font-bold mb-2">Your Profile</h2>
                <p className="text-[var(--text-secondary)]">
                    Review the extracted data below
                </p>
            </div>

            {/* Profile Card */}
            <div className="w-full max-w-3xl space-y-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                {/* Personal Info */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 text-sm">
                            👤
                        </span>
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.personal.name && (
                            <InfoItem label="Name" value={data.personal.name} />
                        )}
                        {data.personal.email && (
                            <InfoItem label="Email" value={data.personal.email} />
                        )}
                        {data.personal.phone && (
                            <InfoItem label="Phone" value={data.personal.phone} />
                        )}
                        {data.personal.location && (
                            <InfoItem label="Location" value={data.personal.location} />
                        )}
                        {data.personal.linkedin && (
                            <InfoItem label="LinkedIn" value={data.personal.linkedin} isLink />
                        )}
                        {data.personal.github && (
                            <InfoItem label="GitHub" value={data.personal.github} isLink />
                        )}
                    </div>
                </div>

                {/* Summary */}
                {data.summary && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 text-sm">
                                📝
                            </span>
                            Summary
                        </h3>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                            {data.summary}
                        </p>
                    </div>
                )}

                {/* Skills */}
                {(data.skills.technical.length > 0 ||
                    data.skills.soft.length > 0 ||
                    data.skills.tools.length > 0 ||
                    data.skills.languages.length > 0) && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 text-sm">
                                    ⚡
                                </span>
                                Skills
                            </h3>
                            <div className="space-y-4">
                                {data.skills.technical.length > 0 && (
                                    <SkillGroup label="Technical" skills={data.skills.technical} color="violet" />
                                )}
                                {data.skills.tools.length > 0 && (
                                    <SkillGroup label="Tools" skills={data.skills.tools} color="blue" />
                                )}
                                {data.skills.soft.length > 0 && (
                                    <SkillGroup label="Soft Skills" skills={data.skills.soft} color="emerald" />
                                )}
                                {data.skills.languages.length > 0 && (
                                    <SkillGroup label="Languages" skills={data.skills.languages} color="amber" />
                                )}
                            </div>
                        </div>
                    )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 text-sm">
                                💼
                            </span>
                            Experience
                        </h3>
                        <div className="space-y-1">
                            {data.experience.map((exp, i) => (
                                <div key={i} className="timeline-item pb-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1">
                                        <h4 className="font-medium text-[var(--text-primary)]">
                                            {exp.role}
                                        </h4>
                                        {exp.duration && (
                                            <span className="text-xs text-[var(--text-muted)] mt-1 md:mt-0">
                                                {exp.duration}
                                            </span>
                                        )}
                                    </div>
                                    {exp.company && (
                                        <p className="text-sm text-violet-400 mb-2">{exp.company}</p>
                                    )}
                                    {exp.responsibilities.length > 0 && (
                                        <ul className="space-y-1.5 mt-2">
                                            {exp.responsibilities.slice(0, 4).map((r, j) => (
                                                <li
                                                    key={j}
                                                    className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                                                >
                                                    <span className="text-violet-500 mt-1 flex-shrink-0">▸</span>
                                                    {r}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {exp.technologies_used.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {exp.technologies_used.map((tech, j) => (
                                                <span
                                                    key={j}
                                                    className="text-xs px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {data.education.length > 0 && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 text-sm">
                                🎓
                            </span>
                            Education
                        </h3>
                        <div className="space-y-4">
                            {data.education.map((edu, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-primary)]/50">
                                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 flex-shrink-0 text-lg">
                                        🏛
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-[var(--text-primary)]">
                                            {edu.institution}
                                        </h4>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {[edu.degree, edu.field].filter(Boolean).join(" in ")}
                                        </p>
                                        <div className="flex gap-3 mt-1 text-xs text-[var(--text-muted)]">
                                            {edu.year && <span>{edu.year}</span>}
                                            {edu.gpa && <span>GPA: {edu.gpa}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Projects */}
                {data.projects.length > 0 && (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 text-sm">
                                🚀
                            </span>
                            Projects
                        </h3>
                        <div className="space-y-4">
                            {data.projects.map((proj, i) => (
                                <div key={i} className="p-3 rounded-lg bg-[var(--bg-primary)]/50">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-[var(--text-primary)]">
                                            {proj.name}
                                        </h4>
                                        {proj.link && (
                                            <a
                                                href={proj.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-violet-400 hover:underline"
                                            >
                                                View →
                                            </a>
                                        )}
                                    </div>
                                    {proj.description && (
                                        <p className="text-sm text-[var(--text-secondary)] mb-2">
                                            {proj.description}
                                        </p>
                                    )}
                                    {proj.technologies.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {proj.technologies.map((tech, j) => (
                                                <span
                                                    key={j}
                                                    className="text-xs px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Certifications & Achievements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.certifications.length > 0 && (
                        <div className="glass-card p-6">
                            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                <span className="text-violet-400">🏅</span> Certifications
                            </h3>
                            <ul className="space-y-2">
                                {data.certifications.map((cert, i) => (
                                    <li
                                        key={i}
                                        className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                                    >
                                        <span className="text-violet-500 mt-0.5">•</span>
                                        {cert}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.achievements.length > 0 && (
                        <div className="glass-card p-6">
                            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                <span className="text-violet-400">🏆</span> Achievements
                            </h3>
                            <ul className="space-y-2">
                                {data.achievements.map((ach, i) => (
                                    <li
                                        key={i}
                                        className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                                    >
                                        <span className="text-violet-500 mt-0.5">•</span>
                                        {ach}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Continue Button */}
                <div className="flex justify-center pt-4 pb-12">
                    <button
                        onClick={onContinue}
                        className="btn-primary flex items-center gap-2 text-base px-8 py-3.5"
                        id="continue-to-onboarding"
                    >
                        Continue to Onboarding
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Sub-components ──────────────────────────────────── */

function InfoItem({
    label,
    value,
    isLink = false,
}: {
    label: string;
    value: string;
    isLink?: boolean;
}) {
    return (
        <div>
            <p className="text-xs text-[var(--text-muted)] mb-0.5 uppercase tracking-wider">
                {label}
            </p>
            {isLink ? (
                <a
                    href={value.startsWith("http") ? value : `https://${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-violet-400 hover:underline break-all"
                >
                    {value}
                </a>
            ) : (
                <p className="text-sm text-[var(--text-primary)]">{value}</p>
            )}
        </div>
    );
}

function SkillGroup({
    label,
    skills,
    color,
}: {
    label: string;
    skills: string[];
    color: string;
}) {
    const colorMap: Record<string, string> = {
        violet: "bg-violet-500/10 text-violet-300 border-violet-500/20",
        blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    };

    return (
        <div>
            <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                {label}
            </p>
            <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                    <span
                        key={i}
                        className={`skill-chip border ${colorMap[color] || colorMap.violet}`}
                    >
                        {skill}
                    </span>
                ))}
            </div>
        </div>
    );
}
