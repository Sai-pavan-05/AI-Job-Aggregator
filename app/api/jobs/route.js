import { NextResponse } from "next/server";
import { getProfile, getJobs, saveJobs, saveProfile } from "@/lib/db";

const SEED_JOBS = [
  {
    id: "job-naukri-ai",
    title: "AI Engineer / LLM Specialist",
    company: "Tech Mahindra (Mock)",
    location: "Bangalore, Karnataka, India",
    salary: "₹18,00,000 - ₹24,00,000",
    description: `We are looking for a Senior AI Software Engineer to lead the integration of large language models (LLMs) into our core platform.
Requirements:
- Deep experience with JavaScript, React, Node.js and Next.js.
- Experience with AI frameworks, OpenAI APIs, or local LLMs like Ollama.
- Knowledge of relational databases, preferably PostgreSQL or Supabase.
- Strong testing practices, including unit tests and browser testing using Playwright.
- Location: Bangalore, Karnataka, India.
- Work Mode: Remote (Work from Home).`,
    url: "http://localhost:3000/mock-ats",
    matchScore: null,
    matchedSkills: [],
    missingSkills: [],
    shouldApply: false,
    source: "Naukri",
    workMode: "remote",
    country: "India",
    state: "Karnataka"
  },
  {
    id: "job-linkedin-react",
    title: "Senior Frontend Developer (Next.js & React)",
    company: "Infosys (Mock)",
    location: "Pune, Maharashtra, India",
    salary: "₹12,00,000 - ₹16,00,000",
    description: `Join us in Pune in building state-of-the-art Next.js web applications. You will collaborate with design teams to craft gorgeous, glassmorphic interfaces.
Requirements:
- Master of JavaScript, React, Next.js, and Tailwind CSS.
- Familiarity with TypeScript and state management.
- Experience with web performance optimization.
- Experience with web automation testing using Playwright or Cypress.
- Work Mode: Hybrid (2 days in office).`,
    url: "http://localhost:3000/mock-ats",
    matchScore: null,
    matchedSkills: [],
    missingSkills: [],
    shouldApply: false,
    source: "LinkedIn",
    workMode: "hybrid",
    country: "India",
    state: "Maharashtra"
  },
  {
    id: "job-indeed-supabase",
    title: "Full Stack Engineer (Supabase & React)",
    company: "HashedIn by Deloitte (Mock)",
    location: "Bengaluru, Karnataka, India",
    salary: "₹15,00,000 - ₹20,00,000",
    description: `We are seeking a Full Stack Engineer to manage our backend systems built on Supabase and build intuitive admin dashboards in React.
Requirements:
- Strong experience with Postgres, Supabase Auth, Storage, and Edge Functions.
- Advanced React, Node.js, and API development experience.
- Experience with Python or Golang is a plus.
- Location: Bengaluru, India.
- Work Mode: Work from Office.`,
    url: "https://indeed.com/mock-hashedin",
    matchScore: null,
    matchedSkills: [],
    missingSkills: [],
    shouldApply: false,
    source: "Indeed",
    workMode: "office",
    country: "India",
    state: "Karnataka"
  },
  {
    id: "job-naukri-devops",
    title: "Cloud DevOps Specialist",
    company: "Wipro (Mock)",
    location: "Hyderabad, Telangana, India",
    salary: "₹10,00,000 - ₹14,00,000",
    description: `We are scaling our core data pipelines and need a DevOps Engineer focused on AWS, Kubernetes, and CI/CD pipelines.
Requirements:
- Strong proficiency in Docker, Kubernetes, AWS, and scripting.
- Experience with Jenkins, GitHub Actions or GitLab CI.
- No JavaScript frontend knowledge required.
- Location: Hyderabad, India.
- Work Mode: Work from Office.`,
    url: "https://naukri.com/mock-wipro",
    matchScore: null,
    matchedSkills: [],
    missingSkills: [],
    shouldApply: false,
    source: "Naukri",
    workMode: "office",
    country: "India",
    state: "Telangana"
  },
  {
    id: "job-linkedin-remote-python",
    title: "Backend Python Engineer",
    company: "Zoho Corporation (Mock)",
    location: "Chennai, Tamil Nadu, India",
    salary: "₹8,00,000 - ₹12,00,000",
    description: `We are looking for Python developers to build scaleable backend APIs.
Requirements:
- Python, Django or FastAPI, PostgreSQL.
- Understanding of microservices architecture.
- Location: Remote (India).
- Work Mode: Remote (Work from Home).`,
    url: "https://linkedin.com/jobs/mock-zoho",
    matchScore: null,
    matchedSkills: [],
    missingSkills: [],
    shouldApply: false,
    source: "LinkedIn",
    workMode: "remote",
    country: "India",
    state: "Tamil Nadu"
  },
  {
    id: "job-us-remote",
    title: "Senior Next.js Developer",
    company: "Vercel US (Mock)",
    location: "San Francisco, CA, USA",
    salary: "$140,000 - $170,000",
    description: `Join Vercel US team to build core web features.
Requirements: Next.js, React, Node.js, Vercel infrastructure.`,
    url: "http://localhost:3000/mock-ats",
    matchScore: null,
    matchedSkills: [],
    missingSkills: [],
    shouldApply: false,
    source: "LinkedIn",
    workMode: "remote",
    country: "US",
    state: "California"
  }
];

export async function GET() {
  try {
    let profile = await getProfile();
    let jobs = await getJobs();

    // If no jobs exist in DB, seed default jobs
    if (jobs.length === 0) {
      await saveJobs(SEED_JOBS);
      jobs = SEED_JOBS;
    }

    // Apply filtering based on candidate preferences
    let filteredJobs = jobs;
    if (profile && profile.preferences) {
      const { country, state, workMode } = profile.preferences;

      if (country) {
        filteredJobs = filteredJobs.filter(j => 
          j.country?.toLowerCase() === country.toLowerCase().trim()
        );
      }

      if (state) {
        const stateLower = state.toLowerCase().trim();
        filteredJobs = filteredJobs.filter(j => 
          j.state?.toLowerCase().includes(stateLower) || 
          j.location?.toLowerCase().includes(stateLower)
        );
      }

      if (workMode && workMode !== "any") {
        filteredJobs = filteredJobs.filter(j => 
          j.workMode?.toLowerCase() === workMode.toLowerCase().trim()
        );
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      jobs: filteredJobs,
    });
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, preferences } = body;

    let profile = await getProfile();
    if (!profile) {
      profile = {
        name: "",
        email: "",
        resumeText: "",
        resumeJson: null,
        preferences: { titles: [], locations: [], minSalary: 0, country: "India", state: "", workMode: "any" }
      };
    }

    if (action === "updatePreferences" && preferences) {
      profile.preferences = {
        ...profile.preferences,
        ...preferences
      };
      await saveProfile(profile);
      return NextResponse.json({ success: true, profile });
    }

    if (action === "addJob" && body.job) {
      const newJob = {
        ...body.job,
        id: body.job.id || `job-${Date.now()}`,
        matchScore: null,
        matchedSkills: [],
        missingSkills: [],
        shouldApply: false,
        source: body.job.source || "LinkedIn",
        workMode: body.job.workMode || "remote",
        country: body.job.country || "India",
        state: body.job.state || ""
      };
      await saveJobs([newJob]);
      const currentJobs = await getJobs();
      return NextResponse.json({ success: true, jobs: currentJobs });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Jobs POST API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
