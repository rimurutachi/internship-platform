"""Tests for FeatureExtractor - skill extraction from text"""
from services.feature_extractor import FeatureExtractor


class TestFeatureExtractor:
    def setup_method(self):
        self.extractor = FeatureExtractor()

    def test_extract_technical_skills(self):
        text = "The student demonstrated proficiency in python, javascript, and database management."
        result = self.extractor.extract(text)
        assert "technical_skills" in result
        assert isinstance(result["technical_skills"], list)
        # At least one technical skill should be found
        assert len(result["technical_skills"]) > 0

    def test_extract_soft_skills(self):
        text = "Excellent communication, leadership, and teamwork abilities throughout the internship."
        result = self.extractor.extract(text)
        assert "soft_skills" in result
        assert isinstance(result["soft_skills"], list)
        assert len(result["soft_skills"]) > 0

    def test_extract_both_skill_types(self):
        text = "Strong problem solving skills in python development with excellent communication and teamwork."
        result = self.extractor.extract(text)
        assert len(result["technical_skills"]) > 0 or len(result["soft_skills"]) > 0

    def test_empty_text_returns_empty_lists(self):
        result = self.extractor.extract("")
        assert result["technical_skills"] == []
        assert result["soft_skills"] == []

    def test_text_with_no_skills(self):
        result = self.extractor.extract("The weather was nice today.")
        # Should return empty or minimal results
        assert isinstance(result["technical_skills"], list)
        assert isinstance(result["soft_skills"], list)

    def test_return_structure(self):
        result = self.extractor.extract("Any text here")
        assert "technical_skills" in result
        assert "soft_skills" in result
        # Results should be sorted
        assert result["technical_skills"] == sorted(result["technical_skills"])
        assert result["soft_skills"] == sorted(result["soft_skills"])

    def test_multi_word_phrases(self):
        """Test extraction of multi-word skill phrases like 'problem solving'"""
        text = "The intern showed great problem solving abilities and strong work ethic."
        result = self.extractor.extract(text)
        # Check that multi-word phrases can be detected
        all_skills = result["technical_skills"] + result["soft_skills"]
        assert len(all_skills) > 0

    def test_case_insensitive_extraction(self):
        """Skills should be found regardless of case"""
        text = "The student used PYTHON and JavaScript for their projects."
        result = self.extractor.extract(text)
        assert len(result["technical_skills"]) > 0
