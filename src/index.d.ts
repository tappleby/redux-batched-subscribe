import {GenericStoreEnhancer} from 'redux';

declare function batchedSubscribe(batch:(notify: () => void) => void): GenericStoreEnhancer;
