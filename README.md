# Address
---

Simple library that abstracts the address (url) manipulation.
This library handles all the browsers quirks and values that contain special meaning in URL's.
There is two implementations available, one that uses the hash (#) and another one that uses the new HTML5 history API (pushState).

Both implementations also listen to clicks in links and tries to interpret them as values.
For example, if a link has its `href` set to/foo and the user clicks it, the address value changes to `/foo` and an `change` event of type `TYPE_INTERNAL_CHANGE` will be fired (assuming the hash version).
You can disable this behaviour globally by disabling the `handleLinks` option or locally by setting the `data-url-type` attribute to `external` in the link tag.
The `data-url-type` can also take the value `internal` which means that preventDefault() will still be called but the actual behaviour should be handled manually.
Note that in the majority of the cases the library is smart enough to automatically detect if a link is external or internal.

The implementation is not currently supported in < IE8.

## Deciding between HTML or Hash

```js
var address;

if (AddressHTML5.isCompatible()) {
    address = new AddressHTML();
} else {
    address = new AddressHash();
} else {
    throw new Error('Not supported in the current browser!');
}
```

## Options

Options are passed to the constructor. Available ones are:

- handleLinks: true to listen to clicks in links in the DOM and handle them, false otherwise
- basePath: the base path of the site (e.g.: `/myapp/demo/`), will be used only in `HTML5`

## API

Optional parameters are prefixed with an $.

### Address#disable()

Disables the address. All operations that change the value will be no ops.   
Fires a `EVENT_DISABLE` event.

### Address#enable()

Enables the address.   
Fires a `EVENT_ENABLE` event.

### Address#getValue()

Return the current value of the address.


### Address#setValue(value, $options)

Set a new value into the address.   
Fires an `EVENT_CHANGE` event of type `TYPE_INTERNAL_CHANGE` if the value differs from the current one.

The following options are available:
- `force`:   true to force the value to be changed even if the value is the same
- `silent`:  true to change the value with firing the change event
- `replace`: true to replace the last history entry

_NOTE_: These options are also available in data-url-* attributes, e.g.:
`data-url-force="true"`

### Address#reset()

Resets the internal state of address.   
Clears the internal value and any other state.


### Address#generateUrl(value, $absolute)

Generate an URL from a `value` to be safely used in link tags.   
By default the generated URL will be relative, unless `$absolute` is true.


### Address#on(event, fn, $context)

Register an `event` listener `fn` (with the option to pass a `$context`).


### Address#once(event, fn, $context)

Register an `event` listener `fn` (with the option to pass a `$context`) that runs only once.


### Address#off(event, $fn, $context)

Remove `event` listener `$fn` that was added with `$context`.   
If no `$fn` is passed, removes all listeners for `$event` or all the emitter listeners if no `$event` is passed.


### Address#destroy()

Destroys the instance.



## Events

- `EVENT_CHANGE`           fired after the value changes
- `EVENT_DISABLE`          fired when the address is disabled
- `EVENT_ENABLE`           fired when the address is enabled

### Change event

The change event is fired with a single argument, an object with:
- `newValue`               the new address value
- `oldValue`               the old address value
- `type`                   the type of the change (see bellow)
- `event`                  the DOM event if the event originated from a link, null otherwise

Change event types:
- `TYPE_EXTERNAL_CHANGE`   if the value changes due to an external event (back, next, etc)
- `TYPE_INTERNAL_CHANGE`   if the value changes due to a setValue() call
- `TYPE_LINK_CHANGE`       if the value changes due to user clicking a link


## Testing

The tests are built on top of [mocha](http://visionmedia.github.com/mocha/) test framework and the [expect.js](https://github.com/LearnBoost/expect.js) assert library.

First run `npm install` and `bower install` to install all the tools needed.
To test via node run `npm test` though they have some limitations.
To test in the browser, run `node test_server.js` to spawn a local `node server` and open the outputed URL in your browser.

## URL Rewrite

For the HTML5 version to work correctly, the web server must rewrite all the urls to your front controller.
An example of an .htaccess (apache) is given.
Note that for apache, the mod_rewrite must be enabled.



## Dependencies

Address depends on [mout](https://github.com/mout/mout), [dejavu](https://github.com/IndigoUnited/dejavu), [events-emitter](https://github.com/IndigoUnited/events-emitter) and [base-adapter](https://github.com/IndigoUnited/base-adapter).

If you use RequireJS specify them like this:

```js
    paths : {
        'mout': '../vendor/mout/src'
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



## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
