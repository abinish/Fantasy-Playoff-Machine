import * as React from 'react';
import { ILeagueMetadata } from '../models';
import Link from './Link';
import { LinkType } from './models'

export interface ILeagueCardProps {
    league: ILeagueMetadata;
    onDeleteLeague(league: ILeagueMetadata): void;
}

export default function LeagueCard( {league, onDeleteLeague}: ILeagueCardProps) {
    return (
        <div>
			<h2>{league.name}<i className="fa fa-trash" aria-hidden="true" onClick={() => onDeleteLeague(league)}></i></h2>
			<div>
                <Link league={league} type={LinkType.PowerRankings}/>
				<br />
				<Link league={league} type={LinkType.PlayoffMachine}/>
				<br />
				<Link league={league} type={LinkType.PlayoffOdds}/>
				<br />
				<Link league={league} type={LinkType.Scheduler}/>
				<br />
			</div>
			<br />
		</div>
    )
}