interface BasicInfo {
  name: string;
  phone: string;
  location: string;
  email: string;
  link: string;
}

// Experience entry
interface ExperienceEntry {
  company: string;
  companyLocation: string;
  date: string;
  position: string;
  points: string[];
}

// Project entry
interface ProjectEntry {
  name: string;
  points: string[];
}

// Education entry
interface EducationEntry {
  institution: string;
  degree: string;
  date: string;
}

// Skills
interface Skills {
  languages: string;
  technical: string;
}

// Complete resume data structure
export interface StructuredResumeData {
  basicInfo: BasicInfo;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  skills: Skills;
}
