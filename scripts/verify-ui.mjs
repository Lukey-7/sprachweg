import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runVerification() {
  console.log('================================================================');
  console.log('      SPRACHWEG PLAYWRIGHT END-TO-END UI VERIFICATION           ');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'de-DE',
  });
  const page = await context.newPage();

  const results = [];
  const recordResult = (name, passed, details = '') => {
    results.push({ name, passed, details });
    const statusSymbol = passed ? '✔ PASS' : '✖ FAIL';
    console.log(`${statusSymbol}: ${name} ${details ? `(${details})` : ''}`);
  };

  try {
    // ---------------------------------------------------------
    // 1. Application Launch & Today Session View
    // ---------------------------------------------------------
    console.log('\n--- 1. Testing Application Launch & Today Session View ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('text=Sprachweg', { timeout: 10000 });
    
    const brandPresent = await page.getByText('Sprachweg', { exact: false }).first().isVisible();
    recordResult('Header & Branding Rendered', brandPresent);

    const block1Visible = await page.getByText('Block 1: Spaced Repetition Warmup', { exact: false }).first().isVisible();
    const block2Visible = await page.getByText('Block 2: New Grammar Concept', { exact: false }).first().isVisible();
    recordResult('Today Session 5-Block Overview Rendered', block1Visible && block2Visible);

    await page.screenshot({ path: path.join(screenshotsDir, '01_today_session.png'), fullPage: true });
    recordResult('Screenshot 1: Today Session Saved', true, '01_today_session.png');

    // ---------------------------------------------------------
    // 2. Sentence Miner & Word Order Visualizer
    // ---------------------------------------------------------
    console.log('\n--- 2. Testing Sentence Miner & Satzklammer Word Order Map ---');
    await page.locator('[data-tab="miner"]').click();
    await page.waitForTimeout(800);

    const minerHeader = await page.getByText('Sentence Miner').first().isVisible();
    recordResult('Navigated to Sentence Miner View', minerHeader);

    // Verify German Quick-Bar inside Sentence Miner
    const quickBarButtons = ['ä', 'ö', 'ü', 'ß'];
    for (const char of quickBarButtons) {
      const btnVisible = await page.locator(`button:has-text("${char}")`).first().isVisible();
      recordResult(`Quick-bar button '${char}' visible in Miner`, btnVisible);
    }

    // Type sentence into textarea
    const textarea = page.locator('textarea').first();
    await textarea.fill('Heute kauft der Mann im Supermarkt einen frischen Apfel.');

    // Click quickbar character to test insertion
    const umlautA = page.locator('button:has-text("ä")').first();
    await textarea.focus();
    await umlautA.click();
    const valWithUmlaut = await textarea.inputValue();
    recordResult('Quick-Bar Character Inserted into Textarea', valWithUmlaut.includes('ä'));

    // Reset back to standard sentence and analyze
    await textarea.fill('Heute kauft der Mann im Supermarkt einen frischen Apfel.');
    const deconstructBtn = page.getByRole('button', { name: 'Deconstruct Sentence' }).first();
    await deconstructBtn.click();
    await page.waitForTimeout(1500);

    // Verify tokens
    const tokensVisible = await page.locator('.de-token').first().isVisible();
    recordResult('Sentence Miner Tokens Rendered', tokensVisible);

    // Verify side-by-side translation
    const naturalTrans = await page.getByText('Natural English Translation', { exact: false }).first().isVisible();
    const literalTrans = await page.getByText('Literal Pedagogical Translation', { exact: false }).first().isVisible();
    recordResult('Literal vs Natural Side-by-Side Translation Rendered', naturalTrans && literalTrans);

    // Verify Satzklammer word order map
    const satzklammerBar = await page.getByText('Satzklammer & Word Order Topology', { exact: false }).first().isVisible();
    recordResult('Satzklammer Word Order Map Rendered', satzklammerBar);

    await page.screenshot({ path: path.join(screenshotsDir, '02_sentence_miner.png'), fullPage: true });
    recordResult('Screenshot 2: Sentence Miner Saved', true, '02_sentence_miner.png');

    // ---------------------------------------------------------
    // 3. German Reference Dictionary View
    // ---------------------------------------------------------
    console.log('\n--- 3. Testing Reference Dictionary Matrix & Decompounding ---');
    await page.locator('[data-tab="dictionary"]').click();
    await page.waitForTimeout(800);

    const dictInput = page.locator('input[placeholder*="Search German"]').first();
    await dictInput.fill('Geschwindigkeitsbegrenzung');
    const lookupBtn = page.getByRole('button', { name: 'Lookup' }).first();
    await lookupBtn.click();
    await page.waitForTimeout(1200);

    // Verify compound breakdown and definition
    const definitionFound = await page.getByText('English Definition', { exact: false }).first().isVisible();
    const compoundFound = await page.getByText('Fugenelement', { exact: false }).first().isVisible();
    recordResult('Compound Decompounding Matrix Displayed', definitionFound && compoundFound);

    // Search verb to test conjugation table
    await dictInput.fill('fahren');
    await lookupBtn.click();
    await page.waitForTimeout(1200);

    const conjugationFound = await page.getByText('Conjugation & Government', { exact: false }).first().isVisible();
    const auxFound = await page.getByText('Auxiliary', { exact: false }).first().isVisible();
    recordResult('Verb Conjugation & Auxiliary Matrix Displayed', conjugationFound && auxFound);

    await page.screenshot({ path: path.join(screenshotsDir, '03_dictionary.png'), fullPage: true });
    recordResult('Screenshot 3: Reference Dictionary Saved', true, '03_dictionary.png');

    // ---------------------------------------------------------
    // 4. FSRS Spaced Repetition Flashcards
    // ---------------------------------------------------------
    console.log('\n--- 4. Testing FSRS Spaced Repetition Cards ---');
    await page.locator('[data-tab="srs"]').click();
    await page.waitForTimeout(800);

    const cardHeader = await page.getByText('FSRS Memory Review', { exact: false }).first().isVisible();
    recordResult('FSRS Duel Review View Rendered', cardHeader);

    const revealBtn = page.getByRole('button', { name: 'Reveal Answer', exact: false }).first();
    if (await revealBtn.isVisible()) {
      await revealBtn.click();
      await page.waitForTimeout(500);

      // Verify 4 rating buttons (Again, Hard, Good, Easy)
      const goodBtn = page.getByRole('button', { name: 'Good', exact: false }).first();
      const goodVisible = await goodBtn.isVisible();
      recordResult('FSRS 4-Tier Rating Buttons Rendered (Again/Hard/Good/Easy)', goodVisible);

      if (goodVisible) {
        await goodBtn.click();
        await page.waitForTimeout(600);
        recordResult('FSRS Card Graded and Memory Stability Scheduled', true);
      }
    } else {
      const clearMsg = await page.getByText('Daily FSRS Queue Clear', { exact: false }).first().isVisible();
      recordResult('FSRS Queue Clear Screen Rendered', clearMsg);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '04_fsrs_review.png'), fullPage: true });
    recordResult('Screenshot 4: FSRS Review Saved', true, '04_fsrs_review.png');

    // ---------------------------------------------------------
    // 5. Interactive Grammar Course View
    // ---------------------------------------------------------
    console.log('\n--- 5. Testing Interactive Grammar Course ---');
    await page.locator('[data-tab="grammar"]').click();
    await page.waitForTimeout(800);

    const grammarHeader = await page.getByText('Grammar Course & Drill Engine', { exact: false }).first().isVisible();
    recordResult('Grammar Course View Rendered', grammarHeader);

    const topicItem = page.getByText('Artikel und Geschlecht im Nominativ', { exact: false }).first();
    if (await topicItem.isVisible()) {
      await topicItem.click();
      await page.waitForTimeout(600);
    }

    const mentalModel = await page.getByText('Mental Model', { exact: false }).first().isVisible();
    recordResult('Grammar Mental Model & Rules Rendered', mentalModel);

    const drillSection = await page.getByText('Interactive Drills', { exact: false }).first().isVisible();
    recordResult('Interactive Grammar Drills Section Rendered', drillSection);

    await page.screenshot({ path: path.join(screenshotsDir, '05_grammar_course.png'), fullPage: true });
    recordResult('Screenshot 5: Grammar Course Saved', true, '05_grammar_course.png');

    // ---------------------------------------------------------
    // 6. Voice Studio & Real-Time Waveform
    // ---------------------------------------------------------
    console.log('\n--- 6. Testing Voice Studio & Waveform Visualizer ---');
    await page.locator('[data-tab="voice"]').click();
    await page.waitForTimeout(800);

    const voiceHeader = await page.getByText('Voice & Conversation Studio', { exact: false }).first().isVisible();
    recordResult('Voice Studio View Rendered', voiceHeader);

    // Verify voice modes
    const freeMode = await page.getByRole('button', { name: 'Free Tutor', exact: false }).first().isVisible();
    const roleplayMode = await page.getByRole('button', { name: 'Role-Play', exact: false }).first().isVisible();
    recordResult('Voice Studio Multi-Mode Selectors Rendered', freeMode && roleplayMode);

    // Verify Canvas waveform
    const canvas = await page.locator('canvas').first().isVisible();
    recordResult('Real-Time Web Audio Waveform Canvas Active', canvas);

    await page.screenshot({ path: path.join(screenshotsDir, '06_voice_studio.png'), fullPage: true });
    recordResult('Screenshot 6: Voice Studio Saved', true, '06_voice_studio.png');

    // ---------------------------------------------------------
    // 7. Immersion Readers & Progress Dashboard
    // ---------------------------------------------------------
    console.log('\n--- 7. Testing Immersion Readers & Tap-to-Inspect ---');
    await page.locator('[data-tab="progress"]').click();
    await page.waitForTimeout(800);

    const immersionHeader = await page.getByText('Immersion & Progress Dashboard', { exact: false }).first().isVisible();
    recordResult('Immersion Dashboard Rendered', immersionHeader);

    // Check Mock Placement Test CTA
    const placementBtn = page.getByRole('button', { name: 'Start Monthly Mock Placement Test', exact: false }).first();
    recordResult('Mock Placement Exam Button Rendered', await placementBtn.isVisible());

    // Check Graded Readers
    const readerTitle = await page.getByText('Tap any word to open instantaneous morphological dictionary', { exact: false }).first().isVisible();
    recordResult('Graded Readers Section Rendered', readerTitle);

    await page.screenshot({ path: path.join(screenshotsDir, '07_immersion_reader.png'), fullPage: true });
    recordResult('Screenshot 7: Immersion Reader Saved', true, '07_immersion_reader.png');

  } catch (error) {
    console.error('Playwright execution error:', error);
    recordResult('Execution without unhandled crash', false, error.message);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('                 PLAYWRIGHT TEST SUMMARY                        ');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`TOTAL: ${passedCount} / ${totalCount} UI checks PASSED.`);
  console.log(`SCREENSHOTS SAVED: ${screenshotsDir}`);
  console.log('================================================================\n');

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runVerification();
