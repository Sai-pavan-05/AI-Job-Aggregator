"use client";
import { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Settings, 
  Briefcase, 
  Cpu, 
  Play, 
  Sparkles, 
  ExternalLink, 
  Eye, 
  X, 
  Check, 
  Terminal,
  Activity,
  FileText,
  MapPin,
  Building2,
  Share2
} from "lucide-react";

export default function Home() {
  // DB States
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  
  // UI & Loading States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isParsing, setIsParsing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [activeJobApplying, setActiveJobApplying] = useState(null);
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotTitle, setScreenshotTitle] = useState("");
  
  // Log Stream State
  const [logs, setLogs] = useState([]);
  const terminalEndRef = useRef(null);

  // Preference Form State
  const [prefTitleInput, setPrefTitleInput] = useState("");
  const [minSalaryInput, setMinSalaryInput] = useState(120000);
  const [linkedinUrlInput, setLinkedinUrlInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [countryInput, setCountryInput] = useState("India");
  const [stateInput, setStateInput] = useState("");
  const [workModeInput, setWorkModeInput] = useState("any");

  // Notification Banner
  const [notification, setNotification] = useState(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setJobs(data.jobs);
        
        // Seed preference inputs
        if (data.profile) {
          setPrefTitleInput(data.profile.preferences?.titles?.join(", ") || "");
          setMinSalaryInput(data.profile.preferences?.minSalary || 120000);
          setLinkedinUrlInput(data.profile.preferences?.linkedin || "");
          setPhoneInput(data.profile.phone || "");
          
          setCountryInput(data.profile.preferences?.country || "India");
          setStateInput(data.profile.preferences?.state || "");
          setWorkModeInput(data.profile.preferences?.workMode || "any");
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Show banner notification helper
  const showNotification = (text, type = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Resume Upload Handlers
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsing(true);
    showNotification("Uploading and parsing resume PDF using Ollama...", "info");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("model", selectedModel);

    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setPhoneInput(data.profile.phone || "");
        showNotification(
          data.ollamaUsed 
            ? "Resume parsed successfully using local Ollama model!" 
            : "Resume parsed successfully (simulated fallback, Ollama offline).", 
          "success"
        );
      } else {
        showNotification(data.error || "Failed to parse resume.", "error");
      }
    } catch (err) {
      showNotification("Error connecting to parser endpoint.", "error");
    } finally {
      setIsParsing(false);
      loadData();
    }
  };

  // Match Jobs Scoring Handler
  const handleMatch = async () => {
    if (!profile) {
      showNotification("Please upload a resume first before running matching.", "error");
      return;
    }

    setIsMatching(true);
    showNotification("Running AI matching analysis...", "info");

    try {
      const res = await fetch("/api/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel }),
      });

      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
        showNotification(
          data.ollamaUsed 
            ? "AI Job matching scores and skills gaps calculated!" 
            : "Job matching scores calculated (local fallback, Ollama offline).", 
          "success"
        );
      } else {
        showNotification(data.error || "Failed to match jobs.", "error");
      }
    } catch (err) {
      showNotification("Error matching jobs.", "error");
    } finally {
      setIsMatching(false);
    }
  };

  // Save Preferences Handler
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    const updatedPrefs = {
      titles: prefTitleInput.split(",").map(t => t.trim()).filter(Boolean),
      minSalary: parseInt(minSalaryInput) || 0,
      linkedin: linkedinUrlInput.trim(),
      country: countryInput,
      state: stateInput,
      workMode: workModeInput,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePreferences",
          preferences: updatedPrefs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        loadData();
        showNotification("Preferences updated! Refreshing filtered job list.", "success");
        setActiveTab("dashboard");
      } else {
        showNotification("Failed to update preferences.", "error");
      }
    } catch (err) {
      showNotification("Error saving preferences.", "error");
    }
  };

  // Auto-Apply Playwright Stream Handler
  const handleAutoApply = async (job) => {
    if (!profile) {
      showNotification("Please upload your resume to auto-apply.", "error");
      return;
    }

    setIsApplying(true);
    setActiveJobApplying(job.id);
    setLogs([]);
    showNotification(`Launching Playwright Browser to apply for ${job.title}...`, "info");

    const url = `/api/apply?jobId=${encodeURIComponent(job.id)}&url=${encodeURIComponent(job.url)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "log") {
        setLogs(prev => [...prev, data.message]);
      } else if (data.type === "done") {
        eventSource.close();
        setIsApplying(false);
        setActiveJobApplying(null);
        if (data.status === "Applied") {
          showNotification(`Successfully applied for ${job.title}!`, "success");
        } else {
          showNotification(`Application for ${job.title} failed. See logs below.`, "error");
        }
        loadData();
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE stream error:", err);
      eventSource.close();
      setIsApplying(false);
      setActiveJobApplying(null);
      showNotification("Connection lost during auto-apply execution.", "error");
      loadData();
    };
  };

  // Reset / Clear Test Data Handler
  const handleCleanup = async () => {
    if (!confirm("Are you sure you want to permanently delete all parsed profiles, test jobs, screenshots, and logs?")) {
      return;
    }

    try {
      const res = await fetch("/api/cleanup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setProfile(null);
        setJobs([]);
        setLogs([]);
        setPrefTitleInput("");
        setMinSalaryInput(120000);
        setLinkedinUrlInput("");
        setPhoneInput("");
        setCountryInput("India");
        setStateInput("");
        setWorkModeInput("any");
        showNotification("All database records and files deleted. System reset successfully.", "success");
        loadData();
      } else {
        showNotification("Reset failed.", "error");
      }
    } catch (err) {
      showNotification("Error clearing system data.", "error");
    }
  };

  const triggerScreenshotView = (type, title) => {
    setScreenshotUrl(`/screenshots/${type}.png?t=${Date.now()}`);
    setScreenshotTitle(title);
    setShowScreenshotModal(true);
  };

  // Check if a job is compatible with playwright auto-apply
  const isAutoApplyCompatible = (jobUrl) => {
    if (!jobUrl) return false;
    const urlLower = jobUrl.toLowerCase();
    return urlLower.includes("localhost:3000/mock-ats") || 
           urlLower.includes("greenhouse.io") || 
           urlLower.includes("lever.co");
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Top Banner Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl transition-all animate-fade-in-up ${
          notification.type === "error" 
            ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
            : notification.type === "info"
            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        }`}>
          {notification.type === "error" ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.text}</span>
        </div>
      )}

      {/* Main Header / Navigation */}
      <header className="border-b border-gray-800/80 bg-gray-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-gray-950 font-bold" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                AEROAPPLY
              </span>
              <span className="text-[10px] text-cyan-400 font-bold ml-1.5 uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Ollama local
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-1.5">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "dashboard" 
                    ? "bg-white/10 text-white shadow-inner" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab("settings")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "settings" 
                    ? "bg-white/10 text-white shadow-inner" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Preferences
              </button>
            </nav>

            <div className="h-6 w-px bg-gray-800"></div>

            <button 
              onClick={handleCleanup}
              title="Delete all test data"
              className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-gray-950 px-3.5 py-2 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset System
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {activeTab === "dashboard" ? (
          <>
            {/* LEFT COLUMN: Uploader & Preference Summary (5 Cols) */}
            <div className="lg:col-span-5 space-y-8 animate-fade-in-up">
              
              {/* Uploader Card */}
              <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  Resume & AI Parsing
                </h2>

                {!profile ? (
                  <div className="border border-dashed border-gray-800 rounded-lg p-8 bg-gray-950/40 hover:bg-gray-950/80 transition-all flex flex-col items-center justify-center text-center relative">
                    <input 
                      type="file" 
                      accept=".pdf,.txt"
                      onChange={handleUpload}
                      disabled={isParsing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    
                    {isParsing ? (
                      <div className="flex flex-col items-center py-4">
                        <Activity className="w-10 h-10 text-cyan-400 animate-pulse mb-3" />
                        <span className="text-sm font-bold text-cyan-400">Parsing Resume PDF...</span>
                        <span className="text-xs text-gray-500 mt-1">Calling Ollama structured generation</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-white">Upload Resume PDF</span>
                        <span className="text-xs text-gray-500 mt-1">Select a file to parse experience & skills</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 bg-gray-950/50 border border-gray-800 rounded-lg">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{profile.name}</div>
                        <div className="text-xs text-gray-400 truncate">{profile.email}</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Parsed
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Detected Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {profile.resumeJson?.skills?.map((skill, i) => (
                          <span 
                            key={i} 
                            className="text-[10px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-800">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Experience Summary
                      </span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
                        {profile.resumeJson?.experience?.map((exp, i) => (
                          <div key={i} className="p-2 bg-gray-950/30 border border-gray-800/40 rounded">
                            <div className="font-bold text-white flex justify-between">
                              <span>{exp.role}</span>
                              <span className="text-gray-500 font-normal text-[10px]">{exp.duration}</span>
                            </div>
                            <div className="text-gray-400 text-[10px]">{exp.company}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setProfile(null);
                      }}
                      className="w-full text-center text-xs font-semibold text-gray-500 hover:text-white transition-colors pt-2 block"
                    >
                      Remove Resume & Upload New
                    </button>
                  </div>
                )}

                {/* Model selector dropdown */}
                <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-gray-400">Ollama model:</span>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-gray-950 border border-gray-800 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="llama3">llama3</option>
                    <option value="mistral">mistral</option>
                    <option value="llama3.1">llama3.1</option>
                    <option value="codellama">codellama</option>
                  </select>
                </div>
              </div>

              {/* Preferences Summary Card */}
              <div className="glass-panel rounded-xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  Target Preferences
                </h2>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-0.5">Target Location:</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {profile?.preferences?.state ? `${profile.preferences.state}, ` : ""}
                      {profile?.preferences?.country || "India"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Work Mode:</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-violet-400" />
                      {profile?.preferences?.workMode === "remote" ? "Work from Home (Remote)" : 
                       profile?.preferences?.workMode === "office" ? "Work from Office (On-site)" : 
                       profile?.preferences?.workMode === "hybrid" ? "Hybrid Work" : "Any Mode"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Job Titles:</span>
                    <span className="font-semibold text-white">
                      {profile?.preferences?.titles?.join(" • ") || "No preferences set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Min Annual Salary:</span>
                    <span className="font-semibold text-emerald-400">
                      {profile?.preferences?.minSalary ? `₹${profile.preferences.minSalary.toLocaleString()}` : "Not set"}
                    </span>
                  </div>
                  {profile?.preferences?.linkedin && (
                    <div>
                      <span className="text-gray-500 block mb-0.5">LinkedIn Profile:</span>
                      <a href={profile.preferences.linkedin} target="_blank" rel="noreferrer" className="text-cyan-400 font-semibold hover:underline flex items-center gap-1">
                        View profile <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  <button 
                    onClick={() => setActiveTab("settings")}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors pt-2 block"
                  >
                    Configure Preferences →
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Job Matches Feed & Terminal Logs (7 Cols) */}
            <div className="lg:col-span-7 space-y-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              
              {/* Job Listings Card */}
              <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 to-violet-500"></div>
                
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      India Platforms job Feed
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-1">Aggregated from LinkedIn, Naukri & Indeed</p>
                  </div>
                  
                  <button
                    onClick={handleMatch}
                    disabled={isMatching || !profile}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 active:scale-95 text-gray-950 font-bold px-4 py-2 rounded-lg text-xs tracking-wider transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isMatching ? "Matching..." : "Run AI Scorer"}
                  </button>
                </div>

                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {(jobs || []).length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg">
                      <Briefcase className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                      <span className="text-sm text-gray-400 block font-bold">No jobs match your location/work preferences</span>
                      <span className="text-xs text-gray-600 mt-1 block">Adjust preferences in the settings tab</span>
                    </div>
                  ) : (
                    (jobs || []).map((job) => (
                      <div 
                        key={job.id} 
                        className={`p-4 rounded-lg bg-gray-950/40 border transition-all ${
                          job.matchScore && job.matchScore >= 70 
                            ? "border-emerald-500/20 hover:border-emerald-500/40" 
                            : "border-gray-800 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-white text-sm truncate">{job.title}</h3>
                              
                              {/* Source Platform Badge */}
                              {job.source === "LinkedIn" && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                                  LinkedIn
                                </span>
                              )}
                              {job.source === "Naukri" && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-600/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                                  Naukri
                                </span>
                              )}
                              {job.source === "Indeed" && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                                  Indeed
                                </span>
                              )}

                              {/* Work Mode Badge */}
                              {job.workMode === "remote" && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 uppercase tracking-wide">
                                  WFH
                                </span>
                              )}
                              {job.workMode === "hybrid" && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/10 uppercase tracking-wide">
                                  Hybrid
                                </span>
                              )}
                              {job.workMode === "office" && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/10 uppercase tracking-wide">
                                  Office
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{job.company} • <span className="text-gray-500">{job.location}</span></div>
                            <div className="text-[10px] text-emerald-400 font-semibold mt-1">{job.salary}</div>
                          </div>

                          {job.matchScore !== null ? (
                            <div className="flex flex-col items-end flex-shrink-0">
                              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                                job.matchScore >= 70 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : job.matchScore >= 40
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {job.matchScore}% Match
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                              Unscored
                            </span>
                          )}
                        </div>

                        {/* Display matched and missing skills */}
                        {job.matchScore !== null && (
                          <div className="mt-3.5 pt-3 border-t border-gray-900 space-y-2">
                            {job.matchedSkills?.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[9px] font-bold text-emerald-500 uppercase mr-1">Matches:</span>
                                {job.matchedSkills.map((sk, i) => (
                                  <span key={i} className="text-[9px] px-1.5 py-0.2 bg-emerald-500/5 text-emerald-300 rounded border border-emerald-500/10">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            )}
                            {job.missingSkills?.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[9px] font-bold text-rose-500 uppercase mr-1">Gaps:</span>
                                {job.missingSkills.map((sk, i) => (
                                  <span key={i} className="text-[9px] px-1.5 py-0.2 bg-rose-500/5 text-rose-300 rounded border border-rose-500/10">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between gap-4 pt-3 border-t border-gray-900/60">
                          <a 
                            href={job.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                          >
                            View listing on {job.source} <ExternalLink className="w-3 h-3" />
                          </a>

                          {/* SMART CONDITIONAL APPLY BUTTONS */}
                          {!profile ? (
                            <span className="text-[9px] text-gray-600 italic">
                              Upload resume to apply
                            </span>
                          ) : (
                            <>
                              {isAutoApplyCompatible(job.url) ? (
                                <button
                                  onClick={() => handleAutoApply(job)}
                                  disabled={isApplying}
                                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-gray-950 font-bold px-3.5 py-1.5 rounded text-[10px] transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                  <Play className="w-3 h-3 fill-gray-950" />
                                  {isApplying && activeJobApplying === job.id ? "Applying..." : "Auto-Apply"}
                                </button>
                              ) : (
                                <a
                                  href={job.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 font-bold px-3.5 py-1.5 rounded text-[10px] transition-all"
                                >
                                  <Share2 className="w-3 h-3" />
                                  Apply on {job.source}
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* LIVE PLAYWRIGHT TERMINAL CONSOLE CARD */}
              {(isApplying || logs.length > 0) && (
                <div className="glass-panel rounded-xl p-5 bg-gray-950/90 border border-violet-500/20 shadow-2xl relative overflow-hidden animate-fade-in-up">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-violet-500/50"></div>
                  
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
                      <Terminal className="w-4 h-4 text-violet-400" />
                      Live Automation Console (Playwright Logs)
                    </div>
                    {isApplying && (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-gray-950 border border-gray-900 rounded-lg p-4 font-mono text-[11px] text-gray-300 min-h-60 max-h-72 overflow-y-auto space-y-1 bg-gradient-to-b from-gray-950 to-gray-900/40">
                    {logs.map((log, index) => {
                      let color = "text-gray-300";
                      if (log.includes("[SUCCESS]")) color = "text-emerald-400 font-bold";
                      else if (log.includes("[ERROR]")) color = "text-rose-400 font-bold";
                      else if (log.includes("[WARNING]")) color = "text-amber-400";
                      else if (log.includes("[SYSTEM]")) color = "text-cyan-400";
                      else if (log.includes("[BOT]")) color = "text-violet-300";
                      
                      return (
                        <div key={index} className={color}>
                          {log}
                        </div>
                      );
                    })}
                    {isApplying && (
                      <div className="text-cyan-400/80 flex items-center gap-1.5">
                        <span>Running active browser session</span>
                        <span className="terminal-cursor font-bold">█</span>
                      </div>
                    )}
                    <div ref={terminalEndRef}></div>
                  </div>

                  {/* Screenshots inspection buttons */}
                  {!isApplying && logs.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-900 flex items-center justify-end gap-3">
                      <span className="text-[10px] text-gray-500 mr-auto font-mono">Chromium screenshots generated:</span>
                      <button 
                        onClick={() => triggerScreenshotView("pre-submit", "Pre-Submit Form Form Capture")}
                        className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700 px-3 py-1.5 rounded transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Input Form
                      </button>
                      <button 
                        onClick={() => triggerScreenshotView("post-submit", "Post-Submit Confirmation Capture")}
                        className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/30 px-3 py-1.5 rounded transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Result Screen
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        ) : (
          /* PREFERENCES / SETTINGS TAB */
          <div className="lg:col-span-12 max-w-2xl mx-auto w-full glass-panel rounded-xl p-8 animate-fade-in-up">
            <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">Job Search Settings</h2>
            <p className="text-gray-400 text-xs mb-6">Setup candidate preferences for matching algorithms and auto-applying scripts.</p>

            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Country
                  </label>
                  <select
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="India">India</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    State / City / Region
                  </label>
                  <input 
                    type="text" 
                    value={stateInput}
                    onChange={(e) => setStateInput(e.target.value)}
                    placeholder="Karnataka (or Bangalore, Mumbai, etc.)"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Work Mode Option
                </label>
                <select
                  value={workModeInput}
                  onChange={(e) => setWorkModeInput(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="any">Any Work Mode</option>
                  <option value="remote">Work from Home (Remote)</option>
                  <option value="office">Work from Office (On-Site)</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Target Job Titles (Comma Separated)
                </label>
                <input 
                  type="text" 
                  value={prefTitleInput}
                  onChange={(e) => setPrefTitleInput(e.target.value)}
                  placeholder="Software Engineer, AI Developer, Frontend Engineer"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Minimum Annual Salary (in INR ₹ or USD $)
                </label>
                <input 
                  type="number" 
                  value={minSalaryInput}
                  onChange={(e) => setMinSalaryInput(e.target.value)}
                  placeholder="1500000"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="h-px bg-gray-800"></div>

              <div>
                <span className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
                  Playwright Automation Credentials
                </span>
                <p className="text-[11px] text-gray-500 mb-4">Values mapped into Lever/Greenhouse input fields during automation apply runs.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                      LinkedIn Profile URL
                    </label>
                    <input 
                      type="url" 
                      value={linkedinUrlInput}
                      onChange={(e) => setLinkedinUrlInput(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-4 border-t border-gray-800">
                <button 
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="text-xs font-semibold text-gray-400 hover:text-white transition-colors px-4 py-2"
                >
                  Cancel
                </button>
                
                <button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* SCREENSHOT LIGHTBOX MODAL */}
      {showScreenshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800">
              <span className="text-xs font-bold text-violet-400 font-mono">{screenshotTitle}</span>
              <button 
                onClick={() => setShowScreenshotModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-full bg-gray-950 rounded-lg border border-gray-800 overflow-hidden flex justify-center items-center select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={screenshotUrl} 
                alt="Playwright Step Capture" 
                className="max-h-[70vh] object-contain max-w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
