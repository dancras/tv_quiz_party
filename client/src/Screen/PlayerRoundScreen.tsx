import { useObservable } from '../Lib/RxReact';
import { CountdownProps } from '../Component/Countdown';
import { AnswerViewerProps } from './AnswerViewer';
import { CommandButtonProps } from '../Component/CommandButton';
import { QuestionTimingsHook } from '../Hook/QuestionTimingsHook';
import CurrentQuestion from '../Model/CurrentQuestion';
import Round from '../Model/Round';
import { Container, Grid } from 'semantic-ui-react';

export type PlayerRoundScreenProps = {
    round: Round
};

function PlayerRoundScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    AnswerViewer: React.FunctionComponent<AnswerViewerProps>,
    Countdown: React.FunctionComponent<CountdownProps>,
    useQuestionTimings: QuestionTimingsHook<CurrentQuestion | undefined>,
    { round } : PlayerRoundScreenProps
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
        <Container textAlign='center'>
            <Grid style={{ height: '100vh' }} verticalAlign='middle'>
                <Grid.Column>
                    { currentQuestion ?
                        <>
                            <Countdown key={key('Countdown')} endsAt={currentQuestion.timestampToStartVideo}></Countdown>
                            <AnswerViewer key={key('AnswerViewer')} question={currentQuestion}></AnswerViewer>
                        </>:
                        <p>Waiting for host to start...</p>

                    }
                    { canStartNextQuestion && (!timings || timings.hasEnded) ?
                        <CommandButton onClick={handleStartQuestionButton}>Start Question</CommandButton> :
                        <></>
                    }
                </Grid.Column>
            </Grid>
        </Container>
    );
}

export default PlayerRoundScreen;
