import * as React from 'react';
import PowerRankingsRow from './PlayoffMachineRow';
import '../../Content/bootstrap.css'
import { ITeam } from '../models';

export interface IPlayoffMachineTableProps {
	Teams: ITeam[] | null;
}

export default function PlayoffMachineTable({
	Teams
}: IPlayoffMachineTableProps) {
	return (
		<div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Team Name</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Ties</th>
                    </tr>
                </thead>
                <tbody>
                    {Teams?.sort((a,b) => a.wins < b.wins? 1 : -1).map(t => <PowerRankingsRow key={t.teamName} team={t} />)}
                </tbody>
            </table>	
            *Note: Power rankings are determined by: (Points Scored x2)  + (Points Scored * Winning %) + (Points Scored * Winning % if played vs the median score of the week)		
		</div>
	);
}
