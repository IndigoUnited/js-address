/**
 * AddressHTML5.
 */
define([
    './Address',
    'jquery',
    './util/mixIn',
    './util/startsWith',
    './util/trimSlashes',
    './util/browser'
], function (Address, $, mixIn, startsWith, trimSlashes, browser) {

    'use strict';

    var emptyObj = {},
        emptyStr = '';

    /**
     * {@inheritDoc}
     */
    function AddressHTML5(options) {
        Address.call(this, options);

        // Get the base element used to fix a weird Opera bug
        this._baseElement = document.getElementsByTagName('base');

        // Replace all functions that need to be bound
        this._onNewValueByExternalEvent = this._onNewValueByExternalEvent.bind(this);

        $(window).on('popstate', this._onNewValueByExternalEvent);
    }

    AddressHTML5.prototype = Object.create(Address.prototype);
    AddressHTML5.prototype.constructor = AddressHTML5;

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype.generateUrl = function (value, absolute) {
        var ret = '/' +  trimSlashes.leading(this._basePath + '/') + trimSlashes(value);

        return absolute ? this._locationShp + ret : ret;
    };

    // ---------------------------------------------------------------

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype._readValue = function (path) {
        var basePos,
            tmp,
            parsed;

        // Get only the pathname from it
        parsed = this._analyzeUrl(path || location.href).pathname;

        // Extract the base path
        basePos = parsed.indexOf('/' + this._basePath);
        if (basePos === 0) {
            parsed = parsed.substr(basePos + this._basePath.length + 1);
        }

        // Remove the portion after ? if any
        tmp = parsed.indexOf('?');
        if (tmp !== -1) {
            parsed = parsed.substr(0, tmp);
        } else {
            // Remove the portion after # if any
            tmp = parsed.indexOf('#');
            if (tmp !== -1) {
                parsed = parsed.substr(0, tmp);
            }
        }

        // Trim slashes from the value
        parsed = trimSlashes(parsed);

        return parsed;
    };

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype._writeValue = function (value, replace) {
        var path = '/' + trimSlashes.leading(this._basePath + '/') + value;

        if (replace) {
            history.replaceState(emptyObj, emptyStr, path);
        } else {
            history.pushState(emptyObj, emptyStr, path);

            // Fix a weird Opera bug (http://my.opera.com/community/forums/topic.dml?id=1185462)
            this._baseElement.href = this._baseElement.href;
        }
    };

    /**
     * {@inheritDoc}
     */
    AddressHTML5.prototype._onDestroy = function () {
        $(window).off('popstate', this._onNewValueByExternalEvent);

        AddressHTML5._instance = null;
        Address.prototype._onDestroy.call(this);
    };

    // ---------------------------------------------------------------

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
        // - e.g.: location.href returns the decoded pathname instead of the value we used in the pushState
        // - e.g.: not firing popstate on network busy

        // The same applies to PhantomJS (http://code.google.com/p/phantomjs/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Type%20Status%20Priority%20Milestone%20Owner%20Summary&groupby=&sort=&id=833)
        // Keep an eye on the link above; once the issue is fixed in PhantomJS, the code below might need to be adjusted

        // The file protocol is not supported so we return false for it.

        return window.history && !!history.pushState &&
               location.protocol !== 'file:' &&
               userAgent.indexOf('phantomjs') === -1 &&
               !(android && android < 4) &&
               !(safari && (safari < 6 || safari < 600));  // Safari <= 5.0.5 uses 3 digits for versions
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
