import { NextResponse } from "next/server";
import { getProfile, getJobs, saveJobs } from "@/lib/db";

const DEFAULT_MODEL = "google/gemini-2.5-flash";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const model = body.model || DEFAULT_MODEL;

    const profile = await getProfile();
    const jobs = await getJobs();

    if (!profile || !profile.resumeJson) {
      return NextResponse.json({ error: "No parsed resume found. Please upload a resume first." }, { status: 400 });
    }

    const candidateSkills = profile.resumeJson.skills || [];
    const candidateSummary = `${profile.resumeJson.name}. Skills: ${candidateSkills.join(", ")}. Experience: ${JSON.stringify(profile.resumeJson.experience)}`;

    const updatedJobs = [];
    let openRouterUsed = false;
    let openRouterErrorsCount = 0;

    for (const job of jobs) {
      let matchResult = null;

      // Try OpenRouter matching
      try {
        const prompt = `You are an expert technical recruiter. Compare this candidate's Resume Profile against the Job Description. 
You must output a JSON object containing:
- "matchScore": integer from 0 to 100
- "matchedSkills": array of strings (skills present in both the candidate profile and required by the JD)
- "missingSkills": array of strings (skills required/mentioned in the JD but not present in the candidate profile)
- "shouldApply": boolean (true if matchScore >= 70, otherwise false)

CANDIDATE PROFILE:
${candidateSummary}

JOB DESCRIPTION:
${job.description}

Do not include any chat formatting, introductory text, or markdown code blocks. Output ONLY the JSON object.`;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 10000); // 10s timeout per job to prevent long blocking

        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://your-domain.vercel.app", 
            "X-Title": "Resume Parser App",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: "You are an expert technical recruiter. Analyze and match the candidate profile to the job description, outputting only the JSON format required.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            response_format: { type: "json_object" }
          }),
          signal: controller.signal,
        });

        clearTimeout(id);

        if (openRouterRes.ok) {
          const resData = await openRouterRes.json();
          const responseText = resData.choices[0].message.content;
          matchResult = JSON.parse(responseText.trim());
          openRouterUsed = true;
        } else {
          openRouterErrorsCount++;
        }
      } catch (err) {
        openRouterErrorsCount++;
      }

      // Local Regex-based Matcher Fallback
      if (!matchResult) {
        console.log(`Running local match fallback for job: ${job.title}`);
        const jdText = job.description.toLowerCase();
        
        const matched = [];
        const missing = [];
        
        // Extract common keywords/skills from JD to check against candidate
        // A list of common skills to scan for in JD
        const techSkills = [
          "javascript", "react", "node.js", "next.js", "python", "supabase", "postgres", 
          "postgresql", "tailwind css", "tailwind", "playwright", "docker", "aws", "kubernetes", 
          "typescript", "communication", "testing", "ci/cd", "devops", "git", "rest api"
        ];

        techSkills.forEach(skill => {
          const isNeeded = jdText.includes(skill);
          if (isNeeded) {
            const hasSkill = candidateSkills.some(cs => cs.toLowerCase().includes(skill) || skill.includes(cs.toLowerCase()));
            if (hasSkill) {
              matched.push(skill.toUpperCase());
            } else {
              missing.push(skill.toUpperCase());
            }
          }
        });

        // Add any candidate skills that are mentioned in the description
        candidateSkills.forEach(cs => {
          if (jdText.includes(cs.toLowerCase()) && !matched.includes(cs.toUpperCase())) {
            matched.push(cs.toUpperCase());
          }
        });

        const totalSkills = matched.length + missing.length;
        let score = 50; // default middle ground
        if (totalSkills > 0) {
          score = Math.round((matched.length / totalSkills) * 100);
        }

        // Adjust scores manually based on title keywords for higher accuracy simulation
        const jobTitleLower = job.title.toLowerCase();
        if (jobTitleLower.includes("ai") && candidateSkills.some(s => s.toLowerCase().includes("python") || s.toLowerCase().includes("supabase"))) {
          score = Math.min(score + 15, 100);
        }

        matchResult = {
          matchScore: score,
          matchedSkills: matched,
          missingSkills: missing,
          shouldApply: score >= 70
        };
      }

      updatedJobs.push({
        ...job,
        matchScore: matchResult.matchScore,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
        shouldApply: matchResult.shouldApply
      });
    }

    // Save matching results back to DB
    await saveJobs(updatedJobs);

    return NextResponse.json({
      success: true,
      openRouterUsed,
      openRouterErrorsCount,
      jobs: updatedJobs
    });

  } catch (error) {
    console.error("Match jobs API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
