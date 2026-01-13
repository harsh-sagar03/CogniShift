console.log("CogniShift content script loaded");
let originalContent = "";
function formatAIText(text) {
  // 1. Handle Headers (### Header)
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 2. Handle Bold (**text**)
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 3. Handle Lists
  // Split by double newlines to get paragraphs/blocks
  const blocks = text.split(/\n\n+/);
  let html = "";

  blocks.forEach(block => {
    // Check if block is a list
    if (block.match(/^[•\-\*]\s/m)) {
      html += "<ul>";
      const lines = block.split(/\n/);
      lines.forEach(line => {
        if (line.match(/^[•\-\*]\s/)) {
          html += `<li>${line.replace(/^[•\-\*]\s/, '')}</li>`;
        } else {
          // Continuation of previous list item or weird formatting
          html += ` ${line.trim()}`;
        }
      });
      html += "</ul>";
    } else if (block.match(/^\d+\.\s/m)) {
      html += "<ol>";
      const lines = block.split(/\n/);
      lines.forEach(line => {
        if (line.match(/^\d+\.\s/)) {
          html += `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
        } else {
          html += ` ${line.trim()}`;
        }
      });
      html += "</ol>";
    } else {
      // Regular paragraph or header
      if (block.startsWith("<h")) {
        html += block;
      } else if (block.toLowerCase().startsWith("tl;dr")) {
        html += `<div class="cogni-tldr">${block}</div>`;
      } else {
        html += `<p>${block.replace(/\n/g, "<br>")}</p>`;
      }
    }
  });

  return html;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "PROCESS_TEXT") {
    const container = document.body;
    if (!originalContent) {
      originalContent = container.innerHTML;
    }

    const pageText = container.innerText;

    // Extract images before processing
    const images = Array.from(document.images).filter(img => {
      // Filter out small icons and tracking pixels
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
      /* Premium Typography & Spacing */
      #cogni-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #374151; /* Soft dark gray */
      }
      #cogni-container h1, #cogni-container h2, #cogni-container h3 {
        color: #111827;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 700;
      }
      #cogni-container p {
        margin-bottom: 1.2em;
        font-size: 18px; /* Larger text for readability */
      }
      #cogni-container ul, #cogni-container ol {
        margin-bottom: 1.2em;
        padding-left: 20px;
      }
      #cogni-container li {
        margin-bottom: 0.5em;
        font-size: 18px;
      }

      /* TL;DR Box */
      .cogni-tldr {
        background: #f0f9ff;
        border-left: 4px solid #0ea5e9;
        padding: 16px;
        border-radius: 4px;
        margin-bottom: 24px;
        font-weight: 500;
        color: #0c4a6e;
        font-size: 18px;
      }

      /* Pastel Highlights */
      #cogni-container strong, #cogni-container b {
        background-color: #fef08a; /* Soft yellow */
        color: #854d0e; /* Darker yellow-brown for contrast */
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }

      /* Reading Ruler */
      #reading-ruler {
        position: fixed;
        left: 0;
        width: 100%;
        height: 80px; /* Taller window */
        background: rgba(0, 0, 0, 0.4); /* Darker dim */
        pointer-events: none;
        z-index: 9999;
        display: none;
        /* The trick: huge border to dim everything else */
        border-top: 100vh solid rgba(0, 0, 0, 0.4);
        border-bottom: 100vh solid rgba(0, 0, 0, 0.4);
        /* Adjust top position to account for the border */
        transform: translateY(-100vh); 
      }
      
      /* Progress Bar */
      #reading-progress-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 6px;
        background: rgba(0,0,0,0.05);
        z-index: 10000;
      }
      #reading-progress-bar {
        height: 100%;
        background: #3b82f6; /* Calming Blue for ADHD */
        width: 0%;
        transition: width 0.1s;
        border-radius: 0 3px 3px 0;
      }
      #reading-progress-text {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        z-index: 10000;
        pointer-events: none;
        font-family: 'Inter', sans-serif;
      }
      #cogni-container.dark-mode #reading-progress-text {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
      }
      
      /* Toggle Button Style */
      .cogni-toggle {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        color: #374151;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        margin-right: 10px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }
      .cogni-toggle:hover {
        background: #e5e7eb;
      }
      .cogni-toggle.active {
        background: #3b82f6;
        color: white;
        border-color: #2563eb;
      }

      /* Dark Mode Styles */
      #cogni-container.dark-mode {
        background: #1f2937;
        color: #e5e7eb;
      }
      #cogni-container.dark-mode h1, 
      #cogni-container.dark-mode h2, 
      #cogni-container.dark-mode h3 {
        color: #f3f4f6;
      }
      #cogni-container.dark-mode strong, 
      #cogni-container.dark-mode b {
        background-color: #4b5563;
        color: #fbbf24; /* Brighter yellow for dark mode */
      }
      #cogni-container.dark-mode .cogni-tldr {
        background: #111827;
        border-left-color: #38bdf8;
        color: #e0f2fe;
      }
      #cogni-container.dark-mode .cogni-toggle {
        background: #374151;
        border-color: #4b5563;
        color: #e5e7eb;
      }
      #cogni-container.dark-mode .cogni-toggle:hover {
        background: #4b5563;
      }
      #cogni-container.dark-mode .cogni-toggle.active {
        background: #3b82f6;
        color: white;
      }
      #cogni-container.dark-mode #restore {
        background: #374151;
        border-color: #4b5563;
        color: #e5e7eb;
      }
      #cogni-container.dark-mode #cogni-gallery-section {
        border-top-color: #374151 !important;
      }
      #cogni-container.dark-mode #cogni-gallery-section h3 {
        color: #f3f4f6 !important;
      }
      #cogni-container.dark-mode #cogni-gallery-section div[style*="background: white"] {
        background: #1f2937 !important;
        border-color: #374151 !important;
      }
      #cogni-container.dark-mode #cogni-gallery-section div[style*="background: #f9fafb"] {
        background: #111827 !important;
      }
      #cogni-container.dark-mode #cogni-gallery-section div[style*="color: #4b5563"] {
        color: #d1d5db !important;
        background: #1f2937 !important;
        border-top-color: #374151 !important;
      }
    </style>

    <!-- Progress Bar -->
    <div id="reading-progress-container"><div id="reading-progress-bar"></div></div>
    <div id="reading-progress-text">0%</div>

    <!-- Reading Ruler Element -->
    <div id="reading-ruler"></div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px;">
        <button id="restore" style="
          background: white;
          border: 1px solid #d1d5db;
          color: #4b5563;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        ">
          🔙 Show Original
        </button>
        
        <div>
            <button id="toggle-dark" class="cogni-toggle">
                <span>🌙</span> Dark Mode
            </button>
            <button id="toggle-speech" class="cogni-toggle">
                <span>▶️</span> Read Aloud
            </button>
            <button id="toggle-bionic" class="cogni-toggle">
                <span>⚡</span> Bionic Read
            </button>
            <button id="toggle-ruler" class="cogni-toggle">
                <span>📏</span> Focus Ruler
            </button>
        </div>
    </div>

    <div id="cogni-content">${formattedResult}</div>

    ${images.length > 0 ? `
    <div id="cogni-gallery-section" style="margin-top: 40px; border-top: 2px solid #e5e7eb; padding-top: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 20px; color: #111827;">📸 Visual References <span style="font-size: 14px; color: #6b7280; font-weight: normal; margin-left: 8px;">(${images.length} images found)</span></h3>
            <button id="toggle-gallery" class="cogni-toggle">
                <span>👁️</span> Show Images
            </button>
        </div>
        <div id="cogni-gallery-grid" style="display: none; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;">
            ${images.map(img => `
                <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s;">
                    <div style="height: 160px; overflow: hidden; background: #f9fafb; display: flex; align-items: center; justify-content: center;">
                        <img src="${img.src}" alt="${img.alt}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                    </div>
                    <div style="padding: 12px; font-size: 13px; color: #4b5563; background: white; border-top: 1px solid #f3f4f6; line-height: 1.4;">
                        ${img.alt.length > 60 ? img.alt.substring(0, 60) + '...' : img.alt}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

  </div>
`;

        // --- Event Listeners ---

        // Gallery Toggle
        if (images.length > 0) {
          const galleryGrid = document.getElementById("cogni-gallery-grid");
          const galleryBtn = document.getElementById("toggle-gallery");
          let galleryVisible = false;

          galleryBtn.onclick = () => {
            galleryVisible = !galleryVisible;
            galleryGrid.style.display = galleryVisible ? "grid" : "none";
            galleryBtn.innerHTML = galleryVisible ? "<span>🙈</span> Hide Images" : "<span>👁️</span> Show Images";
            galleryBtn.classList.toggle("active", galleryVisible);
          };
        }

        // Restore Original
        document.getElementById("restore").onclick = () => {
          container.innerHTML = originalContent;
          // Remove event listeners to clean up (optional but good practice)
          window.removeEventListener("scroll", updateProgress);
          window.removeEventListener("mousemove", updateRuler);
        };

        // Toggle Ruler
        const ruler = document.getElementById("reading-ruler");
        const rulerBtn = document.getElementById("toggle-ruler");
        let rulerActive = false;

        rulerBtn.onclick = () => {
          rulerActive = !rulerActive;
          ruler.style.display = rulerActive ? "block" : "none";
          rulerBtn.classList.toggle("active", rulerActive);
        };

        // Toggle Bionic Reading
        const bionicBtn = document.getElementById("toggle-bionic");
        const contentDiv = document.getElementById("cogni-content");
        let bionicActive = false;
        let normalText = contentDiv.innerHTML;

        bionicBtn.onclick = () => {
          bionicActive = !bionicActive;
          bionicBtn.classList.toggle("active", bionicActive);

          if (bionicActive) {
            // Apply Bionic Reading
            // We need to be careful not to break HTML tags.
            // Simple approach: Process text nodes only.
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
                return `<b>${word.slice(0, boldLen)}</b>${word.slice(boldLen)}`;
              }).join(' ');

              const span = document.createElement('span');
              span.innerHTML = newHTML;
              node.parentNode.replaceChild(span, node);
            });
          } else {
            // Restore Normal
            contentDiv.innerHTML = normalText;
          }
        };

        // Text to Speech
        const speechBtn = document.getElementById("toggle-speech");
        let speaking = false;
        let utterance = null;

        speechBtn.onclick = () => {
          if (speaking) {
            window.speechSynthesis.cancel();
            speaking = false;
            speechBtn.innerHTML = "<span>▶️</span> Read Aloud";
            speechBtn.classList.remove("active");
          } else {
            // Create new utterance with current text
            const textToRead = contentDiv.innerText;
            utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.rate = 1.0; // Normal speed
            utterance.pitch = 1.0;

            // Optional: Select a good voice
            const voices = window.speechSynthesis.getVoices();
            // Try to find a Google voice or a natural sounding one
            const preferredVoice = voices.find(v => v.name.includes("Google") && v.lang.includes("en")) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onend = () => {
              speaking = false;
              speechBtn.innerHTML = "<span>▶️</span> Read Aloud";
              speechBtn.classList.remove("active");
            };

            window.speechSynthesis.speak(utterance);
            speaking = true;
            speechBtn.innerHTML = "<span>⏹️</span> Stop";
            speechBtn.classList.add("active");
          }
        };

        // Dark Mode Toggle
        const darkBtn = document.getElementById("toggle-dark");
        const containerDiv = document.getElementById("cogni-container");
        let isDarkMode = false;

        darkBtn.onclick = () => {
          isDarkMode = !isDarkMode;
          containerDiv.classList.toggle("dark-mode", isDarkMode);
          darkBtn.innerHTML = isDarkMode ? "<span>☀️</span> Light Mode" : "<span>🌙</span> Dark Mode";
          darkBtn.classList.toggle("active", isDarkMode);
        };

        // Update Ruler Position
        function updateRuler(e) {
          if (rulerActive) {
            // The ruler element has huge borders to create the dim effect
            // We need to position the "window" (the element itself) over the cursor
            // The element is 80px tall.
            // We want the cursor to be in the middle of it.
            ruler.style.top = (e.clientY - 40) + "px";
          }
        }
        window.addEventListener("mousemove", updateRuler);

        // Update Progress Bar
        const progressBar = document.getElementById("reading-progress-bar");
        const progressText = document.getElementById("reading-progress-text");

        function updateProgress() {
          const scrollTop = window.scrollY;
          const docHeight = document.body.scrollHeight - window.innerHeight;
          const scrollPercent = (scrollTop / docHeight) * 100;
          const roundedPercent = Math.min(100, Math.max(0, Math.round(scrollPercent)));

          progressBar.style.width = scrollPercent + "%";
          progressText.innerText = roundedPercent + "%";
        }
        window.addEventListener("scroll", updateProgress);
        sendResponse({ status: "success", result: result.substring(0, 200) });
      } else {
        sendResponse({ status: "error", result: response.error || "AI processing failed" });
      }
    }).catch((error) => {
      console.error("Error processing text:", error);
      sendResponse({ status: "error", result: error.message || "AI processing failed" });
    });

    return true; // Indicates we will send a response asynchronously
  }
});




