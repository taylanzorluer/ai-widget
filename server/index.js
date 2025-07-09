const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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
app.use(express.json());
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
app.get('/api/config', (req, res) => {
  res.json({
    title: process.env.WIDGET_TITLE || 'AI Assistant',
    subtitle: process.env.WIDGET_SUBTITLE || 'How can I help you today?'
  });
});

// Agent configuration endpoint
app.get('/api/agent-config', (req, res) => {
  res.json({
    agentId: process.env.ELEVENLABS_AGENT_ID
  });
});

// Widget configuration cache
let widgetConfigCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Fetch widget config from ElevenLabs
async function fetchWidgetConfig(agentId) {
  try {
    const response = await axios.get(`https://api.elevenlabs.io/v1/convai/agents/${agentId}/widget`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch widget config:', error.response?.data || error.message);
    return null;
  }
}

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
  if (widgetConfigCache && widgetConfigCache[cacheKey] && (now - lastFetchTime) < CACHE_DURATION) {
    return res.json(widgetConfigCache[cacheKey]);
  }
  
  // Fetch new config
  const config = await fetchWidgetConfig(agentId);
  if (config) {
    if (!widgetConfigCache) widgetConfigCache = {};
    widgetConfigCache[cacheKey] = config;
    lastFetchTime = now;
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