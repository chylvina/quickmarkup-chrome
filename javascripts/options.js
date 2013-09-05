var bg = chrome.extension.getBackgroundPage();

function isHighVersion() {
  var version = navigator.userAgent.match(/Chrome\/(\d+)/)[1];
  return version > 9;
}

function init() {

  i18nReplace('optionTitle', 'options');
  i18nReplace('saveAndClose', 'save_and_close');
  i18nReplace('screenshootQualitySetting', 'quality_setting');
  i18nReplace('lossyScreenShot', 'lossy');
  i18nReplace('losslessScreenShot', 'lossless');
  i18nReplace('shorcutSetting', 'shortcut_setting');
  i18nReplace('settingShortcutText', 'shortcutsetting_text');
  i18nReplace('shoppingAssistSetting', 'shopping_assist_setting');
  i18nReplace('shoppingAssistText', 'shopping_assist');

  if (isHighVersion()) {
    $('lossyScreenShot').innerText += ' (JPEG)';
    $('losslessScreenShot').innerText += ' (PNG)';
  }

  initShoppingAssist();
  initScreenCaptureQuality();
  HotKeySetting.setup();
}

function save() {
  localStorage.screenshootQuality =
      $('lossy').checked ? 'jpeg' : '' ||
          $('lossless').checked ? 'png' : '';

  // shopping assist
  $('shoppingAssist').checked ? (localStorage['SERVICE_CONFIRMED'] = "t1")
            : (localStorage['SERVICE_CONFIRMED'] = "f0");

  return HotKeySetting.save();
}

function saveAndClose() {
  if (save()) {
    chrome.tabs.getSelected(null, function (tab) {
      chrome.tabs.remove(tab.id);
    });
  }
}

function initScreenCaptureQuality() {
  $('lossy').checked = localStorage.screenshootQuality == 'jpeg';
  $('lossless').checked = localStorage.screenshootQuality == 'png';
}

function initShoppingAssist() {
  if(localStorage['SERVICE_CONFIRMED'] == 't1') {
    $('shoppingAssist').checked = true;
  }
  else {
    $('shoppingAssist').checked = false;
  }
  $("shoppingAssist").addEventListener("change", updateSAH);

  updateSAH();
}

function updateSAH() {
  if($('shoppingAssist').checked == true) {
    shoppingAssistContainer.style.background = 'url(stylesheets/images/heart.png) no-repeat 26px 2px';
  }
  else {
    shoppingAssistContainer.style.background = 'url(stylesheets/images/heart_gray.png) no-repeat 26px 2px';
  }
}

// -------------------------------------

const CURRENT_LOCALE = chrome.i18n.getMessage('@@ui_locale');
if (CURRENT_LOCALE != 'zh_CN') {
  UI.addStyleSheet('./i18n_styles/en_options.css');
}

function isWindowsOrLinuxPlatform() {
  return navigator.userAgent.toLowerCase().indexOf('windows') > -1 ||
      navigator.userAgent.toLowerCase().indexOf('linux') > -1;
}

var HotKeySetting = (function () {
  const CHAR_CODE_OF_AT = 64;
  const CHAR_CODE_OF_A = 65;
  const CHAR_CODE_OF_Z = 90;
  var hotKeySelection =
      document.querySelectorAll('#hot-key-setting select');
  var isWindowsOrLinux = isWindowsOrLinuxPlatform();

  var hotkey = {
    setup:function () {
      // i18n.
      $('clear-element-text').innerText =
        chrome.i18n.getMessage('clear_element');
      $('area-capture-text').innerText =
          chrome.i18n.getMessage('capture_area');
      $('viewport-capture-text').innerText =
          chrome.i18n.getMessage('capture_window');
      $('full-page-capture-text').innerText =
          chrome.i18n.getMessage('capture_webpage');
      $('screen-capture-text').innerText =
          chrome.i18n.getMessage('capture_screen');

      for (var i = 0; i < hotKeySelection.length; i++) {
        hotKeySelection[i].add(new Option('--', '@'));
        for (var j = CHAR_CODE_OF_A; j <= CHAR_CODE_OF_Z; j++) {
          var value = String.fromCharCode(j);
          var option = new Option(value, value);
          hotKeySelection[i].add(option);
        }
      }

      $('clear-element-hot-key').selectedIndex =
        HotKey.getCharCode('clear') - CHAR_CODE_OF_AT;
      $('area-capture-hot-key').selectedIndex =
          HotKey.getCharCode('area') - CHAR_CODE_OF_AT;
      $('viewport-capture-hot-key').selectedIndex =
          HotKey.getCharCode('viewport') - CHAR_CODE_OF_AT;
      $('full-page-capture-hot-key').selectedIndex =
          HotKey.getCharCode('fullpage') - CHAR_CODE_OF_AT;
      $('screen-capture-hot-key').selectedIndex =
          HotKey.getCharCode('screen') - CHAR_CODE_OF_AT;

      $('settingShortcut').addEventListener('click', function () {
        hotkey.setState(this.checked);
      }, false);

      hotkey.setState(HotKey.isEnabled());
      if (isWindowsOrLinux) {
        // Capture screen region is not support on Linux and Mac platform.
        $('screen-capture-hot-key-set-wrapper').style.display =
            'inline-block';
      }
    },

    validate:function () {
      var hotKeyLength =
          Array.prototype.filter.call(hotKeySelection,
              function (element) {
                return element.value != '@'
              }
          ).length;
      if (hotKeyLength != 0) {
        var validateMap = {};
        validateMap[hotKeySelection[0].value] = true;
        validateMap[hotKeySelection[1].value] = true;
        validateMap[hotKeySelection[2].value] = true;
        validateMap[hotKeySelection[3].value] = true;
        if (isWindowsOrLinux) {
          validateMap[hotKeySelection[4].value] = true;
        }
        else {
          if (hotKeySelection[4].value != '@')
            hotKeyLength -= 1;
        }

        if (Object.keys(validateMap).length < hotKeyLength) {
          ErrorInfo.show('hot_key_conflict');
          return false;
        }
      }
      ErrorInfo.hide();
      return true;
    },

    save:function () {
      var result = true;
      if ($('settingShortcut').checked) {
        if (this.validate()) {
          HotKey.enable();
          HotKey.set('clear', $('clear-element-hot-key').value);
          HotKey.set('area', $('area-capture-hot-key').value);
          HotKey.set('viewport', $('viewport-capture-hot-key').value);
          HotKey.set('fullpage', $('full-page-capture-hot-key').value);

          if (isWindowsOrLinux) {
            var screenCaptureHotKey = $('screen-capture-hot-key').value;
            if (bg.plugin.setHotKey(screenCaptureHotKey.charCodeAt(0))) {
              HotKey.set('screen', screenCaptureHotKey);
            }
            else {
              var i18nKey = 'failed_to_register_hot_key_for_screen_capture';
              ErrorInfo.show(i18nKey);
              this.focusScreenCapture();
              result = false;
            }
          }
        }
        else {
          result = false;
        }
      }
      else {
        HotKey.disable(bg);
      }
      return result;
    },

    setState:function (enabled) {
      $('settingShortcut').checked = enabled;
      UI.setStyle($('hot-key-setting'), 'color', enabled ? '' : '#6d6d6d');
      for (var i = 0; i < hotKeySelection.length; i++) {
        hotKeySelection[i].disabled = !enabled;
      }
      ErrorInfo.hide();
    },

    focusScreenCapture:function () {
      $('screen-capture-hot-key').focus();
    }
  };
  return hotkey;
})();

var ErrorInfo = (function () {
  var infoWrapper = $('error-info');
  return {
    show:function (msgKey) {
      var msg = chrome.i18n.getMessage(msgKey);
      infoWrapper.innerText = msg;
      UI.show(infoWrapper);
    },

    hide:function () {
      UI.hide(infoWrapper);
    }
  };
})();

// initialize the app when all DOM content has loaded.
document.addEventListener('DOMContentLoaded', function () {
  init();
  $("saveAndClose").addEventListener("click", saveAndClose);
});