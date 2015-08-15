import { batchedSubscribe } from '../';
import { spy } from 'sinon';

function createStoreShape() {
  return {
    dispatch: spy(),
    subscribe: spy()
  };
}

describe('batchedSubscribe()', () => {
  it('it calls batch function on dispatch', () => {
    const batchSpy = spy();
    const baseStore = createStoreShape();
    const createStore = () => baseStore;
    const store = batchedSubscribe(batchSpy)(createStore)();

    store.dispatch({ type: 'foo' });

    expect(batchSpy.callCount).to.equal(1);
  });

  it('batch callback executes listeners', () => {
    const subscribeCallbackSpy = spy();
    const baseStore = createStoreShape();
    const createStore = () => baseStore;
    const store = batchedSubscribe((cb) => cb())(createStore)();

    store.subscribe(subscribeCallbackSpy);
    store.dispatch({ type: 'foo' });

    expect(baseStore.subscribe.callCount).to.equal(0);
    expect(subscribeCallbackSpy.callCount).to.equal(1);
  });

  it('it exposes base subscribe as subscribeImmediate', () => {
    const baseStore = createStoreShape();
    const createStore = () => baseStore;
    const store = batchedSubscribe((cb) => cb())(createStore)();

    store.subscribeImmediate();

    expect(baseStore.subscribe.callCount).to.equal(1);
  });

  it('unsubscribes batch callbacks', () => {
    const subscribeCallbackSpy = spy();
    const baseStore = createStoreShape();
    const createStore = () => baseStore;
    const store = batchedSubscribe((cb) => cb())(createStore)();
    const unsubscribe = store.subscribe(subscribeCallbackSpy);

    unsubscribe();

    store.dispatch({ type: 'foo' });

    expect(subscribeCallbackSpy.callCount).to.equal(0);
  });

  it('should support removing a subscription within a subscription', () => {
    const baseStore = createStoreShape();
    const createStore = () => baseStore;
    const store = batchedSubscribe((cb) => cb())(createStore)();

    const listenerA = spy();
    const listenerB = spy();
    const listenerC = spy();

    store.subscribe(listenerA);
    const unSubB = store.subscribe(() => {
      listenerB();
      unSubB();
    });
    store.subscribe(listenerC);

    store.dispatch({});
    store.dispatch({});

    expect(listenerA.callCount).to.equal(2);
    expect(listenerB.callCount).to.equal(1);
    expect(listenerC.callCount).to.equal(2);

  });
});
