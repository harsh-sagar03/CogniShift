function runCogniShift(mode) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "PROCESS_TEXT", mode },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError.message);
          alert("Error: " + chrome.runtime.lastError.message);
          return;
        }
        if (response && response.status === "success") {
          // Success - content has been processed and displayed
          console.log("Content processed successfully");
        } else if (response && response.status === "error") {
          alert("AI processing failed: " + (response.result || "Unknown error"));
        } else {
          alert("AI processing failed. Please try again.");
        }
      }
    );
  });
}

document.getElementById("adhd").onclick = () => runCogniShift("adhd");
document.getElementById("dyslexia").onclick = () => runCogniShift("dyslexia");
document.getElementById("autism").onclick = () => runCogniShift("autism");
