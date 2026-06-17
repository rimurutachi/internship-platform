"""Tests for PerformanceAnalyzer - company/university performance analysis"""
from services.performance_analyzer import PerformanceAnalyzer


def _make_eval(company_id, company_name, university_id, university_name,
               student_id, total_score, final_grade):
    """Helper to create evaluation dicts matching Pydantic schema"""
    return {
        "evaluation_id": f"eval-{student_id}",
        "internship_id": f"intern-{student_id}",
        "student_id": student_id,
        "supervisor_id": "sup-001",
        "company_id": company_id,
        "company_name": company_name,
        "university_id": university_id,
        "university_name": university_name,
        "position": "Software Intern",
        "supervisor_comments": "Good performance overall.",
        "total_score": total_score,
        "final_grade": final_grade,
        "attendance": "regular",
        "punctuality": "regular",
        "criterion_scores": [],
        "approved_at": "2026-01-10T10:00:00Z"
    }


class TestPerformanceAnalyzer:
    def setup_method(self):
        self.analyzer = PerformanceAnalyzer()
        # Create test dataset: 2 companies, 2 universities, 6 students
        self.evaluations = [
            _make_eval("c1", "TechCorp", "u1", "CvSU", "s1", 85, 1.5),
            _make_eval("c1", "TechCorp", "u1", "CvSU", "s2", 80, 1.75),
            _make_eval("c1", "TechCorp", "u1", "CvSU", "s3", 90, 1.25),
            _make_eval("c2", "DigitalInc", "u1", "CvSU", "s4", 60, 3.0),
            _make_eval("c2", "DigitalInc", "u2", "DLSU", "s5", 75, 2.0),
            _make_eval("c2", "DigitalInc", "u2", "DLSU", "s6", 70, 2.5),
        ]

    # --- Performance Label Tests ---
    def test_performance_label_excellent(self):
        assert self.analyzer._get_performance_label(1.0) == "excellent"
        assert self.analyzer._get_performance_label(1.5) == "excellent"

    def test_performance_label_very_good(self):
        assert self.analyzer._get_performance_label(1.75) == "very_good"
        assert self.analyzer._get_performance_label(2.0) == "very_good"

    def test_performance_label_good(self):
        assert self.analyzer._get_performance_label(2.25) == "good"
        assert self.analyzer._get_performance_label(2.5) == "good"

    def test_performance_label_satisfactory(self):
        assert self.analyzer._get_performance_label(3.0) == "satisfactory"

    def test_performance_label_failing(self):
        assert self.analyzer._get_performance_label(5.0) == "failing"

    def test_performance_label_none(self):
        assert self.analyzer._get_performance_label(None) == "unknown"

    # --- Recommendation Tests ---
    def test_recommendation_highly_recommended(self):
        assert self.analyzer._get_recommendation(1.5, 5) == "highly_recommended"

    def test_recommendation_recommended(self):
        assert self.analyzer._get_recommendation(2.25, 5) == "recommended"

    def test_recommendation_acceptable(self):
        assert self.analyzer._get_recommendation(3.0, 5) == "acceptable"

    def test_recommendation_not_recommended(self):
        assert self.analyzer._get_recommendation(4.0, 5) == "not_recommended"

    def test_recommendation_insufficient_data(self):
        assert self.analyzer._get_recommendation(None, 5) == "insufficient_data"

    def test_recommendation_needs_more_data(self):
        assert self.analyzer._get_recommendation(1.5, 2) == "needs_more_data"

    # --- Company Ranking Tests ---
    def test_company_ranking_returns_list(self):
        rankings = self.analyzer.analyze_company_ranking(self.evaluations)
        assert isinstance(rankings, list)
        assert len(rankings) == 2  # 2 companies

    def test_company_ranking_order(self):
        """Better grade (lower number) should rank first"""
        rankings = self.analyzer.analyze_company_ranking(self.evaluations)
        assert rankings[0]["company_name"] == "TechCorp"  # avg 1.5 < avg 2.5
        assert rankings[0]["rank"] == 1
        assert rankings[1]["rank"] == 2

    def test_company_ranking_metrics(self):
        rankings = self.analyzer.analyze_company_ranking(self.evaluations)
        tech_corp = rankings[0]
        assert tech_corp["total_students"] == 3
        assert tech_corp["total_evaluations"] == 3
        assert tech_corp["average_grade"] is not None
        assert tech_corp["performance_label"] in ["excellent", "very_good", "good"]

    def test_company_ranking_with_university_filter(self):
        rankings = self.analyzer.analyze_company_ranking(self.evaluations, "u2")
        # Only DLSU students at DigitalInc
        assert len(rankings) == 1
        assert rankings[0]["company_name"] == "DigitalInc"

    # --- University Comparison Tests ---
    def test_university_comparison_returns_structure(self):
        result = self.analyzer.compare_universities(self.evaluations)
        assert "rankings" in result
        assert "comparison_insights" in result
        assert "statistical_summary" in result

    def test_university_comparison_rankings(self):
        result = self.analyzer.compare_universities(self.evaluations)
        assert len(result["rankings"]) == 2  # CvSU and DLSU
        # Best performing should be rank 1
        assert result["rankings"][0]["rank"] == 1

    def test_university_comparison_summary(self):
        result = self.analyzer.compare_universities(self.evaluations)
        summary = result["statistical_summary"]
        assert summary["total_universities"] == 2
        assert summary["overall_average_grade"] is not None
        assert summary["total_students_analyzed"] == 6

    # --- University-Company Matrix Tests ---
    def test_matrix_returns_structure(self):
        result = self.analyzer.analyze_university_company_matrix(self.evaluations)
        assert "matrix" in result
        assert "best_matches" in result
        assert "avoid_matches" in result

    def test_matrix_has_correct_universities(self):
        result = self.analyzer.analyze_university_company_matrix(self.evaluations)
        matrix = result["matrix"]
        assert "CvSU" in matrix
        assert "DLSU" in matrix

    def test_matrix_cell_metrics(self):
        result = self.analyzer.analyze_university_company_matrix(self.evaluations)
        matrix = result["matrix"]
        cvsu_techcorp = matrix["CvSU"]["TechCorp"]
        assert cvsu_techcorp["evaluation_count"] == 3
        assert cvsu_techcorp["average_score"] is not None
        assert cvsu_techcorp["average_grade"] is not None

    # --- Edge Cases ---
    def test_empty_evaluations(self):
        rankings = self.analyzer.analyze_company_ranking([])
        assert rankings == []

    def test_evaluations_with_missing_ids(self):
        """Evaluations without company_id should be skipped"""
        evals = [{"total_score": 80, "final_grade": 1.5}]
        rankings = self.analyzer.analyze_company_ranking(evals)
        assert len(rankings) == 0
