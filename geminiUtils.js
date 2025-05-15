/*exported generateContent, createOrGetContentCache */
/*global conversationHistory, globalCacheName */

/**
 *
 * @param {string} prompt
 * @param {string} key_type - The model name to associate with the cache (e.g., "gemini-1.5-pro-latest").
 * @param {string} key
 * @returns
 */
async function generateContent(
  prompt,
  key_type = "gemini-2.5-pro-exp-03-25",
  key = "AIzaSyDF4CjnxdrJNyyvkb5qtF0ljALmPRI6zek",
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${key_type}:generateContent?key=${key}`;
  console.log(key_type);
  console.log(key);
  const payload = {
    contents: [
      {
        ...conversationHistory,
        parts: [{ text: prompt }],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return generatedText;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

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
