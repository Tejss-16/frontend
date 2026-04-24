import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

const FileInput = ({ file, setFile, onUpload }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const clearFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="glass-card hover:border-blue-500/20 p-8 flex flex-col items-center justify-center min-h-[220px]">
            {file ? (
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        {isUploading ? <Loader2 className="animate-spin" size={32} /> : <FileText size={32} />}
                    </div>
                    <div className="text-center overflow-hidden w-full">
                        <p className="font-semibold text-white truncate max-w-xs mx-auto">{file.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                            {isUploading ? "Uploading..." : `${(file.size / 1024).toFixed(1)} KB`}
                        </p>
                    </div>
                    <button
                        onClick={clearFile}
                        disabled={isUploading}
                        className="flex items-center gap-2 mt-2 px-4 py-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={16} />
                        Remove Dataset
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center w-full">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                            const selectedFile = e.target.files[0];
                            if (!selectedFile) return;
                            setFile(selectedFile);
                            if (onUpload) {
                                onUpload(selectedFile);
                            }
                        }}
                        className="hidden"
                        accept=".csv,.xlsx,.json"
                    />
                    <div className="p-5 bg-blue-500/10 text-blue-500 rounded-2xl mb-4 border border-blue-500/20 shadow-glow">
                        <Upload size={32} />
                    </div>
                    <p className="text-slate-400 text-center mb-6 max-w-xs font-medium">
                        Drag & drop your dataset here
                    </p>
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="bg-[#1a2333] text-white border border-white/10 px-8 py-3 rounded-xl font-bold hover:bg-[#232d41] transition-all hover:border-white/20 active:scale-95 shadow-xl"
                    >
                        Browse File
                    </button>
                    <div className="mt-8 flex items-center gap-3">
                        <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-slate-500 border border-white/5 tracking-tighter uppercase">CSV</span>
                        <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-slate-500 border border-white/5 tracking-tighter uppercase">Excel</span>
                        <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-bold text-slate-500 border border-white/5 tracking-tighter uppercase">JSON</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileInput;