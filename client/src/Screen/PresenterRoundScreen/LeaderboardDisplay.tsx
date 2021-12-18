import { QuestionTimingsHook } from '../../Hook/QuestionTimingsHook';
import { useObservable } from '../../Lib/RxReact';
import CurrentQuestion from '../../Model/CurrentQuestion';
import { Leaderboard, LeaderboardItem } from '../../Model/Round';

export type LeaderboardDisplayProps = {
    currentQuestion: CurrentQuestion,
    leaderboard: Leaderboard
};

function LeaderboardDisplay(
    useQuestionTimings: QuestionTimingsHook<CurrentQuestion>,
    { currentQuestion, leaderboard }: LeaderboardDisplayProps
) {
    const hasEndedOnServer = useObservable(currentQuestion?.hasEndedOnServer$);
    const timings = useQuestionTimings(currentQuestion);

    function getAnswerClasses(item: LeaderboardItem) {
        if (timings.revealAnswer) {
            return item.previousAnswer === currentQuestion.correctAnswer ? 'correct' : 'incorrect';
        } else {
            return '';
        }
    }

    return (
        <table className="leaderboard">
            { Object.entries(leaderboard).map(([userID, item]) =>
                <tr key={userID}>
                    <td>{userID}</td>
                    { hasEndedOnServer ?
                        <td className={getAnswerClasses(item)}>{item.previousAnswer}</td> :
                        <td></td>
                    }
                </tr>
            ) }
        </table>
    );
}

export default LeaderboardDisplay;
