export function batchedSubscribe(batch) {
  if (typeof batch !== 'function') {
    throw new Error('Expected batch to be a function.');
  }

  const listeners = [];

  function subscribe(listener) {
    listeners.push(listener);

    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  function notifyListenersBatched(...dispatchArgs) {
    batch(() => listeners.slice().forEach(listener => listener()), ...dispatchArgs);
  }

  return next => (...args) => {
    const store = next(...args);
    const subscribeImmediate = store.subscribe;

    function dispatch(...dispatchArgs) {
      const res = store.dispatch(...dispatchArgs);
      notifyListenersBatched(...dispatchArgs);
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
