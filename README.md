
# UtopiaSMPStatus Discord Bot

A simple Discord bot that provides real-time Minecraft server status for UtopiaSMP using the `minecraft-server-util` module. It is guild specific.

## Features

- Fetches Minecraft server status (online/offline, player count, MOTD) and displays it in Discord.
- Commands available:
  - `/status` - Shows current server status.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PerOdin/UtopiaSMPStatus.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file**:
   ```plaintext
   DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
   SERVER_IP=YOUR_SERVER_IP
   SERVER_PORT=YOUR_SERVER_PORT
   GUILD_ID=YOUR_GUILD_ID
   ```

4. **Start the bot**:
   ```bash
   npm bot.js
   ```

## Contributing

Feel free to use and modify the code. Contributions are welcome!

## License

This project is licensed under the MIT License.

---

You can provide more specific details about any additional setup or usage instructions if needed.
