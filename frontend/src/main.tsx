import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'


// 1. Import the toolbar
import { initToolbar } from '@21st-extension/toolbar';

// 2. Define your toolbar configuration
const stagewiseConfig = {
    plugins: [],
};

// 3. Initialize the toolbar when your app starts
// Framework-agnostic approach - call this when your app initializes
function setupStagewise() {
    // Only initialize once and only in development mode
    if (process.env.NODE_ENV === 'development') {
        initToolbar(stagewiseConfig);
    }
}

// Call the setup function when appropriate for your framework
setupStagewise();

createRoot(document.getElementById("root")!).render(<App />);
