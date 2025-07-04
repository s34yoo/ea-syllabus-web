import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createClient } from '@supabase/supabase-js'
import { SessionContextProvider } from '@supabase/auth-helpers-react'

const supabase = createClient(
  "https://jmmnkklrqsukbclocvga.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbW5ra2xycXN1a2JjbG9jdmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDU1NTg1MTksImV4cCI6MjAyMTEzNDUxOX0.ZXPLH-J84DuF_GvnidDjdnkeuI9IaxAuT1T22psIwfs"
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <SessionContextProvider supabaseClient={supabase}>
          <App />
        </SessionContextProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
