import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {AppRouter} from './router';
import {AppFeedbackProvider} from './components/Feedback/AppFeedbackProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppFeedbackProvider><AppRouter /></AppFeedbackProvider>
  </StrictMode>,
);
