/*
    Ideal Case:
        Try to launch App
            * Success:
                If there is browser history, go back
                If there isnt browser history, close window
            * Failure:
                Go to web target
    Problems:
        1. Can't distinguish between success and failure
            * All except IE 10 Desktop and Firefox Desktop
        2. Error window on failure
            * iOS, IE 10 Mobile

    Two Solutions:
        Option 1:
            1. Launch App
            2. Go to landing page
        Option 2:
            1. Go to landing page, where user is presented with options
                * Launch App
                * Web target
                * Go back
                ** This also clarifies problem #2

    Browsers that handle ideal case:
        MSIE 10 Desktop via msLaunchUri
        Firefox Desktop via try/catch
    Everything else goes to worst case, when the `userDecision` variable comes into play



    *** Browser Specs That We Care About ***
    Browsers that fail loudly (* next to name if errors are stifled by iframe):
        Mobile Safari (IOS)
        Desktop Safari *
        Mobile IE10 (WP8)
    Browsers that fail silently (* next to name means they can catch bad links):
        Mobile Chrome
        Desktop Chrome
        Firefox Desktop *
        Desktop IE10 *
        Android Default Browser
        Chrome on IOS
        Opera
*/

(function(root, factory) {
    'use strict';

    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define(factory);
    else if (typeof exports === 'object')
        exports.AppURL = factory();
    else
        root.AppURL = factory();
})(window, function() {
    'use strict';

    var AppURL = {};

    /*
        AppURL.openUrl(nativeUrl, webUrl):

        If webUrl is falsy, perform an XMLHttpRequest from appurl.org to find its value.

        When the current page has loaded:
            Attempt to browse to the given nativeUrl.
            If we can tell that the nativeUrl failed to open, then browse to the webUrl.
            If this somehow fails, stay on the current page.
    */

    AppURL.openUrl = function(siteUrl, appUrl) {
        if (typeof siteUrl === 'undefined' || siteUrl === null) {
            siteUrl = window.location.href;
        }

        // Detect userAgent -- Special Cases
        var userAgent = navigator.userAgent.toLowerCase();
        var isIOS = userAgent.indexOf('ipad') > -1 || userAgent.indexOf('iphone') > -1; // iframe doesnt work
        var isAndroid = userAgent.indexOf('android') > -1; // Time hack doesnt work
        // var isWinPhone = userAgent.indexOf('windows phone 8.0') > -1; // Alert box wont go away
        var isChrome = userAgent.indexOf('chrome') > -1; // Time hack doesnt work
        var isIOSChrome = isIOS && userAgent.indexOf('crios') > -1;
        var isIOSSafari = isIOS && !isIOSChrome;
        var isIE10Desktop = userAgent.indexOf('msie 10.0') > -1 && userAgent.indexOf('windows phone 8.0') == -1; // Special msLaunchUri function
        var isFirefoxMobile = userAgent.indexOf('firefox') > -1 && userAgent.indexOf('mobile') > -1;
        var isFirefoxDesktop = userAgent.indexOf('firefox') > -1 && !isFirefoxMobile; // Lets us throw/catch navigation errors
        var isDesktopSafari = userAgent.indexOf('safari') > -1 && !isIOS; // Best example of stifling navigation error with iframe
        var isOpera = userAgent.indexOf('opera') > -1;

        /*
            Perform redirection:
                Try to load appUrl. (And, if that succeeds, send the browser state back a page.)
                If that fails and we can tell, load the siteUrl.
                If we couldn't tell, stay on the current page.
        */
       
        var redirect = function(siteUrl, appUrl, forceRedirect) {
            if (typeof forceRedirect === 'undefined' || forceRedirect === null) {
                forceRedirect = false;
            }
            appUrl = appUrl + window.location.hash;
            var goBack = function() {
                if (window.history.length) {
                    window.history.back();
                }
            };

            var iframeStifles = (!isAndroid) && (isChrome || isIOSChrome || isDesktopSafari || isFirefoxDesktop || isIE10Desktop || isOpera);

            // Create an iframe element - will use to load appUrl later
            var iframeNode = document.createElement('iframe');
            // Hide iframe
            iframeNode.style.display = 'none';
            iframeNode.setAttribute('height', 0);
            iframeNode.setAttribute('width', 0);

            iframeNode.setAttribute('id', 'appurliframeloader');
            document.body.appendChild(iframeNode);

            if (isIE10Desktop) { // Use special IE 10 Desktop msLaunchUri function - gives us custom success/failure callbacks
                navigator.msLaunchUri(appUrl, function() {
                    //success
                    goBack();
                }, function() {
                    //failure
                    if (window.location.href != siteUrl) {
                        navigator.msLaunchUri(siteUrl);
                    }
                });
            } /* else if (isFirefoxMobile) {
                var activity = new MozActivity({
                    name: 'view',
                    data: {
                        type: 'url',
                        url: siteUrl
                    }
                });
            } */ else if (isFirefoxDesktop) {
                window.siteUrl = siteUrl;
                if (window.location.href != siteUrl) {
                    iframeNode.setAttribute('onerror', 'window.location.href = siteUrl;delete window.siteUrl;'); //Failure case
                }
                iframeNode.setAttribute('src', appUrl);
                setTimeout(function() { //Success case
                    delete window.siteUrl;
                    goBack();
                }, 4000);
            } else if (isIOSSafari) {
                // iOS wont load a scheme URL in an iframe
                window.location.href = appUrl;
                var startTime = +new Date();
                setTimeout(function() {
                    // Lets use a timehack since it works on Mobile Safari
                    if (+new Date() - startTime < 1530) {
                        //failure
                        if (window.location.href != siteUrl) {
                            window.location.href = siteUrl;
                        }
                    } else {
                        //success
                        goBack();
                    }
                }, 1500);
            } else {
                if (iframeStifles) {
                    // Using an iframe stifles some errors, and lets us remain on the same page while launching app
                    iframeNode.setAttribute('src', appUrl);
                } else {
                    if (forceRedirect) {
                        location.href = appUrl;
                    }
                    // It doesnt always stifle errors -- dont even try
                }
            }
        };

        if (appUrl) {
            redirect(siteUrl, appUrl);
        } else {
            var reqUrl = 'http://api.appurl.org/transform/' + siteUrl;

            var req;
            if (window.XMLHttpRequest) {
                req = new XMLHttpRequest();
            } else {
                req = new ActiveXObject('Microsoft.XMLHTTP');
            }
            req.onreadystatechange = function() {
                if (req.readyState == 4 && req.status == 200) {
                    var response = JSON.parse(req.response);
                    redirect(response.webUrl, response.nativeUrl, false);
                }
            };
            req.open('GET', reqUrl, true);
            req.setRequestHeader('Accept', 'application/json');
            req.send();
        }
    };

    return AppURL;
});