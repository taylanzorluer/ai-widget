(function() {
  'use strict';

  // Get server URL and agent ID from script tag data attributes
  function getWidgetConfig() {
    const script = document.querySelector('script[src*="widget.js"]');
    let serverUrl = window.location.origin;
    let agentId = null;
    
    if (script) {
      const dataServerUrl = script.getAttribute('data-server-url');
      const dataAgentId = script.getAttribute('data-agent-id');
      
      if (dataServerUrl) {
        serverUrl = dataServerUrl;
      } else {
        // Extract server URL from script src
        const scriptSrc = script.getAttribute('src');
        if (scriptSrc) {
          const url = new URL(scriptSrc, window.location.href);
          serverUrl = url.origin;
        }
      }
      
      if (dataAgentId) {
        agentId = dataAgentId;
      }
    }
    
    // Fallback: check if we're in file:// protocol
    if (window.location.protocol === 'file:') {
      serverUrl = 'http://localhost:3001';
    }
    
    return { serverUrl, agentId };
  }

  // Get widget configuration
  const widgetConfig = getWidgetConfig();

  // Configuration
  const WIDGET_CONFIG = {
    serverUrl: widgetConfig.serverUrl,
    agentId: widgetConfig.agentId,
    width: 400,
    height: 600,
    position: 'bottom-right',
    zIndex: 999999,
    buttonSize: 60,
    buttonColor: '#333333',
    buttonHoverColor: '#555555',
    borderRadius: '50%',
    shadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    animationDuration: '0.3s'
  };

  // Widget state
  let widgetState = {
    isOpen: false,
    iframe: null,
    button: null,
    container: null
  };

  // Create widget container
  function createWidgetContainer() {
    const container = document.createElement('div');
    container.id = 'ai-chat-widget-container';
    container.style.cssText = `
      position: fixed;
      ${WIDGET_CONFIG.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      ${WIDGET_CONFIG.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      z-index: ${WIDGET_CONFIG.zIndex};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    return container;
  }

  // Create toggle button with dynamic styling
  function createToggleButton(widgetConfig = null) {
    const button = document.createElement('div');
    button.id = 'ai-chat-widget-button';
    
    // Use dynamic config if available
    const btnColor = widgetConfig?.widget_config?.btn_color || WIDGET_CONFIG.buttonColor;
    const btnHoverColor = widgetConfig?.widget_config?.btn_hover_color || WIDGET_CONFIG.buttonHoverColor;
    
    button.style.cssText = `
      min-width: 120px;
      height: ${WIDGET_CONFIG.buttonSize}px;
      background: ${btnColor};
      border-radius: 30px;
      box-shadow: ${WIDGET_CONFIG.shadow};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all ${WIDGET_CONFIG.animationDuration} ease;
      position: relative;
      z-index: ${WIDGET_CONFIG.zIndex + 1};
      animation: pulse 2s infinite;
      padding: 0 16px;
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.background = btnHoverColor;
      button.style.transform = 'scale(1.05)';
      button.style.animation = 'none';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = btnColor;
      button.style.transform = 'scale(1)';
      button.style.animation = 'pulse 2s infinite';
    });

    // Add click handler
    button.addEventListener('click', safeToggleWidget);

    // Add chat icon with support text
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      color: ${widgetConfig?.widget_config?.btn_text_color || '#ffffff'};
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    `;

    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    icon.textContent = '💬';

    const text = document.createElement('span');
    text.textContent = 'Destek Al';
    text.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    iconContainer.appendChild(icon);
    iconContainer.appendChild(text);
    button.appendChild(iconContainer);

    return button;
  }

  // Create iframe
  function createIframe() {
    const iframe = document.createElement('iframe');
    iframe.id = 'ai-chat-widget-iframe';
    
    // Build iframe URL with agent ID if available
    let iframeUrl = `${WIDGET_CONFIG.serverUrl}/widget`;
    if (WIDGET_CONFIG.agentId) {
      iframeUrl += `?agentId=${encodeURIComponent(WIDGET_CONFIG.agentId)}`;
    }
    
    iframe.src = iframeUrl;
    iframe.style.cssText = `
      width: ${WIDGET_CONFIG.width}px;
      height: ${WIDGET_CONFIG.height}px;
      border: none;
      border-radius: 12px;
      box-shadow: ${WIDGET_CONFIG.shadow};
      background: white;
      position: absolute;
      ${WIDGET_CONFIG.position.includes('right') ? 'right: 0;' : 'left: 0;'}
      ${WIDGET_CONFIG.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
      opacity: 0;
      transform: scale(0.8);
      transition: all ${WIDGET_CONFIG.animationDuration} ease;
      z-index: ${WIDGET_CONFIG.zIndex};
    `;
    return iframe;
  }

  // Toggle widget visibility
  function toggleWidget() {
    if (widgetState.isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }

  // Open widget
  function openWidget() {
    console.log('Opening widget with fresh iframe...');
    
    // Always create a fresh iframe to ensure clean state
    widgetState.iframe = createIframe();
    widgetState.container.appendChild(widgetState.iframe);

    widgetState.isOpen = true;
    widgetState.iframe.style.opacity = '1';
    widgetState.iframe.style.transform = 'scale(1)';
    
    // Update button icon and text to close
    const icon = widgetState.button.querySelector('span');
    const text = widgetState.button.querySelector('span:last-child');
    icon.textContent = '✕';
    text.textContent = 'Kapat';
  }

  // Close widget
  function closeWidget() {
    if (widgetState.iframe) {
      console.log('Closing widget and disconnecting...');
      
      // Send message to iframe to disconnect WebSocket and clear conversation
      try {
        widgetState.iframe.contentWindow.postMessage({
          type: 'DISCONNECT_AND_CLEAR',
          source: 'ai-chat-widget'
        }, '*');
        console.log('Disconnect message sent to iframe');
      } catch (error) {
        console.error('Error sending disconnect message:', error);
      }
      
      // Close widget UI
      widgetState.isOpen = false;
      widgetState.iframe.style.opacity = '0';
      widgetState.iframe.style.transform = 'scale(0.8)';
      
      // Wait for disconnect message to be processed, then remove iframe completely
      setTimeout(() => {
        if (widgetState.iframe) {
          console.log('Removing iframe from DOM to ensure complete cleanup');
          widgetState.iframe.remove();
          widgetState.iframe = null;
        }
      }, 500); // Give extra time for disconnect message to be processed
      
      // Update button icon and text to chat
      const icon = widgetState.button.querySelector('span');
      const text = widgetState.button.querySelector('span:last-child');
      icon.textContent = '💬';
      text.textContent = 'Destek Al';
    }
  }

  // Close widget when clicking outside
  function handleClickOutside(event) {
    if (widgetState.isOpen && 
        !widgetState.container.contains(event.target) &&
        !event.target.closest('#ai-chat-widget-container')) {
      closeWidget();
    }
  }

  // Prevent multiple rapid clicks
  let isToggling = false;
  function safeToggleWidget() {
    if (isToggling) {
      console.log('Toggle already in progress, ignoring...');
      return;
    }
    
    isToggling = true;
    try {
      toggleWidget();
    } finally {
      // Reset the flag after a short delay
      setTimeout(() => {
        isToggling = false;
      }, 300);
    }
  }

  // Initialize widget with dynamic config
  async function initWidget() {
    try {
      console.log('Initializing AI Chat Widget...');
      console.log('Server URL:', WIDGET_CONFIG.serverUrl);
      console.log('Agent ID:', WIDGET_CONFIG.agentId);
      console.log('Current protocol:', window.location.protocol);
      
      // Build config URL with agent ID if available
      let configUrl = `${WIDGET_CONFIG.serverUrl}/api/widget-config`;
      if (WIDGET_CONFIG.agentId) {
        configUrl += `?agentId=${encodeURIComponent(WIDGET_CONFIG.agentId)}`;
      }
      
      // Fetch widget config first
      const configResponse = await fetch(configUrl);
      
      if (!configResponse.ok) {
        throw new Error(`HTTP ${configResponse.status}: ${configResponse.statusText}`);
      }
      
      const widgetConfig = await configResponse.json();
      console.log('Widget config loaded successfully');
      
      // Create container
      widgetState.container = createWidgetContainer();
      
      // Create button with dynamic config
      widgetState.button = createToggleButton(widgetConfig);
      widgetState.container.appendChild(widgetState.button);
      
      // Add to page
      document.body.appendChild(widgetState.container);
      
      // Add pulse animation CSS
      addPulseAnimation();
      
      // Add click outside listener
      document.addEventListener('click', handleClickOutside);
      
      // Add escape key listener
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && widgetState.isOpen) {
          closeWidget();
        }
      });
      
      console.log('AI Chat Widget initialized successfully');
    } catch (error) {
      console.error('Failed to initialize widget:', error);
      console.log('Falling back to default configuration...');
      
      // Fallback to default initialization
      widgetState.container = createWidgetContainer();
      widgetState.button = createToggleButton();
      widgetState.container.appendChild(widgetState.button);
      document.body.appendChild(widgetState.container);
      addPulseAnimation();
      
      // Add click outside listener
      document.addEventListener('click', handleClickOutside);
      
      // Add escape key listener
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && widgetState.isOpen) {
          closeWidget();
        }
      });
      
      console.log('AI Chat Widget initialized with fallback configuration');
    }
  }

  // Add pulse animation
  function addPulseAnimation() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(51, 51, 51, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(51, 51, 51, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(51, 51, 51, 0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Expose public API
  window.AIChatWidget = {
    open: openWidget,
    close: closeWidget,
    toggle: safeToggleWidget,
    isOpen: () => widgetState.isOpen
  };

})(); 