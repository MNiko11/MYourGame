import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
`;

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(32, 1fr);
  width: 320px;
  height: 320px;
  border: 1px solid #ccc;
`;

const Cell = styled.div<{ color: string }>`
  width: 10px;
  height: 10px;
  background-color: ${props => props.color};
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ControlButton = styled.button`
  width: 40px;
  height: 40px;
  font-size: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: #f0f0f0;
  }
`;

interface GameState {
  variables: Record<string, number>;
  grid: string[][];
  buttons: Record<string, () => void>;
}

interface GameEngineProps {
  code: string;
}

export default function GameEngine({ code }: GameEngineProps) {
  const [gameState, setGameState] = useState<GameState>({
    variables: {},
    grid: Array(32).fill(null).map(() => Array(32).fill('#FFFFFF')),
    buttons: {}
  });

  const gameLoopRef = useRef<number>();
  const isRunningRef = useRef(true);

  useEffect(() => {
    // Initialize game state
    const lines = code.split('\n');
    let currentButton: string | null = null;
    let buttonCode: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Parse variables
      if (trimmedLine.startsWith('var ')) {
        const [_, name, value] = trimmedLine.match(/var\s+(\w+)\s*=\s*(\d+)/) || [];
        if (name && value) {
          setGameState(prev => ({
            ...prev,
            variables: { ...prev.variables, [name]: parseInt(value) }
          }));
        }
      }
      // Parse buttons
      else if (trimmedLine.startsWith('button ')) {
        const match = trimmedLine.match(/button\s+"([^"]+)"/);
        if (match) {
          currentButton = match[1];
          buttonCode = [];
        }
      }
      else if (trimmedLine === '}' && currentButton) {
        const buttonHandler = new Function('state', 'setState', buttonCode.join('\n'));
        setGameState(prev => ({
          ...prev,
          buttons: {
            ...prev.buttons,
            [currentButton!]: () => buttonHandler(prev, setGameState)
          }
        }));
        currentButton = null;
      }
      else if (currentButton) {
        buttonCode.push(trimmedLine);
      }
    }

    // Start game loop
    const gameLoop = () => {
      if (!isRunningRef.current) return;

      // Execute loop block
      const loopBlock = code.match(/loop\s*{([^}]*)}/)?.[1];
      if (loopBlock) {
        const loopHandler = new Function('state', 'setState', loopBlock);
        loopHandler(gameState, setGameState);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      isRunningRef.current = false;
    };
  }, [code]);

  // Handle grid updates
  useEffect(() => {
    const lines = code.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('set ')) {
        const [_, x, y, color] = trimmedLine.match(/set\s+(\d+)\s*,\s*(\d+)\s*,\s*([^,]+)/) || [];
        if (x && y && color) {
          const xIndex = parseInt(x);
          const yIndex = parseInt(y);
          if (xIndex >= 0 && xIndex < 32 && yIndex >= 0 && yIndex < 32) {
            setGameState(prev => {
              const newGrid = [...prev.grid];
              newGrid[yIndex][xIndex] = color;
              return { ...prev, grid: newGrid };
            });
          }
        }
      }
    }
  }, [code]);

  return (
    <Container>
      <GameGrid>
        {gameState.grid.map((row, y) =>
          row.map((color, x) => (
            <Cell key={`${x}-${y}`} color={color} />
          ))
        )}
      </GameGrid>
      <Controls>
        {Object.entries(gameState.buttons).map(([emoji, handler]) => (
          <ControlButton key={emoji} onClick={handler}>
            {emoji}
          </ControlButton>
        ))}
      </Controls>
    </Container>
  );
} 