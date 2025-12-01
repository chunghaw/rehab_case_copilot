import { openai } from '../openai';
import {
  SYSTEM_PROMPT,
  CaseContext,
  InteractionData,
  ReportControls,
  buildProgressReportPrompt,
  buildRTWPlanPrompt,
  buildCaseConferencePrompt,
  buildClosureReportPrompt,
} from './reports';

export type ReportType =
  | 'PROGRESS_REPORT'
  | 'RTW_PLAN'
  | 'CASE_CONFERENCE'
  | 'INITIAL_NEEDS_ASSESSMENT'
  | 'CLOSURE';

// ============================================================================
// Main report generation function
// ============================================================================
export async function generateReport(
  reportType: ReportType,
  caseContext: CaseContext,
  interactions: InteractionData[],
  controls: ReportControls,
  extraContext?: string
): Promise<string> {
  let userPrompt: string;

  switch (reportType) {
    case 'PROGRESS_REPORT':
      userPrompt = buildProgressReportPrompt(caseContext, interactions, controls, extraContext);
      break;
    case 'RTW_PLAN':
      userPrompt = buildRTWPlanPrompt(caseContext, interactions, controls, extraContext);
      break;
    case 'CASE_CONFERENCE':
      if (interactions.length === 0) {
        throw new Error('Case conference report requires at least one interaction');
      }
      userPrompt = buildCaseConferencePrompt(caseContext, interactions[0], controls, extraContext);
      break;
    case 'CLOSURE':
      userPrompt = buildClosureReportPrompt(caseContext, interactions, controls, extraContext);
      break;
    case 'INITIAL_NEEDS_ASSESSMENT':
      // Similar to progress report but focused on initial assessment
      userPrompt = buildProgressReportPrompt(caseContext, interactions, controls, extraContext).replace(
        'Progress Report',
        'Initial Needs Assessment'
      );
      break;
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.4,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate report');
  }
}

