/**
 * AddressHTML5.
 *
 * @author André Cruz <andremiguelcruz@msn.com>
 * @author Marcelo Conceicao <marcelobconceicao@yahoo.com>
 */
define([
    './Address',
    'mout/string/startsWith',
    'mout/object/deepMixin',
    'base-adapter/dom/Events',
    'base-adapter/environment/Platform',
    'base-adapter/environment/Browser'
], function (Address, startsWith, deepMixin, Events, Platform, Browser) {

    'use strict';

    var AddressHTML5 = Address.extend({
        $name: 'AddressHTML5',

        _basePath: null,
        _baseElement: null,     // This is to solve a weird opera bug
        _emptyObj: {},
        _emptyStr: '',

        _options: {
            handleLinks: true,
            basePath: location.pathname + '/'
        },

        /**
         * {@inheritDoc}
         */
        _initialize: function ($options) {
            // Merge the options
            deepMixin(this._options, $options || {});

            // Prevent "The option is insecure" issue because values can't start with //
            // Also ensure that it starts with an /
            // Encode it to be valid in the comparisons because it can contain special chars
            this._basePath = this._encodeValue(this._options.basePath);
            this._basePath = '/' + this._trimLeadingSlashes(this._basePath);

            this._baseElement = document.getElementsByTagName('base');

            this.$super($options);

            Events.on(window, 'popstate', this._onNewValueByExternalEvent);
        },

        /**
         * {@inheritDoc}
         */
        setValue: function (value, $absolute) {
            return this.$super(this._trimLeadingSlashes(value), $absolute);
        },

        /**
         * {@inheritDoc}
         */
        generateUrl: function (value, $absolute) {
            var ret = this._basePath + this._encodeValue(this._trimLeadingSlashes(value));

            return $absolute ? this._locationSuhp + ret : ret;
        },

        /////////////////////////////////////////////////////////////////////////////////////

        /**
         * Trim starting slashing.
         *
         * @param {String} value The value to trim
         *
         * @return {String} The trimmed value
         */
        _trimLeadingSlashes: function (value) {
            return value.replace(/^\/*/, '');
        },

        /**
         * {@inheritDoc}
         */
        _isInternalUrl: function (url) {
            var ret = this.$super(url);

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
        },

        /**
         * {@inheritDoc}
         */
        _readValue: function ($path) {
            var basePos,
                tmp,
                path;

            // If a value is passed we need to take care of it specially
            if ($path) {
                // If it is an absolute URL, we need to ensure that it can be handled
                // If so, we remove the scheme + userinfo + hostname + port from the value
                if (this._isAbsoluteUrl($path)) {
                    tmp = this._extractSuhpFromUrl($path);
                    if (!tmp) {
                        throw new Error('Unable to parse URL: ' + $path);
                    }

                    if (tmp !== this._locationSuhp) {
                        throw new Error('Can\'t parse external URL: ' + $path);
                    }
                    path = $path.substr(this._locationSuhp.length);
                } else {
                    path = $path;
                }
            } else {
                // Otherwise we assume the value from the browser URL
                // Note that we can't use location.pathname because Opera returns the value unencoded, so we use href and extract the initial part
                path = location.href.substr(this._locationSuhp.length);
            }

            path = path.replace(/%27/g, '\'');    // This replacement is a workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=407172

            // Extract the portion after the full base path
            basePos = path.indexOf(this._basePath);
            if (basePos !== -1) {
                path = path.substr(basePos + this._basePath.length);
            } else {
                throw new Error('Can\'t parse external URL: ' + ($path || location.href));
            }

            //path = this._trimLeadingSlashes(path);

            // Remove the portion after ? if any
            tmp = path.indexOf('?');
            if (tmp !== -1) {
                path = path.substr(0, tmp);
            } else {
                // Remove the portion after # if any
                tmp = path.indexOf('#');
                if (tmp !== -1) {
                    path = path.substr(0, tmp);
                }
            }

            return decodeURIComponent(path);
        },

        /**
         * {@inheritDoc}
         */
        _writeValue: function (value) {
            var path = this._basePath + this._encodeValue(value);

            history.pushState(this._emptyObj, this._emptyStr, path);

            // Fix a weird Opera bug (http://my.opera.com/community/forums/topic.dml?id=1185462)
            this._baseElement.href = this._baseElement.href;
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

            // Some chars needs to be converted separately because encodeURI ignores it
            value = value.replace(/#/g, '%23');
            value = value.replace(/\?/g, '%3F');

            return value;
        },

        /**
         * {@inheritDoc}
         */
        _onDestroy: function () {
            Events.off(window, 'popstate', this._onNewValueByExternalEvent);

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
                // Android < 4 does not handle pushState correctly (http://code.google.com/p/android/issues/detail?id=17471)
                // There is quite few browsers for android besides the stock one but we disable it anyway

                // Safari < 6 has horrible problems with pushState
                // - e.g.: location.href returns the decoded value instead of the value we used in the pushState
                // - e.g.: not firing popstate on network busy

                // The same applies to PhantomJS (http://code.google.com/p/phantomjs/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Type%20Status%20Priority%20Milestone%20Owner%20Summary&groupby=&sort=&id=833)

                // The file protocol is not supported so we return false for it.

                return window.history !== undefined && !!history.pushState &&
                       location.protocol !== 'file:' &&
                       (!Platform.isAndroid() || Platform.getVersion() >= 4) &&
                       (!Browser.isSafari() || Browser.getVersion() >= 6) &&
                       (Browser.getName() !== 'phantomjs');
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
                    this._instance = new AddressHTML5($options);
                }

                return this._instance;
            }
        }

    });

    return AddressHTML5;
});