/**
 * Created with JetBrains WebStorm.
 * User: chylvina
 * Date: 12-9-8
 * Time: 下午2:13
 * To change this template use File | Settings | File Templates.
 */
var href = window.location.href;
chrome.extension.sendRequest({
    msg: 'user_authentication_result',
    site: 'sina',
    url: href
});