/**
 * AddressHash.
 */
define([
    './Address',
    'jquery',
    './util/trimSlashes'
], function (Address, $, trimSlashes) {

    'use strict';

    /**
     * {@inheritDoc}
     */
    function AddressHash(options) {
        Address.call(this, options);

        // Replace all functions that need to be bound
        this._onNewValueByExternalEvent = this._onNewValueByExternalEvent.bind(this);

        $(window).on('hashchange', this._onNewValueByExternalEvent);
    }

    AddressHash.prototype = Object.create(Address.prototype);
    AddressHash.prototype.constructor = AddressHash;

    /**
     * {@inheritDoc}
     */
    AddressHash.prototype.generateUrl = function (value, absolute) {
        // The relative URL does not need to include the location.pathname to work, so we skip it
        // All the relative URLs start with #
        var ret = '#/' + this._encodeValue(trimSlashes(value));

        if (!absolute) {
            return ret;
        }

        return this._locationShp + '/' +  this._basePath + ret;
    };

    // ---------------------------------------------------------------

    /**
     * {@inheritDoc}
     */
    AddressHash.prototype._readValue = function (path) {
        var hash = path || location.href,
            pos = hash.indexOf('#');

        // Get the hash
        hash = pos !== -1 ? hash.substr(pos + 1) : '';

        // Trim slashes from the value
        hash = trimSlashes(hash);

        return decodeURIComponent(hash);
    };

    /**
     * {@inheritDoc}
     */
    AddressHash.prototype._writeValue = function (value, replace) {
        value = '#/' + this._encodeValue(value);

        if (replace) {
            location.replace(value);
        } else {
            location.href = value;
        }
    };

    /**
     * Encodes the passed value to be safelly used.
     *
     * @param  {String} value The value to be encoded
     *
     * @return {String} The encoded value
     */
    AddressHash.prototype._encodeValue = function (value) {
        // Use encodeURI because its similar to encodeURIComponent but preserves some chars (without breaking) and prevents a bug in Safari
        value = encodeURI(value);

        // Encode the # because encodeURI does not handle it
        // This is actually only needed in IE and Opera, but we do it in every browser
        value = value.replace(/#/g, '%23');

        return value;
    };

    /**
     * {@inheritDoc}
     */
    AddressHash.prototype._onDestroy = function () {
        $(window).off('hashchange', this._onNewValueByExternalEvent);

        AddressHash._instance = null;
        Address.prototype._onDestroy.call(this);
    };

    // ---------------------------------------------------------------

    AddressHash._instance = null;

    /**
     * {@inheritDoc}
     */
    AddressHash.isCompatible = function () {
        // When IE8 is rendering with IE7 mode, it reports has having the event but it does not fire it!
        // Also IE in file protocol totally messes up when back & forward are clicked
        var docMode = document.documentMode;

        return ('onhashchange' in window && (docMode == null || docMode > 7) &&
               (navigator.userAgent.indexOf('MSIE') === -1 || location.protocol !== 'file:'));
    };

    /**
     * Creates a new instance of returns the current initialized  one.
     *
     * @param {Object} $options The options
     *
     * @return {AddressHash} The address
     */
    AddressHash.getInstance = function (options) {
        if (!AddressHash._instance) {
            AddressHash._instance = new AddressHash(options);
        }


        return AddressHash._instance;
    };

    return AddressHash;
});
