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

const mockGames: Game[] = [
  {
    id: '1',
    title: 'Snake',
    description: 'Classic snake game.',
    format: '32x32',
    file: 'snake.mygt',
  },
  {
    id: '2',
    title: 'Tetris',
    description: 'A timeless puzzle game.',
    format: '32x32',
    file: 'tetris.mygt',
  },
  {
    id: '3',
    title: 'Pong',
    description: 'The original arcade tennis game.',
    format: 'all',
    file: 'pong.mygt',
  },
];

const snakeGameCode = `
# Snake Game
# Variables
var score = 0
var snake_length = 3
var direction = 0  # 0: right, 1: down, 2: left, 3: up

# Display variables
display score, snake_length

# Initial snake position
set 15,15,1
set 14,15,1
set 13,15,1

# Food position
set 20,20,2

# Controls
button "up" {
    if direction != 1 {
        direction = 3
    }
}

button "down" {
    if direction != 3 {
        direction = 1
    }
}

button "left" {
    if direction != 0 {
        direction = 2
    }
}

button "right" {
    if direction != 2 {
        direction = 0
    }
}

# Game loop
loop {
    # Move snake
    if direction == 0 {
        # Move right
        set snake_x + 1, snake_y, 1
    }
    else if direction == 1 {
        # Move down
        set snake_x, snake_y + 1, 1
    }
    else if direction == 2 {
        # Move left
        set snake_x - 1, snake_y, 1
    }
    else if direction == 3 {
        # Move up
        set snake_x, snake_y - 1, 1
    }

    # Check for food collision
    if get snake_x, snake_y == 2 {
        score = score + 10
        snake_length = snake_length + 1
        # Generate new food
        set random(0,31), random(0,31), 2
    }

    # Check for wall collision
    if snake_x < 0 or snake_x > 31 or snake_y < 0 or snake_y > 31 {
        # Game over
        stop
    }

    # Update display
    update
    draw
}
`;

const App: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('all');
  const [games, setGames] = useState<Game[]>(mockGames);
  const [selectedGameCode, setSelectedGameCode] = useState<string | null>(null);
  const [currentGameVariables, setCurrentGameVariables] = useState<Record<string, number>>({});

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
            {filteredGames.map(game => (
              <GameCard 
                key={game.id} 
                onClick={() => {
                  if (game.id === '1') { // Assuming '1' is Snake for now
                    setSelectedGameCode(snakeGameCode);
                  } else {
                    window.Telegram?.WebApp?.showAlert(`Loading game: ${game.title} (not yet implemented)`);
                  }
                }}
              >
                <GameTitle>{game.title}</GameTitle>
                <GameDescription>{game.description}</GameDescription>
              </GameCard>
            ))}
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