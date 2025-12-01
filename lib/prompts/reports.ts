/**
 * Prompt templates for generating various report types
 */

export const SYSTEM_PROMPT = `You are a professional rehabilitation consultant writing reports for WorkCover-style schemes (similar to WorkSafe Victoria, Australia).

Core Principles:
- Professional, objective, and non-judgmental tone
- Focus on functional impact and work capacity
- Distinguish between subjective reports ("worker reported...") and objective findings ("on assessment...")
- Use information provided only - never invent facts, dates, diagnoses, or names
- Clearly indicate when information is missing
- Maintain confidentiality and appropriate professional boundaries

Report Structure:
- Use clear headings and subheadings
- Separate worker-reported information, employer-reported information, and treating practitioner opinions
- Focus on work capacity and return to work (RTW) planning
- Include specific, measurable recommendations

Tone Guidelines:
- "neutral": Standard professional reporting
- "supportive": Emphasize worker wellbeing and gradual progression
- "assertive": Focus on clear expectations and timelines

Length Guidelines:
- "short": Brief summary, key points only (1-2 pages)
- "standard": Comprehensive but concise (2-4 pages)
- "extended": Detailed with extensive background (4+ pages)

Audience Guidelines:
- "insurer-focused": Emphasize case management, costs, RTW timeline
- "employer-focused": Emphasize workplace duties, accommodations, supervision needs
- "worker-friendly": Accessible language, emphasis on support and rehabilitation
- "mixed": Balanced for multiple stakeholders`;

export interface CaseContext {
  workerName: string;
  claimNumber: string;
  insurerName: string;
  employerName: string;
  keyContacts: {
    insurer_case_manager?: string;
    employer_contact?: string;
    gp?: string;
    specialist?: string;
    physio?: string;
  };
  currentCapacitySummary?: string;
}

export interface InteractionData {
  dateTime: string;
  type: string;
  aiSummary?: string;
  participants: string[];
}

export interface ReportControls {
  tone: 'neutral' | 'supportive' | 'assertive';
  length: 'short' | 'standard' | 'extended';
  audience: 'insurer-focused' | 'employer-focused' | 'worker-friendly' | 'mixed';
}

// ============================================================================
// Progress Report Template
// ============================================================================
export function buildProgressReportPrompt(
  caseContext: CaseContext,
  interactions: InteractionData[],
  controls: ReportControls
): string {
  const interactionsSummary = interactions
    .map((i) => `${i.dateTime} - ${i.type}: ${i.aiSummary || 'No summary available'}`)
    .join('\n\n');

  return `Generate a Progress Report for this WorkCover case.

CASE INFORMATION:
Worker: ${caseContext.workerName}
Claim Number: ${caseContext.claimNumber}
Insurer: ${caseContext.insurerName}
Employer: ${caseContext.employerName}
Current Capacity: ${caseContext.currentCapacitySummary || 'Not specified'}

KEY CONTACTS:
${JSON.stringify(caseContext.keyContacts, null, 2)}

RECENT INTERACTIONS (last 4-6 weeks):
${interactionsSummary}

REPORT REQUIREMENTS:
- Tone: ${controls.tone}
- Length: ${controls.length}
- Audience: ${controls.audience}

REQUIRED SECTIONS:
1. Background and Claim Overview
2. Recent Events & Treatment Progress
3. Current Work Capacity and Restrictions
4. Return to Work Status and Duties
5. Barriers to RTW and Strategies
6. Recommendations and Next Steps

Generate the report in Markdown format with clear headings.
Use professional Australian English spelling and terminology.
Base all content on the information provided above - do not invent details.`;
}

// ============================================================================
// RTW Plan Template
// ============================================================================
export function buildRTWPlanPrompt(
  caseContext: CaseContext,
  interactions: InteractionData[],
  controls: ReportControls
): string {
  const interactionsSummary = interactions
    .map((i) => `${i.dateTime} - ${i.type}: ${i.aiSummary || 'No summary available'}`)
    .join('\n\n');

  return `Generate a Return to Work (RTW) Plan for this WorkCover case.

CASE INFORMATION:
Worker: ${caseContext.workerName}
Claim Number: ${caseContext.claimNumber}
Insurer: ${caseContext.insurerName}
Employer: ${caseContext.employerName}
Current Capacity: ${caseContext.currentCapacitySummary || 'Not specified'}

KEY CONTACTS:
${JSON.stringify(caseContext.keyContacts, null, 2)}

RELEVANT INTERACTIONS:
${interactionsSummary}

REPORT REQUIREMENTS:
- Tone: ${controls.tone}
- Length: ${controls.length}
- Audience: ${controls.audience}

REQUIRED SECTIONS:
1. Pre-Injury Role and Duties
2. Current Medical Restrictions and Capacity
3. Proposed Graded Return to Work Plan
   - Timeline (e.g., Week 1-2, Week 3-4, etc.)
   - Hours per day/week
   - Specific duties at each stage
   - Restrictions and modifications
4. Monitoring and Review Process
5. Workplace Support Requirements
6. Contingencies and Risk Management

Generate the plan in Markdown format with clear headings and a table for the graded return timeline.
Base all content on the information provided - do not invent details.`;
}

// ============================================================================
// Case Conference Minutes Template
// ============================================================================
export function buildCaseConferencePrompt(
  caseContext: CaseContext,
  interaction: InteractionData,
  controls: ReportControls
): string {
  return `Generate Case Conference Minutes for this WorkCover case.

CASE INFORMATION:
Worker: ${caseContext.workerName}
Claim Number: ${caseContext.claimNumber}
Insurer: ${caseContext.insurerName}
Employer: ${caseContext.employerName}

CONFERENCE DETAILS:
Date/Time: ${interaction.dateTime}
Type: ${interaction.type}
Participants: ${interaction.participants.join(', ')}

CONFERENCE SUMMARY:
${interaction.aiSummary || 'No summary available'}

REPORT REQUIREMENTS:
- Tone: ${controls.tone}
- Length: ${controls.length}
- Audience: ${controls.audience}

REQUIRED SECTIONS:
1. Meeting Details (date, time, participants with roles)
2. Purpose of Meeting
3. Issues Discussed
4. Decisions Made
5. Agreed Actions (with responsibilities and timeframes)
6. Next Steps and Follow-up

Generate the minutes in Markdown format with clear headings.
Format agreed actions as a table with columns: Action, Responsible Party, Due Date.
Base all content on the information provided.`;
}

// ============================================================================
// Closure Report Template
// ============================================================================
export function buildClosureReportPrompt(
  caseContext: CaseContext,
  interactions: InteractionData[],
  controls: ReportControls
): string {
  const interactionsSummary = interactions
    .map((i) => `${i.dateTime} - ${i.type}: ${i.aiSummary || 'No summary available'}`)
    .join('\n\n');

  return `Generate a Case Closure Report for this WorkCover case.

CASE INFORMATION:
Worker: ${caseContext.workerName}
Claim Number: ${caseContext.claimNumber}
Insurer: ${caseContext.insurerName}
Employer: ${caseContext.employerName}

KEY CONTACTS:
${JSON.stringify(caseContext.keyContacts, null, 2)}

CASE HISTORY:
${interactionsSummary}

REPORT REQUIREMENTS:
- Tone: ${controls.tone}
- Length: ${controls.length}
- Audience: ${controls.audience}

REQUIRED SECTIONS:
1. Case Summary and Background
2. Services Provided (timeline of key interventions)
3. Outcomes Achieved
4. Final Work Capacity and Status
5. Barriers Addressed
6. Recommendations for Future
7. Reason for Closure

Generate the report in Markdown format with clear headings.
Focus on outcomes, value provided, and measurable progress.
Base all content on the information provided.`;
}

