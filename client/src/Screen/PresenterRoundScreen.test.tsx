import { render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';

import Round, { CurrentQuestion } from '../Model/Round';
import PresenterRoundScreen, { RoundScreenProps } from './PresenterRoundScreen';
import { QuestionViewerProps } from './QuestionViewer';

import { createCurrentQuestion } from '../Model/Round.test';
import { BehaviorSubject } from 'rxjs';

let DummyQuestionViewer: React.FunctionComponent<QuestionViewerProps>;
let currentQuestion$: BehaviorSubject<CurrentQuestion | null>;

function ExamplePresenterRoundScreen(
    props : RoundScreenProps
) {
    return PresenterRoundScreen(
        DummyQuestionViewer,
        props
    );
}

beforeEach(() => {
    DummyQuestionViewer = () => <div>QuestionViewer</div>;
    currentQuestion$ = new BehaviorSubject<CurrentQuestion | null>(null);
});

test('QuestionViewer is shown for current question data', () => {
    const mockRound = mock<Round>();
    mockRound.currentQuestion$ = currentQuestion$;

    currentQuestion$.next(createCurrentQuestion());

    render(<ExamplePresenterRoundScreen round={mockRound} />);

    expect(screen.getByText('QuestionViewer')).toBeInTheDocument();
});
