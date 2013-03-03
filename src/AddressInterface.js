/*jshint unused:false*/

/**
 * Address interface.
 *
 * Events:
 * - EVENT_CHANGE            fired after each of the ones above (generic event)
 * - EVENT_DISABLE           fired when the address is disabled
 * - EVENT_ENABLE            fired when the address is enabled
 *
 * Change event types:
 * - TYPE_EXTERNAL_CHANGE    if the value changes due to an external event (back, next, etc)
 * - TYPE_INTERNAL_CHANGE    if the value changes due to a setValue() call
 * - TYPE_LINK_CHANGE        if the value changes due to user clicking a link click (<a> tags)
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
            TYPE_EXTERNAL_CHANGE: 'external',
            TYPE_INTERNAL_CHANGE: 'internal',
            TYPE_LINK_CHANGE: 'link',

            EVENT_CHANGE: 'change'
        },

        /**
         * Enables the address.
         *
         * @return {Address} The instance itself to allow chaining
         */
        enable: function () {},

        /**
         * Disables the address.
         *
         * @return {Address} The instance itself to allow chaining
         */
        disable: function () {},

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
         * If the resource changed, the change event will be fired (with type internal).
         *
         * The default implementation should handle these options:
         *  - force:  true to force the value to be changed even if the value is the same
         *  - silent: true to change the value with firing the change event
         *
         * @param {String} value      The value to be set
         * @param {Object} [$options] The options
         *
         * @return {Address} The instance itself to allow chaining
         */
        setValue: function (value, $options) {},

        /**
         * Resets the interal state of address.
         * Clears the internal value and any other state.
         *
         * @return {Address} The instance itself to allow chaining
         */
        reset: function () {},

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
