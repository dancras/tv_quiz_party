import React from 'react';
import { Container, Grid, Header, Image, Segment, Statistic, Table } from 'semantic-ui-react';
import { CommandButtonProps } from '../Component/CommandButton';
import { useObservable } from '../Lib/RxReact';

import Lobby from '../Model/Lobby';
import { Profile } from '../Model/Profile';

export type LobbyScreenProps = {
    lobby: Lobby
};

function LobbyScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    { lobby } : LobbyScreenProps
) {
    const users = useObservable(lobby.users$);

    function handleStartRoundButton() {
        lobby.startRound();
    }

    function getProfileImageSrc(profile: Profile): string {
        return '/api/profile_images/' + profile.imageFilename;
    }

    return (
        <Container textAlign='center'>
            <Grid style={{ height: '100vh' }} verticalAlign='middle'>
                <Grid.Column computer={8} tablet={16} mobile={16}>
                    <Statistic size='huge'>
                        <Statistic.Label>Join Code</Statistic.Label>
                        <Statistic.Value>{lobby.joinCode}</Statistic.Value>
                    </Statistic>
                    { lobby.isHost ?
                        <div>
                            <CommandButton onClick={handleStartRoundButton}>Start Round</CommandButton>
                        </div> :
                        <></>
                    }
                </Grid.Column>
                <Grid.Column computer={8} tablet={16} mobile={16}>
                    <Segment>
                        <Table basic='very' celled collapsing>
                            <Table.Body>
                                {Object.values(users).map(profile =>
                                    <Table.Row key={profile.userID}>
                                        <Table.Cell>
                                            <Image src={getProfileImageSrc(profile)} circular size='tiny' />
                                        </Table.Cell>
                                        <Table.Cell><Header size="huge">{profile.displayName}</Header></Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    </Segment>
                </Grid.Column>
            </Grid>
        </Container>
    );
}

export default LobbyScreen;
