import { geminiService, GeminiUnavailableError } from '../ai/geminiClient.js';
import { Router, Request, Response } from 'express';
import { SentenceMinerEngine } from '../miner/sentenceMiner.js';
import { SentenceCardGenerator } from '../miner/variations.js';
import { InterlinearGenerator } from '../miner/interlinear.js';
import { parseSatzklammer } from '../linguistics/satzklammer.js';
import { getUserId } from '../user.js';

export const minerRouter = Router();

minerRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { sentence, level } = req.body;
    if (!sentence || typeof sentence !== 'string') {
      return res.status(400).json({ error: 'sentence string is required' });
    }
    const analysis = await SentenceMinerEngine.analyzeSentence(sentence, level);
    res.json({ analysis, mock: geminiService.isMockMode });
  } catch (error: any) {
    res.status(error instanceof GeminiUnavailableError ? 503 : 500).json({ error: 'Sentence analysis failed', message: error?.message });
  }
});

minerRouter.post('/parse-topological', (req: Request, res: Response) => {
  const { sentence } = req.body;
  if (!sentence || typeof sentence !== 'string') {
    return res.status(400).json({ error: 'sentence string is required' });
  }
  const result = parseSatzklammer(sentence);
  res.json(result);
});

minerRouter.post('/mine-card', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { prompt, answer } = req.body;
    if (!prompt || !answer) {
      return res.status(400).json({ error: 'prompt and answer are required' });
    }

    const card = await SentenceCardGenerator.createMinedCard({
      userId,
      ...req.body,
    });
    res.json({ card });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Mining card failed' });
  }
});

minerRouter.post('/generate-cloze', (req: Request, res: Response) => {
  const { sentenceDe, targetToken, meaningEn } = req.body;
  if (!sentenceDe || !targetToken || !meaningEn) {
    return res.status(400).json({ error: 'sentenceDe, targetToken, and meaningEn are required' });
  }
  const cloze = SentenceCardGenerator.generateClozeCardData(sentenceDe, targetToken, meaningEn);
  res.json(cloze);
});

minerRouter.post('/interlinear', async (req: Request, res: Response) => {
  try {
    const { sentence, level } = req.body;
    if (!sentence || typeof sentence !== 'string') {
      return res.status(400).json({ error: 'sentence string is required' });
    }
    const analysis = await SentenceMinerEngine.analyzeSentence(sentence, level);
    const layout = InterlinearGenerator.generateLayout(analysis);
    res.json({ interlinear: layout });
  } catch (error: any) {
    res.status(500).json({ error: 'Interlinear generation failed', message: error?.message });
  }
});
