const _COMPREHENSIVE_CHAR_LIMIT = 65536;
const _BRIEF_CHAR_LIMIT = 1024;
const conversationHistory = [];
let _globalCacheName;

function addToConversationHistory(role, message) {
  conversationHistory.push({ role, parts: [{ text: message }] });
}

function _printWholeHistory() {
  conversationHistory.forEach((pair) => {
    console.log(`Role: ${pair.role}`);
    console.log(`Message: ${pair.message}`);
  });
}

function extractHeadContent() {
  // Get the head element
  const headElement = document.head;

  // Get all the content inside head
  const headContent = headElement.innerHTML;

  //console.log("Extracted head content:", headContent);

  // If you want to access specific elements inside head:
  const title = document.head.querySelector("title")?.textContent;
  // const metaTags = document.head.querySelectorAll('meta');
  // const scriptTags = document.head.querySelectorAll('script');

  // console.log("Title:", title);
  // console.log("Number of meta tags:", metaTags.length);
  // console.log("Number of script tags:", scriptTags.length);

  return title;
}

function extractBodyText() {
  // 1. clone the body so we don’t disturb the live page
  const clone = document.body.cloneNode(true);

  // 2. remove all blocks that could hide code or injected scripts/styles
  clone
    .querySelectorAll("script, style, noscript, code, pre, link, iframe")
    .forEach((el) => el.remove());

  // 3. grab only the visible text
  let text = clone.innerText || "";

  // 4. normalize whitespace like before
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.length > 0);

  return lines.join("\n");
}

(async function initialize() {
  console.log("content script initialization begins for this page...");
  if (window.__myExtensionInitialized) return; // Prevents double-initialization
  window.__myExtensionInitialized = true; // Mark as initialized
  const contex = extractHeadContent() + ` ` + extractBodyText();
  const intro = `here is content of a webpage that I'm visiting, answer my questions in the following messages considering this: \n`;
  const prompt = intro + ` ` + contex;
  console.log("ATTENTION .........!!!!!!!");
  console.log(prompt);

  try {
    const firstResponse = await send(prompt);
    addToConversationHistory(`user`, prompt);
    addToConversationHistory("model", firstResponse);
  } catch (error) {
    console.error("Error during initialization:", error);
    // Potentially reset initialization flag or handle error appropriately
    window.__myExtensionInitialized = false;
  }

  // console.log(`conversation history length is : ${conversationHistory.length}`);
  // globalCacheName = createOrGetContentCache();
  // if (globalCacheName != null) {
  //   console.log(`globalcache is: ${globalCacheName}`);
  // }
})();

async function send(prompt) {
  let status = false;

  try {
    const response = await generateContent(prompt);
    addToConversationHistory(`user`, prompt);
    addToConversationHistory("model", response);
    status = true;
    return { status, response };
  } catch (error) {
    const errorText = `Error getting response from LLM: ${error}`;
    console.error(errorText);
    return { status, error };
  }
}

(() => {
  // Listen for messages from the UI
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { prompt, responseType, apiKey, keyName } = message;

    async () => {
      try {
        const { status, response } = await send(prompt);
        sendResponse({
          success: status,
          data: response
            .replace(/\n/g, `<br>`)
            .replace(/\*\*(.+?)\*\*/g, `<b>$1</b>`),
        });
      } catch (error) {
        console.log(error);
        sendResponse({ success: false, data: `` });
      }
    };
  });

  // Log when the content script is loaded
  console.log("content script is loaded and ready to receive messages.");
})();
