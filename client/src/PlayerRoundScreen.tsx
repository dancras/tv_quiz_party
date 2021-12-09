import React from 'react';
import { CurrentQuestionMetadata, Question } from './Round';
import { RoundScreenProps } from './PresenterRoundScreen';
import { CountdownProps } from './Countdown';
import { AnswerViewerProps } from './AnswerViewer';

function PlayerRoundScreen(
    AnswerViewer: React.FunctionComponent<AnswerViewerProps>,
    Countdown: React.FunctionComponent<CountdownProps>,
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
                <>
                    <Countdown endsAt={currentQuestion.startTime}></Countdown>
                    <AnswerViewer round={round} question={currentQuestion}></AnswerViewer>
                </>:
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
