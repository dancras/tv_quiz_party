import { CurrentQuestionMetadata, Question } from './Round';

export type QuestionViewerProps = {
    question: CurrentQuestionMetadata & Question
};

function QuestionViewer({ question } : QuestionViewerProps) {
    const dumpQuestion = JSON.stringify(question, undefined, 2);

    return (
        <div>
            <div>{question.startTime}</div>
            <div>{dumpQuestion}</div>
        </div>
    );
}

export default QuestionViewer;
