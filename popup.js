document.addEventListener("DOMContentLoaded", function () {
  const addForm = document.getElementById("addForm");
  const folderContainer = document.getElementById("folderContainer");
  const folderSelect = document.getElementById("folderSelect");
  const newFolderName = document.getElementById("newFolderName");
  const addNewFolder = document.getElementById("addNewFolder");

  // Load folders and items
  loadFoldersAndItems();

  // Add new item
  addForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const folder = folderSelect.value;

    chrome.storage.sync.get(["folders"], function (result) {
      const folders = result.folders || {};
      if (!folders[folder]) {
        folders[folder] = [];
      }
      folders[folder].push({ title, description });
      chrome.storage.sync.set({ folders: folders }, function () {
        loadFoldersAndItems();
        addForm.reset();
      });
    });
  });

  // Add new folder
  addNewFolder.addEventListener("click", function () {
    const folderName = newFolderName.value.trim();
    if (folderName) {
      chrome.storage.sync.get(["folders"], function (result) {
        const folders = result.folders || {};
        if (!folders[folderName]) {
          folders[folderName] = [];
          chrome.storage.sync.set({ folders: folders }, function () {
            loadFoldersAndItems();
            newFolderName.value = "";
            addFolderOption(folderName);
          });
        } else {
          alert("Folder already exists");
        }
      });
    }
  });

  // Load and display folders and items
  function loadFoldersAndItems() {
    chrome.storage.sync.get(["folders"], function (result) {
      const folders = result.folders || {
        links: [],
        articles: [],
        notes: [],
      };
      folderContainer.innerHTML = "";
      Object.keys(folders).forEach((folderName) => {
        const folderElement = createFolderElement(
          folderName,
          folders[folderName]
        );
        folderContainer.appendChild(folderElement);
      });
    });
  }

  function createFolderElement(folderName, items) {
    const folderElement = document.createElement("div");
    folderElement.className = "folder";
    folderElement.innerHTML = `
      <div class="folder-header">
        <span>${folderName}</span>
        <button class="delete-folder" data-folder="${folderName}">Delete</button>
      </div>
      <div class="folder-content"></div>
    `;

    const contentElement = folderElement.querySelector(".folder-content");
    items.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = "item";
      itemElement.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="item-buttons">
          <button class="copy" data-folder="${folderName}" data-index="${index}">Copy</button>
          <button class="delete" data-folder="${folderName}" data-index="${index}">Delete</button>
        </div>
      `;
      contentElement.appendChild(itemElement);
    });

    folderElement
      .querySelector(".folder-header")
      .addEventListener("click", toggleFolder);
    folderElement
      .querySelector(".delete-folder")
      .addEventListener("click", deleteFolder);
    folderElement.querySelectorAll(".copy").forEach((button) => {
      button.addEventListener("click", copyItem);
    });
    folderElement.querySelectorAll(".delete").forEach((button) => {
      button.addEventListener("click", deleteItem);
    });

    return folderElement;
  }

  function toggleFolder(e) {
    if (e.target.classList.contains("delete-folder")) return;
    const content = e.currentTarget.nextElementSibling;
    content.style.display = content.style.display === "none" ? "block" : "none";
  }

  function deleteFolder(e) {
    e.stopPropagation();
    const folderName = e.target.getAttribute("data-folder");
    if (
      confirm(
        `Are you sure you want to delete the folder "${folderName}" and all its contents?`
      )
    ) {
      chrome.storage.sync.get(["folders"], function (result) {
        const folders = result.folders || {};
        delete folders[folderName];
        chrome.storage.sync.set({ folders: folders }, function () {
          loadFoldersAndItems();
          removeFolderOption(folderName);
        });
      });
    }
  }

  function copyItem(e) {
    const folderName = e.target.getAttribute("data-folder");
    const index = e.target.getAttribute("data-index");
    chrome.storage.sync.get(["folders"], function (result) {
      const folders = result.folders || {};
      const item = folders[folderName][index];
      const textToCopy = `${item.title}\n\n${item.description}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        alert("Copied to clipboard!");
      });
    });
  }

  function deleteItem(e) {
    const folderName = e.target.getAttribute("data-folder");
    const index = e.target.getAttribute("data-index");
    chrome.storage.sync.get(["folders"], function (result) {
      const folders = result.folders || {};
      folders[folderName].splice(index, 1);
      chrome.storage.sync.set({ folders: folders }, function () {
        loadFoldersAndItems();
      });
    });
  }

  function addFolderOption(folderName) {
    const option = document.createElement("option");
    option.value = folderName;
    option.textContent = folderName;
    folderSelect.appendChild(option);
  }

  function removeFolderOption(folderName) {
    const option = folderSelect.querySelector(`option[value="${folderName}"]`);
    if (option) {
      option.remove();
    }
  }

  // Initialize folder options
  chrome.storage.sync.get(["folders"], function (result) {
    const folders = result.folders || {
      links: [],
      articles: [],
      notes: [],
    };
    Object.keys(folders).forEach((folderName) => {
      addFolderOption(folderName);
    });
  });
});
