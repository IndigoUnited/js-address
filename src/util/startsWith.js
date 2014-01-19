define(function () {

    'use strict';

    /**
     * Verifies if a string starts with another.
     *
     * @param {String} str    The string that will be checked
     * @param {String} prefix The prefix to check
     *
     * @return {Boolean} True if it starts, false otherwise
     */
    function startsWith(str, prefix) {
        str = (str || '');
        prefix = (prefix || '');

        return str.indexOf(prefix) === 0;
    }

    return startsWith;
});
