# whenable [![NPM Version](https://img.shields.io/npm/v/whenable.svg)](https://npmjs.org/package/whenable) [![travis](https://img.shields.io/travis/nicksnyder/whenable.svg?style=flat)](https://travis-ci.org/nicksnyder/whenable)

A minimal implementation of an object that supports streams of data.

Similar to:
- [RsJS](https://github.com/Reactive-Extensions/RxJS), except whenable is bare-bones.
- Promises, except whenable can emit values many times before completing.

## Example

```ts

import { Whenable } from 'whenable';

const whenable = new Whenable<number>((value, error, complete) => {
    value(1);
    value(2);
    complete();
}).when(value => {
    return (-2 * value).toString();
}).when(value => {
    console.log(value)
});
```
