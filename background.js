var currentTab;
var currentBookmark;

/*
 * Updates the browserAction icon to reflect whether the current page
 * is already bookmarked.
 */
function updateIcon() {
  browser.browserAction.setIcon({
    path: currentBookmark ? {
      19: "icons/star-filled-19.png",
      38: "icons/star-filled-38.png"
    } : {
      19: "icons/star-empty-19.png",
      38: "icons/star-empty-38.png"
    },
    tabId: currentTab.id
  });
  browser.browserAction.setTitle({
    // Screen readers can see the title
    title: currentBookmark ? 'Unbookmark it!' : 'Bookmark it!',
    tabId: currentTab.id
  }); 
}

/*
 * Add or remove the bookmark on the current page.
 */
function getTodayString() {
  var today = new Date();
  return (today.getMonth() + 1) /*January is 0!*/ + '-' + today.getDate() + '-' + today.getFullYear();
}
function addBookmark() {
  // STEP ONE - Create folder if necessary
  var parentId = '';
  var rootId;

  function gotRootId(arr) {
    rootId = arr[0].id;
    console.log("Root node: " + rootId);
  }
  gettingRootId = browser.bookmarks.search({title: "Bookmarks Menu"});
  gettingRootId.then(gotRootId);

  function gotFolderId(arr) {
    if (arr.length > 0) {
      console.log("Folder dated today already exists");
      checkAndCreate(arr[0].id);
    } else {
      console.log("Creating folder with rootId " + rootId);
      madeFolderId = browser.bookmarks.create({title: getTodayString(), parentId: rootId, index: 0});
      madeFolderId.then(
        function(node) {
          checkAndCreate(node.id);
        }
      )
    }
  }
  gettingFolderId = browser.bookmarks.search({title: getTodayString()});
  gettingFolderId.then(gotFolderId);
}
function checkAndCreate(parentId) {
  function checkedExisting(arr) {
    for(let i of arr) {
      if (i.url === currentTab.url && i.parentId === parentId) {
        console.log("This boy already exists");
        return;
      }
    }
    browser.bookmarks.create({title: currentTab.title, url: currentTab.url, parentId: parentId});
  }
  checkingExisting = browser.bookmarks.search({title: currentTab.title, url: currentTab.url});
  checkingExisting.then(checkedExisting);
}
// function addBookmark() {
  // // STEP ONE - Create folder if necessary
  // parentId = '';
  // function gotFolderId(arr) {
  //   if (arr.length > 0) {
  //     parentId = arr[0].id;
  //     browser.bookmarks.create({title: currentTab.title, url: currentTab.url, parentId: parentId});
  //   } else {
  //     madeFolderId = browser.bookmarks.create({title: getTodayString()});
  //     madeFolderId.then(
  //       function(node) {
  //         parentId = node.id;
  //         browser.bookmarks.create({title: currentTab.title, url: currentTab.url, parentId: parentId});
  //       }
  //     )
  //   }
  // }
  // gettingFolderId = browser.bookmarks.search({title: getTodayString()});
  // gettingFolderId.then(gotFolderId);
// }

browser.browserAction.onClicked.addListener(addBookmark);

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
function updateActiveTab(tabs) {

  function isSupportedProtocol(urlString) {
    var supportedProtocols = ["https:", "http:", "ftp:", "file:"];
    var url = document.createElement('a');
    url.href = urlString;
    return supportedProtocols.indexOf(url.protocol) != -1;
  }

  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
      if (isSupportedProtocol(currentTab.url)) {
        var searching = browser.bookmarks.search({url: currentTab.url});
        searching.then((bookmarks) => {
          currentBookmark = bookmarks[0];
          updateIcon();
        });
      } else {
        console.log(`Bookmark it! does not support the '${currentTab.url}' URL.`)
      }
    }
  }

  var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then(updateTab);
}

// listen for bookmarks being created
browser.bookmarks.onCreated.addListener(updateActiveTab);

// listen for bookmarks being removed
browser.bookmarks.onRemoved.addListener(updateActiveTab);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// update when the extension loads initially
updateActiveTab();



// from "commands" example
/**
 * Returns all of the registered extension commands for this extension
 * and their shortcut (if active).
 *
 * Since there is only one registered command in this sample extension,
 * the returned `commandsArray` will look like the following:
 *    [{
 *       name: "toggle-feature",
 *       description: "Send a 'toggle-feature' event to the extension"
 *       shortcut: "Ctrl+Shift+U"
 *    }]
 */
let gettingAllCommands = browser.commands.getAll();
gettingAllCommands.then((commands) => {
  for (let command of commands) {
    // Note that this logs to the Add-on Debugger's console: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Debugging
    // not the regular Web console.
    console.log(command);
  }
});

/**
 * Fired when a registered command is activated using a keyboard shortcut.
 *
 * In this sample extension, there is only one registered command: "Ctrl+Space".
 * On Mac, this command will automatically be converted to "Command+Space".
 */
browser.commands.onCommand.addListener((command) => {
  addBookmark();
  // browser.tabs.create({url: "https://developer.mozilla.org"});
});
