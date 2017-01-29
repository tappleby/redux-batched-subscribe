import { batchedSubscribe } from '../';
import expect from 'expect';

function createStoreShape() {
  return {
    dispatch: expect.createSpy(),
    subscribe: expect.createSpy()
  };
}

function createBatchedStore(batch = (cb) => cb()) {
  const baseStore = createStoreShape();
  const createStore = () => baseStore;
  const batchedStore = batchedSubscribe(batch)(createStore)();
  batchedStore.base = baseStore;

  return batchedStore;
}

describe('batchedSubscribe()', () => {
  it('it calls batch function on dispatch', () => {
    const batchSpy = expect.createSpy();
    const store = createBatchedStore(batchSpy);

    store.dispatch({ type: 'foo' });

    expect(batchSpy.calls.length).toEqual(1);
  });

  it('batch callback executes listeners', () => {
    const subscribeCallbackSpy = expect.createSpy();
    const store = createBatchedStore();

    store.subscribe(subscribeCallbackSpy);
    store.dispatch({ type: 'foo' });

    expect(store.base.subscribe.calls.length).toEqual(0);
    expect(subscribeCallbackSpy.calls.length).toEqual(1);
  });

  it('should execute listeners once per batch', () => {
    let execute;
    const subscribeCallbackSpy = expect.createSpy();
    const interactions = new Promise((resolve) => execute = resolve);
    const store = createBatchedStore((cb) => interactions.then(cb));
    store.subscribe(subscribeCallbackSpy);

    store.dispatch({ type: 'foo' });
    store.dispatch({ type: 'bar' });
    expect(subscribeCallbackSpy.calls.length).toEqual(0);

    execute();
    return interactions
      .then(() => expect(subscribeCallbackSpy.calls.length).toEqual(1));
  });

  it('should execute listeners again on nested dispatch', () => {
    let execute;
    const listener1 = expect.createSpy();
    const listener2 = expect.createSpy();
    const interactions = new Promise((resolve) => execute = resolve);
    const store = createBatchedStore((cb) => interactions.then(cb));
    const unsubscribe1 = store.subscribe(() => {
      listener1();
      unsubscribe1();
      store.dispatch({ type: 'baz' });
    });
    store.subscribe(listener2);

    store.dispatch({ type: 'foo' });
    store.dispatch({ type: 'bar' });
    expect(listener1.calls.length).toEqual(0);
    expect(listener2.calls.length).toEqual(0);

    execute();
    return interactions
      .then(() => {
        expect(listener1.calls.length).toEqual(1);
        expect(listener2.calls.length).toEqual(2);
      });
  });

  it('it exposes base subscribe as subscribeImmediate', () => {
    const store = createBatchedStore();
    store.subscribeImmediate();

    expect(store.base.subscribe.calls.length).toEqual(1);
  });

  it('unsubscribes batch callbacks', () => {
    const subscribeCallbackSpy = expect.createSpy();
    const store = createBatchedStore();
    const unsubscribe = store.subscribe(subscribeCallbackSpy);

    unsubscribe();

    store.dispatch({ type: 'foo' });

    expect(subscribeCallbackSpy.calls.length).toEqual(0);
  });

  it('should support removing a subscription within a subscription', () => {
    const store = createBatchedStore();

    const listenerA = expect.createSpy();
    const listenerB = expect.createSpy();
    const listenerC = expect.createSpy();

    store.subscribe(listenerA);
    const unSubB = store.subscribe(() => {
      listenerB();
      unSubB();
    });
    store.subscribe(listenerC);

    store.dispatch({});
    store.dispatch({});

    expect(listenerA.calls.length).toEqual(2);
    expect(listenerB.calls.length).toEqual(1);
    expect(listenerC.calls.length).toEqual(2);
  });

  it('only removes listener once when unsubscribe is called', () => {
    const store = createBatchedStore();
    const listenerA = expect.createSpy(() => {});
    const listenerB = expect.createSpy(() => {});

    const unsubscribeA = store.subscribe(listenerA);
    store.subscribe(listenerB);

    unsubscribeA();
    unsubscribeA();

    store.dispatch({ type: 'foo' });
    expect(listenerA.calls.length).toBe(0);
    expect(listenerB.calls.length).toBe(1);
  });

  it('delays unsubscribe until the end of current dispatch', () => {
    const store = createBatchedStore();

    const unsubscribeHandles = [];
    const doUnsubscribeAll = () => unsubscribeHandles.forEach(
      unsubscribe => unsubscribe()
    );

    const listener1 = expect.createSpy(() => {});
    const listener2 = expect.createSpy(() => {});
    const listener3 = expect.createSpy(() => {});

    unsubscribeHandles.push(store.subscribe(() => listener1()));
    unsubscribeHandles.push(store.subscribe(() => {
      listener2();
      doUnsubscribeAll();
    }));

    unsubscribeHandles.push(store.subscribe(() => listener3()));

    store.dispatch({ type: 'foo' });
    expect(listener1.calls.length).toBe(1);
    expect(listener2.calls.length).toBe(1);
    expect(listener3.calls.length).toBe(1);

    store.dispatch({ type: 'foo' });
    expect(listener1.calls.length).toBe(1);
    expect(listener2.calls.length).toBe(1);
    expect(listener3.calls.length).toBe(1);
  });

  it('delays subscribe until the end of current dispatch', () => {
    const store = createBatchedStore();

    const listener1 = expect.createSpy(() => {});
    const listener2 = expect.createSpy(() => {});
    const listener3 = expect.createSpy(() => {});

    let listener3Added = false;
    const maybeAddThirdListener = () => {
      if (!listener3Added) {
        listener3Added = true;
        store.subscribe(() => listener3());
      }
    };

    store.subscribe(() => listener1());
    store.subscribe(() => {
      listener2();
      maybeAddThirdListener();
    });

    store.dispatch({ type: 'foo' });
    expect(listener1.calls.length).toBe(1);
    expect(listener2.calls.length).toBe(1);
    expect(listener3.calls.length).toBe(0);

    store.dispatch({ type: 'foo' });
    expect(listener1.calls.length).toBe(2);
    expect(listener2.calls.length).toBe(2);
    expect(listener3.calls.length).toBe(1);
  });

  it('uses the last snapshot of subscribers during nested dispatch', () => {
    const store = createBatchedStore();

    const listener1 = expect.createSpy(() => {});
    const listener2 = expect.createSpy(() => {});
    const listener3 = expect.createSpy(() => {});
    const listener4 = expect.createSpy(() => {});

    let unsubscribe4;
    const unsubscribe1 = store.subscribe(() => {
      listener1();
      expect(listener1.calls.length).toBe(1);
      expect(listener2.calls.length).toBe(0);
      expect(listener3.calls.length).toBe(0);
      expect(listener4.calls.length).toBe(0);

      unsubscribe1();
      unsubscribe4 = store.subscribe(listener4);
      store.dispatch({ type: 'foo' });

      expect(listener1.calls.length).toBe(1);
      expect(listener2.calls.length).toBe(1);
      expect(listener3.calls.length).toBe(1);
      expect(listener4.calls.length).toBe(1);
    });

    store.subscribe(listener2);
    store.subscribe(listener3);

    store.dispatch({ type: 'foo' });
    expect(listener1.calls.length).toBe(1);
    expect(listener2.calls.length).toBe(2);
    expect(listener3.calls.length).toBe(2);
    expect(listener4.calls.length).toBe(1);

    unsubscribe4();
    store.dispatch({ type: 'foo' });
    expect(listener1.calls.length).toBe(1);
    expect(listener2.calls.length).toBe(3);
    expect(listener3.calls.length).toBe(3);
    expect(listener4.calls.length).toBe(1);
  });

  it('should throw for invalid batch callback', () => {
    expect(() => {
      batchedSubscribe(null);
    }).toThrow(Error);

    expect(() => {
      batchedSubscribe(undefined);
    }).toThrow(Error);

    expect(() => {
      batchedSubscribe('foo');
    }).toThrow(Error);
  });

  it('throws if listener is not a function', () => {
    const store = createBatchedStore();

    expect(() =>
      store.subscribe()
    ).toThrow();

    expect(() =>
      store.subscribe('')
    ).toThrow();

    expect(() =>
      store.subscribe(null)
    ).toThrow();

    expect(() =>
      store.subscribe(undefined)
    ).toThrow();
  });
});
