# AI Recruitment Agent - Startup Guide

## Prerequisites

- Node.js 18+
- npm
- Redis instance (local or cloud - configured in `.env`)
- Supabase account (configured in `.env`)
- Gemini API key (configured in `.env`)
- n8n instance running on port 5678

## Installation & Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

### 2. Frontend Setup

```bash
cd fe/admin-ats
npm install
```

## Running the Application

### Option 1: Run Both Services (Separate Terminals)

**Terminal 1 - Backend (Port 8080):**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend (Port 3000):**

```bash
cd fe/admin-ats
npm run dev
```

### Option 2: Build for Production

**Build Backend:**

```bash
cd backend
npm run build
npm start
```

**Build Frontend:**

```bash
cd fe/admin-ats
npm run build
npm start
```

## Accessing the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **Health Check:** http://localhost:8080/

## Environment Configuration

Both `.env` files are already configured with:

- ✅ Supabase credentials
- ✅ Gemini API key
- ✅ Redis connection
- ✅ n8n webhook URLs

## Services Running

- **Frontend:** Next.js 16.1.0 on port 3000
- **Backend:** Express API on port 8080
- **Queue System:** BullMQ with Redis
- **Database:** Supabase (PostgreSQL)
- **AI Engine:** Gemini API
- **Workflow:** n8n integration

## Troubleshooting

If you encounter any issues:

1. **Port already in use:**

   - Backend: Change `PORT` in `.env`
   - Frontend: Use `PORT=3001 npm run dev`

2. **Redis connection error:**

   - Check Redis URL in `.env`
   - Ensure Redis is running

3. **Supabase connection error:**

   - Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
   - Check internet connection

4. **n8n webhook error:**
   - Ensure n8n is running on port 5678
   - Update `N8N_WEBHOOK_URL` if needed

## API Endpoints

- `GET /` - Health check
- `POST /api/candidates` - Upload candidate CV
- `GET /api/candidates` - List candidates
- `GET /api/candidates/:id` - Get candidate details
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - List jobs
- `POST /api/ai/analyze` - Analyze CV with AI
- `POST /api/webhook` - n8n webhook endpoint
- `GET /api/statistics` - Get recruitment statistics

## Database Setup

Run the SQL migrations if starting fresh:

```bash
# In Supabase SQL editor, run:
# - database_schema.sql (initial setup)
# - advanced-recruitment-migration.sql (enhancements)
```

---

**Ready to go!** Your AI Recruitment Agent is now ready to run. 🚀
