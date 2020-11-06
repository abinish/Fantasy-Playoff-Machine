import * as React from 'react';
import { IPowerRankingTeam } from './models';
import PowerRankingsRow from './PowerRankingsRow';
import '../../Content/bootstrap.css'

export interface IPowerRankingsTableProps {
	Teams: IPowerRankingTeam[] | null;
}

export default function PowerRankingsTable({
	Teams
}: IPowerRankingsTableProps) {
	return (
		<div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Team Name</th>
                        <th>Power Ranking Score</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Ties</th>
                    </tr>
                </thead>
                <tbody>
                    {Teams?.sort((a,b) => a.powerRankingsScore < b.powerRankingsScore? 1 : -1).map(t => <PowerRankingsRow key={t.teamName} team={t} />)}
                </tbody>
            </table>	
            *Note: Power rankings are determined by: (Points Scored x2)  + (Points Scored * Winning %) + (Points Scored * Winning % if played vs the median score of the week)		
		</div>
	);
}
