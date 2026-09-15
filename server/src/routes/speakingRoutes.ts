import { getUserId } from '../user.js';
import { Router, Request, Response } from 'express';
import { geminiService, GeminiUnavailableError, SpeakingEvaluationResponseSchema } from '../ai/geminiClient.js';
import { normalizeGender, splitArticle } from '../linguistics/gender.js';

/** Scores must be 0–100. Models occasionally answer on a 0–5 or 0–10 scale. */
export function toPercent(value: unknown, scaleHint: number): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  const scaled = scaleHint <= 5 ? n * 20 : scaleHint <= 10 ? n * 10 : n;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}
import { prisma } from '../db/prisma.js';

export const speakingRouter = Router();

speakingRouter.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { mode, transcript, targetText, scenarioId } = req.body;

    const raw: any = await geminiService.generateStructured({
      prompt: `Evaluate this spoken German response for mode ${mode || 'free_conversation'}. Target text: "${targetText || ''}". Learner transcript: "${transcript}". Give scores as integers from 0 to 100, up to 3 successes, up to 3 corrections, and up to 5 useful vocabulary words.`,
      responseSchema: SpeakingEvaluationResponseSchema,
      cacheType: 'speaking_evaluation',
      cacheKeyData: { mode, transcript, targetText, scenarioId },
    });

    // The largest score reveals which scale the model used.
    const scale = Math.max(...[raw.overallScore, raw.fluencyScore, raw.accuracyScore].map(Number).filter(Number.isFinite), 0);
    const evaluation = {
      ...raw,
      overallScore: toPercent(raw.overallScore, scale) ?? 0,
      fluencyScore: toPercent(raw.fluencyScore, scale),
      accuracyScore: toPercent(raw.accuracyScore, scale),
      minedVocabulary: (raw.minedVocabulary || []).map((w: any) => {
        const split = splitArticle(String(w.lemma || ''));
        return { ...w, lemma: split.lemma, gender: normalizeGender(w.gender) ?? split.gender };
      }),
    };

    const speakingSession = await prisma.speakingSession.create({
      data: {
        userId,
        sessionMode: mode || 'free_conversation',
        scenarioId,
        targetText,
        transcript: transcript || '',
        overallScore: (evaluation as any).overallScore || 85.0,
        fluencyScore: (evaluation as any).fluencyScore || 85.0,
        accuracyScore: (evaluation as any).accuracyScore || 85.0,
        successPointsJson: JSON.stringify((evaluation as any).successes || []),
        correctionsJson: JSON.stringify((evaluation as any).corrections || []),
        minedWordsJson: JSON.stringify((evaluation as any).minedVocabulary || []),
      },
    });

    res.json({ evaluation, speakingSession, mock: geminiService.isMockMode });
  } catch (error: any) {
    res.status(error instanceof GeminiUnavailableError ? 503 : 500).json({ error: 'Speaking evaluation failed', message: error?.message });
  }
});
