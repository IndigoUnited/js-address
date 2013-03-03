define([
    'src/Address',
    'src/AddressHash',
    'src/AddressHTML5',
    'has',
    'jquery',
    'mout/function/bind',
    'mout/array/append',
    'mout/string/startsWith',
    'mout/string/endsWith',
    'base-adapter/src/util/triggerEvent'
], function (Address, AddressHash, AddressHTML5, has, $, bind, append, startsWith, endsWith, triggerEvent) {

    'use strict';

    // TODO: test enable() & disable()
    // TODO: test silent, force, replace options of setValue()
    // TODO: test handleLinks address options

    var stack,
        values,
        timeout = 300,
        link = document.getElementById('test-link'),
        linkInner = $(link).children().get(0),
        shp = location.protocol + '//' + location.host,
        originalPathname = location.pathname,
        pathname,
        address,
        initialValue = 'some\'+value',
        addressHTML5Options = [
            {},
            {
                basePath: '/'
            },
            {
                basePath: 'bleh/'
            },
            {
                basePath: '/some/'
            },
            {
                basePath: '/'
            },
            {
                basePath: '//'
            },
            {
                basePath: 'google.com/'
            },
            {
                basePath: '/' + location.host + '/'
            },
            {
                basePath: '/' + location.hostname + ':80/'
            },
            {
                basePath: '/some\'!?\\|"@#£$§%20&/{}[]()+=»«´` ~º-_:.;,*/äÄÖöÜüß€—С你好/',
                encodedBasePath: '/some\'!%3F%5C%7C%22@%23%C2%A3$%C2%A7%2520&/%7B%7D%5B%5D()+=%C2%BB%C2%AB%C2%B4%60%20~%C2%BA-_:.;,*/%C3%A4%C3%84%C3%96%C3%B6%C3%9C%C3%BC%C3%9F%E2%82%AC%E2%80%94%D0%A1%E4%BD%A0%E5%A5%BD/'
            }
        ];

    function click() {
        if (linkInner.click) {
            linkInner.click();
        } else {
            triggerEvent(linkInner, 'click');
        }
    }

    function preventDefault(e) {
        // Prevent the browser from navigating away
        e.preventDefault();
    }

    function testAddressHash() {
        if (address) {
            address.destroy();
        }

        if (AddressHash.isCompatible()) {
            describe('AddressHash', function () {

                beforeEach(function () {
                    stack = [];
                    values = [];
                });

                if (has('debug')) {
                    console.log('--------------------------');
                    console.log('Initializing AddressHash..');
                    console.log('--------------------------');
                }

                location.hash = '#' + initialValue + '?wtf#wtf';

                address = AddressHash.getInstance();
                run(address);

                after(function () {
                    testAddressHTML5();
                });
            });
        } else {
            alert('AddressHash is not compatible with this environment.. are you running IE older than 8 or in the file protocol?');
            testAddressHTML5();
        }
    }

    function testAddressHTML5() {

        if (address) {
            address.destroy();
        }

        if (AddressHTML5.isCompatible()) {

            var options = addressHTML5Options.shift();

            pathname =  options.encodedBasePath || options.basePath;
            if (pathname !== '' && !pathname) {
                pathname = originalPathname;
            }

            pathname = '/' + pathname.replace(/^\/*/, '');
            if (!endsWith(pathname, '/')) {
                pathname = pathname + '/';
            }

            describe('AddressHTML5 (basePath: ' + (!options.basePath && options.basePath !== '' ? originalPathname + '/' : options.basePath) + ')', function () {
                beforeEach(function () {
                    stack = [];
                    values = [];
                });

                if (has('debug')) {
                    console.log('---------------------------');
                    console.log('Initializing AddressHTML5..');
                    console.log('---------------------------');
                    console.log('base path: ' + (!options.basePath && options.basePath !== '' ? originalPathname + '/': options.basePath));
                    console.log('---------------------------');
                }

                history.pushState({}, '', pathname + initialValue + '?wtf#wtf');

                address = AddressHTML5.getInstance(options);
                run(address);

                after(function () {

                    if (addressHTML5Options.length) {
                        testAddressHTML5();
                    } else {
                        address.destroy();
                    }

                    history.pushState({}, '', originalPathname);   // Restore the initial state to be easier to refresh
                });
            });
        } else {
            console.log('');
            console.warn('The current environment is not compatible with HTML5');
        }
    }

    function run(address) {

        address.on('change', function (obj) {
            switch (obj.type) {
            case Address.TYPE_INTERNAL_CHANGE:
                stack.push('i');
                break;
            case Address.TYPE_EXTERNAL_CHANGE:
                stack.push('e');
                break;
            case Address.TYPE_LINK_CHANGE:
                stack.push('l');
                break;
            }

            stack.push('c');
            values.push(obj.newValue);
        });

        it('should be able to read the initial value with getValue()', function () {

            if (has('debug')) {
                console.log('> should be able to read the initial value with getValue()');
            }

            expect(address.getValue()).to.be.equal(address instanceof AddressHash ? initialValue + '?wtf#wtf' : initialValue);

        });

        it('should change the value if setValue() is called with a new value', function () {

            if (has('debug')) {
                console.log('> should change the value if setValue is called with a new value');
            }

            address.setValue('first');
            expect(address.getValue()).to.be.equal('first');

            if (address instanceof AddressHash) {
                address.setValue('/first');
                expect(address.getValue()).to.be.equal('/first');
            }

            address.setValue('#second');
            expect(address.getValue()).to.be.equal('#second');

            address.setValue('#second');
            expect(address.getValue()).to.be.equal('#second');

        });

        it('should fire the internal event if setValue() is called with a new value', function (done) {

            if (has('debug')) {
                console.log('> should fire the internal event if setValue is called with a new value');
            }

            address.setValue('first');
            address.setValue('/first');
            address.setValue('#second');
            address.setValue('#second');

            setTimeout(function () {
                if (address instanceof AddressHash) {
                    expect(stack).to.eql(['i', 'c', 'i', 'c', 'i', 'c']);
                    expect(values).to.eql(['first', '/first', '#second']);
                } else {
                    expect(stack).to.eql(['i', 'c', 'i', 'c']);
                    expect(values).to.eql(['first', '#second']);
                }

                done();
            }, timeout);

        });

        it('should fire the external event if back or next buttons are pressed or user typed a new value', function (done) {

            if (has('debug')) {
                console.log('> should fire the external event if back or next buttons are pressed or user typed a new value');
            }

            if (address instanceof AddressHash) {
                address.setValue('one');
                address.setValue('second');
                address.setValue('/second');
                address.setValue('third');

                setTimeout(function () {
                    history.back();

                    setTimeout(function () {
                        history.back();

                        setTimeout(function () {
                            history.back();

                            setTimeout(function () {
                                expect(stack).to.eql(['i', 'c', 'i', 'c', 'i', 'c', 'i', 'c', 'e', 'c', 'e', 'c', 'e', 'c']);
                                expect(values).to.eql(['one', 'second', '/second', 'third', '/second', 'second', 'one']);
                                done();
                            }, timeout);
                        }, timeout);
                    }, timeout);
                }, timeout);
            } else {
                address.setValue('one');
                address.setValue('second');
                address.setValue('/second');
                address.setValue('third');

                setTimeout(function () {
                    history.back();

                    setTimeout(function () {
                        history.back();

                        setTimeout(function () {
                            expect(stack).to.eql(['i', 'c', 'i', 'c', 'i', 'c', 'e', 'c', 'e', 'c']);
                            expect(values).to.eql(['one', 'second', 'third', 'second', 'one']);
                            done();
                        }, timeout);
                    }, timeout);
                }, timeout);
            }

        });

        it('should fire the link change if the user clicks an application link', function (done) {

            if (has('debug')) {
                console.log('> should fire the link change if the user clicks an application link');
            }

            if (address instanceof AddressHash) {
                link.href = '#first';
                click();
                link.href = '##second';
                click();
                link.href = '#/second';
                click();
                click();

                setTimeout(function () {
                    expect(stack).to.eql(['l', 'c', 'l', 'c', 'l', 'c']);
                    expect(values).to.eql(['first', '#second', '/second']);
                    done();
                }, timeout);
            } else {
                link.href = pathname + 'first';
                click();
                link.href = pathname + 'second';
                click();
                click();
                link.href = pathname + 'second?wtf';
                click();
                link.href = pathname + 'second#wtf';
                click();
                link.href = pathname + 'second?wtf#wtf';
                click();

                setTimeout(function () {
                    expect(stack).to.eql(['l', 'c', 'l', 'c']);
                    expect(values).to.eql(['first', 'second']);
                    done();
                }, timeout);
            }

        });

        it('should ignore clicks on links with data-url-type=external|internal', function (done) {

            if (has('debug')) {
                console.log('> should ignore links with data-url-type=external|internal');
            }

            link.setAttribute('data-url-type', 'internal');

            link.href = '#first';
            click();
            link.href = '/first';
            click();
            link.href = '##second';
            click();
            click();

            setTimeout(function () {
                expect(stack).to.eql([]);

                $(document.body).on('click', preventDefault);
                link.setAttribute('data-url-type', 'external');

                link.href = '#first';
                click();
                link.href = '/first';
                click();
                link.href = 'http://google.com';
                click();
                link.href = 'http://google.com#some';
                click();

                link.setAttribute('data-url-type', '');
                $(document.body).off('click', preventDefault);

                setTimeout(function () {
                    expect(stack).to.eql([]);
                    done();
                });

            }, timeout);

        });

        it('should ignore clicks on links with target different than _self', function (done) {

            if (has('debug')) {
                console.log('> should ignore links with target different than _self');
            }

            $(document.body).on('click', preventDefault);

            link.target = '_blank';
            link.href = 'http://google.com';
            click();
            link.href = 'some';
            click();
            click();

            $(document.body).off('click', preventDefault);
            link.target = '';

            setTimeout(function () {
                expect(stack).to.eql([]);
                done();
            }, timeout);

        });

        it('should ignore clicks on external links automatically', function (done) {

            if (has('debug')) {
                console.log('> should ignore external links automatically');
            }

            $(document.body).on('click', preventDefault);

            link.href = 'http://google.com';
            click();
            link.href = 'http://google.com#some';
            click();
            link.href = 'https://google.com';
            click();
            link.href = 'ftp://google.com';
            click();

            $(document.body).off('click', preventDefault);

            setTimeout(function () {
                expect(stack).to.eql([]);
                done();
            }, timeout * 2);

        });

        it('should work with special characters passed to setValue()', function (done) {

            if (has('debug')) {
                console.log('should work with special characters');
            }

            this.timeout(10000);

            var special,
                length,
                x;

            if (address instanceof AddressHash) {
                special = [
                    'some/url', '/some/url', 'some#url', '#someurl', 'some%2Furl', 'some%5Curl', 'some%url', 'some%25',
                    'some\'!?\\|"@#£$§%20&/{}[]()+=»«´` ~º-_:.;,*/äÄÖöÜüß€—С',
                    '你好', '良い', 'хорошо'
                ];
            } else {
                special = [
                    'some/url', 'some#url', '#someurl', 'some%2Furl', 'some%5Curl', 'some%url', 'some%25',
                    'some\'!?\\|"@#£$§%20&/{}[]()+=»«´` ~º-_:.;,*/äÄÖöÜüß€—С',
                    '你好', '良い', 'хорошо'
                ];
            }

            length = special.length;

            function doBack(x) {
                history.back();

                if (x === length - 1) {
                    compare();
                }
            }

            function compare() {
                setTimeout(function () {

                    var array = append(append([], special), special.slice(0, -1).reverse()),
                        tmp;

                    expect(values).to.eql(array);

                    // Do a final test with special chars in links
                    // This is redudant because the test bellow also does test it but this is a more aggressive one
                    values = [];

                    if (address instanceof AddressHash) {
                        tmp = 'some\'!?\\|"@#£$§&/{}[]()С+=»«´`~º-_:.;,*/äÄÖöÜüß€—你好良いхорошо';
                        link.href = '#' + tmp;
                    } else {
                        tmp = 'some\'!?\\|"@#£$§%20&/{}[]()С+=»«´` ~º-_:.;,*/äÄÖöÜüß€—你好良いхорошо';
                        link.href = pathname + encodeURIComponent(tmp);
                    }

                    click();

                    if (address instanceof AddressHash) {
                        link.href = '#dummy';
                    } else {
                        link.href = pathname + 'dummy';
                    }

                    click();

                    setTimeout(function () {
                        history.back();

                        setTimeout(function () {
                            expect(values).to.eql([tmp, 'dummy', tmp]);
                            done();
                        }, timeout);
                    }, timeout);
                }, timeout);
            }

            for (x = 0; x < length; x += 1) {
                address.setValue(special[x]);
            }

            length -= 1;
            for (x = 0; x < length; x += 1) {
                setTimeout(bind(doBack, this, x), timeout + ((x + 1) * timeout));
            }

        });

        it('should generate the correct relative and absolute URLs (also with special chars)', function (done) {

            if (has('debug')) {
                console.log('should generate the correct relative and absolute URLs');
            }

            this.timeout(10000);

            var special,
                length,
                x,
                url,
                absolute;

            if (address instanceof AddressHash) {
                special = [
                    'some/url', '/some/url', 'some#url', '#someurl', 'some%2Furl', 'some%5Curl', 'some%url', 'some%25',
                    'some\'!?\\|"@#£$§%20&/{}[]()+=»«´` ~º-_:.;,*/äÄÖöÜüß€—С',
                    '你好', '良い', 'хорошо'
                ];
            } else {
                special = [
                    'some/url', 'some#url', '#someurl', 'some%2Furl', 'some%5Curl', 'some%url', 'some%25',
                    'some\'!?\\|"@#£$§%20&/{}[]()+=»«´` ~º-_:.;,*/äÄÖöÜüß€—С',
                    '你好', '良い', 'хорошо'
                ];
            }

            length = special.length;

            function doBack(x) {
                history.back();

                if (x === length - 1) {
                    compare();
                }
            }

            function compare() {
                setTimeout(function () {

                    var array = append(append([], special), special.slice(0, -1).reverse());

                    expect(values).to.eql(array);
                    if (absolute) {
                        done();
                    } else {
                        start(true);
                    }
                }, timeout);
            }

            function start(_absolute) {
                var path;

                if (has('debug')) {
                    console.log('> testing ' + (_absolute ? 'absolute' : 'relative') + ' urls');
                }

                address.setValue('dummy');

                values = [];
                absolute = _absolute;
                length = special.length;

                for (x = 0; x < length; x += 1) {

                    url = address.generateUrl(special[x], absolute);

                    if (!absolute) {
                        if (address instanceof AddressHash) {
                            expect(url.substr(0, 1)).to.equal('#');
                        } else {
                            expect(startsWith(url, pathname)).to.be.ok();
                        }
                    } else {
                        path = url.substr(0, shp.length);
                        expect(path).to.be.equal(shp);

                        if (address instanceof AddressHash) {
                            url = url.substr(shp.length);
                            expect(startsWith(url, location.pathname)).to.be.ok();
                            url = url.substr(location.pathname.length);
                            expect(url.substr(0, 1)).to.equal('#');
                        } else {

                        }
                    }

                    link.href = url;
                    click();
                }

                length -= 1;
                for (x = 0; x < length; x += 1) {
                    setTimeout(bind(doBack, null, x), timeout + ((x + 1) * timeout));
                }
            }

            start(false);
        });

    }

    testAddressHash();
});