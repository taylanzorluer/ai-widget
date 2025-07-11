import React, { useState, useEffect, useRef, useCallback } from 'react';

const ChatWidget = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({ title: 'AI Assistant', subtitle: 'How can I help you today?' });
  // eslint-disable-next-line no-unused-vars
  const [widgetConfig, setWidgetConfig] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [conversationId, setConversationId] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [messageQueue, setMessageQueue] = useState([]); // Queue for messages when disconnected
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isIntentionalDisconnect, setIsIntentionalDisconnect] = useState(false); // Track manual disconnections
  const [isTimeoutDisconnect, setIsTimeoutDisconnect] = useState(false); // Track timeout/network disconnections
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

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

  // Process message queue when connected
  const processMessageQueue = useCallback(() => {
    if (isConnected && wsConnection && messageQueue.length > 0) {
      console.log('Processing message queue:', messageQueue.length, 'messages');
      
      messageQueue.forEach((queuedMessage) => {
        if (wsConnection.readyState === WebSocket.OPEN) {
          console.log('Sending queued message:', queuedMessage.text);
          wsConnection.send(JSON.stringify({
            type: 'user_message',
            text: queuedMessage.text
          }));
        }
      });
      
      // Clear the queue after processing
      setMessageQueue([]);
    }
  }, [isConnected, wsConnection, messageQueue]);

  // Process queue when connection state changes
  useEffect(() => {
    if (isConnected && wsConnection && messageQueue.length > 0) {
      // Add a small delay to ensure WebSocket is fully ready
      setTimeout(() => {
        processMessageQueue();
      }, 500);
    }
  }, [isConnected, wsConnection, messageQueue, processMessageQueue]);

  // Load configuration and establish WebSocket connection on component mount
  useEffect(() => {
    // Get agent ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const agentId = urlParams.get('agentId');
    
    fetchConfig(agentId);
    fetchWidgetConfig(agentId);
    connectWebSocket(agentId);
    fetchEnvironment();
    
    // Listen for messages from parent widget
    const handleMessage = (event) => {
      if (event.data.type === 'DISCONNECT_AND_CLEAR' && event.data.source === 'ai-chat-widget') {
        console.log('Received disconnect message from parent widget');
        setIsIntentionalDisconnect(true); // Mark as intentional before disconnecting
        disconnectWebSocket();
        clearConversationData();
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Cleanup WebSocket on unmount
    return () => {
      console.log('Component unmounting, cleaning up WebSocket...');
      try {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        setIsIntentionalDisconnect(true); // Mark as intentional before cleanup
        disconnectWebSocket();
        window.removeEventListener('message', handleMessage);
        console.log('Component cleanup completed');
      } catch (error) {
        console.error('Error during component cleanup:', error);
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
    if (isReconnecting) {
      console.log('Already reconnecting, skipping...');
      return;
    }

    try {
      setIsReconnecting(true);
      console.log('Attempting to connect WebSocket...');
      
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
        setIsReconnecting(false);
        return;
      }
      
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${finalAgentId}`;
    
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected to ElevenLabs agent:', finalAgentId);
        setIsConnected(true);
        setWsConnection(ws);
        setIsReconnecting(false);
        
        // INIT MESSAGE: conversation_initiation_client_data
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          conversation_config_override: {},
          custom_llm_extra_body: {},
          dynamic_variables: {}
        }));

        // Process any queued messages after connection is established
        setTimeout(() => {
          processMessageQueue();
        }, 500);
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
        setIsReconnecting(false);
        
        // Check if this was an intentional disconnect (manual close)
        if (isIntentionalDisconnect) {
          console.log('Intentional disconnect detected, not attempting to reconnect');
          setMessages(prev => [...prev.filter(msg => msg.id !== 'typing'), {
            id: Date.now(),
            text: 'Sohbet kapatıldı. Yeni sohbet başlatmak için sayfayı yenileyin.',
            sender: 'ai',
            timestamp: new Date().toISOString()
          }]);
          setIsLoading(false);
          return;
        }
        
        // If connection was closed unexpectedly (not by user), show message and allow reconnection
        if (event.code !== 1000 && event.reason !== 'Conversation ended by user') {
          console.log('Unexpected disconnection detected - timeout or network issue');
          setIsTimeoutDisconnect(true);
          setMessages(prev => [...prev.filter(msg => msg.id !== 'typing'), {
            id: Date.now(),
            text: 'Sohbet uzun süre beklemeden sonra kapatıldı. Tekrar başlatmak için lütfen bir şeyler yazınız.',
            sender: 'ai',
            timestamp: new Date().toISOString()
          }]);
          setIsLoading(false);
          
          console.log('Connection will be reestablished when user types');
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setIsReconnecting(false);
        setIsLoading(false);
        
        // Check if this was an intentional disconnect
        if (isIntentionalDisconnect) {
          console.log('Error on intentional disconnect, not attempting to reconnect');
          return;
        }
        
        // Add error message to chat and allow reconnection
        setIsTimeoutDisconnect(true);
        setMessages(prev => [...prev.filter(msg => msg.id !== 'typing'), {
          id: Date.now(),
          text: 'Bağlantı hatası oluştu. Tekrar başlatmak için lütfen bir şeyler yazınız.',
          sender: 'ai',
          timestamp: new Date().toISOString()
        }]);

        console.log('Connection will be reestablished when user types');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
      setIsReconnecting(false);
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
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputMessage;
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

    // Send message or queue it if not connected
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN && isConnected) {
      const messageData = {
        type: 'user_message',
        text: messageText
      };
      wsConnection.send(JSON.stringify(messageData));
      console.log('Message sent immediately:', messageText);
    } else if (isIntentionalDisconnect) {
      console.log('Chat ended, cannot send message');
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      setIsLoading(false);
      
      // Show disconnection message
      const disconnectionMessage = {
        id: Date.now() + 1,
        text: 'Sohbet kapatıldı. Yeni sohbet başlatmak için sayfayı yenileyin.',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, disconnectionMessage]);
    } else {
      console.log('Not connected, queuing message and attempting to connect...');
      
      // If this is a timeout disconnect, reset the timeout state to allow reconnection
      if (isTimeoutDisconnect) {
        console.log('Timeout disconnect detected, resetting state for reconnection');
        setIsTimeoutDisconnect(false);
      }
      
      // Add message to queue
      setMessageQueue(prev => [...prev, { text: messageText, timestamp: new Date().toISOString() }]);
      
      // Remove typing indicator since we're queuing
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      setIsLoading(false);
      
      // Show connection message
      const connectionMessage = {
        id: Date.now() + 1,
        text: 'Bağlanıyor...',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, connectionMessage]);
      
      // Attempt to connect if not already connecting
      if (!isReconnecting) {
        const urlParams = new URLSearchParams(window.location.search);
        const agentId = urlParams.get('agentId');
        connectWebSocket(agentId);
      }
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
    try {
      disconnectWebSocket();
      clearConversationData();
      console.log('Conversation ended successfully');
    } catch (error) {
      console.error('Error ending conversation:', error);
      // Ensure cleanup even if there's an error
      setIsIntentionalDisconnect(true);
      setWsConnection(null);
      setIsConnected(false);
      setIsReconnecting(false);
    }
  };

  const disconnectWebSocket = () => {
    console.log('Manually disconnecting WebSocket...');
    
    // Mark as intentional disconnect first
    setIsIntentionalDisconnect(true);
    
    // Clear any pending reconnection timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsConnection) {
      console.log('Current WebSocket state:', wsConnection.readyState);
      
      // Remove all event listeners to prevent any callbacks
      try {
        wsConnection.onopen = null;
        wsConnection.onmessage = null;
        wsConnection.onclose = null;
        wsConnection.onerror = null;
      } catch (error) {
        console.error('Error removing event listeners:', error);
      }
      
      // Force close regardless of state
      try {
        if (wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.close(1000, 'Conversation ended by user');
        } else if (wsConnection.readyState === WebSocket.CONNECTING) {
          wsConnection.close(1001, 'Connection cancelled by user');
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      
      // Force clear the connection
      setWsConnection(null);
      setIsConnected(false);
      setIsReconnecting(false);
    }
    
    console.log('WebSocket disconnected manually with complete cleanup');
  };

  const clearConversationData = () => {
    console.log('Clearing conversation data...');
    setMessages([]);
    setConversationId(null);
    setIsLoading(false);
    setMessageQueue([]); // Clear message queue
    setIsIntentionalDisconnect(false); // Reset intentional disconnect flag
    setIsTimeoutDisconnect(false); // Reset timeout disconnect flag
    console.log('Conversation data cleared');
  };

  // Get connection status text
  const getConnectionStatusText = () => {
    if (isReconnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    if (messageQueue.length > 0) return `Queued (${messageQueue.length})`;
    return 'Disconnected';
  };

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="header-content">
          <div className="header-info">
            <h2>{config.title}</h2>
            {isDev && (
              <div className="connection-status">
                <span className={`status-dot ${isConnected ? 'connected' : isReconnecting ? 'connecting' : 'disconnected'}`}></span>
                {getConnectionStatusText()}
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
            placeholder={isIntentionalDisconnect ? "Sohbet kapatıldı. Yeni sohbet için sayfayı yenileyin." : isTimeoutDisconnect ? "Bağlantı kesildi. Yazmaya başlayın, otomatik bağlanacak." : isConnected ? "Mesajınızı yazın..." : "Mesajınızı yazın (bağlandığında gönderilecek)..."}
            rows="1"
            disabled={isLoading || isIntentionalDisconnect}
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim() || isIntentionalDisconnect}
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