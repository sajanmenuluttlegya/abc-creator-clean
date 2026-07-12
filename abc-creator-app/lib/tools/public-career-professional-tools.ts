type CareerInput = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type CareerTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  detailEmoji: string;
  category: string;
  displayCreditCost: number;
  outputType?: "text";
  aliases?: string[];
  nextActions?: Array<{ label: string; href: string; description: string }>;
  inputs: CareerInput[];
};

const category = "Career / Professional Tools";
const languageOptions = ["English", "Hindi", "Hinglish", "Spanish", "French", "German", "Portuguese", "Arabic"];
const regionOptions = ["India", "United States", "United Kingdom", "Canada", "Australia", "European Union", "Middle East", "Global / remote", "Custom from brief"];
const toneOptions = ["Professional and natural", "Executive and concise", "Warm and confident", "Direct and practical", "Persuasive but credible", "Human and conversational", "Custom from brief"];
const depthOptions = ["Quick professional (2 credits)", "Standard premium (5 credits)", "Detailed strategic (7 credits)", "Executive comprehensive (9 credits)"];
const seniorityOptions = ["Student / trainee", "Entry level", "Early career", "Mid-level", "Senior individual contributor", "Manager", "Director / Head", "Executive / founder", "Career changer", "Custom from brief"];
const jobSearchStageOptions = ["Exploring careers", "Preparing materials", "Actively applying", "Interviewing", "Comparing offers", "Seeking promotion", "Freelancing / consulting", "Custom from brief"];
const variationOptions = ["1 version", "3 versions", "5 versions", "10 versions"];
const questionCountOptions = ["5 questions", "10 questions", "15 questions", "20 questions"];
const interviewDurationOptions = ["15-minute practice", "30-minute practice", "45-minute practice", "60-minute full simulation"];
const resumeLengthOptions = ["One-page concise", "Two-page standard", "Detailed CV / multi-page", "Auto based on experience"];
const commonTail: CareerInput[] = [
  { id: "target_region", label: "Target Region", type: "select", required: true, options: regionOptions },
  { id: "output_tone", label: "Output Tone", type: "select", required: true, options: toneOptions },
  { id: "language", label: "Language", type: "select", required: true, options: languageOptions },
  { id: "must_preserve", label: "Facts / Constraints to Preserve", type: "textarea", placeholder: "Facts that must remain exact, sensitive details to omit, accessibility needs, formatting rules, deadlines, or other constraints.", required: false },
];

export const careerProfessionalTools: CareerTool[] = [
  {
    id: "career-path-generator", slug: "career-path-generator", name: "Career Path Generator",
    description: "Map realistic career directions from your strengths, experience, interests, constraints, and desired future.",
    icon: "idea", detailEmoji: "🧭", category, displayCreditCost: 5, outputType: "text",
    aliases: ["ai-career-path-planner", "career-direction-generator"],
    nextActions: [{ label: "Build a transition plan", href: "/tools/career-transition-planner", description: "Turn the selected direction into a practical transition roadmap." }],
    inputs: [
      { id: "current_background", label: "Current Background", type: "textarea", placeholder: "Current role, education, experience, strengths, responsibilities, and achievements.", required: true },
      { id: "interests_values", label: "Interests / Values", type: "textarea", placeholder: "Work you enjoy, causes, environments, preferred problems, values, and motivators.", required: true },
      { id: "constraints", label: "Real-World Constraints", type: "textarea", placeholder: "Income needs, location, time, family duties, study capacity, risk tolerance, or mobility limits.", required: false },
      { id: "career_horizon", label: "Planning Horizon", type: "select", required: true, options: ["Next 6 months", "1 year", "2–3 years", "5 years", "Long-term portfolio career", "Custom from brief"] },
      { id: "output_depth", label: "Analysis Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "career-transition-planner", slug: "career-transition-planner", name: "Career Transition Planner",
    description: "Create a staged transition plan that protects income while building the evidence required for a new career.",
    icon: "calendar", detailEmoji: "🔄", category, displayCreditCost: 7, outputType: "text",
    aliases: ["career-change-planner", "career-switch-roadmap"],
    nextActions: [{ label: "Analyze skill gaps", href: "/tools/skills-gap-analyzer", description: "Prioritize the capabilities and evidence needed for the target role." }],
    inputs: [
      { id: "current_career", label: "Current Career", type: "textarea", placeholder: "Role, experience, transferable skills, income situation, and current responsibilities.", required: true },
      { id: "target_career", label: "Target Career", type: "textarea", placeholder: "Role, field, or direction you want to enter and why.", required: true },
      { id: "available_resources", label: "Available Time / Resources", type: "textarea", placeholder: "Weekly hours, budget, courses, mentors, portfolio assets, network, and tools.", required: false },
      { id: "transition_timeline", label: "Preferred Timeline", type: "text", placeholder: "e.g., 6 months, by March 2027", required: true },
      { id: "risk_tolerance", label: "Risk Tolerance", type: "select", required: true, options: ["Very cautious", "Cautious", "Balanced", "Accelerated", "High-risk / fast transition", "Custom from brief"] },
      { id: "output_depth", label: "Plan Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "target-role-fit-analyzer", slug: "target-role-fit-analyzer", name: "Target Role Fit Analyzer",
    description: "Compare your real experience with a target role and separate strong evidence, transferable strengths, and genuine gaps.",
    icon: "seo", detailEmoji: "🎯", category, displayCreditCost: 5, outputType: "text",
    aliases: ["job-fit-analyzer", "role-match-analyzer"],
    nextActions: [{ label: "Optimize the résumé", href: "/tools/job-tailored-resume-optimizer", description: "Use the role-fit analysis to tailor truthful application content." }],
    inputs: [
      { id: "career_evidence", label: "Résumé / Career Evidence", type: "textarea", placeholder: "Paste your résumé, experience, projects, education, skills, and verified achievements.", required: true },
      { id: "job_description", label: "Target Job Description", type: "textarea", placeholder: "Paste the complete job description.", required: true },
      { id: "target_seniority", label: "Target Seniority", type: "select", required: true, options: seniorityOptions },
      { id: "fit_goal", label: "Analysis Goal", type: "select", required: true, options: ["Decide whether to apply", "Prepare application positioning", "Identify interview risks", "Plan skill development", "Compare multiple career options"] },
      { id: "output_depth", label: "Analysis Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "skills-gap-analyzer", slug: "skills-gap-analyzer", name: "Skills Gap Analyzer",
    description: "Prioritize missing capabilities, evidence gaps, learning actions, portfolio projects, and proof milestones.",
    icon: "folder", detailEmoji: "📊", category, displayCreditCost: 5, outputType: "text",
    aliases: ["career-skills-gap-analysis", "professional-gap-analyzer"],
    inputs: [
      { id: "current_skills", label: "Current Skills / Evidence", type: "textarea", placeholder: "Skills, tools, projects, qualifications, results, and practical experience you can prove.", required: true },
      { id: "target_requirements", label: "Target Role Requirements", type: "textarea", placeholder: "Paste a job description or describe the target role's expected capabilities.", required: true },
      { id: "learning_capacity", label: "Learning Capacity", type: "text", placeholder: "e.g., 6 hours per week, ₹5,000 budget, 90 days", required: false },
      { id: "priority_mode", label: "Priority Mode", type: "select", required: true, options: ["Fastest employability", "Strongest long-term foundation", "Portfolio-first", "Certification-first", "Experience-first", "Balanced"] },
      { id: "output_depth", label: "Analysis Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "job-search-strategy-generator", slug: "job-search-strategy-generator", name: "Job Search Strategy Generator",
    description: "Build a measurable weekly system for targeting, applications, networking, portfolio proof, follow-ups, and review.",
    icon: "calendar", detailEmoji: "🔎", category, displayCreditCost: 7, outputType: "text",
    aliases: ["job-hunt-plan-generator", "job-search-roadmap"],
    inputs: [
      { id: "target_roles", label: "Target Roles / Employers", type: "textarea", placeholder: "Roles, industries, company types, locations, and work arrangements you want.", required: true },
      { id: "current_materials", label: "Current Readiness", type: "textarea", placeholder: "Résumé, LinkedIn, portfolio, references, network, interview readiness, and current gaps.", required: true },
      { id: "weekly_capacity", label: "Weekly Capacity", type: "text", placeholder: "e.g., 10 hours per week", required: true },
      { id: "job_search_stage", label: "Current Stage", type: "select", required: true, options: jobSearchStageOptions },
      { id: "strategy_horizon", label: "Strategy Horizon", type: "select", required: true, options: ["2 weeks", "30 days", "60 days", "90 days", "6 months", "Custom from brief"] },
      { id: "output_depth", label: "Plan Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "ats-resume-generator", slug: "ats-resume-generator", name: "ATS Résumé Generator",
    description: "Create a truthful, ATS-readable résumé with achievement-led content, conventional sections, and regional formatting.",
    icon: "writing-pad", detailEmoji: "📄", category, displayCreditCost: 7, outputType: "text",
    aliases: ["ats-cv-generator", "professional-resume-generator"],
    nextActions: [{ label: "Check ATS readiness", href: "/tools/ats-readiness-analyzer", description: "Audit the résumé against a specific job description." }],
    inputs: [
      { id: "career_history", label: "Career History / Verified Facts", type: "textarea", placeholder: "Contact-safe details, roles, employers, dates, responsibilities, achievements, projects, education, certifications, and skills.", required: true },
      { id: "target_role", label: "Target Role", type: "text", placeholder: "e.g., Product Manager, Data Analyst", required: true },
      { id: "job_description", label: "Job Description (Optional)", type: "textarea", placeholder: "Paste the target job description for stronger relevance.", required: false },
      { id: "target_seniority", label: "Seniority", type: "select", required: true, options: seniorityOptions },
      { id: "resume_length", label: "Résumé Length", type: "select", required: true, options: resumeLengthOptions },
      { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "resume-rewriter-humanizer", slug: "resume-rewriter-humanizer", name: "Résumé Rewriter & Humanizer",
    description: "Rewrite an existing résumé into clear, specific, credible professional language without inventing achievements.",
    icon: "writing-pad", detailEmoji: "✍️", category, displayCreditCost: 7, outputType: "text",
    aliases: ["cv-rewriter", "resume-humanizer"],
    inputs: [
      { id: "existing_resume", label: "Existing Résumé", type: "textarea", placeholder: "Paste the complete résumé or CV.", required: true },
      { id: "rewrite_goal", label: "Rewrite Goal", type: "select", required: true, options: ["Stronger clarity and impact", "More natural and human", "More concise", "More senior / strategic", "Career-change positioning", "Grammar and consistency", "Full premium rewrite"] },
      { id: "target_role", label: "Target Role / Direction", type: "text", placeholder: "Optional target role or professional direction.", required: false },
      { id: "job_description", label: "Target Job Description", type: "textarea", placeholder: "Optional: paste the target posting.", required: false },
      { id: "resume_length", label: "Preferred Length", type: "select", required: true, options: resumeLengthOptions },
      { id: "output_depth", label: "Rewrite Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "job-tailored-resume-optimizer", slug: "job-tailored-resume-optimizer", name: "Job-Tailored Résumé Optimizer",
    description: "Tailor a résumé to a specific role using only substantiated experience and transparent gap notes.",
    icon: "seo", detailEmoji: "🧲", category, displayCreditCost: 9, outputType: "text",
    aliases: ["resume-job-matcher", "targeted-resume-optimizer"],
    nextActions: [{ label: "Write the cover letter", href: "/tools/cover-letter-generator", description: "Create a role-specific letter from the same evidence." }],
    inputs: [
      { id: "existing_resume", label: "Existing Résumé", type: "textarea", placeholder: "Paste the full current résumé.", required: true },
      { id: "job_description", label: "Target Job Description", type: "textarea", placeholder: "Paste the complete job posting.", required: true },
      { id: "additional_evidence", label: "Additional Verified Evidence", type: "textarea", placeholder: "Relevant projects, results, tools, coursework, or achievements missing from the résumé.", required: false },
      { id: "target_seniority", label: "Target Seniority", type: "select", required: true, options: seniorityOptions },
      { id: "resume_length", label: "Preferred Length", type: "select", required: true, options: resumeLengthOptions },
      { id: "output_depth", label: "Optimization Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "ats-readiness-analyzer", slug: "ats-readiness-analyzer", name: "ATS Readiness Analyzer",
    description: "Audit parsing, structure, role alignment, evidence, keywords, chronology, and human readability without fake guarantees.",
    icon: "seo", detailEmoji: "🧪", category, displayCreditCost: 7, outputType: "text",
    aliases: ["ats-resume-checker", "resume-readiness-audit"],
    nextActions: [{ label: "Strengthen achievement bullets", href: "/tools/achievement-bullet-generator", description: "Turn weak duties into truthful evidence-led bullets." }],
    inputs: [
      { id: "resume", label: "Résumé / CV", type: "textarea", placeholder: "Paste the résumé to audit.", required: true },
      { id: "job_description", label: "Target Job Description", type: "textarea", placeholder: "Paste the target posting for role-specific analysis.", required: true },
      { id: "audit_focus", label: "Audit Focus", type: "select", required: true, options: ["Complete ATS + recruiter audit", "Parsing and formatting", "Keyword and skill alignment", "Evidence and achievements", "Career-change relevance", "Executive résumé quality"] },
      { id: "output_depth", label: "Audit Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "achievement-bullet-generator", slug: "achievement-bullet-generator", name: "Achievement Bullet Generator",
    description: "Convert real duties and outcomes into concise résumé bullets with context, contribution, evidence, and scale.",
    icon: "writing-pad", detailEmoji: "🏆", category, displayCreditCost: 3, outputType: "text",
    aliases: ["resume-bullet-generator", "cv-achievement-writer"],
    inputs: [
      { id: "experience_evidence", label: "Experience / Raw Evidence", type: "textarea", placeholder: "Role, task, challenge, action, result, tools, scale, stakeholders, and any verified metrics.", required: true },
      { id: "target_role", label: "Target Role", type: "text", placeholder: "Role or field these bullets should support.", required: true },
      { id: "bullet_count", label: "Bullet Count", type: "select", required: true, options: ["3 bullets", "5 bullets", "8 bullets", "12 bullets"] },
      { id: "bullet_style", label: "Bullet Style", type: "select", required: true, options: ["Concise ATS-friendly", "Impact-first", "Leadership / strategic", "Technical / project", "Career-change transferable", "Executive"] },
      ...commonTail,
    ],
  },
  {
    id: "job-description-decoder", slug: "job-description-decoder", name: "Job Description Decoder",
    description: "Decode responsibilities, success signals, required versus preferred criteria, hidden priorities, and application risks.",
    icon: "seo", detailEmoji: "🔬", category, displayCreditCost: 5, outputType: "text",
    aliases: ["job-posting-analyzer", "jd-decoder"],
    inputs: [
      { id: "job_description", label: "Job Description", type: "textarea", placeholder: "Paste the complete job posting.", required: true },
      { id: "candidate_context", label: "Candidate Context", type: "textarea", placeholder: "Optional: résumé summary, career stage, strengths, gaps, or application concerns.", required: false },
      { id: "analysis_goal", label: "Analysis Goal", type: "select", required: true, options: ["Application strategy", "Résumé tailoring", "Interview preparation", "Role-fit decision", "Salary / scope understanding", "Complete analysis"] },
      { id: "output_depth", label: "Analysis Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "cover-letter-generator", slug: "cover-letter-generator", name: "Cover Letter Generator",
    description: "Write a specific, evidence-led cover letter that connects the candidate's real experience to the employer's needs.",
    icon: "writing-pad", detailEmoji: "✉️", category, displayCreditCost: 5, outputType: "text",
    aliases: ["job-cover-letter-writer", "application-letter-generator"],
    inputs: [
      { id: "resume_evidence", label: "Résumé / Candidate Evidence", type: "textarea", placeholder: "Paste verified experience, achievements, education, projects, and skills.", required: true },
      { id: "job_description", label: "Job Description", type: "textarea", placeholder: "Paste the target job posting.", required: true },
      { id: "company_context", label: "Company / Motivation Context", type: "textarea", placeholder: "Why this employer, team, product, mission, or role matters to you. Use only verified information.", required: false },
      { id: "letter_style", label: "Letter Style", type: "select", required: true, options: ["Classic professional", "Modern concise", "Warm and mission-led", "Technical and evidence-led", "Executive", "Career changer"] },
      { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "application-question-answer-generator", slug: "application-question-answer-generator", name: "Application Question Answer Generator",
    description: "Draft credible answers to employer application questions using only supplied evidence and exact length limits.",
    icon: "writing-pad", detailEmoji: "📝", category, displayCreditCost: 5, outputType: "text",
    aliases: ["job-application-answer-writer", "screening-question-generator"],
    inputs: [
      { id: "questions", label: "Application Questions", type: "textarea", placeholder: "Paste every question and include character or word limits where provided.", required: true },
      { id: "candidate_evidence", label: "Candidate Evidence", type: "textarea", placeholder: "Résumé, projects, motivations, verified examples, and facts the answers may use.", required: true },
      { id: "job_description", label: "Job Description", type: "textarea", placeholder: "Paste the target role description.", required: false },
      { id: "answer_style", label: "Answer Style", type: "select", required: true, options: ["Concise direct", "Evidence-led", "Warm and authentic", "Technical", "Leadership-focused", "Mission-focused"] },
      ...commonTail,
    ],
  },
  {
    id: "job-application-tracker-template-generator", slug: "job-application-tracker-template-generator", name: "Job Application Tracker Template Generator",
    description: "Create a reusable application tracker with stages, deadlines, contacts, follow-ups, interviews, and learning metrics.",
    icon: "calendar", detailEmoji: "🗂️", category, displayCreditCost: 3, outputType: "text",
    aliases: ["job-tracker-template", "application-pipeline-generator"],
    inputs: [
      { id: "target_search", label: "Job Search Context", type: "textarea", placeholder: "Target roles, industries, application volume, locations, and how you currently track opportunities.", required: true },
      { id: "tracker_format", label: "Tracker Format", type: "select", required: true, options: ["Spreadsheet-ready table", "Notion-style database", "Kanban pipeline", "Simple weekly tracker", "Detailed CRM-style tracker"] },
      { id: "follow_up_rules", label: "Follow-Up Preference", type: "select", required: true, options: ["Conservative", "Standard professional", "Proactive", "Custom from brief"] },
      { id: "output_depth", label: "Template Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "linkedin-profile-optimizer", slug: "linkedin-profile-optimizer", name: "LinkedIn Profile Optimizer",
    description: "Build a recruiter-readable LinkedIn profile with positioning, evidence, keywords, featured assets, and credibility checks.",
    icon: "folder", detailEmoji: "💼", category, displayCreditCost: 7, outputType: "text",
    aliases: ["linkedin-profile-writer", "linkedin-optimization-generator"],
    inputs: [
      { id: "current_profile_resume", label: "Current Profile / Résumé", type: "textarea", placeholder: "Paste current headline, About, experience, skills, résumé, or career history.", required: true },
      { id: "target_direction", label: "Target Direction", type: "textarea", placeholder: "Roles, industries, clients, opportunities, and people you want the profile to attract.", required: true },
      { id: "profile_goal", label: "Primary Goal", type: "select", required: true, options: ["Recruiter discovery", "Career transition", "Freelance clients", "Executive visibility", "Thought leadership", "Networking", "Student / first role"] },
      { id: "output_depth", label: "Optimization Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "professional-bio-elevator-pitch-generator", slug: "professional-bio-elevator-pitch-generator", name: "Professional Bio & Elevator Pitch Generator",
    description: "Create consistent short bios, full bios, speaker introductions, and natural 15-, 30-, and 60-second pitches.",
    icon: "writing-pad", detailEmoji: "🎙️", category, displayCreditCost: 5, outputType: "text",
    aliases: ["professional-bio-generator", "elevator-pitch-generator"],
    inputs: [
      { id: "professional_background", label: "Professional Background", type: "textarea", placeholder: "Role, experience, expertise, achievements, values, audience, and verified credentials.", required: true },
      { id: "positioning_goal", label: "Positioning Goal", type: "textarea", placeholder: "What should people understand, remember, or do after reading or hearing this?", required: true },
      { id: "use_cases", label: "Use Cases", type: "select", required: true, options: ["LinkedIn + networking", "Website / portfolio", "Speaker / event", "Executive profile", "Freelance / consulting", "Job interview", "Complete bio pack"] },
      { id: "output_depth", label: "Output Pack", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "portfolio-copy-generator", slug: "portfolio-copy-generator", name: "Portfolio Copy Generator",
    description: "Write premium portfolio positioning, project case studies, services, process, proof, and conversion-ready calls to action.",
    icon: "folder", detailEmoji: "🖥️", category, displayCreditCost: 7, outputType: "text",
    aliases: ["professional-portfolio-writer", "portfolio-case-study-generator"],
    inputs: [
      { id: "professional_offer", label: "Professional Offer / Target Audience", type: "textarea", placeholder: "What you do, for whom, problems solved, and the opportunities you want.", required: true },
      { id: "projects_evidence", label: "Projects / Evidence", type: "textarea", placeholder: "Project context, role, process, decisions, outputs, outcomes, tools, constraints, and verified metrics.", required: true },
      { id: "portfolio_scope", label: "Portfolio Scope", type: "select", required: true, options: ["Homepage only", "Homepage + About", "One project case study", "Three-project portfolio", "Services portfolio", "Complete premium portfolio"] },
      { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "networking-recruiter-message-generator", slug: "networking-recruiter-message-generator", name: "Networking & Recruiter Message Generator",
    description: "Create respectful, relationship-first outreach for recruiters, hiring managers, alumni, peers, mentors, and referrals.",
    icon: "writing-pad", detailEmoji: "🤝", category, displayCreditCost: 3, outputType: "text",
    aliases: ["networking-message-generator", "recruiter-message-generator"],
    inputs: [
      { id: "recipient_context", label: "Recipient / Relationship Context", type: "textarea", placeholder: "Who they are, how you found them, shared context, and why outreach is relevant.", required: true },
      { id: "sender_context", label: "Your Relevant Background", type: "textarea", placeholder: "Current role, target, credible proof, and anything genuinely relevant to this person.", required: true },
      { id: "message_goal", label: "Message Goal", type: "select", required: true, options: ["Introduce myself", "Ask for insight", "Request informational chat", "Contact recruiter about role", "Request referral", "Follow up", "Thank and maintain relationship"] },
      { id: "variation_count", label: "Versions", type: "select", required: true, options: variationOptions },
      ...commonTail,
    ],
  },
  {
    id: "interview-question-generator", slug: "interview-question-generator", name: "Interview Question Generator",
    description: "Generate role-specific behavioral, situational, functional, leadership, motivation, and follow-up questions.",
    icon: "idea", detailEmoji: "❓", category, displayCreditCost: 3, outputType: "text",
    aliases: ["job-interview-question-generator", "role-specific-interview-questions"],
    inputs: [
      { id: "job_description", label: "Job Description / Role Brief", type: "textarea", placeholder: "Paste the role description and any interview-stage information.", required: true },
      { id: "candidate_context", label: "Candidate Context", type: "textarea", placeholder: "Optional: résumé, seniority, gaps, strengths, or areas to test.", required: false },
      { id: "interview_stage", label: "Interview Stage", type: "select", required: true, options: ["Recruiter screen", "Hiring manager", "Technical / functional", "Behavioral panel", "Leadership / executive", "Culture / values", "Final round", "Complete mix"] },
      { id: "question_count", label: "Question Count", type: "select", required: true, options: questionCountOptions },
      ...commonTail,
    ],
  },
  {
    id: "interview-answer-coach", slug: "interview-answer-coach", name: "Interview Answer Coach",
    description: "Audit and improve an interview answer for relevance, evidence, structure, credibility, concision, and likely follow-ups.",
    icon: "writing-pad", detailEmoji: "🎧", category, displayCreditCost: 5, outputType: "text",
    aliases: ["interview-answer-analyzer", "ai-interview-coach"],
    inputs: [
      { id: "interview_question", label: "Interview Question", type: "textarea", placeholder: "Paste the exact question.", required: true },
      { id: "draft_answer", label: "Your Draft Answer", type: "textarea", placeholder: "Paste your current answer or rough notes.", required: true },
      { id: "job_context", label: "Role / Job Context", type: "textarea", placeholder: "Job description, employer priorities, interview stage, and relevant experience.", required: false },
      { id: "coaching_mode", label: "Coaching Mode", type: "select", required: true, options: ["Concise feedback", "Detailed line-by-line coaching", "STAR restructuring", "Executive answer coaching", "Technical clarity", "Confidence and natural delivery"] },
      { id: "output_depth", label: "Coaching Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "star-story-builder", slug: "star-story-builder", name: "STAR Story Builder",
    description: "Turn a real professional experience into flexible STAR stories with verified evidence and reusable answer angles.",
    icon: "writing-pad", detailEmoji: "⭐", category, displayCreditCost: 5, outputType: "text",
    aliases: ["star-interview-answer-generator", "behavioral-story-builder"],
    inputs: [
      { id: "experience", label: "Real Experience / Event", type: "textarea", placeholder: "Describe what happened, your responsibility, actions, outcome, and what you learned.", required: true },
      { id: "target_competencies", label: "Target Competencies", type: "textarea", placeholder: "Leadership, conflict, failure, teamwork, ownership, innovation, prioritization, customer focus, or other themes.", required: true },
      { id: "job_context", label: "Target Role Context", type: "textarea", placeholder: "Optional job description or role priorities.", required: false },
      { id: "variation_count", label: "Story Angles", type: "select", required: true, options: variationOptions },
      ...commonTail,
    ],
  },
  {
    id: "mock-interview-preparation-pack-generator", slug: "mock-interview-preparation-pack-generator", name: "Mock Interview & Preparation Pack Generator",
    description: "Create a timed mock interview, role-research checklist, evidence bank, scoring rubric, and final preparation plan.",
    icon: "calendar", detailEmoji: "🎤", category, displayCreditCost: 7, outputType: "text",
    aliases: ["mock-interview-planner", "interview-preparation-pack-generator"],
    nextActions: [{ label: "Build STAR stories", href: "/tools/star-story-builder", description: "Prepare flexible evidence for behavioral questions." }],
    inputs: [
      { id: "job_description", label: "Job Description", type: "textarea", placeholder: "Paste the target role description.", required: true },
      { id: "candidate_resume", label: "Candidate Résumé / Evidence", type: "textarea", placeholder: "Paste experience, projects, strengths, gaps, and verified achievements.", required: true },
      { id: "company_context", label: "Company / Interview Context", type: "textarea", placeholder: "Verified employer information, interview stage, panel roles, or recruiter guidance.", required: false },
      { id: "interview_duration", label: "Practice Duration", type: "select", required: true, options: interviewDurationOptions },
      { id: "interview_focus", label: "Interview Focus", type: "select", required: true, options: ["Balanced complete interview", "Behavioral", "Technical / functional", "Leadership", "Case / problem solving", "Career-change defense", "Executive"] },
      { id: "output_depth", label: "Pack Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "interview-follow-up-generator", slug: "interview-follow-up-generator", name: "Interview Follow-Up Generator",
    description: "Create a personalized thank-you, value reinforcement, clarification, or follow-up message based on the actual conversation.",
    icon: "writing-pad", detailEmoji: "📨", category, displayCreditCost: 3, outputType: "text",
    aliases: ["interview-thank-you-email", "post-interview-follow-up"],
    inputs: [
      { id: "interview_notes", label: "Interview Notes", type: "textarea", placeholder: "What was discussed, interviewer names/roles, challenges, priorities, positive moments, and unanswered points.", required: true },
      { id: "candidate_value", label: "Relevant Candidate Value", type: "textarea", placeholder: "The strongest evidence or point you want to reinforce.", required: true },
      { id: "follow_up_goal", label: "Follow-Up Goal", type: "select", required: true, options: ["Thank-you note", "Reinforce fit", "Add a forgotten example", "Clarify an answer", "Check status", "Final-round follow-up"] },
      { id: "variation_count", label: "Versions", type: "select", required: true, options: variationOptions },
      ...commonTail,
    ],
  },
  {
    id: "salary-negotiation-script-generator", slug: "salary-negotiation-script-generator", name: "Salary Negotiation Script Generator",
    description: "Prepare evidence-based negotiation scripts, counters, trade-offs, objection responses, and walk-away boundaries.",
    icon: "writing-pad", detailEmoji: "💰", category, displayCreditCost: 7, outputType: "text",
    aliases: ["offer-negotiation-generator", "salary-counteroffer-script"],
    inputs: [
      { id: "offer_details", label: "Offer Details", type: "textarea", placeholder: "Base pay, bonus, equity, benefits, title, scope, location, flexibility, and deadlines.", required: true },
      { id: "candidate_leverage", label: "Evidence / Leverage", type: "textarea", placeholder: "Verified market data, competing offers, rare skills, experience, impact, responsibilities, and constraints.", required: true },
      { id: "target_outcome", label: "Target / Minimum Outcome", type: "textarea", placeholder: "Preferred package, acceptable range, non-salary priorities, and walk-away conditions.", required: true },
      { id: "negotiation_channel", label: "Channel", type: "select", required: true, options: ["Email", "Recruiter phone call", "Hiring manager conversation", "Counteroffer letter", "Raise / promotion discussion", "Complete script pack"] },
      { id: "output_depth", label: "Preparation Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "job-offer-comparison-generator", slug: "job-offer-comparison-generator", name: "Job Offer Comparison Generator",
    description: "Compare offers across compensation, role scope, manager, learning, stability, flexibility, workload, risk, and personal priorities.",
    icon: "folder", detailEmoji: "⚖️", category, displayCreditCost: 7, outputType: "text",
    aliases: ["offer-decision-matrix", "job-offer-analyzer"],
    inputs: [
      { id: "offers", label: "Offer Details", type: "textarea", placeholder: "Paste each offer's compensation, benefits, title, role, manager, team, location, flexibility, expectations, and deadlines.", required: true },
      { id: "personal_priorities", label: "Your Priorities", type: "textarea", placeholder: "Income, learning, stability, mission, location, work-life fit, prestige, growth, or other weighted priorities.", required: true },
      { id: "known_risks", label: "Known Risks / Unknowns", type: "textarea", placeholder: "Concerns, missing information, red flags, family constraints, probation, visa, or relocation issues.", required: false },
      { id: "output_depth", label: "Comparison Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "performance-review-self-assessment-generator", slug: "performance-review-self-assessment-generator", name: "Performance Review Self-Assessment Generator",
    description: "Create a balanced, evidence-led review covering outcomes, collaboration, growth, challenges, lessons, and future priorities.",
    icon: "writing-pad", detailEmoji: "📈", category, displayCreditCost: 7, outputType: "text",
    aliases: ["self-appraisal-generator", "performance-review-writer"],
    inputs: [
      { id: "review_evidence", label: "Review-Period Evidence", type: "textarea", placeholder: "Goals, outcomes, projects, metrics, feedback, responsibilities, challenges, collaboration, and learning.", required: true },
      { id: "role_expectations", label: "Role / Review Criteria", type: "textarea", placeholder: "Job expectations, competency framework, company values, goals, or review questions.", required: true },
      { id: "review_period", label: "Review Period", type: "text", placeholder: "e.g., January–June 2026", required: true },
      { id: "review_style", label: "Review Style", type: "select", required: true, options: ["Balanced professional", "Impact-led", "Leadership-focused", "Promotion-aware", "Concise form answers", "Complete narrative"] },
      { id: "output_depth", label: "Output Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "promotion-case-generator", slug: "promotion-case-generator", name: "Promotion Case Generator",
    description: "Build a credible promotion case from expanded scope, next-level behavior, business impact, leadership evidence, and readiness gaps.",
    icon: "folder", detailEmoji: "🚀", category, displayCreditCost: 7, outputType: "text",
    aliases: ["promotion-business-case", "promotion-readiness-generator"],
    inputs: [
      { id: "current_role_evidence", label: "Current Role / Evidence", type: "textarea", placeholder: "Responsibilities, outcomes, expanded scope, feedback, leadership, and verified impact.", required: true },
      { id: "target_level_expectations", label: "Target Role / Level Expectations", type: "textarea", placeholder: "Promotion criteria, next-level competencies, role description, or manager guidance.", required: true },
      { id: "readiness_gaps", label: "Known Gaps / Concerns", type: "textarea", placeholder: "Missing evidence, timing issues, stakeholder concerns, or skills still being developed.", required: false },
      { id: "promotion_timeline", label: "Target Timeline", type: "text", placeholder: "e.g., next review cycle, Q4 2026", required: false },
      { id: "output_depth", label: "Case Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "manager-one-on-one-prep-generator", slug: "manager-one-on-one-prep-generator", name: "Manager One-on-One Prep Generator",
    description: "Prepare a focused one-on-one with updates, decisions, blockers, feedback requests, development topics, and commitments.",
    icon: "calendar", detailEmoji: "🗣️", category, displayCreditCost: 3, outputType: "text",
    aliases: ["one-on-one-meeting-prep", "manager-1-1-agenda-generator"],
    inputs: [
      { id: "current_updates", label: "Updates / Context", type: "textarea", placeholder: "Progress, wins, priorities, changes, concerns, and relevant background.", required: true },
      { id: "topics_outcomes", label: "Topics / Desired Outcomes", type: "textarea", placeholder: "Decisions, support, feedback, growth, workload, alignment, or sensitive topics.", required: true },
      { id: "relationship_context", label: "Manager / Relationship Context", type: "textarea", placeholder: "Optional: communication style, history, constraints, or concerns.", required: false },
      { id: "meeting_duration", label: "Meeting Duration", type: "select", required: true, options: ["15 minutes", "30 minutes", "45 minutes", "60 minutes"] },
      ...commonTail,
    ],
  },
  {
    id: "workplace-conversation-planner", slug: "workplace-conversation-planner", name: "Workplace Conversation Planner",
    description: "Prepare a calm, factual, outcome-focused conversation about workload, feedback, boundaries, expectations, or conflict.",
    icon: "writing-pad", detailEmoji: "🧩", category, displayCreditCost: 5, outputType: "text",
    aliases: ["difficult-work-conversation-planner", "professional-conflict-script"],
    inputs: [
      { id: "situation", label: "Situation", type: "textarea", placeholder: "What happened, who is involved, what evidence exists, and why the issue matters.", required: true },
      { id: "desired_outcome", label: "Desired Outcome", type: "textarea", placeholder: "What should change, be clarified, agreed, documented, or decided.", required: true },
      { id: "conversation_type", label: "Conversation Type", type: "select", required: true, options: ["Workload / priorities", "Boundary setting", "Giving feedback", "Receiving feedback", "Missed commitment", "Role ambiguity", "Interpersonal conflict", "Escalation preparation", "Custom"] },
      { id: "risk_level", label: "Sensitivity / Risk", type: "select", required: true, options: ["Low", "Moderate", "High", "Formal HR-sensitive", "Unsure"] },
      { id: "output_depth", label: "Preparation Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "resignation-letter-generator", slug: "resignation-letter-generator", name: "Resignation Letter Generator",
    description: "Create a professional resignation letter and handover note with the right level of warmth, brevity, and discretion.",
    icon: "writing-pad", detailEmoji: "🚪", category, displayCreditCost: 3, outputType: "text",
    aliases: ["professional-resignation-letter", "notice-letter-generator"],
    inputs: [
      { id: "employment_context", label: "Employment / Notice Context", type: "textarea", placeholder: "Role, employer, notice period, intended last day, manager name, and any must-include details.", required: true },
      { id: "tone_relationship", label: "Relationship / Tone", type: "select", required: true, options: ["Warm and appreciative", "Neutral professional", "Very concise", "Senior / executive", "Difficult circumstances—minimal detail", "Contract completion"] },
      { id: "handover_context", label: "Handover Context", type: "textarea", placeholder: "Optional projects, responsibilities, transition support, or availability.", required: false },
      { id: "variation_count", label: "Versions", type: "select", required: true, options: variationOptions },
      ...commonTail,
    ],
  },
  {
    id: "freelance-proposal-generator", slug: "freelance-proposal-generator", name: "Freelance Proposal Generator",
    description: "Create a client-specific proposal with problem understanding, approach, deliverables, scope, proof, assumptions, and next steps.",
    icon: "folder", detailEmoji: "📑", category, displayCreditCost: 7, outputType: "text",
    aliases: ["client-proposal-generator", "consulting-proposal-writer"],
    nextActions: [{ label: "Define the scope", href: "/tools/scope-of-work-generator", description: "Turn the approved proposal into a controlled scope of work." }],
    inputs: [
      { id: "client_brief", label: "Client Brief / Opportunity", type: "textarea", placeholder: "Client, problem, goals, audience, context, requested work, deadlines, and decision criteria.", required: true },
      { id: "service_evidence", label: "Your Service / Proof", type: "textarea", placeholder: "Approach, expertise, relevant examples, verified results, differentiators, and available capacity.", required: true },
      { id: "commercial_context", label: "Commercial Context", type: "textarea", placeholder: "Budget or pricing approach, timeline, payment stages, assumptions, revisions, and exclusions.", required: false },
      { id: "proposal_style", label: "Proposal Style", type: "select", required: true, options: ["Concise freelance proposal", "Detailed project proposal", "Consulting proposal", "Agency proposal", "Upwork-style bid", "Executive proposal"] },
      { id: "output_depth", label: "Proposal Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "scope-of-work-generator", slug: "scope-of-work-generator", name: "Scope of Work Generator",
    description: "Define deliverables, exclusions, dependencies, responsibilities, revisions, acceptance, timeline, and change control.",
    icon: "folder", detailEmoji: "📋", category, displayCreditCost: 7, outputType: "text",
    aliases: ["sow-generator", "project-scope-generator"],
    nextActions: [{ label: "Create the onboarding pack", href: "/tools/client-onboarding-kickoff-pack-generator", description: "Turn the scope into a clear client start experience." }],
    inputs: [
      { id: "project_context", label: "Project Context", type: "textarea", placeholder: "Project purpose, client, background, goals, and intended outcome.", required: true },
      { id: "deliverables", label: "Deliverables / Requirements", type: "textarea", placeholder: "Outputs, formats, quantities, milestones, quality expectations, and deadlines.", required: true },
      { id: "commercial_terms", label: "Commercial / Working Terms", type: "textarea", placeholder: "Payment stages, revision limits, communication, client inputs, tools, approvals, and assumptions.", required: false },
      { id: "project_complexity", label: "Project Complexity", type: "select", required: true, options: ["Simple one-off", "Standard multi-deliverable", "Complex phased project", "Ongoing retainer", "Consulting engagement", "Custom"] },
      { id: "output_depth", label: "Scope Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "client-discovery-questionnaire-generator", slug: "client-discovery-questionnaire-generator", name: "Client Discovery Questionnaire Generator",
    description: "Create focused discovery questions covering goals, users, constraints, stakeholders, approvals, budget, risks, and success.",
    icon: "writing-pad", detailEmoji: "🔍", category, displayCreditCost: 5, outputType: "text",
    aliases: ["client-intake-questionnaire", "project-discovery-question-generator"],
    inputs: [
      { id: "service_context", label: "Service / Project Type", type: "textarea", placeholder: "What service you provide, typical deliverables, project complexity, and client type.", required: true },
      { id: "known_context", label: "Known Client Context", type: "textarea", placeholder: "What is already known about the client, project, goals, and risks.", required: false },
      { id: "question_count", label: "Question Count", type: "select", required: true, options: questionCountOptions },
      { id: "questionnaire_stage", label: "Stage", type: "select", required: true, options: ["Pre-qualification", "Discovery call", "Post-sale intake", "Project kickoff", "Strategic workshop", "Complete staged questionnaire"] },
      ...commonTail,
    ],
  },
  {
    id: "client-onboarding-kickoff-pack-generator", slug: "client-onboarding-kickoff-pack-generator", name: "Client Onboarding & Kickoff Pack Generator",
    description: "Create a complete welcome, expectations, access, communication, responsibilities, timeline, FAQ, and kickoff package.",
    icon: "folder", detailEmoji: "🤝", category, displayCreditCost: 9, outputType: "text",
    aliases: ["client-onboarding-pack-generator", "client-kickoff-plan-generator"],
    inputs: [
      { id: "approved_scope", label: "Approved Scope / Project Summary", type: "textarea", placeholder: "Project goals, deliverables, exclusions, timeline, responsibilities, and commercial terms.", required: true },
      { id: "client_team_context", label: "Client / Team Context", type: "textarea", placeholder: "Stakeholders, approvers, communication preferences, systems, access needs, and known risks.", required: true },
      { id: "working_rules", label: "Working Rules", type: "textarea", placeholder: "Response times, meeting cadence, revision rules, channels, file sharing, payment reminders, and escalation path.", required: false },
      { id: "pack_format", label: "Pack Format", type: "select", required: true, options: ["Concise welcome pack", "Detailed onboarding guide", "Agency onboarding", "Freelancer onboarding", "Consulting kickoff", "Complete premium pack"] },
      { id: "output_depth", label: "Pack Depth", type: "select", required: true, options: depthOptions },
      ...commonTail,
    ],
  },
  {
    id: "professional-headshot-generator", slug: "professional-headshot-generator", name: "Professional Headshot Generator",
    description: "Transform an uploaded portrait into a polished identity-preserving professional headshot with premium studio controls.",
    icon: "image", detailEmoji: "📸", category, displayCreditCost: 7,
    aliases: ["ai-professional-headshot", "linkedin-headshot-generator", "corporate-headshot-generator"],
    inputs: [],
  },
];
