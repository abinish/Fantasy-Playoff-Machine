import { Dispatch, AnyAction} from 'redux';
import { ILeagueDetails } from '../models';
import { IAction } from './IAction';
import { IState } from '../rootReducer';
import * as LeagueApi from '../leagueApi';

export type GetLeagueDetailsRequest = IAction<'GET_LEAGUE_DETAILS_REQUEST', void, void>;
export type GetLeagueDetailsSuccess = IAction<'GET_LEAGUE_DETAILS_SUCCESS', { League: ILeagueDetails, key: string }, void>;
export type GetLeagueDetailsFailure = IAction<'GET_LEAGUE_DETAILS_FAILURE', void, void>;

export function getLeagueDetails(site: string, leagueId: string, userId: string, swid: string, s2: string) {
	return async (dispatch: Dispatch<AnyAction>, getState: () => IState) => {
		console.log('here')
		dispatch(getLeagueRequest());
		try {
			const league = await LeagueApi.getLeagueDetails({ site, leagueId, userId, swid, s2 });
			dispatch(getLeagueSucess(league, site+leagueId));
		} catch {
			dispatch(getLeagueFailure());
		}
	};
}

function getLeagueRequest(): GetLeagueDetailsRequest {
	return { type: 'GET_LEAGUE_DETAILS_REQUEST', payload: void 0 };
}

function getLeagueSucess(League: ILeagueDetails, key: string): GetLeagueDetailsSuccess {
	return { type: 'GET_LEAGUE_DETAILS_SUCCESS', payload: { League, key } };
}

function getLeagueFailure(): GetLeagueDetailsFailure {
	return { type: 'GET_LEAGUE_DETAILS_FAILURE', payload: void 0 };
}
