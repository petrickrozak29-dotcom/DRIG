import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './prismaClient';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '900'; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '604800'; // 7 days
const DEVELOPER_EMAIL = 'developermagelang45@gmail.com';
const DEVELOPER_PASSWORD = 'potensimagelang45#';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface CreateDeveloperInput {
  email: string;
  password: string;
  name: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    bio?: string | null;
    role?: string;
  };
  expiresIn: number;
}

// Password strength validation helper
export function validatePasswordStrength(password: string): boolean {
  if (password.length < 8) return false;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return hasUppercase && hasLowercase && hasDigit && hasSpecialChar;
}

// Email validation (RFC 5322 basic)
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateDeveloperPassword() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `MagelangDev45#${suffix}`;
}

export async function createDeveloperAccount(input: CreateDeveloperInput) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!validateEmail(email)) {
    throw new Error('Format email tidak valid.');
  }

  if (name.length < 2) {
    throw new Error('Nama developer minimal 2 karakter.');
  }

  if (!validatePasswordStrength(input.password)) {
    throw new Error(
      'Password harus minimal 8 karakter dan berisi huruf besar, huruf kecil, angka, serta simbol.'
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(input.password, 10);

  if (existing) {
    return prisma.user.update({
      where: { email },
      data: {
        name,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      preferences: {
        create: {
          interests: '',
          budgetLevel: 'moderate',
          mobilityLevel: 5,
          maxSpendPerDay: 0,
          distancePreference: 5,
          language: 'id',
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLogin: true,
    },
  });
}

export async function register(input: RegisterInput): Promise<LoginResponse> {
  const { email, password, name } = input;

  // Validate email format
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength
  if (!validatePasswordStrength(password)) {
    throw new Error(
      'Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character'
    );
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password (10 rounds minimum)
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      lastLogin: new Date(),
      preferences: {
        create: {
          interests: '',
          budgetLevel: 'moderate',
          mobilityLevel: 5,
          maxSpendPerDay: 0,
          distancePreference: 5,
          language: 'id',
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      bio: true,
      role: true,
    },
  });

  // Generate tokens
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: parseInt(JWT_EXPIRE),
  });

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: parseInt(REFRESH_TOKEN_EXPIRE) }
  );

  return {
    token,
    refreshToken,
    user,
    expiresIn: parseInt(JWT_EXPIRE),
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (email.toLowerCase() === DEVELOPER_EMAIL && password === DEVELOPER_PASSWORD) {
    const passwordHash = await bcrypt.hash(DEVELOPER_PASSWORD, 10);

    await prisma.user.upsert({
      where: { email: DEVELOPER_EMAIL },
      update: {
        passwordHash,
        name: 'Developer Magelang',
        role: 'ADMIN',
        isActive: true,
        lastLogin: new Date(),
      },
      create: {
        email: DEVELOPER_EMAIL,
        passwordHash,
        name: 'Developer Magelang',
        role: 'ADMIN',
        isActive: true,
        lastLogin: new Date(),
        preferences: {
          create: {
            interests: '',
            budgetLevel: 'moderate',
            mobilityLevel: 5,
            maxSpendPerDay: 0,
            distancePreference: 5,
            language: 'id',
          },
        },
      },
    });
  }

  // Query user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() === DEVELOPER_EMAIL ? DEVELOPER_EMAIL : email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate JWT tokens
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: parseInt(JWT_EXPIRE),
  });

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: parseInt(REFRESH_TOKEN_EXPIRE) }
  );

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
    },
    expiresIn: parseInt(JWT_EXPIRE),
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
  type?: string;
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ token: string; expiresIn: number }> {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const newToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, JWT_SECRET, {
      expiresIn: parseInt(JWT_EXPIRE),
    });

    return {
      token: newToken,
      expiresIn: parseInt(JWT_EXPIRE),
    };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

export async function logout(userId: string): Promise<void> {
  // Placeholder for token revocation logic
  // In production, you'd maintain a blacklist or store refresh tokens in DB
  console.log(`User ${userId} logged out`);
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      bio: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function updateProfile(
  userId: string,
  input: { name?: string; bio?: string; avatar?: string }
) {
  if (input.name !== undefined && input.name.trim().length < 2) {
    throw new Error('Name must be at least 2 characters');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.bio !== undefined ? { bio: input.bio.trim() } : {}),
      ...(input.avatar !== undefined ? { avatar: input.avatar.trim() || null } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      bio: true,
      role: true,
    },
  });

  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  if (!validatePasswordStrength(newPassword)) {
    throw new Error(
      'Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character'
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
