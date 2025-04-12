import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css'; // Import the App.css file here
import App from './App'; // Import the App component
import reportWebVitals from './reportWebVitals'; // Import the reportWebVitals function

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

reportWebVitals();
