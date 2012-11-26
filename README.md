# Address #
---

Simple library that abstracts the address (url) manipulation.
This library handles all the browsers quirks and values that contain special meaning in URL's.
There is two implementations available, one that uses the hash (#) and another one that uses the new HTML5 history API (pushState).

Both implementations also listen to clicks in links and tries to interpret them as values.
For example, if a link has its `href` set to #/foo and the user clicks it, the address value changes to `/foo` and an `LINK_CHANGE_EVENT` along with a generic `CHANGE_EVENT` will be fired (assuming the hash version).
You can disable this behaviour globally by disabling the `handleLinks` option or locally by setting the `data-url-type` attribute to `external` in the link tag.
The `data-url-type` can also take the value `internal` which means that preventDefault() will still be called but the actual behaviour should be handled manually.
Note that in the majority of the cases the library is smart enough to automatically detect if a link is external or internal.

The implementation is not currently supported in < IE8.



## API ##

Optional parameters are prefixed with an $.

### Address#setValue(value, $silent) ###

Set a new value into the address.
Fires an `INTERNAL_CHANGE_EVENT` and an `CHANGE_EVENT` if the value differs from the current one unless `$silent` is true.


### Address#getValue() ###

Return the current value of the address.



### Address#disable() ###

Disables the address. All operations that change the value will be no ops.


### Address#enable() ###

Enables the address.



### Address#getValue() ###

Return the current value of the address.

### Address#generateUrl(value, $absolute)

Generate an URL from a `value` to be safely used in link tags.
By default the generated URL will be relative, unless `$absolute` is true.


### Address#on(event, fn, $context) ###

Register an `event` listener `fn` (with the option to pass a `$context`).


### Address#off(event, $fn, $context) ###

Remove `event` listener `$fn` that was added with `$context`.
If no `$fn` is passed, removes all listeners for `$event` or all the emitter listeners if no `$event` is passed.


### Address#destroy() ###

Destroys the instance.



## Events ##

- `EVENT_EXTERNAL_CHANGE`    if the value changes due to an external event (back, next, etc)
- `EVENT_INTERNAL_CHANGE`    if the value changes due to a setValue() call
- `EVENT_LINK_CHANGE`        if the value changes due to user clicking a link click (`a` tag)
- `EVENT_CHANGE`             fired after each of the ones above (generic event)



## Testing ##

The tests are built on top of [mocha](http://visionmedia.github.com/mocha/) test framework and the [expect.js](https://github.com/LearnBoost/expect.js) assert library.

First run `npm install` and `bower install` to install all the tools needed.
Then simply open the `test/tester.html` file in the browser.
Beware that the HTML5 tests won't run in the file:// protocol.
To test via node run `npm test` though they have some limitations.


## URL Rewrite ##

For the HTML5 version to work correctly, the web server must rewrite all the urls to your front controller.
An example of an .htaccess (apache) is given.
Note that for apache, the mod_rewrite must be enabled.



## Dependencies ##

Address depends on [amd-utils](https://github.com/millermedeiros/amd-utils), [dejavu](https://github.com/IndigoUnited/dejavu), [events-emitter](https://github.com/IndigoUnited/events-emitter) and [base-adapter](https://github.com/IndigoUnited/base-adapter).

If you use RequireJS specify them like this:

```js
    paths : {
        'amd-utils': '../vendor/amd-utils/src'
        'dejavu': '../vendor/dehavy/dist/amd/strict',                   // use the loose version in production
        'events-emitter': '../vendor/events-emitter/src',
        'base-adapter': '../vendor/base-adapter/src/adapters/jquery',   // use one of the available adapters
        'jquery': '../vendor/jquery/jquery.js'                          // use one of the base libraries
    },
```

Aditionally you have to specify the following map:

```js
    map: {
        '*': {
            'base-adapter/src': '../vendor/base-adapter/src'
        }
    },
```



## License ##

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).