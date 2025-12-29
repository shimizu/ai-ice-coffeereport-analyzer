import React, { useState, useEffect } from 'react';
import { getAllDocuments, getDocumentHistory } from '../services/dbService';
import { AnalysisResult, DocumentMetadata } from '../types';
import { AnalysisDashboard } from './AnalysisDashboard';

interface HistoryDashboardProps {
  onSelectHistory: (data: AnalysisResult) => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ onSelectHistory }) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await getAllDocuments();
        setDocuments(docs);
      } catch (e) {
        console.error("Failed to load documents", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleDocSelect = async (docId: string) => {
    setSelectedDocId(docId);
    setLoadingHistory(true);
    try {
      const data = await getDocumentHistory(docId);
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">分析履歴</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar: Document List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-h-[600px] flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700">ドキュメント一覧</h3>
            <p className="text-xs text-slate-500 mt-1">{documents.length} files analyzed</p>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {documents.length === 0 && (
              <div className="p-4 text-sm text-slate-400 text-center">No history found.</div>
            )}
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDocSelect(doc.id)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                  selectedDocId === doc.id 
                    ? 'bg-blue-50 text-blue-700 font-medium border border-blue-100' 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="truncate font-medium">{doc.title || doc.id}</div>
                <div className="flex justify-between mt-1 text-xs opacity-70">
                   <span>{doc.category || 'No Category'}</span>
                   <span>{new Date(Number(doc.date) || Date.now()).toLocaleDateString()}</span> 
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main: History Details */}
        <div className="lg:col-span-3">
          {!selectedDocId ? (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center text-slate-400">
              <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>左側のリストからドキュメントを選択してください</p>
            </div>
          ) : loadingHistory ? (
            <div className="p-12 text-center text-slate-500">Loading details...</div>
          ) : (
            <div className="space-y-6">
              {history.map((record, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                    <button 
                      onClick={() => onSelectHistory(record)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      詳細を見る →
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-slate-700 line-clamp-3 mb-4">{record.extracted_data.summary}</p>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded border ${
                        record.evaluation.status === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        record.evaluation.status === 'negative' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        {record.evaluation.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs rounded bg-slate-50 text-slate-600 border border-slate-100">
                        Score: {record.evaluation.score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
