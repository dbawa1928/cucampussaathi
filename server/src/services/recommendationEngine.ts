import { Types } from 'mongoose';
import { TeachingListingModel, ITeachingListing } from '../models/TeachingListing';
import { LearningGoalModel, ILearningGoal } from '../models/LearningGoal';
import { SkillConnectionModel } from '../models/SkillConnection';
import { type IUser } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { TeacherProfile } from '../models/TeacherProfile';

export interface MatchingWeights {
  skillMatch: number;      // 0.40
  expertiseMatch: number;  // 0.20
  modeMatch: number;       // 0.15
  languageMatch: number;   // 0.10
  scheduleMatch: number;   // 0.10
  roleRelevance: number;   // 0.05
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  skillMatch: 0.40,
  expertiseMatch: 0.20,
  modeMatch: 0.15,
  languageMatch: 0.10,
  scheduleMatch: 0.10,
  roleRelevance: 0.05,
};

export interface RecommendationResult {
  candidateUser: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    department: string;
    course?: string;
    semester?: number;
    designation?: string;
  };
  teachingListing?: any;
  learningGoal?: any;
  matchedSkillName: string;
  compatibilityScore: number; // 0 to 100
  isMutualExchange: boolean;
  mutualExchangeDetails?: {
    theyTeach: string;
    youTeach: string;
  };
  matchReasons: string[];
}

export class RecommendationEngine {
  private weights: MatchingWeights;

  constructor(weights: MatchingWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Calculate compatibility between a learner's goal and a teacher's listing.
   */
  calculateCompatibility(goal: ILearningGoal, listing: ITeachingListing, candidateUser: IUser): {
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];

    // 1. Skill Match (40%)
    if (goal.skill.toString() === listing.skill.toString() ||
        goal.skillName.toLowerCase() === listing.skillName.toLowerCase()) {
      score += this.weights.skillMatch * 100;
      reasons.push(`Teaches "${listing.skillName}", matching your learning goal`);
    }

    // 2. Expertise Suitability (20%)
    const expertiseRanks: Record<string, number> = {
      BEGINNER: 1,
      BASIC: 2,
      INTERMEDIATE: 3,
      ADVANCED: 4,
      EXPERT: 5,
    };

    const teacherLevel = expertiseRanks[listing.expertiseLevel] || 3;
    const targetLevel = expertiseRanks[goal.targetLevel] || 3;

    if (teacherLevel >= targetLevel) {
      score += this.weights.expertiseMatch * 100;
      reasons.push(`${listing.expertiseLevel} expertise matches or exceeds your target level`);
    } else if (teacherLevel >= (expertiseRanks[goal.currentLevel] || 1)) {
      score += this.weights.expertiseMatch * 60;
      reasons.push(`${listing.expertiseLevel} expertise helps you advance beyond current level`);
    }

    // 3. Learning / Teaching Mode (15%)
    if (goal.preferredMode === 'BOTH' || listing.teachingMode === 'BOTH' || goal.preferredMode === listing.teachingMode) {
      score += this.weights.modeMatch * 100;
      const matchedMode = goal.preferredMode === listing.teachingMode ? goal.preferredMode : 'Flexible (Online / Offline)';
      reasons.push(`Compatible mode: ${matchedMode}`);
    } else {
      score += this.weights.modeMatch * 20;
    }

    // 4. Language Compatibility (10%)
    const goalLangs = (goal.preferredLanguages || []).map((l) => l.toLowerCase());
    const listingLangs = (listing.languages || []).map((l) => l.toLowerCase());
    const commonLangs = goalLangs.filter((l) => listingLangs.includes(l));

    if (commonLangs.length > 0) {
      score += this.weights.languageMatch * 100;
      reasons.push(`Shared communication language: ${commonLangs.join(', ')}`);
    } else if (goalLangs.length === 0 || listingLangs.length === 0) {
      score += this.weights.languageMatch * 80;
    }

    // 5. Schedule Compatibility (10%)
    const goalDays = (goal.availableDays || []).map((d) => d.toLowerCase());
    const listingDays = (listing.availability?.days || []).map((d) => d.toLowerCase());
    const commonDays = goalDays.filter((d) => listingDays.includes(d));

    if (commonDays.length > 0) {
      score += this.weights.scheduleMatch * 100;
      reasons.push(`Overlapping available days (${commonDays.slice(0, 2).join(', ')})`);
    } else if (goalDays.length === 0 || listingDays.length === 0) {
      score += this.weights.scheduleMatch * 50;
    }

    // 6. Role Relevance (5%)
    if (candidateUser.role === 'TEACHER') {
      score += this.weights.roleRelevance * 100;
      reasons.push(`Faculty mentor in ${candidateUser.department}`);
    } else {
      score += this.weights.roleRelevance * 85;
      reasons.push(`Peer campus learner in ${candidateUser.department}`);
    }

    return {
      score: Math.min(100, Math.round(score)),
      reasons,
    };
  }

  /**
   * Generate intelligent recommendations for an active user.
   */
  async getRecommendationsForUser(userId: string, limit = 10): Promise<RecommendationResult[]> {
    const userObjectId = new Types.ObjectId(userId);

    // Fetch user's active goals and listings
    const [userGoals, userListings, existingConnections] = await Promise.all([
      LearningGoalModel.find({ user: userObjectId, status: 'ACTIVE' }),
      TeachingListingModel.find({ user: userObjectId, status: 'ACTIVE' }),
      SkillConnectionModel.find({
        $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        status: { $in: ['PENDING', 'ACCEPTED'] },
      }),
    ]);

    // Track users who already have active connections or pending requests
    const excludedUserIds = new Set<string>();
    excludedUserIds.add(userId);
    existingConnections.forEach((conn) => {
      excludedUserIds.add(conn.sender.toString());
      excludedUserIds.add(conn.receiver.toString());
    });

    const recommendationsMap = new Map<string, RecommendationResult>();

    // 1. MATCH USER'S LEARNING GOALS TO OTHERS' TEACHING LISTINGS
    for (const goal of userGoals) {
      const candidateListings = await TeachingListingModel.find({
        user: { $nin: Array.from(excludedUserIds).map((id) => new Types.ObjectId(id)) },
        skill: goal.skill,
        status: 'ACTIVE',
      }).populate('user');

      for (const listing of candidateListings) {
        const candidateUser = listing.user as any as IUser;
        if (!candidateUser || candidateUser.accountStatus === 'SUSPENDED') continue;

        const candidateUserId = candidateUser._id.toString();
        const { score, reasons } = this.calculateCompatibility(goal, listing, candidateUser);

        // Check if mutual exchange exists: Can User teach something candidate wants to learn?
        let isMutualExchange = false;
        let mutualDetails: any = undefined;

        const candidateGoals = await LearningGoalModel.find({
          user: candidateUser._id,
          status: 'ACTIVE',
        });

        for (const cGoal of candidateGoals) {
          const matchedMyListing = userListings.find(
            (myList) => myList.skill.toString() === cGoal.skill.toString()
          );
          if (matchedMyListing) {
            isMutualExchange = true;
            mutualDetails = {
              theyTeach: listing.skillName,
              youTeach: matchedMyListing.skillName,
            };
            reasons.unshift(
              `✨ Mutual Skill-Exchange Opportunity: They teach "${listing.skillName}" and want to learn "${matchedMyListing.skillName}" from you!`
            );
            break;
          }
        }

        const finalScore = isMutualExchange ? Math.min(100, score + 15) : score;

        // Fetch candidate's profile context
        let course: string | undefined;
        let semester: number | undefined;
        let designation: string | undefined;

        if (candidateUser.role === 'STUDENT') {
          const sp = await StudentProfile.findOne({ user: candidateUser._id });
          course = sp?.course;
          semester = sp?.semester;
        } else if (candidateUser.role === 'TEACHER') {
          const tp = await TeacherProfile.findOne({ user: candidateUser._id });
          designation = tp?.designation;
        }

        const result: RecommendationResult = {
          candidateUser: {
            _id: candidateUserId,
            fullName: candidateUser.fullName,
            email: candidateUser.email,
            role: candidateUser.role,
            department: candidateUser.department,
            course,
            semester,
            designation,
          },
          teachingListing: listing,
          learningGoal: goal,
          matchedSkillName: listing.skillName,
          compatibilityScore: finalScore,
          isMutualExchange,
          mutualExchangeDetails: mutualDetails,
          matchReasons: reasons,
        };

        const existing = recommendationsMap.get(candidateUserId);
        if (!existing || result.compatibilityScore > existing.compatibilityScore) {
          recommendationsMap.set(candidateUserId, result);
        }
      }
    }

    // Sort by compatibility score descending
    const sorted = Array.from(recommendationsMap.values()).sort(
      (a, b) => b.compatibilityScore - a.compatibilityScore
    );

    return sorted.slice(0, limit);
  }
}

export const recommendationEngine = new RecommendationEngine();
