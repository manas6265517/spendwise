import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function CSVImporter({ onImportSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [fullData, setFullData] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      processFile(droppedFile);
    } else {
      alert('Please upload a valid CSV file.');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (file) => {
    setFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setFullData(results.data); // Save everything for the backend
        setPreviewData(results.data.slice(0, 5)); // Save just 5 for the UI
      },
    });
  };

  const clearFile = () => {
    setFile(null);
    setPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    setIsUploading(true);
    try {
      // Assuming userId is 1 for now. 
      const payload = {
        userId: 1,
        transactions: fullData
      };

      // Send to your Express backend
      await axios.post('https://spendwise-backend.onrender.com/api/transactions/bulk', payload);
      
      alert('Data successfully imported and synced to database!');
      clearFile();
      if (onImportSuccess) onImportSuccess();
    } catch (error) {
      console.error("Import failed:", error);
      alert('Failed to import data. Please check the console.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto mt-6">
      <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
        
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Data Import Studio</h2>
          <p className="text-slate-400">Upload your bank statements or existing expense sheets. We will automatically parse and map your transactions.</p>
        </div>

        {/* Drag & Drop Zone */}
        {!file ? (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
            }`}
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-slate-700/50 rounded-full">
                <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} />
              </div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Drag and drop your CSV here</h3>
            <p className="text-slate-400 text-sm mb-6">Supported formats: .csv (Max size 5MB)</p>
            
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
            >
              Browse Files
            </button>
          </div>
        ) : (
          
          /* Active File Preview State */
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <FileText className="text-emerald-400" size={24} />
                </div>
                <div>
                  <h4 className="text-white font-medium">{file.name}</h4>
                  <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB • Ready for review</p>
                </div>
              </div>
              <button onClick={clearFile} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Data Preview Table */}
            <div className="border border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={18} />
                <span className="text-sm font-medium text-slate-300">Data Preview (First 5 rows)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50">
                      {previewData.length > 0 && Object.keys(previewData[0]).map((header, i) => (
                        <th key={i} className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800">
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-700/50 last:border-0">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-4 py-3 text-sm text-slate-300 truncate max-w-[150px]">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-indigo-400" size={20} />
                <p className="text-sm text-indigo-200">Our engine will automatically detect and skip duplicate entries during import.</p>
              </div>
              <button 
                onClick={handleImport}
                disabled={isUploading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {isUploading ? 'Importing...' : 'Confirm & Import'}
                {!isUploading && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}