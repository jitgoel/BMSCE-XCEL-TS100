import streamlit as st
import matplotlib.pyplot as plt
import numpy as np
from utils.parser import extract_text
from utils.analyzer import load_skills, extract_skills, get_required_skills
from utils.scorer import calculate_score, missing_skills
from utils.suggestions import generate_suggestions
from utils.resume_quality import project_score, experience_score, structure_score, skill_density_score
from utils.impact_analyzer import detect_achievements
from utils.bullet_analyzer import analyze_bullets
from utils.section_classifier import classify_sections
from utils.skill_gap import analyze_skill_gap
from utils.job_recommender import recommend_jobs

def run():

    st.set_page_config(
        page_title="AI Resume Analyzer",
        layout="centered",
        page_icon="📄"
    )

    st.markdown(
        """
        <style>

        .stApp {
            background: linear-gradient(180deg,#0f172a,#020617);
            color: #e2e8f0;
        }

        h1, h2, h3 {
            color:#f8fafc;
            font-weight:600;
            letter-spacing:0.3px;
        }

        .stButton>button {
            background: linear-gradient(90deg,#38bdf8,#0284c7);
            border:none;
            padding:0.6rem 1.2rem;
            border-radius:8px;
            color:white;
            font-weight:600;
        }

        .stTextInput input {
            background:#020617 !important;
            border:1px solid #334155 !important;
            border-radius:6px;
            color:#ffffff !important;
        }

        label {
            color:#e2e8f0 !important;
            font-weight:500;
        }

        [data-testid="stFileUploader"] {
            background:#020617 !important;
            border:1px solid #334155 !important;
            border-radius:10px;
            padding:1rem;
        }

        [data-testid="stFileUploaderDropzone"] {
            background:#020617 !important;
            border:2px dashed #334155 !important;
            color:#ffffff !important;
        }

        [data-testid="stFileUploaderDropzone"] * {
            color:#ffffff !important;
        }

        [data-testid="stFileUploaderFile"] {
            color:#ffffff !important;
        }

        .stProgress > div > div > div {
            background-color:#38bdf8;
        }

        [data-testid="stFileUploader"] button {
        background: linear-gradient(90deg,#38bdf8,#0284c7) !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 0.45rem 1rem !important;
        font-weight: 600 !important;
        }

        [data-testid="stFileUploader"] button:hover {
        background: linear-gradient(90deg,#0ea5e9,#0369a1) !important;
        }

        </style>
        """,
        unsafe_allow_html=True
    )

    st.markdown(
    """
    <div style="text-align:center;padding:10px 0 30px 0">
    <h1 style="font-size:42px">AI Resume Analyzer</h1>
    <p style="color:#94a3b8;font-size:16px">
    Upload your resume and get AI powered ATS analysis, skill gap insights,
    and career recommendations.
    </p>
    </div>
    """,
    unsafe_allow_html=True
    )

    uploaded_file = st.file_uploader("Upload Resume (PDF)", type=["pdf"])
    job_role = st.text_input("Enter Target Job Role")

    analyze = st.button("Analyze Resume")

    skills = load_skills("data/skills.json")

    if analyze and uploaded_file and job_role:

        text = extract_text(uploaded_file)
        found_skills = extract_skills(text, skills)
        required_skills = get_required_skills(job_role)

        skill_score = calculate_score(found_skills, required_skills)

        proj_score = project_score(text)
        exp_score = experience_score(text)
        struct_score = structure_score(text)
        density_score = skill_density_score(text, found_skills)

        impact_score, achievement_count = detect_achievements(text)
        bullet_score, bullet_count = analyze_bullets(text)
        sections_detected = classify_sections(text)

        score = (
            0.35 * skill_score +
            0.15 * proj_score +
            0.15 * exp_score +
            0.10 * struct_score +
            0.10 * density_score +
            0.10 * impact_score +
            0.05 * bullet_score
        )

        missing = missing_skills(found_skills, required_skills)
        matched_skills, gap_skills, match_count, total_required = analyze_skill_gap(found_skills, required_skills)
        recommended_jobs = recommend_jobs(found_skills)
        suggestions = generate_suggestions(found_skills, missing, text)

        st.markdown("## ATS Score")
        st.progress(int(max(min(score, 100), 0)))
        st.markdown(f"### {round(score,2)} %")

        st.subheader("Resume vs Industry Benchmark")

        labels = [
            "Skill Match",
            "Projects",
            "Experience",
            "Structure",
            "Density",
            "Impact",
            "Bullets"
        ]

        user_scores = [
            skill_score,
            proj_score,
            exp_score,
            struct_score,
            density_score,
            impact_score,
            bullet_score
        ]

        industry_scores = [
            65,
            60,
            55,
            70,
            60,
            50,
            55
        ]

        x = np.arange(len(labels))
        width = 0.38

        fig, ax = plt.subplots(figsize=(8,4))

        user_color = "#7dd3fc"
        industry_color = "#0284c7"

        bars1 = ax.bar(
            x - width/2,
            user_scores,
            width,
            label="Your Resume",
            color=user_color
        )

        bars2 = ax.bar(
            x + width/2,
            industry_scores,
            width,
            label="Industry Average",
            color=industry_color
        )

        ax.set_ylabel("Score")
        ax.set_ylim(0,100)
        ax.set_xticks(x)
        ax.set_xticklabels(labels, rotation=20)
        ax.legend()

        for bar in bars1:
            height = bar.get_height()
            ax.text(
                bar.get_x() + bar.get_width()/2,
                height + 1,
                f"{height:.0f}",
                ha="center",
                va="bottom",
                fontsize=9
            )

        for bar in bars2:
            height = bar.get_height()
            ax.text(
                bar.get_x() + bar.get_width()/2,
                height + 1,
                f"{height:.0f}",
                ha="center",
                va="bottom",
                fontsize=9
            )

        plt.tight_layout()
        st.pyplot(fig)

        coverage = min(len(found_skills) / max(len(required_skills), 1), 1)

        st.subheader("Skill Coverage")
        st.progress(int(coverage * 100))
        st.write(str(round(coverage * 100, 2)) + " % role skill coverage")

        st.subheader("Detected Skills")
        skills_text = "  ".join([f"`{s}`" for s in sorted(found_skills)])
        st.markdown(skills_text)

        st.subheader("Missing Skills")
        missing_text = "  ".join([f"`{s}`" for s in missing])
        st.markdown(missing_text)

        st.subheader("AI Skill Gap Analysis")
        st.write("Matched Skills:", match_count, "/", total_required)

        if len(gap_skills) > 0:
            st.write("Recommended Skills To Learn:")
            for s in gap_skills:
                st.markdown("• " + s)
        else:
            st.write("Your resume already covers the required skill set.")

        st.subheader("AI Career Recommendations")

        if len(recommended_jobs) > 0:
            st.write("Based on your detected skills you may be suitable for:")
            for job in recommended_jobs:
                st.markdown("• " + job)
        else:
            st.write("Not enough skill signals detected to recommend roles.")

        st.subheader("Analysis Visualizations")

        colA, colB = st.columns(2)

        with colA:
            labels = ["Matched Skills", "Missing Skills"]
            matched = len(matched_skills)
            values = [matched, len(missing)]
            fig, ax = plt.subplots()
            ax.bar(labels, values)
            st.pyplot(fig)

        with colB:
            labels = ["Skill", "Projects", "Experience", "Structure", "Density", "Impact", "Bullets"]
            values = [
                skill_score,
                proj_score,
                exp_score,
                struct_score,
                density_score,
                impact_score,
                bullet_score
            ]
            values.append(values[0])
            angles = np.linspace(0, 2 * np.pi, len(values), endpoint=False).tolist()
            fig = plt.figure(figsize=(3,3))
            ax = plt.subplot(111, polar=True)
            ax.plot(angles, values)
            ax.fill(angles, values, alpha=0.25)
            ax.set_ylim(0,100)
            ax.set_xticks(angles[:-1])
            ax.set_xticklabels(labels)
            st.pyplot(fig)

        st.subheader("AI Resume Section Detection")

        for sec in sections_detected:
            if sections_detected[sec]:
                st.write("✓ " + sec.capitalize())
            else:
                st.write("✗ " + sec.capitalize())

        st.subheader("Resume Statistics")

        st.write("Quantified Achievements Detected:", achievement_count)
        st.write("Strong Bullet Points Detected:", bullet_count)

        word_count = len(text.split())

        st.write("Total Words:", word_count)
        st.write("Technical Skills Detected:", len(found_skills))
        st.write("Missing Skills:", len(missing))

        st.subheader("Resume Improvement Suggestions")

        for s in suggestions:
            st.markdown("• " + s)