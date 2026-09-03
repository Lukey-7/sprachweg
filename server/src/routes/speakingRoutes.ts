import { Router, Request, Response } from 'express';
import { geminiService, SpeakingEvaluationResponseSchema } from '../ai/geminiClient.js';
import { prisma } from '../db/prisma.js';

export const speakingRouter = Router();

speakingRouter.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'guest-user-001';
    const { mode, transcript, targetText, scenarioId } = req.body;

    const evaluation = await geminiService.generateStructured({
      prompt: `Evaluate this spoken German response for mode ${mode || 'free_conversation'}. Target text: "${targetText || ''}". Learner transcript: "${transcript}".`,
      responseSchema: SpeakingEvaluationResponseSchema,
      cacheType: 'speaking_evaluation',
      cacheKeyData: { mode, transcript, targetText, scenarioId },
    });

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

    res.json({ evaluation, speakingSession });
  } catch (error: any) {
    res.status(500).json({ error: 'Speaking evaluation failed', message: error?.message });
  }
});
