/*jshint regexp:false*/

/**
 * Address.
 * This class serves as a base for both hash and html5 implementations.
 * Those simply need to implement the abstract functions to work correctly.
 *
 * This class also handles the clicks in the link tags (<a> tags).
 * If a link is meant to be a regular link, use the rel="external".
 * If a link is mean to be an internal link but not handled by this address use rel="internal".
 * Please note that links with target!="_self" and external urls are in general automatically ignored.
 *
 * Events:
 * - EVENT_EXTERNAL_CHANGE    if the value changes due to an external event (back, next, etc)
 * - EVENT_INTERNAL_CHANGE    if the value changes due to a setValue() call
 * - EVENT_LINK_CHANGE        if the value changes due to user clicking a link click (<a> tags)
 * - EVENT_CHANGE             fired after each of the ones above (generic event)
 *
 * // TODO: add browser quirks regarding this to the WTF-Browsers repository
 *
 * @see AddressInterface
 * @author André Cruz <andremiguelcruz@msn.com>
 */
define([
    'dejavu/AbstractClass',
    './AddressInterface',
    'events-emitter/MixableEventsEmitter',
    'has',
    'amd-utils/string/escapeRegExp',
    'amd-utils/string/startsWith',
    'amd-utils/object/mixIn',
    'amd-utils/lang/isFunction',
    'base-adapter/dom/Events'
], function (AbstractClass, AddressInterface, MixableEventsEmitter, has, escapeRegExp, startsWith, mixIn, isFunction, Events) {

    'use strict';

    return AbstractClass.declare({
        $name: 'Address',
        $implements: AddressInterface,
        $borrows: MixableEventsEmitter,

        _locationSuhp: null,   // location scheme + userinfo + hostname + port
        _isAbsoluteUrlRegExp: /^[a-z]{1,7}:\/\//i,
        _urlParserRegExp: /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/,

        _value: null,
        _destroyed: false,

        _options: {
            handleLinks: true,             // This can also be a string to handle only certain links (if the function returns true for the given url, then it will be handled)
            debug: false
        },

        /**
         * Constructor.
         *
         * @param {Object} [$options] The options
         */
        initialize: function ($options) {
            if (!this.$static.isCompatible())  {
                throw new Error(this.$name + ' is not supported in this browser.');
            }

            // Merge the options
            // It's unecessary to use merge because options are only 1 level deep
            mixIn(this._options, $options || {});

            // Cache the location scheme + userinfo + host + port
            this._locationSuhp = this._extractSuhpFromUrl(location.href);

            // Grab the current value
            this._value = this._readValue();

            if (has('debug')) {
                console.info('Initial address value: ' + this._value);
            }

            // Listen to clicks in links
            if (this._options.handleLinks) {
                Events.on(document.body, 'click a', this._handleLinkClick);
            }
        },

        /**
         * {@inheritDoc}
         */
        getValue: function ($value) {
            return $value != null ? this._readValue($value) : this._value;
        },

        /**
         * {@inheritDoc}
         */
        setValue: function (value) {
            if (this._value !== value) {
                this._value = value;
                this._writeValue(value);
                this._fireInternalChange(value);
            }

            return this;
        },

        /**
         * {@inheritDoc}
         */
        destroy: function () {
            if (!this._destroyed) {
                this._onDestroy();
                this._destroyed = true;
            }
        },

        /////////////////////////////////////////////////////////////////////////////////////

        $abstracts: {
            /**
             * {@inheritDoc}
             */
            generateUrl: function (value, $absolute) {},

            /**
             * Reads and returns the current extracted value of the browser address URL.
             *
             * @param {String} [$path] The path to be used instead of the browser address URL (can be a full url or a relative on)
             *
             * @return {String} The extracted value
             */
            _readValue: function ($path) {},

            /**
             * Writes a value to the browser address bar.
             * The value passed will generate and apply a new URL to the browser address bar.
             *
             * @param {String} value The value to be set
             */
            _writeValue: function (value) {},

            $statics: {
                /**
                 * Check if this implementation is compatible with the current environment.
                 */
                isCompatible: function () {}
            }
        },

        /////////////////////////////////////////////////////////////////////////////////////

        /**
         * Checks if a given URL is absolute.
         *
         * @param {String} url The url to check
         *
         * @return {Boolean} True if it's absolute, false otherwise
         */
        _isAbsoluteUrl: function (url) {
            return this._isAbsoluteUrlRegExp.test(url);
        },

        /**
         * Extracts the scheme + userinfo + hostname + port from an URL
         *
         * @param {String} url The url to parse
         *
         * @return {String} The URL 'suhp' part or null if it is invalid
         */
        _extractSuhpFromUrl: function (url) {
            var matches = this._urlParserRegExp.exec(url), // see: https://gist.github.com/2428561
                shup = matches[3];

            shup = matches[3];

            return shup && shup.length ? shup : null;
        },

        /**
         * Checks if a given URL can be handled internally.
         * Returns false for relative URLs.
         * For absolute URLs, returns true if the scheme + userinfo + hostname + port is the same as the browser.
         * Subclasses might need to override this method.
         *
         * @return {Boolean} True if it is external, false otherwise
         */
        _isInternalUrl: function (url) {
            // We first check if the URL is absolute because the _extractUrlSuhp function is somewhat slower
            // So if an URL is absolute we do not need to run it
            return !this._isAbsoluteUrl(url) || this._extractSuhpFromUrl(url) === this._locationSuhp;
        },

        /**
         * Function to be invoked when a new value needs to be handled due to an external event.
         */
        _onNewValueByExternalEvent: function () {
            var value = this._readValue();

            if (this._value !== value) {
                this._value = value;
                this._fireExternalChange(value);
            }
        }.$bound(),

        /**
         * Function to be invoked when a new value needs to be handled due to an link click.
         * Returns true if the link was handled, supressing the normal link behaviour.
         *
         * @param {String} value  The value
         *
         * @return {Boolean} True if the link was handled internally, false otherwise
         */
        _onNewValueByLinkClick: function (value) {
            if (this._isInternalUrl(value)) {
                value = this._readValue(value);
                if (this._value !== value) {
                    this._value = value;
                    this._writeValue(value);
                    this._fireLinkChange(value);
                }

                return true;
            }

            return false;
        },

        /**
         * Handles the click event on links.
         *
         * @param {Event}   event The click event
         * @param {Element} [$el] The link tag
         */
        _handleLinkClick: function (event, $el) {
            var rel,
                ctrlKey,
                target,
                url,
                element;

            element = $el || Events.getCurrentTarget(event);
            rel = element.rel;
            ctrlKey = event.ctrlKey || event.metaKey;
            target = element.target;
            url = element.href;

            // Ignore the event if control is pressed
            // Ignore if the link specifies a target different than self
            // Ignore if the link rel attribute is internal or external
            if (!ctrlKey && (!target || target === '_self') && rel !== 'external') {
                // If the link is internal, then we just prevent default behaviour
                if (rel === 'internal') {
                    event.preventDefault();
                    if (has('debug')) {
                        console.info('Link poiting to "' + url + '" is flagged as internal and as such event#preventDefault() was called on the event.');
                    }
                } else {
                    //  Check if the link is from another domain/protocol and if we can handle it
                    if (this._onNewValueByLinkClick(url)) {
                        event.preventDefault();
                    } else {
                        if (has('debug')) {
                            console.info('Link poiting to "' + url + '" was automatically interpreted as external.');
                        }
                    }
                }
            } else if (has('debug')) {
                console.info('Link poiting to "' + url + '" was ignored.');
            }
        }.$bound(),

        /**
         * Fires an internal change event.
         * Also fires the generic change event.
         *
         * @param {String} value The current value
         */
        _fireInternalChange: function (value) {
            if (has('debug')) {
                console.info('Value changed to ' + value + ' (internally)');
            }

            this._emit(this.$static.EVENT_INTERNAL_CHANGE, value);
            // Check if the value changed meanwhile..
            // This is needed because a listener could have changed the value with setValue()
            // If the value changed then the change event was already fired, so we abort
            if (this._value === value) {
                this._emit(this.$static.EVENT_CHANGE, value);
            }
        },

        /**
         * Fires an external change event.
         * Also fires the generic change event.
         *
         * @param {String} value The current value
         */
        _fireExternalChange: function (value) {
            if (has('debug')) {
                console.info('Value changed to ' + value + ' (externally)');
            }

            this._emit(this.$static.EVENT_EXTERNAL_CHANGE, value);
            // Check if the value changed meanwhile..
            // This is needed because a listener could have changed the value with setValue()
            // If the value changed then the change event was already fired, so we abort
            if (this._value === value) {
                this._emit(this.$static.EVENT_CHANGE, value);
            }
        },

        /**
         * Fires a link change event.
         * Also fires the generic change event.
         *
         * @param {String} value The current value
         */
        _fireLinkChange: function (value) {
            if (has('debug')) {
                console.info('Value changed to ' + value + ' (link)');
            }

            this._emit(this.$static.EVENT_LINK_CHANGE, value);
            // Check if the value changed meanwhile..
            // This is needed because a listener could have changed the value with setValue()
            // If the value changed then the change event was already fired, so we abort
            if (this._value === value) {
                this._emit(this.$static.EVENT_CHANGE, value);
            }
        },

        /**
         * Releases any listeners and resources.
         * This method is called only once after a destroy several call.
         *
         * @see Address#destroy
         */
        _onDestroy: function () {
            // Remove links listener
            Events.off(document.body, 'click a', this._handleLinkClick);

            // Clear the listeners
            this.off();
        }
    });
});
