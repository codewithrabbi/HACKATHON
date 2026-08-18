"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Sparkles, Database, FileDigit, ArrowRight } from "lucide-react";

export default function DataUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<"sales" | "inventory">("sales");
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStatus("idle");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("dataType", dataType);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_BASE}/api/data/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errMsg = "Upload failed. Check if file format matches.";
        try {
          const errData = await response.json();
          errMsg = errData.detail || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const result = await response.json();
      setStatus("success");
      setMessage(`Successfully imported ${result.inserted} rows of data into the '${result.table}' table.`);
      setFile(null);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen pb-24">
      {/* Header Section */}
      <div className="animate-fade-in flex flex-col items-center justify-center text-center mb-16 mt-8">
        <h1 className="text-5xl md:text-6xl font-display text-paper mb-4">
          Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-brass to-yellow-200">Ingestion</span>
        </h1>
        <p className="text-muted text-lg max-w-2xl font-light mb-8">
          Select your data type and drop your CSV file below. The file must match the required schema exactly.
        </p>
        
        {/* Data Type Selector */}
        <div className="flex bg-surface/50 p-1.5 rounded-2xl border border-line backdrop-blur-md">
          <button
            onClick={() => setDataType("sales")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              dataType === "sales" 
                ? "bg-brass text-black shadow-lg" 
                : "text-muted hover:text-paper hover:bg-surface2"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileDigit size={16} /> Sales Data
            </div>
          </button>
          <button
            onClick={() => setDataType("inventory")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              dataType === "inventory" 
                ? "bg-brass text-black shadow-lg" 
                : "text-muted hover:text-paper hover:bg-surface2"
            }`}
          >
            <div className="flex items-center gap-2">
              <Database size={16} /> Inventory Data
            </div>
          </button>
        </div>
      </div>

      {/* Main Upload Portal */}
      <div className="animate-fade-in max-w-3xl mx-auto" style={{ animationDelay: "100ms" }}>
        <div className="relative group rounded-[2rem] p-1 bg-gradient-to-b from-brass/20 to-surface/10 shadow-[0_0_50px_rgba(212,175,55,0.05)] transition-all duration-500 hover:shadow-[0_0_80px_rgba(212,175,55,0.1)]">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-3xl rounded-[2rem] z-0"></div>
          
          <div className="relative z-10 p-8 sm:p-12">
            <div 
              className={`relative overflow-hidden rounded-[1.5rem] p-12 flex flex-col items-center justify-center transition-all duration-500 ${
                file 
                ? 'bg-brass/5 border border-brass/30 shadow-inner' 
                : 'bg-surface2/50 border-2 border-dashed border-line hover:border-brass/40 hover:bg-surface2'
              }`}
              style={{ minHeight: "300px" }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
              
              {!file ? (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                  
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-surface to-surface2 border border-line flex items-center justify-center mb-6 text-muted relative shadow-xl transition-transform duration-500 group-hover:scale-110">
                    <div className="absolute inset-0 rounded-full bg-brass/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <UploadCloud size={40} className="group-hover:text-brass transition-colors duration-500 relative z-10" />
                  </div>
                  <p className="text-paper font-medium text-2xl mb-3 tracking-tight">Drag & Drop your CSV file</p>
                  <p className="text-muted text-sm mb-8 font-mono">Supports any format • Max size: 50MB</p>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="group/btn relative px-8 py-3 rounded-full bg-surface border border-line text-paper overflow-hidden transition-all hover:border-brass/50"
                  >
                    <div className="absolute inset-0 bg-brass/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative z-10 font-medium flex items-center gap-2">
                      Browse Files <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </>
              ) : (
                <div className="w-full flex flex-col items-center animate-scale-in">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brass/20 to-brass/5 flex items-center justify-center mb-8 text-brass relative shadow-[0_0_40px_rgba(212,175,55,0.2)]">
                    <div className="absolute inset-0 rounded-full border border-brass/40 animate-ping opacity-30"></div>
                    <div className="absolute inset-2 rounded-full border border-brass/20 animate-spin-slow"></div>
                    <FileSpreadsheet size={56} className="relative z-10" />
                  </div>
                  
                  <h3 className="text-paper font-display text-3xl mb-3">{file.name}</h3>
                  <div className="flex items-center gap-3 mb-10 text-muted font-mono text-sm bg-surface rounded-full px-4 py-2 border border-line">
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    <span className="w-1 h-1 rounded-full bg-brass"></span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-brass"/> Ready to Import</span>
                  </div>
                  
                  <div className="flex gap-4 w-full max-w-sm">
                    <button 
                      onClick={() => setFile(null)}
                      className="flex-1 py-4 rounded-xl bg-surface border border-line text-paper hover:bg-surface2 transition-colors text-sm font-medium"
                      disabled={isUploading}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-[2] py-4 rounded-xl bg-brass text-black font-medium hover:bg-yellow-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <><Loader2 size={18} className="animate-spin" /> Processing...</>
                      ) : (
                        <><Database size={18} /> Begin Import</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {status === "success" && (
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-signal/10 to-signal/5 border border-signal/30 text-signal flex items-start gap-4 animate-slide-up shadow-[0_0_30px_rgba(74,222,128,0.1)]">
                <div className="bg-signal/20 p-2 rounded-full">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-display text-lg mb-1 text-signal">Import Successful</h4>
                  <p className="text-sm opacity-90 leading-relaxed text-paper">{message}</p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-alert/10 to-alert/5 border border-alert/30 text-alert flex items-start gap-4 animate-slide-up shadow-[0_0_30px_rgba(248,113,113,0.1)]">
                <div className="bg-alert/20 p-2 rounded-full">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="font-display text-lg mb-1 text-alert">Processing Failed</h4>
                  <p className="text-sm opacity-90 leading-relaxed text-paper">{message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Schemas Section */}
      <div className="mt-24 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="text-center mb-10">
          <h2 className="text-2xl font-display text-paper mb-2">Required Data Schemas</h2>
          <p className="text-muted text-sm max-w-xl mx-auto">
            Your CSV headers must perfectly match the schemas below. Missing or mismatched columns will cause errors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Sales Schema Card */}
          <div className="group rounded-3xl p-8 bg-surface/50 border border-line hover:border-signal/30 transition-all hover:bg-surface/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-signal/5 rounded-full blur-3xl group-hover:bg-signal/10 transition-colors"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-signal/10 border border-signal/20 flex items-center justify-center text-signal">
                  <FileDigit size={20} />
                </div>
                <h3 className="text-lg font-medium text-paper">Sales Data</h3>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-signal bg-signal/10 px-3 py-1 rounded-full border border-signal/20">Primary</span>
            </div>

            <div className="space-y-3">
              {[
                { name: "transaction_id", type: "string", desc: "Unique TXN ID" },
                { name: "date", type: "date", desc: "Sale date (YYYY-MM-DD)" },
                { name: "customer_id", type: "string", desc: "Customer ID" },
                { name: "product_id", type: "string", desc: "Product ID" },
                { name: "quantity", type: "integer", desc: "Items sold" },
                { name: "unit_price", type: "numeric", desc: "Price per item" },
                { name: "discount", type: "numeric", desc: "Discount applied" },
                { name: "tax", type: "numeric", desc: "Tax amount" },
                { name: "total_amount", type: "numeric", desc: "Total revenue" },
                { name: "payment_status", type: "string", desc: "Paid/Pending/Failed" },
                { name: "payment_method", type: "string", desc: "Card/Bank/Cash" },
                { name: "sales_channel", type: "string", desc: "Online/Store" },
                { name: "salesperson_id", type: "string", desc: "Salesperson ID" },
                { name: "region", type: "string", desc: "Sales region" },
              ].map((col) => (
                <div key={col.name} className="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
                  <span className="font-mono text-sm text-paper">{col.name}</span>
                  <div className="text-right">
                    <span className="text-xs text-muted block">{col.desc}</span>
                    <span className="text-[10px] font-mono text-signal/70 uppercase">{col.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Schema Card */}
          <div className="group rounded-3xl p-8 bg-surface/50 border border-line hover:border-brass/30 transition-all hover:bg-surface/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brass/5 rounded-full blur-3xl group-hover:bg-brass/10 transition-colors"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brass/10 border border-brass/20 flex items-center justify-center text-brass">
                  <Database size={20} />
                </div>
                <h3 className="text-lg font-medium text-paper">Inventory Data</h3>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-brass bg-brass/10 px-3 py-1 rounded-full border border-brass/20">Secondary</span>
            </div>

            <div className="space-y-3">
              {[
                { name: "product_id", type: "string", desc: "Unique identifier" },
                { name: "current_stock", type: "integer", desc: "Available items" },
                { name: "reorder_point", type: "integer", desc: "Alert threshold" },
                { name: "max_capacity", type: "integer", desc: "Storage limit" },
                { name: "warehouse", type: "string", desc: "Storage location" },
                { name: "last_restocked", type: "date", desc: "YYYY-MM-DD" },
              ].map((col) => (
                <div key={col.name} className="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
                  <span className="font-mono text-sm text-paper">{col.name}</span>
                  <div className="text-right">
                    <span className="text-xs text-muted block">{col.desc}</span>
                    <span className="text-[10px] font-mono text-brass/70 uppercase">{col.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
