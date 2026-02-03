# ai-service/services/skill_trend_analyzer.py
"""
Skill Trend Analyzer Service
Analyzes skill demands and trends across companies and time.

Provides:
- Skills most valued by each company
- Skill demand trends over time
- Gap analysis between university strengths and company needs
"""
import logging
from typing import List, Dict, Any, Optional
from collections import Counter, defaultdict
from datetime import datetime
from dateutil import parser as date_parser

from services.feature_extractor import FeatureExtractor

logger = logging.getLogger(__name__)


class SkillTrendAnalyzer:
    """
    Analyzes skill patterns from evaluation feedback.
    Helps identify what companies value and where students excel.
    """

    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        logger.info("🔵 SkillTrendAnalyzer initialized")

    def analyze_skills_by_company(
        self,
        evaluations: List[Dict[str, Any]],
        top_n: int = 10
    ) -> Dict[str, Any]:
        """
        Analyze which skills are most valued at each company.
        
        Returns:
            {
                'by_company': {
                    'Company A': {
                        'technical': [{'skill': 'react', 'count': 15}, ...],
                        'soft': [{'skill': 'communication', 'count': 20}, ...]
                    }
                },
                'company_skill_profiles': [
                    {
                        'company_name': 'Company A',
                        'primary_skills': ['react', 'node.js'],
                        'soft_skill_focus': ['communication', 'teamwork'],
                        'skill_diversity': 12
                    }
                ]
            }
        """
        logger.info(f"🔵 Analyzing skills by company from {len(evaluations)} evaluations")
        
        # Aggregate skills by company
        company_skills = defaultdict(lambda: {
            'technical': [],
            'soft': [],
            'name': ''
        })
        
        for e in evaluations:
            comp_id = e.get('company_id')
            text = e.get('supervisor_comments', '')
            
            if not comp_id or not text or len(text) < 10:
                continue
            
            company_skills[comp_id]['name'] = e.get('company_name', 'Unknown')
            
            # Extract skills from feedback text
            features = self.feature_extractor.extract(text)
            company_skills[comp_id]['technical'].extend(features.get('technical_skills', []))
            company_skills[comp_id]['soft'].extend(features.get('soft_skills', []))
        
        # Calculate per-company skill rankings
        by_company = {}
        company_profiles = []
        
        for comp_id, data in company_skills.items():
            tech_counts = Counter(data['technical'])
            soft_counts = Counter(data['soft'])
            
            by_company[data['name']] = {
                'technical': [
                    {'skill': skill, 'count': count}
                    for skill, count in tech_counts.most_common(top_n)
                ],
                'soft': [
                    {'skill': skill, 'count': count}
                    for skill, count in soft_counts.most_common(top_n)
                ]
            }
            
            # Create skill profile
            primary_skills = [s for s, c in tech_counts.most_common(3)]
            soft_focus = [s for s, c in soft_counts.most_common(3)]
            
            company_profiles.append({
                'company_id': comp_id,
                'company_name': data['name'],
                'primary_technical_skills': primary_skills,
                'primary_soft_skills': soft_focus,
                'skill_diversity': len(tech_counts) + len(soft_counts),
                'total_mentions': sum(tech_counts.values()) + sum(soft_counts.values())
            })
        
        # Sort profiles by total mentions
        company_profiles.sort(key=lambda x: -x['total_mentions'])
        
        logger.info(f"✅ Analyzed skills for {len(company_profiles)} companies")
        
        return {
            'by_company': by_company,
            'company_skill_profiles': company_profiles
        }

    def analyze_skill_trends_over_time(
        self,
        evaluations: List[Dict[str, Any]],
        top_n: int = 10
    ) -> Dict[str, Any]:
        """
        Analyze how skill demands change over time.
        
        Returns:
            {
                'monthly_trends': {
                    '2025-07': {'react': 10, 'python': 8, ...},
                    '2025-08': {'react': 12, 'python': 15, ...}
                },
                'growing_skills': [{'skill': 'python', 'growth_rate': 1.5}],
                'declining_skills': [{'skill': 'php', 'growth_rate': 0.5}],
                'stable_skills': [{'skill': 'communication', 'growth_rate': 1.0}]
            }
        """
        logger.info(f"🔵 Analyzing skill trends over time")
        
        # Group evaluations by month
        monthly_skills = defaultdict(lambda: {'technical': [], 'soft': []})
        
        for e in evaluations:
            text = e.get('supervisor_comments', '')
            approved_at = e.get('approved_at')
            
            if not text or len(text) < 10 or not approved_at:
                continue
            
            try:
                dt = date_parser.parse(approved_at)
                month_key = dt.strftime('%Y-%m')
            except Exception:
                continue
            
            features = self.feature_extractor.extract(text)
            monthly_skills[month_key]['technical'].extend(features.get('technical_skills', []))
            monthly_skills[month_key]['soft'].extend(features.get('soft_skills', []))
        
        # Calculate monthly counts
        monthly_trends = {}
        for month, skills in sorted(monthly_skills.items()):
            all_skills = skills['technical'] + skills['soft']
            counts = Counter(all_skills)
            monthly_trends[month] = dict(counts.most_common(top_n))
        
        # Calculate growth rates (compare first half to second half)
        sorted_months = sorted(monthly_trends.keys())
        if len(sorted_months) >= 2:
            mid_point = len(sorted_months) // 2
            first_half = sorted_months[:mid_point]
            second_half = sorted_months[mid_point:]
            
            first_counts = Counter()
            second_counts = Counter()
            
            for month in first_half:
                first_counts.update(monthly_trends[month])
            for month in second_half:
                second_counts.update(monthly_trends[month])
            
            # Calculate growth rates
            all_skills = set(first_counts.keys()) | set(second_counts.keys())
            skill_growth = []
            
            for skill in all_skills:
                first_count = first_counts.get(skill, 0)
                second_count = second_counts.get(skill, 0)
                
                if first_count > 0:
                    growth_rate = second_count / first_count
                elif second_count > 0:
                    growth_rate = float('inf')  # New skill
                else:
                    growth_rate = 1.0
                
                skill_growth.append({
                    'skill': skill,
                    'first_period_count': first_count,
                    'second_period_count': second_count,
                    'growth_rate': round(growth_rate, 2) if growth_rate != float('inf') else 'new'
                })
            
            # Categorize
            growing = [s for s in skill_growth if isinstance(s['growth_rate'], (int, float)) and s['growth_rate'] > 1.2]
            declining = [s for s in skill_growth if isinstance(s['growth_rate'], (int, float)) and s['growth_rate'] < 0.8]
            stable = [s for s in skill_growth if isinstance(s['growth_rate'], (int, float)) and 0.8 <= s['growth_rate'] <= 1.2]
            
            growing.sort(key=lambda x: -x['growth_rate'] if isinstance(x['growth_rate'], (int, float)) else 0)
            declining.sort(key=lambda x: x['growth_rate'] if isinstance(x['growth_rate'], (int, float)) else 0)
        else:
            growing = []
            declining = []
            stable = []
        
        logger.info(f"✅ Analyzed skill trends: {len(growing)} growing, {len(declining)} declining")
        
        return {
            'monthly_trends': monthly_trends,
            'growing_skills': growing[:top_n],
            'declining_skills': declining[:top_n],
            'stable_skills': stable[:top_n]
        }

    def analyze_skill_gap(
        self,
        evaluations: List[Dict[str, Any]],
        target_company_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze gaps between university-provided skills and company demands.
        
        If target_company_id is provided, analyze gap for that specific company.
        Otherwise, analyze overall skill gaps.
        
        Returns:
            {
                'high_demand_low_supply': [...],  # Skills companies want but students lack
                'oversupplied': [...],  # Skills mentioned often but less valued
                'well_matched': [...]  # Skills with good alignment
            }
        """
        logger.info(f"🔵 Analyzing skill gaps (target_company={target_company_id})")
        
        # Filter evaluations if target company specified
        if target_company_id:
            evaluations = [e for e in evaluations if e.get('company_id') == target_company_id]
        
        if not evaluations:
            return {
                'high_demand_low_supply': [],
                'oversupplied': [],
                'well_matched': [],
                'analysis_note': 'No evaluations available for analysis'
            }
        
        # Extract all skills and their grades
        skill_performance = defaultdict(lambda: {'count': 0, 'grades': []})
        
        for e in evaluations:
            text = e.get('supervisor_comments', '')
            grade = e.get('final_grade')
            
            if not text or len(text) < 10:
                continue
            
            features = self.feature_extractor.extract(text)
            all_skills = features.get('technical_skills', []) + features.get('soft_skills', [])
            
            for skill in all_skills:
                skill_performance[skill]['count'] += 1
                if grade is not None:
                    skill_performance[skill]['grades'].append(grade)
        
        # Analyze each skill
        skill_analysis = []
        for skill, data in skill_performance.items():
            avg_grade = sum(data['grades']) / len(data['grades']) if data['grades'] else None
            skill_analysis.append({
                'skill': skill,
                'mention_count': data['count'],
                'average_grade_when_mentioned': round(avg_grade, 2) if avg_grade else None,
                'performance_indicator': self._get_skill_performance(avg_grade)
            })
        
        # Categorize based on frequency and performance
        high_demand_low_supply = []  # Frequently mentioned but with poor grades
        oversupplied = []  # Rarely mentioned but with good grades
        well_matched = []  # Frequently mentioned with good grades
        
        total_evals = len(evaluations)
        for s in skill_analysis:
            freq_rate = s['mention_count'] / total_evals if total_evals > 0 else 0
            grade = s['average_grade_when_mentioned']
            
            if grade is None:
                continue
            
            if freq_rate > 0.3 and grade > 2.5:  # High demand, poor performance
                high_demand_low_supply.append(s)
            elif freq_rate < 0.1 and grade <= 2.0:  # Low demand, good performance
                oversupplied.append(s)
            elif freq_rate > 0.2 and grade <= 2.0:  # Good match
                well_matched.append(s)
        
        # Sort by relevance
        high_demand_low_supply.sort(key=lambda x: -x['mention_count'])
        well_matched.sort(key=lambda x: -x['mention_count'])
        
        logger.info(f"✅ Skill gap analysis complete")
        
        return {
            'high_demand_low_supply': high_demand_low_supply[:10],
            'oversupplied': oversupplied[:10],
            'well_matched': well_matched[:10],
            'total_skills_analyzed': len(skill_analysis),
            'analysis_note': f'Based on {total_evals} evaluations'
        }

    def get_skill_recommendations(
        self,
        evaluations: List[Dict[str, Any]],
        university_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate skill development recommendations based on market demands.
        
        Returns list of recommendations for curriculum/training focus.
        """
        logger.info(f"🔵 Generating skill recommendations (university={university_id})")
        
        # Get overall skill trends
        time_trends = self.analyze_skill_trends_over_time(evaluations)
        company_skills = self.analyze_skills_by_company(evaluations)
        
        recommendations = []
        
        # Recommend growing skills
        for skill_data in time_trends.get('growing_skills', [])[:5]:
            if skill_data.get('growth_rate') == 'new' or skill_data.get('growth_rate', 0) > 1.5:
                recommendations.append({
                    'type': 'skill_focus',
                    'priority': 'high',
                    'skill': skill_data['skill'],
                    'title': f'Increase training on {skill_data["skill"].title()}',
                    'description': f'{skill_data["skill"].title()} demand has grown significantly. Consider adding to curriculum.',
                    'supporting_data': skill_data
                })
        
        # Identify universally valued skills
        skill_by_company_count = defaultdict(int)
        for company_name, skills in company_skills.get('by_company', {}).items():
            for tech_skill in skills.get('technical', []):
                skill_by_company_count[tech_skill['skill']] += 1
            for soft_skill in skills.get('soft', []):
                skill_by_company_count[soft_skill['skill']] += 1
        
        # Skills valued by multiple companies
        universal_skills = [
            skill for skill, count in skill_by_company_count.items()
            if count >= 3  # Mentioned by at least 3 companies
        ]
        
        for skill in universal_skills[:3]:
            recommendations.append({
                'type': 'universal_skill',
                'priority': 'medium',
                'skill': skill,
                'title': f'{skill.title()} is valued across multiple companies',
                'description': f'{skill.title()} is mentioned by {skill_by_company_count[skill]} companies. Ensure students have strong foundation.',
                'supporting_data': {'company_count': skill_by_company_count[skill]}
            })
        
        logger.info(f"✅ Generated {len(recommendations)} skill recommendations")
        
        return recommendations

    def _get_skill_performance(self, grade: Optional[float]) -> str:
        """Convert grade to skill performance indicator."""
        if grade is None:
            return 'unknown'
        if grade <= 1.5:
            return 'excellent'
        elif grade <= 2.0:
            return 'good'
        elif grade <= 2.5:
            return 'average'
        else:
            return 'needs_improvement'
