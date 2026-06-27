-- Create user_profile table
CREATE TABLE IF NOT EXISTS public.user_profile (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    resume_text TEXT,
    resume_json JSONB,
    preferences JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disable Row Level Security (RLS) to make access easy for personal admin dashboard
ALTER TABLE public.user_profile DISABLE ROW LEVEL SECURITY;

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    title TEXT,
    company TEXT,
    location TEXT,
    salary TEXT,
    description TEXT,
    url TEXT,
    match_score NUMERIC,
    matched_skills TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    should_apply BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'LinkedIn',
    work_mode TEXT DEFAULT 'remote',
    country TEXT DEFAULT 'India',
    state TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    applied_at TIMESTAMPTZ DEFAULT now(),
    status TEXT,
    logs TEXT
);

-- Disable RLS
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
