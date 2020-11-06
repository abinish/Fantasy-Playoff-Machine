import { Dispatch, AnyAction} from 'redux';
import { ILeagueMetadata } from '../models';
import { IAction } from './IAction';
import { IState } from '../rootReducer';
import * as LeagueApi from '../leagueApi';

export type AddLeagueRequest = IAction<'ADD_LEAGUE_REQUEST', void, void>;
export type AddLeagueSuccess = IAction<'ADD_LEAGUE_SUCCESS', { League: ILeagueMetadata, key: string }, void>;
export type AddLeagueFailure = IAction<'ADD_LEAGUE_FAILURE', void, void>;

export function addLeague(site: string, leagueId: string, userId: string, swid: string, s2: string, name: string) {
	return async (dispatch: Dispatch<AnyAction>, getState: () => IState) => {
		dispatch(addLeagueRequest());
		try {
            const success = await LeagueApi.verifyLeagueExists({ site, leagueId, userId, swid, s2 });
            const league: ILeagueMetadata = {
                site: site,
                leagueId: leagueId,
                swid: swid,
                s2: s2,
                userId: userId,
                name: name
            };
            if(success) {
                dispatch(addLeagueSucess(league, site+leagueId));
            } else {
                dispatch(addLeagueFailure())
            }
		} catch {
			dispatch(addLeagueFailure());
		}
	};
}

function addLeagueRequest(): AddLeagueRequest {
	return { type: 'ADD_LEAGUE_REQUEST', payload: void 0 };
}

function addLeagueSucess(League: ILeagueMetadata, key: string): AddLeagueSuccess {
	return { type: 'ADD_LEAGUE_SUCCESS', payload: { League, key } };
}

function addLeagueFailure(): AddLeagueFailure {
	return { type: 'ADD_LEAGUE_FAILURE', payload: void 0 };
}
