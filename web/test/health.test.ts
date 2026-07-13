import { describe, it, expect } from 'vitest';

describe('Health endpoints', () => {
  it('healthz endpoint should return 200 OK', async () => {
    const response = await fetch('http://localhost:3000/healthz');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');
  });

  it('readyz endpoint should return 200 OK', async () => {
    const response = await fetch('http://localhost:3000/readyz');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');
  });
});