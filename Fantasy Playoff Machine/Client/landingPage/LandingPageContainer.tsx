import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, useHistory } from 'react-router';
import { addLeague } from '../actions/addLeague';
import { getLeagues } from '../actions/getLeagues';
import { deleteLeague } from '../actions/deleteLeague';
import * as queryString from 'query-string';
import { IState } from '../rootReducer';
import { ILeagueMetadata } from '../models';
import LeagueList from './LeagueList';

export interface ILandingPageStateProps {
	leagues: ILeagueMetadata[]
	loading: boolean;
	hasError: boolean;
}

export interface ILandingPageDispatchProps{
    addLeague(site: string, leagueId: string, userId: string, swid: string, s2: string, name: string): void 
	getLeagues(): void
	deleteLeague(league: ILeagueMetadata): void
}

export interface ILandingPageUrlProps {
    userId: string;
    swid: string;
    s2: string;
}

type ILandingPageOwnProps = RouteComponentProps<ILandingPageUrlProps>;

export type ILandingPageProps = ILandingPageStateProps
	& ILandingPageDispatchProps
	& ILandingPageOwnProps;

function mapStateToProps(state: IState, ownProps: ILandingPageOwnProps): ILandingPageStateProps {
	const {
		leagues: {
			leagues, loading, hasError
		}
	} = state;
	return {
		leagues,
		loading,
		hasError
	};
}

const mapDispatchToProps = {
    addLeague,
	getLeagues,
	deleteLeague
};

export function LandingPageContainer({
	location: { pathname, search }, loading, hasError, addLeague, getLeagues, leagues
}: ILandingPageProps) {
	const history = useHistory();
	// const listUrl = React.useMemo(() => pathname.substring(0, pathname.lastIndexOf('/')), [pathname]);
	// const initAreaId = React.useMemo(() => {
	// 	const query = queryString.parse(search);
	// 	const optionalAreaId = Number(query?.a);
	// 	return isNaN(optionalAreaId) ? null : optionalAreaId;
	// }, [search]);
	React.useEffect(() => {
		if (leagues.length == 0) {
			getLeagues();
		}
	}, []);
	// if (loading) {
	// 	return <LoadingView />;
	// } else if (hasError) {
	// 	return <ErrorView />;
	// }
	return <LeagueList Leagues={leagues} onAddLeague={addLeague} onDeleteLeague={deleteLeague} />;
}

export default connect<
    ILandingPageStateProps,
	ILandingPageDispatchProps,
	ILandingPageOwnProps,
	IState
>(mapStateToProps, mapDispatchToProps)(LandingPageContainer);
