import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

loadEnvConfig(process.cwd());

test('a deleted website User with a valid cookie reaches login instead of looping to mobile authorize', async ({ page }) => {
  const request = page.request;
  const databaseUrl = process.env.DATABASE_URL;
  const database = databaseUrl ? new URL(databaseUrl) : null;
  if (!database || database.protocol !== 'mysql:' || database.hostname !== '127.0.0.1' ||
      database.pathname !== '/web_robot_ai_ci') {
    throw new Error('Mobile auth regression requires the dedicated loopback web_robot_ai_ci database');
  }
  const prisma = new PrismaClient();
  const id = 'e2e-mobile-' + randomUUID();
  const email = id + '@example.test';
  const password = randomUUID();
  const params = new URLSearchParams({ response_type: 'code', client_id: 'roboeq-mobile',
    redirect_uri: 'roboeq://auth/callback', code_challenge: 'c'.repeat(43),
    code_challenge_method: 'S256', state: 's'.repeat(32) });
  const returnPath = '/mobile/authorize?' + params;
  const loginPath = '/login?' + new URLSearchParams({ callbackUrl: returnPath });
  try {
    await prisma.user.create({ data: { id, name: 'Mobile regression fixture', email,
      password: await bcrypt.hash(password, 12), role: 'USER' } });
    const csrf = await (await request.get('/api/auth/csrf')).json();
    const signedIn = await request.post('/api/auth/callback/credentials-password', {
      form: { csrfToken: csrf.csrfToken, identifier: email, password, callbackUrl: 'http://localhost:3000' },
      headers: { 'X-Auth-Return-Redirect': '1' },
    });
    expect(signedIn.status()).toBe(200);
    expect((await (await request.get('/api/auth/session')).json()).user.id).toBe(id);
    const active = await request.get(loginPath, { maxRedirects: 0 });
    expect(new URL(active.headers().location, 'http://localhost:3000').pathname).toBe('/mobile/authorize');
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    // The Auth.js cookie remains valid; only fresh MySQL state can distinguish it.
    const deleted = await request.get(loginPath, { maxRedirects: 0 });
    const destination = new URL(deleted.headers().location, 'http://localhost:3000');
    expect(destination.pathname).toBe('/');
    expect(destination.searchParams.get('login')).toBe('true');
    expect(destination.searchParams.get('callbackUrl')).toBe(returnPath);
    await page.goto(loginPath);
    await expect(page).toHaveURL((url) => url.pathname === '/' && url.searchParams.get('callbackUrl') === returnPath);
    await expect(page.getByRole('dialog')).toBeVisible();
  } finally {
    await prisma.user.deleteMany({ where: { id, email } });
    await prisma.$disconnect();
  }
});
