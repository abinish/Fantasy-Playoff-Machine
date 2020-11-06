import { Dispatch, AnyAction} from 'redux';
import { ILeagueMetadata } from '../models';
import { IAction } from './IAction';
import { IState } from '../rootReducer';
import * as LeagueApi from '../leagueApi';

export type GetLeaguesRequest = IAction<'GET_LEAGUES_REQUEST', void, void>;
export type GetLeaguesSuccess = IAction<'GET_LEAGUES_SUCCESS', { leagues: [ILeagueMetadata]}, void>;
export type GetLeaguesFailure = IAction<'GET_LEAGUES_FAILURE', void, void>;

export function getLeagues() {
	return async (dispatch: Dispatch<AnyAction>, getState: () => IState) => {
		dispatch(getLeaguesRequest());
		try {
			const leagues = await LeagueApi.getLeagues();
			dispatch(getLeaguesSucess(leagues));
		} catch {
			dispatch(getLeaguesFailure());
		}
	};
}

function getLeaguesRequest(): GetLeaguesRequest {
	return { type: 'GET_LEAGUES_REQUEST', payload: void 0 };
}

function getLeaguesSucess(leagues: [ILeagueMetadata]): GetLeaguesSuccess {
	return { type: 'GET_LEAGUES_SUCCESS', payload: { leagues } };
}

function getLeaguesFailure(): GetLeaguesFailure {
	return { type: 'GET_LEAGUES_FAILURE', payload: void 0 };
}
