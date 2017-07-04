import { Whenable } from './whenable';
import { expect } from 'chai';
import 'mocha';

interface TestCase<T> {
    create(): Whenable<T>;
    verify(whenable: Whenable<T>, done: MochaDone): void;
}

const expectedError = new Error('expected');

function testSyncAndAsync<T>(description: string, testCase: TestCase<T>): void {
    describe(description, function () {
        it('.when called synchronously', function (done) {
            testCase.verify(testCase.create(), () => {
                setImmediate(done);
            });
        });

        it('.when called asynchronously', function (done) {
            const whenable = testCase.create();
            setImmediate(() => {
                testCase.verify(whenable, () => {
                    setImmediate(done);
                });
            });
        });
    });
}

describe('Whenable', function () {
    describe('.when', function () {
        testSyncAndAsync('should complete', {
            create() {
                return new Whenable<string>((value, error, complete) => {
                    complete();
                });
            },
            verify(whenable, done) {
                whenable.when(
                    value => { throw new Error('should not value'); },
                    error => done(error),
                    () => done()
                );
            },
        });

        testSyncAndAsync('should not catch errors from own handler', {
            create() {
                return new Whenable<string>((value, error, complete) => {
                    value('1');
                    complete();
                });
            },
            verify(whenable, done) {
                const expected = new Error('expected error');
                try {
                    whenable.when(
                        value => { throw expected },
                        error => done(error),
                        () => done(new Error('should not complete'))
                    );
                } catch (actual) {
                    expect(actual).equals(expected);
                    done();
                }
            },
        });

        testSyncAndAsync('should not value or error after complete', {
            create() {
                return new Whenable<string>((value, error, complete) => {
                    complete();
                    value('1');
                    error(new Error('unexpected'));
                });
            },
            verify(whenable, done) {
                whenable.when(value => {
                    done(new Error('should not emit after complete'));
                }, error => {
                    done(error);
                }, () => {
                    done();
                });
            },
        });

        testSyncAndAsync('should not value or complete after error', {
            create() {
                return new Whenable<string>((value, error, complete) => {
                    error(expectedError);
                    value('1');
                    complete();
                });
            },
            verify(whenable, done) {
                whenable.when(value => {
                    done(new Error('should not value after error'));
                }, error => {
                    expect(error).equals(expectedError);
                    done();
                }, () => {
                    done(new Error('should not complete after error'));
                });
            },
        });

        testSyncAndAsync('record synchronous value and error', {
            create() {
                return new Whenable<string>((value, error, complete) => {
                    value('1');
                    value('2');
                    error(expectedError);
                });
            },
            verify(whenable, done) {
                let i = 0;
                whenable.when(value => {
                    i++;
                }, error => {
                    expect(i).equals(2);
                    expect(error).equals(expectedError);
                    done();
                }, () => {
                    done(new Error('should not complete'));
                });
            },
        });

        testSyncAndAsync('record asynchronous value and error', {
            create() {
                return new Whenable<string>((value, error, complete) => {
                    value('1');
                    setImmediate(() => {
                        value('2');
                        setImmediate(() => {
                            error(expectedError);
                        });
                    });
                });
            },
            verify(whenable, done) {
                let i = 0;
                whenable.when(value => {
                    i++;
                }, error => {
                    expect(i).equals(2);
                    expect(error).equals(expectedError);
                    done();
                }, () => {
                    done(new Error('should not complete'));
                });
            },
        });

        testSyncAndAsync('record synchronous value and complete', {
            create() {
                return new Whenable<number>((value, error, complete) => {
                    value(1);
                    value(2);
                    complete()
                });
            },
            verify(whenable, done) {
                let i = 0;
                whenable.when(value => {
                    i++;
                    expect(value).equals(i);
                }, error => {
                    done(error);
                }, () => {
                    expect(i).equals(2);
                    done();
                });
            },
        });

        testSyncAndAsync('record async value and complete', {
            create() {
                return new Whenable<number>((value, error, complete) => {
                    value(1);
                    setImmediate(() => {
                        value(2);
                        setImmediate(() => {
                            complete();
                        })
                    })
                });
            },
            verify(whenable, done) {
                let i = 0;
                whenable.when(value => {
                    i++;
                    expect(value).equals(i);
                }, error => {
                    done(error);
                }, () => {
                    expect(i).equals(2);
                    done();
                });
            },
        });

        testSyncAndAsync('should chain values', {
            create() {
                return new Whenable<number>((value, error, complete) => {
                    value(1);
                    complete();
                });
            },
            verify(whenable: Whenable<number>, done) {
                whenable.when(value => {
                    return (-1 * value).toString();
                }).when(value => {
                    expect(value).equals('-1');
                }).when(value => {
                    done();
                });
            },
        });

        testSyncAndAsync('should chain errors', {
            create() {
                return new Whenable<number>((value, error, complete) => {
                    error(expectedError);
                });
            },

            verify(whenable: Whenable<number>, done) {
                let i = 0;
                whenable.when(value => {
                    done(new Error('should not value'));
                }, error => {
                    i++;
                    expect(error).equals(expectedError);
                }).when(value => {
                    done(new Error('should not value'));
                }, error => {
                    i++;
                    expect(error).equals(expectedError);
                    expect(i).equals(2);
                    done();
                });
            },
        });

        testSyncAndAsync('should chain complete', {
            create() {
                return new Whenable<number>((value, error, complete) => {
                    complete();
                });
            },

            verify(whenable: Whenable<number>, done) {
                let i = 0;
                whenable.when(value => {
                    done(new Error('should not value'));
                }, error => {
                    done(new Error('should not error'));
                }, () => {
                    i++;
                }).when(value => {
                    done(new Error('should not value'));
                }, error => {
                    done(new Error('should not error'));
                }, () => {
                    i++;
                    expect(i).equals(2);
                    done();
                });
            },
        });

        // testSyncAndAsync('empty', {
        //     create() {
        //         return new Whenable<number>((value, error, complete) => {
        //         });
        //     },
        //     verify(whenable, done) {
        //         whenable.when(value => {
        //         }, error => {
        //         }, () => {
        //         });
        //     },
        // });

    });
});
