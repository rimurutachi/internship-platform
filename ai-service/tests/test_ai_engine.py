"""Tests for AIEngine - main orchestrator for trend analysis"""
from services.ai_engine import AIEngine


def _make_eval(eval_id, company_id, company_name, university_id, university_name,
               student_id, total_score, final_grade, comments="Good overall performance."):
    return {
        "evaluation_id": eval_id,
        "internship_id": f"intern-{eval_id}",
        "student_id": student_id,
        "supervisor_id": "sup-001",
        "company_id": company_id,
        "company_name": company_name,
        "university_id": university_id,
        "university_name": university_name,
        "position": "Software Intern",
        "supervisor_comments": comments,
        "total_score": total_score,
        "final_grade": final_grade,
        "attendance": "regular",
        "punctuality": "regular",
        "criterion_scores": [
            {"criterion_code": "TECH", "criterion_name": "Technical Skills", "score": 8},
            {"criterion_code": "COMM", "criterion_name": "Communication", "score": 7},
        ],
        "approved_at": "2026-01-10T10:00:00Z"
    }


class TestAIEngine:
    def setup_method(self):
        self.engine = AIEngine()
        self.evaluations = [
            _make_eval("e1", "c1", "TechCorp", "u1", "CvSU", "s1", 85, 1.5,
                        "Excellent problem solving and technical skills in python development."),
            _make_eval("e2", "c1", "TechCorp", "u1", "CvSU", "s2", 80, 1.75,
                        "Good teamwork and communication abilities throughout."),
            _make_eval("e3", "c2", "DigitalInc", "u1", "CvSU", "s3", 70, 2.5,
                        "Average performance, needs improvement in time management."),
            _make_eval("e4", "c2", "DigitalInc", "u2", "DLSU", "s4", 75, 2.0,
                        "The student was reliable and showed strong work ethic."),
        ]

    # --- Health Check ---
    def test_health_status(self):
        health = self.engine.get_health_status()
        assert health["status"] == "healthy"
        assert health["version"] == "2.0.0-trends"
        assert "components" in health
        assert len(health["components"]) == 5
        assert all(v == "operational" for v in health["components"].values())

    def test_health_capabilities(self):
        health = self.engine.get_health_status()
        assert "capabilities" in health
        assert len(health["capabilities"]) > 0
        assert "Historical trend analysis" in health["capabilities"]

    # --- Trend Analysis ---
    def test_analyze_trends_returns_result(self):
        result = self.engine.analyze_trends(self.evaluations)
        assert result["status"] == "success"
        assert result["ai_version"] == "2.0.0-trends"
        assert "processing_time_ms" in result
        assert "generated_at" in result

    def test_analyze_trends_with_options(self):
        result = self.engine.analyze_trends(self.evaluations, {
            "include_recommendations": True,
            "top_n_skills": 5,
            "top_n_companies": 5
        })
        assert result["status"] == "success"

    def test_analyze_trends_with_detailed_analysis(self):
        result = self.engine.analyze_trends(self.evaluations, {
            "include_detailed_analysis": True
        })
        assert result["status"] == "success"
        assert "university_company_matrix" in result
        assert "skill_time_trends" in result
        assert "skills_by_company" in result

    # --- Dashboard Insights ---
    def test_dashboard_insights_returns_result(self):
        result = self.engine.get_dashboard_insights(self.evaluations)
        assert result["status"] == "success"
        assert result["total_evaluations"] == 4
        assert "insights" in result
        assert "quick_stats" in result

    def test_dashboard_insights_respects_max(self):
        result = self.engine.get_dashboard_insights(self.evaluations, max_insights=2)
        assert len(result["insights"]) <= 2

    # --- Company Performance ---
    def test_company_performance_returns_rankings(self):
        result = self.engine.analyze_company_performance(self.evaluations)
        assert result["status"] == "success"
        assert "rankings" in result
        assert result["total_companies"] > 0

    def test_company_performance_with_filter(self):
        result = self.engine.analyze_company_performance(
            self.evaluations, university_filter="u1"
        )
        assert result["status"] == "success"
        assert result["university_filter"] == "u1"

    # --- University Performance ---
    def test_university_performance_returns_result(self):
        result = self.engine.analyze_university_performance(self.evaluations)
        assert result["status"] == "success"
        assert "rankings" in result

    # --- University-Company Matrix ---
    def test_matrix_returns_result(self):
        result = self.engine.get_university_company_matrix(self.evaluations)
        assert result["status"] == "success"
        assert "matrix" in result

    # --- Skill Demands ---
    def test_skill_demands_returns_result(self):
        result = self.engine.analyze_skill_demands(self.evaluations)
        assert result["status"] == "success"
        assert "skills_by_company" in result
        assert "time_trends" in result
        assert "skill_gap" in result
        assert "recommendations" in result

    def test_skill_demands_with_company_filter(self):
        result = self.engine.analyze_skill_demands(self.evaluations, company_id="c1")
        assert result["status"] == "success"
