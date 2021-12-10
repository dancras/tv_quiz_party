import React, { useEffect } from 'react';
import { CommandButtonProps } from './CommandButton';
import { Animator } from './lib/Animator';
import { Timer } from './lib/Timer';
import Round, { CurrentQuestion } from './Round';

export type AnswerViewerProps = {
    question: CurrentQuestion,
    round: Round
}

function calculateNow(question: CurrentQuestion, timer: Timer): number {
    return question.questionStartTime + ((timer.now() - question.startTime) / 1000);
}

function AnswerViewer(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    animator: Animator,
    timer: Timer,
    { question, round }: AnswerViewerProps
) {
    const [disable, setDisable] = React.useState(false);
    const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
    const [now, setNow] = React.useState(calculateNow(question, timer));

    const animateRef = React.useRef<number | null>(null);

    function animate() {
        const now = calculateNow(question, timer);
        setNow(now);

        if (now >= question.answerLockTime) {
            setDisable(true);
            question.hasEnded$.subscribe(hasEnded => hasEnded ? void(0) : round.endQuestion()).unsubscribe();
        }
    };

    function handleAnswerButton(event: React.MouseEvent<HTMLButtonElement>) {
        const answer = event.currentTarget.getAttribute('data-answer');
        if (answer) {
            round.answerQuestion(answer);
            setSelectedAnswer(answer);
        } else {
            console.error('Missing data-answer attribute on answer');
        }
    }

    function getButtonClasses(answer: string) {
        const classes = [];

        if (selectedAnswer === answer) {
            classes.push('selected');
        }

        if (now >= question.answerRevealTime) {
            classes.push(answer === question.correctAnswer ? 'correct-answer' : 'incorrect-answer');
        }

        return classes.join(' ');
    }

    function getContainerClasses() {
        const classes = [];

        if (selectedAnswer) {
            classes.push('has-selected');
        }

        if (now >= question.answerRevealTime) {
            classes.push(selectedAnswer === question.correctAnswer ? 'correct' : 'incorrect');
        }

        return classes.join(' ');
    }

    useEffect(() => {
        animateRef.current = animator.requestAnimationFrame(animate);

        return () => animateRef.current ? animator.cancelAnimationFrame(animateRef.current) : void(0);
    });

    return (
        <div className={getContainerClasses()}>
            { now >= question.questionDisplayTime ?
                <>
                    <CommandButton
                        className={getButtonClasses('1')}
                        disabled={disable}
                        data-answer={'1'}
                        onClick={handleAnswerButton}
                    >{question.answerText1}</CommandButton>
                    <CommandButton
                        className={getButtonClasses('2')}
                        disabled={disable}
                        data-answer={'2'}
                        onClick={handleAnswerButton}
                    >{question.answerText2}</CommandButton>
                    <CommandButton
                        className={getButtonClasses('3')}
                        disabled={disable}
                        data-answer={'3'}
                        onClick={handleAnswerButton}
                    >{question.answerText3}</CommandButton>
                </> :
                <></>
            }
        </div>
    );
}

export default AnswerViewer;
