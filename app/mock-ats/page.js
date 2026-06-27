"use client";
import { useState } from "react";

export default function MockATS() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    linkedin_url: "",
    cover_letter: "",
    why_join: "",
  });
  const [resumeName, setResumeName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !resumeName) {
      setError("Please fill out all required fields and upload your resume.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center mb-8">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
            Local Sandbox ATS
          </span>
          <h1 className="text-3xl font-extrabold mt-3 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Acme Corp Careers
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Senior AI Software Engineer Application Form
          </p>
        </div>

        {submitted ? (
          <div id="success-message" className="text-center py-12 animate-fade-in-up">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-emerald-400">Application Submitted!</h2>
            <p className="text-gray-400 mt-2 text-sm">
              Thank you for applying. Playwright successfully completed all inputs.
            </p>
            <div className="mt-6 p-4 bg-gray-950 border border-gray-800 rounded-lg text-left text-xs text-gray-500 font-mono space-y-1">
              <div>First Name: {formData.first_name}</div>
              <div>Last Name: {formData.last_name}</div>
              <div>Email: {formData.email}</div>
              <div>Resume File: {resumeName}</div>
              <div>LinkedIn: {formData.linkedin_url || "N/A"}</div>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  first_name: "",
                  last_name: "",
                  email: "",
                  phone: "",
                  linkedin_url: "",
                  cover_letter: "",
                  why_join: "",
                });
                setResumeName("");
              }}
              className="mt-6 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
            >
              ← Apply Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Jane"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="jane.doe@example.com"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 019-2834"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Resume / CV <span className="text-rose-500">*</span>
              </label>
              <div className="relative border border-dashed border-gray-800 rounded-lg p-4 bg-gray-950/50 hover:bg-gray-950 transition-colors flex flex-col items-center justify-center text-center">
                <input
                  type="file"
                  name="resume"
                  id="resume"
                  required
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-500 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                {resumeName ? (
                  <span className="text-sm font-medium text-emerald-400">{resumeName}</span>
                ) : (
                  <>
                    <span className="text-sm text-gray-400">Click or drag resume file here</span>
                    <span className="text-xs text-gray-600 mt-1">PDF, DOCX, or TXT up to 10MB</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedin_url"
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/janedoe"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Cover Letter
              </label>
              <textarea
                name="cover_letter"
                id="cover_letter"
                rows={3}
                value={formData.cover_letter}
                onChange={handleChange}
                placeholder="Write your cover letter..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Why do you want to join our company? <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="why_join"
                id="why_join"
                required
                rows={3}
                value={formData.why_join}
                onChange={handleChange}
                placeholder="I am passionate about AI..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              id="submit-btn"
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-gray-950 font-bold py-3 rounded-lg text-sm tracking-wide transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              Submit Application
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
