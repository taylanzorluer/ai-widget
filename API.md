# 📡 AI Widget API Documentation

Complete API reference for the AI Chat Widget backend services.

## 🚀 Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://your-domain.vercel.app`

## 🔐 Authentication

All API endpoints are public and do not require authentication. ElevenLabs API keys are managed server-side for security.

## 📋 Endpoints Overview

| Method | Endpoint | Description | Cache |
|--------|----------|-------------|-------|
| GET | `/api/config` | Widget configuration | 15 min |
| GET | `/api/widget-config` | Widget styling | 15 min |
| GET | `/api/environment` | Environment info | No cache |
| GET | `/api/health` | Health check | No cache |
| GET | `/widget` | React widget app | Static |
| GET | `/js/widget.js` | Widget loader | Static |

## 🎯 Configuration Endpoints

### `GET /api/config`

Get widget configuration for a specific ElevenLabs agent.

#### **Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | No | ElevenLabs agent ID (e.g., "agent_12345") |

#### **Request Examples**
```bash
# Default agent configuration
curl "http://localhost:3001/api/config"

# Specific agent configuration
curl "http://localhost:3001/api/config?agentId=agent_customer_123"
```

#### **Response**
```json
{
  "title": "AI Assistant",
  "subtitle": "How can I help you today?",
  "agentId": "agent_12345",
  "cached": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### **Response Fields**
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Widget header title |
| `subtitle` | string | Widget header subtitle |
| `agentId` | string | ElevenLabs agent ID used |
| `cached` | boolean | Whether response was cached |
| `timestamp` | string | Response generation time |

#### **Error Responses**
```json
// Invalid agent ID format
{
  "error": "Invalid agent ID format",
  "code": 400
}

// Agent not found
{
  "error": "Agent configuration not found",
  "code": 404,
  "fallback": true
}

// Service unavailable (circuit breaker)
{
  "error": "Service temporarily unavailable",
  "code": 503,
  "fallback": true
}
```

---

### `GET /api/widget-config`

Get widget styling and branding configuration.

#### **Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | No | ElevenLabs agent ID for custom styling |

#### **Request Examples**
```bash
# Default widget styling
curl "http://localhost:3001/api/widget-config"

# Agent-specific styling
curl "http://localhost:3001/api/widget-config?agentId=agent_customer_123"
```

#### **Response**
```json
{
  "primaryColor": "#667eea",
  "secondaryColor": "#764ba2",
  "buttonColor": "#667eea",
  "buttonHoverColor": "#5a6fd8",
  "textColor": "#333333",
  "backgroundColor": "#ffffff",
  "borderRadius": "8px",
  "shadowColor": "rgba(0, 0, 0, 0.15)",
  "fontFamily": "Inter, system-ui, sans-serif",
  "cached": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### **Response Fields**
| Field | Type | Description |
|-------|------|-------------|
| `primaryColor` | string | Primary brand color (hex) |
| `secondaryColor` | string | Secondary brand color (hex) |
| `buttonColor` | string | Widget button color (hex) |
| `buttonHoverColor` | string | Button hover state color (hex) |
| `textColor` | string | Main text color (hex) |
| `backgroundColor` | string | Background color (hex) |
| `borderRadius` | string | Border radius (CSS value) |
| `shadowColor` | string | Shadow color (CSS rgba) |
| `fontFamily` | string | Font family (CSS value) |
| `cached` | boolean | Whether response was cached |
| `timestamp` | string | Response generation time |

---

## 🌍 Environment & Health

### `GET /api/environment`

Get current environment information and feature flags.

#### **Parameters**
None

#### **Request Example**
```bash
curl "http://localhost:3001/api/environment"
```

#### **Response**
```json
{
  "environment": "development",
  "debugMode": true,
  "serverUrl": "http://localhost:3001",
  "version": "1.0.0",
  "features": {
    "connectionStatus": true,
    "debugging": true,
    "detailedLogging": true,
    "errorMessages": true
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### **Response Fields**
| Field | Type | Description |
|-------|------|-------------|
| `environment` | string | Current environment ("development" or "production") |
| `debugMode` | boolean | Whether debug mode is enabled |
| `serverUrl` | string | Server base URL |
| `version` | string | Application version |
| `features` | object | Feature flags by environment |
| `timestamp` | string | Response generation time |

#### **Feature Flags**
| Feature | Development | Production | Description |
|---------|-------------|------------|-------------|
| `connectionStatus` | true | false | Show WebSocket connection status |
| `debugging` | true | false | Enable debug console |
| `detailedLogging` | true | false | Verbose logging |
| `errorMessages` | true | false | Show detailed error messages |

---

### `GET /api/health`

Health check endpoint for monitoring and load balancing.

#### **Parameters**
None

#### **Request Example**
```bash
curl "http://localhost:3001/api/health"
```

#### **Response**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "45.2 MB",
    "total": "128 MB",
    "percentage": 35.3
  },
  "cache": {
    "keys": 150,
    "hits": 1250,
    "misses": 85,
    "hitRate": "93.6%"
  },
  "circuitBreaker": {
    "state": "closed",
    "failures": 0,
    "lastFailure": null,
    "nextAttempt": null
  },
  "performance": {
    "avgResponseTime": "45ms",
    "requestCount": 1335,
    "errorRate": "0.1%"
  }
}
```

#### **Response Fields**
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall health status ("healthy", "degraded", "unhealthy") |
| `timestamp` | string | Health check timestamp |
| `uptime` | number | Server uptime in seconds |
| `memory` | object | Memory usage statistics |
| `cache` | object | Cache performance statistics |
| `circuitBreaker` | object | Circuit breaker status |
| `performance` | object | Performance metrics |

#### **Health Status Values**
- **healthy**: All systems operational
- **degraded**: Some services impacted (circuit breaker open)
- **unhealthy**: Critical systems down

---

## 🎨 Widget Serving

### `GET /widget`

Serves the React widget application as an HTML page.

#### **Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | No | Agent ID passed to React app |

#### **Request Example**
```bash
# Direct widget access
curl "http://localhost:3001/widget"

# With agent ID
curl "http://localhost:3001/widget?agentId=agent_123"
```

#### **Response**
HTML page with React application and embedded configuration.

---

### `GET /js/widget.js`

Serves the widget loader script for embedding.

#### **Parameters**
None

#### **Request Example**
```bash
curl "http://localhost:3001/js/widget.js"
```

#### **Response**
JavaScript file containing the widget loader logic.

#### **Usage**
```html
<!-- Basic embed -->
<script src="http://localhost:3001/js/widget.js"></script>

<!-- With agent ID -->
<script src="http://localhost:3001/js/widget.js" 
        data-agent-id="agent_123"></script>

<!-- With custom server URL -->
<script src="http://localhost:3001/js/widget.js" 
        data-server-url="https://your-domain.com"
        data-agent-id="agent_123"></script>
```

---

## 🔄 Caching

### **Cache Headers**
All cached endpoints include appropriate cache headers:

```http
Cache-Control: public, max-age=900
ETag: "w/\"abc123\""
Last-Modified: Mon, 01 Jan 2024 12:00:00 GMT
```

### **Cache Behavior**
- **TTL**: 15 minutes (900 seconds)
- **Invalidation**: Automatic on TTL expiry
- **Bypass**: Add `?nocache=true` parameter
- **Monitoring**: Cache statistics via `/api/health`

### **Cache Bypass Example**
```bash
# Bypass cache for fresh data
curl "http://localhost:3001/api/config?agentId=agent_123&nocache=true"
```

---

## 🚨 Error Handling

### **Error Response Format**
```json
{
  "error": "Error message",
  "code": 400,
  "details": "Additional error details",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "fallback": false
}
```

### **HTTP Status Codes**
| Code | Description | Example |
|------|-------------|---------|
| 200 | Success | Normal response |
| 400 | Bad Request | Invalid agent ID format |
| 404 | Not Found | Agent configuration not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 503 | Service Unavailable | Circuit breaker open |

### **Rate Limiting**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

- **Limit**: 1000 requests per 15 minutes per IP
- **Headers**: Standard rate limit headers included
- **Behavior**: 429 status when exceeded

---

## 🔧 Development

### **Local Testing**
```bash
# Start server
npm start

# Test endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/config
curl http://localhost:3001/api/environment
```

### **Debug Mode**
```bash
# Enable debug mode
DEBUG_MODE=true npm start

# Check debug info
curl http://localhost:3001/api/environment
```

### **Load Testing**
```bash
# Test with Apache Bench
ab -n 1000 -c 10 http://localhost:3001/api/health

# Test with wrk
wrk -t12 -c400 -d30s http://localhost:3001/api/config
```

---

## 📊 Monitoring

### **Key Metrics**
- Request count and response times
- Cache hit/miss ratios
- Circuit breaker state changes
- Memory usage trends
- Error rates by endpoint

### **Health Check Integration**
```bash
# Kubernetes health check
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

# Load balancer health check
curl -f http://localhost:3001/api/health || exit 1
```

---

## 🔐 Security

### **Input Validation**
- Agent ID format validation
- Query parameter sanitization
- Request size limits
- Content type validation

### **Security Headers**
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### **CORS Policy**
- **Development**: Allow all origins
- **Production**: Configured allowed origins
- **Credentials**: Enabled for authenticated requests

---

## 📝 SDK & Integration

### **JavaScript SDK**
```javascript
// Widget control
window.AIChatWidget.open();
window.AIChatWidget.close();
window.AIChatWidget.toggle();

// Configuration
window.AIChatWidget.configure({
  agentId: 'agent_123',
  position: 'bottom-right'
});
```

### **React Integration**
```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'http://localhost:3001/js/widget.js';
    script.setAttribute('data-agent-id', 'agent_123');
    document.body.appendChild(script);
  }, []);

  return <div>Your app content</div>;
}
```

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/taylanzorluer/ai-widget/issues)
- **Documentation**: [Main README](./README.md)
- **Health Check**: `/api/health` endpoint
- **API Status**: Real-time monitoring via health endpoint

---

**API Documentation v1.0 - Built for enterprise-scale AI chat** 🚀 