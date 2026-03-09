"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ParsedData {
    personal: {
        name: string;
        email: string;
        phone: string;
        linkedin: string;
        github: string;
        location: string;
    };
    summary: string;
    skills: {
        technical: string[];
        soft: string[];
        tools: string[];
        languages: string[];
    };
    experience: Array<{
        company: string;
        role: string;
        duration: string;
        start_date: string;
        end_date: string;
        responsibilities: string[];
        technologies_used: string[];
    }>;
    education: Array<{
        institution: string;
        degree: string;
        field: string;
        year: string;
        gpa: string;
    }>;
    projects: Array<{
        name: string;
        description: string;
        technologies: string[];
        link: string;
    }>;
    certifications: string[];
    achievements: string[];
}

interface CandidateContextType {
    candidateId: string | null;
    parsedData: ParsedData | null;
    setCandidateId: (id: string | null) => void;
    setParsedData: (data: ParsedData | null) => void;
    resetCandidate: () => void;
}

const CandidateContext = createContext<CandidateContextType | undefined>(
    undefined
);

export function CandidateProvider({ children }: { children: ReactNode }) {
    const [candidateId, setCandidateId] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);

    const resetCandidate = () => {
        setCandidateId(null);
        setParsedData(null);
    };

    return (
        <CandidateContext.Provider
            value={{ candidateId, parsedData, setCandidateId, setParsedData, resetCandidate }}
        >
            {children}
        </CandidateContext.Provider>
    );
}

export function useCandidate() {
    const context = useContext(CandidateContext);
    if (!context) {
        throw new Error("useCandidate must be used within a CandidateProvider");
    }
    return context;
}

export type { ParsedData };
