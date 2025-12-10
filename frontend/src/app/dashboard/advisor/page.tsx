import { redirect } from 'next/navigation';

export default function AdvisorDashboardPage() {
  // Redirect to My Students as default landing page
  redirect('/dashboard/advisor/students');
}

