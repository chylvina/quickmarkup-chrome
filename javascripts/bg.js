var screenshot = {
  tab:0,
  canvas:document.createElement("canvas"),
  startX:0,
  startY:0,
  scrollX:0,
  scrollY:0,
  docHeight:0,
  docWidth:0,
  visibleWidth:0,
  visibleHeight:0,
  scrollXCount:0,
  scrollYCount:0,
  scrollBarX:17,
  scrollBarY:17,
  captureStatus:true,

  handleHotKey:function (keyCode) {
    if (HotKey.isEnabled()) {
      switch (keyCode) {
        case HotKey.getCharCode('clear'):
          chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendRequest(tab.id, {command:'Block'});
            window.close();
          });
          break;
        case HotKey.getCharCode('area'):
          screenshot.showSelectionArea();
          break;
        case HotKey.getCharCode('viewport'):
          screenshot.captureWindow();
          break;
        case HotKey.getCharCode('fullpage'):
          screenshot.captureWebpage();
          break;
        case HotKey.getCharCode('screen'):
          screenshot.captureScreen();
          break
      }
    }
  },

  /**
   * Receive messages from content_script, and then decide what to do next
   */
  addMessageListener:function () {
    chrome.extension.onRequest.addListener(function (request, sender, response) {
      var isShortcut = eval(localStorage.settingShortcut);
      switch (request.msg) {
        case 'getOptions':
          var returnJson = {};
          returnJson.serviceConfirmed = localStorage['SERVICE_CONFIRMED'];
          response(returnJson);
          break;
        case 'capture_hot_key':
          screenshot.handleHotKey(request.keyCode);
          break;
        case 'capture_selected':
          screenshot.captureSelected();
          break;
        case 'capture_window':
          if (isShortcut) {
            screenshot.captureWindow();
          }
          break;
        case 'capture_area':
          if (isShortcut) {
            screenshot.showSelectionArea();
          }
          break;
        case 'capture_webpage':
          if (isShortcut) {
            screenshot.captureWebpage();
          }
          break;
      }
    });
  },

  /**
   * Send the Message to content-script
   */
  sendMessage:function (message, callback) {
    chrome.tabs.getSelected(null, function (tab) {
      chrome.tabs.sendRequest(tab.id, message, callback);
    });
  },

  showSelectionArea:function () {
    screenshot.sendMessage({msg:'show_selection_area'}, null);
  },

  captureWindow:function () {
    screenshot.sendMessage({msg:'capture_window'},
        screenshot.onResponseVisibleSize);
  },

  captureSelected:function () {
    screenshot.sendMessage({msg:'capture_selected'},
        screenshot.onResponseVisibleSize);
  },

  captureWebpage:function () {
    screenshot.sendMessage({msg:'scroll_init'},
        screenshot.onResponseVisibleSize);
  },

  onResponseVisibleSize:function (response) {
    switch (response.msg) {
      case 'capture_window':
        screenshot.captureVisible(response.docWidth, response.docHeight);
        break;
      case 'scroll_init_done':
        screenshot.startX = response.startX,
            screenshot.startY = response.startY,
            screenshot.scrollX = response.scrollX,
            screenshot.scrollY = response.scrollY,
            screenshot.canvas.width = response.canvasWidth;
        screenshot.canvas.height = response.canvasHeight;
        screenshot.visibleHeight = response.visibleHeight,
            screenshot.visibleWidth = response.visibleWidth,
            screenshot.scrollXCount = response.scrollXCount;
        screenshot.scrollYCount = response.scrollYCount;
        screenshot.docWidth = response.docWidth;
        screenshot.docHeight = response.docHeight;
        setTimeout(screenshot.captureAndScroll, 100);
        break;
      case 'scroll_next_done':
        screenshot.scrollXCount = response.scrollXCount;
        screenshot.scrollYCount = response.scrollYCount;
        setTimeout(screenshot.captureAndScroll, 100);
        break;
      case 'scroll_finished':
        screenshot.captureAndScrollDone();
        break;
    }
  },

  captureSpecialPage:function () {
    chrome.tabs.captureVisibleTab(null, {format:'png'}, function (data) {
      var image = new Image();
      image.onload = function () {
        screenshot.canvas.width = image.width;
        screenshot.canvas.height = image.height;
        var context = screenshot.canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        screenshot.postImage();

        //clear
        image = null;
      };
      image.src = data;
    });
  },

  /**
   * Use drawImage method to slice parts of a source image and draw them to
   * the canvas
   */
  capturePortion:function (x, y, width, height, visibleWidth, visibleHeight, docWidth, docHeight) {
    chrome.tabs.captureVisibleTab(null, {format:'png'}, function (data) {
      var image = new Image();
      image.onload = function () {
        var curHeight = image.width < docWidth ?
            image.height - screenshot.scrollBarY : image.height;
        var curWidth = image.height < docHeight ?
            image.width - screenshot.scrollBarX : image.width;
        var zoomX = curWidth / visibleWidth;
        var zoomY = curHeight / visibleHeight;
        screenshot.canvas.width = width * zoomX;
        screenshot.canvas.height = height * zoomY;
        var context = screenshot.canvas.getContext("2d");
        context.drawImage(image, x * zoomX, y * zoomY, width * zoomX,
            height * zoomY, 0, 0, width * zoomX, height * zoomY);
        screenshot.postImage();

        //clear
        image = null;
      };
      image.src = data;
    });
  },

  captureVisible:function (docWidth, docHeight) {
    chrome.tabs.captureVisibleTab(null, {format:'png'}, function (data) {
      var image = new Image();
      image.onload = function () {
        var width = image.height < docHeight ?
            image.width - 17 : image.width;
        var height = image.width < docWidth ?
            image.height - 17 : image.height;
        screenshot.canvas.width = width;
        screenshot.canvas.height = height;
        var context = screenshot.canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height, 0, 0, width, height);
        screenshot.postImage();

        //clear
        image = null;
      };
      image.src = data;
    });
  },

  captureScreenCallback:function (data) {
    var image = new Image();
    image.onload = function () {
      screenshot.canvas.width = image.width;
      screenshot.canvas.height = image.height;
      var context = screenshot.canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      screenshot.postImage();
    };
    image.src = "data:image/bmp;base64," + data;
  },

  /**
   * Use the drawImage method to stitching images, and render to canvas
   */
  captureAndScroll:function () {
    chrome.tabs.captureVisibleTab(null, {format:'png'}, function (data) {
      var image = new Image();
      image.onload = function () {
        var context = screenshot.canvas.getContext('2d');
        var width = 0;
        var height = 0;
        screenshot.scrollBarY = screenshot.visibleHeight < screenshot.docHeight ? 17 : 0;
        screenshot.scrollBarX = screenshot.visibleWidth < screenshot.docWidth ? 17 : 0;
        var visibleWidth = (image.width - screenshot.scrollBarY < screenshot.canvas.width ?
            image.width - screenshot.scrollBarY : screenshot.canvas.width);
        var visibleHeight = (image.height - screenshot.scrollBarX < screenshot.canvas.height ?
            image.height - screenshot.scrollBarX : screenshot.canvas.height);
        var x1 = screenshot.startX - screenshot.scrollX;
        var x2 = 0;
        var y1 = screenshot.startY - screenshot.scrollY;
        var y2 = 0;
        if ((screenshot.scrollYCount + 1) * visibleWidth >
            screenshot.canvas.width) {
          width = screenshot.canvas.width % visibleWidth;
          x1 = (screenshot.scrollYCount + 1) * visibleWidth -
              screenshot.canvas.width + screenshot.startX - screenshot.scrollX;
        } else {
          width = visibleWidth;
        }
        if ((screenshot.scrollXCount + 1) * visibleHeight >
            screenshot.canvas.height) {
          height = screenshot.canvas.height % visibleHeight;
          if ((screenshot.scrollXCount + 1) * visibleHeight + screenshot.scrollY < screenshot.docHeight) {
            y1 = 0;
          } else {
            y1 = (screenshot.scrollXCount + 1) * visibleHeight + screenshot.scrollY -
                screenshot.docHeight;
          }

        } else {
          height = visibleHeight;
        }
        x2 = screenshot.scrollYCount * visibleWidth;
        y2 = screenshot.scrollXCount * visibleHeight;
        context.drawImage(image, x1, y1, width, height, x2, y2, width, height);

        chrome.tabs.getSelected(null, function (tab) {
          var port = chrome.tabs.connect(tab.id);
          port.postMessage({msg:'scroll_next', visibleWidth:visibleWidth,
            visibleHeight:visibleHeight});

          port.onMessage.addListener(function getResp(response) {
            screenshot.onResponseVisibleSize(response);
          });
        });

        //clear
        image = null;
      };
      image.src = data;
    });
  },

  captureAndScrollDone:function () {
    screenshot.postImage();
  },

  /**
   * Autosave the image or post it to 'showimage.html'
   */
  postImage:function () {
    chrome.tabs.getSelected(null, function (tab) {
      screenshot.tab = tab;
    });
    chrome.tabs.create({'url':'show.html'});
    screenshot.sendMessage({msg:'closePopup'}, null);
  },

  isThisPlatform:function (operationSystem) {
    return navigator.userAgent.toLowerCase().indexOf(operationSystem) > -1;
  },

  executeScriptsInExistingTabs:function () {
    chrome.windows.getAll(null, function (wins) {
      for (var j = 0; j < wins.length; ++j) {
        chrome.tabs.getAllInWindow(wins[j].id, function (tabs) {
          for (var i = 0; i < tabs.length; ++i) {
            chrome.tabs.executeScript(tabs[i].id, {file:'javascripts/page.js'});
            chrome.tabs.executeScript(tabs[i].id, {file:'javascripts/shortcut.js'});
          }
        });
      }
    });
  },

  init:function () {
    localStorage.screenshootQuality = 'png';

    screenshot.executeScriptsInExistingTabs();
    screenshot.addMessageListener();

    if(!localStorage.qm_installed) {
      localStorage.qm_installed = true;
      chrome.tabs.create({ url:'options.html'});
    }
  },

  clear:function () {
    //screenshot.canvas = null;
    screenshot.canvas = document.createElement("canvas");
  }
};

var ajax = {
  uploadImage:function (data, title, url, successCallback, failedCallback) {
    const BOUNDARY = "345823569845694578678";

    // Build the mime header
    var header = new String();
    header += "--" + BOUNDARY + "\r\n";

    // title
    if (title) {
      header += "content-disposition: form-data; name=\"title\"; \r\n";
      header += "\r\n";
      header += encodeURI(String(title));
      header += "\r\n--" + BOUNDARY + "\r\n";
    }

    // url
    if (url) {
      header += "content-disposition: form-data; name=\"url\"; \r\n";
      header += "\r\n";
      header += encodeURI(String(url));
      header += "\r\n--" + BOUNDARY + "\r\n";
    }

    // image
    header += "content-disposition: form-data; name=\"Filedata\"; filename=\"image.png\" \r\n";
    header += "content-type:" + "image/png" + " \r\n";
    header += "\r\n";
    header += atob(data.substr(22));

    // end
    header += "\r\n--" + BOUNDARY + "--";

    // do POST
    var req = new XMLHttpRequest();
    req.open('POST', "http://quick-markup.com/upload", true);
    req.onreadystatechange = function () {
      ajax.onRequestState(req, successCallback, failedCallback);
    };
    req.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + BOUNDARY);
    req.setRequestHeader("Content-Length", header.length);
    req.send(ajax.constructBlobData(header));
  },

  onRequestState:function (req, successCallback, failedCallback) {
    if (req.readyState == 4) {
      if (req.status == 200 && req.responseText != '0') {
        successCallback("http://quick-markup.com" + String(req.responseText));
      }
      else {
        alert(chrome.i18n.getMessage("uploadFailed"));
        if (failedCallback)
          failedCallback();
      }
    }
  },

  constructBlobData:function (dataString, contentType) {
    var len = dataString.length;
    // Create a 8-bit unsigned integer ArrayBuffer view
    var data = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      data[i] = dataString.charCodeAt(i);
    }

    var blob = new Blob([data], { type: contentType });
    return blob;
  }
}

screenshot.init();