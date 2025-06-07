import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Helper to get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize bot with your token
const BOT_TOKEN = '8189696941:AAH8zEr-jWjug4wtW5ziXwY1wPgh7GT6le8';
const WEB_APP_URL = 'https://mniko11.github.io/MYourGame/';

// Create games directory if it doesn't exist
const gamesDir = join(__dirname, '..', '..', 'games');
if (!fs.existsSync(gamesDir)) {
  fs.mkdirSync(gamesDir, { recursive: true });
}

// Store games in memory
const storedGames: Array<{
  id: string;
  title: string;
  description: string;
  format: string;
  code: string;
}> = [];

// Initialize bot
const bot = new Telegraf(BOT_TOKEN);

// Welcome message with web app button
bot.command('start', async (ctx) => {
  await ctx.reply(
    'Welcome to MYourGame! 🎮\n\n' +
    'Send me a .mygt file to add a new game to the hub.\n' +
    'Use /help to see available commands.',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Open MYourGame', web_app: { url: WEB_APP_URL } }
        ]]
      }
    }
  );
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    'Available commands:\n\n' +
    '/start - Start the bot and get the web app button\n' +
    '/help - Show this help message\n' +
    '/docs - Show MYG language documentation\n\n' +
    'To add a game, simply send me a .mygt file!'
  );
});

// Documentation command
bot.command('docs', async (ctx) => {
  await ctx.reply(
    'MYG Language Documentation 📚\n\n' +
    'Variables:\n' +
    'var name = value\n\n' +
    'Grid:\n' +
    'set x, y, color\n\n' +
    'Buttons:\n' +
    'button "emoji" {\n' +
    '  // button code\n' +
    '}\n\n' +
    'Game Loop:\n' +
    'loop {\n' +
    '  // game loop code\n' +
    '}\n\n' +
    'Colors:\n' +
    'Use any valid CSS color (hex, rgb, name)\n\n' +
    'Example:\n' +
    'var x = 0\n' +
    'var y = 0\n' +
    'button "⬆️" {\n' +
    '  y = y - 1\n' +
    '  set x, y, "#FF0000"\n' +
    '}\n' +
    'loop {\n' +
    '  // game logic\n' +
    '}'
  );
});

// Handle .mygt files
bot.on('document', async (ctx) => {
  const doc = ctx.message.document;
  if (!doc.file_name?.endsWith('.mygt')) {
    await ctx.reply('❌ Please send a .mygt file');
    return;
  }

  try {
    // Download file
    const file = await ctx.telegram.getFile(doc.file_id);
    const filePath = join(gamesDir, doc.file_name);
    const response = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Parse metadata
    const titleMatch = fileContent.match(/title\s*=\s*"([^"]+)"/);
    const descriptionMatch = fileContent.match(/description\s*=\s*"([^"]+)"/);
    const formatMatch = fileContent.match(/format\s*=\s*"([^"]+)"/);

    const title = titleMatch?.[1] || doc.file_name.replace('.mygt', '');
    const description = descriptionMatch?.[1] || 'No description';
    const format = formatMatch?.[1] || '32x32';

    // Add game to storage
    const game = {
      id: doc.file_name,
      title,
      description,
      format,
      code: fileContent
    };
    storedGames.push(game);

    // Send success message with web app button
    await ctx.reply(
      '✅ Game added successfully!\n\n' +
      `Title: ${title}\n` +
      `Description: ${description}\n` +
      `Format: ${format}\n\n` +
      'Click the button below to play:',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🎮 Play!', web_app: { url: `${WEB_APP_URL}?games=${encodeURIComponent(JSON.stringify(storedGames))}` } }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error processing file:', error);
    await ctx.reply('❌ Error processing file. Please try again.');
  }
});

// Start bot
bot.launch().then(() => {
  console.log('Bot started successfully!');
}).catch((error) => {
  console.error('Failed to start bot:', error);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 