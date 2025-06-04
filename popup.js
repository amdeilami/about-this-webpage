document.addEventListener("DOMContentLoaded", () => {
  /*global chrome */

  // Get the keys button
  const keysButton = document.getElementById("keysButton");
  const responseArea = document.getElementById("responseArea");

  // Add click event listener to navigate to keys page
  keysButton.addEventListener("click", () => {
    window.location.href = "keys.html";
  });

  // Get the send button
  const sendButton = document.querySelector(".send-button");

  // Add click event listener for the send button
  sendButton.addEventListener("click", () => {
    console.log("📮 popup: sendButton clicked");
    const promptText = document.querySelector(".prompt-input").value;
    console.log("📮 popup: promptText =", promptText);
    const responseType = document.querySelector(
      'input[name="responseType"]:checked',
    ).value;

    if (promptText.trim() === "") {
      alert("Please enter a prompt");
      return;
    }

    // Check if an active API key exists
    const activeKeyName = localStorage.getItem("activeKeyName");
    if (!activeKeyName) {
      if (confirm("No active API key found. Would you like to add one now?")) {
        window.location.href = "keys.html";
      }
      return;
    }

    // Get the active key
    const savedKeys = getSavedKeys();
    const activeKey = savedKeys.find((k) => k.name === activeKeyName);

    if (!activeKey) {
      if (
        confirm(
          "The selected API key was not found. Would you like to add a new one?",
        )
      ) {
        window.location.href = "keys.html";
      }
      return;
    }

    // Show loading state in response area
    responseArea.innerHTML =
      '<div class="loading">Processing your request...</div>';

    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      // Prepare the message data
      const messageData = {
        prompt: promptText,
        responseType: responseType,
        apiKey: activeKey.key,
        keyName: activeKey.name,
      };

      // Send message to content script
      chrome.tabs.sendMessage(activeTab.id, messageData, (response) => {
        // Handle response from content script
        if (chrome.runtime.lastError) {
          // Handle error
          responseArea.innerHTML = `
                <div class="error">
                  Error: ${chrome.runtime.lastError.message || "Could not connect to the page."}
                  <p>Make sure the content script is properly injected into the page.</p>
                </div>
              `;
          return;
        }

        if (response) {
          console.log("inside popup 74");
          console.log(response.data);
        } else {
          console.log("nothing");
        }

        if (response && response.success) {
          // Display the response
          responseArea.innerHTML = `
                <div>
                  <strong>Response:</strong>
                  <p>${response.data}</p>
                </div>
              `;
        } else {
          // Handle error response
          responseArea.innerHTML = `
                <div class="error">
                  Error: ${response ? response.error : "Unknown error occurred"}
                </div>
              `;
        }
      });
    });
  });

  function getSavedKeys() {
    const keys = localStorage.getItem("apiKeys");
    return keys ? JSON.parse(keys) : [];
  }
});
