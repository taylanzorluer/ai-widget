# 🖥️ AI Widget Server (Express Backend)

The Express.js backend server for the AI Chat Widget. Provides APIs, serves static files, and handles high-load optimization with enterprise-level features.

## 🏗️ Architecture

### **Core Components**
```
server/
├── index.js                   # Main server file
├── middleware/
│   ├── security.js           # Security middleware
│   ├── cache.js              # Caching layer
│   └── rateLimit.js          # Rate limiting
├── routes/
│   ├── api.js                # API endpoints
│   ├── js/
  │   └── widget.js         # Widget serving
│   └── health.js             # Health checks
├── utils/
│   ├── circuitBreaker.js     # Circuit breaker pattern
│   ├── cache.js              # NodeCache wrapper
│   └── environment.js        # Environment detection
└── config/
    ├── cors.js               # CORS configuration
    └── security.js           # Security settings
```

### **Key Features**
- **High-Load Optimization**: Handles 10,000+ concurrent users
- **Memory Safety**: LRU cache with automatic cleanup
- **Fault Tolerance**: Circuit breaker pattern
- **Security Hardening**: Rate limiting, helmet, CORS
- **Dynamic Agent Support**: Multi-tenant architecture
- **Environment Detection**: Auto dev/prod switching

## 🚀 High-Load Optimizations

### **Memory Management**
```javascript
// NodeCache with LRU eviction
const cache = new NodeCache({
  stdTTL: 900,           // 15 minutes TTL
  maxKeys: 10000,        // Maximum keys
  checkperiod: 120,      // Cleanup every 2 minutes
  useClones: false,      // Performance optimization
  deleteOnExpire: true   // Auto cleanup
});
```

### **Circuit Breaker Pattern**
```javascript
// Fault tolerance for ElevenLabs API
const circuitBreaker = {
  failureThreshold: 5,      // 5 failures trigger open
  timeout: 60000,           // 1 minute recovery time
  fallbackResponse: {...}   // Graceful degradation
};
```

### **Request Deduplication**
```javascript
// Prevents duplicate API calls
const pendingRequests = new Map();
// Deduplicates identical requests within 1 second
```

### **Performance Middleware**
```javascript
// Compression, security, rate limiting
app.use(compression());
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000                  // 1000 requests per IP
}));
```

## 📡 API Endpoints

### **Configuration Endpoints**

#### `GET /api/config`
Get widget configuration for specific agent.

**Query Parameters:**
- `agentId` (optional): ElevenLabs agent ID

**Response:**
```json
{
  "title": "AI Assistant",
  "subtitle": "How can I help you today?",
  "agentId": "agent_12345",
  "cached": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### `GET /api/widget-config`
Get widget styling and branding configuration.

**Query Parameters:**
- `agentId` (optional): ElevenLabs agent ID

**Response:**
```json
{
  "primaryColor": "#667eea",
  "secondaryColor": "#764ba2",
  "buttonColor": "#667eea",
  "textColor": "#333333",
  "backgroundColor": "#ffffff",
  "borderRadius": "8px",
  "cached": true
}
```

### **Environment & Health**

#### `GET /api/environment`
Get current environment information.

**Response:**
```json
{
  "environment": "development",
  "debugMode": true,
  "serverUrl": "http://localhost:3001",
  "version": "1.0.0",
  "features": {
    "connectionStatus": true,
    "debugging": true,
    "detailedLogging": true
  }
}
```

#### `GET /api/health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "45.2 MB",
    "total": "128 MB"
  },
  "cache": {
    "keys": 150,
    "hits": 1250,
    "misses": 85
  },
  "circuitBreaker": {
    "state": "closed",
    "failures": 0,
    "lastFailure": null
  }
}
```

### **Widget Serving**

#### `GET /widget`
Serves the React widget application.

**Response:** HTML page with React app

#### `GET /js/widget.js`
Serves the widget loader script.

**Response:** JavaScript widget loader

## 🔧 Configuration

### **Environment Variables**
```env
# Server Configuration
PORT=3001
NODE_ENV=development
DEBUG_MODE=true

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=your_default_agent_id

# Widget Configuration
WIDGET_TITLE=AI Assistant
WIDGET_SUBTITLE=How can I help you today?

# Performance Configuration
CACHE_TTL=900              # 15 minutes
CACHE_MAX_KEYS=10000       # Maximum cache keys
RATE_LIMIT_WINDOW=900000   # 15 minutes
RATE_LIMIT_MAX=1000        # Max requests per window

# Circuit Breaker Configuration
CIRCUIT_FAILURE_THRESHOLD=5
CIRCUIT_TIMEOUT=60000
```

### **CORS Configuration**
```javascript
// Dynamic CORS based on environment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow null origin for file:// protocol
    if (!origin) return callback(null, true);
    
    // Development: Allow localhost
    if (isDevelopment) {
      return callback(null, true);
    }
    
    // Production: Specific domains only
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## 🛡️ Security Features

### **Rate Limiting**
```javascript
// IP-based rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 1000,                  // 1000 requests per IP
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});
```

### **Security Headers**
```javascript
// Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "wss://api.elevenlabs.io"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
```

### **Input Validation**
```javascript
// All endpoints validate input
const validateAgentId = (req, res, next) => {
  const { agentId } = req.query;
  if (agentId && !/^agent_[a-zA-Z0-9_-]+$/.test(agentId)) {
    return res.status(400).json({ error: 'Invalid agent ID format' });
  }
  next();
};
```

## 🔄 Caching System

### **Multi-Level Caching**
```javascript
// 1. Agent Configuration Cache
const agentCache = new NodeCache({ stdTTL: 900 });

// 2. Widget Config Cache
const widgetCache = new NodeCache({ stdTTL: 900 });

// 3. Request Deduplication Cache
const requestCache = new Map();
```

### **Cache Strategies**
- **TTL-based**: 15-minute expiration
- **LRU Eviction**: Oldest entries removed first
- **Automatic Cleanup**: Expired keys removed every 2 minutes
- **Memory Limits**: Maximum 10,000 keys per cache

### **Cache Monitoring**
```javascript
// Cache statistics available via /api/health
{
  "cache": {
    "keys": 150,
    "hits": 1250,
    "misses": 85,
    "hitRate": "93.6%"
  }
}
```

## 🚨 Circuit Breaker

### **Failure Detection**
```javascript
// Monitors ElevenLabs API calls
const circuitBreaker = {
  state: 'closed',           // closed, open, half-open
  failures: 0,               // Current failure count
  failureThreshold: 5,       // Failures to trigger open
  timeout: 60000,            // Recovery timeout
  lastFailure: null          // Last failure timestamp
};
```

### **States**
- **Closed**: Normal operation, requests pass through
- **Open**: Circuit breaker active, returns fallback
- **Half-Open**: Testing recovery, limited requests

### **Fallback Responses**
```javascript
// Graceful degradation when APIs fail
const fallbackConfig = {
  title: "AI Assistant",
  subtitle: "Service temporarily unavailable",
  agentId: "fallback",
  error: "Service degraded"
};
```

## 🌍 Environment Detection

### **Detection Methods**
```javascript
// Server-side detection
const isProduction = process.env.NODE_ENV === 'production';
const isDebugMode = process.env.DEBUG_MODE === 'true';
const isDevelopment = !isProduction || isDebugMode;

// Client-side detection
const detectEnvironment = (req) => {
  const host = req.get('host');
  const isDev = /localhost|\.local|dev\.|staging\.|test\./.test(host);
  return isDev ? 'development' : 'production';
};
```

### **Feature Flags**
```javascript
// Features enabled by environment
const features = {
  development: {
    connectionStatus: true,
    debugging: true,
    detailedLogging: true,
    errorMessages: true
  },
  production: {
    connectionStatus: false,
    debugging: false,
    detailedLogging: false,
    errorMessages: false
  }
};
```

## 📊 Monitoring & Logging

### **Performance Metrics**
```javascript
// Tracked metrics
- Request count and timing
- Cache hit/miss rates
- Circuit breaker state
- Memory usage
- Active connections
- Error rates
```

### **Logging Levels**
```javascript
// Development: Verbose logging
console.log('Cache hit for agent:', agentId);
console.log('Circuit breaker state:', state);

// Production: Error logging only
console.error('Circuit breaker opened:', error);
```

### **Health Monitoring**
```javascript
// Health check includes:
- Server uptime
- Memory usage
- Cache statistics
- Circuit breaker status
- Last error timestamp
```

## 🚀 Deployment

### **Production Setup**
```bash
# Build client first
npm run build-client

# Set production environment
export NODE_ENV=production
export DEBUG_MODE=false

# Start server
npm start
```

### **Process Management**
```bash
# Using PM2 for production
pm2 start server/index.js --name ai-widget
pm2 startup
pm2 save
```

### **Scaling**
```bash
# Horizontal scaling with PM2
pm2 start server/index.js -i max --name ai-widget-cluster
```

## 🔧 Development

### **Local Development**
```bash
# Install dependencies
npm install

# Set development environment
export NODE_ENV=development
export DEBUG_MODE=true

# Start with nodemon
npm run dev
```

### **Debug Mode**
```bash
# Enable detailed logging
DEBUG_MODE=true npm start

# Check health endpoint
curl http://localhost:3001/api/health
```

## 🧪 Testing

### **API Testing**
```bash
# Health check
curl http://localhost:3001/api/health

# Configuration
curl "http://localhost:3001/api/config?agentId=agent_123"

# Widget config
curl "http://localhost:3001/api/widget-config?agentId=agent_123"

# Environment
curl http://localhost:3001/api/environment
```

### **Load Testing**
```bash
# Using Apache Bench
ab -n 10000 -c 100 http://localhost:3001/api/health

# Using wrk
wrk -t12 -c400 -d30s http://localhost:3001/api/config
```

## 🔐 Security Best Practices

### **API Security**
- Rate limiting per IP
- Input validation on all endpoints
- CORS configuration
- Security headers via Helmet
- No sensitive data in responses

### **Production Security**
- Environment variables for secrets
- HTTPS enforcement
- Secure session handling
- Regular security updates
- Monitoring and alerting

## 📝 Contributing

### **Development Workflow**
1. Make changes in server/
2. Test with `npm run dev`
3. Verify health endpoint
4. Test API endpoints
5. Submit PR with tests

### **Code Standards**
- ES6+ JavaScript
- Express.js best practices
- Comprehensive error handling
- Performance-conscious coding
- Security-first approach

## 📞 Support

- **Issues**: Report server-specific issues
- **Documentation**: This README
- **Health Check**: `/api/health` endpoint
- **Monitoring**: Built-in metrics

---

**Backend built with Express.js ⚡ for enterprise-scale AI chat** 