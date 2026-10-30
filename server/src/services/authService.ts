import { User, IUser } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { TeacherProfile } from '../models/TeacherProfile';
import { RefreshToken } from '../models/RefreshToken';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/token';
import { RegisterInput, LoginInput } from '../utils/validators';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthResult {
  user: {
    id: string;
    fullName: string;
    email: string;
    uid: string;
    role: string;
    department: string;
    isVerified: boolean;
    accountStatus: string;
    profile?: any;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class AuthService {
  /**
   * Register a new Student or Teacher with associated academic profile.
   * Public registration of ADMIN accounts is strictly disallowed.
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.toLowerCase().trim();
    const uid = input.uid.toUpperCase().trim();

    // Check for existing account by email or UID
    const existing = await User.findOne({
      $or: [{ email }, { uid }],
    });

    if (existing) {
      if (existing.email === email) {
        throw new AppError('An account with this university email address already exists.', 409);
      }
      throw new AppError('An account with this University UID or Faculty ID already exists.', 409);
    }

    const passwordHash = await hashPassword(input.password);

    let createdUser: IUser | null = null;

    try {
      // 1. Create Core User
      createdUser = await User.create({
        fullName: input.fullName.trim(),
        email,
        uid,
        passwordHash,
        role: input.role,
        department: input.department.trim(),
        isVerified: false, // Initial public accounts start unverified
      });

      // 2. Create Role-Specific Profile
      if (input.role === 'STUDENT') {
        await StudentProfile.create({
          user: createdUser._id,
          course: input.course || 'B.Tech',
          semester: input.semester || 1,
          skills: [],
          privacyLevel: 'CAMPUS_ONLY',
        });
      } else if (input.role === 'TEACHER') {
        await TeacherProfile.create({
          user: createdUser._id,
          designation: input.designation || 'Assistant Professor',
          department: input.department.trim(),
          officeLocation: input.officeLocation?.trim() || 'Academic Block',
          researchDomains: input.researchDomains || [],
          isAcceptingBookings: true,
        });
      }

      // 3. Issue Dual JWT Tokens
      const userIdStr = createdUser._id.toString();
      const accessToken = signAccessToken({
        sub: userIdStr,
        email: createdUser.email,
        role: createdUser.role,
        uid: createdUser.uid,
      });

      const { token: refreshToken, expiresAt } = signRefreshToken(userIdStr);

      // 4. Store Hashed Refresh Token
      await RefreshToken.create({
        user: createdUser._id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
        isRevoked: false,
      });

      return {
        user: {
          id: userIdStr,
          fullName: createdUser.fullName,
          email: createdUser.email,
          uid: createdUser.uid,
          role: createdUser.role,
          department: createdUser.department,
          isVerified: createdUser.isVerified,
          accountStatus: createdUser.accountStatus,
        },
        accessToken,
        refreshToken,
        expiresAt,
      };
    } catch (error) {
      // Rollback user if profile creation failed
      if (createdUser && createdUser._id) {
        await User.findByIdAndDelete(createdUser._id).catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Authenticate user with email/UID and password using Argon2id.
   * Returns generic failure message to mitigate user enumeration.
   */
  async login(
    input: LoginInput,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthResult> {
    const identifier = input.identifier.trim();

    // Query user by email (lowercased) or UID (uppercased)
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { uid: identifier.toUpperCase() }],
    });

    if (!user) {
      // Return generic failure to prevent account enumeration
      throw new AppError('Invalid email/UID or password.', 401);
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email/UID or password.', 401);
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw new AppError(
        user.suspensionReason
          ? `Account suspended: ${user.suspensionReason}`
          : 'Account has been suspended by university administration.',
        403
      );
    }

    if (user.accountStatus === 'DEACTIVATED') {
      throw new AppError('Account has been deactivated.', 403);
    }

    const userIdStr = user._id.toString();

    // 1. Generate Tokens
    const accessToken = signAccessToken({
      sub: userIdStr,
      email: user.email,
      role: user.role,
      uid: user.uid,
    });

    const { token: refreshToken, expiresAt } = signRefreshToken(userIdStr);

    // 2. Persist Hashed Refresh Token
    await RefreshToken.create({
      user: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      isRevoked: false,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    let profile: any = null;
    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'TEACHER') {
      profile = await TeacherProfile.findOne({ user: user._id });
    }

    return {
      user: {
        id: userIdStr,
        fullName: user.fullName,
        email: user.email,
        uid: user.uid,
        role: user.role,
        department: user.department,
        isVerified: user.isVerified,
        accountStatus: user.accountStatus,
        profile,
      },
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Rotate Refresh Token and generate a fresh Access Token.
   * Enforces token rotation: revokes the consumed refresh token.
   */
  async refresh(
    rawRefreshToken: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token. Please sign in again.', 401);
    }

    const oldTokenHash = hashToken(rawRefreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash: oldTokenHash });

    if (!storedToken) {
      throw new AppError('Refresh token session not found. Please sign in.', 401);
    }

    // Token reuse detection: if a revoked token is presented, suspect token theft
    if (storedToken.isRevoked) {
      logger.warn(`Potential token reuse detected for user ${storedToken.user}. Revoking all sessions.`);
      await RefreshToken.updateMany({ user: storedToken.user }, { $set: { isRevoked: true } });
      throw new AppError('Suspicious token activity detected. All sessions revoked. Please sign in again.', 401);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AppError('Refresh token has expired. Please sign in again.', 401);
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AppError('User account not found.', 401);
    }

    // 1. Revoke the consumed token (Rotation)
    storedToken.isRevoked = true;
    await storedToken.save();

    // 2. Issue new token pair
    const userIdStr = user._id.toString();
    const accessToken = signAccessToken({
      sub: userIdStr,
      email: user.email,
      role: user.role,
      uid: user.uid,
    });

    const { token: newRefreshToken, expiresAt } = signRefreshToken(userIdStr);

    // 3. Store new token
    await RefreshToken.create({
      user: user._id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt,
      isRevoked: false,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    let profile: any = null;
    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'TEACHER') {
      profile = await TeacherProfile.findOne({ user: user._id });
    }

    return {
      user: {
        id: userIdStr,
        fullName: user.fullName,
        email: user.email,
        uid: user.uid,
        role: user.role,
        department: user.department,
        isVerified: user.isVerified,
        accountStatus: user.accountStatus,
        profile,
      },
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    };
  }

  /**
   * Logout user by revoking the specific refresh token session.
   */
  async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.updateOne({ tokenHash }, { $set: { isRevoked: true } });
    }
  }

  /**
   * Retrieve safe user profile with linked Student or Teacher profile.
   */
  async getCurrentUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    let profile: any = null;
    if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ user: user._id });
    } else if (user.role === 'TEACHER') {
      profile = await TeacherProfile.findOne({ user: user._id });
    }

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      uid: user.uid,
      role: user.role,
      department: user.department,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      profile,
    };
  }
}

export const authService = new AuthService();
