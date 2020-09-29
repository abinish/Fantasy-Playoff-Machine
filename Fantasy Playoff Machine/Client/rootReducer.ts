import { combineReducers } from 'redux';
import leagueDetails, { ILeagueDetailsState } from './reducers/leagueDetails';
import leagues, { ILeagueMetadataState } from './reducers/leagueMetadata';

export interface IState {
    leagueDetails: ILeagueDetailsState;
    leagues: ILeagueMetadataState
}

export default combineReducers({
    leagueDetails,
	leagues
});
