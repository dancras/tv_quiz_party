import { useObservable } from '../Lib/RxReact';
import { RoundScreenProps } from './PresenterRoundScreen';
import { CountdownProps } from '../Component/Countdown';
import { AnswerViewerProps } from './AnswerViewer';
import { CommandButtonProps } from '../Component/CommandButton';
import { QuestionTimingsHook } from '../Hook/QuestionTimingsHook';
import { CurrentQuestion } from '../Model/Round';

function PlayerRoundScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    AnswerViewer: React.FunctionComponent<AnswerViewerProps>,
    Countdown: React.FunctionComponent<CountdownProps>,
    useQuestionTimings: QuestionTimingsHook<CurrentQuestion | undefined>,
    { round } : RoundScreenProps
) {
    const currentQuestion = useObservable(round.currentQuestion$);
    const timings = useQuestionTimings((currentQuestion ? currentQuestion : undefined));
    const canStartNextQuestion = useObservable(round.canStartNextQuestion$);

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
            { canStartNextQuestion && (!timings || timings.hasEnded) ?
                <CommandButton onClick={handleStartQuestionButton}>Start Question</CommandButton> :
                <></>
            }
        </div>
    );
}

export default PlayerRoundScreen;
