# ai-service/services/trend_analyzer.py
"""
Main Trend Analyzer Service
Orchestrates all trend analysis components for historical evaluation data.

Purpose: Analyze approved evaluations to provide decision support insights.
- Which companies are best for which university's students?
- What skills are most valued by each company?
- How is student performance trending over time?
"""
import logging
from typing import List, Dict, Any
from collections import Counter, defaultdict
from datetime import datetime
from dateutil import parser as date_parser

from services.feature_extractor import FeatureExtractor
from services.enhanced_sentiment_analyzer import EnhancedSentimentAnalyzer

logger = logging.getLogger(__name__)


class TrendAnalyzer:
    """
    Main orchestrator for trend analysis.
    Aggregates data from multiple evaluations to generate insights.
    """

    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self.sentiment_analyzer = EnhancedSentimentAnalyzer()
        
        # Performance thresholds (CvSU grading: 1.0 best, 5.0 worst)
        self.GRADE_EXCELLENT = 1.5
        self.GRADE_GOOD = 2.0
        self.GRADE_AVERAGE = 2.5
        self.GRADE_BELOW_AVERAGE = 3.0
        
        # Score thresholds (assuming 0-100 scale for total_score)
        self.SCORE_EXCELLENT = 90
        self.SCORE_GOOD = 80
        self.SCORE_AVERAGE = 70
        self.SCORE_BELOW_AVERAGE = 60
        
        logger.info("🔵 TrendAnalyzer initialized with FeatureExtractor and EnhancedSentimentAnalyzer")

    def analyze(self, evaluations: List[Dict[str, Any]], options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Main analysis method - processes all evaluations and generates comprehensive trends.
        
        Args:
            evaluations: List of evaluation data dicts (already validated by Pydantic)
            options: Analysis options (top_n_skills, top_n_companies, include_recommendations)
        
        Returns:
            Complete trend analysis result with insights, performance stats, and recommendations
        """
        options = options or {}
        top_n_skills = options.get('top_n_skills', 10)
        top_n_companies = options.get('top_n_companies', 10)
        include_recommendations = options.get('include_recommendations', True)
        
        logger.info(f"🔵 Starting trend analysis for {len(evaluations)} evaluations")
        
        # Initialize aggregation containers
        company_data = defaultdict(lambda: {
            'evaluations': [],
            'scores': [],
            'grades': [],
            'sentiments': [],
            'skills': [],
            'students': set()
        })
        
        university_data = defaultdict(lambda: {
            'evaluations': [],
            'scores': [],
            'grades': [],
            'sentiments': [],
            'companies': defaultdict(list),  # company_name -> scores
            'students': set()
        })
        
        all_skills = {'technical': [], 'soft': []}
        all_sentiments = []
        monthly_sentiments = defaultdict(list)
        
        # Process each evaluation
        for eval_data in evaluations:
            try:
                self._process_single_evaluation(
                    eval_data,
                    company_data,
                    university_data,
                    all_skills,
                    all_sentiments,
                    monthly_sentiments
                )
            except Exception as e:
                logger.warning(f"⚠️ Error processing evaluation {eval_data.get('evaluation_id')}: {e}")
                continue
        
        logger.info(f"✅ Processed evaluations: {len(all_sentiments)} with sentiment data")
        
        # Calculate analysis period
        analysis_period = self._calculate_analysis_period(evaluations)
        
        # Generate all analysis components
        company_performance = self._calculate_company_performance(company_data, top_n_companies)
        university_performance = self._calculate_university_performance(university_data)
        skill_trends = self._calculate_skill_trends(all_skills, len(evaluations), top_n_skills)
        sentiment_trends = self._calculate_sentiment_trends(monthly_sentiments)
        
        # Generate insights (top summary findings)
        insights = self._generate_insights(
            company_performance,
            university_performance,
            skill_trends,
            sentiment_trends,
            len(evaluations)
        )
        
        # Generate recommendations (decision support)
        recommendations = []
        if include_recommendations:
            recommendations = self._generate_recommendations(
                company_performance,
                university_performance,
                university_data
            )
        
        logger.info(f"✅ Trend analysis complete: {len(insights)} insights, {len(recommendations)} recommendations")
        
        return {
            'total_evaluations_analyzed': len(evaluations),
            'analysis_period': analysis_period,
            'insights': insights,
            'company_performance': company_performance,
            'university_performance': university_performance,
            'skill_trends': skill_trends,
            'sentiment_trends': sentiment_trends,
            'recommendations': recommendations
        }

    def _process_single_evaluation(
        self,
        eval_data: Dict[str, Any],
        company_data: Dict,
        university_data: Dict,
        all_skills: Dict,
        all_sentiments: List,
        monthly_sentiments: Dict
    ):
        """Process a single evaluation and aggregate its data."""
        company_id = eval_data.get('company_id')
        company_name = eval_data.get('company_name', 'Unknown Company')
        university_id = eval_data.get('university_id')
        university_name = eval_data.get('university_name', 'Unknown University')
        student_id = eval_data.get('student_id')
        
        # Get text for analysis
        text = eval_data.get('supervisor_comments', '')
        
        # Extract features (skills)
        if text and len(text.strip()) >= 10:
            features = self.feature_extractor.extract(text)
            sentiment = self.sentiment_analyzer.analyze(text)
            
            # Store skills
            all_skills['technical'].extend(features.get('technical_skills', []))
            all_skills['soft'].extend(features.get('soft_skills', []))
            
            # Store sentiment
            sentiment_score = sentiment.get('score', 0)
            all_sentiments.append(sentiment_score)
            
            # Store for company
            company_data[company_id]['sentiments'].append(sentiment_score)
            company_data[company_id]['skills'].extend(
                features.get('technical_skills', []) + features.get('soft_skills', [])
            )
            
            # Store for university
            university_data[university_id]['sentiments'].append(sentiment_score)
            
            # Monthly sentiment tracking
            approved_at = eval_data.get('approved_at')
            if approved_at:
                try:
                    dt = date_parser.parse(approved_at)
                    month_key = dt.strftime('%Y-%m')
                    monthly_sentiments[month_key].append(sentiment_score)
                except Exception:
                    pass
        
        # Store scores and grades
        total_score = eval_data.get('total_score')
        final_grade = eval_data.get('final_grade')
        
        if total_score is not None:
            company_data[company_id]['scores'].append(total_score)
            university_data[university_id]['scores'].append(total_score)
            university_data[university_id]['companies'][company_name].append(total_score)
        
        if final_grade is not None:
            company_data[company_id]['grades'].append(final_grade)
            university_data[university_id]['grades'].append(final_grade)
        
        # Track unique students
        if student_id:
            company_data[company_id]['students'].add(student_id)
            university_data[university_id]['students'].add(student_id)
        
        # Store evaluation reference
        company_data[company_id]['evaluations'].append(eval_data)
        company_data[company_id]['name'] = company_name
        university_data[university_id]['evaluations'].append(eval_data)
        university_data[university_id]['name'] = university_name

    def _calculate_analysis_period(self, evaluations: List[Dict]) -> Dict[str, Any]:
        """Calculate the time period covered by the evaluations."""
        dates = []
        for e in evaluations:
            approved_at = e.get('approved_at')
            if approved_at:
                try:
                    dates.append(date_parser.parse(approved_at))
                except Exception:
                    pass
        
        if not dates:
            today = datetime.now()
            return {
                'start_date': today.strftime('%Y-%m-%d'),
                'end_date': today.strftime('%Y-%m-%d'),
                'total_months': 0
            }
        
        start_date = min(dates)
        end_date = max(dates)
        total_months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month) + 1
        
        return {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'total_months': total_months
        }

    def _calculate_company_performance(self, company_data: Dict, top_n: int) -> List[Dict]:
        """Calculate performance statistics per company."""
        performances = []
        
        for company_id, data in company_data.items():
            if not data['evaluations']:
                continue
            
            avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
            avg_grade = sum(data['grades']) / len(data['grades']) if data['grades'] else 3.0
            avg_sentiment = sum(data['sentiments']) / len(data['sentiments']) if data['sentiments'] else 0
            
            # Get sentiment label
            if avg_sentiment > 0.3:
                sentiment_label = 'positive'
            elif avg_sentiment < -0.3:
                sentiment_label = 'negative'
            else:
                sentiment_label = 'neutral'
            
            # Get performance rating based on grade (CvSU: 1.0 best)
            if avg_grade <= self.GRADE_EXCELLENT:
                performance_rating = 'excellent'
            elif avg_grade <= self.GRADE_GOOD:
                performance_rating = 'good'
            elif avg_grade <= self.GRADE_AVERAGE:
                performance_rating = 'average'
            elif avg_grade <= self.GRADE_BELOW_AVERAGE:
                performance_rating = 'below_average'
            else:
                performance_rating = 'poor'
            
            # Get top skills for this company
            skill_counts = Counter(data['skills'])
            top_skills = [skill for skill, count in skill_counts.most_common(5)]
            
            performances.append({
                'company_id': company_id,
                'company_name': data.get('name', 'Unknown'),
                'total_evaluations': len(data['evaluations']),
                'average_score': round(avg_score, 2),
                'average_grade': round(avg_grade, 2),
                'sentiment_score': round(avg_sentiment, 2),
                'sentiment_label': sentiment_label,
                'top_skills': top_skills,
                'performance_rating': performance_rating
            })
        
        # Sort by average grade (lower is better for CvSU grading)
        performances.sort(key=lambda x: x['average_grade'])
        
        return performances[:top_n]

    def _calculate_university_performance(self, university_data: Dict) -> List[Dict]:
        """Calculate performance statistics per university."""
        performances = []
        
        for university_id, data in university_data.items():
            if not data['evaluations']:
                continue
            
            avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
            avg_grade = sum(data['grades']) / len(data['grades']) if data['grades'] else 3.0
            avg_sentiment = sum(data['sentiments']) / len(data['sentiments']) if data['sentiments'] else 0
            
            # Find top and weak companies
            company_avgs = {}
            for company_name, scores in data['companies'].items():
                if scores:
                    company_avgs[company_name] = sum(scores) / len(scores)
            
            sorted_companies = sorted(company_avgs.items(), key=lambda x: -x[1])  # Higher score = better
            top_companies = [name for name, score in sorted_companies[:3] if score >= self.SCORE_GOOD]
            weak_companies = [name for name, score in sorted_companies[-3:] if score < self.SCORE_AVERAGE]
            
            performances.append({
                'university_id': university_id,
                'university_name': data.get('name', 'Unknown'),
                'total_evaluations': len(data['evaluations']),
                'total_students': len(data['students']),
                'average_score': round(avg_score, 2),
                'average_grade': round(avg_grade, 2),
                'sentiment_score': round(avg_sentiment, 2),
                'top_companies': top_companies,
                'weak_companies': weak_companies
            })
        
        # Sort by average score (higher is better)
        performances.sort(key=lambda x: -x['average_score'])
        
        return performances

    def _calculate_skill_trends(self, all_skills: Dict, total_evaluations: int, top_n: int) -> Dict:
        """Calculate skill frequency trends."""
        tech_counts = Counter(all_skills['technical'])
        soft_counts = Counter(all_skills['soft'])
        
        def skill_to_dict(skill, count, category):
            percentage = (count / total_evaluations * 100) if total_evaluations > 0 else 0
            return {
                'name': skill,
                'count': count,
                'percentage': round(percentage, 1),
                'category': category
            }
        
        technical_skills = [
            skill_to_dict(skill, count, 'technical')
            for skill, count in tech_counts.most_common(top_n)
        ]
        
        soft_skills = [
            skill_to_dict(skill, count, 'soft')
            for skill, count in soft_counts.most_common(top_n)
        ]
        
        # Combined top skills
        all_counts = tech_counts + soft_counts
        most_demanded = []
        for skill, count in all_counts.most_common(top_n):
            category = 'technical' if skill in tech_counts else 'soft'
            most_demanded.append(skill_to_dict(skill, count, category))
        
        return {
            'technical_skills': technical_skills,
            'soft_skills': soft_skills,
            'total_unique_skills': len(tech_counts) + len(soft_counts),
            'most_demanded_overall': most_demanded
        }

    def _calculate_sentiment_trends(self, monthly_sentiments: Dict) -> List[Dict]:
        """Calculate sentiment trends over time."""
        trends = []
        
        for month, sentiments in sorted(monthly_sentiments.items()):
            if not sentiments:
                continue
            
            avg_score = sum(sentiments) / len(sentiments)
            
            # Categorize sentiments
            positive_count = sum(1 for s in sentiments if s > 0.2)
            negative_count = sum(1 for s in sentiments if s < -0.2)
            neutral_count = len(sentiments) - positive_count - negative_count
            
            total = len(sentiments)
            
            if avg_score > 0.3:
                label = 'positive'
            elif avg_score < -0.3:
                label = 'negative'
            else:
                label = 'neutral'
            
            trends.append({
                'period': month,
                'average_score': round(avg_score, 2),
                'label': label,
                'evaluation_count': total,
                'positive_percentage': round(positive_count / total * 100, 1),
                'neutral_percentage': round(neutral_count / total * 100, 1),
                'negative_percentage': round(negative_count / total * 100, 1)
            })
        
        return trends

    def _generate_insights(
        self,
        company_performance: List[Dict],
        university_performance: List[Dict],
        skill_trends: Dict,
        sentiment_trends: List[Dict],
        total_evaluations: int
    ) -> List[Dict]:
        """Generate top-level insights for dashboard display."""
        insights = []
        
        # Insight 1: Overall sentiment
        if sentiment_trends:
            recent_trends = sentiment_trends[-3:] if len(sentiment_trends) >= 3 else sentiment_trends
            avg_recent = sum(t['average_score'] for t in recent_trends) / len(recent_trends)
            
            if avg_recent > 0.3:
                sentiment_desc = "predominantly positive"
            elif avg_recent < -0.3:
                sentiment_desc = "showing concerns"
            else:
                sentiment_desc = "balanced"
            
            insights.append({
                'type': 'sentiment_trend',
                'category': 'sentiment',
                'title': f'Overall Evaluation Sentiment: {sentiment_desc.title()}',
                'description': f'Based on {total_evaluations} approved evaluations, feedback sentiment is {sentiment_desc}.',
                'data': {'average_score': round(avg_recent, 2)}
            })
        
        # Insight 2: Top performing company
        if company_performance:
            best_company = company_performance[0]
            insights.append({
                'type': 'performance',
                'category': 'company',
                'title': f'Top Performing Company: {best_company["company_name"]}',
                'description': f'Students at {best_company["company_name"]} average grade {best_company["average_grade"]} ({best_company["performance_rating"]}) from {best_company["total_evaluations"]} evaluations.',
                'data': {'company': best_company}
            })
        
        # Insight 3: Most in-demand skill
        if skill_trends and skill_trends.get('most_demanded_overall'):
            top_skill = skill_trends['most_demanded_overall'][0]
            insights.append({
                'type': 'skill_analysis',
                'category': 'skills',
                'title': f'Most Valued Skill: {top_skill["name"].title()}',
                'description': f'{top_skill["name"].title()} mentioned in {top_skill["percentage"]}% of evaluations ({top_skill["count"]} times).',
                'data': {'skill': top_skill}
            })
        
        # Insight 4: University comparison (if multiple universities)
        if len(university_performance) > 1:
            best_uni = university_performance[0]
            insights.append({
                'type': 'comparison',
                'category': 'university',
                'title': f'Leading University: {best_uni["university_name"]}',
                'description': f'{best_uni["university_name"]} students lead with average score {best_uni["average_score"]} across {best_uni["total_students"]} students.',
                'data': {'university': best_uni}
            })
        
        return insights[:5]  # Return top 5 insights

    def _generate_recommendations(
        self,
        company_performance: List[Dict],
        university_performance: List[Dict],
        university_data: Dict
    ) -> List[Dict]:
        """Generate decision support recommendations."""
        recommendations = []
        
        # Recommendation: Avoid poor-performing companies
        for company in company_performance:
            if company['performance_rating'] in ['poor', 'below_average']:
                recommendations.append({
                    'type': 'warning',
                    'priority': 'high',
                    'title': f'Review Placement at {company["company_name"]}',
                    'description': f'Students at {company["company_name"]} show {company["performance_rating"]} performance (avg grade: {company["average_grade"]}). Consider reviewing internship arrangement.',
                    'affected_entity': company['company_name'],
                    'supporting_data': {
                        'average_grade': company['average_grade'],
                        'total_evaluations': company['total_evaluations'],
                        'sentiment': company['sentiment_label']
                    }
                })
        
        # Recommendation: Highlight top companies
        for company in company_performance[:3]:
            if company['performance_rating'] in ['excellent', 'good']:
                recommendations.append({
                    'type': 'recommendation',
                    'priority': 'medium',
                    'title': f'Prioritize {company["company_name"]} for Placements',
                    'description': f'{company["company_name"]} shows {company["performance_rating"]} student outcomes. Top skills: {", ".join(company["top_skills"][:3])}.',
                    'affected_entity': company['company_name'],
                    'supporting_data': {
                        'average_grade': company['average_grade'],
                        'top_skills': company['top_skills']
                    }
                })
        
        # Recommendation: University-specific weak companies
        for university in university_performance:
            if university.get('weak_companies'):
                for weak_company in university['weak_companies']:
                    recommendations.append({
                        'type': 'warning',
                        'priority': 'high',
                        'title': f'Avoid {weak_company} for {university["university_name"]} Students',
                        'description': f'Historical data shows {university["university_name"]} students underperform at {weak_company}. Consider alternative placements.',
                        'affected_entity': weak_company,
                        'supporting_data': {
                            'university': university['university_name']
                        }
                    })
        
        # Sort by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 2))
        
        return recommendations[:10]  # Return top 10 recommendations

    def get_quick_stats(self, evaluations: List[Dict]) -> Dict[str, Any]:
        """Generate quick statistics for dashboard summary."""
        total = len(evaluations)
        
        if total == 0:
            return {
                'total_evaluations': 0,
                'unique_companies': 0,
                'unique_universities': 0,
                'average_grade': 0,
                'positive_sentiment_rate': 0
            }
        
        companies = set(e.get('company_id') for e in evaluations if e.get('company_id'))
        universities = set(e.get('university_id') for e in evaluations if e.get('university_id'))
        grades = [e.get('final_grade') for e in evaluations if e.get('final_grade')]
        
        # Calculate positive sentiment rate
        positive_count = 0
        for e in evaluations:
            text = e.get('supervisor_comments', '')
            if text and len(text) >= 10:
                sentiment = self.sentiment_analyzer.analyze(text)
                if sentiment.get('score', 0) > 0.2:
                    positive_count += 1
        
        return {
            'total_evaluations': total,
            'unique_companies': len(companies),
            'unique_universities': len(universities),
            'average_grade': round(sum(grades) / len(grades), 2) if grades else 0,
            'positive_sentiment_rate': round(positive_count / total * 100, 1) if total > 0 else 0
        }
