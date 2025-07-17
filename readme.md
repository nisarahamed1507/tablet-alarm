# Tablet Alarm - Medication Reminder App

A comprehensive medication management application designed for tablets with touch-friendly interface, voice commands, and intelligent reminders.

## Features

### Core Features
- **User Authentication**: Login/Signup with username (default password: 12345)
- **Medication Management**: Add, edit, delete medications with images
- **Smart Reminders**: Customizable alarms with 5-minute snooze (max 3 times)
- **Voice Commands**: Voice input and recognition (English and Indian languages)
- **Calendar Integration**: Doctor appointments and medication schedules
- **Exercise Tracking**: Manage fitness routines and track progress
- **AI Assistant**: Chat-based help system (Gemini AI ready)
- **Data Export/Import**: JSON and CSV format support

### Technical Features
- **Touch-Optimized**: Designed for tablet interfaces
- **Offline-First**: Uses localStorage for data persistence
- **Family Sharing**: Multiple users can share data via usernames
- **Responsive Design**: Works on different screen sizes
- **No Framework Dependencies**: Pure HTML, CSS, JavaScript

## Quick Start

### Option 1: Using VS Code Live Server (Recommended)
1. Open the project folder in VS Code
2. Install "Live Server" extension
3. Right-click on `index.html` and select "Open with Live Server"
4. The app will open at `http://localhost:5500`

### Option 2: Using Python
```bash
cd c:\Users\sknik\Desktop\tablet
python -m http.server 8000
```
Then open `http://localhost:8000`

### Option 3: Using Node.js
```bash
npm install -g http-server
cd c:\Users\sknik\Desktop\tablet
http-server
```

## File Structure

```
tablet/
├── index.html              # Login page
├── signup.html             # User registration
├── dashboard.html          # Main dashboard
├── add-medication.html     # Add/edit medications
├── calendar.html           # Calendar view
├── exercise.html           # Exercise management
├── ai-chat.html           # AI assistant chat
├── debug-test.html        # Debug testing page
├── css/
│   └── styles.css         # Main stylesheet
├── js/
│   ├── auth.js            # Authentication system
│   ├── storage.js         # Data storage management
│   ├── dashboard.js       # Dashboard functionality
│   ├── medication.js      # Medication management
│   ├── notifications.js   # Alarm and notification system
│   ├── calendar.js        # Calendar functionality
│   ├── exercise.js        # Exercise management
│   ├── voice.js           # Voice recognition
│   └── ai-chat.js         # AI assistant
└── readme.md              # This file
```

## Usage Guide

### Getting Started
1. Open the app in your browser
2. Create a new account or login with existing username
3. Default password for all users: `12345`

### Adding Medications
1. Click "Add Medication" on the dashboard
2. Fill in medication details:
   - Medicine name
   - Dosage amount and unit
   - Frequency (1-6 times per day)
   - Start and end dates
   - Instructions
3. Upload a photo (optional)
4. Use voice input for medication names
5. Save the medication

### Setting Reminders
- Reminders are automatically set based on frequency
- Default times are suggested but can be customized
- Alarms will sound at scheduled times
- Snooze: 5 minutes (maximum 3 times)
- Alarm duration: 30 seconds

### Managing Alarms
- **Mark as Taken**: Records successful dose
- **Mark as Missed**: Records missed dose
- **Snooze**: Delays alarm by 5 minutes
- **Stop**: Stops current alarm

### Voice Commands
- "Take medicine [name]"
- "Mark [name] as taken"
- "Show my medications"
- "Add reminder for [name]"
- Voice input works on HTTPS or localhost

### Data Export/Import
1. Go to dashboard settings
2. Export data as JSON or CSV
3. Import previously exported data
4. Data includes medications, exercises, appointments, and history

## Troubleshooting

### Common Issues

**Login/Logout not working:**
- Check browser console for JavaScript errors
- Ensure all script files are loading properly
- Try refreshing the page

**Medications not saving:**
- Verify you're logged in
- Check localStorage permissions
- Use debug-test.html to test storage

**Voice commands not working:**
- Use HTTPS or localhost (not file://)
- Allow microphone permissions
- Chrome/Edge recommended for voice features

**Notifications not showing:**
- Allow notification permissions
- Check browser notification settings
- Ensure app is running on localhost/HTTPS

**Upload prescription not working:**
- File size should be under 5MB
- Supported formats: JPG, PNG, GIF
- Check browser file permissions

### Debug Mode
Open `debug-test.html` in your browser to:
- Test authentication functions
- Verify storage operations
- Check system status
- Clear all data (if needed)

### Browser Compatibility
- **Chrome/Edge**: Full features including voice
- **Firefox**: Most features, limited voice support
- **Safari**: Basic features, limited voice
- **Mobile**: Touch-optimized interface

## Settings and Configuration

### Default Settings
- Alarm duration: 30 seconds
- Snooze interval: 5 minutes
- Maximum snoozes: 3
- Default password: 12345

### Customization
- Alarm tones: Can be added to assets/sounds/
- Icons: Can be customized in assets/icons/
- Themes: Modify CSS variables in styles.css

## Data Storage

### Local Storage
- All data stored in browser's localStorage
- Automatic backup on data changes
- No external database required

### Data Structure
```json
{
  "users": [
    {
      "username": "user1",
      "password": "12345",
      "medications": [...],
      "exercises": [...],
      "appointments": [...],
      "medicationHistory": [...]
    }
  ],
  "currentUser": "user1",
  "appSettings": {...}
}
```

### Family Sharing
- Multiple users can use same username
- Data is shared between family members
- Privacy maintained through user accounts

## Deployment

### Production Deployment
1. **Netlify**: Drag and drop the entire folder
2. **Vercel**: Connect to GitHub repository
3. **GitHub Pages**: Push to GitHub and enable Pages
4. **Any Static Host**: Upload all files to web server

### HTTPS Requirement
For full functionality (voice, notifications), deploy to HTTPS:
- Voice recognition requires secure context
- Notifications work better with HTTPS
- File uploads more reliable on HTTPS

## Future Enhancements

### AI Integration
- Gemini AI integration ready in ai-chat.js
- Add API key and endpoints for live AI
- Enhanced health advice and interactions

### Backend Integration
- Database connection points available
- API endpoints can be added
- User authentication can be upgraded

### Mobile App
- Cordova/PhoneGap wrapper ready
- Native notifications possible
- App store deployment prepared

## Support

### Getting Help
1. Check the debug-test.html page
2. Review browser console for errors
3. Verify all files are in correct locations
4. Test with different browsers

### Known Limitations
- Voice recognition requires internet
- File uploads limited by browser storage
- No server-side backup (localStorage only)
- Limited to modern browsers

## License

This project is created for personal and educational use. Feel free to modify and distribute as needed.

## Version History

- **v1.0**: Initial release with all core features
- **v1.1**: Added debug testing and improved error handling
- **v1.2**: Enhanced voice commands and AI assistant