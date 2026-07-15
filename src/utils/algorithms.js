/**
 * ConsensuSync Decision Algorithms
 */

/**
 * 1. Schulze Method (Beatpath Ranked-Choice Voting)
 * Used to find the Condorcet winner by calculating strongest path relations.
 */
export function calculateSchulze(candidates, ballots) {
  const numCandidates = candidates.length;
  const d = Array.from({ length: numCandidates }, () => Array(numCandidates).fill(0));

  ballots.forEach(ballot => {
    for (let i = 0; i < numCandidates; i++) {
      for (let j = 0; j < numCandidates; j++) {
        if (i === j) continue;
        const candI = candidates[i];
        const candJ = candidates[j];
        
        const rankI = ballot.indexOf(candI);
        const rankJ = ballot.indexOf(candJ);

        const hasI = rankI !== -1;
        const hasJ = rankJ !== -1;

        if (hasI && hasJ) {
          if (rankI < rankJ) {
            d[i][j]++;
          }
        } else if (hasI && !hasJ) {
          d[i][j]++;
        }
      }
    }
  });

  const p = Array.from({ length: numCandidates }, () => Array(numCandidates).fill(0));

  for (let i = 0; i < numCandidates; i++) {
    for (let j = 0; j < numCandidates; j++) {
      if (i !== j) {
        if (d[i][j] > d[j][i]) {
          p[i][j] = d[i][j];
        } else {
          p[i][j] = 0;
        }
      }
    }
  }

  // Floyd-Warshall transitive closure path strength search
  for (let i = 0; i < numCandidates; i++) {
    for (let j = 0; j < numCandidates; j++) {
      if (i !== j) {
        for (let k = 0; k < numCandidates; k++) {
          if (i !== k && j !== k) {
            p[j][k] = Math.max(p[j][k], Math.min(p[j][i], p[i][k]));
          }
        }
      }
    }
  }

  const winCount = Array(numCandidates).fill(0);
  for (let i = 0; i < numCandidates; i++) {
    for (let j = 0; j < numCandidates; j++) {
      if (i !== j) {
        if (p[i][j] > p[j][i]) {
          winCount[i]++;
        }
      }
    }
  }

  const ranked = candidates.map((cand, idx) => ({
    name: cand,
    score: winCount[idx],
    wins: winCount[idx],
  })).sort((a, b) => b.score - a.score);

  return {
    winner: ranked[0] ? ranked[0].name : null,
    ranked,
    pairwise: d,
    paths: p
  };
}

/**
 * 2. Debt Simplification Algorithm (Bill Splitter)
 * Resolves split bill conflicts by calculating the minimum number of transactions
 * required to settle all debts among group members.
 * 
 * @param {Array<Object>} transactions - List of raw expenses: { paidBy, amount, splitAmong: [name, ...] }
 * @param {Array<string>} members - List of group member names.
 * @returns {Array<Object>} List of settlement transactions: { from, to, amount }
 */
export function calculateDebtSettlement(expenses, members) {
  const netBalances = {};
  members.forEach(m => {
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
