define(['mout/object/fillIn', 'mout/object/mixIn'], function (fillIn, mixIn) {

    'use strict';

    var eventMatchers = {
        HTMLEvents: /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        MouseEvents: /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    },
        eventProps = {
            pointerX: 0,
            pointerY: 0,
            button: 0,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            bubbles: true,
            cancelable: true
        };

    /**
     * Triggers a native event.
     * Throws an error if not supported.
     *
     * @param {Element} element  The element
     * @param {String}  event    The event name
     * @param {Object}  [$props] The event props to be merged with the default ones
     */
    function triggerEvent(element, event, $props) {

        var options,
            oEvent,
            interf,
            key;

        for (key in eventMatchers) {
            if (eventMatchers[key].test(event)) {
                interf = key;
                break;
            }
        }

        if (!interf) {
            throw new SyntaxError('Only HTMLEvents and MouseEvents are supported.');
        }

        options = fillIn($props || {}, eventProps);

        if (document.createEvent) {
            oEvent = document.createEvent(interf);

            if (interf === 'HTMLEvents') {
                oEvent.initEvent(event, options.bubbles, options.cancelable);
            } else {
                oEvent.initMouseEvent(event, options.bubbles, options.cancelable, document.defaultView,
                    options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element
                );
            }

            element.dispatchEvent(oEvent);
        } else {
            options.clientX = options.pointerX;
            options.clientY = options.pointerY;
            oEvent = mixIn(document.createEventObject(), options);

            element[(element._fireEvent ? '_fireEvent' : 'fireEvent')]('on' + event, oEvent);    // This is because mootools replaces the native fireEvent but saves a copy into _fireEvent
        }
    }

    return triggerEvent;
});
