// Create context menu option:
browser.contextMenus.create({
    id: "easydict",
    title: "Define using EasyDict",
    contexts: ["selection"]
  })

browser.contextMenus.onClicked.addListener(contextDefine); // set onclick listener to the context menu option

// Function to call a function in content script:
function contextDefine(info, tab) {
  browser.tabs.query({
    "active": true,
    "currentWindow": true
  }, function (tabs) {
    browser.tabs.sendMessage(tabs[0].id, {
        "functiontoInvoke": "showMeaning" // sends a message to be received in content script
    });
  });
}