import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { clearAllData } from "@/lib/db";

export async function POST() {
  try {
    // 1. Clear DB records (Supabase and local JSON database file)
    await clearAllData();

    // 2. Clear uploaded resume file in writeable tmp directory
    const tmpDir = os.tmpdir();
    const resumePath = path.join(tmpDir, "uploaded-resume.pdf");
    if (fs.existsSync(resumePath)) {
      try {
        fs.unlinkSync(resumePath);
      } catch (err) {
        console.warn("Could not delete resume:", err.message);
      }
    }

    // 3. Clear Playwright screenshots directory
    const screenshotDir = path.join(process.cwd(), "public", "screenshots");
    if (fs.existsSync(screenshotDir)) {
      try {
        const files = fs.readdirSync(screenshotDir);
        for (const file of files) {
          fs.unlinkSync(path.join(screenshotDir, file));
        }
        fs.rmdirSync(screenshotDir);
      } catch (err) {
        console.warn("Could not clear screenshots:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "All database records, local database files, uploaded resumes, and Playwright screenshots have been permanently purged."
    });
  } catch (error) {
    console.error("Cleanup API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
