# AI Chat Widget with ElevenLabs TTS

A white-label AI chat widget that integrates with ElevenLabs' text-to-speech API. The widget is embeddable into any website with a single script tag and provides a modern, responsive chat interface with audio playback capabilities.

## Features

- 🤖 **AI Chat Interface**: Modern React-based chat UI with typing indicators
- 🔊 **Text-to-Speech**: ElevenLabs TTS integration for AI responses
- 🎨 **White-label**: Fully customizable branding and styling
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔒 **Secure**: All API keys stored server-side
- 🚀 **Easy Integration**: Single script tag installation
- ⚙️ **Configurable**: Customizable position, size, and appearance

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Website       │    │   Widget.js     │    │   React App     │
│   (Client)      │◄──►│   (Loader)      │◄──►│   (Iframe)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Express       │
                       │   Server        │
                       │   (Backend)     │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   ElevenLabs    │
                       │   TTS API       │
                       └─────────────────┘
```

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd ai-chat-widget
npm install
cd client && npm install
cd ..
```

### 2. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` with your ElevenLabs API key:

```env
PORT=3001
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
WIDGET_TITLE=AI Assistant
WIDGET_SUBTITLE=How can I help you today?
```

### 3. Build and Run

```bash
# Build the React client
npm run build-client

# Start the server
npm start
```

The server will run on `http://localhost:3001`

### 4. Embed the Widget

Add this single script tag to any website:

```html
<script src="http://localhost:3001/widget.js"></script>
```

## AI Integration

### ElevenLabs Conversational AI Agent

The system now uses ElevenLabs' Conversational AI Agent for intelligent responses. Features include:

- **Intelligent Conversations**: Powered by ElevenLabs' AI model
- **Conversation Continuity**: Maintains context across messages
- **Multilingual Support**: Responds in Turkish and English
- **Customizable Personality**: Configurable system prompt
- **Voice Integration**: Seamless TTS for all responses

### Configuration

Set up your ElevenLabs AI Agent in the `.env` file:

```env
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
ELEVENLABS_AGENT_ID=your_agent_id_here
```

### Setting Up Your Agent

1. Go to [ElevenLabs Console](https://console.elevenlabs.io/)
2. Create or select your Conversational AI Agent
3. Configure the agent's personality, knowledge, and behavior
4. Copy the Agent ID from the agent settings
5. Add the Agent ID to your `.env` file

```env
# Example Agent Configuration
ELEVENLABS_API_KEY=sk-your-api-key-here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_AGENT_ID=agent-id-from-elevenlabs-console
```

## Customization

### Widget Configuration

Modify the `WIDGET_CONFIG` object in `public/widget.js`:

```javascript
const WIDGET_CONFIG = {
  serverUrl: window.location.origin,
  width: 400,                    // Widget width
  height: 600,                   // Widget height
  position: 'bottom-right',      // Position: bottom-right, bottom-left, top-right, top-left
  zIndex: 999999,               // Z-index for layering
  buttonSize: 60,               // Toggle button size
  buttonColor: '#667eea',       // Button color
  buttonHoverColor: '#5a6fd8',  // Button hover color
  borderRadius: '50%',          // Button border radius
  shadow: '0 4px 20px rgba(0, 0, 0, 0.15)', // Shadow style
  animationDuration: '0.3s'     // Animation speed
};
```

### Styling

Customize the appearance by modifying `client/src/index.css`:

- Colors and gradients
- Typography
- Animations
- Layout spacing

### Server Configuration

Environment variables for customization:

- `WIDGET_TITLE`: Widget header title
- `WIDGET_SUBTITLE`: Widget header subtitle
- `ELEVENLABS_VOICE_ID`: ElevenLabs voice ID for TTS

## API Endpoints

### POST `/api/chat`
Send a message to the AI and get a response.

**Request:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "response": "Hello! I'm doing well, thank you for asking.",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST `/api/tts`
Convert text to speech using ElevenLabs.

**Request:**
```json
{
  "text": "Hello, this is a test message."
}
```

**Response:** Audio file (MP3)

### GET `/api/config`
Get widget configuration.

**Response:**
```json
{
  "title": "AI Assistant",
  "subtitle": "How can I help you today?"
}
```

## JavaScript API

The widget exposes a global `AIChatWidget` object for programmatic control:

```javascript
// Open the widget
AIChatWidget.open();

// Close the widget
AIChatWidget.close();

// Toggle the widget
AIChatWidget.toggle();

// Check if widget is open
const isOpen = AIChatWidget.isOpen();
```

## Production Deployment

### 1. Build for Production

```bash
npm run build-client
```

### 2. Environment Setup

Set production environment variables:

```env
NODE_ENV=production
PORT=3001
ELEVENLABS_API_KEY=your_production_key
ELEVENLABS_VOICE_ID=your_voice_id
```

### 3. Deploy

Deploy the entire project to your server. The server will serve both the API and the static files.

### 4. Update Embed URL

Update the embed script URL to your production domain:

```html
<script src="https://yourdomain.com/widget.js"></script>
```

## Security Considerations

- All API keys are stored server-side in environment variables
- CORS is configured for cross-origin requests
- Input validation on all endpoints
- Rate limiting recommended for production use

## Troubleshooting

### Widget Not Loading
- Check if the server is running
- Verify the script URL is correct
- Check browser console for errors

### TTS Not Working
- Verify ElevenLabs API key is valid
- Check voice ID exists in your account
- Ensure sufficient API credits

### Chat Not Responding
- Check server logs for errors
- Verify the built-in AI responses are working
- Test API endpoints directly

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository. 