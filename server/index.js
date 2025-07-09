const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow embedding in iframes
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limiting for config endpoints
const configLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: 'Too many config requests, please slow down.',
});
app.use(['/api/config', '/api/widget-config'], configLimiter);

// Initialize caches with TTL and size limits
const agentConfigCache = new NodeCache({ 
  stdTTL: 15 * 60, // 15 minutes
  maxKeys: 1000,   // Max 1000 different agents
  checkperiod: 60  // Check for expired keys every 60 seconds
});

const widgetConfigCache = new NodeCache({ 
  stdTTL: 15 * 60, // 15 minutes
  maxKeys: 1000,   // Max 1000 different agents
  checkperiod: 60
});

// Request deduplication for ElevenLabs API calls
const pendingRequests = new Map();

// Circuit breaker for ElevenLabs API
let circuitBreakerState = {
  failures: 0,
  lastFailTime: 0,
  isOpen: false
};
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

// Check if circuit breaker should be opened
function shouldOpenCircuitBreaker() {
  const now = Date.now();
  if (circuitBreakerState.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    if (now - circuitBreakerState.lastFailTime < CIRCUIT_BREAKER_TIMEOUT) {
      circuitBreakerState.isOpen = true;
      return true;
    } else {
      // Reset circuit breaker after timeout
      circuitBreakerState.failures = 0;
      circuitBreakerState.isOpen = false;
    }
  }
  return false;
}

// Fetch widget config from ElevenLabs with deduplication and circuit breaker
async function fetchWidgetConfig(agentId) {
  // Check circuit breaker
  if (shouldOpenCircuitBreaker()) {
    console.log('Circuit breaker is open, skipping ElevenLabs API call');
    return null;
  }

  const requestKey = `widget_${agentId}`;
  
  // Check if request is already pending (deduplication)
  if (pendingRequests.has(requestKey)) {
    console.log('Request already pending, waiting for result...');
    return await pendingRequests.get(requestKey);
  }

  // Create new request promise
  const requestPromise = (async () => {
    try {
      const response = await axios.get(`https://api.elevenlabs.io/v1/convai/agents/${agentId}/widget`, {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Reset circuit breaker on success
      circuitBreakerState.failures = 0;
      circuitBreakerState.isOpen = false;
      
      return response.data;
    } catch (error) {
      // Increment failure count
      circuitBreakerState.failures++;
      circuitBreakerState.lastFailTime = Date.now();
      
      console.error('Failed to fetch widget config:', error.response?.data || error.message);
      return null;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(requestKey);
    }
  })();

  // Store pending request
  pendingRequests.set(requestKey, requestPromise);
  
  return await requestPromise;
}

// Fetch agent config with deduplication and circuit breaker
async function fetchAgentConfig(agentId) {
  // Check circuit breaker
  if (shouldOpenCircuitBreaker()) {
    console.log('Circuit breaker is open, skipping ElevenLabs API call');
    return null;
  }

  const requestKey = `agent_${agentId}`;
  
  // Check if request is already pending (deduplication)
  if (pendingRequests.has(requestKey)) {
    console.log('Agent request already pending, waiting for result...');
    return await pendingRequests.get(requestKey);
  }

  // Create new request promise
  const requestPromise = (async () => {
    try {
      const response = await axios.get(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Reset circuit breaker on success
      circuitBreakerState.failures = 0;
      circuitBreakerState.isOpen = false;
      
      return response.data;
    } catch (error) {
      // Increment failure count
      circuitBreakerState.failures++;
      circuitBreakerState.lastFailTime = Date.now();
      
      console.error('Failed to fetch agent config:', error.response?.data || error.message);
      return null;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(requestKey);
    }
  })();

  // Store pending request
  pendingRequests.set(requestKey, requestPromise);
  
  return await requestPromise;
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or file:// protocol)
    if (!origin) return callback(null, true);
    
    // Allow all origins for development
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Serve the React app
app.use('/widget', express.static(path.join(__dirname, '../client/build')));



// WebSocket-based chat - no longer needed as we use direct WebSocket connection
app.post('/api/chat', (req, res) => {
  res.json({
    message: 'This endpoint is deprecated. Use WebSocket connection instead.',
    timestamp: new Date().toISOString()
  });
});

// Widget configuration endpoint
app.get('/api/config', async (req, res) => {
  const agentId = req.query.agentId || process.env.ELEVENLABS_AGENT_ID;
  
  // Default config
  let config = {
    title: process.env.WIDGET_TITLE || 'AI Assistant',
    subtitle: process.env.WIDGET_SUBTITLE || 'How can I help you today?'
  };
  
  // If agent ID is provided, try to get title from ElevenLabs
  if (agentId) {
    const now = Date.now();
    const cacheKey = `agent_config_${agentId}`;
    
    // Check cache first
    if (agentConfigCache.get(cacheKey)) {
      const cachedConfig = agentConfigCache.get(cacheKey);
      config.title = cachedConfig.title;
      config.subtitle = cachedConfig.subtitle;
      console.log('Using cached agent config:', { title: config.title, subtitle: config.subtitle });
      return res.json(config);
    }
    
    try {
      const agentData = await fetchAgentConfig(agentId);
      
      if (agentData) {
        // Use agent name as title if available
        if (agentData.name) {
          config.title = agentData.name;
        }
        
        // Use agent description as subtitle if available
        if (agentData.description) {
          config.subtitle = agentData.description;
        }
        
        // Cache the result
        agentConfigCache.set(cacheKey, { title: config.title, subtitle: config.subtitle });
        
        console.log('Agent config loaded and cached:', { title: config.title, subtitle: config.subtitle });
      }
    } catch (error) {
      console.error('Failed to process agent config:', error.message);
      // Continue with default config
    }
  }
  
  res.json(config);
});

// Agent configuration endpoint
app.get('/api/agent-config', (req, res) => {
  res.json({
    agentId: process.env.ELEVENLABS_AGENT_ID
  });
});

// Widget configuration endpoint with caching
app.get('/api/widget-config', async (req, res) => {
  const agentId = req.query.agentId || process.env.ELEVENLABS_AGENT_ID;
  
  if (!agentId) {
    return res.status(400).json({ 
      error: 'Agent ID is required. Please provide agentId in query parameter or set ELEVENLABS_AGENT_ID environment variable.' 
    });
  }
  
  const now = Date.now();
  const cacheKey = `widget_config_${agentId}`;
  
  // Check if cache is valid (15 minutes)
  if (widgetConfigCache.get(cacheKey)) {
    return res.json(widgetConfigCache.get(cacheKey));
  }
  
  // Fetch new config
  const config = await fetchWidgetConfig(agentId);
  if (config) {
    widgetConfigCache.set(cacheKey, config);
    res.json(config);
  } else {
    // Fallback to default config
    res.json({
      agent_id: agentId,
      widget_config: {
        bg_color: '#ffffff',
        text_color: '#000000',
        btn_color: '#000000',
        btn_text_color: '#ffffff',
        border_color: '#e1e1e1',
        focus_color: '#000000',
        avatar: {
          type: 'orb',
          color_1: '#333333',
          color_2: '#666666'
        },
        first_message: 'Merhaba! Size nasıl yardımcı olabilirim?'
      }
    });
  }
});

// Environment detection endpoint
app.get('/api/environment', (req, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.DEBUG_MODE === 'true' ||
                        process.env.PORT === '3001';
  
  res.json({ 
    isDevelopment,
    environment: process.env.NODE_ENV || 'production',
    debugMode: process.env.DEBUG_MODE === 'true'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection status endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'WebSocket-based chat widget is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Widget available at: http://localhost:${PORT}/widget`);
  console.log(`Test page: http://localhost:${PORT}/test.html`);
  console.log(`Example page: http://localhost:${PORT}/example.html`);
  console.log(`Embed script: <script src="http://localhost:${PORT}/widget.js"></script>`);
}); 