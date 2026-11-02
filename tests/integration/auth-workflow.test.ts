import { describe, it, expect } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { app as schoolApp } from '../../services/school-api/src/app';
import { getDefaultSchoolPrisma } from '../../packages/database/src';
import { hashSha256 } from '../../packages/config/src';

describe('End-to-End Principal & School Auth Workflow Tests', () => {
  const testEmail = `principal-test-${Date.now()}@xyra-academy.edu`;
  const rawInvitationToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSha256(rawInvitationToken);
  const testPassword = 'StrongPassword@2026!';
  let authToken: string;
  let createdUserId: string;

  it('1. Seed an active invitation in school DB', async () => {
    const schoolDb = getDefaultSchoolPrisma();
    const invitation = await schoolDb.userInvitation.create({
      data: {
        email: testEmail,
        roleCode: 'PRINCIPAL',
        userType: 'PRINCIPAL',
        invitationTokenHash: tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        status: 'PENDING',
      },
    });

    expect(invitation).toBeDefined();
    expect(invitation.status).toBe('PENDING');
  });

  it('2. Principal activates account by setting their own password (Argon2id)', async () => {
    const res = await request(schoolApp)
      .post('/api/v1/school/auth/activate-invitation')
      .send({
        token: rawInvitationToken,
        firstName: 'Elena',
        lastName: 'Vance',
        password: testPassword,
        confirmPassword: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.recoveryCodes).toHaveLength(8);
    createdUserId = res.body.data.userId;

    // Verify invitation status transitioned to ACCEPTED
    const schoolDb = getDefaultSchoolPrisma();
    const inv = await schoolDb.userInvitation.findUnique({
      where: { invitationTokenHash: tokenHash },
    });
    expect(inv?.status).toBe('ACCEPTED');
  });

  it('3. Re-using accepted invitation token must be rejected', async () => {
    const res = await request(schoolApp)
      .post('/api/v1/school/auth/activate-invitation')
      .send({
        token: rawInvitationToken,
        firstName: 'Elena',
        lastName: 'Vance',
        password: testPassword,
        confirmPassword: testPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVITATION_INACTIVE');
  });

  it('4. Principal logs in with their newly configured credentials', async () => {
    const res = await request(schoolApp)
      .post('/api/v1/school/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.userType).toBe('PRINCIPAL');
    authToken = res.body.data.token;
  });

  it('5. Access authenticated profile using JWT token', async () => {
    const res = await request(schoolApp)
      .get('/api/v1/school/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.permissions).toContain('*');
  });

  it('6. Principal creates staff invitation (authorized user management)', async () => {
    const teacherEmail = `teacher-${Date.now()}@xyra-academy.edu`;
    const res = await request(schoolApp)
      .post('/api/v1/school/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: teacherEmail,
        firstName: 'John',
        lastName: 'Doe',
        userType: 'TEACHER',
        roleCode: 'TEACHER',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invitationToken).toBeDefined();
  });

  it('7. Principal logs out and session is revoked server-side', async () => {
    const logoutRes = await request(schoolApp)
      .post('/api/v1/school/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.loggedOut).toBe(true);

    // Subsequent call with the same token must fail due to session revocation
    const retryRes = await request(schoolApp)
      .get('/api/v1/school/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(retryRes.status).toBe(401);
    expect(retryRes.body.error.code).toBe('SESSION_REVOKED');
  });
});
