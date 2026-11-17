import { it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

it('B-T3 health route answers 200 and {"status":"ok"}', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});