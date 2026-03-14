"""
Narrative Generator Service
Generates CvSU OJT narrative reports from daily accomplishments using NLP.

Follows the official CvSU OJT Narrative Report format:
  - INTRODUCTION (Objectives, Significance, Time & Place)
  - THE LINKAGE ESTABLISHMENT (Location, Background, Vision/Mission, Goals, Org Structure)
  - THE TRAINING AREA (Department Function, Org Structure, Facilities, Equipment, SOPs)
  - THE TRAINING EXPERIENCE (Tasks Performed, Observed Strengths, Insights, Problems Encountered)
  - SUMMARY
  - REFERENCES

Sections with data from daily reports are AI-generated.
Sections requiring manual input use [PLACEHOLDER] markers.
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
from collections import Counter

logger = logging.getLogger(__name__)

# Placeholder tag used for sections the student must fill manually
_PH = "[TO BE FILLED BY STUDENT]"


class NarrativeGenerator:
    """
    AI-powered narrative generator that compiles daily reports into a
    CvSU-formatted OJT Narrative Report draft.
    """

    # Technical skills keywords
    TECHNICAL_SKILLS = {
        'programming', 'coding', 'development', 'software', 'web', 'mobile', 'database',
        'python', 'javascript', 'java', 'react', 'node', 'sql', 'html', 'css',
        'api', 'backend', 'frontend', 'testing', 'debugging', 'git', 'version control',
        'machine learning', 'ai', 'data analysis', 'excel', 'powerpoint', 'word',
        'photoshop', 'design', 'ui', 'ux', 'figma', 'cybersecurity', 'networking',
        'cloud', 'aws', 'azure', 'docker', 'linux', 'windows', 'server',
        'ticketing', 'helpdesk', 'troubleshooting', 'system administration',
        'network management', 'biometrics', 'cms', 'monitoring', 'cloning',
        'pc standardization', 'cable management', 'account setup', 'workstation',
    }

    # Soft skills keywords
    SOFT_SKILLS = {
        'communication', 'teamwork', 'collaboration', 'leadership', 'problem-solving',
        'time management', 'organization', 'adaptability', 'flexibility', 'creativity',
        'critical thinking', 'attention to detail', 'presentation', 'writing',
        'customer service', 'interpersonal', 'multitasking', 'initiative', 'motivation',
        'professional', 'punctual', 'reliable', 'responsible', 'ethical',
    }

    # Theme keywords
    THEME_KEYWORDS = {
        'learning': ['learned', 'learning', 'study', 'understand', 'knowledge', 'training'],
        'collaboration': ['team', 'collaborate', 'work with', 'together', 'help', 'assist'],
        'problem-solving': ['solve', 'fix', 'debug', 'resolve', 'troubleshoot', 'issue'],
        'development': ['develop', 'build', 'create', 'implement', 'design', 'code'],
        'improvement': ['improve', 'enhance', 'optimize', 'refactor', 'upgrade'],
        'communication': ['present', 'meeting', 'discuss', 'report', 'document'],
    }

    def __init__(self):
        logger.info("🔧 Initializing Narrative Generator (CvSU OJT Format)")

    # ------------------------------------------------------------------
    # PUBLIC API
    # ------------------------------------------------------------------

    def generate_narrative(
        self,
        student_name: str,
        company_name: str,
        position: str,
        department: Optional[str],
        start_date: str,
        end_date: str,
        total_hours: Optional[float],
        daily_reports: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Generate a CvSU OJT narrative report draft from daily reports."""
        logger.info(f"📝 Generating narrative for {student_name} at {company_name}")

        sorted_reports = sorted(daily_reports, key=lambda x: x.get('report_date', ''))
        all_text = self._compile_all_text(sorted_reports)
        skills = self._extract_skills(all_text)
        themes = self._identify_themes(all_text)

        sections = self._generate_sections(
            student_name=student_name,
            company_name=company_name,
            position=position,
            department=department,
            start_date=start_date,
            end_date=end_date,
            total_hours=total_hours,
            sorted_reports=sorted_reports,
            skills=skills,
            themes=themes,
        )

        narrative_draft = self._compile_narrative(sections)
        suggestions = self._generate_suggestions(sorted_reports, skills, themes)
        word_count = len(narrative_draft.split())

        result = {
            "success": True,
            "narrative_draft": narrative_draft,
            "sections": sections,
            "word_count": word_count,
            "key_themes": themes[:5],
            "skills_mentioned": skills[:10],
            "suggestions": suggestions,
            "generated_at": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        }

        logger.info(f"✅ Generated narrative: {word_count} words, {len(themes)} themes, {len(skills)} skills")
        return result

    # ------------------------------------------------------------------
    # TEXT ANALYSIS HELPERS
    # ------------------------------------------------------------------

    def _compile_all_text(self, reports: List[Dict]) -> str:
        parts = []
        for r in reports:
            if r.get('activities'):
                parts.append(r['activities'])
            if r.get('learnings'):
                parts.append(r['learnings'])
        return ' '.join(parts).lower()

    def _extract_skills(self, text: str) -> List[str]:
        found = []
        for skill in self.TECHNICAL_SKILLS:
            if skill in text:
                found.append(skill.title())
        for skill in self.SOFT_SKILLS:
            if skill in text:
                found.append(skill.title())
        return list(dict.fromkeys(found))

    def _identify_themes(self, text: str) -> List[str]:
        counts = Counter()
        for theme, keywords in self.THEME_KEYWORDS.items():
            c = sum(1 for kw in keywords if kw in text)
            if c > 0:
                counts[theme] = c
        return [t for t, _ in counts.most_common()]

    # ------------------------------------------------------------------
    # DATE HELPERS
    # ------------------------------------------------------------------

    def _parse_dates(self, start_date: str, end_date: str, num_reports: int):
        """Return (start_formatted, end_formatted, duration_days, total_report_days)."""
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            return (
                start.strftime('%B %d, %Y'),
                end.strftime('%B %d, %Y'),
                (end - start).days,
                num_reports,
            )
        except Exception:
            return start_date, end_date, num_reports, num_reports

    # ------------------------------------------------------------------
    # SECTION GENERATORS (CvSU OJT Format)
    # ------------------------------------------------------------------

    def _generate_sections(
        self,
        student_name: str,
        company_name: str,
        position: str,
        department: Optional[str],
        start_date: str,
        end_date: str,
        total_hours: Optional[float],
        sorted_reports: List[Dict],
        skills: List[str],
        themes: List[str],
    ) -> Dict[str, str]:
        start_fmt, end_fmt, duration_days, total_days = self._parse_dates(
            start_date, end_date, len(sorted_reports)
        )
        dept_str = department or _PH
        hours_int = int(total_hours) if total_hours else None

        sections: Dict[str, str] = {}

        # ── INTRODUCTION ──────────────────────────────────────────────
        sections['introduction'] = self._section_introduction(
            student_name, company_name, position, dept_str,
            start_fmt, end_fmt, duration_days, hours_int,
        )
        sections['introduction_objectives'] = self._section_objectives(
            company_name, position, dept_str,
        )
        sections['introduction_significance'] = self._section_significance()
        sections['introduction_time_and_place'] = self._section_time_and_place(
            company_name, start_fmt, end_fmt, hours_int,
        )

        # ── THE LINKAGE ESTABLISHMENT (placeholder) ───────────────────
        sections['linkage_location'] = self._section_linkage_location(company_name)
        sections['linkage_background'] = self._section_linkage_background(company_name)
        sections['linkage_vision_mission'] = self._section_linkage_vision_mission(company_name)
        sections['linkage_goals'] = self._section_linkage_goals(company_name)
        sections['linkage_org_structure'] = self._section_linkage_org_structure(company_name)

        # ── THE TRAINING AREA (placeholder) ───────────────────────────
        sections['training_area_function'] = self._section_training_area_function(
            company_name, dept_str,
        )
        sections['training_area_org_structure'] = self._section_training_area_org(
            company_name, dept_str,
        )
        sections['training_area_facilities'] = self._section_training_area_facilities()
        sections['training_area_equipment'] = self._section_training_area_equipment()
        sections['training_area_sop'] = self._section_training_area_sop(company_name)

        # ── THE TRAINING EXPERIENCE (AI-generated) ────────────────────
        sections['experience_tasks'] = self._section_tasks_performed(
            sorted_reports, company_name, position, dept_str,
        )
        sections['experience_strengths'] = self._section_observed_strengths(
            sorted_reports, skills,
        )
        sections['experience_insights'] = self._section_insights(
            sorted_reports, skills, themes, company_name,
        )
        sections['experience_problems'] = self._section_problems_encountered(sorted_reports)

        # ── SUMMARY (AI-generated) ────────────────────────────────────
        sections['summary'] = self._section_summary(
            student_name, company_name, position, dept_str,
            start_fmt, end_fmt, skills, themes, sorted_reports,
        )

        # ── REFERENCES (placeholder) ─────────────────────────────────
        sections['references'] = self._section_references()

        return sections

    # ── INTRODUCTION sub-sections ─────────────────────────────────────

    def _section_introduction(
        self, name, company, position, dept,
        start_fmt, end_fmt, duration_days, hours,
    ) -> str:
        hours_phrase = f" to complete {hours} hours of practicum" if hours else ""
        return (
            f"On-the-job training (OJT) or others called Internship Program is part of this "
            f"university's curriculum that aims to train and orient students about work and their future "
            f"career. One of the oldest and most popular types of workplace learning is on-the-job "
            f"training (OJT), which bridges the gap between theory and practice. OJT, in contrast to "
            f"classroom-based training programs, takes place in real-world work environments with "
            f"tools, equipment, and processes that employees will use on a regular basis. This "
            f"approach makes it possible to apply knowledge right away, giving trainees a clear "
            f"understanding of how their training relates to their performance on the job. In the "
            f"Philippines, internships are required and acknowledged by different universities as a "
            f"stepping stone to experience to work in a professional environment in different fields "
            f"available.\n\n"
            f"OJT or Internship programs can build up your skills and knowledge through "
            f"hands-on experience on your workplace, meet several co-workers as well as co-interns "
            f"that will help you to complete your journey as an intern in a certain company that you "
            f"work in. Opportunities are also built up in internships, recruiters or part of HR "
            f"department observe every intern in their overall performance and how they contribute "
            f"to the company. Thus, to succeed in your career, you need to develop and improve "
            f"your critical thinking skills, which internships are designed to provide."
        )

    def _section_objectives(self, company, position, dept) -> str:
        return (
            f"Cavite State University – Bacoor Campus designed a curriculum for the students to "
            f"complete an on-the-job training (OJT) program as part of their academic requirements. "
            f"Through this off-campus activity, the trainee aimed to gain work experience which will "
            f"give him/her realistic exposure in an organizational environment.\n\n"
            f"Specifically, the trainee aimed to:\n\n"
            f"1. Gain technical skills and experience through different tasks in the {dept} department.\n"
            f"2. Collaborate with other people in finishing tasks, projects, and goals within the department.\n"
            f"3. Enhance communication and leadership skills; and\n"
            f"4. Explore different skills and knowledge throughout the OJT period."
        )

    def _section_significance(self) -> str:
        return (
            f"OJT, or on-the-job training, is a type of training that can help students to "
            f"become more familiar with the realities of working, in some cases, on the job training "
            f"may lead to a stable and fulfilling career. One of the significances of On-the-Job "
            f"Training is the ability to work, learn, and gain experience through professional "
            f"environment, similar to what we used to in a school setting but this time, we will work "
            f"in a certain company wherein it has policies, rules and regulations inside and outside "
            f"the company, dos and don'ts, and much more. OJT provides students and new "
            f"employees on-the-job workplace learning that cannot be replicated in a classroom "
            f"environment, allowing them to gain technical skills and the key soft skills of "
            f"communication, teamwork, and problem solving on the job. This experiential learning "
            f"approach promotes employability because it exposes learners to real-world "
            f"approaches to tackling problems.\n\n"
            f"experience, on-the-job industry experience, and professional networks that "
            f"significantly improve job readiness and career prospects. For businesses, OJT is an "
            f"efficient recruitment and talent-building tool, as they can test potential workers while "
            f"making meaningful contributions to their firms. OJT closes the gap between school "
            f"curriculum and industry needs, equipping graduates with practical skills and work-"
            f"readiness skills employers need, ultimately resulting in reduced training expense for "
            f"companies and improved job performance results for job market entrants."
        )

    def _section_time_and_place(self, company, start_fmt, end_fmt, hours) -> str:
        hours_phrase = f" The trainee is required to complete {hours} hours of OJT." if hours else ""
        return (
            f"The On-the-Job Training started on {start_fmt}, and ends on {end_fmt}. "
            f"It took place at {company}, located in {_PH}. "
            f"The usual working hours is {_PH} every {_PH}.{hours_phrase}"
        )

    # ── THE LINKAGE ESTABLISHMENT sub-sections ────────────────────────

    def _section_linkage_location(self, company) -> str:
        return (
            f"{company} is located at {_PH}. "
            f"{_PH}"
        )

    def _section_linkage_background(self, company) -> str:
        return (
            f"{company} {_PH}.\n\n"
            f"[Provide a brief history and background of the company, including when it was "
            f"founded, its founders, major milestones, and its growth over the years.]"
        )

    def _section_linkage_vision_mission(self, company) -> str:
        return (
            f"{company} Mission\n\n"
            f"\"{_PH}\"\n\n"
            f"{company} Vision\n\n"
            f"\"{_PH}\""
        )

    def _section_linkage_goals(self, company) -> str:
        return (
            f"In line with their Mission and Vision, {company} goals are the following:\n\n"
            f"1. {_PH}\n"
            f"2. {_PH}\n"
            f"3. {_PH}\n"
            f"4. {_PH}\n"
            f"5. {_PH}"
        )

    def _section_linkage_org_structure(self, company) -> str:
        return (
            f"[Insert organizational chart of {company} here.]\n\n"
            f"[Describe the overall organizational structure and the duties and responsibilities "
            f"of each key role/department within {company}.]"
        )

    # ── THE TRAINING AREA sub-sections ────────────────────────────────

    def _section_training_area_function(self, company, dept) -> str:
        return (
            f"{company} {dept} department oversees all technologies and systems "
            f"used by the organization. {_PH}\n\n"
            f"[Describe the primary function of the department/training area where the "
            f"internship took place, including the services it provides and its role within "
            f"the organization.]"
        )

    def _section_training_area_org(self, company, dept) -> str:
        return (
            f"[Insert organizational chart of the {dept} department here.]\n\n"
            f"The functions and responsibilities of the {dept} department are the following:\n\n"
            f"• {_PH}\n"
            f"• {_PH}\n"
            f"• {_PH}\n"
            f"• {_PH}\n"
            f"• {_PH}"
        )

    def _section_training_area_facilities(self) -> str:
        return (
            f"[Insert photos of the facilities/office/workspace here.]\n\n"
            f"[Describe the facilities available in the training area.]"
        )

    def _section_training_area_equipment(self) -> str:
        return (
            f"The equipment that the trainees are using is provided by the organization. "
            f"{_PH}\n\n"
            f"[List and describe the equipment provided – computers, peripherals, software, etc.]"
        )

    def _section_training_area_sop(self, company) -> str:
        return (
            f"All employees within {company} begin their professional duties from "
            f"{_PH} to {_PH}, {_PH}. "
            f"{_PH}\n\n"
            f"[Describe the standard operating procedures, work schedules, break policies, "
            f"dress code, and other rules applicable to trainees.]"
        )

    # ── THE TRAINING EXPERIENCE sub-sections (AI-generated) ───────────

    def _section_tasks_performed(
        self, reports: List[Dict], company: str, position: str, dept: str,
    ) -> str:
        """Generate the Tasks Performed/Specific Activities section from daily reports."""
        if not reports:
            return f"[Describe the tasks performed during the internship at {company}.]"

        paragraphs = []
        total = len(reports)
        early = reports[:max(1, total // 3)]
        mid = reports[max(1, total // 3):max(2, 2 * total // 3)]
        late = reports[max(2, 2 * total // 3):]

        # Opening
        paragraphs.append(
            f"Before our internship started at {company}, one of the talent specialists in the "
            f"organization {_PH} toured us into the company including the facilities, "
            f"departments, and the production area. After that, we were introduced to the "
            f"{dept} department."
        )

        # Duties overview – extracted from the most frequent activity keywords
        all_activities = [r.get('activities', '') for r in reports]
        duties = self._extract_duty_list(all_activities)
        if duties:
            duties_list = "\n".join(f"• {d}" for d in duties)
            paragraphs.append(
                f"The trainees were instructed about the duties and the responsibilities "
                f"that they will undergo, which include the following:\n\n{duties_list}"
            )

        # Early phase
        if early:
            early_text = " ".join(r.get('activities', '') for r in early)
            paragraphs.append(
                f"During the initial phase of the internship, the trainee focused on "
                f"orientation and familiarization with the company's processes and systems. "
                f"{self._clean_and_summarize(early_text, max_len=600)}"
            )

        # Middle phase
        if mid:
            mid_text = " ".join(r.get('activities', '') for r in mid)
            paragraphs.append(
                f"As the trainee progressed, more responsibilities were assigned. "
                f"{self._clean_and_summarize(mid_text, max_len=600)}"
            )

        # Late phase
        if late:
            late_text = " ".join(r.get('activities', '') for r in late)
            paragraphs.append(
                f"In the final phase of deployment, the trainee was able to independently "
                f"handle tasks and contribute meaningfully to the team's projects. "
                f"{self._clean_and_summarize(late_text, max_len=600)}"
            )

        # Closing
        paragraphs.append(
            f"The good thing about this internship is that our seniors guide and teach us on "
            f"different tasks given by them every day, they observe how we perform with each task, "
            f"collaborating with other specialists and interns, managing tasks and workload, and "
            f"much more."
        )

        return "\n\n".join(paragraphs)

    def _section_observed_strengths(
        self, reports: List[Dict], skills: List[str],
    ) -> str:
        """Generate 'Observed Strengths of the Training Area' from learnings."""
        strength_keywords = [
            'organized', 'professional', 'supportive', 'progressive',
            'collaborative', 'flexible', 'efficient', 'friendly',
            'well-structured', 'innovative', 'respectful',
        ]
        found = []
        all_text = self._compile_all_text(reports)
        for kw in strength_keywords:
            if kw in all_text:
                found.append(kw.title())

        # Build a bullet list of strengths
        if not found:
            found = [
                "They treat each other equally",
                "The team has a progressive mindset",
                "They are flexible in every task",
                "Collaborating in solving problems and concerns within the company",
            ]
            return (
                "The trainees observed the following strengths in the training area:\n\n"
                + "\n".join(f"• {s}" for s in found)
                + f"\n\n{_PH}"
            )

        bullets = "\n".join(f"• {s}" for s in found)
        return (
            f"The trainees observed the following strengths in the training area:\n\n"
            f"{bullets}\n\n"
            f"[Add or edit the observed strengths based on your actual experience.]"
        )

    def _section_insights(
        self, reports: List[Dict], skills: List[str],
        themes: List[str], company: str,
    ) -> str:
        """Generate the 'Insights' section from learnings data."""
        learnings = [r.get('learnings', '') for r in reports if r.get('learnings')]
        if not learnings:
            return (
                f"Regarding the trainee's insights from the beginning of his/her time at "
                f"{company}, he/she observed that {_PH}. "
                f"[Describe personal insights, observations about work culture, professional "
                f"growth, and overall reflections on the experience.]"
            )

        learnings_text = " ".join(learnings)
        cleaned = self._clean_and_summarize(learnings_text, max_len=800)

        skills_phrase = ""
        if skills:
            top_skills = ", ".join(skills[:6])
            skills_phrase = (
                f" The trainee developed skills such as {top_skills} through hands-on "
                f"experience during the deployment."
            )

        return (
            f"Regarding the trainee's insights from the beginning of his/her time at "
            f"{company}, {cleaned}\n\n"
            f"The trainee noted significant personal learning and improvement during the "
            f"internship. The experience exposed the trainee to various professional "
            f"practices and industry standards.{skills_phrase}"
        )

    def _section_problems_encountered(self, reports: List[Dict]) -> str:
        """Generate 'Problems Encountered' from challenge-related report content."""
        challenge_kws = [
            'challenge', 'difficult', 'issue', 'problem', 'struggle',
            'error', 'bug', 'trouble', 'slow', 'delay', 'lack',
        ]
        challenge_texts = []
        for r in reports:
            text = (r.get('activities', '') + ' ' + (r.get('learnings', '') or '')).lower()
            if any(kw in text for kw in challenge_kws):
                challenge_texts.append(r.get('activities', ''))

        if not challenge_texts:
            return (
                f"During the internship experience, the trainee encountered several "
                f"challenges that created hurdles for the efficiency and performance of the "
                f"department. {_PH}\n\n"
                f"[Describe specific problems encountered during the internship period "
                f"and how they were addressed or what lessons were learned from them.]"
            )

        challenges_summary = self._clean_and_summarize(
            " ".join(challenge_texts), max_len=800,
        )
        return (
            f"During the internship experience, the trainee encountered several "
            f"challenges that created hurdles for the efficiency and performance of the "
            f"department. {challenges_summary}\n\n"
            f"These challenges taught the trainee the importance of problem-solving, "
            f"seeking help when needed, and maintaining a positive attitude in the face "
            f"of difficulties."
        )

    # ── SUMMARY (AI-generated) ────────────────────────────────────────

    def _section_summary(
        self, name, company, position, dept,
        start_fmt, end_fmt, skills, themes, reports,
    ) -> str:
        total_reports = len(reports)
        skills_phrase = ""
        if skills:
            top = ", ".join(skills[:5])
            skills_phrase = (
                f" The trainee developed skills in {top} through hands-on experience."
            )

        return (
            f"To have a successful career in the future, the trainee must build and develop "
            f"his/her skills and responsibilities by training in a professional setting. By working in a "
            f"professional setting, you will gain experience and explore new knowledge and skills "
            f"that emphasize the qualities of being a professional. Being in this industry becomes a "
            f"stepping stone to gain, learn, and exploring new experiences by this internship.\n\n"
            f"{name}, a student at Cavite State University – "
            f"Bacoor City Campus, began the On-the-Job Training journey on {start_fmt}. "
            f"The trainee completes the internship period on {end_fmt}. The trainee "
            f"was given the role of {position} at {company}.\n\n"
            f"The training experience was highly valuable in terms of learning experience "
            f"and personal development for the intern. The trainee acquired substantial exposure to "
            f"professional work environments, developed the ability to work "
            f"efficiently under tight deadlines by executing multiple simultaneous tasks, and "
            f"enhanced more robust critical reasoning and decision-making capabilities.{skills_phrase}\n\n"
            f"Overall, the internship at {company} gave the trainee rich practical "
            f"experience that closed the gap between theory and practice. The exposure to "
            f"professional work environments and real-world tasks "
            f"greatly boosted the trainee's professional growth and employability. Even with the "
            f"experience of facing operational issues in the department, the experience justified the "
            f"necessity for ongoing learning, flexibility, and teamwork within the field."
        )

    # ── REFERENCES (placeholder) ──────────────────────────────────────

    def _section_references(self) -> str:
        return (
            f"[List all references cited in the narrative report using APA format.]\n\n"
            f"Example:\n"
            f"Vocal, J., & Barriga, E. & Bartican, J. & Leon, C. & Encina, J. & Larra, L. & "
            f"Tupas, A. (2023). EFFECT OF INTERNSHIP ON PERSONAL AND PROFESSIONAL "
            f"DEVELOPMENT OF THE SELECTED COLLEGE GRADUATES. "
            f"10.13140/RG.2.2.24340.48728."
        )

    # ------------------------------------------------------------------
    # UTILITY HELPERS
    # ------------------------------------------------------------------

    def _extract_duty_list(self, activity_texts: List[str], max_duties: int = 8) -> List[str]:
        """Extract common duty phrases from activities using simple frequency analysis."""
        # Combine all activities
        combined = " ".join(activity_texts).lower()

        # Common duty patterns
        duty_patterns = [
            (r'troubleshoot\w*', 'Aid in troubleshooting on system units, equipment, and laptops'),
            (r'ticketing|helpdesk|help desk', 'Assist problems and concerns through the company\'s ticketing system'),
            (r'monitor\w*\s+(?:cms|system|call|sms)', 'Monitor system concerns such as SMS history, call lines, and accounts'),
            (r'check\w*\s+asset|asset\w*\s+monitor', 'Checking and monitoring assets of the company'),
            (r'server|network|connect', 'Identify problems within assets, servers, and systems'),
            (r'collaborat\w*|pair\s+program', 'Collaborate with specialists on complex problems'),
            (r'test\w*|debug\w*|fix\w*', 'Testing and debugging system issues'),
            (r'document\w*|report\w*', 'Documentation and reporting of tasks completed'),
            (r'develop\w*|build\w*|implement\w*|code\w*|program\w*', 'Development and implementation of assigned projects'),
            (r'design\w*|ui\w*|ux\w*|layout|figma', 'Design and layout of user interfaces'),
            (r'meet\w*|standup|huddle', 'Attend team meetings and huddles'),
            (r'deploy\w*|release|launch', 'Deployment and release management'),
            (r'review\w*|code\s+review', 'Code review and quality assurance'),
            (r'research\w*|study\w*|learn\w*', 'Research and self-study of new technologies'),
        ]

        duties = []
        for pattern, label in duty_patterns:
            if re.search(pattern, combined):
                duties.append(label)
            if len(duties) >= max_duties:
                break

        return duties

    def _clean_and_summarize(self, text: str, max_len: int = 500) -> str:
        """Clean and format text for narrative prose."""
        if not text or len(text.strip()) < 10:
            return ""

        text = re.sub(r'\s+', ' ', text).strip()

        if text and text[0].islower():
            text = text[0].upper() + text[1:]

        if text and text[-1] not in '.!?':
            text += '.'

        if len(text) > max_len:
            sentences = text.split('.')
            result = []
            length = 0
            for s in sentences:
                if length + len(s) < max_len - 50:
                    result.append(s)
                    length += len(s)
                else:
                    break
            text = '.'.join(result) + '.' if result else text[:max_len - 3] + '...'

        return text

    # ------------------------------------------------------------------
    # COMPILE FULL NARRATIVE
    # ------------------------------------------------------------------

    def _compile_narrative(self, sections: Dict[str, str]) -> str:
        """Compile all sections into the CvSU OJT narrative format."""
        section_order = [
            # INTRODUCTION
            ('introduction', 'INTRODUCTION'),
            ('introduction_objectives', 'Objectives of the On-the-Job Training'),
            ('introduction_significance', 'Significance of On-the-Job Training'),
            ('introduction_time_and_place', 'Time and Place of the On-the-Job Training'),
            # THE LINKAGE ESTABLISHMENT
            ('linkage_location', 'THE LINKAGE ESTABLISHMENT\n\nLocation of the Establishment'),
            ('linkage_background', 'Background/Profile of the Establishment'),
            ('linkage_vision_mission', 'Vision and Mission Statements of the Establishment'),
            ('linkage_goals', 'Goals and Objectives of the Establishment'),
            ('linkage_org_structure', 'Overall Organizational Structure and Duties and Responsibilities'),
            # THE TRAINING AREA
            ('training_area_function', 'THE TRAINING AREA\n\nDepartment Function'),
            ('training_area_org_structure', 'Organizational Structure of the Department, Functions, and Responsibilities'),
            ('training_area_facilities', 'Facilities'),
            ('training_area_equipment', 'Equipment'),
            ('training_area_sop', 'Standard Operating Procedures'),
            # THE TRAINING EXPERIENCE
            ('experience_tasks', 'THE TRAINING EXPERIENCE\n\nTasks Performed/Specific Activities Assigned'),
            ('experience_strengths', 'Observed Strengths of the Training Area'),
            ('experience_insights', 'Insights'),
            ('experience_problems', 'Problems Encountered'),
            # SUMMARY
            ('summary', 'SUMMARY'),
            # REFERENCES
            ('references', 'REFERENCES'),
        ]

        parts = []
        for key, title in section_order:
            if key in sections and sections[key]:
                parts.append(f"{title}\n\n{sections[key]}")

        return "\n\n\n".join(parts)

    # ------------------------------------------------------------------
    # SUGGESTIONS
    # ------------------------------------------------------------------

    def _generate_suggestions(
        self,
        reports: List[Dict],
        skills: List[str],
        themes: List[str],
    ) -> List[str]:
        suggestions = []

        has_learnings = any(r.get('learnings') for r in reports)

        if not has_learnings:
            suggestions.append(
                "Add key learnings in your daily reports — they feed the Insights section."
            )

        if len(skills) < 5:
            suggestions.append(
                "Mention more specific skills (technical and soft) in your daily reports."
            )

        if len(reports) < 10:
            suggestions.append(
                "More daily reports will produce a richer Training Experience section."
            )

        # CvSU-format specific suggestions
        suggestions.append(
            "Fill in the LINKAGE ESTABLISHMENT sections: company background, "
            "vision/mission, goals, and organizational chart."
        )
        suggestions.append(
            "Fill in the TRAINING AREA sections: department function, facilities, "
            "equipment, and standard operating procedures."
        )
        suggestions.append(
            "Add the Biographical Data, Acknowledgement, and Appendices pages "
            "manually — these are personal sections not generated by AI."
        )
        suggestions.append(
            "Insert photos/figures for facilities, equipment, and organizational charts "
            "where indicated by placeholders."
        )

        return suggestions[:7]


# Singleton instance
narrative_generator = NarrativeGenerator()
