redux-batched-subscribe
=====================

[![build status](https://img.shields.io/travis/tappleby/redux-batched-subscribe/master.svg?style=flat-square)](https://travis-ci.org/tappleby/redux-batched-subscribe)
[![npm version](https://img.shields.io/npm/v/redux-batched-subscribe.svg?style=flat-square)](https://www.npmjs.com/package/redux-batched-subscribe)

Store enhancer for [redux](https://github.com/gaearon/redux) which allows batching of subscribe notifications that occur as a result of dispatches.

```js
npm install --save redux-batched-subscribe
```

## Usage

### Debounced subscribe handlers:

```js
import { batchedSubscribe } from 'redux-batched-subscribe';
import debounce from 'lodash.debounce';

const batchDebounce = debounce(notify => notify());
const store = batchedSubscribe(batchDebounce)(createStore)(reducer, intialState);
```

### React batched updates

```js
import { batchedSubscribe } from 'redux-batched-subscribe';

// React <= 0.13
import { addons } from 'react/addons';
const batchedUpdates = addons.batchedUpdates;

// React 0.14-beta
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom';

const store = batchedSubscribe(batchedUpdates)(createStore)(reducer, intialState);
```

This store enhancer also exposes a `subscribeImmediate` method which allows for unbatched subscribe notifications.

### With Middlware

When using batched updates with redux middleware, it must be added to the store first.

```js
import { batchedSubscribe } from 'redux-batched-subscribe';
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom';
import thunkMiddleware from 'redux-thunk'; // example middlware

const middleware = [thunkMiddleware];

const createStoreWithBatchedUpdates = batchedSubscribe(batchedUpdates)(createStore);
const createStoreWithMiddleware = applyMiddleware(...middleware)(createStoreWithBatchedUpdates);

const store = createStoreWithMiddleware(reducer, initialState);
```

## Thanks

Thanks to [Andrew Clark](https://github.com/acdlite) for the clean library structure.
