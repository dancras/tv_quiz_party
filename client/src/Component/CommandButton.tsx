import React from 'react';
import { Observable } from 'rxjs';
import { useObservable } from '../Lib/RxReact';

export type CommandButtonProps = React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>;

function CommandButton(
    areCommandsDisabled$: Observable<boolean>,
    { children, disabled, ...props }: CommandButtonProps
) {
    const areCommandsDisabled = useObservable(areCommandsDisabled$);

    return <button disabled={areCommandsDisabled || disabled} {...props}>{children}</button>;
}

export default CommandButton;
