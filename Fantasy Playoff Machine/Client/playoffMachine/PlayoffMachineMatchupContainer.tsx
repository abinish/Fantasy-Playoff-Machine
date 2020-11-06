import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, useHistory } from 'react-router';
import { getLeagueDetails } from '../actions/getLeagueDetails';
import * as queryString from 'query-string';
import { IState } from '../rootReducer';
import { ILeagueDetails, ILeagueMetadata } from '../models';
import leagueDetails from '../reducers/leagueDetails';
import PlayoffMachineTable from './PlayoffMachineTable';
import { getPowerRankingTeams } from '../selectors/getPowerRankingTeams';
import { IPowerRankingTeam } from '../powerRankings/models';

export interface IPlayoffMachineStateProps {
	leagueDetails: { [id: string]: ILeagueDetails};
	loading: boolean;
    hasError: boolean;
	league: ILeagueMetadata;
	powerRankingTeams: IPowerRankingTeam[] | null;
}

export interface IPlayoffMachineDispatchProps{
    getLeagueDetails(site: string, leagueId: string, userId: string, swid: string, s2: string): void
}

export interface IPlayoffMachineUrlProps {
    site: string;
    leagueId: string;
    userId: string;
    swid: string;
    s2: string;
}

type IPlayoffMachineOwnProps = RouteComponentProps<IPlayoffMachineUrlProps>;

export type IPlayoffMachineProps = IPlayoffMachineStateProps
	& IPlayoffMachineDispatchProps
	& IPlayoffMachineOwnProps;

function mapStateToProps(state: IState, ownProps: IPlayoffMachineOwnProps): IPlayoffMachineStateProps {
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
		powerRankingTeams: null 
	};
}

const mapDispatchToProps = {
   	getLeagueDetails
};

export function PlayoffMachineContainer({
	leagueDetails, loading, hasError, getLeagueDetails, powerRankingTeams, league
}: IPlayoffMachineProps) { 
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
	return <PlayoffMachineTable Teams={powerRankingTeams} />;
}

export default connect<
    IPlayoffMachineStateProps,
	IPlayoffMachineDispatchProps,
	IPlayoffMachineOwnProps,
	IState
>(mapStateToProps, mapDispatchToProps)(PlayoffMachineContainer);
