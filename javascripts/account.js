var User = function(id, name, accessToken, accessTokenSecret) {
  this.id = id;
  this.name = name;
  this.accessToken = accessToken;
  this.accessTokenSecret = accessTokenSecret;
};

var Account = {  
  setUser: function(siteId, user) {
  	localStorage.setItem(siteId + '_userInfo', JSON.stringify(user));
  },
  
  getUser: function(siteId) {
  	var userInfo = localStorage.getItem(siteId + '_userInfo');
    if (userInfo) {
      return JSON.parse(userInfo);
    }
    return null;
  },
  
  removeUser: function(siteId) {
    localStorage.setItem(siteId + '_userInfo', '');
  }
};