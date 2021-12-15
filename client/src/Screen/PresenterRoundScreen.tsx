import React from 'react';
import { useObservable } from '../Lib/RxReact';
import { Round } from '../Model/Round';
import { QuestionViewerProps } from './QuestionViewer';

export type RoundScreenProps = {
    round: Round
};

function PresenterRoundScreen(
    QuestionViewer: React.FunctionComponent<QuestionViewerProps>,
    { round } : RoundScreenProps
) {
    const currentQuestion = useObservable(round.currentQuestion$);

    return (
        <div>
            { currentQuestion ?
                <QuestionViewer key={currentQuestion.i} question={currentQuestion} /> :
                <div>Waiting for host to start...</div>

            }
        </div>
    );
}

export default PresenterRoundScreen;
