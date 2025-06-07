import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--tg-theme-bg-color, #ffffff);
`;

const VariablePanel = styled.div`
  padding: 10px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Variable = styled.div`
  padding: 5px 10px;
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #ffffff);
  border-radius: 4px;
  font-size: 14px;
`;

const GameGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(32, 1fr);
  grid-template-rows: repeat(32, 1fr);
  gap: 1px;
  padding: 10px;
  background-color: var(--tg-theme-hint-color, #999999);
`;

const GridCell = styled.div<{ value: number }>`
  background-color: ${props => 
    props.value === 0 ? 'var(--tg-theme-bg-color, #ffffff)' :
    props.value === 1 ? 'var(--tg-theme-button-color, #2481cc)' :
    'var(--tg-theme-link-color, #2481cc)'
  };
`;

const ControlPanel = styled.div`
  padding: 10px;
  display: flex;
  gap: 10px;
  justify-content: center;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
`;

const ControlButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #ffffff);
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`;

interface GameState {
  variables: Record<string, number>;
  grid: number[][];
  buttons: Record<string, () => void>;
}

class MYGInterpreter {
  private state: GameState;
  private gameLoop: number | null = null;

  constructor() {
    this.state = {
      variables: {},
      grid: Array(32).fill(null).map(() => Array(32).fill(0)),
      buttons: {}
    };
  }

  parse(code: string) {
    const lines = code.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('#') || !line) continue;

      if (line.startsWith('var ')) {
        const [_, name, value] = line.match(/var\s+(\w+)\s*=\s*(\d+)/) || [];
        if (name && value) {
          this.state.variables[name] = parseInt(value);
        }
      }
      else if (line.startsWith('set ')) {
        const [_, x, y, value] = line.match(/set\s+(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/) || [];
        if (x && y && value) {
          this.state.grid[parseInt(y)][parseInt(x)] = parseInt(value);
        }
      }
      else if (line.startsWith('button ')) {
        const [_, name] = line.match(/button\s+"([^"]+)"/) || [];
        if (name) {
          this.state.buttons[name] = () => {
            // Button action will be implemented here
          };
        }
      }
    }
  }

  getState(): GameState {
    return this.state;
  }

  startGameLoop(updateCallback: () => void) {
    if (this.gameLoop) return;
    
    this.gameLoop = window.setInterval(() => {
      updateCallback();
    }, 1000 / 60); // 60 FPS
  }

  stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }
}

interface GameEngineProps {
  gameCode: string;
}

const GameEngine: React.FC<GameEngineProps> = ({ gameCode }) => {
  const interpreter = useRef(new MYGInterpreter());
  const [gameState, setGameState] = useState<GameState>({
    variables: {},
    grid: Array(32).fill(null).map(() => Array(32).fill(0)),
    buttons: {}
  });

  useEffect(() => {
    interpreter.current.parse(gameCode);
    setGameState(interpreter.current.getState());

    interpreter.current.startGameLoop(() => {
      setGameState(interpreter.current.getState());
    });

    return () => {
      interpreter.current.stopGameLoop();
    };
  }, [gameCode]);

  return (
    <GameContainer>
      <VariablePanel>
        {Object.entries(gameState.variables).map(([name, value]) => (
          <Variable key={name}>
            {name}: {value}
          </Variable>
        ))}
      </VariablePanel>

      <GameGrid>
        {gameState.grid.map((row, y) =>
          row.map((value, x) => (
            <GridCell key={`${x}-${y}`} value={value} />
          ))
        )}
      </GameGrid>

      <ControlPanel>
        {Object.keys(gameState.buttons).map(name => (
          <ControlButton
            key={name}
            onClick={() => gameState.buttons[name]()}
          >
            {name}
          </ControlButton>
        ))}
      </ControlPanel>
    </GameContainer>
  );
};

export default GameEngine; 