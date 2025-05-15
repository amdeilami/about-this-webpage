/*global chrome */

// TODO: Delete this
console.log("Background is running...");

chrome.tabs.onUpdated.addListener((tabId, _tab) => {
  chrome.tabs.sendMessage(tabId, { type: "NEW" });
});

chrome.runtime.onMessage.addListener(
  function (message, _sender, _sendResponse) {
    if (message.action === "processPrompt") {
      // TODO: Delete this
      console.log("Received in background:", message.prompt, message.type);
      // Query for the active tab in the current window
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
          // Use the tab id from the first (active) tab
          const activeTabId = tabs[0].id;
          // Send a message to the content script in that tab
          chrome.tabs.sendMessage(activeTabId, { type: "NEW" });
        } else {
          console.error("No active tab found.");
        }
      });
    }
  },
);
