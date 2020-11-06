import { Dispatch, AnyAction} from 'redux';
import { ILeagueMetadata } from '../models';
import { IAction } from './IAction';
import { IState } from '../rootReducer';

export type DeleteLeagueRequest = IAction<'DELETE_LEAGUE_REQUEST', void, void>;
export type DeleteLeagueSuccess = IAction<'DELETE_LEAGUE_SUCCESS', { League: ILeagueMetadata }, void>;
export type DeleteLeagueFailure = IAction<'DELETE_LEAGUE_FAILURE', void, void>;

export function deleteLeague(league: ILeagueMetadata) {
	return async (dispatch: Dispatch<AnyAction>, getState: () => IState) => {
        deleteLeagueSucess(league);
	};
}

function deleteLeagueRequest(): DeleteLeagueRequest {
	return { type: 'DELETE_LEAGUE_REQUEST', payload: void 0 };
}

function deleteLeagueSucess(League: ILeagueMetadata): DeleteLeagueSuccess {
	return { type: 'DELETE_LEAGUE_SUCCESS', payload: { League } };
}

function deleteLeagueFailure(): DeleteLeagueFailure {
	return { type: 'DELETE_LEAGUE_FAILURE', payload: void 0 };
}
