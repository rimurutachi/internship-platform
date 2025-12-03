from utils.skill_dictionary import SKILL_DICTIONARY
from utils.text_cleaner import clean_text

class FeatureExtractor:
    def extract(self, text: str) -> dict:
        cleaned_text = clean_text(text)
        words = set(cleaned_text.split())

        extracted_technical = set()
        extracted_soft = set()

        for word in words:
            if word in SKILL_DICTIONARY['technical']:
                extracted_technical.add(word)
            if word in SKILL_DICTIONARY['soft']:
                extracted_soft.add(word)

        for phrase in ["problem solving", "node js", "time management", "work ethic"]:
            if phrase in cleaned_text:
                if phrase == "problem solving":
                    extracted_soft.add("problem solving")
                elif phrase == "node js":
                    extracted_technical.add("node js")
                elif phrase == "time management":
                    extracted_soft.add("time management")
                elif phrase == "work ethic":
                    extracted_soft.add("work ethic")

        result = {
            "technical_skills": sorted(list(extracted_technical)),
            "soft_skills": sorted(list(extracted_soft)),
        }
        
        return result