import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { authenticateRequest, checkQuotaAndCapability, recordExecutionLog } from '../src/lib/server/security/quota-guard';
import { userRepo, planRepo, usageRepo, usageLogRepo } from '../src/lib/server/db/repository';
import type { UserAccount, PlanConfig, DailyUsageItem } from '../src/lib/types';

describe('Quota Guard & Auth Flow', () => {
  beforeEach(() => {
    spyOn(planRepo, 'get').mockImplementation(async (planId: any) => {
      if (planId === 'pro') {
        return {
          id: 'pro',
          name: 'Pro Plan',
          maxDaily: 100,
          badge: 'Pro',
          description: '100 requests',
          price: '$9.99',
          priceNum: 9.99,
          priority: 5,
          allowImageEditing: true,
          maxImageResolution: 1024
        };
      }
      return {
        id: 'free',
        name: 'Free Plan',
        maxDaily: 20,
        badge: 'Free',
        description: '20 requests',
        price: '$0',
        priceNum: 0,
        priority: 1,
        allowImageEditing: false,
        maxImageResolution: 1024
      };
    });
  });

  describe('authenticateRequest', () => {
    it('should identify unauthenticated requests as guest with IP', async () => {
      const req = new Request('http://localhost/api/generate', {
        headers: { 'x-forwarded-for': '192.168.1.50' }
      });
      const auth = await authenticateRequest(req, { required: false });
      expect(auth.isGuest).toBe(true);
      expect(auth.user).toBeNull();
      expect(auth.clientIp).toBe('192.168.1.50');
    });

    it('should throw error when auth is required but missing', async () => {
      const req = new Request('http://localhost/api/generate');
      expect(authenticateRequest(req, { required: true })).rejects.toThrow('Silakan login terlebih dahulu');
    });

    it('should authenticate with valid session token in cookie', async () => {
      const mockUser: UserAccount = {
        id: 'usr_logged_in',
        email: 'user@test.com',
        name: 'User Test',
        role: 'user',
        plan: 'pro',
        status: 'active',
        apiKeys: [],
        sessionTokens: ['gem_sess_validtoken123'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      spyOn(userRepo, 'findBySessionToken').mockImplementation(async (token: string) => {
        return token === 'gem_sess_validtoken123' ? mockUser : null;
      });

      const req = new Request('http://localhost/api/generate', {
        headers: {
          cookie: 'gem_sess_token=gem_sess_validtoken123',
          'x-forwarded-for': '10.0.0.1'
        }
      });

      const auth = await authenticateRequest(req);
      expect(auth.isGuest).toBe(false);
      expect(auth.user?.id).toBe('usr_logged_in');
    });

    it('should authenticate with valid API key header', async () => {
      const mockUser: UserAccount = {
        id: 'usr_api_owner',
        email: 'api@test.com',
        name: 'API User',
        role: 'user',
        plan: 'pro',
        status: 'active',
        apiKeys: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      spyOn(userRepo, 'findByApiKey').mockImplementation(async (key: string) => {
        if (key === 'gem_sec_validkey123') {
          return {
            user: mockUser,
            apiKey: { id: 'key_1', name: 'Dev', keyPrefix: 'gem_sec_valid...', keyHash: 'hash', createdAt: Date.now() }
          };
        }
        return null;
      });

      const req = new Request('http://localhost/api/generate', {
        headers: {
          Authorization: 'Bearer gem_sec_validkey123'
        }
      });

      const auth = await authenticateRequest(req);
      expect(auth.isGuest).toBe(false);
      expect(auth.user?.id).toBe('usr_api_owner');
      expect(auth.apiKey?.id).toBe('key_1');
    });
  });

  describe('checkQuotaAndCapability', () => {
    it('should enforce editing restriction on plans where allowImageEditing is false', async () => {
      const guestAuth = {
        user: null,
        clientIp: '127.0.0.1',
        userAgent: 'test',
        isGuest: true
      };

      spyOn(usageRepo, 'getQuotaStatus').mockImplementation(async () => ({
        plan: 'free',
        planName: 'Free Plan',
        badge: 'Free',
        maxDaily: 20,
        usedToday: 0,
        remainingToday: 20,
        percentageUsed: 0,
        resetTime: '00:00 WIB',
        allowImageEditing: false
      }));

      expect(checkQuotaAndCapability(guestAuth, 'edit', '3.7-flash')).rejects.toThrow(
        'tidak mendukung fitur Image-to-Image editing'
      );
    });

    it('should calculate model credit cost multiplier correctly', async () => {
      const userAuth = {
        user: { id: 'usr_pro', plan: 'pro' } as UserAccount,
        clientIp: '127.0.0.1',
        userAgent: 'test',
        isGuest: false
      };

      spyOn(usageRepo, 'getQuotaStatus').mockImplementation(async () => ({
        plan: 'pro',
        planName: 'Pro Plan',
        badge: 'Pro',
        maxDaily: 100,
        usedToday: 10,
        remainingToday: 90,
        percentageUsed: 10,
        resetTime: '00:00 WIB',
        allowImageEditing: true
      }));

      const resFlashLite = await checkQuotaAndCapability(userAuth, 'generate', '3.5-flash-lite');
      expect(resFlashLite.creditCost).toBe(1);

      const resFlash = await checkQuotaAndCapability(userAuth, 'generate', '3.7-flash');
      expect(resFlash.creditCost).toBe(2);

      const resPro = await checkQuotaAndCapability(userAuth, 'generate', '3.1-pro');
      expect(resPro.creditCost).toBe(3);

      const resThinking = await checkQuotaAndCapability(userAuth, 'generate', 'extended-thinking');
      expect(resThinking.creditCost).toBe(4);
    });

    it('should throw error when daily quota is exceeded', async () => {
      const userAuth = {
        user: { id: 'usr_pro', plan: 'pro' } as UserAccount,
        clientIp: '127.0.0.1',
        userAgent: 'test',
        isGuest: false
      };

      spyOn(usageRepo, 'getQuotaStatus').mockImplementation(async () => ({
        plan: 'pro',
        planName: 'Pro Plan',
        badge: 'Pro',
        maxDaily: 100,
        usedToday: 99,
        remainingToday: 1,
        percentageUsed: 99,
        resetTime: '00:00 WIB',
        allowImageEditing: true
      }));

      // Needs 2 credits for 3.7-flash, but only 1 credit remaining
      expect(checkQuotaAndCapability(userAuth, 'generate', '3.7-flash')).rejects.toThrow('tidak mencukupi');
    });
  });
});
