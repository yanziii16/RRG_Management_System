import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('login and roles without a database', () => {
  it('B-T6 login with empty fields says each field is required (AC-03)', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: '', password: '' });
    console.log(res.body);
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.message)).toEqual(['required', 'required']);
  });

  it('B-T7 a protected route refuses a request that has no login token', async () => {
    const res = await request(app).get('/api/auth/me');
    console.log(res.status, res.text);
    expect(res.status).toBe(401);
  });

  it('B-T8 CORS allows only the real frontend address, not every website', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });
});