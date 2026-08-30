import { describe, it, expect } from 'bun:test';
import { getPoolStatus } from '../src/lib/server/browser/pool';

describe('Browser Pool Management & Status', () => {
  it('should return initial pool status with valid properties', () => {
    const status = getPoolStatus();
    expect(typeof status.maxTabs).toBe('number');
    expect(typeof status.busyTabs).toBe('number');
    expect(typeof status.idleTabs).toBe('number');
    expect(typeof status.queuedTasks).toBe('number');
    expect(status.maxTabs).toBeGreaterThanOrEqual(1);
    expect(status.queuedTasks).toBe(0);
  });
});
