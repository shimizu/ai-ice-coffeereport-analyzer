/**
 * ファイルアップロードセクション
 * 汎用的なPDFアップロードUI
 */

import React, { useCallback, useState } from 'react';

/**
 * ファイルアップロード用コンポーネント
 * 
 * 役割:
 * ユーザーがExcelファイル(.xls, .xlsx)またはPDFをアップロードするためのUIを提供します。
 * ドラッグ＆ドロップとクリックによるファイル選択の両方をサポートします。
 * 
 * 機能:
 * - ドラッグ＆ドロップ時の視覚的フィードバック（背景色変更）
 * - ファイル拡張子/MIMEタイプのバリデーション
 * - 親コンポーネントへのファイル受け渡し
 */

interface UploadSectionProps {
  onFileSelect: (file: File) => void; // ファイル選択成功時のコールバック
  isProcessing: boolean;             // 処理中フラグ（操作無効化用）
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  // ドラッグオーバー時の処理：ブラウザのデフォルト挙動を抑制し、状態を更新
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // ドラッグ領域から出た時の処理
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // ドロップ時の処理
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // バリデーション：Excelファイル (.xls, .xlsx) または PDF を許可
      // ※ MIME type判定はOS/ブラウザによって異なる場合があるため、拡張子チェックも併用
      if (
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.xlsx') ||
        file.type === 'application/pdf'
      ) {
        onFileSelect(file);
      } else {
        alert('Excelファイル(.xls, .xlsx) または PDFファイルをアップロードしてください。');
      }
    }
  }, [onFileSelect]);

  // ファイル入力（input type="file"）変更時の処理
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
        isDragging 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-slate-300 hover:border-slate-400 bg-white'
      } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input 
        type="file" 
        id="file-input" 
        accept=".pdf, .xls, .xlsx" 
        className="hidden" 
        onChange={handleFileInput}
        disabled={isProcessing}
      />
      
      <div className="mx-auto h-12 w-12 text-slate-400 mb-4">
        {/* アイコン SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-slate-900">
        在庫レポート（Excel）をアップロード
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        ファイルをドラッグ＆ドロップ、またはクリックして選択 (.xls, .xlsx)
      </p>
    </div>
  );
};
