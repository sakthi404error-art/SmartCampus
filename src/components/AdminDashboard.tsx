"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, User, FileEdit, AlertCircle, UploadCloud, CheckCircle2, Loader2, Database } from "lucide-react";
import Papa from "papaparse";

export default function AdminDashboard() {
  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadTable, setUploadTable] = useState("attendance_data"); // Default to attendance
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setSearchLoading(true);
    setSearchError(null);
    setStudent(null);

    try {
      // 1. Search in the master personal_data table
      const { data: personalData, error: personalError } = await supabase.from("personal_data").select("*");
      if (personalError) throw personalError;

      const foundStudent = personalData?.find((s) => 
        JSON.stringify(s).toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (!foundStudent) {
        setSearchError("No student found with that name or Roll Number.");
      } else {
        // 2. If found, fetch their academic info to display on the card
        const { data: acadData } = await supabase
          .from("academic_data")
          .select("*")
          .eq("roll_number", foundStudent.roll_number)
          .maybeSingle();
          
        setStudent({ ...foundStudent, ...acadData });
      }
    } catch (err) {
      console.error(err);
      setSearchError("Failed to connect to the database.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          
          // Upsert data directly into the table selected in the dropdown
          const { error } = await supabase.from(uploadTable).upsert(rows);
          
          if (error) throw error;
          
          setUploadMessage({ text: `Successfully synced ${rows.length} records to ${uploadTable}!`, type: "success" });
        } catch (err: any) {
          console.error(err);
          setUploadMessage({ text: `Upload failed: ${err.message}`, type: "error" });
        } finally {
          setUploading(false);
          e.target.value = ""; // Reset file input
        }
      },
      error: (error) => {
        setUploadMessage({ text: `Failed to read CSV: ${error.message}`, type: "error" });
        setUploading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Admin Control Center</p>
            <h1 className="text-2xl font-semibold">Student Inspector</h1>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or roll number (e.g. MBA26001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Error Message */}
        {searchError && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" /> {searchError}
          </div>
        )}

        {/* Student Profile Card */}
        {student && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="bg-slate-50 p-6 sm:flex sm:items-center sm:justify-between">
              <div className="sm:flex sm:gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <User className="h-8 w-8" />
                </div>
                <div className="mt-4 sm:mt-0 sm:pt-1">
                  <p className="text-xl font-bold text-slate-900">{student.full_name}</p>
                  <p className="text-sm font-medium text-slate-500">
                    {student.programme || "MBA"} {student.specialization ? `in ${student.specialization}` : ""} · Roll No: {student.roll_number}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-3 sm:mt-0">
                <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50">
                  <FileEdit className="h-4 w-4 text-slate-400" /> Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Bulk Upload Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight">Bulk Data Migration</h2>
          <p className="text-sm text-slate-500">Update the relational database via CSV upload.</p>
        </div>
        
        <div className="mb-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Database className="h-4 w-4" /> Select Destination Table
          </label>
          <select 
            value={uploadTable}
            onChange={(e) => setUploadTable(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-600"
          >
            <option value="attendance_data">Attendance Data (Updates Daily)</option>
            <option value="marks_data">Marks Data (Updates Semesterly)</option>
            <option value="academic_data">Academic Data</option>
            <option value="personal_data">Personal Data (Master Roster)</option>
          </select>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50">
          <UploadCloud className="mb-3 h-8 w-8 text-indigo-500" />
          <p className="mb-1 text-sm font-medium text-slate-700">Click to upload CSV file</p>
          <p className="mb-4 text-xs text-slate-500">Headers must match the {uploadTable} columns</p>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleCSVUpload}
              disabled={uploading}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 disabled:opacity-50">
              {uploading ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span>
              ) : (
                "Select File"
              )}
            </button>
          </div>
        </div>

        {uploadMessage && (
          <div className={`mt-4 flex items-center gap-2 rounded-lg p-4 text-sm ${uploadMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {uploadMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {uploadMessage.text}
          </div>
        )}
      </section>
    </div>
  );
}