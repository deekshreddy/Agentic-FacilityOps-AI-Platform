export default async function run(page) {
  await page.waitForFunction(
    () => document.body.innerText.includes('M4 Cost Intelligence Connected'),
    { timeout: 30000 }
  );
  const text = await page.evaluate(() => document.body.innerText);
  const lower = text.toLowerCase();
  const grab = (label) => {
    const idx = lower.indexOf(label.toLowerCase());
    if (idx === -1) return null;
    return text.slice(idx, idx + 110).replace(/\n/g, ' | ');
  };
  return {
    sidebarHasM4: text.includes('Cost Optimization'),
    totalCost: grab('Total Operational Cost'),
    totalBudget: grab('Total Budget'),
    utilization: grab('Budget Utilization'),
    variance: grab('Budget Variance'),
    savings: grab('Potential Savings'),
    roi: grab('Projected Savings ROI'),
    health: grab('Facility Health Score'),
    costDistribution: text.includes('Cost Distribution'),
    budgetAnalysis: text.includes('Monthly Cost vs Budget'),
    savingsOps: text.includes('Savings Opportunities'),
    vendor: text.includes('Vendor Cost Utilization'),
    crossAgent: text.includes('Cross-Agent Facility Intelligence'),
    anomalies: text.includes('Cost Anomalies'),
    forecast: text.includes('Operational Cost Forecast'),
    recommendations: text.includes('Cost Optimization Agent Recommendations'),
    report: text.includes('Facility Intelligence Report'),
    noNaN: !text.includes('NaN'),
    noUndefined: !text.includes('undefined'),
  };
}
