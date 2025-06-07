import React, { useState } from 'react';
import styled from 'styled-components';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        showAlert: (message: string) => void;
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
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const GameTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: var(--tg-theme-text-color, #000000);
`;

const GameDescription = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999999);
`;

type GameFormat = 'all' | '32x32';

interface Game {
  id: string;
  title: string;
  description: string;
  format: GameFormat;
  file: string;
}

const App: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('all');
  const [games, setGames] = useState<Game[]>([]);

  // Initialize Telegram WebApp
  React.useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const filteredGames = games.filter(game => 
    selectedFormat === 'all' || game.format === selectedFormat
  );

  return (
    <AppContainer>
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
        {filteredGames.map(game => (
          <GameCard key={game.id} onClick={() => window.Telegram?.WebApp?.showAlert(`Loading game: ${game.title}`)}>
            <GameTitle>{game.title}</GameTitle>
            <GameDescription>{game.description}</GameDescription>
          </GameCard>
        ))}
      </GameHub>
    </AppContainer>
  );
};

export default App; 