/*jshint unused:false*/

/**
 * Address interface.
 *
 * Events:
 * - EVENT_EXTERNAL_CHANGE    if the value changes due to an external event (back, next, etc)
 * - EVENT_INTERNAL_CHANGE    if the value changes due to a setValue() call
 * - EVENT_LINK_CHANGE        if the value changes due to user clicking a link click (<a> tags)
 * - EVENT_CHANGE             fired after each of the ones above (generic event)
 *
 * // TODO: add browser quirks regarding this to the WTF-Browsers repository
 *
 * @author André Cruz <andremiguelcruz@msn.com>
 */
define([
    'dejavu/Interface'
], function (Interface) {

    'use strict';

    return Interface.declare({
        $name: 'AddressInterface',

        $constants: {
            EVENT_EXTERNAL_CHANGE: 'external_change',
            EVENT_INTERNAL_CHANGE: 'internal_change',
            EVENT_LINK_CHANGE: 'link_change',
            EVENT_CHANGE: 'change'
        },

        /**
         * Returns the current address value.
         *
         * @param {String} [$value] A value to be used instead of the address bar value
         *
         * @return {String} The current value
         */
        getValue: function ($value) {},

        /**
         * Sets the address value.
         * If the resource changed, the internal change event will be fired.
         *
         * @param {String} value The value to be set
         *
         * @return {Address} The instance itself to allow chaining
         */
        setValue: function (value) {},

        /**
         * Generates an URL based on a given value.
         * By default the generated URL will be relative unless $absolute is true.
         *
         * @param {String}  value       The value.
         * @param {Boolean} [$absolute] True to generate an absolute URL, false otherwise (defaults to false)
         *
         * @return {String} The generated URL
         */
        generateUrl: function (value, $absolute) {},

        /**
         * Destroys the instance.
         */
        destroy: function () {},

        $statics: {
            /**
             * Check if this implementation is compatible with the current environment.
             */
            isCompatible: function () {}
        }
    });
});
