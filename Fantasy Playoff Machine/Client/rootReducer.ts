import { combineReducers } from 'redux';
import leagueDetails, { ILeagueDetailsState } from './reducers/leagueDetails';
import leagues, { ILeaguesState } from './reducers/leagues';

export interface IState {
    leagueDetails: ILeagueDetailsState;
    leagues: ILeaguesState
}

export default combineReducers({
    leagueDetails,
	leagues
});
