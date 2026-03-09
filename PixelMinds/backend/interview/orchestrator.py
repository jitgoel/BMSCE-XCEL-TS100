import json
import random
from .prompts import TECH_1_PROMPT, TECH_2_PROMPT, HR_PROMPT, ANALYST_PROMPT
from .llm_client import call_llm
from .questions import get_questions_for_role

class InterviewOrchestrator:
    def __init__(self, current_state: str, question_count: int, chat_history: list, candidate_summary: str, job_role: str, technical_first: bool = True):
        self.current_state = current_state
        self.question_count = question_count
        self.chat_history = chat_history
        self.candidate_summary = candidate_summary
        self.job_role = job_role
        self.technical_first = technical_first

    def get_system_prompt(self, state: str) -> str:
        question_bank_list = get_questions_for_role(self.job_role).split('\n')
        # Filter out empty lines and keep a randomized sample for the prompt
        filtered_bank = [q.strip() for q in question_bank_list if q.strip()]
        random.shuffle(filtered_bank)
        question_bank = "\n".join(filtered_bank[:10]) # Provide a varied subset
        
        if state == "TECH_1":
            return TECH_1_PROMPT.format(candidate_summary=self.candidate_summary, question_bank=question_bank)
        elif state == "TECH_2":
            return TECH_2_PROMPT.format(candidate_summary=self.candidate_summary, question_bank=question_bank)
        elif state == "HR":
            return HR_PROMPT.format(candidate_summary=self.candidate_summary)
        elif state == "ANALYST":
            return ANALYST_PROMPT
        
        return ""

    def should_transition(self) -> bool:
        # Total limit is 10 questions. 
        # Round 1: 4 questions
        # Round 2: 3 questions
        # Round 3: 3 questions
        if self.current_state in ["TECH_1", "TECH_2", "HR"]:
            limit = 4 if self.question_count == 0 and self._is_first_round() else 3
            # Wait, question_count resets to 0 on transition. 
            # Let's use logic based on the specific state and order.
            
            first_state = "TECH_1" if self.technical_first else "HR"
            if self.current_state == first_state:
                return self.question_count >= 4
            else:
                return self.question_count >= 3
                
        if self.current_state == "ANALYST":
            return True
        return False

    def _is_first_round(self) -> bool:
        if self.technical_first:
            return self.current_state == "TECH_1"
        else:
            return self.current_state == "HR"

    def transition(self):
        if self.technical_first:
            # TECH_1 -> TECH_2 -> HR -> ANALYST
            if self.current_state == "TECH_1":
                self.current_state = "TECH_2"
            elif self.current_state == "TECH_2":
                self.current_state = "HR"
            elif self.current_state == "HR":
                self.current_state = "ANALYST"
            elif self.current_state == "ANALYST":
                self.current_state = "END"
        else:
            # HR -> TECH_1 -> TECH_2 -> ANALYST
            if self.current_state == "HR":
                self.current_state = "TECH_1"
            elif self.current_state == "TECH_1":
                self.current_state = "TECH_2"
            elif self.current_state == "TECH_2":
                self.current_state = "ANALYST"
            elif self.current_state == "ANALYST":
                self.current_state = "END"
        
        self.question_count = 0

    async def process_answer(self, user_message: str | None) -> str | dict | None:
        if user_message:
            self.chat_history.append({"role": "user", "content": user_message})
            if self.should_transition():
                self.transition()

        if self.current_state == "END":
            return None

        system_prompt = self.get_system_prompt(self.current_state)
        llm_messages = self.chat_history
        
        if self.current_state == "ANALYST":
            transcript = ""
            for msg in self.chat_history:
                role = "Candidate" if msg["role"] == "user" else "Interviewer"
                transcript += f"[{role}]: {msg['content']}\n\n"
            
            llm_messages = [{"role": "user", "content": f"Analyze the following interview transcript for cognitive and behavioral patterns. Provide a detailed report correctly identifying strengths and weaknesses across all rounds including technical and HR aspects:\n\n{transcript}"}]

        response_text = await call_llm(system_prompt, llm_messages)
        
        if self.current_state == "ANALYST":
            self.transition() 
            try:
                report = json.loads(response_text)
            except Exception:
                fixed_text = response_text[response_text.find('{') : response_text.rfind('}') + 1]
                try:
                    report = json.loads(fixed_text)
                except Exception:
                    report = {"error": "Failed to parse analyst JSON", "raw": response_text}
            return report

        self.chat_history.append({"role": "assistant", "content": response_text})
        self.question_count += 1
        return response_text
