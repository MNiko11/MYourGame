import React, { useState } from 'react';
import styled from 'styled-components';
import GameEngine, { GameState } from './components/GameEngine';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        showAlert: (message: string) => void;
        MainButton: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        initDataUnsafe?: { // Added for passing game data
          start_param?: string;
        };
        // Добавьте другие методы, которые вы используете
      };
    };
  }
}

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #000000);
`;

const FormatSelector = styled.div`
  display: flex;
  padding: 10px;
  gap: 10px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
`;

const FormatButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background-color: ${props => props.active ? 'var(--tg-theme-button-color, #2481cc)' : 'var(--tg-theme-button-color, #2481cc)40'};
  color: ${props => props.active ? 'var(--tg-theme-button-text-color, #ffffff)' : 'var(--tg-theme-text-color, #000000)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.9;
  }
`;

const GameHub = styled.div`
  flex: 1;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
  overflow-y: auto;
`;

const GameCard = styled.div`
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  border-radius: 8px; /* Slightly smaller border-radius */
  padding: 10px; /* Reduced padding */
  cursor: pointer;
  transition: transform 0.2s ease;
  min-height: 80px; /* Set a minimum height for consistency */
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: scale(1.03); /* Slightly less aggressive scale on hover */
  }
`;

const GameTitle = styled.h3`
  margin: 0;
  font-size: 15px; /* Slightly smaller font size */
  color: var(--tg-theme-text-color, #000000);
  white-space: nowrap; /* Prevent title from wrapping */
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GameDescription = styled.p`
  margin: 4px 0 0; /* Reduced margin */
  font-size: 11px; /* Slightly smaller font size */
  color: var(--tg-theme-hint-color, #999999);
  display: -webkit-box; /* Enable multiline ellipsis */
  -webkit-line-clamp: 2; /* Limit to 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

type GameFormat = 'all' | '32x32';

interface Game {
  id: string;
  title: string;
  description: string;
  format: GameFormat;
  code: string; // Changed from 'file' to 'code' to store content directly
}

const App: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('all');
  const [games, setGames] = useState<Game[]>([]); // Initialize with empty array
  const [selectedGameCode, setSelectedGameCode] = useState<string | null>(null);
  const [currentGameVariables, setCurrentGameVariables] = useState<Record<string, number>>({});

  // Initialize Telegram WebApp and load games if available
  React.useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();

      // Attempt to load games from initDataUnsafe if provided by bot
      const initData = window.Telegram.WebApp.initDataUnsafe;
      if (initData && initData.start_param) {
        try {
          const gamesData = JSON.parse(decodeURIComponent(initData.start_param));
          if (Array.isArray(gamesData)) {
            setGames(gamesData);
          }
        } catch (e) {
          console.error("Failed to parse start_param for games:", e);
        }
      }
    }
  }, []);

  // Handle Telegram WebApp MainButton for navigation
  React.useEffect(() => {
    if (window.Telegram?.WebApp) {
      const mainButton = window.Telegram.WebApp.MainButton;

      if (selectedGameCode) {
        mainButton.setText('⬅️ Back');
        mainButton.show();
        const backHandler = () => {
          setSelectedGameCode(null);
          mainButton.hide();
          mainButton.offClick(backHandler);
        };
        mainButton.onClick(backHandler);
      } else {
        mainButton.hide();
      }
    }
  }, [selectedGameCode]);

  const filteredGames = games.filter(game => 
    selectedFormat === 'all' || game.format === selectedFormat
  );

  const handleGameStateChange = (newState: GameState) => {
    setCurrentGameVariables(newState.variables);
    // You might want to update other parts of App.tsx based on game state
  };

  return (
    <AppContainer>
      {!selectedGameCode ? (
        <>
          <FormatSelector>
            <FormatButton 
              active={selectedFormat === 'all'} 
              onClick={() => setSelectedFormat('all')}
            >
              All
            </FormatButton>
            <FormatButton 
              active={selectedFormat === '32x32'} 
              onClick={() => setSelectedFormat('32x32')}
            >
              32x32
            </FormatButton>
          </FormatSelector>

          <GameHub>
            {filteredGames.length > 0 ? ( // Display games only if available
              filteredGames.map(game => (
                <GameCard 
                  key={game.id} 
                  onClick={() => setSelectedGameCode(game.code)} // Use game.code directly
                >
                  <GameTitle>{game.title}</GameTitle>
                  <GameDescription>{game.description}</GameDescription>
                </GameCard>
              ))
            ) : (
              <p style={{ color: 'var(--tg-theme-hint-color)', textAlign: 'center', width: '100%' }}>
                No games available. Send a .mygt file to the bot to add one!
              </p>
            )}
          </GameHub>
        </>
      ) : (
        <GameEngine 
          gameCode={selectedGameCode} 
          onGameStateChange={handleGameStateChange} 
        />
      )}
    </AppContainer>
  );
};

export default App; 