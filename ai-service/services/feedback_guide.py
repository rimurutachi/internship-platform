# ai-service/services/feedback_guide.py
"""
Feedback Quality Guide
Provides real-time suggestions to help supervisors write better evaluations.
Analyzes draft text and suggests improvements for completeness, balance, and quality.
"""
import re


class FeedbackGuide:
    """
    Intelligent guidance system for evaluation quality improvement.
    Provides actionable suggestions in real-time as supervisors write.
    """

    def __init__(self):
        # Quality thresholds
        self.thresholds = {
            'min_words': 50,
            'recommended_words': 100,
            'min_skills': 2,
            'recommended_skills': 4,
            'min_sentences': 3
        }
        
        # Generic phrase detection
        self.generic_phrases = [
            'good work', 'nice job', 'well done', 'great job', 'did well',
            'performed adequately', 'satisfactory', 'acceptable work'
        ]
        
        # Specific indicators (opposite of generic)
        self.specific_indicators = [
            'completed', 'achieved', 'developed', 'implemented', 'demonstrated',
            'delivered', 'solved', 'improved', 'reduced', 'increased', 'created'
        ]

    def analyze_draft(self, text: str, current_analysis: dict) -> dict:
        """
        Analyze draft evaluation and provide improvement suggestions.
        
        Args:
            text: Draft evaluation text
            current_analysis: Dict with features, sentiment, bias_check from AI engine
        
        Returns:
            {
                "suggestions": [list of improvement suggestions],
                "quality_score": float (0-100),
                "readiness": bool,
                "strengths": [list of what's good],
                "metrics": {...}
            }
        """
        suggestions = []
        strengths = []
        
        # Calculate metrics
        word_count = len(text.split())
        sentence_count = len(re.split(r'[.!?]+', text.strip()))
        
        # Extract analysis data
        features = current_analysis.get('features', {})
        sentiment = current_analysis.get('sentiment', {})
        bias_check = current_analysis.get('bias_check', {})
        
        skill_count = len(features.get('technical_skills', [])) + len(features.get('soft_skills', []))
        
        # Check 1: Length adequacy
        if word_count < self.thresholds['min_words']:
            suggestions.append({
                "type": "length",
                "severity": "high",
                "message": f"Evaluation is too brief ({word_count} words). Add more details.",
                "current": word_count,
                "target": self.thresholds['min_words'],
                "examples": [
                    "Describe specific projects or tasks the intern completed",
                    "Mention concrete examples of their performance",
                    "Explain both strengths and areas for improvement"
                ]
            })
        elif word_count < self.thresholds['recommended_words']:
            suggestions.append({
                "type": "length",
                "severity": "medium",
                "message": f"Good start! Consider adding more detail ({word_count}/{self.thresholds['recommended_words']} words).",
                "current": word_count,
                "target": self.thresholds['recommended_words'],
                "examples": [
                    "Add specific achievements or milestones",
                    "Describe how they handled challenges"
                ]
            })
        else:
            strengths.append("Comprehensive length with sufficient detail")
        
        # Check 2: Skill coverage
        if skill_count == 0:
            suggestions.append({
                "type": "skills",
                "severity": "high",
                "message": "No specific skills mentioned. Add technical and soft skills.",
                "prompt": "What skills did the intern demonstrate? (e.g., programming languages, communication, teamwork)",
                "examples": [
                    "Technical: programming, databases, tools, frameworks",
                    "Soft: communication, teamwork, problem-solving, time management"
                ]
            })
        elif skill_count < self.thresholds['min_skills']:
            suggestions.append({
                "type": "skills",
                "severity": "medium",
                "message": f"Only {skill_count} skill(s) mentioned. Add more for comprehensive evaluation.",
                "prompt": "Mention both technical competencies and interpersonal skills",
                "examples": [
                    "Did they learn new technologies?",
                    "How did they work with the team?",
                    "What tools or methods did they master?"
                ]
            })
        elif skill_count >= self.thresholds['recommended_skills']:
            strengths.append(f"Excellent skill coverage ({skill_count} skills identified)")
        else:
            strengths.append(f"Good skill identification ({skill_count} skills)")
        
        # Check 3: Balance (positive vs negative feedback)
        sentiment_score = sentiment.get('score', 0)
        sentiment_label = sentiment.get('label', 'neutral')
        tone = sentiment.get('tone', 'neutral')
        
        if abs(sentiment_score) > 0.7 and tone != "balanced":
            if sentiment_score > 0:
                suggestions.append({
                    "type": "balance",
                    "severity": "low",
                    "message": "Very positive feedback. Consider adding areas for growth.",
                    "tip": "Even excellent interns benefit from developmental feedback",
                    "examples": [
                        "What skills could they develop further?",
                        "What new challenges could they take on?"
                    ]
                })
            else:
                suggestions.append({
                    "type": "balance",
                    "severity": "medium",
                    "message": "Very critical feedback. Balance with positive aspects or constructive guidance.",
                    "tip": "Constructive feedback helps interns understand how to improve",
                    "examples": [
                        "What did they do well?",
                        "What specific steps can help them improve?"
                    ]
                })
        elif tone == "balanced":
            strengths.append("Well-balanced feedback addressing both strengths and areas for improvement")
        
        # Check 4: Specificity
        is_generic = self._is_too_generic(text)
        has_specifics = self._has_specific_details(text)
        
        if is_generic and not has_specifics:
            suggestions.append({
                "type": "specificity",
                "severity": "high",
                "message": "Evaluation uses generic phrases. Add specific examples.",
                "generic_detected": [phrase for phrase in self.generic_phrases if phrase in text.lower()],
                "examples": [
                    "Replace 'did good work' with 'completed X project with Y results'",
                    "Instead of 'nice job', describe specific achievements",
                    "Mention dates, metrics, or concrete outcomes"
                ]
            })
        elif has_specifics:
            strengths.append("Specific examples and concrete details provided")
        
        # Check 5: Structure (sentences)
        if sentence_count < self.thresholds['min_sentences']:
            suggestions.append({
                "type": "structure",
                "severity": "medium",
                "message": f"Add more sentences for clarity ({sentence_count} found, minimum {self.thresholds['min_sentences']}).",
                "tip": "Break down feedback into distinct points",
                "examples": [
                    "Opening: Overall impression",
                    "Middle: Specific strengths and skills",
                    "Closing: Areas for improvement and recommendations"
                ]
            })
        
        # Check 6: Consistency (from bias check)
        if not bias_check.get('passed', True):
            bias_flags = bias_check.get('flags', [])
            suggestions.append({
                "type": "consistency",
                "severity": "high",
                "message": "Potential inconsistencies detected between text and ratings.",
                "issues": [flag.get('message', '') for flag in bias_flags[:2]],
                "tip": "Ensure your written feedback aligns with numeric ratings"
            })
        elif bias_check.get('consistency_score', 0) > 0.8:
            strengths.append("Consistent alignment between text and ratings")
        
        # Calculate quality score (0-100)
        quality_score = self._calculate_quality_score(
            word_count, skill_count, sentiment, is_generic, has_specifics,
            sentence_count, bias_check
        )
        
        # Determine readiness
        high_severity_count = sum(1 for s in suggestions if s['severity'] == 'high')
        readiness = len(suggestions) == 0 or (high_severity_count == 0 and quality_score >= 70)
        
        return {
            "suggestions": suggestions,
            "strengths": strengths,
            "quality_score": round(quality_score, 1),
            "readiness": readiness,
            "metrics": {
                "word_count": word_count,
                "sentence_count": sentence_count,
                "skill_count": skill_count,
                "sentiment_balance": sentiment_label,
                "has_specific_examples": has_specifics
            }
        }

    def _is_too_generic(self, text: str) -> bool:
        """
        Detect if text uses too many generic phrases.
        """
        text_lower = text.lower()
        generic_count = sum(1 for phrase in self.generic_phrases if phrase in text_lower)
        return generic_count >= 2  # 2+ generic phrases = too generic

    def _has_specific_details(self, text: str) -> bool:
        """
        Detect if text contains specific, actionable details.
        """
        text_lower = text.lower()
        
        # Check for action verbs
        specific_count = sum(1 for indicator in self.specific_indicators if indicator in text_lower)
        
        # Check for numbers/metrics
        has_numbers = bool(re.search(r'\d+', text))
        
        # Check for proper nouns/specific names (capitalized words mid-sentence)
        has_proper_nouns = bool(re.search(r'\b[A-Z][a-z]+\b', text))
        
        return specific_count >= 2 or (has_numbers and specific_count >= 1) or has_proper_nouns

    def _calculate_quality_score(self, word_count: int, skill_count: int, 
                                  sentiment: dict, is_generic: bool, has_specifics: bool,
                                  sentence_count: int, bias_check: dict) -> float:
        """
        Calculate overall quality score (0-100).
        """
        score = 0
        
        # Length score (0-25 points)
        if word_count >= self.thresholds['recommended_words']:
            score += 25
        elif word_count >= self.thresholds['min_words']:
            score += 15
        else:
            score += (word_count / self.thresholds['min_words']) * 10
        
        # Skill coverage score (0-25 points)
        if skill_count >= self.thresholds['recommended_skills']:
            score += 25
        elif skill_count >= self.thresholds['min_skills']:
            score += 15
        else:
            score += skill_count * 5
        
        # Specificity score (0-20 points)
        if has_specifics and not is_generic:
            score += 20
        elif has_specifics:
            score += 12
        elif not is_generic:
            score += 8
        
        # Balance score (0-15 points)
        tone = sentiment.get('tone', 'neutral')
        if tone == "balanced":
            score += 15
        elif tone == "constructive":
            score += 10
        else:
            score += 5
        
        # Consistency score (0-15 points)
        consistency = bias_check.get('consistency_score', 0.5)
        score += consistency * 15
        
        return min(100, score)
