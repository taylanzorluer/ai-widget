import React, { useState, useEffect, useRef } from 'react';

const ChatWidget = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({ title: 'AI Assistant', subtitle: 'How can I help you today?' });
  const [widgetConfig, setWidgetConfig] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Environment detection function
  const isDevelopment = () => {
    // Check multiple indicators for development environment
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // Development indicators
    const devHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
    const devPorts = ['3000', '3001', '8080', '5000', '4200'];
    const isDevHost = devHosts.includes(hostname);
    const isDevPort = devPorts.includes(port);
    const isFileProtocol = protocol === 'file:';
    
    // Check for development environment variables (if available)
    const isReactDev = process.env.NODE_ENV === 'development';
    
    // Check for development URL patterns
    const isDevUrl = hostname.includes('.local') || 
                     hostname.includes('dev.') || 
                     hostname.includes('staging.') ||
                     hostname.includes('test.');
    
    // Return true if any development indicator is found
    return isReactDev || isDevHost || isDevPort || isFileProtocol || isDevUrl;
  };

  // Fetch environment info from server
  const fetchEnvironment = async () => {
    try {
      const response = await fetch('/api/environment');
      const envData = await response.json();
      setIsDev(envData.isDevelopment || isDevelopment());
      console.log('Environment:', envData);
    } catch (error) {
      // Fallback to client-side detection
      setIsDev(isDevelopment());
      console.log('Using client-side environment detection');
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load configuration and establish WebSocket connection on component mount
  useEffect(() => {
    // Get agent ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const agentId = urlParams.get('agentId');
    
    fetchConfig(agentId);
    fetchWidgetConfig(agentId);
    connectWebSocket(agentId);
    fetchEnvironment();
    
    // Cleanup WebSocket on unmount
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
    // eslint-disable-next-line
  }, []);

  const fetchConfig = async (agentId) => {
    try {
      let url = '/api/config';
      if (agentId) {
        url += `?agentId=${encodeURIComponent(agentId)}`;
      }
      
      const response = await fetch(url);
      const configData = await response.json();
      setConfig(configData);
      console.log('Widget config loaded:', configData);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const fetchWidgetConfig = async (agentId) => {
    try {
      let url = '/api/widget-config';
      if (agentId) {
        url += `?agentId=${encodeURIComponent(agentId)}`;
      }
      
      const response = await fetch(url);
      const widgetData = await response.json();
      setWidgetConfig(widgetData);
      
      // Apply dynamic styles
      if (widgetData.widget_config) {
        applyDynamicStyles(widgetData.widget_config);
      }
    } catch (error) {
      console.error('Failed to load widget config:', error);
    }
  };

  const applyDynamicStyles = (config) => {
    const root = document.documentElement;
    
    // Apply colors
    if (config.bg_color) root.style.setProperty('--widget-bg-color', config.bg_color);
    if (config.text_color) root.style.setProperty('--widget-text-color', config.text_color);
    if (config.btn_color) root.style.setProperty('--widget-btn-color', config.btn_color);
    if (config.btn_text_color) root.style.setProperty('--widget-btn-text-color', config.btn_text_color);
    if (config.border_color) root.style.setProperty('--widget-border-color', config.border_color);
    if (config.focus_color) root.style.setProperty('--widget-focus-color', config.focus_color);
    
    // Apply avatar colors if available
    if (config.avatar?.color_1) root.style.setProperty('--widget-avatar-color-1', config.avatar.color_1);
    if (config.avatar?.color_2) root.style.setProperty('--widget-avatar-color-2', config.avatar.color_2);
  };

  const connectWebSocket = async (agentId) => {
    try {
      // Use agent ID from parameter, fallback to backend config if not provided
      let finalAgentId = agentId;
      
      if (!finalAgentId) {
        const configResponse = await fetch('/api/agent-config');
        const configData = await configResponse.json();
        finalAgentId = configData.agentId;
      }
      
      if (!finalAgentId) {
        console.error('No agent ID available');
        setIsConnected(false);
        return;
      }
      
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${finalAgentId}`;
    
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected to ElevenLabs agent:', finalAgentId);
        setIsConnected(true);
        setWsConnection(ws);
        // INIT MESSAGE: conversation_initiation_client_data
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          conversation_config_override: {},
          custom_llm_extra_body: {},
          dynamic_variables: {}
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setWsConnection(null);
        
        // If connection was closed unexpectedly (not by user), show message
        if (event.code !== 1000 && event.reason !== 'Conversation ended by user') {
          console.log('Unexpected disconnection detected');
          setMessages(prev => [...prev.filter(msg => msg.id !== 'typing'), {
            id: Date.now(),
            text: 'Connection lost. Please refresh the page to reconnect.',
            sender: 'ai',
            timestamp: new Date().toISOString()
          }]);
          setIsLoading(false);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setIsLoading(false);
        
        // Add error message to chat
        setMessages(prev => [...prev.filter(msg => msg.id !== 'typing'), {
          id: Date.now(),
          text: 'Connection error occurred. Please check your internet connection and refresh the page.',
          sender: 'ai',
          timestamp: new Date().toISOString()
        }]);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    console.log('Received WebSocket message:', data);
    // AI cevabını agent_response event'inden al
    if (data.type === 'agent_response') {
      const aiMessage = {
        id: Date.now(),
        text: data.agent_response_event.agent_response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev.filter(msg => msg.id !== 'typing'), aiMessage]);
      setIsLoading(false);
      
      // Return focus to input after AI response
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else if (data.type === 'conversation_id') {
      setConversationId(data.conversation_id);
    } else if (data.type === 'error') {
      console.error('Agent error:', data.error);
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || isLoading || !isConnected) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    // Keep focus on input after sending message
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    // Add typing indicator
    const typingMessage = {
      id: 'typing',
      text: '',
      sender: 'typing',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, typingMessage]);

    // Send user_message event
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      const messageData = {
        type: 'user_message',
        text: userMessage.text
      };
      wsConnection.send(JSON.stringify(messageData));
    } else {
      console.error('WebSocket not connected');
      setIsLoading(false);
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Connection lost. Please refresh the page.',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endConversation = () => {
    console.log('Ending conversation...');
    
    // Send conversation termination to ElevenLabs if connected
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      try {
        // Send conversation end message to ElevenLabs
        wsConnection.send(JSON.stringify({
          type: 'conversation_end',
          conversation_id: conversationId
        }));
        
        console.log('Conversation termination message sent');
        
        // Give some time for the message to be sent, then close
        setTimeout(() => {
          if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            wsConnection.close(1000, 'Conversation ended by user');
          }
        }, 100);
      } catch (error) {
        console.error('Error sending conversation end message:', error);
        // Force close if there's an error
        wsConnection.close(1000, 'Conversation ended by user');
      }
    }
    
    // Reset all conversation state
    setMessages([]);
    setConversationId(null);
    setIsConnected(false);
    setWsConnection(null);
    setIsLoading(false);
    
    console.log('Conversation ended and state reset');
  };

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="header-content">
          <div className="header-info">
            <h2>{config.title}</h2>
            {isDev && (
              <div className="connection-status">
                <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            )}
          </div>
          <button className="end-conversation-btn" onClick={endConversation} title="End Conversation">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            {message.sender === 'typing' ? (
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            ) : (
              message.text
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-container">
          <textarea
            ref={inputRef}
            className="input-field"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows="1"
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
          >
            <svg className="send-icon" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget; 