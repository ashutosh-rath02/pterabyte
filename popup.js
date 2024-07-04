document.addEventListener("DOMContentLoaded", function () {
  const addForm = document.getElementById("addForm");
  const folderContainer = document.getElementById("folderContainer");
  const folderSelect = document.getElementById("folderSelect");
  const newFolderName = document.getElementById("newFolderName");
  const addNewFolder = document.getElementById("addNewFolder");
  const newFolderForm = document.getElementById("newFolderForm");
  const confirmNewFolder = document.getElementById("confirmNewFolder");

  function openPopup() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      document.getElementById("title").value = currentTab.title;
      document.getElementById("description").value = currentTab.url;
    });
  }

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.action === "openPopup") {
      openPopup();
    }
  });

  loadFoldersAndItems();

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

  addNewFolder.addEventListener("click", function () {
    newFolderForm.style.display =
      newFolderForm.style.display === "none" ? "flex" : "none";
  });

  confirmNewFolder.addEventListener("click", function () {
    const folderName = newFolderName.value.trim();
    if (folderName) {
      chrome.storage.sync.get(["folders"], function (result) {
        const folders = result.folders || {};
        if (!folders[folderName]) {
          folders[folderName] = [];
          chrome.storage.sync.set({ folders: folders }, function () {
            loadFoldersAndItems();
            newFolderName.value = "";
            newFolderForm.style.display = "none";
            addFolderOption(folderName);
          });
        } else {
          alert("Folder already exists");
        }
      });
    }
  });

  function loadFoldersAndItems() {
    chrome.storage.sync.get(["folders"], function (result) {
      const folders = result.folders || {
        Links: [],
        Articles: [],
        Notes: [],
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
        <div>
          <i class="fas fa-trash delete-folder" data-folder="${folderName}"></i>
          <i class="fas fa-chevron-down"></i>
        </div>
      </div>
      <div class="folder-content">
        <div class="loader" style="display: none;"></div>
      </div>
    `;

    const contentElement = folderElement.querySelector(".folder-content");
    const loader = contentElement.querySelector(".loader");

    folderElement
      .querySelector(".folder-header")
      .addEventListener("click", function () {
        const content = this.nextElementSibling;
        const chevron = this.querySelector(".fa-chevron-down");
        if (content.style.display === "none" || content.style.display === "") {
          content.style.display = "block";
          chevron.style.transform = "rotate(180deg)";
          if (contentElement.children.length === 1) {
            loader.style.display = "inline-block";
            setTimeout(() => {
              renderItems(contentElement, items, folderName);
              loader.style.display = "none";
            }, 300);
          }
        } else {
          content.style.display = "none";
          chevron.style.transform = "rotate(0deg)";
        }
      });

    folderElement
      .querySelector(".delete-folder")
      .addEventListener("click", deleteFolder);

    return folderElement;
  }

  function renderItems(contentElement, items, folderName) {
    items.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = "item";
      itemElement.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="item-buttons">
          <button class="copy" data-folder="${folderName}" data-index="${index}">Copy</button>
          <i class="fas fa-trash delete" data-folder="${folderName}" data-index="${index}"></i>
        </div>
      `;
      contentElement.appendChild(itemElement);
    });

    contentElement.querySelectorAll(".copy").forEach((button) => {
      button.addEventListener("click", copyItem);
    });
    contentElement.querySelectorAll(".delete").forEach((icon) => {
      icon.addEventListener("click", deleteItem);
    });
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

  chrome.storage.sync.get(["folders"], function (result) {
    const folders = result.folders || {
      Links: [],
      Articles: [],
      Notes: [],
    };
    Object.keys(folders).forEach((folderName) => {
      addFolderOption(folderName);
    });
  });
});
