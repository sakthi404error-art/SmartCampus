"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, Sparkles, TrendingUp, Target, Briefcase } from "lucide-react";

export default function PlacementATS({ rollNumber }: { rollNumber: string }) {
  const [resumeType, setResumeType] = useState<"Specialization" | "Management">("Specialization");
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handleFileUpload = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalysisResult(null); // Reset previous analysis
    }
  };

  const runAIAtsScan = () => {
    if (!file) return;
    setIsScanning(true);
    
    // Simulating deep AI document parsing and ATS scoring
    setTimeout(() => {
      setAnalysisResult({
        score: 78,
        roleMatch: "IT Business Analyst / SAP Functional Consultant",
        expectedSalary: "₹8L - ₹12L PA",
        strengths: ["Strong academic background", "Clear formatting", "Basic system knowledge"],
        weaknesses: ["Lacks specific ERP module certifications (e.g., SAP MM)", "Missing keywords for Product Lifecycle Management (PLM)", "Needs more quantifiable project metrics"],
        actionItems: [
          "Add specific keywords: 'Bill of Materials', 'ERP Implementation', 'Agile Methodology'.",
          "Include a project highlighting cross-functional team leadership.",
          "Complete an advanced Excel or Power BI certification to boost data analytics score."
        ]
      });
      setIsScanning(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" /> AI Resume ATS Scanner
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            Upload your resume to get instant, generative AI-powered feedback. Discover how applicant tracking systems rank your profile for specific corporate roles before you apply.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Select Resume Profile</label>
              <div className="flex gap-4">
                <button onClick={() => setResumeType("Specialization")} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${resumeType === "Specialization" ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>Systems & Tech (Specialization)</button>
                <button onClick={() => setResumeType("Management")} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${resumeType === "Management" ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>General Management</button>
              </div>
            </div>

            <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/50">
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="h-10 w-10 text-indigo-600 mb-3" />
                  <p className="text-sm font-bold text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                  <p className="text-sm font-bold text-slate-700">Drag & drop your resume here</p>
                  <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX (Max 5MB)</p>
                </div>
              )}
            </div>

            <button 
              onClick={runAIAtsScan} 
              disabled={!file || isScanning}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? <><Loader2 className="h-5 w-5 animate-spin"/> AI Engine Processing...</> : <><Target className="h-5 w-5"/> Run ATS Analysis</>}
            </button>
          </div>

          {/* Results Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            {!analysisResult && !isScanning && (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <Briefcase className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">Upload a resume and run the analysis to see your ATS ranking and AI feedback here.</p>
              </div>
            )}

            {isScanning && (
              <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm font-bold text-indigo-600 animate-pulse">Extracting Keywords & Mapping Competencies...</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">ATS Match Score</p>
                    <div className="flex items-end gap-2 mt-1">
                      <span className={`text-4xl font-extrabold ${analysisResult.score >= 80 ? 'text-emerald-600' : 'text-amber-500'}`}>{analysisResult.score}</span>
                      <span className="text-sm font-medium text-slate-500 mb-1">/ 100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Market Value Projection</p>
                    <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1 justify-end"><TrendingUp className="h-4 w-4 text-emerald-500"/> {analysisResult.expectedSalary}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> Detected Strengths</h4>
                  <ul className="space-y-2">
                    {analysisResult.strengths.map((s: string, i: number) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"/> {s}</li>)}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500"/> Missing Critical Elements</h4>
                  <ul className="space-y-2">
                    {analysisResult.weaknesses.map((w: string, i: number) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"/> {w}</li>)}
                  </ul>
                </div>

                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                  <h4 className="text-sm font-bold text-indigo-900 mb-2">AI Recommended Actions</h4>
                  <ul className="space-y-2">
                    {analysisResult.actionItems.map((act: string, i: number) => <li key={i} className="text-xs font-medium text-indigo-700 flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"/> {act}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}