import { batchedSubscribe } from '../';
import expect, { createSpy } from 'expect';

function createStoreShape() {
  return {
    dispatch: createSpy(),
    subscribe: createSpy()
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
    const batchSpy = createSpy();
    const store = createBatchedStore(batchSpy);

    store.dispatch({ type: 'foo' });

    expect(batchSpy.calls.length).toEqual(1);
  });

  it('batch callback executes listeners', () => {
    const subscribeCallbackSpy = createSpy();
    const store = createBatchedStore();

    store.subscribe(subscribeCallbackSpy);
    store.dispatch({ type: 'foo' });

    expect(store.base.subscribe.calls.length).toEqual(0);
    expect(subscribeCallbackSpy.calls.length).toEqual(1);
  });

  it('it exposes base subscribe as subscribeImmediate', () => {
    const store = createBatchedStore();
    store.subscribeImmediate();

    expect(store.base.subscribe.calls.length).toEqual(1);
  });

  it('unsubscribes batch callbacks', () => {
    const subscribeCallbackSpy = createSpy();
    const store = createBatchedStore();
    const unsubscribe = store.subscribe(subscribeCallbackSpy);

    unsubscribe();

    store.dispatch({ type: 'foo' });

    expect(subscribeCallbackSpy.calls.length).toEqual(0);
  });

  it('should support removing a subscription within a subscription', () => {
    const store = createBatchedStore();

    const listenerA = createSpy();
    const listenerB = createSpy();
    const listenerC = createSpy();

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
});
