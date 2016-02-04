redux-batched-subscribe
=====================

[![build status](https://img.shields.io/travis/tappleby/redux-batched-subscribe/master.svg?style=flat-square)](https://travis-ci.org/tappleby/redux-batched-subscribe)
[![npm version](https://img.shields.io/npm/v/redux-batched-subscribe.svg?style=flat-square)](https://www.npmjs.com/package/redux-batched-subscribe)

Store enhancer for [redux](https://github.com/rackt/redux) which allows batching of subscribe notifications that occur as a result of dispatches.

```js
npm install --save redux-batched-subscribe
```

## Usage

The `batchedSubscribe` store enhancer accepts a function which is called after every dispatch with a `notify` callback as a single argument. Calling the `notify` callback will trigger all the subscription handlers, this gives you the ability to use various techniques to delay subscription notifications such as: debouncing, React batched updates or requestAnimationFrame.

Since `batchedSubscribe` overloads the dispatch and subscribe handlers on the original redux store it is important that it gets applied before any other store enhancers or middleware that depend on these functions; The [compose](https://github.com/rackt/redux/blob/master/docs/api/compose.md) utility in redux can be used to handle this:

```js
import { createStore, applyMiddleware, compose } from 'redux';
import { batchedSubscribe } from 'redux-batched-subscribe';

const enhancer = compose(
  applyMiddleware(...middleware),
  batchedSubscribe((notify) => {
    notify();
  })
)

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
const store = createStore(reducer, initialState, enhancer);
```

*Note: since `compose` applies functions from right to left, `batchedSubscribe` should appear at the end of the chain.*

The store enhancer also exposes a `subscribeImmediate` method which allows for unbatched subscribe notifications.

## Examples

### Debounced subscribe handlers:

```js
import { createStore } from 'redux';
import { batchedSubscribe } from 'redux-batched-subscribe';
import debounce from 'lodash.debounce';

const batchDebounce = debounce(notify => notify());
const finalCreateStore = batchedSubscribe(batchDebounce)(createStore);
const store = finalCreateStore(reducer, intialState);
```

### React batched updates

```js
import { createStore } from 'redux';
import { batchedSubscribe } from 'redux-batched-subscribe';

// React <= 0.13
import { addons } from 'react/addons';
const batchedUpdates = addons.batchedUpdates;

// React 0.14
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom';

// Note: passing batchedSubscribe as the last argument to createStore requires redux@>=3.1.0
const store = createStore(reducer, intialState, batchedSubscribe(batchedUpdates));
```

## Thanks

Thanks to [Andrew Clark](https://github.com/acdlite) for the clean library structure.
