# MYourGame

A Telegram bot platform for running custom games written in the MYG language.

## Features

- Custom game file format (.mygt)
- Game catalog with filtering options
- 32x32 pixel display for games
- Customizable game controls
- Variable display system

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file with your Telegram bot token:
   ```
   BOT_TOKEN=your_bot_token_here
   ```
4. Run the bot:
   ```bash
   python main.py
   ```

## Game Development

Games are written in the MYG language and saved with the .mygt extension. Each game file contains:
- Game metadata (name, description)
- Game logic
- Display variables
- Control configuration

## License

MIT License 