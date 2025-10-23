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

// Initialize session manager (will auto-detect remember me status)
SessionManager.initialize();

// Listen for login success events to update session manager
window.addEventListener('authLoginSuccess', (event: any) => {
  const { rememberMe } = event.detail;
  SessionManager.setRememberMe(rememberMe);
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
