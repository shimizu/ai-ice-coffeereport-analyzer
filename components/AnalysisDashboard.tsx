import React from 'react';
import { AnalysisResult } from '../types';
import { RiskBadge } from './RiskBadge'; // 名前は後で変えるかもしれませんが一旦そのまま

interface AnalysisDashboardProps {
  data: AnalysisResult;
  onReset: () => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data, onReset }) => {
  const { metadata, extracted_data, evaluation } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900">{metadata.title || metadata.id}</h2>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded border border-slate-200">
              {metadata.category || 'Uncategorized'}
            </span>
          </div>
          <div className="flex gap-4 text-sm text-slate-500">
             {metadata.author && <span>{metadata.author}</span>}
             {metadata.date && <span>{metadata.date}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={onReset}
             className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors"
           >
             別のファイルを分析
           </button>
        </div>
      </div>

      {/* Summary & Evaluation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              要約
            </h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {extracted_data.summary}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              重要ポイント
            </h3>
            <ul className="space-y-3">
              {extracted_data.key_points.map((point: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Evaluation Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">AI評価</h3>
            
            <div className="flex flex-col items-center justify-center mb-8">
               <div className="relative w-32 h-32 flex items-center justify-center">
                 {/* Simple Circle CSS */}
                 <svg className="w-full h-full" viewBox="0 0 36 36">
                   <path
                     className="text-slate-100"
                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="3"
                   />
                   <path
                     className={`${
                       evaluation.status === 'positive' ? 'text-emerald-500' : 
                       evaluation.status === 'warning' ? 'text-amber-500' :
                       evaluation.status === 'negative' ? 'text-red-500' : 'text-blue-500'
                     }`}
                     strokeDasharray={`${evaluation.score}, 100`}
                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="3"
                   />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                   <span className="text-4xl font-bold text-slate-800">{evaluation.score}</span>
                   <span className="text-xs text-slate-500 uppercase font-medium tracking-wide">Score</span>
                 </div>
               </div>
               <div className={`mt-4 px-3 py-1 rounded-full text-sm font-medium capitalize
                 ${evaluation.status === 'positive' ? 'bg-emerald-100 text-emerald-700' : 
                   evaluation.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                   evaluation.status === 'negative' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                 }`}>
                 {evaluation.status}
               </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">評価詳細</h4>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {evaluation.details}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">タグ</h4>
                <div className="flex flex-wrap gap-2">
                  {evaluation.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded border border-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
