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
});
