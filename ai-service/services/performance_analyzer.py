# ai-service/services/performance_analyzer.py
"""
Performance Analyzer Service
Detailed analysis of student performance by company and university.

Provides:
- Cross-tabulation of university × company performance
- Performance rating calculations
- Comparative analysis between entities
"""
import logging
from typing import List, Dict, Any, Optional
from collections import defaultdict
from statistics import mean, stdev

logger = logging.getLogger(__name__)


class PerformanceAnalyzer:
    """
    Analyzes student performance patterns across companies and universities.
    Generates actionable insights for internship placement decisions.
    """

    def __init__(self):
        # CvSU Grading Scale (1.0 = excellent, 5.0 = failing)
        self.GRADE_THRESHOLDS = {
            'excellent': 1.5,
            'very_good': 2.0,
            'good': 2.5,
            'satisfactory': 3.0,
            'passing': 3.5,
            'failing': 5.0
        }
        
        # Score thresholds (assuming 0-100 scale)
        self.SCORE_THRESHOLDS = {
            'excellent': 90,
            'very_good': 85,
            'good': 80,
            'satisfactory': 75,
            'passing': 60,
            'failing': 0
        }
        
        logger.info("🔵 PerformanceAnalyzer initialized")

    def analyze_university_company_matrix(
        self,
        evaluations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create a cross-tabulation matrix of university × company performance.
        
        This is the key analysis for: "Where do CvSU students perform best?"
        
        Returns:
            {
                'matrix': {
                    'CvSU': {
                        'Company A': {'avg_score': 85, 'avg_grade': 1.5, 'count': 10},
                        'Company B': {'avg_score': 65, 'avg_grade': 2.5, 'count': 5}
                    }
                },
                'best_matches': [
                    {'university': 'CvSU', 'company': 'Company A', 'reason': '...'}
                ],
                'avoid_matches': [
                    {'university': 'CvSU', 'company': 'Company B', 'reason': '...'}
                ]
            }
        """
        logger.info(f"🔵 Building university-company performance matrix from {len(evaluations)} evaluations")
        
        # Build the matrix: university_id -> company_id -> metrics
        matrix_data = defaultdict(lambda: defaultdict(lambda: {
            'scores': [],
            'grades': [],
            'sentiments': [],
            'company_name': '',
            'university_name': ''
        }))
        
        for e in evaluations:
            uni_id = e.get('university_id')
            comp_id = e.get('company_id')
            
            if not uni_id or not comp_id:
                continue
            
            cell = matrix_data[uni_id][comp_id]
            cell['university_name'] = e.get('university_name', 'Unknown')
            cell['company_name'] = e.get('company_name', 'Unknown')
            
            if e.get('total_score') is not None:
                cell['scores'].append(e['total_score'])
            if e.get('final_grade') is not None:
                cell['grades'].append(e['final_grade'])
        
        # Calculate aggregates
        matrix = {}
        for uni_id, companies in matrix_data.items():
            uni_name = None
            company_stats = {}
            
            for comp_id, data in companies.items():
                if not uni_name:
                    uni_name = data['university_name']
                
                stats = {
                    'company_id': comp_id,
                    'company_name': data['company_name'],
                    'evaluation_count': len(data['scores']) or len(data['grades']),
                    'average_score': round(mean(data['scores']), 2) if data['scores'] else None,
                    'average_grade': round(mean(data['grades']), 2) if data['grades'] else None,
                    'performance_label': self._get_performance_label(
                        mean(data['grades']) if data['grades'] else None
                    )
                }
                company_stats[data['company_name']] = stats
            
            matrix[uni_name or uni_id] = company_stats
        
        # Find best and worst matches
        best_matches = []
        avoid_matches = []
        
        for uni_name, companies in matrix.items():
            for comp_name, stats in companies.items():
                if stats['evaluation_count'] < 3:  # Need at least 3 evaluations for reliability
                    continue
                
                grade = stats['average_grade']
                if grade and grade <= self.GRADE_THRESHOLDS['very_good']:
                    best_matches.append({
                        'university': uni_name,
                        'company': comp_name,
                        'average_grade': grade,
                        'evaluation_count': stats['evaluation_count'],
                        'reason': f'{uni_name} students excel at {comp_name} with avg grade {grade}'
                    })
                elif grade and grade >= self.GRADE_THRESHOLDS['satisfactory']:
                    avoid_matches.append({
                        'university': uni_name,
                        'company': comp_name,
                        'average_grade': grade,
                        'evaluation_count': stats['evaluation_count'],
                        'reason': f'{uni_name} students underperform at {comp_name} with avg grade {grade}'
                    })
        
        # Sort by grade (best first for best_matches, worst first for avoid_matches)
        best_matches.sort(key=lambda x: x['average_grade'])
        avoid_matches.sort(key=lambda x: -x['average_grade'])
        
        logger.info(f"✅ Matrix built: {len(matrix)} universities, {len(best_matches)} best matches, {len(avoid_matches)} avoid matches")
        
        return {
            'matrix': matrix,
            'best_matches': best_matches[:10],
            'avoid_matches': avoid_matches[:10]
        }

    def analyze_company_ranking(
        self,
        evaluations: List[Dict[str, Any]],
        university_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Rank companies by student performance.
        Optionally filter by specific university.
        
        Args:
            evaluations: List of evaluation data
            university_filter: Optional university_id to filter by
        
        Returns:
            Ranked list of companies with performance metrics
        """
        logger.info(f"🔵 Ranking companies (university_filter={university_filter})")
        
        # Filter by university if specified
        if university_filter:
            evaluations = [e for e in evaluations if e.get('university_id') == university_filter]
        
        # Aggregate by company
        company_data = defaultdict(lambda: {
            'scores': [],
            'grades': [],
            'students': set(),
            'name': ''
        })
        
        for e in evaluations:
            comp_id = e.get('company_id')
            if not comp_id:
                continue
            
            company_data[comp_id]['name'] = e.get('company_name', 'Unknown')
            if e.get('student_id'):
                company_data[comp_id]['students'].add(e['student_id'])
            if e.get('total_score') is not None:
                company_data[comp_id]['scores'].append(e['total_score'])
            if e.get('final_grade') is not None:
                company_data[comp_id]['grades'].append(e['final_grade'])
        
        # Calculate rankings
        rankings = []
        for comp_id, data in company_data.items():
            if not data['grades'] and not data['scores']:
                continue
            
            avg_grade = mean(data['grades']) if data['grades'] else None
            avg_score = mean(data['scores']) if data['scores'] else None
            
            # Calculate consistency (lower stdev = more consistent)
            grade_consistency = None
            if len(data['grades']) >= 3:
                try:
                    grade_consistency = round(stdev(data['grades']), 2)
                except Exception:
                    pass
            
            rankings.append({
                'rank': 0,  # Will be set after sorting
                'company_id': comp_id,
                'company_name': data['name'],
                'total_students': len(data['students']),
                'total_evaluations': len(data['grades']) or len(data['scores']),
                'average_grade': round(avg_grade, 2) if avg_grade else None,
                'average_score': round(avg_score, 2) if avg_score else None,
                'grade_consistency': grade_consistency,
                'performance_label': self._get_performance_label(avg_grade),
                'recommendation': self._get_recommendation(avg_grade, len(data['grades']))
            })
        
        # Sort by grade (lower is better for CvSU)
        rankings.sort(key=lambda x: x['average_grade'] if x['average_grade'] else 999)
        
        # Assign ranks
        for i, r in enumerate(rankings):
            r['rank'] = i + 1
        
        logger.info(f"✅ Ranked {len(rankings)} companies")
        
        return rankings

    def compare_universities(
        self,
        evaluations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Compare performance between universities.
        
        Returns:
            {
                'rankings': [...],
                'comparison_insights': [...],
                'statistical_summary': {...}
            }
        """
        logger.info(f"🔵 Comparing universities from {len(evaluations)} evaluations")
        
        # Aggregate by university
        uni_data = defaultdict(lambda: {
            'scores': [],
            'grades': [],
            'students': set(),
            'companies': set(),
            'name': ''
        })
        
        for e in evaluations:
            uni_id = e.get('university_id')
            if not uni_id:
                continue
            
            uni_data[uni_id]['name'] = e.get('university_name', 'Unknown')
            if e.get('student_id'):
                uni_data[uni_id]['students'].add(e['student_id'])
            if e.get('company_id'):
                uni_data[uni_id]['companies'].add(e['company_id'])
            if e.get('total_score') is not None:
                uni_data[uni_id]['scores'].append(e['total_score'])
            if e.get('final_grade') is not None:
                uni_data[uni_id]['grades'].append(e['final_grade'])
        
        # Calculate rankings
        rankings = []
        for uni_id, data in uni_data.items():
            if not data['grades'] and not data['scores']:
                continue
            
            avg_grade = mean(data['grades']) if data['grades'] else None
            avg_score = mean(data['scores']) if data['scores'] else None
            
            rankings.append({
                'rank': 0,
                'university_id': uni_id,
                'university_name': data['name'],
                'total_students': len(data['students']),
                'total_companies': len(data['companies']),
                'total_evaluations': len(data['grades']) or len(data['scores']),
                'average_grade': round(avg_grade, 2) if avg_grade else None,
                'average_score': round(avg_score, 2) if avg_score else None,
                'performance_label': self._get_performance_label(avg_grade)
            })
        
        # Sort and rank
        rankings.sort(key=lambda x: x['average_grade'] if x['average_grade'] else 999)
        for i, r in enumerate(rankings):
            r['rank'] = i + 1
        
        # Generate comparison insights
        comparison_insights = []
        if len(rankings) >= 2:
            best = rankings[0]
            worst = rankings[-1]
            
            if best['average_grade'] and worst['average_grade']:
                diff = worst['average_grade'] - best['average_grade']
                comparison_insights.append({
                    'type': 'comparison',
                    'title': f'{best["university_name"]} leads in performance',
                    'description': f'{best["university_name"]} outperforms {worst["university_name"]} by {diff:.2f} grade points on average.'
                })
        
        # Statistical summary
        all_grades = [r['average_grade'] for r in rankings if r['average_grade']]
        statistical_summary = {
            'total_universities': len(rankings),
            'overall_average_grade': round(mean(all_grades), 2) if all_grades else None,
            'best_performing': rankings[0]['university_name'] if rankings else None,
            'total_students_analyzed': sum(r['total_students'] for r in rankings)
        }
        
        logger.info(f"✅ Compared {len(rankings)} universities")
        
        return {
            'rankings': rankings,
            'comparison_insights': comparison_insights,
            'statistical_summary': statistical_summary
        }

    def _get_performance_label(self, grade: Optional[float]) -> str:
        """Convert grade to human-readable performance label."""
        if grade is None:
            return 'unknown'
        
        if grade <= self.GRADE_THRESHOLDS['excellent']:
            return 'excellent'
        elif grade <= self.GRADE_THRESHOLDS['very_good']:
            return 'very_good'
        elif grade <= self.GRADE_THRESHOLDS['good']:
            return 'good'
        elif grade <= self.GRADE_THRESHOLDS['satisfactory']:
            return 'satisfactory'
        elif grade <= self.GRADE_THRESHOLDS['passing']:
            return 'passing'
        else:
            return 'failing'

    def _get_recommendation(self, grade: Optional[float], eval_count: int) -> str:
        """Generate placement recommendation based on performance."""
        if grade is None:
            return 'insufficient_data'
        
        if eval_count < 3:
            return 'needs_more_data'
        
        if grade <= self.GRADE_THRESHOLDS['very_good']:
            return 'highly_recommended'
        elif grade <= self.GRADE_THRESHOLDS['good']:
            return 'recommended'
        elif grade <= self.GRADE_THRESHOLDS['satisfactory']:
            return 'acceptable'
        else:
            return 'not_recommended'
