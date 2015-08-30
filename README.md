# Address [![Build Status](https://travis-ci.org/IndigoUnited/js-address.svg?branch=master)](https://travis-ci.org/IndigoUnited/js-address)

Simple library that abstracts the address (url) manipulation.
This library handles all the browsers quirks and values that contain special meaning in URL's.
There is two implementations available, one that uses the hash (#) and another one that uses the new HTML5 history API (pushState).

Both implementations also listen to clicks in links and tries to interpret them as values.
For example, if a link has its `href` set to/foo and the user clicks it, the address value changes to `/foo` and an `change` event of type `internal` will be fired (assuming the hash version).
You can disable this behaviour globally by disabling the `handleLinks` option or locally by setting the `data-url-type` attribute to `external` in the link tag.
The `data-url-type` can also take the value `internal` which means that preventDefault() will still be called but the actual behaviour should be handled manually.
Note that in the majority of the cases the library is smart enough to automatically detect if a link is external or internal.

The implementation is not currently supported in < IE8.



## Deciding between HTML or Hash

```js
var address;

if (AddressHTML5.isCompatible()) {
    address = new AddressHTML();
} else if (AddressHash.isCompatible()){
    address = new AddressHash();
} else {
    throw new Error('Not supported in the current browser!');
}
```



## Options

Options are passed to the constructor. Available ones are:

- handleLinks: true to listen to clicks in links in the DOM and handle them, false otherwise
- basePath: the base path of the site (e.g.: `/myapp/demo/`)
- strictScheme: Either to be strict when comparing protocols in URL (http vs https, etc), defaults to false


## API

### .disable()

Disables the address. All operations that change the value will be no ops.
Fires a `disable` event.


### .enable()

Enables the address.
Fires a `enable` event.


### .getValue()

Return the current value of the address.

The returned value is not decoded, use decodeSegment to decode each segment of the value.


### .setValue(value, [options])

Set a new value into the address.

The value must be encoded, use `encodeSegment` to encode each segment of the value.   
Fires an `change` event of type `internal` if the value differs from the current one.

The following options are available:
- `force`:   true to force the value to be changed even if the value is the same
- `silent`:  true to change the value with firing the change event
- `replace`: true to replace the last history entry

_NOTE_: These options are also available in data-url-* attributes, e.g.:
`data-url-force="true"`


### .reset()

Resets the internal state of address.
Clears the internal value and any other state.


### .generateUrl(value, [absolute])

Generate an URL from a `value` to be used in link tags.

The value must be encoded, use encodeSegment to encode each segment of the value.   
By default the generated URL will be relative, unless `absolute` is true.


## .encodeSegment(segment)

Encodes a segment to be safely used in the URL itself.


## .decodeSegment(segment)

Decodes a segment, returning the decoded value


### .on(event, fn, [context])

Register an `event` listener `fn` (with the option to pass a `context`).


### .once(event, fn, [context])

Register an `event` listener `fn` (with the option to pass a `context`) that runs only once.


### .off([event], [fn], [context])

Remove `event` listener `$fn` that was added with `context`.
If no `fn` is passed, removes all listeners for `event` or all the emitter listeners if no `event` is passed.


### .destroy()

Destroys the instance.



## Events

- `change`           fired after the value changes
- `disable`          fired when the address is disabled
- `enable`           fired when the address is enabled


### Change event

The change event is fired with a single argument, an object with:
- `newValue`         the new address value
- `oldValue`         the old address value
- `type`             the type of the change (see bellow)
- `event`            the DOM event if the event originated from a link, null otherwise

Change event types:
- `external`         if the value changes due to an external event (back, next, etc)
- `internal`         if the value changes due to a setValue() call
- `link`             if the value changes due to user clicking a link


## URL Rewrite

For the HTML5 version to work correctly, the web server must rewrite all the urls to your front controller.
An example of an .htaccess (apache) is given.
Note that for apache, the mod_rewrite must be enabled.



## How to use

For now, this library is only available in the [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) format.
Address depends on [events-emitter](https://github.com/IndigoUnited/events-emitter), [jquery](https://github.com/jquery/jquery) and [has](https://github.com/phiggins42/has).

If you use RequireJS specify them like this:

```js
// ...
paths : {
   'events-emitter': '../bower_components/events-emitter/src',
   'has': '../bower_components/has/has',
   'jquery': '../bower_components/jquery/jquery'
}
// ...
```

Note that if you want to support `IE8` you will need to install [es5-shim](https://github.com/kriskowal/es5-shim.git) and require both `es5-shim` and `es5-sham` with your AMD loader before requiring this library.



## Tests

1. `bower install`
2. `npm install`
3. `npm test`

You will need [bower](https://github.com/bower/bower) to install the library dependencies.



## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
