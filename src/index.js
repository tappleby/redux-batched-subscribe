export function batchedSubscribe(batch) {
  if (typeof batch !== 'function') {
    throw new Error('Expected batch to be a function.');
  }

  return next => (...args) => {
    const store = next(...args);
    const subscribeImmediate = store.subscribe;
    let subscriptions = [];

    function subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new Error('Expected listener to be a function.');
      }

      const subscription = {
        cb: listener, trigger: false, unsubscribe: false, ready: false
      };

      const unsubscribeImmediate = subscribeImmediate(() => {
        subscription.trigger = true;
      });

      subscriptions.push(subscription);

      return function unsubscribe() {
        unsubscribeImmediate();
        subscription.unsubscribe = true;
      };
    }

    function notifyListeners() {
      let cleanupSubscriptions = false;

      for (const subscription of subscriptions) {
        if (subscription.ready && subscription.trigger) {
          subscription.cb();
          subscription.trigger = false;
        }

        if (subscription.unsubscribe) {
          cleanupSubscriptions = true;
        }
      }

      if (cleanupSubscriptions) {
        subscriptions = subscriptions.filter((subscription) => !subscription.unsubscribe);
      }
    }

    function notifyListenersBatched() {
      batch(notifyListeners);
    }

    function dispatch(...dispatchArgs) {
      for (const subscription of subscriptions) {
        subscription.ready = subscription.unsubscribe === false;
      }

      const res = store.dispatch(...dispatchArgs);
      notifyListenersBatched();
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
