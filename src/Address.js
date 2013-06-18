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
    './util/mixIn'
], function (MixableEventsEmitter, has, $, mixIn) {

    'use strict';

    /**
     * Constructor.
     *
     * @param {Object} [options] The options
     */
    function Address(options) {
        this._enabled = true;

        if (!this.constructor.isCompatible())  {
            throw new Error('Address is not supported in this browser.');
        }

        // handleLinks can also be a string to handle only certain links (if the function returns true for the given url, then it will be handled)
        this._options = mixIn({ handleLinks: true }, options || {});

        // Cache the location scheme + userinfo + host + port
        this._locationSuhp = this._extractSuhpFromUrl(location.href);

        // Grab the current value
        this._value = this._readValue();

        // Replace all functions that need to be bound
        this._handleLinkClick = this._handleLinkClick.bind(this);

        // Listen to clicks in links
        if (this._options.handleLinks) {
            $(document.body).on('click', 'a', this._handleLinkClick);
        }

        // Call events emitter constructor
        MixableEventsEmitter.call(this);

        if (has('debug')) {
            console.info('Initial address value: ' + this._value);
        }
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
     *  - silent: true to change the value with firing the change event
     *  - replace: true to replace the latest history entry instead of appending
     *
     * @param {String} value     The value to be set
     * @param {Object} [options] The options
     *
     * @return {Address} The instance itself to allow chaining
     */
    Address.prototype.setValue = function (value, options) {
        if (this._enabled) {
            var oldValue;

            options = options || {};

            if (this._value !== value || options.force) {
                oldValue = this._value;
                this._value = value;
                this._writeValue(value, options.replace);
                if (!options.silent) {
                    this._fireInternalChange(value, oldValue);
                }
            }
        }

        return this;
    };

    /**
     * Resets the interal state of address.
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

    /////////////////////////////////////////////////////////////////////////////////////

    /**
     * Checks if a given URL is absolute.
     *
     * @param {String} url The url to check
     *
     * @return {Boolean} True if it's absolute, false otherwise
     */
    Address.prototype._isAbsoluteUrl = function (url) {
        var regExp = this.constructor._isAbsoluteUrlRegExp || Address._isAbsoluteUrlRegExp;

        return regExp.test(url);
    };

    /**
     * Extracts the scheme + userinfo + hostname + port from an URL
     *
     * @param {String} url The url to parse
     *
     * @return {String} The URL 'suhp' part or null if it is invalid
     */
    Address.prototype._extractSuhpFromUrl = function (url) {
        var regExp = this.constructor._urlParserRegExp || Address._urlParserRegExp,
            matches = regExp.exec(url), // see: https://gist.github.com/2428561
            shup = matches[3];

        shup = matches[3];

        return shup && shup.length ? shup : null;
    };

    /**
     * Checks if a given URL can be handled internally.
     * Returns false for relative URLs.
     * For absolute URLs, returns true if the scheme + userinfo + hostname + port is the same as the browser.
     * Subclasses might need to override this method.
     *
     * @return {Boolean} True if it is external, false otherwise
     */
    Address.prototype._isInternalUrl = function (url) {
        // We first check if the URL is absolute because the _extractSuhpFromUrl function is somewhat slower
        // So if an URL is absolute we do not need to run it
        return !this._isAbsoluteUrl(url) || this._extractSuhpFromUrl(url) === this._locationSuhp;
    };

    /**
     * Checks if a given URL belongs to another scheme, other than the http(s) one.
     *
     * @param {String} url The URL
     *
     * @return {Boolean} True if is, false otherwise
     */
    Address.prototype._isOtherScheme = function (url) {
        var pos = url.indexOf('://'),
            scheme;

        if (pos === -1) {
            return false;
        }

        scheme = url.substr(0, pos);

        return scheme !== 'http' && scheme !== 'https';
    };

    /**
     * Function to be invoked when a new value needs to be handled due to an external event.
     */
    Address.prototype._onNewValueByExternalEvent = function () {
        if (this._enabled) {
            var value = this._readValue(),
                oldValue = this._value;

            if (this._value !== value) {
                this._value = value;
                this._fireExternalChange(value, oldValue);
            }
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
        if (this._enabled) {
            var oldValue;

            options = options || {};

            if (this._isInternalUrl(value)) {
                event.preventDefault();

                value = this._readValue(value);
                if (this._value !== value || options.force) {
                    oldValue = this._value;
                    this._value = value;
                    this._writeValue(value, options.replace);

                    if (!options.silent) {
                        this._fireLinkChange(value, oldValue, event);
                    }
                }
            } else if (has('debug')) {
                console.info('Link poiting to "' + value + '" was automatically interpreted as external.');
            }
        }
    };

    /**
     * Handles the click event on links.
     *
     * @param {Event}   event The click event
     * @param {Element} [el]  The link tag
     */
    Address.prototype._handleLinkClick = function (event, el) {
        var element = el || event.currentTarget,
            type = element.getAttribute('data-url-type'),
            ctrlKey = event.ctrlKey || event.metaKey,
            target = element.target,
            url =  element.href,
            options;

        if (!this._isOtherScheme(url)) {
            // Ignore the event if control is pressed
            // Ignore if the link specifies a target different than self
            // Ignore if the link rel attribute is internal or external
            if (!ctrlKey && (!target || target === '_self') && type !== 'external') {
                // If the link is internal, then we just prevent default behaviour
                if (type === 'internal') {
                    event.preventDefault();
                    if (has('debug')) {
                        console.info('Link poiting to "' + url + '" is flagged as internal and as such event#preventDefault() was called on the event.');
                    }
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
            } else if (has('debug') && url) {
                console.info('Link poiting to "' + url + '" was ignored.');
            }
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
            console.info('Value changed to ' + value + ' (internally)');
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
            console.info('Value changed to ' + value + ' (externally)');
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
            console.info('Value changed to ' + value + ' (link)');
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

    /////////////////////////////////////////////////////////////////////////////////////

    /**
     * Reads and returns the current extracted value of the browser address URL.
     *
     * @param {String} [path] The path to be used instead of the browser address URL (can be a full url or a relative on)
     *
     * @return {String} The extracted value
     */
    Address.prototype._readValue = function (path) {
        throw new Error('This method must be implemented.');
    };

    /**
     * Writes a value to the browser address bar.
     * The value passed will generate and apply a new URL to the browser address bar.
     *
     * @param {String}  value     The value to be set
     * @param {Boolean} [replace] True to replace the last history entry, false otherwise
     */
    Address.prototype._writeValue = function (value, replace) {
        throw new Error('This method must be implemented.');
    };

    /////////////////////////////////////////////////////////////////////////////////////

    Address._isAbsoluteUrlRegExp = /^[a-z]{1,7}:\/\//i;
    Address._urlParserRegExp = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;

    Address.isCompatible = function () {
        throw new Error('This method must be implemented.');
    };

    return Address;
});
