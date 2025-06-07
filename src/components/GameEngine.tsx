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

export interface GameState {
  variables: Record<string, number>;
  grid: number[][];
  buttons: Record<string, () => void>;
  displayVariables: string[];
}

class MYGInterpreter {
  private state: GameState;
  private gameLoopInterval: number | null = null;
  private loopInstructions: (() => void)[] = [];

  constructor() {
    this.state = {
      variables: {},
      grid: Array(32).fill(null).map(() => Array(32).fill(0)),
      buttons: {},
      displayVariables: [],
    };
  }

  private evaluateExpression(expression: string): number {
    expression = String(expression).trim();

    if (this.state.variables.hasOwnProperty(expression)) {
      return this.state.variables[expression];
    }
    
    const randomMatch = expression.match(/random\((\d+),(\d+)\)/);
    if (randomMatch) {
      const min = parseInt(randomMatch[1]);
      const max = parseInt(randomMatch[2]);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const getMatch = expression.match(/get\s+([\w\d]+)\s*,\s*([\w\d]+)/);
    if (getMatch) {
        const x = this.evaluateExpression(getMatch[1]);
        const y = this.evaluateExpression(getMatch[2]);
        if (x >= 0 && x < 32 && y >= 0 && y < 32) {
            return this.state.grid[y][x];
        }
        return 0;
    }

    if (expression.includes('+')) {
        const parts = expression.split('+');
        return this.evaluateExpression(parts[0]) + this.evaluateExpression(parts[1]);
    }
    if (expression.includes('-')) {
        const parts = expression.split('-');
        return this.evaluateExpression(parts[0]) - this.evaluateExpression(parts[1]);
    }
    if (expression.includes('*')) {
        const parts = expression.split('*');
        return this.evaluateExpression(parts[0]) * this.evaluateExpression(parts[1]);
    }
    if (expression.includes('/')) {
        const parts = expression.split('/');
        return this.evaluateExpression(parts[0]) / this.evaluateExpression(parts[1]);
    }

    const num = parseInt(expression);
    if (!isNaN(num)) {
      return num;
    }

    console.warn(`Unknown expression or variable: ${expression}`);
    return 0;
  }

  parse(code: string) {
    const lines = code.split('\n');
    let inLoop = false;
    let currentButtonName: string | null = null;
    let currentIfCondition: boolean | null = null;
    let skipBlock = false;

    this.loopInstructions = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (line.startsWith('#') || !line) continue;

      if (inLoop) {
        if (line === 'stop') {
          this.loopInstructions.push(() => this.stopGameLoop());
          inLoop = false;
          continue;
        } else if (line === 'update') {
            this.loopInstructions.push(() => { /* nothing to do here, state update is external */ });
            continue;
        } else if (line === 'draw') {
            this.loopInstructions.push(() => { /* nothing to do here, rendering is external */ });
            continue;
        }

        this.loopInstructions.push(() => this.executeLine(line));
        continue;
      }

      if (currentButtonName) {
        if (line === '}') {
          currentButtonName = null;
          continue;
        }
        const buttonLine = line;
        this.state.buttons[currentButtonName] = () => {
          this.executeLine(buttonLine);
        };
        continue;
      }

      if (line.startsWith('var ')) {
        const match = line.match(/var\s+(\w+)\s*=\s*(.+)/);
        if (match) {
          const name = match[1];
          const value = this.evaluateExpression(match[2]);
          this.state.variables[name] = value;
        }
      }
      else if (line.startsWith('display ')) {
        const varsToDisplay = line.substring('display '.length).split(',').map(v => v.trim());
        this.state.displayVariables.push(...varsToDisplay);
      }
      else if (line.startsWith('set ')) {
        const match = line.match(/set\s+([\w\d\+\-\*\/\s(),]+)\s*,\s*([\w\d\+\-\*\/\s(),]+)\s*,\s*([\w\d\+\-\*\/\s(),]+)/);
        if (match) {
          const x = this.evaluateExpression(match[1]);
          const y = this.evaluateExpression(match[2]);
          const value = this.evaluateExpression(match[3]);
          if (x >= 0 && x < 32 && y >= 0 && y < 32) {
              this.state.grid[y][x] = value;
          }
        }
      }
      else if (line.startsWith('button ')) {
        const match = line.match(/button\s+"([^"]+)"\s*\{/);
        if (match) {
          currentButtonName = match[1];
        }
      }
      else if (line === 'loop {') {
        inLoop = true;
      }
      else if (line.startsWith('if ')) {
        const conditionString = line.substring('if '.length, line.indexOf('{')).trim();
        const conditionResult = this.evaluateCondition(conditionString);
        currentIfCondition = conditionResult;
        skipBlock = !conditionResult;
      }
      else if (line.startsWith('else if ')) {
        if (currentIfCondition === true) {
          skipBlock = true;
        } else {
          const conditionString = line.substring('else if '.length, line.indexOf('{')).trim();
          const conditionResult = this.evaluateCondition(conditionString);
          currentIfCondition = conditionResult;
          skipBlock = !conditionResult;
        }
      }
      else if (line === 'else {') {
        if (currentIfCondition === true) {
          skipBlock = true;
        } else {
          skipBlock = false;
        }
      }
      else if (line === '}' && currentIfCondition !== null) {
        currentIfCondition = null;
        skipBlock = false;
      }
      else if (currentIfCondition !== null && skipBlock) {
        continue;
      }
    }
  }

  private evaluateCondition(conditionString: string): boolean {
    const eqMatch = conditionString.match(/([\w\d\+\-\*\/\s(),]+)\s*==\s*([\w\d\+\-\*\/\s(),]+)/);
    if (eqMatch) {
        return this.evaluateExpression(eqMatch[1]) === this.evaluateExpression(eqMatch[2]);
    }

    const neqMatch = conditionString.match(/([\w\d\+\-\*\/\s(),]+)\s*!=\s*([\w\d\+\-\*\/\s(),]+)/);
    if (neqMatch) {
        return this.evaluateExpression(neqMatch[1]) !== this.evaluateExpression(neqMatch[2]);
    }

    const ltMatch = conditionString.match(/([\w\d\+\-\*\/\s(),]+)\s*<\s*([\w\d\+\-\*\/\s(),]+)/);
    if (ltMatch) {
        return this.evaluateExpression(ltMatch[1]) < this.evaluateExpression(ltMatch[2]);
    }

    const gtMatch = conditionString.match(/([\w\d\+\-\*\/\s(),]+)\s*>\s*([\w\d\+\-\*\/\s(),]+)/);
    if (gtMatch) {
        return this.evaluateExpression(gtMatch[1]) > this.evaluateExpression(gtMatch[2]);
    }

    if (conditionString.includes('or')) {
        const parts = conditionString.split('or');
        return this.evaluateCondition(parts[0]) || this.evaluateCondition(parts[1]);
    }

    if (conditionString.includes('and')) {
        const parts = conditionString.split('and');
        return this.evaluateCondition(parts[0]) && this.evaluateCondition(parts[1]);
    }

    const value = this.evaluateExpression(conditionString);
    return value !== 0;
  }

  private executeLine(line: string) {
    line = line.trim();

    if (line.startsWith('var ')) {
        const match = line.match(/var\s+(\w+)\s*=\s*(.+)/);
        if (match) {
          const name = match[1];
          const value = this.evaluateExpression(match[2]);
          this.state.variables[name] = value;
        }
      }
    else if (line.startsWith('set ')) {
      const match = line.match(/set\s+([\w\d\+\-\*\/\s(),]+)\s*,\s*([\w\d\+\-\*\/\s(),]+)\s*,\s*([\w\d\+\-\*\/\s(),]+)/);
      if (match) {
        const x = this.evaluateExpression(match[1]);
        const y = this.evaluateExpression(match[2]);
        const value = this.evaluateExpression(match[3]);
        if (x >= 0 && x < 32 && y >= 0 && y < 32) {
            this.state.grid[y][x] = value;
        }
      }
    }
    else if (line.startsWith('if ')) {
      const conditionString = line.substring('if '.length, line.indexOf('{')).trim();
      const conditionResult = this.evaluateCondition(conditionString);
    }
  }

  getState(): GameState {
    return this.state;
  }

  startGameLoop(updateCallback: () => void) {
    if (this.gameLoopInterval) return;

    this.gameLoopInterval = window.setInterval(() => {
      for (const instruction of this.loopInstructions) {
        instruction();
      }
      updateCallback();
    }, 1000 / 60);
  }

  stopGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }
}

interface GameEngineProps {
  gameCode: string;
  onGameStateChange: (newState: GameState) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ gameCode, onGameStateChange }) => {
  const interpreter = useRef(new MYGInterpreter());
  const [gameState, setGameState] = useState<GameState>({
    variables: {},
    grid: Array(32).fill(null).map(() => Array(32).fill(0)),
    buttons: {},
    displayVariables: [],
  });

  useEffect(() => {
    interpreter.current.parse(gameCode);
    const initialGameState = interpreter.current.getState();
    setGameState(initialGameState);
    onGameStateChange(initialGameState);

    interpreter.current.startGameLoop(() => {
      const updatedState = interpreter.current.getState();
      setGameState(updatedState);
      onGameStateChange(updatedState);
    });

    return () => {
      interpreter.current.stopGameLoop();
    };
  }, [gameCode, onGameStateChange]);

  return (
    <GameContainer>
      <VariablePanel>
        {gameState.displayVariables.map(varName => (
          <Variable key={varName}>
            {varName}: {gameState.variables[varName]}
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