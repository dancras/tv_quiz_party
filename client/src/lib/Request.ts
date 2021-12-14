export function post(url: string, data?: any) {
    const body = data ? JSON.stringify(data) : undefined;

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body
    });
}

export function subscribeToServer(url: string, handler: (event: MessageEvent<any>) => void): WebSocket {
    const absoluteUrl = new URL(url, window.location.href);
    absoluteUrl.protocol = absoluteUrl.protocol.replace('http', 'ws');

    const socket = new WebSocket(absoluteUrl.href);

    socket.addEventListener('open', (event) => {
        console.debug('Socket is open', event);
    });

    socket.addEventListener('message', (event) => {
        console.debug('Socket message', event);
        handler(event);
    });

    return socket;
}
