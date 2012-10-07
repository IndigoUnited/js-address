/**
 * AddressHash.
 *
 * @author André Cruz <andremiguelcruz@msn.com>
 */
define(['./Address', 'base-adapter/dom/Events'], function (Address, Events) {

    'use strict';

    var AddressHash = Address.extend({
        $name: 'AddressHash',

        /**
         * {@inheritDoc}
         */
        _initialize: function ($options) {
            this.$super($options);

            Events.on(window, 'hashchange', this._onNewValueByExternalEvent);
        },

        /**
         * {@inheritDoc}
         */
        generateUrl: function (value, $absolute) {
            // The relative URL does not need to include the location.pathname to work, so we skip it
            // All the relative URLs start with #
            var ret = '#' + this._encodeValue(value);

            return $absolute ? this._locationSuhp + location.pathname + ret : ret;
        },

        /////////////////////////////////////////////////////////////////////////////////////

        /**
         * {@inheritDoc}
         */
        _readValue: function ($path) {
            var hash = $path || location.href,
                pos = hash.indexOf('#'),
                ret;

            hash = pos !== -1 ? hash.substr(pos + 1) : '';

            ret = decodeURIComponent(hash);
            ret = ret.replace(/%27/g, '\'');    // This replacement is a workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=407172

            return ret;
        },

        /**
         * {@inheritDoc}
         */
        _writeValue: function (value) {
            value = this._encodeValue(value);
            location.href = '#' + value;
        },

        /**
         * Encodes the passed value to be safelly used.
         *
         * @param  {String} value The value to be encoded
         *
         * @return {String} The encoded value
         */
        _encodeValue: function (value) {
            // Use encodeURI because its similar to encodeURIComponent but preserves some chars (without breaking) and prevents a bug in Safari
            value = encodeURI(value);

            // Encode the # because encodeURI does not handle it
            // This is actually only needed in IE and Opera, but we do it in every browser
            value = value.replace(/#/g, '%23');

            return value;
        },

        /**
         * {@inheritDoc}
         */
        _onDestroy: function () {
            Events.off(window, 'hashchange', this._onNewValueByExternalEvent);

            this.$self._instance = null;
            this.$super();
        },

        /////////////////////////////////////////////////////////////////////////////////////

        $statics: {
            _instance: null,

            /**
             * {@inheritDoc}
             */
            isCompatible: function () {
                // When IE8 is rendering with IE7 mode, it reports has having the event but it does not fire it!
                // Also IE in file protocol totally messes up when back & forward are clicked
                var docMode = document.documentMode;

                return ('onhashchange' in window && (docMode == null || docMode > 7) && (navigator.userAgent.indexOf('MSIE') === -1 || location.protocol !== 'file:'));
            },

            /**
             * Creates a new instance of returns the current initialized  one.
             *
             * @param {Object} $options The options
             *
             * @return {AddressHash} The address
             */
            getInstance: function ($options) {
                if (!this._instance) {
                    this._instance = new AddressHash($options);
                }

                return this._instance;
            }
        }
    });

    return AddressHash;
});
