/**
 * ConsensuSync Decision Algorithms
 */

/**
 * 1. Borda Utility & Resentment Minimizer Algorithm
 * Calculates group utility score based on ranked choices while honoring absolute vetoes.
 * Uses rank variance as a tie-breaker to select the option that minimizes group division.
 * 
 * @param {Array<string>} candidates - List of available options (e.g. Restaurants).
 * @param {Array<Array<string>>} ballots - List of ranked preferences from each participant.
 * @param {Array<string>} vetoes - List of all active vetoed candidates across participants.
 * @returns {Object} { winner, ranked: [{ name, score, variance }], vetoes }
 */
export function calculateResentmentMinimizer(candidates, ballots, vetoes = []) {
  const activeVetoes = new Set(vetoes);
  
  // Filter out any option that has been vetoed by any participant
  const validCandidates = candidates.filter(cand => !activeVetoes.has(cand));

  if (validCandidates.length === 0) {
    return { winner: null, ranked: [], vetoes: Array.from(activeVetoes) };
  }

  const numCandidates = candidates.length;
  // Borda Point scale: 1st choice gets (N-1) points, last gets 0 points.
  const getBordaPoints = (candidate, ballot) => {
    const rankIndex = ballot.indexOf(candidate);
    if (rankIndex === -1) return 0; // Not ranked
    return numCandidates - 1 - rankIndex;
  };

  const results = validCandidates.map(cand => {
    // Collect points assigned to this candidate by each voter
    const scores = ballots.map(ballot => getBordaPoints(cand, ballot));
    
    // Sum of points = Group Utility
    const totalUtility = scores.reduce((sum, val) => sum + val, 0);

    // Calculate Variance (to measure how polarized the group is on this option)
    let variance = 0;
    if (scores.length > 0) {
      const mean = totalUtility / scores.length;
      variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
    }

    return {
      name: cand,
      score: totalUtility,
      variance: Number(variance.toFixed(2))
    };
  });

  // Sort: 1st by highest total utility score, 2nd by lowest variance (less division / lower resentment)
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.variance - b.variance;
  });

  return {
    winner: results[0] ? results[0].name : null,
    ranked: results,
    vetoes: Array.from(activeVetoes)
  };
}

/**
 * 2. Debt Simplification Algorithm (Bill Splitter)
 * Resolves split bill conflicts by calculating the minimum number of transactions
 * required to settle all debts among group members.
 * 
 * @param {Array<Object>} expenses - List of raw expenses: { paidBy, amount, splitAmong: [name, ...] }
 * @param {Array<string>} members - List of group member names.
 * @returns {Array<Object>} List of settlement transactions: { from, to, amount }
 */
export function calculateDebtSettlement(expenses, members) {
  const netBalances = {};
  
  // CRITICAL FIX: Ensure netBalances accounts for EVERY member that exists in any transaction,
  // not just the initial DEFAULT_MEMBERS.
  const allInvolvedMembers = new Set(members);
  expenses.forEach(exp => {
    if (exp.paidBy) allInvolvedMembers.add(exp.paidBy);
    if (exp.splitAmong) {
      exp.splitAmong.forEach(m => allInvolvedMembers.add(m));
    }
  });

  allInvolvedMembers.forEach(m => {
    netBalances[m] = 0;
  });

  // Calculate net balances for each person
  expenses.forEach(exp => {
    const amount = Number(exp.amount) || 0;
    const paidBy = exp.paidBy;
    const splitAmong = exp.splitAmong || [];
    
    if (amount <= 0 || !paidBy || splitAmong.length === 0) return;

    // Payer is credited the total amount
    netBalances[paidBy] += amount;

    // Each beneficiary owes their share
    const share = amount / splitAmong.length;
    splitAmong.forEach(person => {
      netBalances[person] -= share;
    });
  });

  // Separate debtors (negative balance) and creditors (positive balance)
  const debtors = [];
  const creditors = [];

  Object.keys(netBalances).forEach(person => {
    const balance = Number(netBalances[person].toFixed(2));
    if (balance < -0.01) {
      debtors.push({ name: person, balance: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ name: person, balance: balance });
    }
  });

  // Sort debtors descending (largest debt first) and creditors descending (largest credit first)
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const settlements = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amountToSettle = Math.min(debtor.balance, creditor.balance);
    
    if (amountToSettle > 0.01) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Number(amountToSettle.toFixed(2))
      });
    }

    debtor.balance -= amountToSettle;
    creditor.balance -= amountToSettle;

    if (debtor.balance <= 0.01) dIdx++;
    if (creditor.balance <= 0.01) cIdx++;
  }

  return settlements;
}
