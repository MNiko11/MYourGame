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

// Games storage
const GAMES_DIR = path.join(__dirname, '../../games');

// Ensure games directory exists
if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR, { recursive: true });
}

// Command handlers
bot.command('start', async (ctx) => {
  await ctx.reply(
    '👋 Привет! Я бот для YourGame мини-приложения.\n\n' +
    'Отправь мне файл игры в формате .mygt, и я добавлю его в каталог игр.\n\n' +
    'Формат файла должен соответствовать документации MYG языка.'
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
    '   clear - Очистка сетки\n\n' +
    '3. Управление:\n' +
    '   button "name" { ... } - Определение кнопки\n\n' +
    '4. Игровой цикл:\n' +
    '   loop { ... } - Основной цикл\n' +
    '   update - Обновление состояния\n' +
    '   draw - Отрисовка состояния'
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
    // Get file info
    const fileInfo = await ctx.telegram.getFile(file.file_id);
    const filePath = path.join(GAMES_DIR, file.file_name);

    // Download file
    const response = await fetch(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Validate file content
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!validateGameFile(content)) {
      fs.unlinkSync(filePath);
      await ctx.reply('❌ Файл не соответствует формату MYG языка');
      return;
    }

    await ctx.reply('✅ Игра успешно добавлена в каталог!');
  } catch (error) {
    console.error('Error processing file:', error);
    await ctx.reply('❌ Произошла ошибка при обработке файла');
  }
});

// Validate game file content
function validateGameFile(content: string): boolean {
  const requiredSections = ['var', 'display', 'button', 'loop'];
  const lines = content.split('\n');
  
  // Check for required sections
  const hasRequiredSections = requiredSections.every(section =>
    lines.some(line => line.includes(section))
  );

  if (!hasRequiredSections) return false;

  // Basic syntax validation
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#')) continue;
    if (!trimmedLine) continue;

    // Validate variable declarations
    if (trimmedLine.startsWith('var ')) {
      if (!/^var\s+\w+\s*=\s*\d+$/.test(trimmedLine)) return false;
    }
    // Validate grid operations
    else if (trimmedLine.startsWith('set ')) {
      if (!/^set\s+\d+\s*,\s*\d+\s*,\s*\d+$/.test(trimmedLine)) return false;
    }
    // Validate button declarations
    else if (trimmedLine.startsWith('button ')) {
      if (!/^button\s+"[^"]+"\s*{$/.test(trimmedLine)) return false;
    }
  }

  return true;
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