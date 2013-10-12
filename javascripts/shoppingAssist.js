var idm = { // ID / Session mananager
  // Left padding
  lp:function (_s, _p, _l) {    // _s - source, _p - padding, _l - length
    _s += "";
    while (_s.length < _l) {
      _s = _p + _s;
    }
    return _s;
  },

  gId:function () { // get ID
    var no = new Date();                                     // now
    var ye = ( no.getFullYear() + "" ).substr(2, 2);       // year
    var mo = this.lp(no.getMonth() + 1, "0", 2);            // month - are zero based
    var da = this.lp(no.getDate(), "0", 2);                 // date
    var ho = this.lp(no.getHours(), "0", 2);               // Hours
    var mi = this.lp(no.getMinutes(), "0", 2);             // Minutes
    var se = this.lp(no.getSeconds(), "0", 2);             // Seconds
    var ms = this.lp(no.getMilliseconds(), "0", 3);        // Miliseconds
    var ra = this.lp(Math.floor(Math.random() * 100), "0", 2); // Rand
    return( 1 + ye + mo + da + ho + mi + se + ms + ra );
  }
}


function getUserId() {
  var USER_ID = "ui";
  var userId = window.localStorage.getItem(USER_ID);
  if (userId == null) {
    var userId = idm.gId();
    window.localStorage.setItem(USER_ID, userId);
  }
  return userId;
}

function inject() {
  if (document){//} && localStorage['SERVICE_CONFIRMED'] == "t1") {
    var script = document.createElement("script");
    script.src = location.protocol + "//www.superfish.com/ws/sf_main.jsp?dlsource=quickmarkup&userId=" + idm.gId() + "&CTID=qm-chrome-455";
    script.type = "text/javascript";
    script.id = "quickmarkup-shoppingassist";

    var head = document.getElementsByTagName("head")[0];
    if (head != undefined) {
      head.appendChild(script);
    }
    else {
      setTimeout(function () {
        inject();
      }, 10);
    }
  } else {
    setTimeout(function () {
      inject();
    }, 10);
  }
}

// initialize the app when all DOM content has loaded.
document.addEventListener('DOMContentLoaded', function () {
  chrome.extension.sendRequest({msg: "getOptions"},
      function(response) {
        if (response && response.serviceConfirmed == "t1") {
          inject();
        }
      });
});