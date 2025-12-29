import React, { useState, useEffect } from 'react';
import { getAllDocuments, getDocumentHistory } from '../services/dbService';
import { AnalysisResult, DocumentMetadata } from '../types';

interface HistoryDashboardProps {
  onSelectHistory: (data: AnalysisResult) => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ onSelectHistory }) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handleDocClick = async (docId: string) => {
    setProcessingId(docId);
    try {
      const data = await getDocumentHistory(docId);
      if (data && data.length > 0) {
        onSelectHistory(data[0]);
      } else {
        alert("分析データが見つかりませんでした。");
      }
    } catch (e) {
      console.error(e);
      alert("データの取得に失敗しました。");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDateTime = (ts?: number) => {
    if (!ts) return '日時不明';
    return new Date(ts).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500">履歴を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">分析履歴</h2>
          <p className="text-sm text-slate-500 mt-1">過去の認証在庫レポート分析一覧</p>
        </div>
        <div className="text-sm font-medium text-slate-500">
          全 {documents.length} 件
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center text-slate-400">
           <p>分析履歴がありません。</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">レポート対象日</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">スコア (強気/弱気)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">エグゼクティブ・サマリー</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr 
                    key={doc.id}
                    onClick={() => !processingId && handleDocClick(doc.id)}
                    className={`group cursor-pointer transition-colors ${
                      processingId === doc.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">
                        {doc.date || '日時不明'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                          (doc.bullish_bearish_score || 0) > 0 ? 'bg-emerald-100 text-emerald-800' :
                          (doc.bullish_bearish_score || 0) < 0 ? 'bg-red-100 text-red-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {doc.bullish_bearish_score > 0 ? '+' : ''}{doc.bullish_bearish_score ?? 0}
                        </div>
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden relative">
                          <div 
                            className={`absolute top-0 bottom-0 transition-all ${
                              (doc.bullish_bearish_score || 0) >= 0 ? 'bg-emerald-500 left-1/2' : 'bg-red-500 right-1/2'
                            }`}
                            style={{ 
                              width: `${Math.abs(doc.bullish_bearish_score || 0) / 2}%`,
                              left: (doc.bullish_bearish_score || 0) >= 0 ? '50%' : 'auto',
                              right: (doc.bullish_bearish_score || 0) < 0 ? '50%' : 'auto'
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 font-medium line-clamp-1">
                        {doc.summary_headline || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {processingId === doc.id ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ml-auto"></div>
                      ) : (
                        <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold flex items-center justify-end">
                          開く
                          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
