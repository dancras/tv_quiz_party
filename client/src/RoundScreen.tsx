import React from 'react';
import { QuestionViewerProps } from './QuestionViewer';
import { CurrentQuestionMetadata, Question, Round } from './Round';

export type RoundScreenProps = {
    round: Round
};

function RoundScreen(
    QuestionViewer: React.FunctionComponent<QuestionViewerProps>,
    useCurrentQuestion: () => CurrentQuestionMetadata & Question | null,
    useCanStartNextQuestion: () => boolean,
    { round } : RoundScreenProps
) {
    const [disable, setDisable] = React.useState(false);

    const currentQuestion = useCurrentQuestion();
    const canStartNextQuestion = useCanStartNextQuestion();

    function handleStartQuestionButton() {
        round.startNextQuestion();
        setDisable(true);
    }

    return (
        <div>
            { currentQuestion ?
                <QuestionViewer question={currentQuestion} /> :
                <div>Waiting for host to start...</div>

            }
            { canStartNextQuestion ?
                <button disabled={disable} onClick={handleStartQuestionButton}>Start Question</button> :
                <></>
            }
        </div>
    );
}

export default RoundScreen;
