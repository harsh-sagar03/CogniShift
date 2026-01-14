// Tab Switching Logic
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs and panels
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

    // Add active class to clicked tab
    tab.classList.add('active');

    // Show corresponding panel
    const panelId = `${tab.dataset.tab}-panel`;
    document.getElementById(panelId).classList.add('active');
  });
});

// Helper to send messages to content script
function sendMessageToContent(action, data = {}) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(
      tabs[0].id,
      { action, ...data },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log("Content script not ready or error:", chrome.runtime.lastError.message);
          // Optional: Inject content script if missing (advanced)
          return;
        }
        console.log("Message sent:", action, response);
      }
    );
  });
}

// ADHD Mode Actions
document.getElementById('adhd-action').addEventListener('click', () => {
  sendMessageToContent('PROCESS_TEXT', { mode: 'adhd' });
});

// Feature Toggles
const toggleButtons = [
  { id: 'toggle-dark', action: 'TOGGLE_DARK_MODE' },
  { id: 'toggle-speech', action: 'TOGGLE_SPEECH' },
  { id: 'toggle-bionic', action: 'TOGGLE_BIONIC' },
  { id: 'toggle-ruler', action: 'TOGGLE_RULER' }
];

toggleButtons.forEach(btn => {
  document.getElementById(btn.id).addEventListener('click', (e) => {
    // Toggle active state visually in popup
    const button = e.currentTarget;
    button.classList.toggle('active');

    // Send message
    sendMessageToContent(btn.action);
  });
});

// Restore Original
document.getElementById('restore').addEventListener('click', () => {
  sendMessageToContent('RESTORE_ORIGINAL');
  // Reset toggle buttons state
  toggleButtons.forEach(btn => {
    document.getElementById(btn.id).classList.remove('active');
  });
});

