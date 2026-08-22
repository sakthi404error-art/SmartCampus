"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, Upload, Download, Loader2, CheckCircle2 } from "lucide-react";

interface Material {
  id: string;
  file_name: string;
  file_url: string;
  subject_code: string;
  file_type: string;
  created_at: string;
}

export default function CourseMaterials({
  subjectCode = "MBA-401",
  canUpload = false,
}: {
  subjectCode?: string;
  canUpload?: boolean;
}) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("Lecture Notes");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch materials for the active subject
  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_materials")
      .select("*")
      .eq("subject_code", subjectCode)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMaterials(data as Material[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, [subjectCode]);

  // Handle file upload to Supabase Storage + Table
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setSuccessMessage(null);

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${subjectCode}/${fileName}`;

      // 1. Upload to Supabase Storage Bucket
      const { error: uploadError } = await supabase.storage
        .from("course-materials")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: urlData } = supabase.storage
        .from("course-materials")
        .getPublicUrl(filePath);

      // 3. Save Record in Database
      const { error: dbError } = await supabase.from("course_materials").insert([
        {
          file_name: selectedFile.name,
          file_url: urlData.publicUrl,
          subject_code: subjectCode,
          file_type: fileType,
          uploaded_by_role: "Professor",
        },
      ]);

      if (dbError) throw dbError;

      setSuccessMessage("File uploaded and shared successfully!");
      setSelectedFile(null);
      fetchMaterials();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Course Resources & Notes</h2>
          <p className="text-xs text-slate-500">Module: {subjectCode}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
          {materials.length} Files Available
        </span>
      </div>

      {/* Professor Upload Interface */}
      {canUpload && (
        <form onSubmit={handleUpload} className="mb-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Upload Notes / Assignments
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="col-span-2 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-600"
            >
              <option value="Lecture Notes">Lecture Notes</option>
              <option value="Assignment">Assignment</option>
              <option value="Syllabus">Syllabus</option>
              <option value="Case Study">Case Study</option>
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {successMessage ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> {successMessage}
              </span>
            ) : <div />}
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Publish File
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Materials List */}
      {loading ? (
        <p className="py-6 text-center text-xs text-slate-500">Loading course files...</p>
      ) : materials.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">No study materials published yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {materials.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.file_name}</p>
                  <p className="text-[11px] text-slate-400">{item.file_type} · {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}