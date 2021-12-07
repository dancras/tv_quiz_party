import React from 'react';
import { QuestionViewerProps } from './QuestionViewer';
import { CurrentQuestionMetadata, Question, Round } from './Round';

export type RoundScreenProps = {
    round: Round
};

function PresenterRoundScreen(
    QuestionViewer: React.FunctionComponent<QuestionViewerProps>,
    useCurrentQuestion: () => CurrentQuestionMetadata & Question | null,
    { round } : RoundScreenProps
) {
    const currentQuestion = useCurrentQuestion();

    return (
        <div>
            { currentQuestion ?
                <QuestionViewer question={currentQuestion} /> :
                <div>Waiting for host to start...</div>

            }
        </div>
    );
}

export default PresenterRoundScreen;
