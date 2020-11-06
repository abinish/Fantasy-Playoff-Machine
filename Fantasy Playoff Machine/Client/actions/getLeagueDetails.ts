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
		const {  leagueDetails: { leagueDetails } } = getState();
		
		if(leagueDetails[site + leagueId] != null)
			return;
		dispatch(getLeagueDetailsRequest());
		try {
			const league = await LeagueApi.getLeagueDetails({ site, leagueId, userId, swid, s2 });
			dispatch(getLeagueDetailsSucess(league, site+leagueId));
		} catch {
			dispatch(getLeagueDetailsFailure());
		}
	};
}

function getLeagueDetailsRequest(): GetLeagueDetailsRequest {
	return { type: 'GET_LEAGUE_DETAILS_REQUEST', payload: void 0 };
}

function getLeagueDetailsSucess(League: ILeagueDetails, key: string): GetLeagueDetailsSuccess {
	return { type: 'GET_LEAGUE_DETAILS_SUCCESS', payload: { League, key } };
}

function getLeagueDetailsFailure(): GetLeagueDetailsFailure {
	return { type: 'GET_LEAGUE_DETAILS_FAILURE', payload: void 0 };
}
