document.addEventListener("DOMContentLoaded", function () {
  const addForm = document.getElementById("addForm");
  const itemList = document.getElementById("itemList");

  // Load saved items
  loadItems();

  // Add new item
  addForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;

    chrome.storage.sync.get(["items"], function (result) {
      const items = result.items || [];
      items.push({ title, description });
      chrome.storage.sync.set({ items: items }, function () {
        loadItems();
        addForm.reset();
      });
    });
  });

  // Load and display items
  function loadItems() {
    chrome.storage.sync.get(["items"], function (result) {
      const items = result.items || [];
      itemList.innerHTML = "";
      items.forEach((item, index) => {
        const itemElement = document.createElement("div");
        itemElement.className = "item";
        itemElement.innerHTML = `
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <button class="copy" data-index="${index}">Copy</button>
            <button class="delete" data-index="${index}">Delete</button>
          `;
        itemList.appendChild(itemElement);
      });

      // Add event listeners for copy and delete buttons
      document.querySelectorAll(".copy").forEach((button) => {
        button.addEventListener("click", copyItem);
      });
      document.querySelectorAll(".delete").forEach((button) => {
        button.addEventListener("click", deleteItem);
      });
    });
  }

  // Copy item to clipboard
  function copyItem(e) {
    const index = e.target.getAttribute("data-index");
    chrome.storage.sync.get(["items"], function (result) {
      const items = result.items || [];
      const item = items[index];
      const textToCopy = `${item.title}\n\n${item.description}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        alert("Copied to clipboard!");
      });
    });
  }

  // Delete item
  function deleteItem(e) {
    const index = e.target.getAttribute("data-index");
    chrome.storage.sync.get(["items"], function (result) {
      const items = result.items || [];
      items.splice(index, 1);
      chrome.storage.sync.set({ items: items }, function () {
        loadItems();
      });
    });
  }
});
