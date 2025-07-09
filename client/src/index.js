import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ChatWidget from './ChatWidget';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChatWidget />
  </React.StrictMode>
); 