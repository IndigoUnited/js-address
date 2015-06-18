/*jshint regexp:false*/

/**
 * Address.
 * This class serves as a base for both hash and html5 implementations.
 * Those simply need to implement the abstract functions to work correctly.
 *
 * This class also handles the clicks in the link tags (<a> tags).
 * If a link is meant to be a regular link, use the data-url-type="external".
 * If a link is mean to be an internal link but not handled by this address use data-url-type="internal".
 * Please note that links with target!="_self" and external urls are in general automatically ignored.
 * There is also a data-url-force option. When set to true, the value will be changed even if its the current one.
 */
define([
    'events-emitter/MixableEventsEmitter',
    'has',
    'jquery',
    './util/mixIn',
    './util/trimSlashes',
    './util/parseUrl'
], function (MixableEventsEmitter, has, $, mixIn, trimSlashes, parseUrl) {

    'use strict';

    var anchorEl = document.createElement('a');

    /**
     * Constructor.
     *
     * @param {Object} [options] The options
     */
    function Address(options) {
        var isCompatible = this.constructor.isCompatible || Address.isCompatible;

        if (!isCompatible.call(this.constructor))  {
            throw new Error('Address is not supported in this browser.');
        }

        // handleLinks can also be a string to handle only certain links (if the function returns true for the given url, then it will be handled)
        this._options = mixIn({
            handleLinks: true,
            basePath: location.pathname
        }, options);

        // Cache the location scheme + host + port
        this._locationShp = this._analyzeUrl(location.href).shp;

        // Validate base path
        // We don't allow strange chars because they some browsers return href decoded and
        // comparisons will fail (e..g: Safari 5)
        if (!/^[a-z0-9_\-\/\.]+$/.test(this._options.basePath)) {
            throw new Error('Invalid base path, it can only be letters, numbers or _-/.');
        }

        // The base path should have slashes trimmed
        this._basePath = trimSlashes(this._options.basePath);

        // Grab the current value
        this._value = this._readValue();

        // Replace all functions that need to be bound
        this._handleLinkClick = this._handleLinkClick.bind(this);

        // Listen to clicks in links
        if (this._options.handleLinks) {
            $(document.body).on('click', 'a', this._handleLinkClick);
        }

        this._enabled = true;
        has('debug') && console.info('[address] Initial address value: ' + this._value);
    }

    mixIn(Address.prototype, MixableEventsEmitter.prototype);

    /**
     * Enables the address.
     *
     * @return {Address} The instance itself to allow chaining
     */
    Address.prototype.enable = function () {
        if (!this._enabled) {
            this._enabled = true;
            this._emit('enable');
        }

        return this;
    };

    /**
     * Disables the address.
     * Note that the links will still be default prevented.
     *
     * @return {Address} The instance itself to allow chaining
     */
    Address.prototype.disable = function () {
        if (this._enabled) {
            this._enabled = false;
            this._emit('disable');
        }

        return this;
    };

    /**
     * Returns the current address value.
     *
     * @param {String} [value] A value to be used instead of the address bar value
     *
     * @return {String} The current value
     */
    Address.prototype.getValue = function (value) {
        return value != null ? this._readValue(value) : this._value;
    };

    /**
     * Sets the address value.
     * If the resource changed, the change event will be fired (with type internal).
     *
     * The default implementation should handle these options:
     *  - force:  true to force the value to be changed even if the value is the same
     *  - silent: true to change the value without firing the change event
     *  - replace: true to replace the latest history entry instead of appending
     *
     * @param {String} value     The value to be set
     * @param {Object} [options] The options
     *
     * @return {Address} The instance itself to allow chaining
     */
    Address.prototype.setValue = function (value, options) {
        var oldValue;

        if (!this._enabled) {
            return this;
        }

        value = trimSlashes(value);
        options = options || {};

        if (this._value !== value || options.force) {
            oldValue = this._value;
            this._value = value;
            this._writeValue(value, options.replace);

            if (!options.silent) {
                this._fireInternalChange(value, oldValue);
            }
        }

        return this;
    };

    /**
     * Resets the internal state of address.
     * Clears the internal value and any other state.
     *
     * @return {Address} The instance itself to allow chaining
     */
    Address.prototype.reset = function () {
        this._value = null;

        return this;
    };

    /**
     * Generates an URL based on a given value.
     * By default the generated URL will be relative unless absolute is true.
     *
     * @param {String}  value      The value.
     * @param {Boolean} [absolute] True to generate an absolute URL, false otherwise (defaults to false)
     *
     * @return {String} The generated URL
     */
    Address.prototype.generateUrl = function (value, absolute) {
        throw new Error('This method must be implemented.');
    };

    /**
     * Destroys the instance.
     */
    Address.prototype.destroy = function () {
        if (!this._destroyed) {
            this._onDestroy();
            this._destroyed = true;
        }
    };

    // ---------------------------------------------------------------

    /**
     * Analyzes the url, returning an object with its shp (scheme + host + port) and pathname.
     *
     * @param {String} url The url to parse
     *
     * @return {Object} The analyzed URL object
     */
    Address.prototype._analyzeUrl = function (url) {
        var parsedUrl;

        // Use an anchor tag to parse the URL for us; this will resolve relative URLs etc
        // Then we double parse the URL because we cannot use .pathname: it gets decoded in some
        // old browsers, including android stock browser
        anchorEl.href = url;                  // Browser based parser
        parsedUrl = parseUrl(anchorEl.href);  // Regular expression based parser

        return {
            shp: parsedUrl.protocol + parsedUrl.doubleSlash + parsedUrl.host,
            pathname: '/' + trimSlashes.leading(parsedUrl.pathname)
        };
    };

    /**
     * Checks if a given URL can be handled internally.
     * Returns true for relative URLs.
     * For absolute URLs, returns true if the scheme + hostname + port is the same as the browser.
     * Subclasses might need to override this method.
     *
     * @return {Boolean} True if it is external, false otherwise
     */
    Address.prototype._isInternalUrl = function (url) {
        var analyzed = this._analyzeUrl(url);

        return analyzed.shp === this._locationShp && analyzed.pathname.indexOf('/' + this._basePath) === 0;
    };

    /**
     * Function to be invoked when a new value needs to be handled due to an external event.
     */
    Address.prototype._onNewValueByExternalEvent = function () {
        if (!this._enabled) {
            return;
        }

        var value = this._readValue(),
            oldValue = this._value;

        if (this._value !== value) {
            this._value = value;
            this._fireExternalChange(value, oldValue);
        }
    };

    /**
     * Function to be invoked when a new value needs to be handled due to an link click.
     * Suppresses the normal link behaviour if handled.
     *
     * @param {String}  value     The value
     * @param {Object}  event     The event
     * @param {Boolean} [options] True to force the change even if the value is the same
     */
    Address.prototype._onNewValueByLinkClick = function (value, event, options) {
        var oldValue;

        if (!this._isInternalUrl(value)) {
            if (this._enabled) {
                has('debug') && console.info('[address] Link poiting to "' + value + '" was automatically interpreted as external.');
            }

            return;
        }

        event.preventDefault();

        if (!this._enabled) {
            return;
        }

        value = this._readValue(value);
        options = options || {};

        if (this._value !== value || options.force) {
            oldValue = this._value;
            this._value = value;
            this._writeValue(value, options.replace);

            if (!options.silent) {
                this._fireLinkChange(value, oldValue, event);
            }
        }
    };

    /**
     * Handles the click event on links.
     *
     * @param {Event} event The click event
     */
    Address.prototype._handleLinkClick = function (event) {
        var element = event.currentTarget,
            type = element.getAttribute('data-url-type'),
            download = element.getAttribute('download') != null,
            ctrlKey = event.ctrlKey || event.metaKey,
            target = element.target,
            url =  element.href,
            options;

        // Ignore the event if control is pressed
        if (ctrlKey) {
            return;
        }

        // Ignore if preventDefault() was called
        if (event.isDefaultPrevented()) {
            has('debug') && console.info('[address] Link poiting to "' + url + '" was ignored because event#preventDefault() was called.');
            return;
        }

        // Ignore if the link specifies a target different than self
        // Ignore if the link rel attribute is internal or external
        if ((target && target !== '_self') || type === 'external') {
            has('debug') && console.info('[address] Link poiting to "' + url + '" was ignored because it was flagged as external.');
            return;
        }

        // Ignore if the link has a download attribute
        if (download) {
            has('debug') && console.info('[address] Link poiting to "' + url + '" was ignored because it has a download attribute.');
            return;
        }

        // If the link is internal, then we just prevent default behaviour
        if (type === 'internal') {
            event.preventDefault();
            has('debug') && console.info('[address] Link poiting to "' + url + '" is flagged as internal and as such event#preventDefault() was called on the event.');
        } else {
            // Extract options from attributes
            options = {
                force: element.getAttribute('data-url-force') === 'true',
                replace: element.getAttribute('data-url-replace') === 'true',
                silent: element.getAttribute('data-url-silent') === 'true'
            };

            // Handle the link click
            this._onNewValueByLinkClick(url, event, options);
        }
    };

    /**
     * Fires a change event with type internal.
     *
     * @param {String} value    The current value
     * @param {String} oldValue The old value
     */
    Address.prototype._fireInternalChange = function (value, oldValue) {
        if (has('debug')) {
            console.info('[address] Value changed to ' + value + ' (internally)');
        }

        this._emit('change', {
            newValue: value,
            oldValue: oldValue,
            type: 'internal'
        });
    };

    /**
     * Fires a change event with type external.
     *
     * @param {String} value    The current value
     * @param {String} oldValue The old value
     */
    Address.prototype._fireExternalChange = function (value, oldValue) {
        if (has('debug')) {
            console.info('[address] Value changed to ' + value + ' (externally)');
        }

        this._emit('change', {
            newValue: value,
            oldValue: oldValue,
            type: 'external'
        });
    };

    /**
     * Fires a change event with type link.
     *
     * @param {String} value    The current value
     * @param {String} oldValue The old value
     * @param {Event}  event    The DOM event that cause the change
     */
    Address.prototype._fireLinkChange = function (value, oldValue, event) {
        if (has('debug')) {
            console.info('[address] Value changed to ' + value + ' (link)');
        }

        this._emit('change', {
            newValue: value,
            oldValue: oldValue,
            type: 'link',
            event: event
        });
    };

    /**
     * Releases any listeners and resources.
     * This method is called only once after a destroy several call.
     *
     * @see Address#destroy
     */
    Address.prototype._onDestroy = function () {
        // Remove links listener
        $(document.body).off('click', 'a', this._handleLinkClick);

        // Clear the listeners
        this.off();
    };

    // ---------------------------------------------------------------

    /**
     * Reads and returns the current extracted value of the browser address URL.
     * Note that the returned value should not contain trailing slashes.
     *
     * @param {String} [path] The path to be used instead of the browser address URL (can be a full URL or a relative on)
     *
     * @return {String} The extracted value
     */
    Address.prototype._readValue = function (path) {
        throw new Error('This method must be implemented.');
    };

    /**
     * Writes a value to the browser address bar.
     * The value passed will generate and apply a new URL to the browser address bar.
     * Note that the value has already slashes trimmed.
     *
     * @param {String}  value     The value to be set
     * @param {Boolean} [replace] True to replace the last history entry, false otherwise
     */
    Address.prototype._writeValue = function (value, replace) {
        throw new Error('This method must be implemented.');
    };

    // ---------------------------------------------------------------

    Address.isCompatible = function () {
        throw new Error('This method must be implemented.');
    };

    return Address;
});
