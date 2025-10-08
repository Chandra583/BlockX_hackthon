import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { store } from './store/store.ts'
import { TokenRefreshService } from './services/tokenRefresh.ts'
import { SessionManager } from './services/sessionManager.ts'
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx'

// Initialize token refresh service
TokenRefreshService.initialize();

// Initialize session manager
SessionManager.initialize({
  maxIdleTime: 30 * 60 * 1000, // 30 minutes will be logged out
  warningTime: 5 * 60 * 1000,  // 5 minutes before logout
  checkInterval: 60 * 1000,    // Check every minute
});

// Import test utilities for development
import './utils/authTest'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
)
