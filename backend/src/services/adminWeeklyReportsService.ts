import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export async function fetchWeeklyReports(status?: string) {
  const mappedStatus = status === 'pending' ? 'pending_approval' : status;

  let query = supabase
    .from('student_weekly_accomplishments')
    .select(`
      *,
      student:users!student_id(id, first_name, last_name, email),
      internship:internships(id, position, start_date, end_date, companies(name))
    `)
    .order('created_at', { ascending: false });

  if (mappedStatus) {
    query = query.eq('status', mappedStatus);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch weekly reports: ${error.message}`);
  }

  const stats = {
    total: data?.length || 0,
    pending: (data || []).filter(r => r.status === 'pending_approval').length,
    approved: (data || []).filter(r => r.status === 'approved').length,
    rejected: (data || []).filter(r => r.status === 'rejected').length,
  };

  return { data: data || [], stats };
}
