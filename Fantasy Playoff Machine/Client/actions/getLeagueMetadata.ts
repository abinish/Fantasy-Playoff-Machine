import { Dispatch, AnyAction} from 'redux';
import { ILeagueMetadata } from '../models';
import { IAction } from './IAction';
import { IState } from '../rootReducer';
import * as LeagueApi from '../leagueApi';

export type GetLeagueMetadataRequest = IAction<'GET_LEAGUE_METADATA_REQUEST', void, void>;
export type GetLeagueMetadataSuccess = IAction<'GET_LEAGUE_METADATA_SUCCESS', { leagueMetadata: ILeagueMetadata, key: string }, void>;
export type GetLeagueMetadataFailure = IAction<'GET_LEAGUE_METADATA_FAILURE', void, void>;

export function getLeagueMetadata(site: string, leagueId: string, userId: string, swid: string, s2: string) {
	return async (dispatch: Dispatch<AnyAction>, getState: () => IState) => {
		dispatch(getLeagueRequest());
		try {
			const league = await LeagueApi.getLeagueDetails({ site, leagueId, userId, swid, s2 });
			//dispatch(getLeagueSucess(league, site+leagueId));
		} catch {
			dispatch(getLeagueFailure());
		}
	};
}

function getLeagueRequest(): GetLeagueMetadataRequest {
	return { type: 'GET_LEAGUE_METADATA_REQUEST', payload: void 0 };
}

function getLeagueSucess(leagueMetadata: ILeagueMetadata, key: string): GetLeagueMetadataSuccess {
	return { type: 'GET_LEAGUE_METADATA_SUCCESS', payload: { leagueMetadata, key } };
}

function getLeagueFailure(): GetLeagueMetadataFailure {
	return { type: 'GET_LEAGUE_METADATA_FAILURE', payload: void 0 };
}
