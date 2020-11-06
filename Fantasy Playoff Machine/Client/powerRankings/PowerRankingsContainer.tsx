import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, useHistory } from 'react-router';
import { getLeagueDetails } from '../actions/getLeagueDetails';
import * as queryString from 'query-string';
import { IState } from '../rootReducer';
import { ILeagueDetails, ILeagueMetadata } from '../models';
import { IPowerRankingTeam } from './models';
import leagueDetails from '../reducers/leagueDetails';
import PowerRankingsTable from './PowerRankingsTable';
import { getPowerRankingTeams } from './PowerRankingsHelper';

export interface IPowerRankingsStateProps {
	leagueDetails: { [id: string]: ILeagueDetails};
	loading: boolean;
    hasError: boolean;
	league: ILeagueMetadata;
	powerRankingTeams: IPowerRankingTeam[] | null;
}

export interface IPowerRankingsDispatchProps{
    getLeagueDetails(site: string, leagueId: string, userId: string, swid: string, s2: string): void
}

export interface IPowerRankingsUrlProps {
    site: string;
    leagueId: string;
    userId: string;
    swid: string;
    s2: string;
}

type IPowerRankingsOwnProps = RouteComponentProps<IPowerRankingsUrlProps>;

export type IPowerRankingsProps = IPowerRankingsStateProps
	& IPowerRankingsDispatchProps
	& IPowerRankingsOwnProps;

function mapStateToProps(state: IState, ownProps: IPowerRankingsOwnProps): IPowerRankingsStateProps {
	const {
		leagueDetails: {
			leagueDetails, loading, hasError
		}
	} = state;
	const params = queryString.parse(ownProps.location.search);

	const league = {
		site: params.site as string,
		leagueId: params.leagueId as string,
		userId: params.userId as string,
		swid: params.swid as string,
		s2: params.s2 as string,
		name: ''
	}

	const currentLeague = leagueDetails[league.site + league.leagueId];

	return {
		leagueDetails,
		loading,
        hasError,
		league,
		powerRankingTeams: currentLeague ? getPowerRankingTeams(currentLeague) : null 
	};
}

const mapDispatchToProps = {
   	getLeagueDetails
};

export function PowerRankingsContainer({
	leagueDetails, loading, hasError, getLeagueDetails, powerRankingTeams, league
}: IPowerRankingsProps) { 
	//const history = useHistory();
	// const listUrl = React.useMemo(() => pathname.substring(0, pathname.lastIndexOf('/')), [pathname]);
	// const initAreaId = React.useMemo(() => {
	// 	const query = queryString.parse(search);
	// 	const optionalAreaId = Number(query?.a);
	// 	return isNaN(optionalAreaId) ? null : optionalAreaId;
	// }, [search]);
	React.useEffect(() => {
		const currentLeague = leagueDetails[league.site + league.leagueId];
		if (currentLeague == null) {
			getLeagueDetails(league.site, league.leagueId, league.userId, league.swid, league.s2);
		}
	}, [leagueDetails]);

	// if (loading) {
	// 	return <LoadingView />;
	// } else if (hasError) {
	// 	return <ErrorView />;
	// }
	return <PowerRankingsTable Teams={powerRankingTeams} />;
}

export default connect<
    IPowerRankingsStateProps,
	IPowerRankingsDispatchProps,
	IPowerRankingsOwnProps,
	IState
>(mapStateToProps, mapDispatchToProps)(PowerRankingsContainer);
