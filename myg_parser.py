class MYGParser:
    def __init__(self):
        self.metadata = {}
        self.variables = {}
        self.controls = []
        self.display = [[0 for _ in range(32)] for _ in range(32)]
        self.colors = {
            'black': 1,
            'white': 0,
            'red': 2,
            'green': 3,
            'blue': 4,
            'yellow': 5
        }

    def parse(self, content):
        """Parse MYG file content."""
        lines = content.split('\n')
        current_section = None

        for line in lines:
            line = line.strip()
            if not line or line.startswith('//'):
                continue

            if line.startswith('@'):
                current_section = line[1:].lower()
                continue

            if current_section == 'game':
                self._parse_metadata(line)
            elif current_section == 'vars':
                self._parse_variables(line)
            elif current_section == 'buttons':
                self._parse_controls(line)
            elif current_section == 'screen':
                self._parse_display(line)

    def _parse_metadata(self, line):
        """Parse game metadata section."""
        if '=' in line:
            key, value = line.split('=', 1)
            self.metadata[key.strip()] = value.strip()

    def _parse_variables(self, line):
        """Parse variables section."""
        if '=' in line:
            name, value = line.split('=', 1)
            try:
                # Try to convert to number if possible
                value = int(value.strip())
            except ValueError:
                value = value.strip()
            self.variables[name.strip()] = value

    def _parse_controls(self, line):
        """Parse controls section."""
        if ':' in line:
            action, config = line.split(':', 1)
            parts = config.split(',')
            if len(parts) >= 2:
                control = {
                    'action': action.strip(),
                    'position': parts[0].strip(),
                    'icon': parts[1].strip(),
                    'color': parts[2].strip() if len(parts) > 2 else 'default'
                }
                self.controls.append(control)

    def _parse_display(self, line):
        """Parse display section."""
        if ':' in line:
            coords, color = line.split(':', 1)
            try:
                x, y = map(int, coords.split(','))
                color = color.strip().lower()
                if 0 <= x < 32 and 0 <= y < 32:
                    self.display[y][x] = self.colors.get(color, 1)
            except ValueError:
                pass

    def get_game_info(self):
        """Get parsed game information."""
        return {
            'name': self.metadata.get('name', 'Без названия'),
            'description': self.metadata.get('description', 'Нет описания'),
            'author': self.metadata.get('author', 'Неизвестный автор'),
            'version': self.metadata.get('version', '1.0'),
            'variables': self.variables,
            'controls': self.controls,
            'display': self.display
        } 