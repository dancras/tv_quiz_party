import React from 'react';
import { CurrentQuestion } from './Round';
import { RoundScreenProps } from './PresenterRoundScreen';
import { CountdownProps } from './Countdown';
import { AnswerViewerProps } from './AnswerViewer';
import { CommandButtonProps } from './CommandButton';

function PlayerRoundScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    AnswerViewer: React.FunctionComponent<AnswerViewerProps>,
    Countdown: React.FunctionComponent<CountdownProps>,
    useCurrentQuestion: () => CurrentQuestion | null,
    useCanStartNextQuestion: () => boolean,
    { round } : RoundScreenProps
) {
    const currentQuestion = useCurrentQuestion();
    const canStartNextQuestion = useCanStartNextQuestion();

    function handleStartQuestionButton() {
        round.startNextQuestion();
    }

    function key(prefix: string): string {
        return prefix + currentQuestion?.i;
    }

    return (
        <div>
            { currentQuestion ?
                <>
                    <Countdown key={key('Countdown')} endsAt={currentQuestion.startTime}></Countdown>
                    <AnswerViewer key={key('AnswerViewer')} round={round} question={currentQuestion}></AnswerViewer>
                </>:
                <div>Waiting for host to start...</div>

            }
            { canStartNextQuestion ?
                <CommandButton onClick={handleStartQuestionButton}>Start Question</CommandButton> :
                <></>
            }
        </div>
    );
}

export default PlayerRoundScreen;
