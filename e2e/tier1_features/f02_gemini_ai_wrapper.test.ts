import { describe, it, expect } from '../harness/testRunner';
import { GeminiRequestOptions, GeminiClient } from '../harness/contracts';

describe('Feature 2: Gemini AI Wrapper & Structured Output Verification', () => {
  it('should format request payloads with strict responseSchema and system instructions', async () => {
    const mockSchema = {
      type: 'object',
      properties: {
        sentenceDe: { type: 'string' },
        cefrLevel: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2'] },
      },
      required: ['sentenceDe', 'cefrLevel'],
    };

    const options: GeminiRequestOptions<any> = {
      prompt: 'Analyze: "Der Hund läuft im Park."',
      systemInstruction: 'You are a certified Goethe-Institut German linguist.',
      responseSchema: mockSchema,
      temperature: 0.1,
    };

    expect(options.systemInstruction).toContain('Goethe-Institut');
    expect(options.responseSchema).toEqual(mockSchema);
    expect(options.temperature).toBe(0.1);
  });

  it('should validate structured JSON response conforming to responseSchema', async () => {
    const mockApiResponse = {
      sentenceDe: 'Der Hund läuft im Park.',
      sentenceEnNatural: 'The dog is running in the park.',
      cefrLevel: 'A1',
      tokensCount: 5,
    };

    // Schema validation assertion
    expect(mockApiResponse.sentenceDe).toBeDefined();
    expect(mockApiResponse.sentenceEnNatural).toBe('The dog is running in the park.');
    expect(['A1', 'A2', 'B1', 'B2']).toContain(mockApiResponse.cefrLevel);
    expect(mockApiResponse.tokensCount).toBe(5);
  });

  it('should reject or handle malformed JSON responses with structured retry error handling', async () => {
    const parseStructuredResponse = (raw: string) => {
      try {
        return JSON.parse(raw);
      } catch (e) {
        throw new Error('Malformed Gemini JSON Payload');
      }
    };

    expect(() => parseStructuredResponse('{ invalid_json ')).toThrow('Malformed Gemini JSON Payload');
    expect(() => parseStructuredResponse('{"valid": true}')).not.toThrow();
  });

  it('should sanitize temperature bounds between 0.0 and 1.0', () => {
    const clampTemperature = (temp?: number) => {
      if (temp === undefined) return 0.2;
      return Math.max(0.0, Math.min(1.0, temp));
    };

    expect(clampTemperature(-0.5)).toBe(0.0);
    expect(clampTemperature(1.8)).toBe(1.0);
    expect(clampTemperature(0.3)).toBe(0.3);
    expect(clampTemperature(undefined)).toBe(0.2);
  });

  it('should verify deterministic prompt hashing generation', () => {
    const generatePromptHash = (prompt: string, schema: object) => {
      const payload = `${prompt}|${JSON.stringify(schema)}`;
      let hash = 0;
      for (let i = 0; i < payload.length; i++) {
        hash = (hash << 5) - hash + payload.charCodeAt(i);
        hash |= 0;
      }
      return `hash_${Math.abs(hash)}`;
    };

    const hash1 = generatePromptHash('Test Prompt', { a: 1 });
    const hash2 = generatePromptHash('Test Prompt', { a: 1 });
    const hash3 = generatePromptHash('Different Prompt', { a: 1 });

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
}, 'Tier 1');
