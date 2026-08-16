// ─── Mock Data for Curriculum Template System ───
// Used during frontend-only development. Will be replaced by API calls.

import type {
  Program,
  InternshipPlan,
  CurriculumTemplate,
  TaskLibraryItem,
  ResourceLibraryItem,
} from './types';

// ─── Programs ───

export const MOCK_PROGRAMS: Program[] = [
  { id: 'prog_frontend', name: 'Frontend Development', description: 'Master modern frontend technologies including React, TypeScript, and responsive design.', status: 'active' },
  { id: 'prog_backend', name: 'Backend Development', description: 'Build robust server-side applications with Node.js, databases, and API design.', status: 'active' },
  { id: 'prog_fullstack', name: 'Full Stack Development', description: 'End-to-end web development covering frontend, backend, databases, and deployment.', status: 'active' },
  { id: 'prog_fde', name: 'Forward Deployed Engineer', description: 'Customer-facing engineering combining technical skills with client interaction.', status: 'active' },
];

// ─── Internship Plans ───

export const MOCK_PLANS: InternshipPlan[] = [
  { id: 'plan_fe_1m', programId: 'prog_frontend', name: '1 Month Internship', durationDays: 30, price: 4999, status: 'active' },
  { id: 'plan_fe_3m', programId: 'prog_frontend', name: '3 Month Internship', durationDays: 90, price: 12999, status: 'active' },
  { id: 'plan_be_1m', programId: 'prog_backend', name: '1 Month Internship', durationDays: 30, price: 4999, status: 'active' },
  { id: 'plan_be_3m', programId: 'prog_backend', name: '3 Month Internship', durationDays: 90, price: 12999, status: 'active' },
  { id: 'plan_fs_1m', programId: 'prog_fullstack', name: '1 Month Internship', durationDays: 30, price: 5999, status: 'active' },
  { id: 'plan_fs_3m', programId: 'prog_fullstack', name: '3 Month Internship', durationDays: 90, price: 14999, status: 'active' },
  { id: 'plan_fde_1m', programId: 'prog_fde', name: '1 Month Internship', durationDays: 30, price: 5999, status: 'active' },
  { id: 'plan_fde_3m', programId: 'prog_fde', name: '3 Month Internship', durationDays: 90, price: 14999, status: 'active' },
];

// ─── Sample Templates ───

const now = new Date().toISOString();

export const MOCK_TEMPLATES: CurriculumTemplate[] = [
  {
    id: 'tmpl_fs_3m',
    templateName: 'Full Stack Development — 3 Month',
    programId: 'prog_fullstack',
    planId: 'plan_fs_3m',
    durationDays: 90,
    description: 'Comprehensive full-stack curriculum covering frontend, backend, databases, and deployment over 90 days.',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-08-10T14:30:00.000Z',
    currentPublishedVersionId: 'ver_fs3m_v1',
    versions: [
      {
        id: 'ver_fs3m_v1',
        templateId: 'tmpl_fs_3m',
        version: 1,
        status: 'PUBLISHED',
        publishedAt: '2026-07-15T10:00:00.000Z',
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-15T10:00:00.000Z',
        phases: [
          {
            id: 'ph_fs3m_1',
            order: 1,
            title: 'Foundations',
            description: 'Build the required software development fundamentals.',
            weeks: [
              {
                id: 'wk_fs3m_1',
                order: 1,
                title: 'Development Setup',
                goal: 'Prepare the development environment and tools.',
                days: [
                  {
                    id: 'day_fs3m_1',
                    order: 1,
                    dayNumber: 1,
                    title: 'Environment Setup',
                    type: 'ORIENTATION',
                    description: 'Set up all required development tools and accounts.',
                    estimatedMinutes: 120,
                    objectives: ['Install required tools', 'Configure development environment'],
                    tasks: [
                      { id: 'task_fs3m_1', order: 1, title: 'Install Node.js & npm', description: 'Install the latest LTS version of Node.js.', instructions: 'Download from nodejs.org, install, and verify with node -v and npm -v.', estimatedMinutes: 20, requiresSubmission: false, requiresMentorReview: false },
                      { id: 'task_fs3m_2', order: 2, title: 'Set Up VS Code', description: 'Install and configure Visual Studio Code.', instructions: 'Install VS Code and recommended extensions: ESLint, Prettier, GitLens.', estimatedMinutes: 20, requiresSubmission: false, requiresMentorReview: false },
                      { id: 'task_fs3m_3', order: 3, title: 'Create GitHub Repository', description: 'Create a repository for internship work.', instructions: 'Create a new repository, initialize with README, and submit the URL.', estimatedMinutes: 30, requiresSubmission: true, requiresMentorReview: false },
                    ],
                    resources: [
                      { id: 'res_fs3m_1', order: 1, title: 'Node.js Official Site', type: 'LINK', url: 'https://nodejs.org/', description: 'Download and documentation for Node.js.' },
                      { id: 'res_fs3m_2', order: 2, title: 'VS Code Download', type: 'LINK', url: 'https://code.visualstudio.com/', description: 'Visual Studio Code editor.' },
                    ],
                  },
                  {
                    id: 'day_fs3m_2',
                    order: 2,
                    dayNumber: 2,
                    title: 'Git & Version Control',
                    type: 'LEARNING',
                    description: 'Learn Git fundamentals and version control workflow.',
                    estimatedMinutes: 150,
                    objectives: ['Understand Git basics', 'Practice branching and merging'],
                    tasks: [
                      { id: 'task_fs3m_4', order: 1, title: 'Complete Git Tutorial', description: 'Work through an interactive Git tutorial.', instructions: 'Complete the Learn Git Branching tutorial and take a screenshot of completion.', estimatedMinutes: 60, requiresSubmission: true, requiresMentorReview: false },
                      { id: 'task_fs3m_5', order: 2, title: 'Practice Git Workflow', description: 'Create branches, make commits, and merge.', instructions: 'Create a feature branch, make 3 commits, and merge back to main.', estimatedMinutes: 45, requiresSubmission: true, requiresMentorReview: true },
                    ],
                    resources: [
                      { id: 'res_fs3m_3', order: 1, title: 'Learn Git Branching', type: 'LINK', url: 'https://learngitbranching.js.org/', description: 'Interactive Git tutorial.' },
                    ],
                  },
                  {
                    id: 'day_fs3m_3',
                    order: 3,
                    dayNumber: 3,
                    title: 'HTML & CSS Fundamentals',
                    type: 'LEARNING',
                    description: 'Review core HTML5 and CSS3 concepts.',
                    estimatedMinutes: 180,
                    objectives: ['Build semantic HTML pages', 'Apply CSS layouts'],
                    tasks: [
                      { id: 'task_fs3m_6', order: 1, title: 'Build a Personal Profile Page', description: 'Create a simple profile page using semantic HTML and CSS.', instructions: 'Build a page with header, about section, skills list, and footer. Use flexbox for layout. Submit the GitHub link.', estimatedMinutes: 90, requiresSubmission: true, requiresMentorReview: true },
                    ],
                    resources: [
                      { id: 'res_fs3m_4', order: 1, title: 'MDN HTML Guide', type: 'DOCUMENTATION', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', description: 'Comprehensive HTML reference.' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'ver_fs3m_v2',
        templateId: 'tmpl_fs_3m',
        version: 2,
        status: 'DRAFT',
        publishedAt: null,
        createdAt: '2026-08-10T14:30:00.000Z',
        updatedAt: now,
        phases: [
          {
            id: 'ph_fs3m_v2_1',
            order: 1,
            title: 'Foundations',
            description: 'Build the required software development fundamentals.',
            weeks: [
              {
                id: 'wk_fs3m_v2_1',
                order: 1,
                title: 'Development Setup',
                goal: 'Prepare the development environment and tools.',
                days: [
                  {
                    id: 'day_fs3m_v2_1',
                    order: 1,
                    dayNumber: 1,
                    title: 'Environment Setup',
                    type: 'ORIENTATION',
                    description: 'Set up all required development tools and accounts.',
                    estimatedMinutes: 120,
                    objectives: ['Install required tools', 'Configure development environment', 'Verify all installations'],
                    tasks: [
                      { id: 'task_fs3m_v2_1', order: 1, title: 'Install Node.js & npm', description: 'Install the latest LTS version of Node.js.', instructions: 'Download from nodejs.org, install, and verify with node -v and npm -v.', estimatedMinutes: 20, requiresSubmission: false, requiresMentorReview: false },
                      { id: 'task_fs3m_v2_2', order: 2, title: 'Set Up VS Code', description: 'Install and configure Visual Studio Code.', instructions: 'Install VS Code and recommended extensions: ESLint, Prettier, GitLens.', estimatedMinutes: 20, requiresSubmission: false, requiresMentorReview: false },
                    ],
                    resources: [
                      { id: 'res_fs3m_v2_1', order: 1, title: 'Node.js Official Site', type: 'LINK', url: 'https://nodejs.org/', description: 'Download and documentation for Node.js.' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tmpl_fe_1m',
    templateName: 'Frontend Development — 1 Month',
    programId: 'prog_frontend',
    planId: 'plan_fe_1m',
    durationDays: 30,
    description: 'Intensive 30-day frontend bootcamp covering React, TypeScript, and responsive design.',
    createdAt: '2026-06-15T08:00:00.000Z',
    updatedAt: '2026-07-20T16:00:00.000Z',
    currentPublishedVersionId: 'ver_fe1m_v1',
    versions: [
      {
        id: 'ver_fe1m_v1',
        templateId: 'tmpl_fe_1m',
        version: 1,
        status: 'PUBLISHED',
        publishedAt: '2026-07-01T12:00:00.000Z',
        createdAt: '2026-06-15T08:00:00.000Z',
        updatedAt: '2026-07-01T12:00:00.000Z',
        phases: [
          {
            id: 'ph_fe1m_1',
            order: 1,
            title: 'Getting Started',
            description: 'Set up tooling and learn React basics.',
            weeks: [
              {
                id: 'wk_fe1m_1',
                order: 1,
                title: 'React Fundamentals',
                goal: 'Understand React components, props, and state.',
                days: [
                  {
                    id: 'day_fe1m_1',
                    order: 1,
                    dayNumber: 1,
                    title: 'React Introduction',
                    type: 'ORIENTATION',
                    description: 'Introduction to React and the component model.',
                    estimatedMinutes: 120,
                    objectives: ['Understand JSX', 'Create first React component'],
                    tasks: [
                      { id: 'task_fe1m_1', order: 1, title: 'Create React App', description: 'Set up a new React project using Vite.', instructions: 'Run npm create vite@latest and set up a React + TypeScript project.', estimatedMinutes: 30, requiresSubmission: true, requiresMentorReview: false },
                    ],
                    resources: [
                      { id: 'res_fe1m_1', order: 1, title: 'React Documentation', type: 'DOCUMENTATION', url: 'https://react.dev/', description: 'Official React documentation.' },
                    ],
                  },
                  {
                    id: 'day_fe1m_2',
                    order: 2,
                    dayNumber: 2,
                    title: 'Components & Props',
                    type: 'LEARNING',
                    description: 'Deep dive into React components and props system.',
                    estimatedMinutes: 150,
                    objectives: ['Create reusable components', 'Pass and validate props'],
                    tasks: [
                      { id: 'task_fe1m_2', order: 1, title: 'Build Component Library', description: 'Create a set of reusable UI components.', instructions: 'Build Button, Card, and Input components with TypeScript props. Submit the GitHub link.', estimatedMinutes: 90, requiresSubmission: true, requiresMentorReview: true },
                    ],
                    resources: [
                      { id: 'res_fe1m_2', order: 1, title: 'React TypeScript Cheatsheet', type: 'ARTICLE', url: 'https://react-typescript-cheatsheet.netlify.app/', description: 'TypeScript patterns for React.' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// ─── Task Library ───

export const MOCK_TASK_LIBRARY: TaskLibraryItem[] = [
  { id: 'tlib_1', title: 'GitHub Repository Setup', description: 'Create and initialize a GitHub repository for project work.', instructions: 'Create a new repository on GitHub, initialize with README and .gitignore, clone locally, and submit the repository URL.', estimatedMinutes: 30, requiresSubmission: true, requiresMentorReview: false, tags: ['git', 'setup'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
  { id: 'tlib_2', title: 'Install Node.js', description: 'Install and verify Node.js and npm.', instructions: 'Download the latest LTS version from nodejs.org, install, and verify with node -v and npm -v.', estimatedMinutes: 15, requiresSubmission: false, requiresMentorReview: false, tags: ['setup', 'node'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
  { id: 'tlib_3', title: 'API Testing with Postman', description: 'Test REST API endpoints using Postman.', instructions: 'Install Postman, import the provided API collection, test all endpoints, and submit screenshots of successful responses.', estimatedMinutes: 45, requiresSubmission: true, requiresMentorReview: true, tags: ['api', 'testing'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
  { id: 'tlib_4', title: 'Deploy to Vercel', description: 'Deploy a web application to Vercel.', instructions: 'Connect your GitHub repository to Vercel, configure the build settings, deploy, and submit the live URL.', estimatedMinutes: 30, requiresSubmission: true, requiresMentorReview: true, tags: ['deployment', 'vercel'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
  { id: 'tlib_5', title: 'Final Project Submission', description: 'Submit the completed final project for review.', instructions: 'Push all final code to GitHub, deploy to production, write a project README, and submit both the repository and live URLs.', estimatedMinutes: 60, requiresSubmission: true, requiresMentorReview: true, tags: ['submission', 'final'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
];

// ─── Resource Library ───

export const MOCK_RESOURCE_LIBRARY: ResourceLibraryItem[] = [
  { id: 'rlib_1', title: 'React Documentation', type: 'DOCUMENTATION', url: 'https://react.dev/', description: 'Official React documentation and guides.', tags: ['react', 'frontend'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
  { id: 'rlib_2', title: 'Node.js Documentation', type: 'DOCUMENTATION', url: 'https://nodejs.org/docs/latest/api/', description: 'Official Node.js API documentation.', tags: ['node', 'backend'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
  { id: 'rlib_3', title: 'GitHub Documentation', type: 'DOCUMENTATION', url: 'https://docs.github.com/', description: 'Guides for using GitHub and Git.', tags: ['git', 'github'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
  { id: 'rlib_4', title: 'Postman Learning Center', type: 'LINK', url: 'https://learning.postman.com/', description: 'Learn API testing with Postman.', tags: ['api', 'testing'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
  { id: 'rlib_5', title: 'TypeScript Handbook', type: 'DOCUMENTATION', url: 'https://www.typescriptlang.org/docs/handbook/', description: 'Official TypeScript handbook and reference.', tags: ['typescript', 'language'], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', archived: false },
];
