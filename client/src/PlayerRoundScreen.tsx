import React from 'react';
import { CurrentQuestionMetadata, Question } from './Round';
import { RoundScreenProps } from './PresenterRoundScreen';

function PlayerRoundScreen(
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
                <></> :
                <div>Waiting for host to start...</div>

            }
            { canStartNextQuestion ?
                <button disabled={disable} onClick={handleStartQuestionButton}>Start Question</button> :
                <></>
            }
        </div>
    );
}

export default PlayerRoundScreen;