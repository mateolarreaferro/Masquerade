import { useState } from 'react';

const LobbyForm = ({ mode }) => {
    const [lobbyCode, setLobbyCode] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'create') {
            console.log('Creating lobby...');
        } else {
            console.log('Joining lobby with code:', lobbyCode);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {mode === 'join' && (
                <input
                    type="text"
                    placeholder="Enter Lobby Code"
                    value={lobbyCode}
                    onChange={(e) => setLobbyCode(e.target.value)}
                />
            )}
            <button type="submit">{mode === 'create' ? 'Create' : 'Join'}</button>
        </form>
    );
};

export default LobbyForm;