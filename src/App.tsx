import { useState, useEffect } from 'react';
import styled from 'styled-components';
import WebApp from '@twa-dev/sdk';
import GameEngine from './components/GameEngine';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background-color: var(--tg-theme-bg-color, #ffffff);
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  color: var(--tg-theme-text-color, #000000);
`;

const BackButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #ffffff);
  cursor: pointer;
  font-size: 16px;
  &:hover {
    opacity: 0.9;
  }
`;

const FormatSelector = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const FormatButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background-color: ${props => props.active ? 'var(--tg-theme-button-color, #2481cc)' : 'var(--tg-theme-secondary-bg-color, #f0f0f0)'};
  color: ${props => props.active ? 'var(--tg-theme-button-text-color, #ffffff)' : 'var(--tg-theme-text-color, #000000)'};
  cursor: pointer;
  font-size: 16px;
  &:hover {
    opacity: 0.9;
  }
`;

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const GameCard = styled.div`
  padding: 16px;
  border-radius: 8px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  cursor: pointer;
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-2px);
  }
`;

const GameTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--tg-theme-text-color, #000000);
`;

const GameDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: var(--tg-theme-hint-color, #999999);
`;

interface Game {
  id: string;
  title: string;
  description: string;
  format: string;
  code: string;
}

function App() {
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    // Initialize WebApp
    WebApp.ready();
    WebApp.expand();

    // Load games from start_param if available
    const startParam = WebApp.initDataUnsafe.start_param;
    if (startParam) {
      try {
        const loadedGames = JSON.parse(decodeURIComponent(startParam));
        setGames(loadedGames);
      } catch (error) {
        console.error('Failed to parse games from start_param:', error);
      }
    }
  }, []);

  const filteredGames = games.filter(game => 
    selectedFormat === 'all' || game.format === selectedFormat
  );

  if (selectedGame) {
    return (
      <Container>
        <Header>
          <BackButton onClick={() => setSelectedGame(null)}>
            ⬅️ Back
          </BackButton>
          <Title>{selectedGame.title}</Title>
        </Header>
        <GameEngine code={selectedGame.code} />
      </Container>
    );
  }

  return (
    <Container>
      <Title>MYourGame</Title>
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
      <GameGrid>
        {filteredGames.map(game => (
          <GameCard key={game.id} onClick={() => setSelectedGame(game)}>
            <GameTitle>{game.title}</GameTitle>
            <GameDescription>{game.description}</GameDescription>
          </GameCard>
        ))}
      </GameGrid>
    </Container>
  );
}

export default App; 