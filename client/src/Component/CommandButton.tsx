import React from 'react';
import { Observable } from 'rxjs';
import { Button, ButtonProps } from 'semantic-ui-react';
import { useObservable } from '../Lib/RxReact';

export type CommandButtonProps = React.PropsWithChildren<ButtonProps>;

function CommandButton(
    areCommandsDisabled$: Observable<boolean>,
    { children, disabled, ...props }: CommandButtonProps
) {
    const areCommandsDisabled = useObservable(areCommandsDisabled$);

    return <Button disabled={areCommandsDisabled || disabled} {...props}>{children}</Button>;
}

export default CommandButton;

/**
 * A logicless CommandButton with no deps for use in testing components which use CommandButton
 *
 * Rather than checking the logic of CommandButton, you can just confirm data-command-button is present
 */
export function DummyCommandButton({ children, ...props }: CommandButtonProps) {
    return <Button data-command-button {...props}>{children}</Button>;
}
