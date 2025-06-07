import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
from PIL import Image, ImageDraw
import io
from myg_parser import MYGParser

# Конфигурация логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Токен бота
BOT_TOKEN = "8189696941:AAH8zEr-jWjug4wtW5ziXwY1wPgh7GT6le8"

# Хранение игр в памяти (в продакшене использовать базу данных)
games = {}

# Цвета для отображения
COLORS = {
    0: (255, 255, 255),  # белый
    1: (0, 0, 0),        # черный
    2: (255, 0, 0),      # красный
    3: (0, 255, 0),      # зеленый
    4: (0, 0, 255),      # синий
    5: (255, 255, 0)     # желтый
}

class Game:
    def __init__(self, name, description, file_id, parser):
        self.name = name
        self.description = description
        self.author = parser.metadata.get('author', 'Неизвестный автор')
        self.version = parser.metadata.get('version', '1.0')
        self.file_id = file_id
        self.parser = parser
        self.display = parser.display
        self.variables = parser.variables
        self.controls = parser.controls

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отправляет приветственное сообщение при команде /start."""
    await update.message.reply_text(
        'Добро пожаловать в MYourGame! Отправьте мне файл .mygt, чтобы добавить новую игру в каталог.'
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отправляет сообщение с помощью при команде /help."""
    await update.message.reply_text(
        'MYourGame Bot - Помощь:\n'
        '/start - Начать работу с ботом\n'
        '/help - Показать это сообщение\n'
        '/catalog - Показать каталог игр\n'
        '/filter [all/32x32] - Фильтровать игры\n'
        'Отправьте .mygt файл, чтобы добавить новую игру'
    )

async def handle_game_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обрабатывает входящие файлы игр."""
    file = update.message.document
    if not file.file_name.endswith('.mygt'):
        await update.message.reply_text('Пожалуйста, отправьте файл .mygt.')
        return

    # Получаем содержимое файла
    file_obj = await context.bot.get_file(file.file_id)
    file_content = await file_obj.download_as_bytearray()
    content = file_content.decode('utf-8')

    # Парсим MYG файл
    parser = MYGParser()
    parser.parse(content)
    game_info = parser.get_game_info()

    # Создаем и сохраняем игру
    game = Game(
        game_info['name'],
        game_info['description'],
        file.file_id,
        parser
    )
    games[file.file_id] = game

    await update.message.reply_text(
        f'Игра "{game.name}" добавлена в каталог!\n'
        f'Автор: {game.author}\n'
        f'Версия: {game.version}'
    )

async def show_catalog(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показывает каталог игр."""
    if not games:
        await update.message.reply_text('В каталоге пока нет игр.')
        return

    # Получаем фильтр из контекста
    filter_type = context.user_data.get('filter', 'all')
    
    keyboard = []
    for game_id, game in games.items():
        if filter_type == 'all' or (filter_type == '32x32' and game.display):
            keyboard.append([InlineKeyboardButton(
                f"{game.name} - {game.description}",
                callback_data=f"game_{game_id}"
            )])

    # Добавляем кнопки фильтрации
    filter_buttons = [
        InlineKeyboardButton("Все игры", callback_data="filter_all"),
        InlineKeyboardButton("32x32", callback_data="filter_32x32")
    ]
    keyboard.append(filter_buttons)

    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text('Каталог игр:', reply_markup=reply_markup)

async def handle_game_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обрабатывает выбор игры из каталога."""
    query = update.callback_query
    await query.answer()

    if query.data.startswith('filter_'):
        # Обработка фильтра
        filter_type = query.data.split('_')[1]
        context.user_data['filter'] = filter_type
        await show_catalog(update, context)
        return

    game_id = query.data.split('_')[1]
    game = games.get(game_id)
    if not game:
        await query.edit_message_text('Игра не найдена.')
        return

    # Создаем игровой дисплей
    img = Image.new('RGB', (320, 320), color='white')
    draw = ImageDraw.Draw(img)
    
    # Рисуем 32x32 сетку
    for i in range(32):
        for j in range(32):
            color_value = game.display[i][j]
            if color_value in COLORS:
                draw.rectangle(
                    [j*10, i*10, (j+1)*10, (i+1)*10],
                    fill=COLORS[color_value]
                )

    # Конвертируем в байты
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)

    # Создаем кнопки управления
    control_buttons = []
    for control in game.controls:
        control_buttons.append(InlineKeyboardButton(
            control['icon'],
            callback_data=f"control_{game_id}_{control['action']}"
        ))

    # Создаем отображение переменных
    var_text = "\n".join([f"{k}: {v}" for k, v in game.variables.items()])

    # Отправляем игровой дисплей с управлением
    await query.message.reply_photo(
        photo=img_byte_arr,
        caption=f"Игра: {game.name}\n"
                f"Описание: {game.description}\n"
                f"Автор: {game.author}\n"
                f"Версия: {game.version}\n\n"
                f"Переменные:\n{var_text}",
        reply_markup=InlineKeyboardMarkup([control_buttons])
    )

def main():
    """Запускает бота."""
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()

    # Добавляем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("catalog", show_catalog))
    application.add_handler(MessageHandler(filters.Document.ALL, handle_game_file))
    application.add_handler(CallbackQueryHandler(handle_game_selection))

    # Запускаем бота
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main() 