# Rehab Case Copilot

AI-powered case management platform for rehabilitation consultants managing WorkCover-style cases.

## Features

- **Case Management**: Create and manage rehabilitation cases with comprehensive tracking
- **AI-Powered Interactions**: 
  - Upload audio recordings and get automatic transcriptions via OpenAI Whisper
  - Generate structured summaries with AI
  - Automatic action item extraction
- **Report Generation**: Create professional reports using AI:
  - Progress Reports
  - Return to Work (RTW) Plans
  - Case Conference Minutes
  - Initial Needs Assessments
  - Closure Reports
- **Task Management**: Track action items and follow-ups with automatic extraction from interactions
- **Timeline View**: Chronological view of all case interactions and events

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **AI**: OpenAI API (GPT-4 for summaries/reports, Whisper for transcription)
- **Storage**: Vercel Blob Storage (for audio files)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon account)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chunghaw/rehab_case_copilot.git
cd rehab_case_copilot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgresql_connection_string
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token (optional)
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app
  /(dashboard)
    /cases              # Case management pages
  /api                  # API routes
    /cases              # Case CRUD operations
    /interactions       # Interaction management
    /reports            # Report generation
    /tasks              # Task management
/components
  /cases                # Case-related components
  /interactions         # Interaction components
  /tasks                # Task components
  /reports              # Report components
  /ui                   # shadcn/ui base components
/lib
  /db                   # Database utilities
  /openai.ts            # OpenAI client
  /prompts              # AI prompt templates
/prisma
  schema.prisma         # Database schema
```

## Key Workflows

### Creating a Case
1. Click "New Case" on the cases page
2. Enter worker details, employer, insurer, and key contacts
3. Case appears in the dashboard

### Adding Interactions

**From Text:**
1. Open a case
2. Click "Add Interaction"
3. Select "Paste Text" tab
4. Choose interaction type and add participants
5. Paste content (email, notes, etc.)
6. AI automatically generates summary and extracts action items

**From Audio:**
1. Open a case
2. Click "Add Interaction"
3. Select "Upload Audio" tab
4. Choose interaction type and add participants
5. Upload audio file (MP3, M4A, max 25MB)
6. AI transcribes, summarizes, and extracts action items

### Generating Reports
1. Open a case
2. Click "Generate Report"
3. Select report type (Progress Report, RTW Plan, etc.)
4. Choose tone, length, and audience
5. AI generates draft report from recent interactions
6. Edit and download the report

## Database Schema

- **Case**: Core case information (worker, employer, insurer, contacts)
- **Interaction**: All case interactions (meetings, calls, emails, notes)
- **Task**: Action items and to-dos
- **Report**: Generated reports with controls and content

## AI Behavior

The AI is configured to:
- Maintain professional, objective tone
- Focus on functional impact and work capacity
- Never invent facts or details
- Clearly indicate when information is missing
- Distinguish between subjective reports and objective findings
- Follow WorkCover/WorkSafe Victoria style guidelines

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app will automatically deploy on every push to the main branch.

## Development

### Running Locally
```bash
npm run dev
```

### Type Checking
```bash
npx tsc --noEmit
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

## Security & Privacy

- All AI-generated content is marked as DRAFT
- Users must review before sending to external parties
- OpenAI API key should be kept secure in environment variables
- Database uses separate schema to avoid conflicts with other projects
- Audio files are optionally stored in Vercel Blob (can be configured to process and discard)

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
