# Laptop Setup Guide - Intern-Galing Platform

## 📋 Prerequisites

1. Docker Desktop installed and running
2. The `internship-images.tar` file (1.4GB)
3. Access to Supabase credentials

## 🚀 Setup Steps

### Step 1: Load Docker Images

```bash
# Load the pre-built images
docker load -i internship-images.tar

# Verify images are loaded
docker images | grep internship-platform
```

You should see:
- `internship-platform-frontend:latest`
- `internship-platform-backend:latest`
- `internship-platform-document-service:latest`
- `internship-platform-ai-service:latest`

### Step 2: Clone or Copy Project Files

**Option A - Using Git:**
```bash
git clone https://github.com/rimurutachi/internship-platform.git
cd internship-platform
```

**Option B - Copy from USB:**
Copy the entire project folder (excluding `node_modules/`, `.next/`, and `internship-images.tar`)

### Step 3: Setup Environment Variables

Create `.env` files in the root directory for Docker Compose to use:

#### Create `.env` file in project root:

```bash
# Copy this to: internship-platform/.env

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Frontend Supabase (Public Keys)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# JWT Secret (can be any random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Backend WebSocket URL for frontend
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:6000
```

### Step 4: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` ⚠️ (Keep this secret!)

4. Navigate to **Settings** → **Database**
5. Copy **Connection String** (URI format) → `DATABASE_URL`

### Step 5: Run Docker Compose

```bash
# Make sure you're in the project root directory
cd internship-platform

# Start all services
docker-compose up -d

# Check if containers are running
docker-compose ps
```

Expected output:
```
NAME                                    STATUS    PORTS
internship-platform-frontend-1          running   0.0.0.0:3000->3000/tcp
internship-platform-backend-1           running   0.0.0.0:5000->5000/tcp
internship-platform-document-service-1  running   0.0.0.0:6000-6001->6000-6001/tcp
internship-platform-ai-service-1        running   0.0.0.0:8000->8000/tcp
internship-platform-redis-1             running   0.0.0.0:6379->6379/tcp
```

### Step 6: Verify Services

```bash
# Check backend logs
docker-compose logs backend

# Check frontend logs
docker-compose logs frontend

# Check all logs
docker-compose logs -f
```

### Step 7: Access the Platform

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Document Service**: http://localhost:6000
- **AI Service**: http://localhost:8000

## 🔧 Troubleshooting

### Backend crashes with "Missing required environment variables"

**Solution**: Make sure `.env` file exists in the project root with all Supabase credentials.

```bash
# Check if .env file exists
ls -la | grep .env

# Verify environment variables are loaded
docker-compose config
```

### Frontend works but can't connect to backend

**Solution**: Check if backend container is running:

```bash
docker-compose ps backend
docker-compose logs backend
```

Restart backend:
```bash
docker-compose restart backend
```

### Port already in use

**Solution**: Stop the conflicting service or change ports in `docker-compose.yml`

```bash
# Find what's using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Stop all containers and restart
docker-compose down
docker-compose up -d
```

### Redis connection issues

**Solution**: Make sure Redis container is running:

```bash
docker-compose logs redis
docker-compose restart redis
```

### Database connection failed

**Solution**: Verify `DATABASE_URL` in `.env` file:
- Check password is correct
- Check project reference is correct
- Check network connectivity to Supabase

## 🛑 Stopping Services

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

## 📦 Updating Images

If you need to rebuild images with code changes:

```bash
# Pull latest code
git pull origin develop

# Rebuild specific service
docker-compose build backend

# Rebuild all services
docker-compose build

# Run with rebuilt images
docker-compose up -d
```

## 💾 Backup Important Data

Before major changes, backup:

```bash
# Export current database (from Supabase dashboard)
# Backup .env file
# Backup any uploaded documents
```

## 🆘 Common Commands

```bash
# View all running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs for specific service
docker-compose logs [service-name]

# Follow logs in real-time
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart [service-name]

# Execute command inside container
docker-compose exec backend sh

# Check resource usage
docker stats
```

## ✅ Checklist

Before running `docker-compose up`:

- [ ] Docker Desktop is running
- [ ] Images loaded (`docker images | grep internship-platform`)
- [ ] Project files copied/cloned
- [ ] `.env` file created in project root
- [ ] Supabase credentials added to `.env`
- [ ] `DATABASE_URL` configured
- [ ] `JWT_SECRET` set
- [ ] Ports 3000, 5000, 6000, 6001, 8000, 6379 are free

---

**Need help?** Check the logs first:
```bash
docker-compose logs -f
```

The error messages will guide you to the missing configuration! 🚀
