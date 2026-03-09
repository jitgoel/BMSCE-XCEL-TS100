"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCandidate } from "@/context/CandidateContext";
import { useToast } from "@/components/Toast";
import { startInterview, answerInterview } from "@/lib/api";

type FlowState = "ROLE_SELECTION" | "CHAT" | "REPORT";

interface Message {
    id: string;
    role: "interviewer" | "candidate";
    text: string;
}

export default function InterviewFlow() {
    const { candidateId } = useCandidate();
    const { showToast } = useToast();

    const [flowState, setFlowState] = useState<FlowState>("ROLE_SELECTION");
    const [selectedRole, setSelectedRole] = useState<string>("Software Engineer");
    const [technicalFirst, setTechnicalFirst] = useState<boolean>(true);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentRound, setCurrentRound] = useState<string>("TECH_1");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Report State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [report, setReport] = useState<any>(null);

    const ROLES = [
        "Software Engineer",
        "Web Developer",
        "Machine Learning Engineer",
        "Systems Engineer"
    ];

    const roundLabels: Record<string, string> = {
        "TECH_1": "Core Concepts",
        "TECH_2": "System Design",
        "HR": "Behavioral",
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleStartInterview = async () => {
        if (!candidateId) {
            showToast("No candidate ID found. Please go back and upload resume.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const res = await startInterview(candidateId, selectedRole, technicalFirst);
            setSessionId(res.session_id as string);
            setCurrentRound(res.current_round as string);

            setMessages([
                {
                    id: "msg-0",
                    role: "interviewer",
                    text: res.message as string,
                }
            ]);
            setFlowState("CHAT");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to start interview", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || !sessionId || isLoading) return;

        const userText = inputValue.trim();
        setInputValue("");

        // Add user message to UI immediately
        const userMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: userMsgId, role: "candidate", text: userText }]);

        setIsLoading(true);
        try {
            const res = await answerInterview(sessionId, userText);
            setCurrentRound(res.current_round as string);

            if (res.is_complete) {
                setReport(res.analyst_report);
                setFlowState("REPORT");
            } else {
                const botMsgId = (Date.now() + 1).toString();
                setMessages(prev => [...prev, { id: botMsgId, role: "interviewer", text: res.message as string }]);
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to send message", "error");
        } finally {
            setIsLoading(false);
        }
    };


    // ─── RENDER ROLE SELECTION ──────────────────────────────────
    if (flowState === "ROLE_SELECTION") {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
                <div className="glass-card max-w-xl w-full p-8 animate-scale-in">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🤖</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Configure Interview</h2>
                        <p className="text-[var(--text-secondary)]">
                            Select the target role for this interview session. The AI agents will tailor their questions accordingly.
                        </p>
                    </div>

                    <div className="space-y-3 mb-8">
                        <label className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Starting Round</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setTechnicalFirst(true)}
                                className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${technicalFirst ? "border-violet-500 bg-violet-500/10 text-[var(--text-primary)]" : "border-[var(--border)] bg-[var(--bg-primary)]/50 text-[var(--text-secondary)] hover:border-[var(--text-muted)]"}`}
                            >
                                Technical First
                            </button>
                            <button
                                onClick={() => setTechnicalFirst(false)}
                                className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${!technicalFirst ? "border-violet-500 bg-violet-500/10 text-[var(--text-primary)]" : "border-[var(--border)] bg-[var(--bg-primary)]/50 text-[var(--text-secondary)] hover:border-[var(--text-muted)]"}`}
                            >
                                HR First
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <label className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Job Role</label>
                        {ROLES.map((role) => (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center justify-between ${selectedRole === role
                                    ? "border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                                    : "border-[var(--border)] bg-[var(--bg-primary)]/50 hover:border-[var(--text-muted)]"
                                    }`}
                            >
                                <span className={`font-medium ${selectedRole === role ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                                    {role}
                                </span>
                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedRole === role ? "border-violet-500 bg-violet-500" : "border-[var(--border)]"
                                    }`}>
                                    {selectedRole === role && <span className="w-2 h-2 rounded-full bg-white" />}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleStartInterview}
                        disabled={isLoading}
                        className="btn-primary w-full py-3.5 text-base flex justify-center items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="w-5 h-5 animate-spin-slow text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Initializing Agents...
                            </>
                        ) : "Start Interviewing"}
                    </button>
                </div>
            </div>
        );
    }

    // ─── RENDER CHAT INTERFACE ──────────────────────────────────
    if (flowState === "CHAT") {
        return (
            <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto py-6 px-4">

                {/* Chat Header */}
                <div className="glass-card mb-4 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                            <span className="text-lg">🤖</span>
                        </div>
                        <div>
                            <h2 className="font-semibold text-[var(--text-primary)]">AI Interview Panel</h2>
                            <p className="text-xs text-[var(--text-secondary)]">{selectedRole} track</p>
                        </div>
                    </div>
                    <div className="bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                        <span className="text-xs font-mono text-violet-400 font-medium tracking-wide">
                            ROUND: {roundLabels[currentRound] || currentRound}
                        </span>
                    </div>
                </div>

                {/* Messages Layout */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin pb-4">
                    {messages.map((msg) => {
                        const isBot = msg.role === "interviewer";
                        return (
                            <div key={msg.id} className={`flex ${isBot ? "justify-start" : "justify-end"} animate-fade-in-up`}>
                                <div className={`max-w-[80%] flex ${isBot ? "flex-row" : "flex-row-reverse"} gap-3 items-end`}>
                                    {isBot && (
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-sm mb-1">
                                            🤖
                                        </div>
                                    )}
                                    <div className={`px-5 py-3.5 rounded-2xl ${isBot
                                        ? "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-sm"
                                        : "bg-violet-600 text-white shadow-lg shadow-violet-500/20 rounded-br-sm"
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="flex flex-row gap-3 items-end">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 text-sm mb-1">
                                    🤖
                                </div>
                                <div className="px-5 py-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-bl-sm flex gap-1">
                                    <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="mt-4 glass-card p-2 rounded-2xl relative">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={isLoading ? "Please wait..." : "Type your answer here..."}
                            disabled={isLoading}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--text-primary)] text-sm resize-none py-3 px-4 disabled:opacity-50"
                            rows={2}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="w-12 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-violet-600 self-end mb-1 mr-1 shadow-lg shadow-violet-500/20"
                        >
                            <svg className="w-5 h-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ─── RENDER ANALYST REPORT ────────────────────────────────
    if (flowState === "REPORT" && report) {
        return (
            <div className="min-h-screen py-10 px-6 max-w-3xl mx-auto animate-fade-in">
                <div className="text-center mb-10">
                    <div className="inline-flex w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 items-center justify-center mb-6">
                        <span className="text-3xl">📝</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                        Interview Analysis Report
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
                        Our Cognitive Analyst has reviewed your transcript. Here is your evaluation.
                    </p>
                </div>

                {/* Overall Score Card */}
                <div className="glass-card p-8 text-center mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                    <h3 className="text-[var(--text-secondary)] text-sm uppercase tracking-wider font-semibold mb-2">Overall Communication Score</h3>
                    <div className="text-6xl font-bold text-[var(--text-primary)] mb-4">
                        {report.overall_communication_score} <span className="text-2xl text-[var(--text-muted)]">/ 10</span>
                    </div>
                    <p className="text-[var(--text-primary)] leading-relaxed italic border-t border-[var(--border)] pt-4 max-w-lg mx-auto">
                        "{report.summary}"
                    </p>
                </div>

                {/* Patterns List */}
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="text-violet-400">🔍</span> Detected Cognitive Patterns
                </h3>

                <div className="space-y-4">
                    {report.patterns_detected?.map((p: any, idx: number) => {
                        let colorStr = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                        if (p.severity === "high") colorStr = "text-red-400 bg-red-500/10 border-red-500/20";
                        if (p.severity === "medium") colorStr = "text-amber-400 bg-amber-500/10 border-amber-500/20";

                        return (
                            <div key={idx} className="glass-card p-6 border-l-4" style={{ borderLeftColor: p.severity === "high" ? "#ef4444" : p.severity === "medium" ? "#f59e0b" : "#3b82f6" }}>
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-semibold text-lg">{p.pattern}</h4>
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${colorStr} border`}>
                                        {p.severity} severity
                                    </span>
                                </div>
                                <div className="bg-[var(--bg-primary)]/50 p-4 rounded-xl border border-[var(--border)] mb-4">
                                    <p className="text-sm font-mono text-[var(--text-secondary)]">"{p.evidence}"</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <p className="text-sm text-[var(--text-primary)]">{p.recommendation}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
}
