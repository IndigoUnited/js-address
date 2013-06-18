define(function () {

    'use strict';

    function mixIn(target, origin) {
        var key;

        for (key in origin) {
            target[key] = origin[key];
        }

        return target;
    }

    return mixIn;
});