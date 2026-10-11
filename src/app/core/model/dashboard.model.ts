import { BookLoanModel } from './bookLoanModel';

/** One point of the dashboard `monthlyLoans` series (`month` is `yyyy-MM`). */
export interface MonthlyLoanCount {
  month: string;
  count: number;
}

/**
 * Response of `GET /api/dashboard/summary`.
 *
 * Every KPI on the dashboard comes from this single call; the previous implementation
 * fanned out six list requests (and fabricated the chart series client-side).
 */
export interface DashboardSummaryModel {
  totalBooks: number;
  totalPersons: number;
  activeLoans: number;
  overdueLoans: number;
  activeReservations: number;
  recentLoans: BookLoanModel[];
  monthlyLoans: MonthlyLoanCount[];
}
