import { ILeagueMetadata } from '../models';
import {
	GetLeaguesRequest,
	GetLeaguesSuccess,
	GetLeaguesFailure
} from '../actions/getLeagues';
import { AddLeagueFailure, AddLeagueRequest, AddLeagueSuccess } from '../actions/addLeague';

export interface ILeaguesState {
    leagues: ILeagueMetadata[];
    loading: boolean;
    hasError: boolean;
}

export const initialState: ILeaguesState = {
    leagues: [],
    loading: false,
    hasError: false
};

type HandledActions = GetLeaguesRequest
	| GetLeaguesSuccess
	| GetLeaguesFailure
	| AddLeagueRequest
	| AddLeagueSuccess
	| AddLeagueFailure;

export default function leagues(state = initialState, action: HandledActions): ILeaguesState {
	switch (action.type) {
		case 'GET_LEAGUES_REQUEST':
			return { ...state, loading: true };
		case 'GET_LEAGUES_SUCCESS': {
			const { leagues } = action.payload;
			
			return { ...state, leagues, loading: false, hasError: false };
		}
		case 'GET_LEAGUES_FAILURE':
			return { ...state, loading: false, hasError: true };
		case 'ADD_LEAGUE_REQUEST':
			return { ...state, loading: true };
		case 'ADD_LEAGUE_SUCCESS': {
            const { League, key } = action.payload;
            const leagues = {
                ...state.leagues,
                [key]: League
            }

			return { ...state, leagues, loading: false, hasError: false };
		}
		case 'ADD_LEAGUE_FAILURE':
			return { ...state, loading: false, hasError: true };
		default:
			return state;
	}
}