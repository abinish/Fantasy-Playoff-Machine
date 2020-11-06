import * as React from 'react';
import { ILeagueMetadata } from '../models';
import LeagueCard from './LeagueCard';

export interface ILeagueListProps {
	Leagues: ILeagueMetadata[];
	onAddLeague(site: string, leagueId: string, userId: string, swid: string, s2: string, name: string): void;
	onDeleteLeague(league: ILeagueMetadata): void;
}

export default function LeagueList({
	Leagues, onAddLeague, onDeleteLeague
}: ILeagueListProps) {
	return (
		<div>
			<div>
				{Leagues?.map(t => <LeagueCard
                    league={t}
                    onDeleteLeague={onDeleteLeague} />)}
			</div>
            {/* <div
                data-testid='toggle-other-Leagues'
                className={cx(styles.showMoreLink, {[styles.expanded]: showNotMatching})}
                onClick={() => setShowNotMatching(p => !p)}>
                {showNotMatching ? 'Hide other Leagues' : 'Show other Leagues'}
                <Icon type='navigation-next' />
            </div> */}
			
		</div>
	);
}
