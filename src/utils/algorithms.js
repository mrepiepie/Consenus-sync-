/**
 * ConsensuSync Decision Algorithms
 */

/**
 * 1. Schulze Method (Beatpath Ranked-Choice Voting)
 * Used to find the Condorcet winner by calculating strongest path relations.
 * 
 * @param {Array<string>} candidates - List of candidate IDs/names.
 * @param {Array<Array<string>>} ballots - List of preferences. Each ballot is an ordered array of candidate IDs (1st choice, 2nd choice, etc.)
 * @returns {Object} { winner, paths, pairwiseMatrix }
 */
export function calculateSchulze(candidates, ballots) {
  const numCandidates = candidates.length;
  const candidateIndexMap = {};
  candidates.forEach((c, idx) => {
    candidateIndexMap[c] = idx;
  });

  // 1. Initialize Pairwise Preferences Matrix (d[V, W] = number of voters who prefer V over W)
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
          d[i][j]++; // Prefer I (since J is unranked)
        }
      }
    }
  });

  // 2. Initialize Strongest Path Matrix (p[i][j])
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

  // 3. Floyd-Warshall variant to find strongest path (beatpaths)
  // The outer loop MUST be the intermediate node 'i' (customarily 'k' in Floyd-Warshall)
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

  // 4. Rank candidates based on strongest path comparisons
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
 * 2. Gale-Shapley Stable Marriage / Task Allocator
 * Matches group members to their preferred tasks.
 * 
 * @param {Array<Object>} members - Array of { id, preferences: [taskId, ...] }
 * @param {Array<Object>} tasks - Array of { id, capacity: number, rankings: [memberId, ...] }
 * @returns {Object} { assignments: { taskId: [memberId, ...] }, steps: Array<string> }
 */
export function calculateStableMatching(members, tasks) {
  const steps = [];
  const assignments = {};
  
  tasks.forEach(t => {
    assignments[t.id] = [];
  });

  const proposalIndex = {};
  members.forEach(m => {
    proposalIndex[m.id] = 0;
  });

  let freeMembers = members.map(m => m.id);
  let rounds = 0;
  const maxRounds = 100;

  while (freeMembers.length > 0 && rounds < maxRounds) {
    rounds++;
    const currentMemberId = freeMembers.shift();
    const member = members.find(m => m.id === currentMemberId);
    
    const prefIndex = proposalIndex[currentMemberId];
    if (prefIndex >= member.preferences.length) {
      steps.push(`Round ${rounds}: ${currentMemberId} has no more preferred tasks to propose to.`);
      continue;
    }

    const targetTaskId = member.preferences[prefIndex];
    proposalIndex[currentMemberId]++;
    
    const task = tasks.find(t => t.id === targetTaskId);
    const capacity = task.capacity || 1;
    
    steps.push(`Round ${rounds}: ${currentMemberId} proposes to task "${targetTaskId}".`);

    const assigned = assignments[targetTaskId];

    if (assigned.length < capacity) {
      assigned.push(currentMemberId);
      steps.push(`  - Task "${targetTaskId}" has capacity. Accepted proposal from ${currentMemberId}.`);
    } else {
      const allCandidates = [...assigned, currentMemberId];
      
      allCandidates.sort((a, b) => {
        const indexA = task.rankings.indexOf(a);
        const indexB = task.rankings.indexOf(b);
        const scoreA = indexA === -1 ? 999 : indexA;
        const scoreB = indexB === -1 ? 999 : indexB;
        return scoreA - scoreB;
      });

      const kept = allCandidates.slice(0, capacity);
      const rejected = allCandidates.slice(capacity);

      assignments[targetTaskId] = kept;

      rejected.forEach(rej => {
        steps.push(`  - Task "${targetTaskId}" rejects ${rej} in favor of higher preference.`);
        if (!freeMembers.includes(rej)) {
          freeMembers.push(rej);
        }
      });

      if (kept.includes(currentMemberId)) {
        steps.push(`  - Task "${targetTaskId}" accepts ${currentMemberId} temporarily.`);
      }
    }
  }

  return { assignments, steps };
}
