import React from 'react';
import { useObservable } from '../Lib/RxReact';
import Lobby from '../Model/Lobby';
import { Round } from '../Model/Round';
import { LeaderboardDisplayProps } from './PresenterRoundScreen/LeaderboardDisplay';
import { QuestionViewerProps } from './QuestionViewer';

export type PresenterRoundScreenProps = {
    lobby: Lobby,
    round: Round
};

function PresenterRoundScreen(
    LeaderboardDisplay: React.FunctionComponent<LeaderboardDisplayProps>,
    QuestionViewer: React.FunctionComponent<QuestionViewerProps>,
    { lobby, round } : PresenterRoundScreenProps
) {
    const currentQuestion = useObservable(round.currentQuestion$);
    const leaderboard = useObservable(round.leaderboard$);
    const users = useObservable(lobby.users$);

    return (
        <div>
            { currentQuestion ?
                <>
                    <QuestionViewer key={currentQuestion.i} question={currentQuestion} />
                    <LeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboard} users={users}></LeaderboardDisplay>
                </> :
                <div>Waiting for host to start...</div>

            }
        </div>
    );
}

export default PresenterRoundScreen;
