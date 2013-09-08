/// init event listener
configEventListener('doMarkup');
configEventListener('doUpload');
configEventListener('doSave');
configEventListener('doCopy');
//configEventListener('doSinaWB');

//document.getElementById('btn_logon_sinawb').addEventListener('click', toDo, false);
//document.getElementById('btn_send').addEventListener('click', toDo, false);

function configEventListener(objID) {
	document.getElementById(objID).addEventListener('click', toDo, false);
	document.getElementById(objID).addEventListener('mouseover', onMouseOver, false);
	document.getElementById(objID).addEventListener('mouseout', onMouseOut, false);
}

// Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-20877394-1']);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

/// init UI
if(!document.getElementById('pluginobj').SaveScreenshot) {
	($("doSave").style.display = "none");
}
if(!document.getElementById('pluginobj').SaveToClipboard) {
	($("doCopy").style.display = "none");
}

switch(getLanguage()) {
	case "zh":
		if(navigator.language == "zh-TW") {
			$("qm_logo").style.background = "url(stylesheets/images/whattodo_tw.png) no-repeat right";
		}
		else {
			$("qm_logo").innerHTML = '<a href="http://quick-markup.com" target="_blank"><img src="stylesheets/images/logo.png" /></a>';
			$("qm_logo").style.background = "url(stylesheets/images/whattodo_cn.png) no-repeat right";
		}
		//$("doSinaWB").style.display = "block";
		break;
	case "en":
		$("qm_logo").style.background = "url(stylesheets/images/whattodo_en.png) no-repeat right";
		break;
	case "ja":
		$("qm_logo").style.background = "url(stylesheets/images/whattodo_ja.png) no-repeat right";
		break;
	case "de":
		$("qm_logo").style.background = "url(stylesheets/images/whattodo_de.png) no-repeat right";
		break;
	case "it":
		$("qm_logo").style.background = "url(stylesheets/images/whattodo_it.png) no-repeat right";
		break;
	case "fr":
		$("qm_logo").style.background = "url(stylesheets/images/whattodo_fr.png) no-repeat right";
		break;
}

i18nReplace("doMarkup" , "doMarkup");
i18nReplace("doUpload" , "doUpload");
i18nReplace("doSave" , "doSave");
i18nReplace("doCopy" , "doCopy");

i18nReplace("tip_markup1" , "tip_markup1");
i18nReplace("tip_markup2" , "tip_markup2");
i18nReplace("tip_markup3" , "tip_markup3");
i18nReplace("tip_markup4" , "tip_markup4");
i18nReplace("tip_upload" , "tip_upload");
i18nReplace("tip_save" , "tip_save");
i18nReplace("tip_copy" , "tip_copy");
i18nReplace("promotiontip" , "promotiontip");

// get image
var bg = chrome.extension.getBackgroundPage();
var tabTitle = bg.screenshot.tab.title || chrome.i18n.getMessage("Untitled");
var tabURL = bg.screenshot.tab.url || "";
//tabTitle = tabTitle.replace(/[￥#$~!@%^&*();'"?><\[\]{}\|,:\/=+—“”‘]/g, ' ');
$("title").innerHTML = "<a href=" + tabURL + " target='_blank'>" + tabTitle + "</a>";
var image = $("image");
var imageWidth = bg.screenshot.canvas.width;
var imageHeight = bg.screenshot.canvas.height;
var imageURL;
var uploading = false;
image.onload = function (){
	image.style.marginTop = (image.height >= 490) ? "auto" : ((490 - image.height) / 2 + "px");
}
$("image").src = bg.screenshot.canvas.toDataURL('image/png');
bg.screenshot.clear();

function navigateToURL(url) {
	window.location.href = url;
}

function onUploadComplete(url) {
	uploading = false;
	imageURL = url
	i18nReplace("doUpload" , "uploaded");
	$("doUpload").style.cursor = "pointer";
	if(!publisher.enabled) {
		resultPanelHandler.popup(chrome.i18n.getMessage("uploadComplete") + 
			'<br/><a href="' + url + '" target="_blank">' + url + '</a>');
	}
}

function onUploadFailed() {
	uploading = false;
	i18nReplace("doUpload" , "doUpload");
	$("doUpload").style.cursor = "pointer";
}

function onMouseOver(evt) {
	if(evt.target.nextElementSibling) {
        evt.target.nextElementSibling.style.display = "block";
    }
}

function onMouseOut(evt) {
    if(evt.target.nextElementSibling) {
        evt.target.nextElementSibling.style.display = "none";
    }
}

// handle event
function toDo(evt) {
	var elem = evt.currentTarget;
	switch(elem.id) {
		case 'doMarkup':
			// get image data
			var data;
			const MAX_DIM = 8191;
			var w = imageWidth;
			var h = imageHeight;
			
			if( w>MAX_DIM || h>MAX_DIM) {
				alert(chrome.i18n.getMessage('tooBig'));
				
				var canvasW = w;
				var canvasH = h;
				if(w > h) {
					canvasW = MAX_DIM;
					canvasH = canvasW*h/w;
				}
				else {
					canvasH = MAX_DIM;
					canvasW = canvasH*w/h;
				}
				
				var canvas = document.createElement("canvas");
				canvas.style.width = canvasW+"px";
				canvas.style.height = canvasH+"px";
				canvas.width = canvasW;
				canvas.height = canvasH;
				var ctx = canvas.getContext("2d");
				ctx.drawImage($("image"), 0, 0, canvasW, canvasH, 0, 0, canvasW, canvasH);
				data = canvas.toDataURL("image/png", "");
				canvas = null;
			} else {
				data = $("image").src;
			}
		
			// get language
			var lang = window.navigator.language;
			( lang === 'zh-CN' || lang === 'zh-TW' ) ? (lang = 'zh_CN') : (lang = 'en_US');
			
			document.body.innerHTML = '<div style="width: 100%; height: 100%;" id="flashContent"><object type="application/x-shockwave-flash"' + 
					'data="https://d1vux6a1qckdp3.cloudfront.net/app/editor20120820.swf" width="100%" height="100%">'+
					'<param name="FlashVars" value="localeChain='+lang+'&t=2&imgSrc='+ data.replace(/\+/g,'%2b') + '&title=' + tabTitle.replace(/\+/g,'%2b') + '&loc=' + tabURL.replace(/\+/g,'%2b') + '" />' +
					'<param name="movie" value="editor.swf" />'+
					'<param name="quality" value="high" />'+
					'<param name="bgcolor" value="#333333" />'+
					'<param name="play" value="true" />'+
					'<param name="loop" value="true" />'+
					'<param name="wmode" value="window" />'+
					'<param name="scale" value="showall" />'+
					'<param name="menu" value="true" />'+
					'<param name="devicefont" value="false" />'+
					'<param name="salign" value="" />'+
					'<param name="allowNetworking" value="all" />'+
					'<param name="allowScriptAccess" value="internal" />'+
					'</object></div>';
					
			document.body.style.overflow = "hidden";
			document.body.style.backgroundColor = "#333333";
			break;
		case 'doUpload':
			if(uploading)
				return;
				
			if(imageURL) {
				onUploadComplete(imageURL);
			}
            else {
				uploading = true;
				elem.innerHTML = "<span style='color: #4f4f4f;'>" + chrome.i18n.getMessage("uploading") + "</span>";
				elem.style.cursor = "default";
				bg.ajax.uploadImage($("image").src , tabTitle , tabURL , onUploadComplete, onUploadFailed);
			}
			
			break;
		case 'doSave':
			document.getElementById('pluginobj').SaveScreenshot(
			  $("image").src, 
			  tabTitle, 		//filename
			  localStorage.lastSavePath || '',											//save directory 
			  function(result, path) {
				if (result == 1) {
					alert(chrome.i18n.getMessage('save_fail'));
				}
				else if (result == 0 && path) {
					localStorage.lastSavePath = path;
				}
				  
			  },
			  chrome.i18n.getMessage("save_image") 										//prompt window title
			);
			break;
		case 'doCopy':
			if(document.getElementById('pluginobj').SaveToClipboard($("image").src)) {
				i18nReplace("doCopy" , "copied");
			}
			else {
				i18nReplace("doCopy" , "copyFailed");
			}
			break;
		case 'doSinaWB':
			publisher.init();
			break;
		case 'btn_logon_sinawb':
			SinaMicroblog.getRequestToken();
			break;
		case 'btn_send':
			publisher.doUpload();
			break;
		case 'changeAccount':
			SinaMicroblog.logout(function() {
				  publisher.showErrorInfo("");
				});
			break;
	}
}

// Cache tab id of edit page, so that we can get tab focus after getting access
// token
var tabIdOfEditPage;
chrome.tabs.getSelected(null, function(tab) {
  tabIdOfEditPage = tab.id;
});

function selectTab(tabId) {
  chrome.tabs.update(tabId, {
	selected: true
  });
}

function closeTab(tabId) {
  chrome.tabs.remove(tabId);
}

chrome.extension.onRequest.addListener(function(request, sender, response) {
  switch (request.msg) {
	  case 'user_authentication_result':
		selectTab(tabIdOfEditPage);
		closeTab(sender.tab.id);
		SinaMicroblog.parseAccessTokenResult(request.url);
		console.log('Received sina microblog user authentication:' + request.url);
		break;
	}
});

var resultPanelHandler = {
	popup: function(s){
		if(publisher.enabled) {
			return;
		}
		
		s = s || '';
		// init display
		$("resultPanel").style.display = "block";
		$("panelBG").style.display = "block";
		$("resultPanel").getElementsByTagName("div")[1].innerHTML = s;
		$("resultPanel").style.left = (document.body.clientWidth - $("resultPanel").clientWidth) / 2 + "px";
		$("resultPanel").style.top = (document.body.clientHeight - $("resultPanel").clientHeight) / 2 + "px";
		
		// config event
		$("panelBG").addEventListener("click" , resultPanelHandler.close);
		$("closeResultPanel").addEventListener("click" , resultPanelHandler.close);
	},
	close: function() {
		$("resultPanel").style.display = "none";
		$("panelBG").style.display = "none";
		
		//
		$("panelBG").removeEventListener("click" , resultPanelHandler.close);
		$("closeResultPanel").removeEventListener("click" , resultPanelHandler.close);
	}
}
var publisher = {
	firstTime: true,
	enabled: false,
	init: function() {
		if(publisher.enabled) {
			return;
		}
		publisher.enabled = true;
		
		// init display
		$("sharePanel").style.display = "block";
		$("panelBG").style.display = "block";
		$("sharePanel").style.left = (document.body.clientWidth - $("sharePanel").clientWidth) / 2 + "px";
		$("sharePanel").style.top = (document.body.clientHeight - $("sharePanel").clientHeight) / 2 + "px";
		
		//
		if(publisher.firstTime) {
			publisher.firstTime = false;
			var user = Account.getUser(SinaMicroblog.siteId);
			if(user) {
				publisher.onAccountReady();
			} else {
				publisher.showErrorInfo('');
			}
		}
		
		// config event
		$("txt").addEventListener("focus" , publisher.limitLength);
		$("txt").addEventListener("blur" , publisher.limitLength);
		$("txt").addEventListener("keyup" , publisher.limitLength);
		$("panelBG").addEventListener("click" , publisher.close);
		$("closeSharePanel").addEventListener("click" , publisher.close);
	},
	
	close: function() {
		if(!publisher.enabled) {
			return;
		}
		publisher.enabled = false;
		
		$("sharePanel").style.display = "none";
		$("panelBG").style.display = "none";
		
		//
		txt.removeEventListener("focus" , publisher.limitLength);
		txt.removeEventListener("blur" , publisher.limitLength);
		txt.removeEventListener("keyup" , publisher.limitLength);
		$("panelBG").removeEventListener("click" , publisher.close);
		$("closeSharePanel").removeEventListener("click" , publisher.close);
	},
	
	onAccountReady: function(name) {
		$("btn_logon_sinawb").style.display = "none";
		$("btn_send").style.display = "block";
		$("accountInfo").style.display = "block";
		$("outputInfo").style.display = "none";
		$("userName").innerHTML = Account.getUser(SinaMicroblog.siteId)['name'];
		
		publisher.enablePublishBtn();
	},
	
	doUpload: function() {
		if(Account.getUser(SinaMicroblog.siteId)) {
			var access_token = Account.getUser(SinaMicroblog.siteId)['accessToken'];
			var successCallback;
			var failureCallback;
			
			if (access_token) {
				var userId = Account.getUser(SinaMicroblog.siteId)['id'];
				var access_token_secret = Account.getUser(SinaMicroblog.siteId)['accessTokenSecret'];
				successCallback = function(data) {
					publisher.close();
					var url = 'http://www.weibo.com/' + userId;
					resultPanelHandler.popup('发布微博成功 :)<br /><a href="' + url + '" target="_blank">访问我的微博</a>');
					$("txt").disabled = false;
					publisher.enablePublishBtn();
					$("loadingIcon").style.display = "none";
				};
				failureCallback = function(errorData) {
					publisher.showErrorInfo("上传失败<br />请重新登录");
					$("txt").disabled = false;
					publisher.enablePublishBtn();
					$("loadingIcon").style.display = "none";
				};
				SinaMicroblog.upload(access_token, access_token_secret, $("txt").value,
						successCallback, null, failureCallback);
				$("loadingIcon").style.display = "block";
				publisher.disablePublishBtn();
				$("txt").disabled = true;
			} else {
				//SinaMicroblog.getAccessToken();
			}
		}
	},
	
	showErrorInfo: function(s) {
		$("btn_logon_sinawb").style.display = "block";
		$("btn_send").style.display = "none";
		$("accountInfo").style.display = "none";
		$("outputInfo").style.display = "table-cell";
		$("outputInfo").innerHTML = s;
		Account.removeUser(SinaMicroblog.siteId);
	},
	
	getPhotoData: function() {
		var dataUrl = $('image').src;
		var photoDataIndex = dataUrl.indexOf('data:image/png;base64,');
		if (photoDataIndex != 0) {
		  return;
		}
	
		// Decode to binary data
		return atob(dataUrl.substr(photoDataIndex + 22));
	},
	
	// ------------ String Util -----------------
	limitLength: function() {
		var sLength = 140;
		var snapLength = publisher.getLength($("txt").value);
		if (snapLength > sLength) {
			$("txt_count_msg").innerHTML = "已超出<em>" + (snapLength - sLength) + "</em>字";
		} else {
			$("txt_count_msg").innerHTML = "还可以输入<em>" + (sLength - snapLength) + "</em>字";
		}
		$("txt_count_msg").className = snapLength == 0 || snapLength <= sLength ? "" : "red";
		publisher.allow(snapLength <= sLength && snapLength > 0);
	},
	
	allow: function (b) {
		if (!b) {
			publisher.disablePublishBtn();
		} else {
			publisher.enablePublishBtn();
		}
	},
	
	enablePublishBtn: function() {
        document.getElementById('btn_send').addEventListener('click', toDo, false);
		$("btn_send").style.backgroundPosition = "";
		$("btn_send").getElementsByTagName("span")[0].style.backgroundPosition = "";
		$("btn_send").getElementsByTagName("span")[0].style.color = "#fff";
		$("btn_send").style.cursor = "pointer";
	},
	
	disablePublishBtn: function() {
        document.getElementById('btn_send').removeEventListener('click', toDo, false);
		$("btn_send").style.backgroundPosition = "100% -30px";
		$("btn_send").getElementsByTagName("span")[0].style.backgroundPosition = "0% -30px";
		$("btn_send").getElementsByTagName("span")[0].style.color = "#eee";
		$("btn_send").style.cursor = "default";
	},
	
	getLength: function (str) {
		var len = publisher.trim(str).length;
		if (len > 0) {
			var min = 41,
				max = 140,
				surl = 20,
				tmp = str;
			var urls = str.match(/http:\/\/[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)+([-A-Z0-9a-z\$\.\+\!\*\(\)//,:;@&=\?\~\#\%]*)*/gi) || [];
			var urlCount = 0;
			for (var i = 0, len = urls.length; i < len; i++) {
				var count = publisher.byteLength(urls[i]);
				if (/^(http:\/\/t.cn)/.test(urls[i])) {
					continue;
				} else {
					if (/^(http:\/\/)+(t.sina.com.cn|t.sina.cn)/.test(urls[i])) {
						urlCount += count <= min ? count : (count <= max ? surl : (count - max + surl));
					} else {
						urlCount += count <= max ? surl : (count - max + surl);
					}
				}
				tmp = tmp.replace(urls[i], "");
			}
			return Math.ceil((urlCount + publisher.byteLength(tmp)) / 2);
		} else {
			return 0;
		}
	},
	
	trimHead: function (str) {
		return str.replace(/^(\u3000|\s|\t)*/gi, "");
	},
	
	trimTail: function (str) {
		return str.replace(/(\u3000|\s|\t)*$/gi, "");
	},
	
	trim: function (str) {
		return publisher.trimHead(publisher.trimTail(str));
	},
	
	byteLength: function (str) {
		if (typeof str == "undefined") {
			return 0;
		}
		var aMatch = str.match(/[^\x00-\x80]/g);
		return (str.length + (!aMatch ? 0 : aMatch.length));
	}
}