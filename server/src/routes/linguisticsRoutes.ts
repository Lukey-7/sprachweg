import { Router, Request, Response } from 'express';
import { validatePrepositionCase } from '../linguistics/prepositions.js';
import { validateAuxiliaryVerb } from '../linguistics/auxiliary.js';
import { validateNounDeclension } from '../linguistics/declensions.js';
import { parseSatzklammer } from '../linguistics/satzklammer.js';
import { ErrorDiagnosticsEngine } from '../linguistics/errorDiagnostics.js';

export const linguisticsRouter = Router();

linguisticsRouter.post('/validate-preposition', (req: Request, res: Response) => {
  const { preposition, detectedCase, isDirectional } = req.body;
  if (!preposition || !detectedCase) {
    return res.status(400).json({ error: 'preposition and detectedCase are required' });
  }
  const result = validatePrepositionCase(preposition, detectedCase, Boolean(isDirectional));
  res.json(result);
});

linguisticsRouter.post('/validate-auxiliary', (req: Request, res: Response) => {
  const { verbLemma, detectedAuxiliary } = req.body;
  if (!verbLemma) {
    return res.status(400).json({ error: 'verbLemma is required' });
  }
  const result = validateAuxiliaryVerb(verbLemma, detectedAuxiliary);
  res.json(result);
});

linguisticsRouter.post('/validate-declension', (req: Request, res: Response) => {
  const { noun, gender, targetCase, number, isNDeclension } = req.body;
  if (!noun || !gender || !targetCase || !number) {
    return res.status(400).json({ error: 'noun, gender, targetCase, and number are required' });
  }
  const expectedForm = validateNounDeclension(noun, gender, targetCase, number, Boolean(isNDeclension));
  res.json({ expectedForm, noun, gender, targetCase, number });
});

linguisticsRouter.post('/parse-satzklammer', (req: Request, res: Response) => {
  const { sentence } = req.body;
  if (!sentence) {
    return res.status(400).json({ error: 'sentence is required' });
  }
  const result = parseSatzklammer(sentence);
  res.json(result);
});

linguisticsRouter.post('/diagnose-error', (req: Request, res: Response) => {
  const { input, expected } = req.body;
  if (!input || !expected) {
    return res.status(400).json({ error: 'input and expected are required' });
  }
  const report = ErrorDiagnosticsEngine.diagnose(input, expected);
  res.json(report);
});
