"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Search } from "lucide-react";

export default function ProfileUploader() {
  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Verify the student exists before allowing an upload
  const handleVerifyStudent = async () => {
    setStatus({ type: null, message: '' });
    setStudentName(null);
    
    if (!rollNumber) {
      setStatus({ type: 'error', message: 'Please enter a Roll Number first.' });
      return;
    }

    const { data, error } = await supabase
      .from('personal_data')
      .select('full_name')
      .eq('roll_number', rollNumber.toUpperCase())
      .maybeSingle();

    if (error || !data) {
      setStatus({ type: 'error', message: 'Student not found. Check the Roll Number.' });
    } else {
      setStudentName(data.full_name);
      setStatus({ type: 'success', message: `Verified: ${data.full_name}. Ready for upload.` });
    }
  };

  // 2. Handle the file selection and upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      if (!studentName) {
        setStatus({ type: 'error', message: 'Please verify a student before uploading.' });
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Add timestamp to the filename to prevent browser caching issues when updating photos
      const filePath = `${rollNumber.toUpperCase()}-${Date.now()}.${fileExt}`; 

      setUploading(true);
      setStatus({ type: null, message: '' });

      // Step A: Upload file to the public bucket
      const { error: uploadError } = await supabase.storage
        .from('profile_pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Step B: Get the public URL of the newly uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(filePath);

      // Step C: Link the image URL to the student's database profile
      const { error: dbError } = await supabase
        .from('personal_data')
        .update({ profile_pic_url: publicUrl })
        .eq('roll_number', rollNumber.toUpperCase());

      if (dbError) throw dbError;

      setStatus({ type: 'success', message: `Successfully updated profile picture for ${studentName}!` });
      
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Error uploading image.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-xl">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-indigo-600" />
        Student ID Photo Uploader
      </h3>

      {/* Student Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Enter Roll Number (e.g., ISSM001)" 
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 uppercase"
          />
        </div>
        <button 
          onClick={handleVerifyStudent}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
        >
          Verify
        </button>
      </div>

      {/* Status Messages */}
      {status.message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
          {status.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          {status.message}
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div 
        onClick={() => studentName && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all ${studentName ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer' : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp" 
          className="hidden" 
          disabled={!studentName || uploading}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center text-indigo-600">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-sm font-bold">Uploading to securely to cloud...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500">
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <UploadCloud className="h-8 w-8 text-indigo-500" />
            </div>
            <p className="text-sm font-bold text-slate-700">Click to upload ID photo</p>
            <p className="text-xs mt-1">Supports JPG, PNG (Max 5MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}