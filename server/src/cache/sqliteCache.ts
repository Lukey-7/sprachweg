import crypto from 'crypto';
import { prisma } from '../db/prisma.js';

export interface CacheMetrics {
  totalEntries: number;
  totalHits: number;
  typeDistribution: Record<string, number>;
}

export class SqliteCacheRepository {
  /**
   * Generates a deterministic SHA-256 hash key from a cacheType and input object/string.
   */
  public generateHashKey(cacheType: string, inputParams: string | object): { hashKey: string; normalizedParams: string } {
    let normalizedParams = '';
    if (typeof inputParams === 'string') {
      normalizedParams = inputParams.trim();
    } else if (inputParams && typeof inputParams === 'object') {
      // Sort keys recursively for deterministic serialization
      normalizedParams = JSON.stringify(this.sortObjectKeys(inputParams));
    } else {
      normalizedParams = String(inputParams);
    }

    const hashKey = crypto
      .createHash('sha256')
      .update(`${cacheType.toLowerCase().trim()}:${normalizedParams}`)
      .digest('hex');

    return { hashKey, normalizedParams };
  }

  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj;
    }
    const sortedObj: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      const val = obj[key];
      sortedObj[key] = typeof val === 'object' && val !== null && !Array.isArray(val)
        ? this.sortObjectKeys(val)
        : val;
    }
    return sortedObj;
  }

  /**
   * Retrieves a cached payload if present and not expired. Automatically increments hitCount.
   */
  public async get<T>(cacheType: string, inputParams: string | object): Promise<T | null> {
    try {
      const { hashKey } = this.generateHashKey(cacheType, inputParams);

      const entry = await prisma.cacheEntry.findUnique({
        where: { cacheKey: hashKey },
      });

      if (!entry) {
        return null;
      }

      // Check TTL expiration
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        await prisma.cacheEntry.delete({ where: { id: entry.id } }).catch(() => {});
        return null;
      }

      // Increment hitCount
      await prisma.cacheEntry
        .updateMany({
          where: { id: entry.id },
          data: { hitCount: { increment: 1 } },
        })
        .catch(() => {});

      return JSON.parse(entry.payloadJson) as T;
    } catch (error) {
      console.warn('SqliteCacheRepository.get error:', error);
      return null;
    }
  }

  /**
   * Stores a payload in the SQLite cache table.
   */
  public async set<T>(
    cacheType: string,
    inputParams: string | object,
    payload: T,
    ttlSeconds?: number
  ): Promise<string> {
    try {
      const { hashKey, normalizedParams } = this.generateHashKey(cacheType, inputParams);
      const payloadJson = JSON.stringify(payload);
      const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;

      await prisma.cacheEntry.upsert({
        where: { cacheKey: hashKey },
        update: {
          payloadJson,
          inputParamsJson: normalizedParams,
          expiresAt,
          updatedAt: new Date(),
        },
        create: {
          cacheKey: hashKey,
          cacheType,
          inputParamsJson: normalizedParams,
          payloadJson,
          expiresAt,
          hitCount: 1,
        },
      });

      return hashKey;
    } catch (error) {
      console.warn('SqliteCacheRepository.set error:', error);
      return '';
    }
  }

  /**
   * Checks if an entry exists and is not expired.
   */
  public async has(cacheType: string, inputParams: string | object): Promise<boolean> {
    const { hashKey } = this.generateHashKey(cacheType, inputParams);
    const count = await prisma.cacheEntry.count({
      where: {
        cacheKey: hashKey,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return count > 0;
  }

  /**
   * Invalidate entry by key
   */
  public async invalidate(cacheKey: string): Promise<void> {
    await prisma.cacheEntry.deleteMany({ where: { cacheKey } });
  }

  /**
   * Aggregates cache operational metrics
   */
  public async getMetrics(): Promise<CacheMetrics> {
    const entries = await prisma.cacheEntry.findMany({
      select: { cacheType: true, hitCount: true },
    });

    const totalEntries = entries.length;
    let totalHits = 0;
    const typeDistribution: Record<string, number> = {};

    for (const e of entries) {
      totalHits += e.hitCount;
      typeDistribution[e.cacheType] = (typeDistribution[e.cacheType] || 0) + 1;
    }

    return {
      totalEntries,
      totalHits,
      typeDistribution,
    };
  }

  /**
   * Clears all expired entries from cache table
   */
  public async clearExpired(): Promise<number> {
    const result = await prisma.cacheEntry.deleteMany({
      where: {
        expiresAt: {
          not: null,
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}

export const sqliteCache = new SqliteCacheRepository();
