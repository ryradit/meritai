
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp, DocumentData, FieldValue, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type UserRole = "talent" | "recruiter";

export type TalentStatus =
  "new" |
  "profile_submitted" |
  "interview_invited" |
  "interview_completed_processing_summary" | // Intermediate status
  "report_ready" | // Report generated, tiering applied
  "profile_fully_completed"; // After completing the second part of the profile

export type TalentTier =
  "priority" | // 90%+
  "verified" | // 85-89%
  "manual_review" | // 80-84%
  "re_interview_eligible" | // < 80%
  "rejected"; // Could be set by a recruiter or after failed re-interview

export interface InterviewExperience {
  title: string;
  company: string;
  dates: string;
  description: string;
}

export interface InterviewEducation {
  degree: string;
  institution: string;
  dates: string;
  description: string;
}

export interface InterviewQuestions {
  behaviouralQuestions: string[];
  situationalQuestions: string[];
  technicalQuestions: string[];
}

export interface UserProfileData {
  uid: string;
  email: string | null;
  role: UserRole; // This will be set based on the collection
  fullName?: string;
  headline?: string;
  professionalSummary?: string;
  country?: string;
  timezone?: string;
  yearsOfExperience?: number;
  techStack?: string; // Comma-separated string
  linkedin?: string;
  github?: string;
  cvFileName?: string;
  cvAnalysisSummary?: string;
  cvSkills?: string[];
  cvExperience?: InterviewExperience[];
  cvEducation?: InterviewEducation[];
  cvDownloadUrl?: string;
  expectedMonthlyRateGBP?: number;
  availability?: string;
  talentStatus?: TalentStatus; // Specific to talents
  interviewQuestions?: InterviewQuestions; // Specific to talents
  interviewReportSummary?: string; // Specific to talents
  weightedTotalScore?: number; // Specific to talents
  talentTier?: TalentTier; // Specific to talents
  nextInterviewEligibleDate?: string; // Specific to talents
  createdAt: string;
  updatedAt: string;

  // Fields for full profile completion (placeholders for now, mostly for talents)
  profilePhotoUrl?: string;
  shortBio?: string;
  preferredContractType?: "Full-time" | "Part-time" | "Contract/Freelance";
  weeklyAvailability?: "<10hrs" | "10-20hrs" | "20-30hrs" | "30-40hrs" | "40+hrs";
  portfolioLinks?: {
    behance?: string;
    dribbble?: string;
    personalSite?: string;
    other?: string;
  };
  // Recruiter specific fields can be added here if needed in the future
  companyName?: string; // Example for recruiter
}


export async function createUserDocument(uid: string, email: string | null, role: UserRole, fullName?: string): Promise<void> {
  const collectionName = role === 'talent' ? 'talents' : 'recruiters';
  const userRef = doc(db, collectionName, uid);

  const userDataPayload: Partial<UserProfileData> & { createdAt: FieldValue, updatedAt: FieldValue, role: UserRole } = {
    uid,
    email,
    role, // Store the role in the document as well for clarity
    fullName: fullName || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (role === 'talent') {
    userDataPayload.talentStatus = 'new';
  }

  try {
    await setDoc(userRef, userDataPayload);
  } catch (error) {
    console.error(`Error creating user document in ${collectionName}: `, error);
    throw error;
  }
}

const convertTimestampToString = (timestamp: any): string => {
  if (!timestamp) return new Date(0).toISOString(); // Fallback to epoch if no timestamp
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch { /* ignore */ }
  }
  console.warn("Failed to convert timestamp, returning epoch as fallback:", timestamp);
  return new Date(0).toISOString();
};

// Fetches user profile, trying 'talents' then 'recruiters' collection.
// The 'role' field within the returned UserProfileData will indicate the type.
export async function getUserDocument(uid: string): Promise<UserProfileData | null> {
  if (!uid) return null;

  const processDocSnap = (docSnap: DocumentData, role: UserRole): UserProfileData => {
    const data = docSnap.data() as DocumentData;
    return {
      uid: data.uid,
      email: data.email || null,
      role: role, // Set role based on where it was found
      fullName: data.fullName,
      headline: data.headline,
      professionalSummary: data.professionalSummary,
      country: data.country,
      timezone: data.timezone,
      yearsOfExperience: data.yearsOfExperience,
      techStack: data.techStack,
      linkedin: data.linkedin,
      github: data.github,
      cvFileName: data.cvFileName,
      cvAnalysisSummary: data.cvAnalysisSummary,
      cvSkills: data.cvSkills,
      cvExperience: data.cvExperience,
      cvEducation: data.cvEducation,
      cvDownloadUrl: data.cvDownloadUrl,
      expectedMonthlyRateGBP: data.expectedMonthlyRateGBP,
      availability: data.availability,
      talentStatus: data.talentStatus,
      interviewQuestions: data.interviewQuestions,
      interviewReportSummary: data.interviewReportSummary,
      weightedTotalScore: data.weightedTotalScore,
      talentTier: data.talentTier,
      nextInterviewEligibleDate: data.nextInterviewEligibleDate,
      createdAt: convertTimestampToString(data.createdAt),
      updatedAt: convertTimestampToString(data.updatedAt),
      profilePhotoUrl: data.profilePhotoUrl,
      shortBio: data.shortBio,
      preferredContractType: data.preferredContractType,
      weeklyAvailability: data.weeklyAvailability,
      portfolioLinks: data.portfolioLinks,
      companyName: data.companyName, // Example recruiter field
    };
  };

  try {
    const talentRef = doc(db, 'talents', uid);
    const talentDocSnap = await getDoc(talentRef);
    if (talentDocSnap.exists()) {
      return processDocSnap(talentDocSnap, 'talent');
    }

    const recruiterRef = doc(db, 'recruiters', uid);
    const recruiterDocSnap = await getDoc(recruiterRef);
    if (recruiterDocSnap.exists()) {
      return processDocSnap(recruiterDocSnap, 'recruiter');
    }

    console.log("No such user document in 'talents' or 'recruiters' for UID:", uid);
    return null;
  } catch (error) {
    console.error("Error getting user document for UID", uid, ":", error);
    return null;
  }
}

export async function updateUserDocument(uid: string, role: UserRole, data: Partial<Omit<UserProfileData, 'uid' | 'email' | 'createdAt'>>): Promise<void> {
  if (!uid) throw new Error("UID is required to update user document.");
  if (!role) throw new Error("Role is required to determine collection for update.");

  const collectionName = role === 'talent' ? 'talents' : 'recruiters';
  const userRef = doc(db, collectionName, uid);

  try {
    const updatePayload: { [key: string]: any } = { ...data };
    updatePayload.updatedAt = serverTimestamp();
    // Ensure the role field itself is not accidentally overwritten if it's part of `data` unless intended
    if (data.role && data.role !== role) {
        console.warn(`Attempting to change role during update for UID ${uid}. This is generally not advised through this function.`);
    }
    updatePayload.role = role; // Re-affirm role or set it if data didn't have it

    await updateDoc(userRef, updatePayload);
  } catch (error) {
    console.error(`Error updating user document in ${collectionName}: `, error);
    throw error;
  }
}

// Fetches talent profiles for the marketplace from the 'talents' collection
export async function getListedTalentProfiles(): Promise<UserProfileData[]> {
  const talentsRef = collection(db, 'talents');
  // Simplified query to fetch all talents (up to a limit)
  const q = query(talentsRef, limit(20));

  const talentProfiles: UserProfileData[] = [];
  try {
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as DocumentData;
      talentProfiles.push({
        uid: data.uid,
        email: data.email || null,
        role: 'talent', // Explicitly set role as talent for these profiles
        fullName: data.fullName,
        headline: data.headline,
        professionalSummary: data.professionalSummary,
        country: data.country,
        timezone: data.timezone,
        yearsOfExperience: data.yearsOfExperience,
        techStack: data.techStack,
        linkedin: data.linkedin,
        github: data.github,
        cvFileName: data.cvFileName,
        cvAnalysisSummary: data.cvAnalysisSummary,
        cvSkills: data.cvSkills,
        cvExperience: data.cvExperience,
        cvEducation: data.cvEducation,
        cvDownloadUrl: data.cvDownloadUrl,
        expectedMonthlyRateGBP: data.expectedMonthlyRateGBP,
        availability: data.availability,
        talentStatus: data.talentStatus,
        interviewQuestions: data.interviewQuestions,
        interviewReportSummary: data.interviewReportSummary,
        weightedTotalScore: data.weightedTotalScore,
        talentTier: data.talentTier,
        nextInterviewEligibleDate: data.nextInterviewEligibleDate,
        createdAt: convertTimestampToString(data.createdAt),
        updatedAt: convertTimestampToString(data.updatedAt),
        profilePhotoUrl: data.profilePhotoUrl,
        shortBio: data.shortBio,
        preferredContractType: data.preferredContractType,
        weeklyAvailability: data.weeklyAvailability,
        portfolioLinks: data.portfolioLinks,
      });
    });
  } catch (error) {
    console.error("Error fetching listed talent profiles from 'talents' collection: ", error);
    throw error;
  }
  return talentProfiles;
}

// Function to get a single talent's profile, e.g., for profile view page
export async function getTalentDocument(talentId: string): Promise<UserProfileData | null> {
  if (!talentId) return null;
  const talentRef = doc(db, 'talents', talentId);
  try {
    const docSnap = await getDoc(talentRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as DocumentData;
      return {
        uid: data.uid,
        email: data.email || null,
        role: 'talent', // Explicitly talent
        fullName: data.fullName,
        headline: data.headline,
        professionalSummary: data.professionalSummary,
        country: data.country,
        timezone: data.timezone,
        yearsOfExperience: data.yearsOfExperience,
        techStack: data.techStack,
        linkedin: data.linkedin,
        github: data.github,
        cvFileName: data.cvFileName,
        cvAnalysisSummary: data.cvAnalysisSummary,
        cvSkills: data.cvSkills,
        cvExperience: data.cvExperience,
        cvEducation: data.cvEducation,
        cvDownloadUrl: data.cvDownloadUrl,
        expectedMonthlyRateGBP: data.expectedMonthlyRateGBP,
        availability: data.availability,
        talentStatus: data.talentStatus,
        interviewQuestions: data.interviewQuestions,
        interviewReportSummary: data.interviewReportSummary,
        weightedTotalScore: data.weightedTotalScore,
        talentTier: data.talentTier,
        nextInterviewEligibleDate: data.nextInterviewEligibleDate,
        createdAt: convertTimestampToString(data.createdAt),
        updatedAt: convertTimestampToString(data.updatedAt),
        profilePhotoUrl: data.profilePhotoUrl,
        shortBio: data.shortBio,
        preferredContractType: data.preferredContractType,
        weeklyAvailability: data.weeklyAvailability,
        portfolioLinks: data.portfolioLinks,
      };
    }
    console.log("No such talent document for ID:", talentId);
    return null;
  } catch (error) {
    console.error("Error getting talent document for ID", talentId, ":", error);
    return null;
  }
}
