import React from 'react';
import { BookOpen, Layers, HelpCircle, Users } from 'lucide-react';

export default function AlgorithmExplainer() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Intro Header Section */}
      <div className="border border-gray-800 bg-slate-900/40 p-8 rounded-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="h-7 w-7 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white tracking-tight">
            The Decision Logic Engine
          </h2>
        </div>
        <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">
          A breakdown of the mathematical methods and algorithms used to turn messy, conflicting group preferences into clean, optimal decisions.
        </p>
      </div>

      {/* Schulze Method explanation */}
      <div className="border border-gray-855 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl space-y-4">
        <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
          1. Schulze Method (Beatpath Algorithm)
        </h3>
        
        <p className="text-sm text-gray-300 leading-relaxed">
          The Schulze Method is a ranked-choice voting system designed to find the **Condorcet winner**—a candidate that wins a head-to-head match against every other candidate. Traditional voting systems fail when there is a split vote (e.g. two similar options split the majority, letting an unpopular third option win). Schulze resolves this by constructing pairwise preferences.
        </p>

        <div className="bg-slate-950 p-5 rounded-xl border border-gray-850 space-y-3">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step-by-Step Logic:</h4>
          <ol className="list-decimal list-inside space-y-2.5 text-xs text-gray-400">
            <li>
              <strong className="text-gray-300">Pairwise Preferences Matrix \(d[V, W]\):</strong> Count how many voters prefer option \(V\) over option \(W\).
            </li>
            <li>
              <strong className="text-gray-300">Strongest Beatpaths:</strong> Find paths between candidates. If candidate \(A\) beats \(B\), \(B\) beats \(C\), and \(C\) beats \(D\), a path exists from \(A\) to \(D\). The strength of a path is the strength of its weakest link.
            </li>
            <li>
              <strong className="text-gray-300">Floyd-Warshall Search:</strong> Compute the strongest path \(p[V, W]\) for all pairs using a modified transitive closure algorithm.
            </li>
            <li>
              <strong className="text-gray-300">Decide Winner:</strong> Candidate X dominates Y if the strongest path from X to Y is stronger than the strongest path from Y to X (p[X,Y] &gt; p[Y,X]).
            </li>
          </ol>
        </div>

        <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs text-gray-300 leading-relaxed">
          <span className="font-bold text-indigo-400">Why this resolves conflict:</span> It prevents tactical voting. Voters don't have to guess how others will vote; they simply state their true preferences.
        </div>
      </div>

      {/* Gale-Shapley explanation */}
      <div className="border border-gray-855 bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl space-y-4">
        <h3 className="text-xl font-bold text-violet-400 flex items-center gap-2">
          2. Gale-Shapley Algorithm (Stable Matching)
        </h3>
        
        <p className="text-sm text-gray-300 leading-relaxed">
          When splitting up coding tasks, writing documentation, or assigning management roles in a technical team, simple selection creates resentment. The Gale-Shapley algorithm guarantees a **stable matching**. A matching is stable if there are no two elements that would both prefer to be matched with each other than their current matches.
        </p>

        <div className="bg-slate-950 p-5 rounded-xl border border-gray-850 space-y-3">
          <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Step-by-Step Logic:</h4>
          <ol className="list-decimal list-inside space-y-2.5 text-xs text-gray-400">
            <li>
              <strong className="text-gray-300">Proposals:</strong> In each round, every unmatched member proposes to their top preferred task that hasn't rejected them yet.
            </li>
            <li>
              <strong className="text-gray-300">Deferred Acceptance:</strong> Tasks hold onto their best proposals (based on task capacity and member suitability ratings) and reject the rest.
            </li>
            <li>
              <strong className="text-gray-300">Iterative Rejection:</strong> Rejected members propose to their next choices in the following round. This repeats until everyone is matched or no more proposals can be made.
            </li>
          </ol>
        </div>

        <div className="p-4 bg-violet-950/20 border border-violet-500/20 rounded-xl text-xs text-gray-300 leading-relaxed">
          <span className="font-bold text-violet-400">Why this resolves conflict:</span> The result is mathematically guaranteed to be **optimal for the proposing group** (the members), and eliminates matching envy.
        </div>
      </div>
    </div>
  );
}
