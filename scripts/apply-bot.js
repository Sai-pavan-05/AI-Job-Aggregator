const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const args = {};
  process.argv.slice(2).forEach(val => {
    if (val.startsWith('--')) {
      const parts = val.split('=');
      const key = parts[0].substring(2);
      const value = parts.slice(1).join('=');
      args[key] = value;
    }
  });

  const url = args.url;
  const name = args.name || 'Jane Doe';
  const email = args.email || 'jane@example.com';
  const phone = args.phone || '';
  const linkedin = args.linkedin || '';
  const resumePath = args.resume;
  const whyJoin = args.whyJoin || 'I would love to work at your company and leverage my engineering skills.';
  const coverLetter = args.coverLetter || '';
  const headless = args.headless !== 'false';

  console.log(`[BOT] Starting job application auto-apply bot...`);
  console.log(`[BOT] Target URL: ${url}`);
  console.log(`[BOT] Headless mode: ${headless}`);

  if (!url) {
    console.error(`[ERROR] URL argument is required. Usage: --url=<url>`);
    process.exit(1);
  }

  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || 'Doe';

  let browser;
  try {
    browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`[BOT] Navigating to application page...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`[BOT] Successfully loaded page.`);

    // 1. First Name
    console.log(`[BOT] Looking for First Name field...`);
    const firstNameSelector = '#first_name, input[name="first_name"], input[name*="first"], input[name*="fname"], input[id*="first"]';
    if (await page.locator(firstNameSelector).count() > 0) {
      await page.fill(firstNameSelector, firstName);
      console.log(`[BOT] Filled First Name: ${firstName}`);
    } else {
      console.log(`[BOT] First Name field not found.`);
    }

    // 2. Last Name
    console.log(`[BOT] Looking for Last Name field...`);
    const lastNameSelector = '#last_name, input[name="last_name"], input[name*="last"], input[name*="lname"], input[id*="last"]';
    if (await page.locator(lastNameSelector).count() > 0) {
      await page.fill(lastNameSelector, lastName);
      console.log(`[BOT] Filled Last Name: ${lastName}`);
    } else {
      console.log(`[BOT] Last Name field not found.`);
    }

    // 3. Email
    console.log(`[BOT] Looking for Email field...`);
    const emailSelector = 'input[type="email"], #email, input[name="email"], input[name*="email"]';
    if (await page.locator(emailSelector).count() > 0) {
      await page.fill(emailSelector, email);
      console.log(`[BOT] Filled Email: ${email}`);
    } else {
      console.log(`[BOT] Email field not found.`);
    }

    // 4. Phone
    console.log(`[BOT] Looking for Phone field...`);
    const phoneSelector = 'input[type="tel"], #phone, input[name="phone"], input[name*="phone"], input[name*="tel"]';
    if (phone && await page.locator(phoneSelector).count() > 0) {
      await page.fill(phoneSelector, phone);
      console.log(`[BOT] Filled Phone: ${phone}`);
    }

    // 5. LinkedIn
    console.log(`[BOT] Looking for LinkedIn URL field...`);
    const linkedinSelector = 'input[name="linkedin_url"], input[name*="linkedin"], input[name*="link"], input[id*="linkedin"]';
    if (linkedin && await page.locator(linkedinSelector).count() > 0) {
      await page.fill(linkedinSelector, linkedin);
      console.log(`[BOT] Filled LinkedIn: ${linkedin}`);
    }

    // 6. Cover Letter
    console.log(`[BOT] Looking for Cover Letter text area...`);
    const coverLetterSelector = 'textarea[name="cover_letter"], textarea[name*="cover"], textarea[id*="cover"], #cover_letter';
    if (coverLetter && await page.locator(coverLetterSelector).count() > 0) {
      await page.fill(coverLetterSelector, coverLetter);
      console.log(`[BOT] Filled Cover Letter.`);
    }

    // 7. Why Join
    console.log(`[BOT] Looking for custom questions (e.g. Why Join)...`);
    const whyJoinSelector = 'textarea[name="why_join"], textarea[name*="why"], textarea[name*="join"], #why_join, textarea[placeholder*="why"]';
    if (await page.locator(whyJoinSelector).count() > 0) {
      await page.fill(whyJoinSelector, whyJoin);
      console.log(`[BOT] Filled Custom Question.`);
    }

    // 8. Resume upload
    console.log(`[BOT] Looking for Resume file upload...`);
    const resumeSelector = 'input[type="file"], #resume, input[name="resume"], input[name*="resume"], input[name*="cv"]';
    if (resumePath && await page.locator(resumeSelector).count() > 0) {
      const absoluteResumePath = path.resolve(resumePath);
      if (fs.existsSync(absoluteResumePath)) {
        await page.setInputFiles(resumeSelector, absoluteResumePath);
        console.log(`[BOT] Attached Resume file: ${path.basename(absoluteResumePath)}`);
      } else {
        console.error(`[ERROR] Resume file not found at: ${absoluteResumePath}`);
      }
    } else {
      console.log(`[BOT] Resume upload field not found.`);
    }

    // Save screenshots
    const screenshotDir = path.join(process.cwd(), 'public', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const preSubmitScreenshot = path.join(screenshotDir, 'pre-submit.png');
    await page.screenshot({ path: preSubmitScreenshot });
    console.log(`[BOT] Saved pre-submit screenshot.`);

    // 9. Submit
    console.log(`[BOT] Submitting form...`);
    const submitSelector = 'button[type="submit"], #submit-btn, button:has-text("Submit"), input[type="submit"]';
    if (await page.locator(submitSelector).count() > 0) {
      await page.click(submitSelector);
      console.log(`[BOT] Submit button clicked.`);
    } else {
      await page.keyboard.press('Enter');
      console.log(`[BOT] Enter key pressed as fallback.`);
    }

    // Wait for transition/submission
    await page.waitForTimeout(4000);

    const postSubmitScreenshot = path.join(screenshotDir, 'post-submit.png');
    await page.screenshot({ path: postSubmitScreenshot });
    console.log(`[BOT] Saved post-submit screenshot.`);

    const content = await page.textContent('body');
    const successKeywords = ['submitted', 'success', 'thank you', 'thanks', 'received', 'application complete'];
    const hasSuccessText = successKeywords.some(keyword => content.toLowerCase().includes(keyword));

    if (hasSuccessText || (await page.locator('#success-message').count() > 0)) {
      console.log(`[SUCCESS] Application submitted successfully!`);
    } else {
      console.log(`[WARNING] Form submitted but verification text not detected on page. Verify via screenshots/post-submit.png.`);
    }

  } catch (error) {
    console.error(`[ERROR] Application automation failed: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[BOT] Browser session ended.`);
    }
  }
}

run();
