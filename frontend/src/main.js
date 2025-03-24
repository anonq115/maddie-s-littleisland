import './style.css';
import "/src/calendar-component.js";  // Adjust path as needed
import './app.css';
// In your main.js or equivalent
// main.js
// Import window runtime functions from Wails
// Import window runtime functions from Wails
// Import window runtime functions from Wailsimport { WindowSetSize } from "../wailsjs/runtime/runtime"import { WindowSetSize } from "../wailsjs/runtime/runtime"
import { WindowSetSize } from "../wailsjs/runtime/runtime"
import { SaveContent, LoadContent } from "../wailsjs/go/main/App"








const textarea = document.getElementById('editor');



// Load saved content when starting
async function loadSavedContent() {
    try {
        const content = await LoadContent();
        if (content) {
            textarea.value = content;
        }
    } catch (err) {
        console.error('Failed to load content:', err);
    }
}

loadSavedContent();

// Handle Ctrl+S for saving
document.addEventListener('keydown', async (e) => {
    if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        try {
            await SaveContent(textarea.value);
            console.log('Content saved successfully');
        } catch (err) {
            console.error('Failed to save content:', err);
        }
    }
});

// Auto-save when window loses focus
window.onblur = async () => {
    try {
        await SaveContent(textarea.value);
        console.log('Content auto-saved');
    } catch (err) {
        console.error('Failed to auto-save content:', err);
    }
};



