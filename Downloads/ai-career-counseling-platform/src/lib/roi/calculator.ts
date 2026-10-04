export interface ROICalculatorInput {
  courseFee: number;
  travelCost: number;
  accommodationCost: number;
  equipmentCost: number;
  durationMonths: number;
  financialAssistance?: number;
  userExpectedMonthlyIncome?: number;
  verifiedSalaryMin: number;
  verifiedSalaryMax: number;
}

export interface ROICalculatorResult {
  totalInvestment: number;
  verifiedMonthlyAverage: number;
  chosenMonthlyIncome: number;
  paybackPeriodMonths: number;
  costToIncomeRatio: number; // % of first year earnings spent on training
  financialAssistanceAmount: number;
  netInvestment: number;
  fiveYearExpectedCumulativeEarnings: number;
  provenance: {
    courseFee: "VERIFIED DATA" | "USER INPUT";
    verifiedSalary: "VERIFIED DATA";
    expectedIncome: "USER INPUT" | "ESTIMATE";
    paybackPeriod: "ESTIMATE";
    totalInvestment: "ESTIMATE";
  };
}

export function calculateCareerROI(input: ROICalculatorInput): ROICalculatorResult {
  const financialAssistanceAmount = input.financialAssistance || 0;
  const grossInvestment =
    input.courseFee +
    input.travelCost +
    input.accommodationCost +
    input.equipmentCost;

  const netInvestment = Math.max(0, grossInvestment - financialAssistanceAmount);

  const verifiedMonthlyAverage = Math.round(
    (input.verifiedSalaryMin + input.verifiedSalaryMax) / 2
  );

  const chosenMonthlyIncome =
    input.userExpectedMonthlyIncome && input.userExpectedMonthlyIncome > 0
      ? input.userExpectedMonthlyIncome
      : verifiedMonthlyAverage;

  // Payback period = Net Investment / Monthly Income
  const paybackPeriodMonths =
    chosenMonthlyIncome > 0
      ? Math.round((netInvestment / chosenMonthlyIncome) * 10) / 10
      : 0;

  // Cost to Income Ratio = Net Investment / (12 * Chosen Monthly Income) * 100
  const annualIncome = chosenMonthlyIncome * 12;
  const costToIncomeRatio =
    annualIncome > 0 ? Math.round((netInvestment / annualIncome) * 1000) / 10 : 0;

  // 5 Year Cumulative Earnings = (Annual Income * 5) - Net Investment
  const fiveYearExpectedCumulativeEarnings = annualIncome * 5 - netInvestment;

  return {
    totalInvestment: grossInvestment,
    verifiedMonthlyAverage,
    chosenMonthlyIncome,
    paybackPeriodMonths,
    costToIncomeRatio,
    financialAssistanceAmount,
    netInvestment,
    fiveYearExpectedCumulativeEarnings,
    provenance: {
      courseFee: input.courseFee > 0 ? "USER INPUT" : "VERIFIED DATA",
      verifiedSalary: "VERIFIED DATA",
      expectedIncome: input.userExpectedMonthlyIncome ? "USER INPUT" : "ESTIMATE",
      paybackPeriod: "ESTIMATE",
      totalInvestment: "ESTIMATE",
    },
  };
}
