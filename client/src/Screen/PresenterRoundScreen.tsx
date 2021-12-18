import React from 'react';
import { useObservable } from '../Lib/RxReact';
import { Round } from '../Model/Round';
import { LeaderboardDisplayProps } from './PresenterRoundScreen/LeaderboardDisplay';
import { QuestionViewerProps } from './QuestionViewer';

export type RoundScreenProps = {
    round: Round
};

function PresenterRoundScreen(
    LeaderboardDisplay: React.FunctionComponent<LeaderboardDisplayProps>,
    QuestionViewer: React.FunctionComponent<QuestionViewerProps>,
    { round } : RoundScreenProps
) {
    const currentQuestion = useObservable(round.currentQuestion$);
    const leaderboard = useObservable(round.leaderboard$);

    return (
        <div>
            { currentQuestion ?
                <>
                    <QuestionViewer key={currentQuestion.i} question={currentQuestion} />
                    <LeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboard}></LeaderboardDisplay>
                </> :
                <div>Waiting for host to start...</div>

            }
        </div>
    );
}

export default PresenterRoundScreen;
