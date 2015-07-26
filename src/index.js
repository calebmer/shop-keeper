import Api from './api';
export default Api;
export {default as Router} from './router';
export {default as Database} from './database';
export {default as Access} from './access';
export {default as Collection} from './collection';
export * from './api';
export * from './router';
export * from './database';
export * from './access';
export * from './collection';
export * from './endpoint';

// For people not using ES next
export let database = Api.database;
export {default as Api} from './api';
