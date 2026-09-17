"""
Weekly Summarizer Service - AI-based compilation of daily reports for OJT Narrative Report
Appendix 12: Daily Reflective Journal

Uses Google Gemini (gemini-2.5-flash) to synthesize logged daily activities and learnings
into professional, authentic, first-person weekly reflections. Includes an automated
rule-based fallback when Gemini API is unavailable or rate-limited.
"""

import os
import json
import re
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("⚠️ google-generativeai not installed. Weekly summarizer will use fallback mode.")


class WeeklySummarizer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        
        if GEMINI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                logger.info(f"✅ Weekly Summarizer initialized with Gemini model: {self.model_name}")
            except Exception as e:
                self.model = None
                logger.error(f"❌ Error configuring Gemini model: {e}")
        else:
            self.model = None
            if not self.api_key:
                logger.warning("⚠️ GEMINI_API_KEY not set for WeeklySummarizer.")

    def is_available(self) -> bool:
        return GEMINI_AVAILABLE and bool(self.api_key) and self.model is not None

    def _generate_fallback_summary(self, week_data: Dict[str, Any]) -> str:
        """
        Rule-based extractive fallback when Gemini is unavailable.
        Generates a coherent, authentic first-person synthesis from raw activities and learnings.
        """
        week_num = week_data.get("week_number", 1)
        date_range = week_data.get("date_range", "")
        entries = week_data.get("daily_entries", [])

        if not entries:
            return f"During Week {week_num} ({date_range}), standard daily operational duties and assigned training tasks were carried out in accordance with host company workplace guidelines."

        activities_list = []
        learnings_list = []
        total_hours = 0.0

        for entry in entries:
            act = (entry.get("activities") or "").strip()
            lrn = (entry.get("learnings") or "").strip()
            hrs = float(entry.get("hours_worked") or 0.0)
            total_hours += hrs

            if act:
                # Take first sentence or first 120 chars
                first_sentence = act.split(".")[0].strip()
                if first_sentence and len(first_sentence) > 10:
                    activities_list.append(first_sentence)
            if lrn:
                first_lrn = lrn.split(".")[0].strip()
                if first_lrn and len(first_lrn) > 10:
                    learnings_list.append(first_lrn)

        # Select sample key tasks
        selected_tasks = activities_list[:3]
        tasks_text = "; ".join(selected_tasks) if selected_tasks else "practical task assignments and technical workflows"

        selected_learnings = learnings_list[:2]
        learnings_text = " and ".join(selected_learnings) if selected_learnings else "workplace problem solving, operational discipline, and technical proficiency"

        summary = (
            f"During Week {week_num} ({date_range}), I completed {total_hours:.1f} hours of structured on-the-job training. "
            f"My primary duties and practical assignments involved {tasks_text.lower()}. "
            f"This period provided meaningful opportunities to develop core technical and professional competencies, particularly in understanding {learnings_text.lower()}. "
            f"Overcoming daily challenges encountered during these tasks reinforced my adaptability, attention to detail, and readiness for professional enterprise environments."
        )

        return summary

    async def summarize_weeks(
        self,
        weeks: List[Dict[str, Any]],
        student_name: str = "Student Intern",
        company_name: str = "Host Training Establishment",
        position: str = "OJT Trainee"
    ) -> List[Dict[str, Any]]:
        """
        Summarize an array of week groups using Gemini batch generation,
        falling back to extractive rule-based generation if needed.
        """
        if not weeks:
            return []

        # If Gemini is not available, use fallback directly
        if not self.is_available():
            logger.info("ℹ️ Gemini not available. Using fallback weekly summarizer.")
            results = []
            for w in weeks:
                summary = self._generate_fallback_summary(w)
                results.append({
                    "week_number": w.get("week_number"),
                    "date_range": w.get("date_range"),
                    "total_hours": sum(float(e.get("hours_worked") or 0.0) for e in w.get("daily_entries", [])),
                    "summary": summary,
                    "source": "fallback"
                })
            return results

        # Construct batch prompt for Gemini
        weeks_prompt_data = []
        for w in weeks:
            week_num = w.get("week_number", 1)
            date_range = w.get("date_range", "")
            entries = w.get("daily_entries", [])
            
            entry_lines = []
            week_hours = 0.0
            for e in entries:
                date = e.get("date", "")
                day = e.get("day_of_week", "")
                hrs = float(e.get("hours_worked") or 0.0)
                week_hours += hrs
                act = e.get("activities", "").strip()
                lrn = (e.get("learnings") or "").strip()
                
                line = f"- {date} ({day}, {hrs}h): Activities: {act}"
                if lrn:
                    line += f" | Key Learnings: {lrn}"
                entry_lines.append(line)

            weeks_prompt_data.append({
                "week_number": week_num,
                "date_range": date_range,
                "total_hours": week_hours,
                "entries": "\n".join(entry_lines)
            })

        prompt = f"""You are an academic writing assistant summarizing a student intern's daily log entries for their Cavite State University (CvSU) OJT Narrative Report (specifically Appendix 12: Daily Reflective Journal).

Student Intern: {student_name}
Host Company: {company_name}
Position/Role: {position}

Below are {len(weeks_prompt_data)} week(s) of daily logs submitted by the student during their internship:

"""
        for wp in weeks_prompt_data:
            prompt += f"""=== WEEK {wp['week_number']} ({wp['date_range']}) [Total Hours: {wp['total_hours']} hrs] ===\n{wp['entries']}\n\n"""

        prompt += """INSTRUCTIONS:
For EACH week listed above, write a cohesive, authentic, first-person reflective narrative summary (1 to 2 well-structured paragraphs, approximately 120-180 words per week).
1. The reflection must synthesize what the student accomplished that week, technical skills or tools utilized, real challenges encountered and resolved, and key personal/professional learnings gained.
2. Tone: Authentic, academic, professional, humble, and observant (CvSU Bachelor degree practicum standard).
3. Do NOT make up fictitious projects outside the provided activities. Base the synthesis strictly on their recorded daily activities and learnings.
4. Output STRICTLY a valid JSON array of objects with the exact schema:
[
  {
    "week_number": <int>,
    "summary": "<reflective summary paragraph(s)>"
  }
]
Do NOT include markdown formatting like ```json or any other text outside the JSON array."""

        try:
            logger.info(f"🤖 [WeeklySummarizer] Sending batch prompt for {len(weeks)} weeks to Gemini ({self.model_name})...")
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.3,
                    "top_p": 0.85,
                    "max_output_tokens": 4096,
                }
            )

            raw_text = response.text.strip()
            # Clean markdown JSON fences if present
            clean_json = re.sub(r"^```json\s*", "", raw_text)
            clean_json = re.sub(r"^```\s*", "", clean_json)
            clean_json = re.sub(r"\s*```$", "", clean_json).strip()

            parsed_list = json.loads(clean_json)
            summaries_by_week = {item["week_number"]: item["summary"] for item in parsed_list if "week_number" in item and "summary" in item}

            results = []
            for w in weeks:
                week_num = w.get("week_number")
                total_hours = sum(float(e.get("hours_worked") or 0.0) for e in w.get("daily_entries", []))
                
                if week_num in summaries_by_week and len(summaries_by_week[week_num].strip()) > 30:
                    results.append({
                        "week_number": week_num,
                        "date_range": w.get("date_range"),
                        "total_hours": total_hours,
                        "summary": summaries_by_week[week_num].strip(),
                        "source": "gemini"
                    })
                else:
                    # Fallback for missing week
                    results.append({
                        "week_number": week_num,
                        "date_range": w.get("date_range"),
                        "total_hours": total_hours,
                        "summary": self._generate_fallback_summary(w),
                        "source": "fallback"
                    })

            logger.info(f"✅ [WeeklySummarizer] Generated summaries for {len(results)} weeks successfully.")
            return results

        except Exception as e:
            logger.error(f"⚠️ [WeeklySummarizer] Gemini call failed ({e}). Falling back to rule-based generation.")
            results = []
            for w in weeks:
                results.append({
                    "week_number": w.get("week_number"),
                    "date_range": w.get("date_range"),
                    "total_hours": sum(float(e.get("hours_worked") or 0.0) for e in w.get("daily_entries", [])),
                    "summary": self._generate_fallback_summary(w),
                    "source": "fallback"
                })
            return results


weekly_summarizer = WeeklySummarizer()
