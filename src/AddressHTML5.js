/**
 * AddressHTML5.
 */
define([
    './Address',
    'jquery',
    './util/mixIn',
    './util/startsWith',
    './util/browser'
], function (Address, $, mixIn, startsWith, browser) {

    'use strict';

    var emptyObj = {},
        emptyStr = '';

    /**
     * {@inheritDoc}
     */
    function AddressHTML5(options) {
        // Merge the options
        options = mixIn({ basePath: location.pathname + '/' }, options || {});

        // Prevent "The option is insecure" issue because values can't start with //
        // Also ensure that it starts with an /
        // Encode it to be valid in the comparisons because it can contain special chars
        this._basePath = this._encodeValue(options.basePath);
        this._basePath = '/' + this._trimLeadingSlashes(this._basePath);
        this._basePath = this._trimTrailingSlashes(this._basePath);

        this._baseElement = document.getElementsByTagName('base');

        Address.call(this, options);

        // Replace all functions that need to be bound
        this._onNewValueByExternalEvent = this._onNewValueByExternalEvent.bind(this);

        $(window).on('popstate', this._onNewValueByExternalEvent);
    }

    AddressHTML5.prototype = Object.create(Address.prototype);
    AddressHTML5.prototype.constructor = AddressHTML5;

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype.setValue = function (value, absolute) {
        value = this._trimLeadingSlashes(value);

        return Address.prototype.setValue.call(this, value, absolute);
    };

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype.generateUrl = function (value, absolute) {
        var ret = this._basePath + '/' + this._encodeValue(this._trimLeadingSlashes(value));

        return absolute ? this._locationSuhp + ret : ret;
    };

    /////////////////////////////////////////////////////////////////////////////////////

    /**
     * Trim starting slashes.
     *
     * @param {String} value The value to trim
     *
     * @return {String} The trimmed value
     */
    AddressHTML5.prototype._trimLeadingSlashes = function (value) {
        return value.replace(/^\/*/, '');
    };

    /**
     * Trim trailing slashes.
     *
     * @param {String} value The value to trim
     *
     * @return {String} The trimmed value
     */
    AddressHTML5.prototype._trimTrailingSlashes = function (value) {
        return value.replace(/\/*$/, '');
    };

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype._isInternalUrl = function (url) {
        var ret = Address.prototype._isInternalUrl.call(this, url);

        if (ret) {
            // If is absolute, remove suhp part
            if (this._isAbsoluteUrl(url)) {
                url = url.substr(this._locationSuhp.length);
            }

            url = url.replace(/%27/g, '\'');    // This replacement is a workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=407172

            // Check if the URL starts with the full base path
            return startsWith(url, this._basePath);
        }

        return false;
    };

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype._readValue = function (path) {
        var basePos,
            tmp,
            parsedPath;

        // If a value is passed we need to take care of it specially
        if (path) {
            // If it is an absolute URL, we need to ensure that it can be handled
            // If so, we remove the scheme + userinfo + hostname + port from the value
            if (this._isAbsoluteUrl(path)) {
                tmp = this._extractSuhpFromUrl(path);
                if (!tmp) {
                    throw new Error('Unable to parse URL: ' + path);
                }

                if (tmp !== this._locationSuhp) {
                    throw new Error('Can\'t parse external URL: ' + path);
                }
                parsedPath = path.substr(this._locationSuhp.length);
            } else {
                parsedPath = path;
            }
        } else {
            // Otherwise we assume the value from the browser URL
            // Note that we can't use location.pathname because Opera returns the value unencoded, so we use href and extract the initial part
            parsedPath = location.href.substr(this._locationSuhp.length);
        }

        parsedPath = parsedPath.replace(/%27/g, '\'');    // This replacement is a workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=407172

        // Extract the portion after the full base path
        basePos = parsedPath.indexOf(this._basePath);
        if (basePos !== -1) {
            parsedPath = parsedPath.substr(basePos + this._basePath.length + 1);
        } else {
            throw new Error('Can\'t parse external URL: ' + (path || location.href));
        }

        // Remove the portion after ? if any
        tmp = parsedPath.indexOf('?');
        if (tmp !== -1) {
            parsedPath = parsedPath.substr(0, tmp);
        } else {
            // Remove the portion after # if any
            tmp = parsedPath.indexOf('#');
            if (tmp !== -1) {
                parsedPath = parsedPath.substr(0, tmp);
            }
        }

        return decodeURIComponent(parsedPath);
    };

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype._writeValue = function (value, replace) {
        var path = this._basePath + '/' + this._encodeValue(value);

        if (replace) {
            history.replaceState(emptyObj, emptyStr, path);
        } else {
            history.pushState(emptyObj, emptyStr, path);

            // Fix a weird Opera bug (http://my.opera.com/community/forums/topic.dml?id=1185462)
            this._baseElement.href = this._baseElement.href;
        }
    };

    /**
     * Encodes the passed value to be safelly used.
     *
     * @param  {String} value The value to be encoded
     *
     * @return {String} The encoded value
     */
    AddressHTML5.prototype._encodeValue = function (value) {
        // Use encodeURI because its similar to encodeURIComponent but preserves some chars (without breaking) and prevents a bug in Safari
        value = encodeURI(value);

        // Some chars needs to be converted separately because encodeURI ignores it
        value = value.replace(/#/g, '%23');
        value = value.replace(/\?/g, '%3F');

        return value;
    };

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype._onDestroy = function () {
        $(window).off('popstate', this._onNewValueByExternalEvent);

        AddressHTML5._instance = null;
        Address.prototype._onDestroy.call(this);
    };

    /////////////////////////////////////////////////////////////////////////////////////

    AddressHTML5._instance = null;

    /**
     * {@inheritDoc}
     */
    AddressHTML5.isCompatible = function () {
        var userAgent = navigator.userAgent.toLowerCase(),
            android = parseInt((/android (\d+)/.exec(userAgent) || [])[1], 10),
            safari = browser.webkit && !window.chrome && parseInt(browser.version, 10);

        // Android < 4 does not handle pushState correctly (http://code.google.com/p/android/issues/detail?id=17471)
        // There is quite few browsers for android besides the stock one but we disable it anyway

        // Safari < 6 has horrible problems with pushState
        // - e.g.: location.href returns the decoded value instead of the value we used in the pushState
        // - e.g.: not firing popstate on network busy

        // The same applies to PhantomJS (http://code.google.com/p/phantomjs/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Type%20Status%20Priority%20Milestone%20Owner%20Summary&groupby=&sort=&id=833)
        // Keep an eye on the link above; once the issue is fixed in PhantomJS, the code below might need to be adjusted

        // The file protocol is not supported so we return false for it.

        return window.history && !!history.pushState &&
               location.protocol !== 'file:' &&
               userAgent.indexOf('phantomjs') === -1 &&
               !(android && android < 4) &&
               !(safari && safari < 6);
    };

    /**
     * Creates a new instance of returns the current initialized  one.
     *
     * @param {Object} options The options
     *
     * @return {AddressHash} The address
     */
    AddressHTML5.getInstance = function (options) {
        if (!AddressHTML5._instance) {
            AddressHTML5._instance = new AddressHTML5(options);
        }

        return AddressHTML5._instance;
    };

    return AddressHTML5;
});
