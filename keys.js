document.addEventListener("DOMContentLoaded", () => {
  const backButton = document.getElementById("backButton");

  // Add click event listener to navigate back to main page
  backButton.addEventListener("click", () => {
    window.location.href = "popup.html";
  });

  // Get the save button and input fields
  const saveButton = document.getElementById("saveButton");
  const keyNameInput = document.getElementById("keyName");
  const apiKeyInput = document.getElementById("apiKey");
  const keysList = document.getElementById("keysList");

  displaySavedKeys();

  // Add click event listener for the save button
  saveButton.addEventListener("click", () => {
    const keyName = keyNameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (keyName === "") {
      alert("Please enter a name for your key");
      return;
    }

    if (apiKey === "") {
      alert("Please enter a valid API key");
      return;
    }

    const savedKeys = getSavedKeys();

    // Check if a key with this name already exists
    const existingKeyIndex = savedKeys.findIndex((k) => k.name === keyName);
    if (existingKeyIndex >= 0) {
      if (
        confirm(
          `A key named "${keyName}" already exists. Do you want to replace it?`,
        )
      ) {
        savedKeys[existingKeyIndex].key = apiKey;
      } else {
        return;
      }
    } else {
      // Add the new key
      savedKeys.push({ name: keyName, key: apiKey });
    }

    localStorage.setItem("apiKeys", JSON.stringify(savedKeys));

    // Set the active key
    localStorage.setItem("activeKeyName", keyName);

    // Clear the input fields
    keyNameInput.value = "";
    apiKeyInput.value = "";

    // Refresh the displayed keys
    displaySavedKeys();

    alert("API key saved successfully!");
  });

  // Function to get saved keys from localStorage
  function getSavedKeys() {
    const keys = localStorage.getItem("apiKeys");
    return keys ? JSON.parse(keys) : [];
  }

  // Function to display saved keys
  function displaySavedKeys() {
    const savedKeys = getSavedKeys();
    const activeKeyName = localStorage.getItem("activeKeyName");

    if (savedKeys.length === 0) {
      keysList.innerHTML = '<div class="no-keys">No saved keys found.</div>';
      return;
    }

    let keysHTML = "";
    savedKeys.forEach((keyItem) => {
      // Mask the API key for display (show only first 4 and last 4 characters)
      const maskedKey = maskApiKey(keyItem.key);

      // Add active indicator if this is the active key
      const activeClass = keyItem.name === activeKeyName ? " active-key" : "";

      keysHTML += `
          <div class="key-item${activeClass}" data-key-name="${keyItem.name}">
            <div class="key-info">
              <div class="key-name">${keyItem.name}${keyItem.name === activeKeyName ? " (Active)" : ""}</div>
              <div class="key-value">${maskedKey}</div>
            </div>
            <div class="key-actions">
              <button class="delete-button" data-key-name="${keyItem.name}">Delete</button>
            </div>
          </div>
        `;
    });

    keysList.innerHTML = keysHTML;

    // Add event listeners for delete buttons
    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering the key item click
        const keyName = button.getAttribute("data-key-name");
        deleteKey(keyName);
      });
    });

    // Add event listeners for key items (to set as active)
    document.querySelectorAll(".key-item").forEach((item) => {
      item.addEventListener("click", () => {
        const keyName = item.getAttribute("data-key-name");
        setActiveKey(keyName);
      });
    });
  }

  // Function to mask API key for display
  function maskApiKey(key) {
    if (key.length <= 8) {
      return "••••••••";
    }
    return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
  }

  // Function to delete a key
  function deleteKey(keyName) {
    if (confirm(`Are you sure you want to delete the key "${keyName}"?`)) {
      const savedKeys = getSavedKeys();
      const updatedKeys = savedKeys.filter((k) => k.name !== keyName);

      localStorage.setItem("apiKeys", JSON.stringify(updatedKeys));

      // If we deleted the active key, clear the active key
      const activeKeyName = localStorage.getItem("activeKeyName");
      if (activeKeyName === keyName) {
        localStorage.removeItem("activeKeyName");
      }

      displaySavedKeys();
    }
  }

  // Function to set a key as active
  function setActiveKey(keyName) {
    localStorage.setItem("activeKeyName", keyName);
    displaySavedKeys();
    alert(`"${keyName}" is now set as the active key.`);
  }
});
