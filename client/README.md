# 🎨 AI Widget Client (React Frontend)

The React frontend application for the AI Chat Widget. This is the user interface that runs inside the iframe when the widget is embedded on websites.

## 🏗️ Architecture

### **Component Structure**
```
src/
├── components/
│   ├── ChatWidget.js          # Main widget container
│   ├── ChatMessage.js         # Individual message component
│   ├── ChatInput.js           # Message input field
│   ├── VoiceButton.js         # Voice controls
│   └── ConnectionStatus.js    # WebSocket status indicator
├── hooks/
│   ├── useWebSocket.js        # WebSocket connection logic
│   ├── useEnvironment.js      # Environment detection
│   └── useAgentConfig.js      # Agent configuration
├── utils/
│   ├── api.js                 # API communication
│   ├── websocket.js           # WebSocket utilities
│   └── environment.js         # Environment detection
├── styles/
│   ├── index.css              # Main styles
│   └── widget.css             # Widget-specific styles
└── App.js                     # Root component
```

### **Key Features**
- **WebSocket Integration**: Real-time chat with ElevenLabs
- **Dynamic Agent Support**: Multi-tenant agent configuration
- **Environment Detection**: Dev/prod mode switching
- **Voice Integration**: TTS playback controls
- **Responsive Design**: Mobile and desktop optimized
- **Memory Management**: Proper cleanup and state management

## 🚀 Development Setup

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Parent server running on port 3001

### **Installation**
```bash
# From project root
cd client
npm install
```

### **Development Server**
```bash
# Start development server
npm start

# Runs on http://localhost:3000
# But widget is accessed via server at http://localhost:3001/widget
```

### **Build for Production**
```bash
# Build static files
npm run build

# Output goes to build/ directory
# Server serves these files from /widget endpoint
```

## 🎯 Component Details

### **ChatWidget.js**
Main container component that manages:
- WebSocket connection lifecycle
- Message state management
- Agent configuration loading
- Environment detection
- Cleanup on unmount

```javascript
// Key features:
- useWebSocket hook for connection management
- useAgentConfig for dynamic agent support
- useEnvironment for dev/prod detection
- PostMessage communication with parent
```

### **ChatMessage.js**
Individual message display with:
- Message type handling (user/assistant)
- Voice playback controls
- Timestamp formatting
- Loading states

### **ChatInput.js**
Message input component featuring:
- Send button with loading state
- Enter key submission
- Input validation
- Character limits

### **VoiceButton.js**
Voice control component with:
- Play/pause functionality
- Loading states
- Audio progress indication
- Error handling

### **ConnectionStatus.js**
Development-only component showing:
- WebSocket connection status
- Environment information
- Debug information
- Only visible in development mode

## 🔌 WebSocket Integration

### **Connection Management**
```javascript
// useWebSocket hook handles:
- Connection establishment
- Message sending/receiving
- Error handling
- NO automatic reconnection (prevents cost escalation)
- Proper cleanup with complete socket termination
```

### **Socket Connection Lifecycle**
```javascript
// Connection States:
1. CONNECTING → Attempting to establish connection
2. OPEN → Connected and ready to send/receive messages
3. CLOSING → Connection is being closed
4. CLOSED → Connection terminated (manual or error)

// Termination Policy:
- Manual close (X button): Immediate termination, no reconnection
- Parent widget close: Complete cleanup, no reconnection
- Network error: Graceful termination, no reconnection
- Component unmount: Full cleanup, no reconnection
```

### **Message Flow**
1. User sends message via ChatInput
2. Message sent through WebSocket
3. ElevenLabs processes via agent
4. Response received and displayed
5. TTS audio automatically played

### **Disconnect Handling**
```javascript
// Multiple disconnect methods:
1. Internal X button → disconnect + clear + keep widget open + NO reconnection
2. External close button → disconnect + clear + hide widget + NO reconnection
3. Component unmount → automatic cleanup + NO reconnection
4. Connection loss → disconnect + clear + NO reconnection (requires page refresh)
```

### **⚠️ Important: No Automatic Reconnection**
```javascript
// New behavior (prevents excessive costs):
- Once disconnected (manually or by error), NO automatic reconnection
- User must refresh the page to start a new conversation
- This prevents continuous reconnection attempts and reduces costs
- Clear messaging informs users to refresh for new conversations
```

## 🌍 Environment Detection

### **Client-Side Detection**
```javascript
// Automatic detection based on:
- window.location.hostname
- URL patterns (localhost, .local, dev., staging.)
- Protocol (file://, http://, https://)
- Port numbers
```

### **Features by Environment**
- **Development**: Debug info, connection status, detailed logging
- **Production**: Clean UI, minimal logging, optimized performance

## 🎨 Styling System

### **CSS Architecture**
```css
/* Base styles */
index.css - Global styles, typography, base colors

/* Widget-specific */
widget.css - Widget container, positioning, animations

/* Component styles */
Inline styles for component-specific styling
```

### **Responsive Design**
- Mobile-first approach
- Breakpoints: 768px, 1024px
- Touch-friendly controls
- Adaptive text sizing

### **Theme System**
- Dynamic colors from agent configuration
- CSS custom properties for theming
- Dark/light mode support
- Brand color inheritance

## 🔧 Configuration

### **Agent Configuration**
```javascript
// Dynamic agent loading:
- Agent ID from URL params
- Configuration from /api/config endpoint
- Caching for performance
- Fallback to default agent
```

### **Environment Variables**
```javascript
// Available in React:
REACT_APP_API_URL - API endpoint override
REACT_APP_DEBUG - Debug mode flag
REACT_APP_VERSION - Build version
```

## 🧪 Testing

### **Test Commands**
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **Test Structure**
```
src/__tests__/
├── components/
│   ├── ChatWidget.test.js
│   ├── ChatMessage.test.js
│   └── ChatInput.test.js
├── hooks/
│   ├── useWebSocket.test.js
│   └── useEnvironment.test.js
└── utils/
    ├── api.test.js
    └── websocket.test.js
```

## 🚀 Performance Optimizations

### **React Optimizations**
- **React.memo**: Prevent unnecessary re-renders
- **useCallback**: Memoize event handlers
- **useMemo**: Memoize expensive calculations
- **Lazy Loading**: Code splitting for large components

### **Memory Management**
- **WebSocket Cleanup**: Proper connection termination
- **Event Listeners**: Cleanup on unmount
- **Timers**: Clear intervals and timeouts
- **State Reset**: Clear data on disconnect

### **Bundle Optimization**
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Dynamic imports
- **Minification**: Compressed production builds
- **Gzip Compression**: Server-side compression

## 📡 API Integration

### **API Endpoints Used**
```javascript
// Configuration
GET /api/config?agentId=${agentId}
GET /api/widget-config?agentId=${agentId}
GET /api/environment

// Health Check
GET /api/health
```

### **WebSocket Endpoints**
```javascript
// ElevenLabs WebSocket
wss://api.elevenlabs.io/v1/convai/conversation
```

## 🔐 Security Considerations

### **Client-Side Security**
- **Input Validation**: All user inputs validated
- **XSS Prevention**: Sanitized HTML output
- **CORS Compliance**: Proper origin handling
- **Secure Communication**: HTTPS in production

### **Data Protection**
- **No API Keys**: All keys stored server-side
- **Message Encryption**: WebSocket SSL/TLS
- **Session Management**: Secure session handling
- **Privacy**: No persistent user data storage

## 🐛 Debugging

### **Development Tools**
```javascript
// Available in development:
- Connection status indicator
- Console debugging
- WebSocket message logging
- Performance metrics
- Error boundaries
```

### **Debug Commands**
```javascript
// Browser console:
window.AIChatWidget.debug() // Show debug info
window.AIChatWidget.getState() // Get current state
window.AIChatWidget.clearCache() // Clear cache
```

### **Troubleshooting Connection Issues**
```javascript
// Common Issues and Solutions:

1. "Chat ended" message appears:
   - Expected behavior after close button or connection loss
   - Solution: Refresh the page to start new conversation

2. Input field disabled:
   - Occurs when chat is intentionally ended
   - Solution: Refresh the page to re-enable

3. No reconnection after network error:
   - Intentional behavior to prevent cost escalation
   - Solution: Refresh the page to reconnect

4. Multiple connection attempts:
   - Check for proper cleanup in endConversation()
   - Ensure isIntentionalDisconnect flag is set correctly
```

## 📦 Build Process

### **Build Steps**
1. **Dependency Installation**: npm install
2. **Code Compilation**: Babel transpilation
3. **Bundle Creation**: Webpack bundling
4. **Asset Optimization**: Image/CSS optimization
5. **Output Generation**: Static files to build/

### **Build Configuration**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

## 🔄 Deployment

### **Production Build**
```bash
# From project root
npm run build-client

# Builds to client/build/
# Server serves from /widget endpoint
```

### **Static File Serving**
- Built files served by Express server
- Gzip compression enabled
- Cache headers for performance
- CDN-ready static assets

## 📝 Contributing

### **Development Workflow**
1. Make changes in src/
2. Test with `npm start`
3. Build with `npm run build`
4. Test integration with parent server
5. Submit PR with tests

### **Code Standards**
- ES6+ JavaScript
- React Hooks (no class components)
- Functional programming principles
- Comprehensive error handling
- Performance-conscious coding

## 📞 Support

- **Issues**: Report client-specific issues
- **Documentation**: This README
- **Testing**: Use development server for testing
- **Integration**: Test with parent server

---

**Frontend built with React ⚛️ for seamless AI chat experiences** 