# Barcode Reader - Electron App

A professional barcode scanner application built with **Electron** and **ZXing** library (Google ML Kit compatible technology).

## Features

✨ **Real-time Barcode Scanning** - Scan barcodes instantly using your camera  
📷 **Camera Control** - Start, stop, and switch between cameras  
🎯 **Multi-Format Support** - Detects all major barcode formats:
- QR Code
- EAN-13, EAN-8
- UPC-A, UPC-E
- Code 39, 93, 128
- ITF, Codabar
- Data Matrix, PDF417, Aztec
- And more!

📋 **Copy to Clipboard** - One-click copy of barcode data  
🔍 **Web Search** - Instantly search barcode content on Google  
📊 **Scan History** - Keep track of all scanned barcodes  
💾 **Persistent Storage** - History saved locally  
🔊 **Audio Feedback** - Beep sound on successful scan  
🎨 **Modern UI** - Beautiful gradient design with smooth animations

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the application:**
   ```bash
   npm start
   ```

## Development

```bash
# Start in development mode
npm run dev
```

## Building

To package the application for distribution:

```bash
# Install electron-builder
npm install --save-dev electron-builder

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

## Usage

1. Click **"Start Camera"** to activate your webcam
2. Position a barcode within the green scanning frame
3. The barcode will be automatically detected and displayed
4. Use the buttons to:
   - **Copy** - Copy barcode text to clipboard
   - **Search** - Search the barcode on Google
   - **Switch Camera** - Toggle between available cameras
5. View your scan history in the right panel
6. Clear history when needed

## Technologies Used

- **Electron** - Cross-platform desktop framework
- **ZXing** - Barcode scanning library (ML Kit compatible)
- **HTML/CSS/JavaScript** - Frontend technologies
- **Web APIs** - MediaDevices, LocalStorage

## Supported Platforms

- ✅ Windows
- ✅ macOS
- ✅ Linux

## Camera Permissions

The app requires camera access. You'll be prompted to allow camera permissions when you first start scanning.

## Troubleshooting

**Camera not working?**
- Make sure your camera is connected and not being used by another application
- Check camera permissions in your system settings
- Try switching cameras if you have multiple devices

**No barcodes detected?**
- Ensure good lighting conditions
- Hold the barcode steady within the frame
- Try adjusting the distance from the camera

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ using Google's ML Kit technology
