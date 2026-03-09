"use client";

import React, { useState, useCallback } from "react";
import { submitOnboarding } from "@/lib/api";
import { useCandidate } from "@/context/CandidateContext";
import { useToast } from "@/components/Toast";

/* ─── Types ──────────────────────────────────────────── */

export interface MCQQuestion {
    id: string;
    text: string;
    options: { key: string; text: string }[];
}

interface OnboardingFlowProps {
    questions: MCQQuestion[];
    onComplete?: () => void;
}

type SubmitState = "idle" | "submitting" | "success";

export default function OnboardingFlow({ questions, onComplete }: OnboardingFlowProps) {
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [submitState, setSubmitState] = useState<SubmitState>("idle");
    const [traits, setTraits] = useState<Record<string, number> | null>(null);
    const { candidateId } = useCandidate();
    const { showToast } = useToast();

    const answeredCount = Object.keys(answers).filter((k) => answers[k].length > 0).length;
    const totalQuestions = questions.length;
    const allAnswered = answeredCount === totalQuestions;

    const selectAnswer = useCallback((questionId: string, optionKey: string) => {
        setAnswers((prev) => {
            const current = prev[questionId] || [];
            if (current.includes(optionKey)) {
                return { ...prev, [questionId]: current.filter((k) => k !== optionKey) };
            } else {
                return { ...prev, [questionId]: [...current, optionKey] };
            }
        });
    }, []);

    const handleSubmit = async () => {
        if (!candidateId) {
            showToast("No candidate ID found. Please upload your resume first.", "error");
            return;
        }
        if (!allAnswered) {
            showToast(`Please answer all ${totalQuestions} questions.`, "warning");
            return;
        }

        setSubmitState("submitting");

        try {
            const result = await submitOnboarding(candidateId, answers);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setTraits((result as any).traits || null);
            setSubmitState("success");
            showToast("Onboarding completed successfully!", "success");
        } catch (err) {
            setSubmitState("idle");
            showToast(
                err instanceof Error ? err.message : "Failed to submit answers.",
                "error"
            );
        }
    };

    // ─── Submitting Screen ──────────────────────────────────
    if (submitState === "submitting") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6">
                <div className="flex flex-col items-center gap-6 animate-fade-in">
                    <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-violet-400 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.182-3.182" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Submitting your profile{"\u2026"}</h2>
                        <p className="text-[var(--text-secondary)]">Calculating your engineering traits</p>
                    </div>
                    <div className="w-48">
                        <div className="progress-track">
                            <div className="progress-bar h-full w-3/4" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Success Screen with Traits ─────────────────────────
    if (submitState === "success") {
        const sortedTraits = traits
            ? Object.entries(traits).sort(([, a], [, b]) => b - a)
            : [];

        return (
            <div className="min-h-screen flex flex-col items-center px-6 py-12 overflow-y-auto">
                <div className="flex flex-col items-center gap-6 animate-scale-in max-w-2xl w-full">
                    {/* Success Icon */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
                            <svg className="w-12 h-12 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                                    style={{ strokeDasharray: 50, animation: "checkmark 0.5s ease-out 0.3s forwards", strokeDashoffset: 50 }} />
                            </svg>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                    </div>

                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-2">You&apos;re all set!</h2>
                        <p className="text-[var(--text-secondary)]">Your engineering profile has been analyzed</p>
                    </div>

                    {/* Trait Scores Card */}
                    {sortedTraits.length > 0 && (
                        <div className="glass-card p-6 w-full mt-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 text-sm">📊</span>
                                Your Engineering Traits
                            </h3>
                            <div className="space-y-3">
                                {sortedTraits.map(([trait, score]) => (
                                    <div key={trait}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-[var(--text-primary)]">
                                                {trait.replace(/([A-Z])/g, " $1").trim()}
                                            </span>
                                            <span className="text-xs text-violet-400 font-mono">
                                                {(score * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="progress-track">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${score * 100}%`,
                                                    background: score >= 0.7
                                                        ? "linear-gradient(90deg, #7c3aed, #a78bfa)"
                                                        : score >= 0.5
                                                            ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
                                                            : "linear-gradient(90deg, #6b7280, #9ca3af)",
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {onComplete ? (
                        <button
                            onClick={onComplete}
                            className="w-full btn-primary py-3.5 text-base mt-2"
                        >
                            Continue to Technical Interview →
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm mx-auto w-max">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Onboarding Complete
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Google Forms-style Question List ───────────────────

    return (
        <div className="min-h-screen flex flex-col">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 bg-[var(--bg-primary)]/90 backdrop-blur-lg border-b border-[var(--border)] px-6 py-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-lg font-semibold">
                            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                Engineering Assessment
                            </span>
                        </h1>
                        <span className="text-sm text-[var(--text-muted)] font-mono">
                            {answeredCount}/{totalQuestions} answered
                        </span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-bar h-full"
                            style={{
                                width: `${(answeredCount / totalQuestions) * 100}%`,
                                transition: "width 0.4s ease",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 px-6 py-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="glass-card p-6 animate-fade-in-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                            id={`question-${question.id}`}
                        >
                            {/* Question Header */}
                            <div className="flex items-start gap-3 mb-5">
                                <span
                                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${(answers[question.id] && answers[question.id].length > 0)
                                        ? "bg-violet-500 text-white"
                                        : "bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]"
                                        }`}
                                >
                                    {index + 1}
                                </span>
                                <h3 className="text-base font-medium text-[var(--text-primary)] leading-relaxed pt-1">
                                    {question.text}
                                    <span className="text-red-400 ml-1">*</span>
                                </h3>
                            </div>

                            {/* Options */}
                            <div className="space-y-2.5 ml-11">
                                {question.options.map((option) => {
                                    const isSelected = (answers[question.id] || []).includes(option.key);
                                    return (
                                        <button
                                            key={option.key}
                                            onClick={() => selectAnswer(question.id, option.key)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-3 group ${isSelected
                                                ? "border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                                                : "border-[var(--border)] bg-[var(--bg-primary)]/50 hover:border-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
                                                }`}
                                            id={`option-${question.id}-${option.key}`}
                                        >
                                            {/* Checkbox Square */}
                                            <span
                                                className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? "border-violet-500 bg-violet-500"
                                                    : "border-[var(--text-muted)] group-hover:border-[var(--text-secondary)]"
                                                    }`}
                                            >
                                                {isSelected && (
                                                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </span>

                                            {/* Option Key Badge */}
                                            <span
                                                className={`flex-shrink-0 w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center ${isSelected
                                                    ? "bg-violet-500/20 text-violet-300"
                                                    : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
                                                    }`}
                                            >
                                                {option.key}
                                            </span>

                                            {/* Option Text */}
                                            <span
                                                className={`text-sm ${isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                                                    }`}
                                            >
                                                {option.text}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4 pb-12">
                        <button
                            onClick={handleSubmit}
                            disabled={!allAnswered}
                            className="btn-primary flex items-center gap-2 text-base px-10 py-3.5 disabled:opacity-40"
                            id="submit-onboarding"
                        >
                            {allAnswered ? (
                                <>
                                    Submit Answers
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </>
                            ) : (
                                `Answer all ${totalQuestions} questions to submit`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
