import { ILeagueDetails } from '../models';
import {
	GetLeagueDetailsRequest,
	GetLeagueDetailsSuccess,
	GetLeagueDetailsFailure
} from '../actions/getLeagueDetails';

export interface ILeagueDetailsState {
    leagueDetails: { [id: string]: ILeagueDetails };
    loading: boolean;
    hasError: boolean;
}

export const initialState: ILeagueDetailsState = {
    leagueDetails: {},
    loading: false,
    hasError: false
};

type HandledActions = GetLeagueDetailsRequest
	| GetLeagueDetailsSuccess
	| GetLeagueDetailsFailure;

export default function leagueDetails(state = initialState, action: HandledActions): ILeagueDetailsState {
	switch (action.type) {
		case 'GET_LEAGUE_DETAILS_REQUEST':
			return { ...state, loading: true };
		case 'GET_LEAGUE_DETAILS_SUCCESS': {
            const { League, key } = action.payload;
            const leagueDetails = {
                ...state.leagueDetails,
                [key]: League
            }

			return { ...state, leagueDetails, loading: false, hasError: false };
		}
		case 'GET_LEAGUE_DETAILS_FAILURE':
			return { ...state, loading: false, hasError: true };
		default:
			return state;
	}
}