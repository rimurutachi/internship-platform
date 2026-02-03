import { createClient } from '@supabase/supabase-js';
import {
  StudentInternship,
  StudentEvaluation,
  ProgressMetrics,
  AIInsights,
  DashboardData,
} from '../types/student';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

class StudentService {
  /**
   * Calculate internship progress based on start and end dates
   */
  calculateProgress(startDate: string, endDate: string): number {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(Math.max(Math.round((elapsedDays / totalDays) * 100), 0), 100);
  }

  /**
   * Calculate remaining days until internship end
   */
  calculateRemainingDays(endDate: string): number {
    const today = new Date();
    const end = new Date(endDate);
    const remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remainingDays);
  }

  /**
   * Calculate remaining weeks until internship end
   */
  calculateRemainingWeeks(endDate: string): number {
    const remainingDays = this.calculateRemainingDays(endDate);
    return Math.ceil(remainingDays / 7);
  }

  /**
   * Calculate detailed progress metrics including phase completion
   */
  calculateProgressMetrics(startDate: string, endDate: string): ProgressMetrics {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const progress = Math.min(Math.max(Math.round((elapsedDays / totalDays) * 100), 0), 100);

    return {
      overall_progress: progress,
      completion_by_phase: {
        onboarding: elapsedDays >= 14 ? 100 : Math.round((elapsedDays / 14) * 100),
        development: elapsedDays >= 42 ? 100 : Math.max(0, Math.round(((elapsedDays - 14) / 28) * 100)),
        evaluation: remainingDays <= 14 ? Math.round(((14 - remainingDays) / 14) * 100) : 0,
      },
      time_remaining_days: Math.max(0, remainingDays),
      weeks_remaining: Math.ceil(Math.max(0, remainingDays) / 7),
    };
  }

  /**
   * Get AI insights from evaluations (aggregated sentiment and features)
   */
  async getAIInsights(internshipId: string): Promise<AIInsights | null> {
    const { data: evaluations, error } = await supabase
      .from('evaluations')
      .select('feedback_text, sentiment_scores, llt_features, rating_overall')
      .eq('internship_id', internshipId)
      .eq('status', 'approved');

    if (error || !evaluations || evaluations.length === 0) {
      return null;
    }

    // Aggregate sentiment analysis
    const sentiments = evaluations
      .map((e) => e.sentiment_scores)
      .filter((s) => s !== null && s !== undefined);

    const avgSentiment =
      sentiments.length > 0
        ? {
            positive: sentiments.reduce((sum, s) => sum + (s.positive || 0), 0) / sentiments.length,
            neutral: sentiments.reduce((sum, s) => sum + (s.neutral || 0), 0) / sentiments.length,
            negative: sentiments.reduce((sum, s) => sum + (s.negative || 0), 0) / sentiments.length,
          }
        : undefined;

    // Aggregate LLT features (key strengths)
    const allFeatures = evaluations
      .flatMap((e) => e.llt_features || [])
      .reduce((count: any, feature: string) => {
        count[feature] = (count[feature] || 0) + 1;
        return count;
      }, {});

    const topFeatures = Object.entries(allFeatures)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([feature]) => feature);

    // Calculate average rating
    const avgRating =
      evaluations.reduce((sum, e) => sum + (e.rating_overall || 0), 0) / evaluations.length;

    // Determine performance trend
    const recentEvals = evaluations.slice(-3);
    const olderEvals = evaluations.slice(0, -3);
    const recentAvg =
      recentEvals.length > 0
        ? recentEvals.reduce((sum, e) => sum + (e.rating_overall || 0), 0) / recentEvals.length
        : 0;
    const olderAvg =
      olderEvals.length > 0
        ? olderEvals.reduce((sum, e) => sum + (e.rating_overall || 0), 0) / olderEvals.length
        : 0;

    const trend =
      recentAvg > olderAvg + 0.5 ? 'up' : recentAvg < olderAvg - 0.5 ? 'down' : 'stable';

    // Generate recommendations based on sentiment
    const recommendations: string[] = [];
    if (avgSentiment && avgSentiment.negative > 0.2) {
      recommendations.push('Focus on addressing feedback concerns');
    }
    if (avgRating >= 8) {
      recommendations.push('Maintain excellent performance');
    } else if (avgRating < 6) {
      recommendations.push('Consider scheduling a meeting with your supervisor for guidance');
    }

    return {
      performance_trend: trend,
      sentiment_analysis: avgSentiment,
      key_strengths: topFeatures,
      growth_areas: [], // Can be enhanced later
      recommendations,
      confidence_score: avgSentiment ? avgSentiment.positive * 100 : undefined,
      total_feedback_count: evaluations.length,
    };
  }

  /**
   * Check required documents status for an internship
   */
  async getRequiredDocumentsStatus(internshipId: string) {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('type, status, created_at')
      .eq('internship_id', internshipId);

    if (error) {
      throw error;
    }

    const requiredTypes = ['MOA', 'Job Description', 'Weekly Report', 'Final Evaluation'];

    const statusMap: any = {};
    documents?.forEach((doc) => {
      if (requiredTypes.includes(doc.type)) {
        if (doc.type === 'Weekly Report') {
          if (!statusMap[doc.type]) statusMap[doc.type] = [];
          statusMap[doc.type].push({ status: doc.status, date: doc.created_at });
        } else {
          statusMap[doc.type] = doc.status;
        }
      }
    });

    return {
      moa: statusMap['MOA'] || 'pending',
      job_description: statusMap['Job Description'] || 'pending',
      weekly_reports: statusMap['Weekly Report'] || [],
      final_evaluation: statusMap['Final Evaluation'] || 'pending',
    };
  }

  /**
   * Get student's current internship with all related data
   */
  async getCurrentInternship(studentId: string): Promise<StudentInternship | null> {
    const { data: internship, error } = await supabase
      .from('internships')
      .select(
        `
        *,
        company:companies(*),
        advisor:users!internships_advisor_id_fkey(id, first_name, last_name, email),
        supervisor:users!internships_supervisor_id_fkey(id, first_name, last_name, email)
      `
      )
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!internship) {
      return null;
    }

    // Use progress from database (based on weekly reports + days)
    // This matches what advisor and supervisor see
    const progress = internship.progress || 0;

    console.log('ℹ️ [StudentService] Using database progress:', {
      internshipId: internship.id,
      databaseProgress: progress,
      startDate: internship.start_date,
      endDate: internship.end_date
    });

    // Format advisor and supervisor names
    if (internship.advisor) {
      internship.advisor.name = `${internship.advisor.first_name} ${internship.advisor.last_name}`;
    }
    if (internship.supervisor) {
      internship.supervisor.name = `${internship.supervisor.first_name} ${internship.supervisor.last_name}`;
    }

    return {
      ...internship,
      progress_percentage: progress,
    };
  }

  /**
   * Get all evaluations for student's current internship
   */
  async getEvaluations(
    internshipId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ evaluations: StudentEvaluation[]; count: number; summary: any }> {
    console.log('[StudentService] getEvaluations start', { internshipId, limit, offset });

    const { data: evaluations, count, error } = await supabase
      .from('evaluations')
      .select(
        `
        *,
        supervisor:users!evaluations_supervisor_id_fkey(id, first_name, last_name, email)
      `,
        { count: 'exact' }
      )
      .eq('internship_id', internshipId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Format supervisor names
    const formattedEvaluations = (evaluations || []).map((evaluation) => {
      if (evaluation.supervisor) {
        evaluation.supervisor.name = `${evaluation.supervisor.first_name} ${evaluation.supervisor.last_name}`;
      }
      return evaluation;
    });

    const avgRating =
      evaluations && evaluations.length > 0
        ? (
            evaluations.reduce((sum, e) => sum + (e.rating_overall || 0), 0) / evaluations.length
          ).toFixed(1)
        : '0';

    const latestEval = evaluations && evaluations.length > 0 ? evaluations[0].created_at : null;

    return {
      evaluations: formattedEvaluations,
      count: count || 0,
      summary: {
        average_rating: parseFloat(avgRating),
        total_evaluations: count || 0,
        latest_evaluation: latestEval,
      },
    };
  }

  /**
   * Get dashboard overview data (combined query for efficiency)
   */
  async getDashboardData(studentId: string): Promise<DashboardData | null> {
    // Get internship
    const internship = await this.getCurrentInternship(studentId);

    if (!internship) {
      // Return empty dashboard data if no internship
      return {
        internship: null,
        progress: null,
        recent_evaluations: [],
        upcoming_tasks: [],
        ai_insights: undefined,
        notifications_count: 0,
      } as any;
    }

    // Get progress metrics using database value (not date calculation)
    // This ensures dashboard and current internship show identical progress
    const databaseProgress = internship.progress || 0;
    const progress = {
      overall_progress: databaseProgress,
      completion_by_phase: {
        onboarding: databaseProgress >= 30 ? 100 : Math.round((databaseProgress / 30) * 100),
        development: databaseProgress >= 70 ? 100 : Math.max(0, Math.round(((databaseProgress - 30) / 40) * 100)),
        evaluation: databaseProgress >= 90 ? Math.round(((databaseProgress - 90) / 10) * 100) : 0,
      },
      time_remaining_days: this.calculateRemainingDays(internship.end_date),
      weeks_remaining: this.calculateRemainingWeeks(internship.end_date),
    };

    console.log('ℹ️ [StudentService] Dashboard progress from database:', {
      internshipId: internship.id,
      databaseProgress,
      phases: progress.completion_by_phase
    });

    // Get recent evaluations
    const { evaluations } = await this.getEvaluations(internship.id, 2, 0);

    // Get upcoming tasks (documents that are pending)
    const { data: tasks } = await supabase
      .from('documents')
      .select('*')
      .eq('internship_id', internship.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get AI insights
    const aiInsights = await this.getAIInsights(internship.id);

    // Get unread notifications count
    const { count: notificationsCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', studentId)
      .eq('is_read', false);

    return {
      internship,
      progress,
      recent_evaluations: evaluations,
      upcoming_tasks: tasks || [],
      ai_insights: aiInsights || undefined,
      notifications_count: notificationsCount || 0,
    };
  }

  /**
   * Get skills assessment (aggregated from evaluations)
   */
  async getSkillsAssessment(internshipId: string) {
    const { data: evaluations, error } = await supabase
      .from('evaluations')
      .select('rating_technical, rating_communication, rating_work_ethic, rating_overall, created_at')
      .eq('internship_id', internshipId)
      .eq('status', 'approved');

    if (error || !evaluations || evaluations.length === 0) {
      return {
        skills: [],
        ai_confidence_score: 0,
        last_updated: null,
      };
    }

    const avgTechnical =
      evaluations.reduce((sum, e) => sum + (e.rating_technical || 0), 0) / evaluations.length;
    const avgCommunication =
      evaluations.reduce((sum, e) => sum + (e.rating_communication || 0), 0) / evaluations.length;
    const avgWorkEthic =
      evaluations.reduce((sum, e) => sum + (e.rating_work_ethic || 0), 0) / evaluations.length;

    // Determine trends (simplified)
    const skills = [
      {
        name: 'Technical Skills',
        rating: Math.round(avgTechnical * 10),
        trend: 'stable' as 'up' | 'down' | 'stable',
      },
      {
        name: 'Communication',
        rating: Math.round(avgCommunication * 10),
        trend: 'stable' as 'up' | 'down' | 'stable',
      },
      {
        name: 'Work Ethic',
        rating: Math.round(avgWorkEthic * 10),
        trend: 'stable' as 'up' | 'down' | 'stable',
      },
    ];

    const avgOverall =
      evaluations.reduce((sum, e) => sum + (e.rating_overall || 0), 0) / evaluations.length;

    return {
      skills,
      ai_confidence_score: Math.round(avgOverall * 10),
      last_updated: evaluations[0]?.created_at || null,
    };
  }
}

export default new StudentService();
