"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UploadCloud, Clock, CheckCircle2, FileText, Loader2, AlertCircle, Calendar } from "lucide-react";

export default function Projects({ rollNumber }: { rollNumber: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjectsAndSubmissions() {
      setLoading(true);
      // 1. Fetch all assigned projects
      const { data: projectsData } = await supabase.from("projects").select("*").order("deadline", { ascending: true });
      
      // 2. Fetch this specific student's submissions
      const { data: submissionsData } = await supabase
        .from("project_submissions")
        .select("*")
        .eq("student_roll_number", rollNumber);

      if (projectsData) setProjects(projectsData);
      if (submissionsData) setSubmissions(submissionsData);
      setLoading(false);
    }
    
    if (rollNumber) fetchProjectsAndSubmissions();
  }, [rollNumber]);

  const handleFileUpload = async (event: any, projectId: string) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingId(projectId);

    try {
      // 1. Create a unique, safe file name
      const fileExt = file.name.split('.').pop();
      const safeRollNumber = rollNumber.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${projectId}_${safeRollNumber}_${Date.now()}.${fileExt}`;
      const filePath = `${safeRollNumber}/${fileName}`;

      // 2. Upload the file to your public Supabase bucket
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get the public URL so the Admin can download it later
      const { data: publicUrlData } = supabase.storage
        .from("project-files")
        .getPublicUrl(filePath);

      // 4. Record the successful submission in the database
      const { error: dbError } = await supabase.from("project_submissions").insert([
        {
          project_id: projectId,
          student_roll_number: rollNumber,
          file_name: file.name,
          file_url: publicUrlData.publicUrl,
          status: "Submitted"
        }
      ]);

      if (dbError) throw dbError;

      // 5. Update the UI instantly without refreshing
      setSubmissions([...submissions, { project_id: projectId, file_name: file.name, status: "Submitted" }]);
      alert("Project submitted successfully!");

    } catch (error: any) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  // Helper function to calculate days left
  const calculateDaysLeft = (deadlineDate: string) => {
    const today = new Date();
    const target = new Date(deadlineDate);
    const difference = target.getTime() - today.getTime();
    const daysLeft = Math.ceil(difference / (1000 * 3600 * 24));
    return daysLeft;
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Project Submissions</h2>
          <p className="text-sm text-slate-500 mt-1">Upload files before the deadlines to secure your grades.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => {
          const submission = submissions.find(s => s.project_id === project.id);
          const daysLeft = calculateDaysLeft(project.deadline);
          const isOverdue = daysLeft < 0;

          return (
            <div key={project.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-900 leading-tight pr-4">{project.title}</h3>
                {submission ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Submitted
                  </span>
                ) : isOverdue ? (
                  <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700 border border-red-200">
                    <AlertCircle className="h-3 w-3" /> Overdue
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 border border-amber-200">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                )}
              </div>
              
              <p className="text-sm text-slate-600 mb-6 flex-1">{project.description}</p>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Due: {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {!submission && (
                  <div className={`text-xs font-bold ${isOverdue ? 'text-red-600' : daysLeft <= 2 ? 'text-amber-600' : 'text-indigo-600'}`}>
                    {isOverdue ? 'Deadline Passed' : `${daysLeft} days left`}
                  </div>
                )}
              </div>

              {/* Upload UI Engine */}
              {submission ? (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-slate-700 truncate">{submission.file_name}</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    id={`file-upload-${project.id}`}
                    className="hidden"
                    disabled={uploadingId === project.id || isOverdue}
                    onChange={(e) => handleFileUpload(e, project.id)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  />
                  <label
                    htmlFor={`file-upload-${project.id}`}
                    className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                      isOverdue 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-transparent'
                    }`}
                  >
                    {uploadingId === project.id ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Uploading to Secure Vault...</>
                    ) : isOverdue ? (
                      "Submission Locked"
                    ) : (
                      <><UploadCloud className="h-5 w-5" /> Select & Upload File</>
                    )}
                  </label>
                </div>
              )}
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <h3 className="text-lg font-bold text-slate-700">No Projects Assigned</h3>
            <p className="text-sm text-slate-500 mt-1">Enjoy your free time! Your professors haven't uploaded any tasks yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}