import React from 'react';
import { AnalysisResult } from '../types';

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
            <h2 className="text-2xl font-bold text-slate-900">{metadata.title || 'Certified Stock Report'}</h2>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded border border-slate-200">
              {metadata.category || 'Inventory'}
            </span>
          </div>
          <div className="flex gap-4 text-sm text-slate-500">
             {extracted_data.report_date && <span>Report Date: {extracted_data.report_date}</span>}
             {metadata.date && <span>Analyzed: {metadata.date}</span>}
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

      {/* エグゼクティブ・サマリー Section */}
      <div className={`p-6 rounded-xl border-l-4 shadow-sm ${
        extracted_data.executive_summary?.sentiment.includes('Bullish') ? 'bg-emerald-50 border-emerald-500' :
        extracted_data.executive_summary?.sentiment.includes('Bearish') ? 'bg-red-50 border-red-500' :
        'bg-slate-50 border-slate-400'
      }`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-1">エグゼクティブ・サマリー</h3>
            <h2 className="text-2xl font-bold text-slate-900">{extracted_data.executive_summary?.headline}</h2>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${
            extracted_data.executive_summary?.sentiment.includes('Bullish') ? 'bg-emerald-100 text-emerald-800' :
            extracted_data.executive_summary?.sentiment.includes('Bearish') ? 'bg-red-100 text-red-800' :
            'bg-slate-200 text-slate-800'
          }`}>
            {extracted_data.executive_summary?.sentiment}
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed text-lg">
          {extracted_data.executive_summary?.text}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: stacked cards */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 mb-2">総認証在庫数</h3>
              <p className="text-4xl font-bold text-slate-900">
                  {extracted_data.total_bags?.toLocaleString() ?? 0} <span className="text-lg text-slate-500 font-normal">bags</span>
              </p>
              <p className="text-sm text-slate-500 mt-2">{extracted_data.key_metrics?.change_from_previous}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-sm font-medium text-slate-500 mb-2">在庫品質構造</h3>
               <div className="space-y-2">
                   <div className="flex justify-between items-end">
                      <span className="font-semibold text-slate-900">{extracted_data.key_metrics?.fresh_vs_transition_ratio || '-'}</span>
                   </div>
                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-1/2"></div>
                   </div>
                   <div className="text-xs text-slate-400 pt-1">
                      格付け: {extracted_data.grading?.passed?.toLocaleString() ?? '-'} 合格 / {extracted_data.grading?.pending?.toLocaleString() ?? '-'} 審査待ち
                   </div>
               </div>
          </div>
        </div>

        {/* Right column: AI Score (full height or sticky) */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
             <h3 className="text-sm font-medium text-slate-500 mb-1">AI 信頼度スコア</h3>
             <div className="flex items-center gap-4">
                 <div className="text-4xl font-bold text-slate-800">{evaluation.score}</div>
                 <div className={`text-sm px-2 py-1 rounded ${
                     evaluation.status === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                     evaluation.status === 'negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                 }`}>
                    {evaluation.status}
                 </div>
             </div>
             <p className="text-xs text-slate-500 mt-2">{evaluation.details}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Warehouse & Deep Dive */}
        <div className="lg:col-span-2 space-y-6">
            {/* 詳細分析 Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    詳細分析 (Deep Dive)
                </h3>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">地理的・物流リスク</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{extracted_data.deep_dive_analysis?.geo_logistics_risk}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">需給インサイト</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{extracted_data.deep_dive_analysis?.supply_demand_insight}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-800">倉庫別在庫内訳</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">倉庫名</th>
                                <th className="px-6 py-3 text-right">在庫数 (Bags)</th>
                                <th className="px-6 py-3 text-right">シェア</th>
                            </tr>
                        </thead>
                        <tbody>
                            {extracted_data.warehouses?.map((wh, idx) => (
                                <tr key={idx} className="bg-white border-b border-slate-50 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{wh.name}</td>
                                    <td className="px-6 py-4 text-right">{wh.bags.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        {extracted_data.total_bags ? ((wh.bags / extracted_data.total_bags) * 100).toFixed(1) + '%' : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Right: Engineering & Key Points */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Engineering Suggestions */}
            <div className="bg-slate-800 text-slate-200 rounded-xl shadow-sm border border-slate-700 p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    エンジニア向け提案
                </h3>
                <ul className="space-y-3">
                  {extracted_data.engineering_suggestions?.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-cyan-400 mt-0.5">➢</span>
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">重要ポイント</h3>
                <ul className="space-y-3">
                  {extracted_data.key_points?.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700">{point}</span>
                    </li>
                  ))}
                </ul>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">タグ</h3>
                <div className="flex flex-wrap gap-2">
                  {evaluation.tags?.map((tag: string) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded border border-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};