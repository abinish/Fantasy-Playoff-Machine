import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Switch, Route, useHistory, Router, BrowserRouterProps } from 'react-router-dom';
import { PacmanLoader } from "react-spinners";
import { applyMiddleware, compose, createStore } from 'redux'
import leagueDetails, { ILeagueDetailsState } from './reducers/leagueDetails'
import ScrollToTop from './ScrollToTop';
import LandingPageContainer from './landingPage/LandingPageContainer';
import rootReducer from './rootReducer';
import { ILeaguesState } from './reducers/leagues';
import thunk from 'redux-thunk';
import PowerRankingsContainer from './powerRankings/PowerRankingsContainer';
import { RouterProps } from 'react-router';

// function handleClick(league: ILeagueMetadata) : void {
//     console.log('click happened')
// };

// const league: ILeagueMetadata = {
//     site: "espn",
//     id: "23007934",
//     swid: "",
//     s2: "",
//     userId: "",
//     name: "test"
// };

// ReactDOM.render(
//     <div>
//         <LeagueCard league={league} onDeleteLeague={handleClick}/>
//         <PacmanLoader loading={true} color={'#007bc4'}/>
//     </div>,
//     document.getElementById("root")
    
// );

// unsubscribe();
var initialState = {
	leagues: {
		leagues: [],
		loading: false,
		hasError: false
	} as ILeaguesState,
	leagueDetails: {
		leagueDetails: {},
   	 loading: false,
		hasError: false
	} as ILeagueDetailsState
}
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



const rootElement = document.getElementById('root');
if (rootElement == null) {
	throw new Error('could not find root element');
}



//const store = configureStore(initialState)

ReactDOM.render(
	<Provider {...{store}}>
		<BrowserRouter>
			<ScrollToTop>
				<Switch>
					<Route path='/Home/About/PowerRankings' component={PowerRankingsContainer} />
					<Route path='/' component={LandingPageContainer} />
				</Switch>
			</ScrollToTop>
		</BrowserRouter>
	</Provider>,
	document.getElementById('root')
);
