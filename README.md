# 🕌 اذكاري (Adhkariy) - Islamic Adhkar Reminder Extension

<div align="center">

**اذكر الله بأذكارك المناسبة طوال يومك**

_Remember Allah with appropriate adhkar throughout your day_

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/Chrome-Extension-yellow.svg)

</div>

---

## 📖 About

**Adhkariy** is a Chrome extension that helps Muslims maintain their daily remembrance of Allah (dhikr) by displaying beautiful, non-intrusive notifications with authentic Islamic supplications throughout the day. The extension intelligently shows different adhkar based on the time of day (morning, evening, or general) and includes the Arabic text, repetition count, and the virtue of each dhikr.

## ✨ Features

### 🎯 Core Features

- **⏰ Smart Time-Based Adhkar**: Automatically displays appropriate adhkar based on time:

  - 🌅 **Morning Adhkar** (5:00 AM - 9:00 AM)
  - 🌙 **Evening Adhkar** (4:00 PM - 7:00 PM)
  - ⭐ **General Adhkar** (All other times)

- **🎨 Beautiful Notifications**: Elegant, non-intrusive toast notifications that appear on any webpage
- **🔄 Customizable Intervals**: Set reminders every 10, 30, 60 minutes, or create your own custom interval
- **📱 Auto-Close Timer**: Notifications automatically close after a set duration (configurable)
- **⏸️ Pause/Resume**: Temporarily pause reminders when needed
- **🌓 Dark Mode Support**: Toggle between light and dark themes
- **✅ Category Selection**: Enable/disable specific adhkar categories (morning, evening, general)
- **🚫 Blocked Websites**: Block notifications on specific websites (e.g., during work or study)

### 📚 Content Features

- **70+ Authentic Adhkar**: Comprehensive collection from authentic Islamic sources
- **Arabic Text**: Complete with proper Arabic script and direction (RTL)
- **Repetition Count**: Shows how many times to recite each dhikr (🔁)
- **Virtues & Benefits**: Displays the reward and benefit of each dhikr
- **Title Labels**: Clear identification of each dhikr

## 🚀 Installation

### From Source (For Development)

1. **Clone or Download** this repository:

   ```bash
   git clone git@github.com:ali-bindohri/adhkariy-extension.git
   cd adhkariy-extension
   ```

2. **Open Chrome Extensions**:

   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the Extension**:

   - Click "Load unpacked"
   - Select the `adhkariy-extension` folder

4. **Start Using**:
   - Click the extension icon in your toolbar
   - Enable the reminder and configure your preferences

### From Chrome Web Store (Coming Soon)

_This extension will be available on the Chrome Web Store soon._

## 🎮 Usage

### Initial Setup

1. **Click the Extension Icon** in your Chrome toolbar
2. **Enable the Reminder** using the main toggle switch
3. **Set Your Interval** (default: 10 minutes)
4. **Customize Settings**:
   - Choose which categories to display (Morning/Evening/General)
   - Enable/disable auto-close
   - Set auto-close delay
   - Toggle dark mode
   - Block specific websites from showing notifications

### Managing Notifications

- **View Notification**: Beautiful toast appears in the top-right corner
- **Close Manually**: Click the ✕ button
- **Pause Reminders**: Use the pause toggle in settings
- **Test Notification**: Click "اختبر التذكير" to see a sample

### Blocking Websites

Don't want notifications on certain websites? You can easily block them:

1. **Open the Extension Popup**
2. **Scroll to "🚫 مواقع محظورة" (Blocked Websites)**
3. **Type the website** (e.g., `youtube.com`, `facebook.com`)
4. **Click "حظر" (Block)**
5. **To Unblock**: Click the ✕ button next to the site

**Examples of sites you might want to block:**

- 💼 Work: `docs.google.com`, `notion.so`, `slack.com`
- 🎬 Entertainment: `youtube.com`, `netflix.com`, `twitch.tv`
- 📚 Study: `coursera.org`, `udemy.com`, `khanacademy.org`
- 📱 Social: `facebook.com`, `twitter.com`, `instagram.com`

## 📂 Project Structure

```
adhkariy-extension/
├── manifest.json              # Extension configuration
├── background.js              # Service worker for alarms & logic
├── content-script.js          # Injects notifications into webpages
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup logic and settings
├── styles.css                 # Popup styles
├── adhkar-data.js            # Main data file (imports all adhkar)
├── morning-adhkar.js         # Morning supplications (23 adhkar)
├── evening-adhkar.js         # Evening supplications (21 adhkar)
├── general-adhkar.js         # General tasbeeh (23 adhkar)
├── icons/                    # Extension icons
│   ├── Adhkariy16.png
│   ├── Adhkariy32.png
│   ├── Adhkariy48.png
│   └── Adhkariy128.png
└── README.md                 # This file
```

## 🗂️ Data Structure

Each adhkar object follows this structure:

```javascript
{
  title: "Name/Title of the dhikr",
  arabic: "Arabic text of the supplication",
  repetition: "Number of times to repeat",
  why: "Virtue/benefit of this dhikr"
}
```

### Example:

```javascript
{
  title: "سبحان الله وبحمده",
  arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ.",
  repetition: "مائة مرة",
  why: "من قالها في يوم مائة مرة حطت خطاياه وإن كانت مثل زبد البحر."
}
```

## 🛠️ Technologies Used

- **JavaScript (ES6+)**: Modern JavaScript with modules
- **Chrome Extension API**: Manifest V3
- **Chrome Storage API**: For settings persistence
- **Chrome Alarms API**: For scheduled reminders
- **CSS3**: For beautiful UI styling
- **HTML5**: Semantic markup

## 🎨 Customization

### Modifying Adhkar Data

You can add or modify adhkar by editing the respective files:

- `morning-adhkar.js` - For morning supplications
- `evening-adhkar.js` - For evening supplications
- `general-adhkar.js` - For general dhikr

### Styling

Modify `styles.css` for popup styling or `content-script.js` for notification appearance.

## 🔧 Configuration Options

| Setting              | Default | Description                       |
| -------------------- | ------- | --------------------------------- |
| **Enabled**          | Off     | Master switch for all reminders   |
| **Interval**         | 10 min  | Time between reminders            |
| **Morning Adhkar**   | On      | Show morning supplications        |
| **Evening Adhkar**   | On      | Show evening supplications        |
| **General Adhkar**   | On      | Show general dhikr                |
| **Auto Close**       | On      | Automatically close notifications |
| **Auto Close Delay** | 10 sec  | Time before auto-closing          |
| **Dark Mode**        | Off     | Toggle dark theme                 |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 To-Do List

- [ ] Add more adhkar categories (After prayer, before sleep, etc.)
- [ ] Add keyboard shortcuts
- [ ] Add sound notifications option
- [ ] Multi-language support (English translations)
- [ ] Export/Import settings
- [ ] Statistics and tracking
- [ ] Publish to Chrome Web Store
- [ ] Firefox and Edge versions

## 🐛 Known Issues

- None reported yet! Please report any issues on GitHub.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💝 Acknowledgments

- Thanks to [IslamBook.com](https://www.islambook.com) for authentic adhkar content
- Thanks to [Azkarna.com](https://www.azkarna.com) for tasbeeh collection
- All praise is due to Allah (SWT)

## 📧 Contact

- **Author**: Your Name
- **Email**: your.email@example.com
- **GitHub**: [@yourusername](https://github.com/yourusername)

---

<div align="center">

**جَزَاكَ اللّهُ خَيْراً** (May Allah reward you with goodness)

If you find this extension beneficial, please:

- ⭐ Star this repository
- 🤲 Make dua for the developers
- 📢 Share with other Muslims

**وَاذْكُر رَّبَّكَ إِذَا نَسِيتَ**

</div>
