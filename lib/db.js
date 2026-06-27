import fs from 'fs';
import path from 'path';
import os from 'os';
import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_DB_PATH = path.join(os.tmpdir(), 'local-db.json');
const ORIGINAL_DB_PATH = path.join(process.cwd(), 'local-db.json');

function readLocalDb() {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
    if (fs.existsSync(ORIGINAL_DB_PATH)) {
      const data = fs.readFileSync(ORIGINAL_DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
    return { profile: null, jobs: [], applications: [] };
  } catch (err) {
    console.error('Error reading local db:', err);
    return { profile: null, jobs: [], applications: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local db:', err);
  }
}

export async function getProfile() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .maybeSingle();
      if (error) {
        console.error('Supabase profile fetch error:', error);
      } else if (data) {
        return {
          name: data.name,
          email: data.email,
          resumeText: data.resume_text,
          resumeJson: data.resume_json,
          preferences: data.preferences,
        };
      }
    } catch (e) {
      console.error('Supabase client error, falling back to local:', e);
    }
  }
  const db = readLocalDb();
  return db.profile;
}

export async function saveProfile(profile) {
  if (isSupabaseConfigured) {
    try {
      const dbData = {
        id: 'default-user',
        name: profile.name,
        email: profile.email,
        resume_text: profile.resumeText,
        resume_json: profile.resumeJson,
        preferences: profile.preferences,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('user_profile')
        .upsert(dbData);
      if (!error) return;
      console.error('Supabase profile upsert error:', error);
    } catch (e) {
      console.error('Supabase client error, falling back to local:', e);
    }
  }
  const db = readLocalDb();
  db.profile = profile;
  writeLocalDb(db);
}

export async function getJobs() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('match_score', { ascending: false });
      if (!error && data) {
        return data.map(j => ({
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
          salary: j.salary,
          description: j.description,
          url: j.url,
          matchScore: j.match_score,
          matchedSkills: j.matched_skills,
          missingSkills: j.missing_skills,
          shouldApply: j.should_apply,
          source: j.source || "LinkedIn",
          workMode: j.work_mode || "remote",
          country: j.country || "India",
          state: j.state || ""
        }));
      }
      console.error('Supabase jobs fetch error:', error);
    } catch (e) {
      console.error('Supabase client error, falling back to local:', e);
    }
  }
  const db = readLocalDb();
  return db.jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

export async function saveJobs(jobsList) {
  if (isSupabaseConfigured) {
    try {
      const dbData = jobsList.map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        salary: j.salary,
        description: j.description,
        url: j.url,
        match_score: j.matchScore || null,
        matched_skills: j.matchedSkills || [],
        missing_skills: j.missingSkills || [],
        should_apply: j.shouldApply || false,
        source: j.source || "LinkedIn",
        work_mode: j.workMode || "remote",
        country: j.country || "India",
        state: j.state || "",
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase
        .from('jobs')
        .upsert(dbData);
      if (!error) return;
      console.error('Supabase jobs upsert error:', error);
    } catch (e) {
      console.error('Supabase client error, falling back to local:', e);
    }
  }
  const db = readLocalDb();
  const existingJobsMap = new Map(db.jobs.map(j => [j.id, j]));
  jobsList.forEach(job => {
    existingJobsMap.set(job.id, {
      ...existingJobsMap.get(job.id),
      ...job
    });
  });
  db.jobs = Array.from(existingJobsMap.values());
  writeLocalDb(db);
}

export async function getApplications() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('applied_at', { ascending: false });
      if (!error && data) {
        return data.map(a => ({
          id: a.id,
          jobId: a.jobId || a.job_id,
          appliedAt: a.applied_at,
          status: a.status,
          logs: a.logs
        }));
      }
      console.error('Supabase applications fetch error:', error);
    } catch (e) {
      console.error('Supabase client error, falling back to local:', e);
    }
  }
  const db = readLocalDb();
  return db.applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
}

export async function saveApplication(app) {
  if (isSupabaseConfigured) {
    try {
      const dbData = {
        id: app.id,
        job_id: app.jobId,
        applied_at: app.appliedAt,
        status: app.status,
        logs: app.logs
      };
      const { error } = await supabase
        .from('applications')
        .upsert(dbData);
      if (!error) return;
      console.error('Supabase application upsert error:', error);
    } catch (e) {
      console.error('Supabase client error, falling back to local:', e);
    }
  }
  const db = readLocalDb();
  const idx = db.applications.findIndex(a => a.id === app.id);
  if (idx >= 0) {
    db.applications[idx] = app;
  } else {
    db.applications.push(app);
  }
  writeLocalDb(db);
}

export async function clearAllData() {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('applications').delete().neq('id', 'dummy');
      await supabase.from('jobs').delete().neq('id', 'dummy');
      await supabase.from('user_profile').delete().neq('id', 'dummy');
    } catch (e) {
      console.error('Supabase clean error:', e);
    }
  }
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      fs.unlinkSync(LOCAL_DB_PATH);
    } catch (e) {
      console.error('Error deleting local db file:', e);
    }
  }
}
