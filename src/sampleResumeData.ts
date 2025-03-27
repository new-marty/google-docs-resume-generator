import type { StructuredResumeData } from "./types.ts";

export const sampleResumeData: StructuredResumeData = {
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
  skills: {
    languages:
      "English: Native level, TOEIC L&R score of 970 points | Japanese: Native",
    technical:
      "TypeScript | React | React Native | Redux | node.js | nest.js | jest | mongoDB | Python | MySQL | AWS | PostgreSQL",
  },
};
