import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './rootReducer';

export default function configureStore(initialState?: any) {
	const middlewares = [thunk];

	let composeFn = compose;

	// if (process.env.NODE_ENV === 'development') {
	// 	// Integration with Redux DevTools Extension: http://extension.remotedev.io/
	// 	const reduxDevToolCompose = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
	// 	if (reduxDevToolCompose) {
	// 		composeFn = reduxDevToolCompose;
	// 	}
	// }

	const reduxDevToolCompose = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
	if (reduxDevToolCompose) {
		composeFn = reduxDevToolCompose;
	}

	const middleware = composeFn(applyMiddleware(...middlewares));

	const store = createStore(rootReducer, initialState, middleware);
	return store;
}
