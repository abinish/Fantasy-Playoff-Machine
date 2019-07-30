import 'font-awesome/css/font-awesome.css';
import 'font-awesome-animation/dist/font-awesome-animation.css';
import { render } from 'react-dom';
// ReSharper disable once UnusedLocalImport -- React is implicitly used whenever you use JSX syntax.
import * as React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import TopLevelBoundary from '~/common/components/error-boundaries/TopLevelBoundary';
import { location } from '~/common/helpers/utils';

registerGlobalErrorHandler();

/**
 * Creates a component that lazy-loads a module.
 * We do this so that we can host all of our react code under one entry point
 * and don't have to worry about creating a new bundle for each page.
 * Webpack recognizes dynamic imports and automatically splits those
 * modules into separate bundle files, which will be loaded on-demand.
 * 
 * Example:
 * ```
 * const MyComponent = createLazyComponent(async () => (await import('~/module')).default);
 * <MyComponent {...props} />
 * ```
 * 
 * NOTE:
 * There are two requirements for a module to be properly lazily loaded:
 * 1. The import() call has the module name explicitly specified, i.e. the module name can't come from a variable
 *    such as: `const lazyLoad = (module) => import(module)`. Webpack will not recognize this.
 * 2. The import() call must be deferred by placing it in a function that will only be called when
 *    the module is required. The `loader` function below is only called in `componentDidMount()`.
 * Additionally, webpack allows you to specify an annotation to set the name of the bundle file:
 * `await import(/* webpackChunkName: "myBundleName" *\/ "myModule");`
 */
function createLazyComponent<P>(loader: () => Promise<React.ComponentType<P>>): React.ComponentClass<P> {
	return class extends React.Component<P, { component?: React.ComponentType<P> }> {
		constructor(props: P) {
			super(props);
			this.state = {};
		}

		async componentDidMount() {
			this.setState({ component: await loader() });
		}

		render() {
			const Component = this.state.component as React.ComponentType;
			return Component ? <Component {...this.props} /> : null;
		}
	};
}

const PlayoffMachine = createLazyComponent(async () =>
	(await import(/* webpackChunkName: "manageCompanyProfile" */ '~/playoffMachine/components/App')).default);
const PlayoffOdds = createLazyComponent(async () =>
	(await import(/* webpackChunkName: "manageServiceAreas" */ '~/playoffOdds/components/App')).default);
const PowerRankings = createLazyComponent(async () =>
	(await import(/* webpackChunkName: "contacts" */ '~/powerRankings/components/App')).default);

render(
	<TopLevelBoundary>
		<BrowserRouter basename="/">
			<Switch>
				<Route path="/PlayoffMachine" component={PlayoffMachine} />
				<Route path="/PlayoffOdds" component={PlayoffOdds} />
				<Route path="/PowerRankings" component={PowerRankings} />
				<Route render={() => location().setHref('/')} />
			</Switch>
		</BrowserRouter>
	</TopLevelBoundary>,
	document.getElementById('root')
);
