/**
 * ログイン画面コンポーネント
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg border border-slate-200 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            AI Document Analyzer
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            利用するにはログインしてください
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={loginWithGoogle}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Googleアカウントでログイン
          </button>
        </div>
      </div>
    </div>
  );
};