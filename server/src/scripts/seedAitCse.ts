import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { TeacherProfile } from '../models/TeacherProfile';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { hashPassword } from '../utils/password';
import { logger } from '../utils/logger';

interface StudentData {
  email: string;
  uid: string;
  fullName: string;
}

interface TeacherData {
  email: string;
  uid: string;
  fullName: string;
}

const STUDENTS_LIST: StudentData[] = [
  { email: '24bai70497@cuchd.in', uid: '24BAI70497', fullName: 'Jasmeen Kaur' },
  { email: '24bai70496@cuchd.in', uid: '24BAI70496', fullName: 'Radhika' },
  { email: '24bai70494@cuchd.in', uid: '24BAI70494', fullName: 'Riya' },
  { email: '24bai70493@cuchd.in', uid: '24BAI70493', fullName: 'Swara' },
  { email: '24bai70498@cuchd.in', uid: '24BAI70498', fullName: 'Pushpita' },
  { email: '24bai70499@cuchd.in', uid: '24BAI70499', fullName: 'Darvesh' },
  { email: '24bai70488@cuchd.in', uid: '24BAI70488', fullName: 'Purtika' },
  { email: '24bai70492@cuchd.in', uid: '24BAI70492', fullName: 'Ankita' },
  { email: '24bai70489@cuchd.in', uid: '24BAI70489', fullName: 'Krishanjot' },
  { email: '24bai70487@cuchd.in', uid: '24BAI70487', fullName: 'Tushar' },
  { email: '24bai70478@cuchd.in', uid: '24BAI70478', fullName: 'Stuti' },
  { email: '24bai70477@cuchd.in', uid: '24BAI70477', fullName: 'Kulbir' },
  { email: '24bai70453@cuchd.in', uid: '24BAI70453', fullName: 'Nazra' },
  { email: '24bai70454@cuchd.in', uid: '24BAI70454', fullName: 'Preet' },
  { email: '24bai70455@cuchd.in', uid: '24BAI70455', fullName: 'Khushi' },
  { email: '24bai70483@cuchd.in', uid: '24BAI70483', fullName: 'Bhanu' },
  { email: '24bai70472@cuchd.in', uid: '24BAI70472', fullName: 'Mahi' },
  { email: '24bai70502@cuchd.in', uid: '24BAI70502', fullName: 'Saksham' },
  { email: '24bai70513@cuchd.in', uid: '24BAI70513', fullName: 'Samriddhi' },
  { email: '24bai70297@cuchd.in', uid: '24BAI70297', fullName: 'Ayush' },
  { email: '24bai70043@cuchd.in', uid: '24BAI70043', fullName: 'Abhinav' },
  { email: '24bai70449@cuchd.in', uid: '24BAI70449', fullName: 'Tannmay' },
  { email: '24bai70514@cuchd.in', uid: '24BAI70514', fullName: 'Jatin' },
  { email: '24bcs10812@cuchd.in', uid: '24BCS10812', fullName: 'Deepak' },
];

const TEACHERS_LIST: TeacherData[] = [
  { email: 'riyagargofficial@gmail.com', uid: 'FAC_RIYAGARG', fullName: 'Riya Garg' },
  { email: 'jassmeenkaur108@gmail.com', uid: 'FAC_JASSMEEN', fullName: 'Jasmeen Kaur' },
  { email: 'tanmaybhardwaj@gmail.com', uid: 'FAC_TANMAY', fullName: 'Tanmay Bhardwaj' },
];

export async function seedAitCse(): Promise<void> {
  logger.info('Connecting to MongoDB Atlas to seed AIT CSE department users...');
  await connectDatabase();

  const studentPasswordHash = await hashPassword('Student123');
  const teacherPasswordHash = await hashPassword('Teacher123');

  logger.info('Argon2id hashes computed for Student123 and Teacher123.');

  // 1. Seed Students
  logger.info(`--- Seeding ${STUDENTS_LIST.length} Students (Semester 5, AIT CSE) ---`);
  for (const st of STUDENTS_LIST) {
    const email = st.email.toLowerCase();
    const uid = st.uid.toUpperCase();

    let user = await User.findOne({
      $or: [{ email }, { uid }],
    });

    if (user) {
      user.fullName = st.fullName;
      user.email = email;
      user.uid = uid;
      user.passwordHash = studentPasswordHash;
      user.role = 'STUDENT';
      user.department = 'AIT CSE';
      user.isVerified = true;
      user.accountStatus = 'ACTIVE';
      await user.save();
      logger.info(`Updated Student User: ${email} (${uid})`);
    } else {
      user = await User.create({
        fullName: st.fullName,
        email,
        uid,
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        department: 'AIT CSE',
        isVerified: true,
        accountStatus: 'ACTIVE',
      });
      logger.info(`Created Student User: ${email} (${uid})`);
    }

    // Upsert StudentProfile
    await StudentProfile.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        course: 'B.Tech CSE',
        semester: 5,
        skills: ['Artificial Intelligence', 'Python', 'Data Structures & Algorithms', 'Web Development'],
        privacyLevel: 'CAMPUS_ONLY',
      },
      { upsert: true, new: true }
    );
  }

  // 2. Seed Teachers
  logger.info(`--- Seeding ${TEACHERS_LIST.length} Teachers (AIT CSE) ---`);
  for (const tc of TEACHERS_LIST) {
    const email = tc.email.toLowerCase();
    const uid = tc.uid.toUpperCase();

    let user = await User.findOne({
      $or: [{ email }, { uid }],
    });

    if (user) {
      user.fullName = tc.fullName;
      user.email = email;
      user.uid = uid;
      user.passwordHash = teacherPasswordHash;
      user.role = 'TEACHER';
      user.department = 'AIT CSE';
      user.isVerified = true;
      user.accountStatus = 'ACTIVE';
      await user.save();
      logger.info(`Updated Teacher User: ${email} (${uid})`);
    } else {
      user = await User.create({
        fullName: tc.fullName,
        email,
        uid,
        passwordHash: teacherPasswordHash,
        role: 'TEACHER',
        department: 'AIT CSE',
        isVerified: true,
        accountStatus: 'ACTIVE',
      });
      logger.info(`Created Teacher User: ${email} (${uid})`);
    }

    // Upsert TeacherProfile
    const teacherProfile = await TeacherProfile.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        designation: 'Assistant Professor',
        department: 'AIT CSE',
        officeLocation: 'Academic Block A2, Room 302',
        campusBlock: 'A2',
        roomNumber: '302',
        officeHours: 'Monday to Friday: 10:00 AM - 4:00 PM',
        qualification: 'M.Tech, Ph.D (Pursuing)',
        specialization: 'Artificial Intelligence & Machine Learning',
        teachingSubjects: ['Machine Learning', 'Artificial Intelligence', 'Operating Systems', 'Data Science'],
        researchDomains: ['Artificial Intelligence', 'Machine Learning', 'Computer Vision'],
        weekendAvailability: false,
        bookingPreference: 'Direct Consultation',
        maxDailySlots: 8,
        isAcceptingBookings: true,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Create 2 demo slots for next days if not present
    const now = new Date();
    for (let dayOffset = 1; dayOffset <= 2; dayOffset++) {
      const start = new Date(now);
      start.setDate(start.getDate() + dayOffset);
      start.setHours(10, 0, 0, 0);

      const end = new Date(start);
      end.setHours(11, 0, 0, 0);

      const existingSlot = await AvailabilitySlot.findOne({
        teacherProfile: teacherProfile._id,
        startTime: start,
      });

      if (!existingSlot) {
        await AvailabilitySlot.create({
          teacherProfile: teacherProfile._id,
          startTime: start,
          endTime: end,
          durationMinutes: 60,
          locationType: 'CABIN',
          locationDetails: 'Academic Block A2, Room 302',
          isBooked: false,
          status: 'AVAILABLE',
        });
      }
    }
  }

  logger.info('--- Seeding Completed Successfully! ---');
  await disconnectDatabase();
}

// Execute directly if run via CLI
if (require.main === module) {
  seedAitCse()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
