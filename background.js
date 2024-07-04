chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ items: [] }, function () {
    console.log("Initial storage set up");
  });
});
