/**
 * Basic personal information
 */
interface BasicInfo {
  name: string;
  phone: string;
  location: string;
  email: string;
  link: string;
}

/**
 * Work experience information
 */
interface ExperienceEntry {
  company: string;
  companyLocation: string;
  date: string;
  position: string;
  points: string[];
}

/**
 * Project information
 */
interface ProjectEntry {
  name: string;
  points: string[];
}

/**
 * Education information
 */
interface EducationEntry {
  institution: string;
  degree: string;
  date: string;
}

/**
 * Language skills information
 */
interface LanguageSkills {
  content: string;
}

/**
 * Technical skills information
 */
interface TechnicalSkills {
  content: string;
}

/**
 * Structured resume data
 */
export interface ResumeData {
  basicInfo: BasicInfo;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  languageSkills: LanguageSkills;
  technicalSkills: TechnicalSkills;
}

/**
 * Flattened data for template replacement
 * Generated from ResumeData
 */
export type FlattenedResumeData = Record<string, string>;
