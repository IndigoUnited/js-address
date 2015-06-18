define(function () {

    'use strict';

    var regExp = /^\s*(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;

    /**
     * Parses an URL.
     * This function was taken from jquery.mobile.
     * See: https://github.com/jquery/jquery-mobile/blob/master/js/navigation/path.js
     *
     * @param {String} url The URL
     *
     * @return {Object} The parsed URL
     */
    function parseUrl(url) {
        var matches = regExp.exec(url) || [];

        // Create an object that allows the caller to access the sub-matches
        // by name. Note that IE returns an empty string instead of undefined,
        // like all other browsers do, so we normalize everything so its consistent
        // no matter what browser we're running on.
        return {
            href:         matches[ 0] || '',
            hrefNoHash:   matches[ 1] || '',
            hrefNoSearch: matches[ 2] || '',
            domain:       matches[ 3] || '',
            protocol:     matches[ 4] || '',
            doubleSlash:  matches[ 5] || '',
            authority:    matches[ 6] || '',
            username:     matches[ 8] || '',
            password:     matches[ 9] || '',
            host:         matches[10] || '',
            hostname:     matches[11] || '',
            port:         matches[12] || '',
            pathname:     matches[13] || '',
            directory:    matches[14] || '',
            filename:     matches[15] || '',
            search:       matches[16] || '',
            hash:         matches[17] || ''
        };
    }

    return parseUrl;
});
