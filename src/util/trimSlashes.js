define(function () {

    'use strict';

    var leadingRegExp = /^\/+/,
        trailingRegExp = /\/+$/;

    /**
     * Trim slashes.
     *
     * @param {String} value The value to trim
     *
     * @return {String} The trimmed value
     */
    function trimSlashes(value) {
        return value.replace(leadingRegExp, '').replace(trailingRegExp, '');
    }

    /**
     * Trim leading slashes.
     *
     * @param {String} value The value to trim
     *
     * @return {String} The trimmed value
     */
    function trimLeadingSlashes(value) {
        return value.replace(leadingRegExp, '');
    }

    /**
     * Trim trailing slashes.
     *
     * @param {String} value The value to trim
     *
     * @return {String} The trimmed value
     */
    function trimTrailingSlashes(value) {
        return value.replace(trailingRegExp, '');
    }

    trimSlashes.leading = trimLeadingSlashes;
    trimLeadingSlashes.trailing = trimTrailingSlashes;

    return trimSlashes;
});
