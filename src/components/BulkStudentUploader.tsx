"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { UploadCloud, Users, Image as ImageIcon, Loader2 } from "lucide-react";

export default function BulkStudentUploader() {
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [isUploadingPics, setIsUploadingPics] = useState(false);

  const handleBulkPictures = async (e: any) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPics(true);
    let successCount = 0;

    try {
      for (const file of files) {
        // Automatically maps MBA26001.jpg to student MBA26001
        const rollNumber = file.name.split('.')[0].toUpperCase();
        const filePath = `${rollNumber}_${Date.now()}`;

        const { error: uploadError } = await supabase.storage.from('profile_pics').upload(filePath, file);
        if (!uploadError) {
          const { data } = supabase.storage.from('profile_pics').getPublicUrl(filePath);
          await supabase.from('personal_data').update({ profile_pic_url: data.publicUrl }).eq('roll_number', rollNumber);
          successCount++;
        }
      }
      alert(`✅ Successfully mapped ${successCount} profile pictures to students!`);
    } catch (err: any) {
      alert("Error during upload: " + err.message);
    } finally {
      setIsUploadingPics(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* CSV Uploader */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600"/> Bulk Data Upload (CSV)</h2><p className="text-xs text-slate-500 mt-1">Upload student demographic or academic records.</p></div>
        <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all hover:border-indigo-400">
          <div className="flex flex-col items-center">
            <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
            <p className="text-sm font-bold text-slate-700">Upload CSV File</p>
          </div>
        </div>
      </div>

      {/* NEW: Bulk Image Uploader */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-indigo-600"/> Bulk Profile Pictures</h2><p className="text-xs text-slate-500 mt-1">Select multiple images. Name files exactly by Roll Number (e.g., MBA26001.jpg).</p></div>
        <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all hover:border-indigo-400">
          {isUploadingPics ? (
             <div className="flex flex-col items-center"><Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-3" /><p className="text-sm font-bold text-indigo-600">Uploading & Mapping...</p></div>
          ) : (
            <>
              <input type="file" multiple accept="image/*" onChange={handleBulkPictures} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              <div className="flex flex-col items-center">
                <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                <p className="text-sm font-bold text-slate-700">Select Multiple Images</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}