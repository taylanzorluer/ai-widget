# 🚀 AI Widget Deployment Guide

Complete deployment guide for the AI Chat Widget across different platforms and environments.

## 📋 Pre-Deployment Checklist

### **Prerequisites**
- [ ] Node.js 18+ installed
- [ ] ElevenLabs API key and agent ID
- [ ] Git repository set up
- [ ] Environment variables configured
- [ ] Client built for production

### **Build Steps**
```bash
# 1. Install dependencies
npm install

# 2. Build React client
npm run build-client

# 3. Test production build locally
NODE_ENV=production npm start
```

### **Environment Variables**
```env
# Required
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=your_default_agent_id

# Optional
PORT=3001
NODE_ENV=production
DEBUG_MODE=false
WIDGET_TITLE=AI Assistant
WIDGET_SUBTITLE=How can I help you today?
```

## 🌐 Vercel Deployment (Recommended)

### **Why Vercel?**
- ✅ Zero-configuration deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ GitHub integration
- ✅ Environment variable management
- ✅ Automatic scaling

### **Step-by-Step Deployment**

#### **1. GitHub Setup**
```bash
# Push to GitHub
git add .
git commit -m "Production ready"
git push origin main
```

#### **2. Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure project settings

#### **3. Environment Variables**
In Vercel dashboard:
```
ELEVENLABS_API_KEY → your_api_key_here
ELEVENLABS_AGENT_ID → your_default_agent_id
NODE_ENV → production
DEBUG_MODE → false
```

#### **4. Build Settings**
```json
{
  "buildCommand": "npm run build-client",
  "outputDirectory": "client/build",
  "installCommand": "npm install"
}
```

#### **5. Deploy**
- Click "Deploy"
- Wait for build completion
- Access your widget at `https://your-project.vercel.app`

#### **6. Custom Domain (Optional)**
```bash
# In Vercel dashboard
1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS records
4. Enable HTTPS
```

### **Embed Code**
```html
<!-- Production embed -->
<script src="https://your-project.vercel.app/js/widget.js" 
        data-agent-id="your_agent_id"></script>
```

---

## 🔧 Heroku Deployment

### **Setup**
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-widget-app
```

### **Configuration**
```bash
# Set environment variables
heroku config:set ELEVENLABS_API_KEY=your_api_key
heroku config:set ELEVENLABS_AGENT_ID=your_agent_id
heroku config:set NODE_ENV=production
heroku config:set DEBUG_MODE=false
```

### **Procfile**
```
web: npm start
```

### **Package.json Scripts**
```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "npm run build-client",
    "heroku-postbuild": "npm run build-client"
  }
}
```

### **Deploy**
```bash
# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Open app
heroku open
```

---

## ☁️ AWS Deployment

### **AWS Elastic Beanstalk**

#### **Setup**
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create production
```

#### **Configuration**
`.ebextensions/environment.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    DEBUG_MODE: false
    ELEVENLABS_API_KEY: your_api_key
    ELEVENLABS_AGENT_ID: your_agent_id
```

#### **Deploy**
```bash
# Deploy
eb deploy

# Check status
eb status
```

### **AWS Lambda + API Gateway**

#### **Setup**
```bash
# Install Serverless
npm install -g serverless

# Create serverless.yml
```

#### **serverless.yml**
```yaml
service: ai-widget

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    ELEVENLABS_API_KEY: ${env:ELEVENLABS_API_KEY}
    ELEVENLABS_AGENT_ID: ${env:ELEVENLABS_AGENT_ID}

functions:
  app:
    handler: server/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

#### **Lambda Handler**
```javascript
// server/lambda.js
const serverless = require('serverless-http');
const app = require('./index');

module.exports.handler = serverless(app);
```

#### **Deploy**
```bash
# Deploy
serverless deploy
```

---

## 🐳 Docker Deployment

### **Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build client
RUN npm run build-client

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
```

### **docker-compose.yml**
```yaml
version: '3.8'
services:
  ai-widget:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DEBUG_MODE=false
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - ELEVENLABS_AGENT_ID=${ELEVENLABS_AGENT_ID}
    restart: unless-stopped
```

### **Build and Run**
```bash
# Build image
docker build -t ai-widget .

# Run container
docker run -p 3001:3001 \
  -e ELEVENLABS_API_KEY=your_key \
  -e ELEVENLABS_AGENT_ID=your_agent \
  ai-widget

# Or use docker-compose
docker-compose up -d
```

---

## 🖥️ VPS/Dedicated Server

### **Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install nginx
```

### **Application Setup**
```bash
# Clone repository
git clone https://github.com/your-username/ai-widget.git
cd ai-widget

# Install dependencies
npm install

# Build client
npm run build-client

# Create environment file
cp env.example .env
# Edit .env with your values
```

### **PM2 Configuration**
```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-widget',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      DEBUG_MODE: 'false',
      PORT: 3001
    }
  }]
};
```

### **Start Application**
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/ai-widget
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Enable Site**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ai-widget /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **SSL Certificate**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

---

## 📊 Production Monitoring

### **Health Monitoring**
```bash
# PM2 monitoring
pm2 monit

# System monitoring
htop
df -h
free -h
```

### **Log Management**
```bash
# PM2 logs
pm2 logs ai-widget

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **Performance Monitoring**
```javascript
// Add to server/index.js
const monitoring = {
  requests: 0,
  errors: 0,
  startTime: Date.now()
};

app.use((req, res, next) => {
  monitoring.requests++;
  next();
});
```

---

## 🔐 Security Configuration

### **Environment Security**
```bash
# Secure file permissions
chmod 600 .env

# Use environment variables
export ELEVENLABS_API_KEY=your_key
export ELEVENLABS_AGENT_ID=your_agent
```

### **Firewall Setup**
```bash
# UFW configuration
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### **SSL/TLS Configuration**
```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
```

---

## 🚀 Performance Optimization

### **Caching Headers**
```javascript
// Add to server
app.use(express.static('client/build', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));
```

### **Compression**
```javascript
// Already implemented
const compression = require('compression');
app.use(compression());
```

### **CDN Integration**
```javascript
// CloudFlare, AWS CloudFront, etc.
const CDN_URL = process.env.CDN_URL || '';
```

---

## 🔄 CI/CD Pipeline

### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build client
        run: npm run build-client
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### **Auto-Deploy Script**
```bash
#!/bin/bash
# deploy.sh

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build client
npm run build-client

# Restart application
pm2 restart ai-widget

echo "Deployment completed!"
```

---

## 🧪 Testing Deployment

### **Health Check**
```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test widget endpoint
curl https://your-domain.com/api/config
```

### **Load Testing**
```bash
# Install artillery
npm install -g artillery

# Create test config
# artillery.yml
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/api/health"
```

### **Run Tests**
```bash
# Run load test
artillery run artillery.yml

# Monitor during test
watch curl -s https://your-domain.com/api/health
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **Build Failures**
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install

# Check Node version
node --version
npm --version
```

#### **Memory Issues**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Monitor memory usage
pm2 monit
```

#### **Port Conflicts**
```bash
# Check port usage
lsof -i :3001

# Kill process
kill -9 <PID>
```

### **Debug Mode**
```bash
# Enable debug mode
DEBUG_MODE=true npm start

# Check logs
pm2 logs ai-widget --lines 100
```

---

## 📞 Support

### **Deployment Support**
- **Issues**: [GitHub Issues](https://github.com/taylanzorluer/ai-widget/issues)
- **Documentation**: [Main README](./README.md)
- **API Reference**: [API Documentation](./API.md)

### **Platform-Specific Help**
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **Heroku**: [Heroku Dev Center](https://devcenter.heroku.com/)
- **AWS**: [AWS Documentation](https://docs.aws.amazon.com/)

---

**Deployment Guide v1.0 - Scale your AI chat widget globally** 🌍 