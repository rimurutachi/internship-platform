"""Shared test fixtures for AI Service"""
import pytest

@pytest.fixture
def sample_evaluation():
    """A single valid evaluation matching EvaluationData schema"""
    return {
        "evaluation_id": "test-eval-001",
        "internship_id": "test-intern-001",
        "student_id": "test-student-001",
        "supervisor_id": "test-supervisor-001",
        "company_id": "test-company-001",
        "company_name": "Tech Solutions Inc.",
        "university_id": "test-uni-001",
        "university_name": "Cavite State University",
        "position": "Software Developer Intern",
        "supervisor_comments": "The student demonstrated excellent problem solving skills. Great communication and teamwork abilities.",
        "total_score": 85.5,
        "final_grade": 1.5,
        "attendance": "regular",
        "punctuality": "regular",
        "criterion_scores": [
            {"criterion_code": "TECH", "criterion_name": "Technical Skills", "score": 9},
            {"criterion_code": "COMM", "criterion_name": "Communication", "score": 8},
        ],
        "approved_at": "2026-01-10T10:30:00Z"
    }

@pytest.fixture
def sample_evaluations(sample_evaluation):
    """Multiple evaluations for trend analysis"""
    eval2 = {**sample_evaluation}
    eval2["evaluation_id"] = "test-eval-002"
    eval2["company_name"] = "Digital Corp"
    eval2["company_id"] = "test-company-002"
    eval2["supervisor_comments"] = "Average performance. The student needs improvement in time management and documentation skills."
    eval2["total_score"] = 70.0
    eval2["final_grade"] = 2.5
    return [sample_evaluation, eval2]
