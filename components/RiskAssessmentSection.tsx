import React, { useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { WatchlistItem } from '../types';
import { RiskLevel } from '../types';
import { ShieldCheckIcon, SparklesIcon } from './icons';
import { formatTimeAgo } from '../utils';

type RiskAssessmentSectionProps = {
  tender: WatchlistItem;
  store: ReturnType<typeof useTenderStore>;
};

const RiskLevelBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const levelStyles: Record<RiskLevel, string> = {
    [RiskLevel.LOW]: 'bg-green-500/20 text-green-300 border-green-500/30',
    [RiskLevel.MEDIUM]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    [RiskLevel.HIGH]: 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  return <span className={`px-4 py-2 text-base font-semibold rounded-full border ${levelStyles[level]}`}>{level}</span>;
};

const RiskAssessmentSection: React.FC<RiskAssessmentSectionProps> = ({ tender, store }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      await store.generateRiskAssessment(tender.tender.id);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while generating the assessment.');
    } finally {
      setLoading(false);
    }
  };

  const { riskAssessment } = tender;

  return (
    <div>
        <h2 className="text-xl font-semibold text-white mb-4">Risk Assessment</h2>
      {!riskAssessment && (
        <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-dashed border-slate-700">
          <ShieldCheckIcon className="mx-auto w-12 h-12 text-slate-500" />
          <h3 className="text-xl font-medium text-white mt-4">AI-Powered Risk Assessment</h3>
          <p className="text-slate-400 mt-2 mb-6 max-w-md mx-auto">Get an expert analysis of potential risks and mitigation strategies for this tender.</p>
          <button
            onClick={handleGenerateAssessment}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Analyzing...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Assessment
              </>
            )}
          </button>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
      )}

      {riskAssessment && (
        <div>
          <div className="flex justify-between items-center mb-6">
             <p className="text-sm text-slate-400">Generated {formatTimeAgo(riskAssessment.generatedAt)}</p>
            <button onClick={handleGenerateAssessment} disabled={loading} className="btn-secondary text-sm">
                {loading ? 'Re-analyzing...' : 'Regenerate'}
            </button>
          </div>
           {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-md">{error}</p>}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700 text-center">
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Overall Risk Level</h4>
                    <RiskLevelBadge level={riskAssessment.overallRisk} />
                </div>
                <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700 text-center">
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Confidence Score</h4>
                    <p className="text-4xl font-bold text-blue-400">{(riskAssessment.confidenceScore * 100).toFixed(0)}%</p>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-white mb-3">Key Identified Risks</h4>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  {riskAssessment.identifiedRisks.map((risk, i) => <li key={i}>{risk}</li>)}
                </ul>
              </div>
              <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700">
                <h4 className="font-semibold text-white mb-3">Proposed Mitigation Strategies</h4>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  {riskAssessment.mitigationStrategies.map((strategy, i) => <li key={i}>{strategy}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssessmentSection;