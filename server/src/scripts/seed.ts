import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { TeacherProfile } from '../models/TeacherProfile';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface SeedAccount {
  fullName: string;
  email: string;
  uid: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  department: string;
  profileData?: {
    course?: string;
    semester?: number;
    skills?: string[];
    designation?: string;
    officeLocation?: string;
    researchDomains?: string[];
  };
}

const SEED_ACCOUNTS: SeedAccount[] = [
  {
    fullName: 'Deepak (Student Lead)',
    email: '24bcs10812@cuchd.in',
    uid: '24BCS10812',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    profileData: {
      course: 'B.Tech CSE',
      semester: 6,
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'Tailwind CSS'],
    },
  },
  {
    fullName: 'Riya Garg (Faculty Mentor)',
    email: '24bai70494@cuchd.in',
    uid: '24BAI70494',
    role: 'TEACHER',
    department: 'Artificial Intelligence & ML',
    profileData: {
      designation: 'Associate Professor',
      officeLocation: 'Cabin 402, Academic Block 3',
      researchDomains: ['Deep Learning', 'Computer Vision', 'Generative AI'],
    },
  },
  {
    fullName: 'Deepak Bawa (System Administrator)',
    email: 'deepakbawa0004@gmail.com',
    uid: 'ADMIN001',
    role: 'ADMIN',
    department: 'University Administration',
  },
];

export async function runSeed(): Promise<void> {
  const seedPassword = env.SEED_DEFAULT_PASSWORD;

  if (!seedPassword || seedPassword.length < 8) {
    throw new Error('SEED_DEFAULT_PASSWORD environment variable must be set with at least 8 characters.');
  }

  logger.info('Starting idempotent database seeding...');
  await connectDatabase();

  const passwordHash = await hashPassword(seedPassword);

  for (const account of SEED_ACCOUNTS) {
    const existing = await User.findOne({
      $or: [{ email: account.email }, { uid: account.uid }],
    });

    if (existing) {
      logger.info(`Account already exists: ${account.email} (${existing.role}) - Skipped (Idempotent).`);
      continue;
    }

    // Create User
    const user = await User.create({
      fullName: account.fullName,
      email: account.email,
      uid: account.uid,
      passwordHash,
      role: account.role,
      department: account.department,
      isVerified: true, // Seeded institutional demo accounts start verified
    });

    logger.info(`Created user account: ${user.email} as [${user.role}] with UID: ${user.uid}`);

    // Create Associated Profile
    if (account.role === 'STUDENT' && account.profileData) {
      await StudentProfile.create({
        user: user._id,
        course: account.profileData.course || 'B.Tech',
        semester: account.profileData.semester || 1,
        skills: account.profileData.skills || [],
        privacyLevel: 'CAMPUS_ONLY',
      });
      logger.info(`Created StudentProfile for ${user.email}.`);
    } else if (account.role === 'TEACHER' && account.profileData) {
      await TeacherProfile.create({
        user: user._id,
        designation: account.profileData.designation || 'Faculty Member',
        department: account.department,
        officeLocation: account.profileData.officeLocation || 'Main Block',
        researchDomains: account.profileData.researchDomains || [],
        isAcceptingBookings: true,
      });
      logger.info(`Created TeacherProfile for ${user.email}.`);
    }
  }

  logger.info('Seeding routine completed successfully.');
}

// Allow direct CLI execution: tsx src/scripts/seed.ts
if (require.main === module) {
  runSeed()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Seeding error', err);
      await disconnectDatabase();
      process.exit(1);
    });
}
