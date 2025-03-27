import type { ResumeData } from "../types.ts";

// sampleResumeData
// sampleResumeData_minimal
// sampleResumeData_experienceOnly
// sampleResumeData_noProjects
// sampleResumeData_full

export const sampleResumeData: ResumeData = {
  // Basic Information
  basicInfo: {
    name: "Yu Mabuchi",
    phone: "080-4960-9492",
    location: "Tokyo, Japan",
    email: "yumabuchi1998@gmail.com",
    link: "www.linkedin.com/in/new-marty/",
  },

  // Experience as an array of entries
  experience: [
    {
      company: "Slalom, Inc.",
      companyLocation: "Tokyo, Japan",
      date: "Apr. 2023 - Present",
      position: "Software Engineer, Fullstack",
      points: [
        "Employed **Jenkins** for CI/CD and **Terraform** for IaC to streamline development and deployment processes.",
        "Contributed to the development of a **React** and **Node.js**-based client project, focusing on code refactoring to enhance best practices and improve performance.",
        "Led the creation of the Admin UI from scratch, including frontend, backend, UI/UX design, and close collaboration with the product owner.",
        "Demonstrated exceptional communication skills by collaborating closely with UI/UX designers to ensure an intuitive user experience.",
        "Utilized **Supertest**, **Jest**, **PostgreSQL**, **AWS**, and **Playwright** to ensure a robust and well-tested system.",
      ],
    },
    {
      company: "Recruit, Inc.",
      companyLocation: "Tokyo, Japan",
      date: "Nov. 2022 - Dec. 2022",
      position: "Software Engineer Intern, Backend",
      points: [
        "Worked on a backend project called ZAM, a stock management system that runs on AWS for Jalan, the No. 1 hotel booking website in Japan with 27 million yearly viewers.",
        "Utilized **Kotlin, Spring Boot, MyBatis, and MySQL** to add photo URLs to XML responses for Google Hotel Ads and participated in code refactoring efforts.",
      ],
    },
    {
      company: "Rakuten, Inc.",
      companyLocation: "Tokyo, Japan",
      date: "Oct. 2022 - Nov. 2022",
      position:
        "Software Engineer/Project Manager Intern, Cloud/Infrastructure",
      points: [
        "Worked on a security scan project that performed daily scans of approximately 10,000 containers running inside Rakuten to match them with vulnerability information.",
        "Utilized **Python, shell script, Kubernetes, Chef.io, Terraform, Dependency Track, MongoDB, and anchore/syft** in the development and management of this project.",
        "Showcased strong project management skills, receiving great feedback from mentors on ability to effectively plan and execute complex projects.",
      ],
    },
    {
      company: "Meetsmore Inc.",
      companyLocation: "Tokyo, Japan",
      date: "Oct. 2020 - Sep. 2022",
      position: "Software Engineer Intern, Fullstack",
      points: [
        "Worked on Meetsmore's web and mobile applications as part of a team of 25 engineers. Codebase size is approximately 700,000 lines in 4,500 files.",
        "Implemented the UI for the Meetsmore iOS App using **TypeScript, Expo (React Native), and Redux**, resulting in increase in user engagement.",
        "Developed native login functionality and integrated with backend API and 3rd party services (e.g Google). Wrote unit tests using jest.",
        "Worked on the Meetsmore Web App, responsible for implementing designs, developing new features, and creating admin tools.",
        "Utilized **TypeScript, React, Redux, node.js, nest.js, jest, and mongoDB**",
      ],
    },
  ],

  // Projects as an array
  projects: [
    {
      name: "Personal Portfolio Website",
      points: [
        "Designed and developed a responsive personal portfolio website using React, Next.js, and Tailwind CSS",
        "Implemented a contact form with email notification using Nodemailer",
      ],
    },
    {
      name: "Open Source Contribution - React Component Library",
      points: [
        "Contributed to a popular open-source React component library",
        "Fixed accessibility issues and improved component documentation",
      ],
    },
  ],

  // Education as an array
  education: [
    {
      institution: "Arizona State University",
      degree: "Master of Computer Science",
      date: "May 2022 - Dec. 2024",
    },
    {
      institution: "Keio University",
      degree: "Bachelor of Engineering in Information and Computer Science",
      date: "Apr. 2018 - Mar. 2022",
    },
  ],

  // Skills
  languageSkills: {
    content:
      "English: Native level, TOEIC L&R score of 970 points | Japanese: Native",
  },
  technicalSkills: {
    content:
      "TypeScript | React | React Native | Redux | node.js | nest.js | jest | mongoDB | Python | MySQL | AWS | PostgreSQL",
  },
};

export const sampleResumeData_minimal: ResumeData = {
  basicInfo: {
    name: "sampleResumeData_minimal",
    phone: "000-1111-2222",
    location: "Nowhere, Earth",
    email: "minimal@example.com",
    link: "www.linkedin.com/in/minimal-person/",
  },
  // No experience
  experience: [],
  // No projects
  projects: [],
  // No education
  education: [],
  // Minimal skills
  languageSkills: {
    content: "English: Conversational",
  },
  technicalSkills: {
    content: "HTML | CSS",
  },
};

export const sampleResumeData_experienceOnly: ResumeData = {
  basicInfo: {
    name: "sampleResumeData_experienceOnly",
    phone: "090-1234-5678",
    location: "Tokyo, Japan",
    email: "alice@example.com",
    link: "www.linkedin.com/in/alice-exp/",
  },
  // Two experiences
  experience: [
    {
      company: "Experience Corp.",
      companyLocation: "Tokyo, Japan",
      date: "Jan. 2022 - Present",
      position: "Fullstack Developer",
      points: [
        "Developed a REST API using **Node.js** and integrated with a React frontend.",
        "Implemented CI/CD using **GitHub Actions**.",
        "Led a small team of 3 junior developers to deliver new features on time.",
      ],
    },
    {
      company: "Coding Inc.",
      companyLocation: "Osaka, Japan",
      date: "Apr. 2020 - Dec. 2021",
      position: "Backend Engineer",
      points: [
        "Built microservices architecture with **Docker** and **Kubernetes**.",
        "Used **MySQL** for data storage and optimized queries for performance.",
      ],
    },
  ],
  // No projects
  projects: [],
  // No education
  education: [],
  // Basic skills
  languageSkills: {
    content: "English: Fluent | Japanese: Intermediate",
  },
  technicalSkills: {
    content: "Node.js | React | Docker | MySQL",
  },
};

export const sampleResumeData_noProjects: ResumeData = {
  basicInfo: {
    name: "sampleResumeData_noProjects",
    phone: "070-9999-8888",
    location: "Nagoya, Japan",
    email: "bob.noprojects@example.com",
    link: "www.linkedin.com/in/bob-noprojects/",
  },
  // Three experiences
  experience: [
    {
      company: "Alpha Systems",
      companyLocation: "Nagoya, Japan",
      date: "Mar. 2021 - Present",
      position: "Frontend Developer",
      points: [
        "Migrated old **Vue.js** codebase to the latest version, enhancing performance.",
        "Implemented **TypeScript** for better maintainability and catching bugs early.",
        "Collaborated with designers to improve UI/UX consistency.",
      ],
    },
    {
      company: "Global Tech",
      companyLocation: "Tokyo, Japan",
      date: "Jan. 2020 - Feb. 2021",
      position: "Junior Engineer",
      points: [
        "Maintained internal **Express.js** services handling user authentication.",
        "Worked on integration tests using **Mocha** and Chai.",
      ],
    },
    {
      company: "Startup X",
      companyLocation: "Remote",
      date: "Jun. 2018 - Dec. 2019",
      position: "Intern Developer",
      points: [
        "Built proof-of-concept features with **React Native** for mobile apps.",
        "Learned agile development processes and participated in daily scrums.",
      ],
    },
  ],
  // No projects
  projects: [],
  // Education
  education: [
    {
      institution: "Nagoya Institute of Technology",
      degree: "Bachelor of Science in Computer Engineering",
      date: "Apr. 2014 - Mar. 2018",
    },
    {
      institution: "XYZ Coding Bootcamp",
      degree: "Fullstack Web Development Certificate",
      date: "Jan. 2019 - Mar. 2019",
    },
  ],
  // Skills
  languageSkills: {
    content: "English: Business",
  },
  technicalSkills: {
    content: "Vue.js | React Native | TypeScript | Express.js | Mocha",
  },
};

export const sampleResumeData_full: ResumeData = {
  basicInfo: {
    name: "sampleResumeData_full",
    phone: "080-1234-5678",
    location: "Fukuoka, Japan",
    email: "charlie.full@example.com",
    link: "www.linkedin.com/in/charlie-full/",
  },
  experience: [
    {
      company: "Fullstack Innovations",
      companyLocation: "Fukuoka, Japan",
      date: "Apr. 2022 - Present",
      position: "Lead Fullstack Engineer",
      points: [
        "Spearheaded the migration to **GraphQL** for improved data-fetching efficiency.",
        "Set up a robust test environment using **Jest** and **Playwright**.",
        "Mentored new hires, conducting onboarding and code review sessions.",
      ],
    },
    {
      company: "Legacy Systems, Inc.",
      companyLocation: "Fukuoka, Japan",
      date: "Feb. 2020 - Mar. 2022",
      position: "Backend Developer",
      points: [
        "Refactored a monolithic Java app into microservices with **Spring Boot**.",
        "Managed CI/CD pipelines using Jenkins and Docker containers.",
        "Collaborated with cross-functional teams to ensure smooth releases.",
      ],
    },
  ],
  projects: [
    {
      name: "Task Management Web App",
      points: [
        "Developed a Kanban-style interface using **React** and Redux Toolkit.",
        "Enabled real-time collaboration via **Socket.IO** for multi-user boards.",
        "Deployed on AWS (EC2 + S3) with auto-scaling support.",
      ],
    },
    {
      name: "Analytics Dashboard",
      points: [
        "Created interactive dashboards using **D3.js** and custom chart components.",
        "Optimized data retrieval with **Elasticsearch** queries.",
        "Implemented caching layer, reducing load times by 60%.",
      ],
    },
    {
      name: "Mobile E-Commerce Prototype",
      points: [
        "Built a cross-platform mobile prototype using **Flutter**.",
        "Integrated payment gateways for secure transactions.",
        "Demonstrated to stakeholders, receiving positive user feedback.",
      ],
    },
  ],
  education: [
    {
      institution: "Fukuoka University",
      degree: "Bachelor of Computer Science",
      date: "Apr. 2016 - Mar. 2020",
    },
    {
      institution: "ABC Language School",
      degree: "Advanced English Course",
      date: "Sep. 2015 - Mar. 2016",
    },
    {
      institution: "Online Certification: AWS Solutions Architect",
      degree: "AWS Solutions Architect - Associate",
      date: "Jan. 2021",
    },
    {
      institution: "Online Certification: GCP Fundamentals",
      degree: "Google Cloud Platform Fundamentals",
      date: "Nov. 2021",
    },
    {
      institution: "Udemy: Node.js Advanced",
      degree: "Node.js Advanced Concepts",
      date: "Feb. 2022",
    },
  ],
  languageSkills: {
    content: "English: Fluent | Japanese: Native",
  },
  technicalSkills: {
    content:
      "React | Redux | GraphQL | Spring Boot | AWS | Jenkins | D3.js | Socket.IO | Flutter | Elasticsearch",
  },
};
