import 'dotenv/config';

import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize bot with your token
const bot = new Telegraf(process.env.BOT_TOKEN || '');

// Games storage (in-memory for now)
interface StoredGame {
  id: string;
  title: string;
  description: string;
  format: 'all' | '32x32'; // Assuming 32x32 for now based on context
  code: string; // The full MYG game code
}

const storedGames: StoredGame[] = [];
const GAMES_DIR = path.join(__dirname, '../../games'); // This directory is not used for in-memory storage, but kept for context.

// Ensure games directory exists (not strictly needed for in-memory, but harmless)
if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR, { recursive: true });
}

// Command handlers
bot.command('start', async (ctx) => {
  const gamesJson = encodeURIComponent(JSON.stringify(storedGames));
  await ctx.reply(
    '👋 Привет! Я бот для MYourGame мини-приложения.\n\n' +
    'Отправь мне файл игры в формате .mygt, и я добавлю его в каталог игр.\n\n' +
    'Нажми кнопку ниже, чтобы открыть мини-приложение!',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Open MYourGame', web_app: { url: process.env.WEB_APP_URL + `?startapp=${gamesJson}` || 'https://mniko11.github.io/MYourGame/' } }]
        ]
      }
    }
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    '📖 Справка по использованию бота:\n\n' +
    '1. Создайте игру используя MYG язык программирования\n' +
    '2. Сохраните файл с расширением .mygt\n' +
    '3. Отправьте файл мне\n' +
    '4. После проверки игра будет добавлена в каталог\n\n' +
    'Для просмотра документации MYG языка используйте команду /docs'
  );
});

bot.command('docs', async (ctx) => {
  await ctx.reply(
    '📚 Документация MYG языка:\n\n' +
    '1. Переменные:\n' +
    '   var name = value - Объявление переменной\n' +
    '   display var1, var2 - Отображение переменных\n\n' +
    '2. Сетка (32x32):\n' +
    '   set x,y,value - Установка значения ячейки\n' +
    '   get x,y - Получение значения ячейки\n' +
    '   clear - Очистка сетки (не реализовано пока)\n\n' +
    '3. Управление:\n' +
    '   button "name" { ... } - Определение кнопки\n\n' +
    '4. Игровой цикл:\n' +
    '   loop { ... } - Основной цикл\n' +
    '   update - Обновление состояния (внутреннее)\n' +
    '   draw - Отрисовка состояния (внутреннее)\n' +
    '   stop - Остановка игры\n'+ 
    '5. Условные выражения:\n' +
    '   if condition { ... } - Условие ИФ\n' +
    '   else if condition { ... } - Условие ЭЛСИФ\n' +
    '   else { ... } - Условие ЭЛС\n'+ 
    '6. Встроенные функции:\n' +
    '   random(min, max) - Случайное число\n' +
    '   snake_x, snake_y - Координаты головы змейки (только для snake)'
  );
});

// Handle .mygt files
bot.on(message('document'), async (ctx) => {
  const file = ctx.message.document;
  
  if (!file.file_name?.endsWith('.mygt')) {
    await ctx.reply('❌ Пожалуйста, отправьте файл с расширением .mygt');
    return;
  }

  try {
    const fileInfo = await ctx.telegram.getFile(file.file_id);
    const downloadUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;
    const response = await fetch(downloadUrl);
    const contentBuffer = await response.arrayBuffer();
    const content = Buffer.from(contentBuffer).toString('utf-8');

    const gameData = parseAndValidateMygGame(content);

    if (!gameData) {
      await ctx.reply('❌ Файл не соответствует формату MYG языка или не содержит необходимых метаданных.');
      return;
    }

    // Assign a unique ID (for simplicity, using a timestamp)
    gameData.id = `game_${Date.now()}`;
    storedGames.push(gameData);

    await ctx.reply(`✅ Игра "${gameData.title}" успешно добавлена в каталог!`);
  } catch (error) {
    console.error('Error processing file:', error);
    await ctx.reply('❌ Произошла ошибка при обработке файла');
  }
});

// Parse and validate game file content, extracting metadata
function parseAndValidateMygGame(content: string): StoredGame | null {
  const lines = content.split('\n');
  let title = 'Untitled Game';
  let description = 'No description provided.';
  let foundTitle = false;
  let descriptionLines: string[] = [];
  let inCommentsAfterTitle = false;

  // Basic validation checks
  const requiredSections = ['var', 'display', 'button', 'loop'];
  const hasRequiredSections = requiredSections.every(section =>
    lines.some(line => line.includes(section))
  );
  if (!hasRequiredSections) return null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('#')) {
      if (trimmedLine.startsWith('# ')) {
        const commentContent = trimmedLine.substring(2).trim();
        if (!foundTitle) {
          title = commentContent;
          foundTitle = true;
          inCommentsAfterTitle = true;
        } else if (inCommentsAfterTitle) {
          descriptionLines.push(commentContent);
        }
      }
    } else {
      if (inCommentsAfterTitle && descriptionLines.length > 0) {
        description = descriptionLines.join(' ');
      }
      inCommentsAfterTitle = false;

      // Basic syntax validation
      if (trimmedLine.startsWith('var ')) {
        if (!/^var\\s+\\w+\\s*=\\s*\\d+$/.test(trimmedLine)) return null;
      } else if (trimmedLine.startsWith('set ')) {
        if (!/^set\\s+[\\w\\d\\+\\-\\*\\/\\s(),]+\\s*,\\s*[\\w\\d\\+\\-\\*\\/\\s(),]+\\s*,\\s*[\\w\\d\\+\\-\\*\\/\\s(),]+$/.test(trimmedLine)) return null;
      } else if (trimmedLine.startsWith('button ')) {
        if (!/^button\\s+"[^"]+"\\s*{\/?$/.test(trimmedLine)) return null; // Added /? for optional closing brace on same line
      } else if (trimmedLine.startsWith('display ')) {
        if (!/^display\\s+[\\w\\d\\s,]+$/.test(trimmedLine)) return null;
      } else if (trimmedLine === 'loop {' || trimmedLine === '}' || trimmedLine === 'stop' || trimmedLine === 'update' || trimmedLine === 'draw') {
        // Valid control flow or loop commands
      } else if (trimmedLine.startsWith('if ') || trimmedLine.startsWith('else if ') || trimmedLine === 'else {') {
        if (!trimmedLine.endsWith('{')) return null; // Ensure if/else if/else blocks start with {
      } else {
        // Unknown command or invalid syntax
        // For stricter validation, could return null here.
        // For now, we allow unknown lines if they don't break expected patterns.
      }
    }
  }

  // Ensure description is captured if comments end before non-comment line
  if (inCommentsAfterTitle && descriptionLines.length > 0) {
    description = descriptionLines.join(' ');
  }

  // Simple validation for description length and content
  if (description.length > 100) {
    description = description.substring(0, 97) + '...';
  }

  return {
    id: '', // Will be assigned by the bot after successful parse
    title: title,
    description: description,
    format: '32x32', // Defaulting for now
    code: content,
  };
}

// Start bot
bot.launch().then(() => {
  console.log('Bot started successfully');
}).catch((error) => {
  console.error('Error starting bot:', error);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 