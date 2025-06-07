# YourGame - Telegram Mini App

YourGame is a Telegram mini-app that provides a platform for playing and creating mini-games using the MYG programming language.

## Features

- Game format selection (All/32x32)
- Game hub with various mini-games
- Custom .mygt game format
- MYG programming language for game development
- Three-part game structure:
  - Variable display panel
  - 32x32 game grid
  - Control buttons

## MYG Language Documentation

### Basic Syntax

```
# Variables
var score = 0
var lives = 3

# Display variables
display score, lives

# Game grid (32x32)
grid {
    # Set cell at position (x,y) to value
    set 5,5,1
    # Get cell value
    get 5,5
}

# Controls
button "up" {
    # Action when button is pressed
    move player, 0,-1
}

# Game loop
loop {
    # Game logic here
    update
    draw
}
```

### Commands

1. Variables:
   - `var name = value` - Declare variable
   - `display var1, var2` - Show variables in display panel

2. Grid:
   - `set x,y,value` - Set cell value
   - `get x,y` - Get cell value
   - `clear` - Clear grid

3. Controls:
   - `button "name" { ... }` - Define button action

4. Game Flow:
   - `loop { ... }` - Main game loop
   - `update` - Update game state
   - `draw` - Draw game state

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`

## Contributing

To add new games:
1. Create a .mygt file using the MYG language
2. Send the game file to the bot
3. Games will be reviewed and added to the hub

## License

MIT License 