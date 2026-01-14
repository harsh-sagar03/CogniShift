console.log("CogniShift content script loaded");

// --- State Variables ---
let originalContent = "";
let isDarkMode = false;
let rulerActive = false;
let bionicActive = false;
let isSpeaking = false;
let speechUtterance = null;

// --- Helper Functions ---

function formatAIText(text) {
  // Helper to process inline formatting (Bold, Emphasis, Bionic placeholders)
  function processInline(str) {
    // 1. Handle Bold (**text**)
    str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 2. Handle Emphasis (*text*)
    str = str.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
    return str;
  }

  // 1. Split by double newlines to get blocks
  const blocks = text.split(/\n\n+/);
  let html = "";

  blocks.forEach(block => {
    block = block.trim();
    if (!block) return;

    // 2. Identify Block Type
    // Header
    if (block.match(/^#{1,6}\s/)) {
      const level = block.match(/^#+/)[0].length;
      const content = block.replace(/^#+\s/, '');
      html += `<h${level}>${processInline(content)}</h${level}>`;
    }
    // List (Unordered)
    else if (block.match(/^[•\-\*]\s/m)) {
      html += "<ul>";
      const lines = block.split(/\n/);
      lines.forEach(line => {
        const content = line.replace(/^[•\-\*]\s/, '');
        html += `<li>${processInline(content)}</li>`;
      });
      html += "</ul>";
    }
    // List (Ordered)
    else if (block.match(/^\d+\.\s/m)) {
      html += "<ol>";
      const lines = block.split(/\n/);
      lines.forEach(line => {
        const content = line.replace(/^\d+\.\s/, '');
        html += `<li>${processInline(content)}</li>`;
      });
      html += "</ol>";
    }
    // TL;DR Box
    else if (block.toLowerCase().startsWith("tl;dr")) {
      const content = block.substring(5).replace(/^[:\s]+/, '');
      html += `<div class="cogni-tldr"><strong>TL;DR:</strong> ${processInline(content)}</div>`;
    }
    // Paragraph
    else {
      let paragraphHtml = processInline(block.replace(/\n/g, "<br>"));
      // Smart Attention: Highlight first sentence
      const match = paragraphHtml.match(/(\.[\s<]|\.$)/);
      if (match) {
        const index = match.index + 1;
        const firstSentence = paragraphHtml.substring(0, index);
        const rest = paragraphHtml.substring(index);
        paragraphHtml = `<span class="cogni-first-sentence">${firstSentence}</span>${rest}`;
      }
      html += `<p>${paragraphHtml}</p>`;
    }
  });

  return html;
}

// --- Feature Toggles ---

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  const container = document.getElementById("cogni-container");
  if (container) {
    container.classList.toggle("dark-mode", isDarkMode);
  }
  document.body.classList.toggle("dark-mode", isDarkMode);

  // Update button if it exists in the page
  const btn = document.getElementById("toggle-dark");
  if (btn) {
    btn.innerHTML = isDarkMode
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Light Mode`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Dark Mode`;
    btn.classList.toggle("active", isDarkMode);
  }
}

function toggleSpeech() {
  const contentDiv = document.getElementById("cogni-content");
  if (!contentDiv) return;

  const btn = document.getElementById("toggle-speech");

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    if (btn) {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Read Aloud`;
      btn.classList.remove("active");
    }
  } else {
    const textToRead = contentDiv.innerText;
    speechUtterance = new SpeechSynthesisUtterance(textToRead);
    speechUtterance.rate = 1.0;

    // Select voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google") && v.lang.includes("en")) || voices[0];
    if (preferredVoice) speechUtterance.voice = preferredVoice;

    speechUtterance.onend = () => {
      isSpeaking = false;
      if (btn) {
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Read Aloud`;
        btn.classList.remove("active");
      }
    };

    window.speechSynthesis.speak(speechUtterance);
    isSpeaking = true;
    if (btn) {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop`;
      btn.classList.add("active");
    }
  }
}

function toggleBionic() {
  const contentDiv = document.getElementById("cogni-content");
  if (!contentDiv) return;

  bionicActive = !bionicActive;
  const btn = document.getElementById("toggle-bionic");
  if (btn) btn.classList.toggle("active", bionicActive);

  if (bionicActive) {
    // Store original HTML if not already stored? 
    // Actually, we can just re-process. 
    // But to be safe, let's just process text nodes.
    const walker = document.createTreeWalker(contentDiv, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToReplace = [];

    while (node = walker.nextNode()) {
      if (node.parentElement.tagName !== 'SCRIPT' && node.parentElement.tagName !== 'STYLE' && node.textContent.trim().length > 0) {
        nodesToReplace.push(node);
      }
    }

    nodesToReplace.forEach(node => {
      const words = node.textContent.split(' ');
      const newHTML = words.map(word => {
        if (word.length < 2) return word;
        const boldLen = Math.ceil(word.length / 2);
        return `<b class="cogni-bionic">${word.slice(0, boldLen)}</b>${word.slice(boldLen)}`;
      }).join(' ');

      const span = document.createElement('span');
      span.innerHTML = newHTML;
      node.parentNode.replaceChild(span, node);
    });
  } else {
    // To restore, we might need to re-render the content or strip tags.
    // Simplest way for now: The user can just click "Show Original" if they want a full reset, 
    // or we can try to strip the b tags.
    // For this implementation, let's just strip the <b class="cogni-bionic"> tags.
    const bionicTags = contentDiv.querySelectorAll('b.cogni-bionic');
    bionicTags.forEach(tag => {
      const text = document.createTextNode(tag.textContent);
      tag.parentNode.replaceChild(text, tag);
      // We also wrapped it in a span, so we might want to unwrap that too, but it's fine.
    });
  }
}

function toggleRuler() {
  rulerActive = !rulerActive;
  const ruler = document.getElementById("reading-ruler");
  const btn = document.getElementById("toggle-ruler");

  if (ruler) {
    ruler.style.display = rulerActive ? "block" : "none";
  }
  if (btn) {
    btn.classList.toggle("active", rulerActive);
  }
}

function restoreOriginal() {
  if (originalContent) {
    document.body.innerHTML = originalContent;
    // Reset state
    isDarkMode = false;
    rulerActive = false;
    bionicActive = false;
    isSpeaking = false;
    window.speechSynthesis.cancel();
    document.body.classList.remove("dark-mode");

    // Remove global listeners
    window.removeEventListener("scroll", updateProgress);
    window.removeEventListener("mousemove", updateRulerPosition);
  }
}

// --- Event Listeners Helpers ---

function updateRulerPosition(e) {
  if (rulerActive) {
    const ruler = document.getElementById("reading-ruler");
    if (ruler) {
      ruler.style.top = (e.clientY - 40) + "px";
    }
  }
}

function updateProgress() {
  const progressBar = document.getElementById("reading-progress-bar");
  const progressText = document.getElementById("reading-progress-text");
  if (progressBar && progressText) {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    const roundedPercent = Math.min(100, Math.max(0, Math.round(scrollPercent)));

    progressBar.style.width = scrollPercent + "%";
    progressText.innerText = roundedPercent + "%";
  }
}

// --- Main Message Listener ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request.action);

  if (request.action === "PROCESS_TEXT") {
    const container = document.body;
    if (!originalContent) {
      originalContent = container.innerHTML;
    }

    const pageText = container.innerText;

    // Extract images
    const images = Array.from(document.images).filter(img => {
      return img.width > 100 && img.height > 100 && img.src.startsWith('http');
    }).map(img => ({
      src: img.src,
      alt: img.alt || 'Reference Image'
    }));

    let prompt = "";
    if (request.mode === "adhd") prompt = ADHD_PROMPT;
    if (request.mode === "dyslexia") prompt = DYSLEXIA_PROMPT;
    if (request.mode === "autism") prompt = AUTISM_PROMPT;

    sendToGemini(pageText, prompt).then((response) => {
      if (response.success) {
        const result = response.data;
        const formattedResult = formatAIText(result);

        // Inject HTML
        container.innerHTML = `
          <div id="cogni-container" style="
            max-width: 900px;
            margin: 40px auto;
            padding: 30px;
            background: #ffffff;
            color: #222;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.8;
            border-radius: 10px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            position: relative;
          ">
            <style>
              /* Styles injected here (same as before) */
              #cogni-container { font-family: 'Inter', sans-serif; color: #374151; }
              #cogni-container h1, #cogni-container h2 { color: #111827; margin-top: 1.5em; font-weight: 700; }
              #cogni-container p { margin-bottom: 1.2em; font-size: 18px; }
              .cogni-tldr { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin-bottom: 24px; color: #0c4a6e; }
              #cogni-container strong { background-color: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; }
              .cogni-first-sentence { background-color: rgba(186, 230, 253, 0.3); }
              b.cogni-bionic { background-color: transparent !important; color: inherit !important; padding: 0 !important; font-weight: 700 !important; }
              
              /* Ruler */
              #reading-ruler {
                position: fixed; left: 0; width: 100%; height: 80px;
                background: rgba(0, 0, 0, 0.4); pointer-events: none; z-index: 9999; display: none;
                border-top: 100vh solid rgba(0, 0, 0, 0.4);
                border-bottom: 100vh solid rgba(0, 0, 0, 0.4);
                transform: translateY(-100vh); 
              }
              
              /* Progress */
              #reading-progress-container { position: fixed; top: 0; left: 0; width: 100%; height: 6px; background: rgba(0,0,0,0.05); z-index: 10000; }
              #reading-progress-bar { height: 100%; background: #3b82f6; width: 0%; transition: width 0.1s; }
              #reading-progress-text { position: fixed; top: 10px; right: 10px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; z-index: 10000; pointer-events: none; }
              
              /* Dark Mode */
              body.dark-mode { background-color: #111827 !important; }
              #cogni-container.dark-mode { background: #111827 !important; color: #e5e7eb !important; }
              #cogni-container.dark-mode h1, #cogni-container.dark-mode h2 { color: #f3f4f6 !important; }
              #cogni-container.dark-mode strong { background-color: #374151 !important; color: #fbbf24 !important; }
              
              /* Toggle Buttons */
              .cogni-toggle { background: #f3f4f6; border: 1px solid #d1d5db; color: #374151; padding: 8px 16px; border-radius: 20px; cursor: pointer; margin-right: 10px; display: inline-flex; align-items: center; gap: 6px; }
              .cogni-toggle.active { background: #3b82f6; color: white; border-color: #2563eb; }
            </style>

            <div id="reading-progress-container"><div id="reading-progress-bar"></div></div>
            <div id="reading-progress-text">0%</div>
            <div id="reading-ruler"></div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px;">
                <button id="restore" style="background: white; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 8px; cursor: pointer;">🔙 Show Original</button>
                <div>
                    <button id="toggle-dark" class="cogni-toggle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Dark Mode</button>
                    <button id="toggle-speech" class="cogni-toggle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Read Aloud</button>
                    <button id="toggle-bionic" class="cogni-toggle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Bionic Read</button>
                    <button id="toggle-ruler" class="cogni-toggle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"></path></svg> Focus Ruler</button>
                </div>
            </div>

            <div id="cogni-content">${formattedResult}</div>
            
            ${images.length > 0 ? `
            <div id="cogni-gallery-section" style="margin-top: 40px; border-top: 2px solid #e5e7eb; padding-top: 30px;">
                <h3>Visual References (${images.length} images)</h3>
                <button id="toggle-gallery" class="cogni-toggle">Show Images</button>
                <div id="cogni-gallery-grid" style="display: none; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-top: 20px;">
                    ${images.map(img => `
                        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                            <img src="${img.src}" alt="${img.alt}" style="width: 100%; height: 160px; object-fit: cover;">
                            <div style="padding: 10px; font-size: 13px;">${img.alt.substring(0, 60)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
          </div>
        `;

        // Attach Listeners to In-Page Buttons (for backward compatibility / convenience)
        document.getElementById("toggle-dark").onclick = toggleDarkMode;
        document.getElementById("toggle-speech").onclick = toggleSpeech;
        document.getElementById("toggle-bionic").onclick = toggleBionic;
        document.getElementById("toggle-ruler").onclick = toggleRuler;
        document.getElementById("restore").onclick = restoreOriginal;

        if (images.length > 0) {
          const galleryBtn = document.getElementById("toggle-gallery");
          const galleryGrid = document.getElementById("cogni-gallery-grid");
          galleryBtn.onclick = () => {
            const isVisible = galleryGrid.style.display === "grid";
            galleryGrid.style.display = isVisible ? "none" : "grid";
            galleryBtn.innerText = isVisible ? "Show Images" : "Hide Images";
          };
        }

        // Global Listeners
        window.addEventListener("mousemove", updateRulerPosition);
        window.addEventListener("scroll", updateProgress);

        sendResponse({ status: "success", result: result.substring(0, 200) });
      } else {
        sendResponse({ status: "error", result: response.error || "AI processing failed" });
      }
    }).catch((error) => {
      console.error("Error processing text:", error);
      sendResponse({ status: "error", result: error.message || "AI processing failed" });
    });

    return true; // Async response
  }

  // Handle Feature Toggles from Popup
  else if (request.action === "TOGGLE_DARK_MODE") {
    toggleDarkMode();
    sendResponse({ status: "success", isDarkMode });
  }
  else if (request.action === "TOGGLE_SPEECH") {
    toggleSpeech();
    sendResponse({ status: "success", isSpeaking });
  }
  else if (request.action === "TOGGLE_BIONIC") {
    toggleBionic();
    sendResponse({ status: "success", bionicActive });
  }
  else if (request.action === "TOGGLE_RULER") {
    toggleRuler();
    sendResponse({ status: "success", rulerActive });
  }
  else if (request.action === "RESTORE_ORIGINAL") {
    restoreOriginal();
    sendResponse({ status: "success" });
  }
});




