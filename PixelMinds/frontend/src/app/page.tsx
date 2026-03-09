"use client";

import React, { useState } from "react";
import ResumeUpload from "@/components/ResumeUpload";
import ResumePreview from "@/components/ResumePreview";
import OnboardingFlow, { MCQQuestion } from "@/components/OnboardingFlow";
import InterviewFlow from "@/components/InterviewFlow";

type AppStep = "upload" | "preview" | "onboarding" | "interview";

// 15 predefined MCQ questions from Onboarding Questions PDF
const ONBOARDING_QUESTIONS: MCQQuestion[] = [
  {
    id: "q1",
    text: "When starting a project in a technology stack you have never used before, what is your typical first step?",
    options: [
      { key: "A", text: "Read official documentation and architecture guides first" },
      { key: "B", text: "Build a small prototype to experiment with the technology" },
      { key: "C", text: "Watch tutorials or study existing open-source projects" },
      { key: "D", text: "Ask experienced teammates for recommended best practices" },
    ],
  },
  {
    id: "q2",
    text: "A critical production bug begins affecting users. What is your first action?",
    options: [
      { key: "A", text: "Roll back the latest deployment to restore service" },
      { key: "B", text: "Analyze logs and traces to identify the root cause" },
      { key: "C", text: "Deploy a quick patch to reduce user impact immediately" },
      { key: "D", text: "Attempt to reproduce the issue in a staging environment" },
    ],
  },
  {
    id: "q3",
    text: "How should technical debt be handled in a fast-paced development team?",
    options: [
      { key: "A", text: "Focus on shipping features and address debt only when necessary" },
      { key: "B", text: "Allocate time in every sprint specifically for refactoring" },
      { key: "C", text: "Refactor code whenever you modify an existing component" },
      { key: "D", text: "Plan periodic engineering cleanup cycles" },
    ],
  },
  {
    id: "q4",
    text: "A job description lists a tool you have never used before. How do you approach the opportunity?",
    options: [
      { key: "A", text: "Explain transferable skills and willingness to learn quickly" },
      { key: "B", text: "Build a small project using the tool before the interview" },
      { key: "C", text: "Study the tool's ecosystem and architecture beforehand" },
      { key: "D", text: "Avoid applying until you gain formal experience" },
    ],
  },
  {
    id: "q5",
    text: "When reviewing a teammate's code, what do you look for first?",
    options: [
      { key: "A", text: "Logical correctness and potential bugs" },
      { key: "B", text: "Code readability and maintainability" },
      { key: "C", text: "Performance bottlenecks or inefficiencies" },
      { key: "D", text: "Security vulnerabilities" },
    ],
  },
  {
    id: "q6",
    text: "A client requests a feature that will slow the system by about 40%. What would you do?",
    options: [
      { key: "A", text: "Implement it because it is technically feasible" },
      { key: "B", text: "Explain the performance trade-off and propose alternatives" },
      { key: "C", text: "Implement it while optimizing other parts of the system" },
      { key: "D", text: "Escalate the decision to product leadership" },
    ],
  },
  {
    id: "q7",
    text: "Which system architecture do you generally find most robust for scalable applications?",
    options: [
      { key: "A", text: "Modular monolith architecture" },
      { key: "B", text: "Microservices architecture" },
      { key: "C", text: "Serverless architecture" },
      { key: "D", text: "Event-driven distributed architecture" },
    ],
  },
  {
    id: "q8",
    text: "You realize halfway through a project that the deadline cannot realistically be met. What do you do?",
    options: [
      { key: "A", text: "Inform stakeholders immediately and propose revised estimates" },
      { key: "B", text: "Work extra hours to try meeting the deadline" },
      { key: "C", text: "Reduce feature scope quietly to finish on time" },
      { key: "D", text: "Wait until closer to the deadline before raising concerns" },
    ],
  },
  {
    id: "q9",
    text: "In your ideal engineering role, how would your time be distributed?",
    options: [
      { key: "A", text: "Mostly coding and implementing features" },
      { key: "B", text: "Balanced between coding and architecture decisions" },
      { key: "C", text: "Mostly system design and architecture" },
      { key: "D", text: "Leading technical strategy and mentoring engineers" },
    ],
  },
  {
    id: "q10",
    text: "You discover a security vulnerability in a module unrelated to your current task. What do you do?",
    options: [
      { key: "A", text: "Fix the vulnerability immediately" },
      { key: "B", text: "Report the issue and create a ticket" },
      { key: "C", text: "Inform the team and suggest potential solutions" },
      { key: "D", text: "Ignore it because it is outside your task scope" },
    ],
  },
  {
    id: "q11",
    text: "Your team leader suggests ignoring a minor privacy regulation during testing. What do you do?",
    options: [
      { key: "A", text: "Follow instructions because it is only for testing" },
      { key: "B", text: "Express concern and recommend compliance" },
      { key: "C", text: "Escalate the issue to appropriate leadership" },
      { key: "D", text: "Refuse to proceed until the issue is resolved" },
    ],
  },
  {
    id: "q12",
    text: "You disagree with a teammate about a technical design decision. How do you handle it?",
    options: [
      { key: "A", text: "Present benchmarks or data supporting your argument" },
      { key: "B", text: "Ask a senior engineer to mediate" },
      { key: "C", text: "Build small prototypes to compare both approaches" },
      { key: "D", text: "Accept the teammate's decision to avoid conflict" },
    ],
  },
  {
    id: "q13",
    text: "When designing a user interface, how do you approach accessibility standards?",
    options: [
      { key: "A", text: "Only address accessibility when required" },
      { key: "B", text: "Follow accessibility guidelines during development" },
      { key: "C", text: "Include accessibility checks in testing and QA" },
      { key: "D", text: "Prioritize inclusive design from the beginning" },
    ],
  },
  {
    id: "q14",
    text: "A project you led fails after deployment. What is your primary focus in the post-mortem?",
    options: [
      { key: "A", text: "Identifying technical causes of failure" },
      { key: "B", text: "Improving engineering processes and workflows" },
      { key: "C", text: "Understanding team decision-making errors" },
      { key: "D", text: "Restoring system stability and reliability" },
    ],
  },
  {
    id: "q15",
    text: "What primarily differentiates a senior engineer from a junior engineer?",
    options: [
      { key: "A", text: "Experience with more technologies" },
      { key: "B", text: "Ability to design scalable systems" },
      { key: "C", text: "Ownership of complex problems" },
      { key: "D", text: "Mentoring others and guiding technical decisions" },
    ],
  },
];

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");

  return (
    <main className="min-h-screen">
      {step === "upload" && (
        <ResumeUpload onComplete={() => setStep("preview")} />
      )}
      {step === "preview" && (
        <ResumePreview onContinue={() => setStep("onboarding")} />
      )}
      {step === "onboarding" && (
        <OnboardingFlow
          questions={ONBOARDING_QUESTIONS}
          onComplete={() => setStep("interview")}
        />
      )}
      {step === "interview" && (
        <InterviewFlow />
      )}
    </main>
  );
}
