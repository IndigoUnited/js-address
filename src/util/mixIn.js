define(function () {

    'use strict';

    /**
     * Copies properties from an object to another.
     *
     * @param {Object} target The target object
     * @param {Object} origin The object to copy from
     *
     * @return {Object} The target object
     */
    function mixIn(target, origin) {
        var key;

        for (key in origin) {
            target[key] = origin[key];
        }

        return target;
    }

    return mixIn;
});
