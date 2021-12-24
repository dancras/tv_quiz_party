import React from 'react';
import { Grid, Form, Divider, Container } from 'semantic-ui-react';
import { CommandButtonProps } from '../Component/CommandButton';
import { LobbyCmd } from '../Model/Lobby';

function WelcomeScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    sendCmd: (cmd: LobbyCmd) => void
) {
    const [joinCode, setJoinCode] = React.useState('');

    function handleHostLobbyButton() {
        sendCmd({
            cmd: 'CreateLobby'
        });
    }

    function handleJoinCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
        setJoinCode(event.target.value);
    }

    function handleJoinLobbyButton() {
        sendCmd({
            cmd: 'JoinLobby',
            joinCode: joinCode,
            isPresenter: false
        });
    }

    function handlePresenterButton() {
        sendCmd({
            cmd: 'JoinLobby',
            joinCode: joinCode,
            isPresenter: true
        });
    }

    return (
        <Container>
            <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
                <Grid.Column textAlign='left' style={{ maxWidth: 450 }}>
                    <Form size="big">
                        <Form.Field>
                            <label>Join Code <input type="text" onChange={handleJoinCodeChange} placeholder="Enter Join Code" /></label>
                        </Form.Field>
                        <Form.Group widths='equal'>
                            <Form.Field>
                                <CommandButton fluid size='large' onClick={handleJoinLobbyButton}>Join Lobby</CommandButton>
                            </Form.Field>
                            <Form.Field>
                                <CommandButton fluid size='large' onClick={handlePresenterButton}>Presenter</CommandButton>
                            </Form.Field>
                        </Form.Group>

                        <Divider horizontal>Or</Divider>
                        <Form.Field>
                            <CommandButton fluid size='large' onClick={handleHostLobbyButton}>Host Lobby</CommandButton>
                        </Form.Field>
                    </Form>
                </Grid.Column>
            </Grid>
        </Container>
    );
}

export default WelcomeScreen;
