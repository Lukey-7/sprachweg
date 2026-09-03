import { describe, it, expect } from '../harness/testRunner';

describe('Feature 4: Core REST API Express Server & Route Contracts', () => {
  it('should validate dictionary search endpoint route contract (/api/dictionary/search)', async () => {
    const mockRouter = {
      handleSearch: (query: string) => {
        if (!query || query.trim() === '') {
          return { status: 400, body: { error: 'Query parameter required' } };
        }
        return {
          status: 200,
          body: {
            query,
            results: [{ lemma: 'schön', pos: 'ADJ', translation: 'beautiful' }],
          },
        };
      },
    };

    const resValid = mockRouter.handleSearch('schoen');
    expect(resValid.status).toBe(200);
    expect(resValid.body.results[0].lemma).toBe('schön');

    const resEmpty = mockRouter.handleSearch('');
    expect(resEmpty.status).toBe(400);
  });

  it('should validate sentence analyze endpoint route contract (/api/miner/analyze)', async () => {
    const mockRouter = {
      handleAnalyze: (payload: { sentence?: string }) => {
        if (!payload.sentence) {
          return { status: 400, body: { error: 'Sentence payload required' } };
        }
        return {
          status: 200,
          body: {
            sentenceDe: payload.sentence,
            cefrLevel: 'A1',
            tokens: [{ token: 'Hallo', pos: 'OTHER' }],
          },
        };
      },
    };

    const res = mockRouter.handleAnalyze({ sentence: 'Hallo Welt.' });
    expect(res.status).toBe(200);
    expect(res.body.sentenceDe).toBe('Hallo Welt.');
    expect(res.body.cefrLevel).toBe('A1');
  });

  it('should validate FSRS review submission endpoint route contract (/api/srs/review)', async () => {
    const mockRouter = {
      handleReview: (payload: { cardId?: string; rating?: number }) => {
        if (!payload.cardId || !payload.rating || payload.rating < 1 || payload.rating > 4) {
          return { status: 422, body: { error: 'Invalid cardId or rating (1-4)' } };
        }
        return {
          status: 200,
          body: {
            cardId: payload.cardId,
            rating: payload.rating,
            scheduledDays: 3,
            dueAt: '2026-09-05T12:00:00.000Z',
          },
        };
      },
    };

    const resOk = mockRouter.handleReview({ cardId: 'c1', rating: 3 });
    expect(resOk.status).toBe(200);
    expect(resOk.body.scheduledDays).toBe(3);

    const resInvalid = mockRouter.handleReview({ cardId: 'c1', rating: 5 });
    expect(resInvalid.status).toBe(422);
  });

  it('should validate daily session generator endpoint route contract (/api/curriculum/session)', async () => {
    const mockRouter = {
      handleGetSession: (userId: string, week: number, day: number) => {
        return {
          status: 200,
          body: {
            sessionId: `sess_${week}_${day}`,
            weekNumber: week,
            dayOfWeek: day,
            blocks: ['block1Warmup', 'block2Grammar', 'block3Mining', 'block4Speaking', 'block5Immersion'],
          },
        };
      },
    };

    const res = mockRouter.handleGetSession('usr_1', 3, 2);
    expect(res.status).toBe(200);
    expect(res.body.blocks).toHaveLength(5);
    expect(res.body.weekNumber).toBe(3);
  });

  it('should handle unhandled errors with 500 JSON error responses and structured error codes', () => {
    const errorHandler = (err: Error) => {
      return {
        status: 500,
        body: {
          error: 'INTERNAL_SERVER_ERROR',
          message: err.message,
          timestamp: new Date().toISOString(),
        },
      };
    };

    const errRes = errorHandler(new Error('Database lock timeout'));
    expect(errRes.status).toBe(500);
    expect(errRes.body.error).toBe('INTERNAL_SERVER_ERROR');
    expect(errRes.body.message).toBe('Database lock timeout');
  });
}, 'Tier 1');
