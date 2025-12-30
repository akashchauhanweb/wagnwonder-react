import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
import '../node_modules/bootstrap-icons/font/bootstrap-icons.css';
import './index.css'
import App from './App.jsx'
import { LoadingProvider } from "./contexts/LoadingContext";
import { SessionProvider } from "./contexts/SessionContext";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionProvider>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </SessionProvider>
  </StrictMode>,
)