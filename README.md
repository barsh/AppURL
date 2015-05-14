# AppURL
redirect users from your website to your app

>Except for some minor revisions, this is the original documentation from appURL.org before they stopped supporting appurl.js and took the library and documentation offline.

Even if you [AppURL-enable your app](http://appUrl.org), users who have your app installed might still end up on your website:

*   Users might not have [AppURL clients](http://appUrl.org).
*   Users might not link to your website through [appurl.org/go](http://appUrl.org).

You can redirect users from your website to your app (if installed on their device) using our JavaScript library at [https://raw.githubusercontent.com/barsh/AppURL/master/appurl.js](https://raw.githubusercontent.com/barsh/AppURL/master/appurl.js).

Under the `<head>` tag in your HTML, add the following to import the `AppURL.openUrl` function.

To automatically call this function on page load, add it to an onload event handler:

```javascript
if (window.addEventListener) {
    window.addEventListener('load', function() {
        AppURL.openUrl();
    });
} else { // For IE support
    window.attachEvent('onload', function() {
        AppURL.openUrl();
    });
}
```
Or if you use jQuery:

```javascript
$(document).ready(function() {
    AppURL.openUrl();
});
```
Any of the following would open the Grid6 app from `http://grid6.us/bbbbbbaa`:

```javascript
/*
    1. Make an API call to AppURL.org
    2. Compute transformation for this URL
    3. Perform the redirect
*/
AppURL.openUrl('http://grid6.us/bbbbbbaa')
```

```javascript
/*
Calling without arguments uses location.href

    If you are on http://grid6.us/bbbbbbaa
    this is equivalent to:
        AppURL.openUrl('http://grid6.us/bbbbbbaa')
*/
AppURL.openUrl();
```

```javascript
/*
    If you already know the native URL,
    simply provide it as a second argument
*/
AppURL.openUrl(
    'http://grid6.us/bbbbbbaa',
    'grid6.us:/bbbbbbaa')
```

### Library Reference

Implements an [AppURL client](http://appurl.org) at the JavaScript level.

Takes two optional arguments:

- `webUrl` - The URL to open. Defaults to the current page's URL.
- `nativeUrl` - The custom-scheme URL to attempt to open in an app. If this argument is omitted, the library makes a call to the AppURL.org API's /transform method and uses the `nativeUrl` field in the API response.

If `AppURL.openUrl()` doesn't successfully launch an app on your user's device, it fails silently and doesn't needlessly refresh your page. If you have an AppURL-enabled app, we recommend making an `AppURL.openUrl()` call at load time everywhere on your website.

