import { ILeagueMetadata } from '../models';
import {
	GetLeagueMetadataRequest,
	GetLeagueMetadataSuccess,
	GetLeagueMetadataFailure
} from '../actions/getLeagueMetadata';

export interface ILeagueMetadataState {
    leagues: { [id: string]: ILeagueMetadata };
    loading: boolean;
    hasError: boolean;
}

export const initialState: ILeagueMetadataState = {
    leagues: {},
    loading: false,
    hasError: false
};

type HandledActions = GetLeagueMetadataRequest
	| GetLeagueMetadataSuccess
	| GetLeagueMetadataFailure;

export default function leagueMetadata(state = initialState, action: HandledActions): ILeagueMetadataState {
	switch (action.type) {
		case 'GET_LEAGUE_METADATA_REQUEST':
			return { ...state, loading: true };
		case 'GET_LEAGUE_METADATA_SUCCESS': {
            const { leagueMetadata, key } = action.payload;
            const leagues = {
                ...state.leagues,
                [key]: leagueMetadata
            }

			return { ...state, leagues, loading: false, hasError: false };
		}
		case 'GET_LEAGUE_METADATA_FAILURE':
			return { ...state, loading: false, hasError: true };
		default:
			return state;
	}
}