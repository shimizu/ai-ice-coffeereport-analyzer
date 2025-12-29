import React, { useState, useEffect } from 'react';
import { UploadSection } from './components/UploadSection';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { HistoryDashboard } from './components/HistoryDashboard';
import { Login } from './components/Login';
import { analyzeDocument } from './services/geminiService';
import { initDB, saveAnalysisResult } from './services/dbService';
import { AnalysisResult } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type ViewMode = 'analyze' | 'history';

const MainContent: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('analyze');

  useEffect(() => {
    const checkBackend = async () => {
      const isConnected = await initDB();
      setBackendConnected(isConnected);
    };
    if (user) {
      checkBackend();
    }
  }, [user]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Analyze with Gemini
      const data = await analyzeDocument(file);
      setResult(data);

      // 2. Save to Backend
      if (backendConnected) {
        try {
          await saveAnalysisResult(data);
          console.log("Data saved to Backend successfully");
        } catch (dbError: any) {
          console.error("Failed to save to DB:", dbError);
          setError(`分析は完了しましたが、データベースへの保存に失敗しました: ${dbError.message}`);
        }
      } else {
        console.warn("Backend not connected, skipping save.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "分析に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const handleSelectHistory = (data: AnalysisResult) => {
    setResult(data);
    setViewMode('analyze');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setViewMode('analyze'); handleReset(); }}>
              <div className="bg-blue-600 rounded-lg p-1.5">
                {/* 汎用的なドキュメントアイコンに変更 */}
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">
                AI Document Analyzer
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Navigation Links */}
              <div className="flex space-x-4">
                <button 
                  onClick={() => setViewMode('analyze')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'analyze' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  新規分析
                </button>
                <button 
                  onClick={() => setViewMode('history')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'history' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  分析履歴
                </button>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-500"></span>
                  {backendConnected ? 'Connected' : 'Disconnected'}
                </div>
                
                <div className="flex items-center gap-2">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                    alt="User" 
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                  <button 
                    onClick={logout}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {viewMode === 'analyze' && (
          <>
            {!result && (
              <div className="max-w-3xl mx-auto text-center space-y-8 mt-12 animate-fade-in-up">
                 <div className="space-y-4">
                   <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                     AIによるドキュメント自動解析
                   </h1>
                   <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                     分析したいPDFファイルをアップロードしてください。<br/>
                     AIが内容を要約し、重要なデータを抽出・評価します。
                   </p>
                 </div>

                 <div className="bg-white rounded-2xl shadow-xl p-2 border border-slate-100">
                    <UploadSection onFileSelect={handleFileSelect} isProcessing={loading} />
                 </div>

                 {loading && (
                   <div className="flex flex-col items-center justify-center p-8 space-y-4">
                     <div className="relative w-16 h-16">
                       <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
                       <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                     </div>
                     <p className="text-slate-600 font-medium animate-pulse">
                       ドキュメント解析中...
                     </p>
                   </div>
                 )}

                 {error && (
                   <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left flex gap-3">
                     <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <div>
                       <h3 className="font-medium text-red-800">処理エラー</h3>
                       <p className="text-sm text-red-700 mt-1">{error}</p>
                     </div>
                   </div>
                 )}
              </div>
            )}

            {result && (
              <AnalysisDashboard data={result} onReset={handleReset} />
            )}
          </>
        )}

        {viewMode === 'history' && (
          <HistoryDashboard onSelectHistory={handleSelectHistory} />
        )}

      </main>

    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;