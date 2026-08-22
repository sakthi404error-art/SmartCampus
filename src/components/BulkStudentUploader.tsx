"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Users } from "lucide-react";

export default function BulkStudentUploader() {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus({ type: null, message: '' });

    // Parse the CSV file
    Papa.parse(file, {
      header: true, // Expects column names in the first row
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          
          // Format data to match your personal_data table columns
          const formattedData = data.map((row) => ({
            roll_number: row.roll_number?.toUpperCase(),
            full_name: row.full_name,
            email: row.email?.toLowerCase(),
            city: row.city || 'Chennai',
          }));

          // Validate basic requirements
          if (!formattedData[0]?.roll_number || !formattedData[0]?.email) {
            throw new Error("Invalid CSV format. Ensure columns 'roll_number', 'full_name', and 'email' exist.");
          }

          // Bulk Insert into Supabase
          const { error } = await supabase
            .from('personal_data')
            .upsert(formattedData, { onConflict: 'roll_number' }); // Upsert updates existing records instead of crashing

          if (error) throw error;

          setStatus({ type: 'success', message: `Successfully uploaded and synced ${formattedData.length} student records!` });
        } catch (error: any) {
          setStatus({ type: 'error', message: error.message || "Failed to import database." });
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        setStatus({ type: 'error', message: `Error reading file: ${error.message}` });
        setUploading(false);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-xl">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-indigo-600" />
        Bulk Student Import (CSV)
      </h3>

      <div className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-200">
        <p className="text-sm font-medium text-slate-700 mb-2">Required CSV Headers:</p>
        <code className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-800">roll_number</code>, 
        <code className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-800 ml-2">full_name</code>, 
        <code className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-800 ml-2">email</code>
      </div>

      {status.message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
          {status.type === 'error' ? <AlertCircle className="h-5 w-5 flex-shrink-0" /> : <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
          {status.message}
        </div>
      )}

      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all ${uploading ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv" 
          className="hidden" 
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center text-indigo-600">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-sm font-bold">Processing spreadsheet...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500">
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <UploadCloud className="h-8 w-8 text-indigo-500" />
            </div>
            <p className="text-sm font-bold text-slate-700">Click to upload CSV file</p>
            <p className="text-xs mt-1">Updates existing roll numbers automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}