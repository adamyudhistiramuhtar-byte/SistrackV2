const authService = require('../src/services/auth.service');
const Admin = require('../src/models/admin.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/admin.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Service - IMP-013', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return token on valid login', async () => {
    const mockAdmin = { id: 1, email: 'admin@test.com', password_hash: 'hashed' };
    Admin.findByEmail.mockResolvedValue(mockAdmin);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock-jwt-token');

    const result = await authService.login('admin@test.com', 'password123');

    expect(Admin.findByEmail).toHaveBeenCalledWith('admin@test.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed');
    expect(jwt.sign).toHaveBeenCalled();
    expect(result.token).toBe('mock-jwt-token');
    expect(result.admin.email).toBe('admin@test.com');
  });

  it('should throw error on invalid password', async () => {
    const mockAdmin = { id: 1, email: 'admin@test.com', password_hash: 'hashed' };
    Admin.findByEmail.mockResolvedValue(mockAdmin);
    bcrypt.compare.mockResolvedValue(false); // wrong password

    await expect(authService.login('admin@test.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
  });

  it('should fallback to hardcoded admin if DB fails but credentials match fallback', async () => {
    Admin.findByEmail.mockRejectedValue(new Error('DB connection failed'));
    jwt.sign.mockReturnValue('fallback-token');

    const result = await authService.login('admin@sistrack.local', 'admin123');

    expect(result.token).toBe('fallback-token');
    expect(result.admin.role).toBe('admin');
  });
});
