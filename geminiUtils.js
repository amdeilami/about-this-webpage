/*global conversationHistory, globalCacheName */
/**
 *
 * @param {string} prompt
 * @param {string} key_type - The model name to associate with the cache (e.g., "gemini-1.5-pro-latest").
 * @param {string} key
 * @returns
 */
const generateContent = async function (
  prompt,
  key_type = "gemini-2.0-flash",
  key = "",
  //key_type = "gemini-2.5-pro-preview-tts",
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${key_type}:generateContent?key=${key}`;
  //TODO: delte these prints
  console.log(key_type);
  console.log(key);
  const payload = {
    contents: conversationHistory,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log("PRINTING JSON RESPONSEEEE");
  console.log(response);

  // 2) Only now do we parse the successful response body
  const data = await response.json();
  console.log("🟢 generateContent.data from server is:", data);

  console.log(data);
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log("gen text is:");
  console.log(generatedText);

  // 1) Check status first—do NOT call response.json() until you know it’s ok
  if (!response.ok) {
    // Try to pull the raw text (or JSON) from the body
    let errText;
    try {
      // If the server returned JSON, use .json(), otherwise .text()
      const maybeJson = await response
        .clone()
        .json()
        .catch(() => null);
      if (maybeJson) {
        errText = JSON.stringify(maybeJson, null, 2);
      } else {
        errText = await response.text();
      }
    } catch {
      errText = `<couldn't read response body>`;
    }
    console.error("Server returned error:", errText);
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // try {
  //   const response = await fetch(url, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(payload),
  //   });
  //   console.log("🟢 generateContent.data from server is: ");
  //   const data = await response.json();

  //   if (!response.ok) {
  //     if (!response.ok) {
  //       let errText;
  //       try {
  //         errText = await response.text();
  //       } catch {
  //         errText = `<couldn't read response body>`;
  //       }
  //       console.error("Server returned:", errText);
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }
  //   }

  return generatedText;
  // } catch (error) {
  //   console.error("Error:", error);
  //   throw error;
  // }
};

// Expose to global scope
window.generateContent = generateContent;

/**
 * Creates a content cache with the Gemini API using content from functionA.
 * @param {string} modelForCaching - The model name to associate with the cache (e.g., "gemini-1.5-pro-latest").
 * @param {string} apiKey
 * @param {string} [displayName] - display name for the cache
 * @param {number} [ttlSeconds] - Time-To-Live for the cache in seconds.
 * @returns {Promise<string|null>} - The name of the created cache (e.g., "cachedContents/xxxx") or null on error.
 */
async function createOrGetContentCache(
  modelForCaching = "gemini-2.5-pro-exp-03-25",
  apiKey = "AIzaSyDF4CjnxdrJNyyvkb5qtF0ljALmPRI6zek",
  displayName = "thisPageCache",
  ttlSeconds = 3600,
) {
  if (globalCacheName) {
    console.log(`Using existing global cache: ${globalCacheName}`);
    return globalCacheName;
  }

  const cacheableContent = conversationHistory.slice(0, 2);
  if (!cacheableContent || cacheableContent.length === 0) {
    console.error(
      "No content provided by getCacheableContentFromA() to cache.",
    );
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${apiKey}`;
  const payload = {
    contents: cacheableContent,
    model: `models/${modelForCaching}`, // Important: Model name must be prefixed with "models/"
    displayName: displayName,
    ttl: `${ttlSeconds}s`, // TTL must be a string with 's' suffix, e.g., "3600s"
    // You could also cache systemInstruction or toolConfig if needed:
    // systemInstruction: { parts: [{ text: "You are a helpful assistant." }] },
  };

  console.log(
    "Attempting to create cache with payload:",
    JSON.stringify(payload, null, 2),
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Cache creation HTTP error! Status: ${response.status}`,
        errorBody,
      );
      throw new Error(
        `Cache creation HTTP error! Status: ${response.status}. Body: ${errorBody}`,
      );
    }

    const data = await response.json();
    console.log("Cache created successfully:", data);
    globalCacheName = data.name; // Store the name
    return globalCacheName;
  } catch (error) {
    console.error("Error creating content cache:", error);
    return null;
  }
}
