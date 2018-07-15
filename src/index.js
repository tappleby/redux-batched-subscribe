export function batchedSubscribe(batch, blacklist) {
  if (typeof batch !== 'function') {
    throw new Error('Expected batch to be a function.');
  }

  let currentListeners = [];
  let nextListeners = currentListeners;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    let isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  function notifyListeners() {
    const listeners = currentListeners = nextListeners;
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]();
    }
  }

  function notifyListenersBatched() {
    batch(notifyListeners);
  }

  return next => (...args) => {
    const store = next(...args);
    const subscribeImmediate = store.subscribe;

    function dispatch(...dispatchArgs) {
      const [ action ] = dispatchArgs;
      const { type } = action;
      const res = store.dispatch(...dispatchArgs);
      if (blacklist.include(type)) {
        notifyListeners();
      } else {
        notifyListenersBatched();
      }
      return res;
    }

    return {
      ...store,
      dispatch,
      subscribe,
      subscribeImmediate
    };
  };
}
