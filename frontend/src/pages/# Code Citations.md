# Code Citations

## License: unknown
https://github.com/Zombie1995/how-to-deploy-on-vk-cloud/blob/d40ef6fe9a99a1fe54c47186211dcc94baea229f/how-to-deploy-on-vk-cloud.tex

```
You currently have `.env` set to `ENVIRONMENT=production` / `DEBUG=false`, but your `docker-compose.yml` still uses dev Dockerfiles and `npm run dev`. There are **no production Dockerfiles** in your project yet.

Here's the full stepwise process to properly run in production:

---

### Step 1 — Create `backend/Dockerfile` (production)
Create a new file `backend/Dockerfile` (separate from `Dockerfile.dev`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main_saas:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
Differences from dev: no `--reload`, 4 workers instead of 1.

---

### Step 2 — Create `frontend/Dockerfile` (production)
Create a new file `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
```


## License: unknown
https://github.com/Zombie1995/how-to-deploy-on-vk-cloud/blob/d40ef6fe9a99a1fe54c47186211dcc94baea229f/how-to-deploy-on-vk-cloud.tex

```
You currently have `.env` set to `ENVIRONMENT=production` / `DEBUG=false`, but your `docker-compose.yml` still uses dev Dockerfiles and `npm run dev`. There are **no production Dockerfiles** in your project yet.

Here's the full stepwise process to properly run in production:

---

### Step 1 — Create `backend/Dockerfile` (production)
Create a new file `backend/Dockerfile` (separate from `Dockerfile.dev`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main_saas:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
Differences from dev: no `--reload`, 4 workers instead of 1.

---

### Step 2 — Create `frontend/Dockerfile` (production)
Create a new file `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
```


## License: unknown
https://github.com/Zombie1995/how-to-deploy-on-vk-cloud/blob/d40ef6fe9a99a1fe54c47186211dcc94baea229f/how-to-deploy-on-vk-cloud.tex

```
You currently have `.env` set to `ENVIRONMENT=production` / `DEBUG=false`, but your `docker-compose.yml` still uses dev Dockerfiles and `npm run dev`. There are **no production Dockerfiles** in your project yet.

Here's the full stepwise process to properly run in production:

---

### Step 1 — Create `backend/Dockerfile` (production)
Create a new file `backend/Dockerfile` (separate from `Dockerfile.dev`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main_saas:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
Differences from dev: no `--reload`, 4 workers instead of 1.

---

### Step 2 — Create `frontend/Dockerfile` (production)
Create a new file `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
```


## License: unknown
https://github.com/Zombie1995/how-to-deploy-on-vk-cloud/blob/d40ef6fe9a99a1fe54c47186211dcc94baea229f/how-to-deploy-on-vk-cloud.tex

```
You currently have `.env` set to `ENVIRONMENT=production` / `DEBUG=false`, but your `docker-compose.yml` still uses dev Dockerfiles and `npm run dev`. There are **no production Dockerfiles** in your project yet.

Here's the full stepwise process to properly run in production:

---

### Step 1 — Create `backend/Dockerfile` (production)
Create a new file `backend/Dockerfile` (separate from `Dockerfile.dev`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main_saas:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
Differences from dev: no `--reload`, 4 workers instead of 1.

---

### Step 2 — Create `frontend/Dockerfile` (production)
Create a new file `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
```


## License: unknown
https://github.com/Zombie1995/how-to-deploy-on-vk-cloud/blob/d40ef6fe9a99a1fe54c47186211dcc94baea229f/how-to-deploy-on-vk-cloud.tex

```
You currently have `.env` set to `ENVIRONMENT=production` / `DEBUG=false`, but your `docker-compose.yml` still uses dev Dockerfiles and `npm run dev`. There are **no production Dockerfiles** in your project yet.

Here's the full stepwise process to properly run in production:

---

### Step 1 — Create `backend/Dockerfile` (production)
Create a new file `backend/Dockerfile` (separate from `Dockerfile.dev`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main_saas:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
Differences from dev: no `--reload`, 4 workers instead of 1.

---

### Step 2 — Create `frontend/Dockerfile` (production)
Create a new file `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
```


## License: unknown
https://github.com/Zombie1995/how-to-deploy-on-vk-cloud/blob/d40ef6fe9a99a1fe54c47186211dcc94baea229f/how-to-deploy-on-vk-cloud.tex

```
You currently have `.env` set to `ENVIRONMENT=production` / `DEBUG=false`, but your `docker-compose.yml` still uses dev Dockerfiles and `npm run dev`. There are **no production Dockerfiles** in your project yet.

Here's the full stepwise process to properly run in production:

---

### Step 1 — Create `backend/Dockerfile` (production)
Create a new file `backend/Dockerfile` (separate from `Dockerfile.dev`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main_saas:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
Differences from dev: no `--reload`, 4 workers instead of 1.

---

### Step 2 — Create `frontend/Dockerfile` (production)
Create a new file `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
```


## License: unknown
https://github.com/Zombie1995/how-to-deploy-on-vk-cloud/blob/d40ef6fe9a99a1fe54c47186211dcc94baea229f/how-to-deploy-on-vk-cloud.tex

```
You currently have `.env` set to `ENVIRONMENT=production` / `DEBUG=false`, but your `docker-compose.yml` still uses dev Dockerfiles and `npm run dev`. There are **no production Dockerfiles** in your project yet.

Here's the full stepwise process to properly run in production:

---

### Step 1 — Create `backend/Dockerfile` (production)
Create a new file `backend/Dockerfile` (separate from `Dockerfile.dev`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main_saas:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
Differences from dev: no `--reload`, 4 workers instead of 1.

---

### Step 2 — Create `frontend/Dockerfile` (production)
Create a new file `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
```


## License: unknown
https://github.com/Zombie1995/how-to-deploy-on-vk-cloud/blob/d40ef6fe9a99a1fe54c47186211dcc94baea229f/how-to-deploy-on-vk-cloud.tex

```
You currently have `.env` set to `ENVIRONMENT=production` / `DEBUG=false`, but your `docker-compose.yml` still uses dev Dockerfiles and `npm run dev`. There are **no production Dockerfiles** in your project yet.

Here's the full stepwise process to properly run in production:

---

### Step 1 — Create `backend/Dockerfile` (production)
Create a new file `backend/Dockerfile` (separate from `Dockerfile.dev`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main_saas:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
Differences from dev: no `--reload`, 4 workers instead of 1.

---

### Step 2 — Create `frontend/Dockerfile` (production)
Create a new file `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
```

