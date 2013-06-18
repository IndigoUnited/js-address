define(function () {

    'use strict';

    function startsWith(str, prefix) {
        str = (str || '');
        prefix = (prefix || '');
        return str.indexOf(prefix) === 0;
    }

    return startsWith;
});