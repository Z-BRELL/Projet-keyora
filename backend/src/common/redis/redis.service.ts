import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      // Reconnection automatique
      retryStrategy: (times) => {
        if (times > 5) {
          this.logger.warn('Redis : impossible de se connecter après 5 tentatives. Cache désactivé.');
          return null; // stoppe les tentatives
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    this.client.on('connect', () => this.logger.log('✅ Redis connecté'));
    this.client.on('error', (err) => this.logger.warn(`Redis erreur : ${err.message}`));

    this.client.connect().catch(() => {
      this.logger.warn('Redis non disponible — le cache est désactivé, l\'API fonctionne normalement.');
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  /** Récupère une valeur depuis le cache. Retourne null si absent ou Redis indisponible. */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.client.status !== 'ready') return null;
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /** Stocke une valeur dans le cache avec un TTL en secondes. */
  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    try {
      if (this.client.status !== 'ready') return;
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Redis indisponible : on continue sans cache
    }
  }

  /** Supprime une clé précise. */
  async del(key: string): Promise<void> {
    try {
      if (this.client.status !== 'ready') return;
      await this.client.del(key);
    } catch {
      // silencieux
    }
  }

  /** Invalide toutes les clés correspondant à un pattern (ex: "listings:*"). */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (this.client.status !== 'ready') return;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.debug(`Cache invalidé : ${keys.length} clé(s) supprimée(s) [${pattern}]`);
      }
    } catch {
      // silencieux
    }
  }

  /** Retourne le client ioredis brut si nécessaire. */
  getClient(): Redis {
    return this.client;
  }

  /** Ping Redis pour vérifier la connexion. */
  async ping(): Promise<string> {
    try {
      if (this.client.status !== 'ready') throw new Error('Redis not ready');
      return await this.client.ping();
    } catch (err: any) {
      throw new Error(`Redis ping failed: ${err.message}`);
    }
  }
}
