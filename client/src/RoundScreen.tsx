import { Round } from './Round';

export type RoundScreenProps = {
    round: Round
};

function RoundScreen(
    { round } : RoundScreenProps
) {
    const dumpQuestions = JSON.stringify(round.questions, undefined, 2);

    return (
        <div>
            <div>{dumpQuestions}</div>
        </div>
    );
}

export default RoundScreen;
