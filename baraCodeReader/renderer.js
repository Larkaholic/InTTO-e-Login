const { BrowserMultiFormatReader, NotFoundException } = require('@zxing/library');

class BarcodeScanner {
    constructor() {
        this.codeReader = new BrowserMultiFormatReader();
        this.selectedDeviceId = null;
        this.videoInputDevices = [];
        this.currentDeviceIndex = 0;
        this.scanHistory = [];
        this.isScanning = false;
        
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.resultsDiv = document.getElementById('results');
        this.historyDiv = document.getElementById('history');
        
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.switchBtn = document.getElementById('switchBtn');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHistory();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startScanning());
        this.stopBtn.addEventListener('click', () => this.stopScanning());
        this.switchBtn.addEventListener('click', () => this.switchCamera());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    async startScanning() {
        try {
            this.startBtn.disabled = true;
            this.startBtn.textContent = '⏳ Starting...';

            // Get video input devices
            this.videoInputDevices = await this.codeReader.listVideoInputDevices();
            
            if (this.videoInputDevices.length === 0) {
                this.showError('No camera devices found');
                return;
            }

            console.log('Found devices:', this.videoInputDevices);

            // Use first device by default
            this.selectedDeviceId = this.videoInputDevices[this.currentDeviceIndex].deviceId;

            // Start decoding from video device
            await this.codeReader.decodeFromVideoDevice(
                this.selectedDeviceId,
                this.video,
                (result, error) => {
                    if (result) {
                        this.handleBarcodeDetected(result);
                    }
                    if (error && !(error instanceof NotFoundException)) {
                        console.error('Decode error:', error);
                    }
                }
            );

            this.isScanning = true;
            this.startBtn.textContent = '📹 Start Camera';
            this.stopBtn.disabled = false;
            this.switchBtn.disabled = this.videoInputDevices.length <= 1;

        } catch (error) {
            console.error('Error starting camera:', error);
            this.showError(`Failed to start camera: ${error.message}`);
            this.startBtn.disabled = false;
            this.startBtn.textContent = '📹 Start Camera';
        }
    }

    stopScanning() {
        this.codeReader.reset();
        this.isScanning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.switchBtn.disabled = true;
        this.showNoResults();
    }

    async switchCamera() {
        if (this.videoInputDevices.length <= 1) return;

        this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.videoInputDevices.length;
        
        if (this.isScanning) {
            this.codeReader.reset();
            this.selectedDeviceId = this.videoInputDevices[this.currentDeviceIndex].deviceId;
            
            await this.codeReader.decodeFromVideoDevice(
                this.selectedDeviceId,
                this.video,
                (result, error) => {
                    if (result) {
                        this.handleBarcodeDetected(result);
                    }
                }
            );
        }
    }

    handleBarcodeDetected(result) {
        const barcodeData = {
            text: result.text,
            format: result.getBarcodeFormat(),
            timestamp: new Date().toLocaleString()
        };

        // Display current result
        this.displayResult(barcodeData);

        // Add to history (avoid duplicates)
        if (!this.scanHistory.some(item => item.text === barcodeData.text)) {
            this.scanHistory.unshift(barcodeData);
            this.saveHistory();
            this.displayHistory();
        }

        // Play sound effect
        this.playBeep();
    }

    displayResult(data) {
        const formatName = this.getFormatName(data.format);
        
        this.resultsDiv.innerHTML = `
            <div class="result-card success">
                <div class="result-header">
                    <span class="result-icon">✅</span>
                    <span class="result-format">${formatName}</span>
                </div>
                <div class="result-text">${this.escapeHtml(data.text)}</div>
                <div class="result-time">${data.timestamp}</div>
                <div class="result-actions">
                    <button onclick="navigator.clipboard.writeText('${this.escapeHtml(data.text)}')">
                        📋 Copy
                    </button>
                    <button onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(data.text)}', '_blank')">
                        🔍 Search
                    </button>
                </div>
            </div>
        `;
    }

    displayHistory() {
        if (this.scanHistory.length === 0) {
            this.historyDiv.innerHTML = '<p class="no-history">No scan history</p>';
            return;
        }

        this.historyDiv.innerHTML = this.scanHistory.map((item, index) => `
            <div class="history-item">
                <div class="history-content">
                    <span class="history-format">${this.getFormatName(item.format)}</span>
                    <span class="history-text">${this.escapeHtml(item.text)}</span>
                    <span class="history-time">${item.timestamp}</span>
                </div>
                <button class="btn-delete" onclick="scanner.removeHistoryItem(${index})">🗑️</button>
            </div>
        `).join('');
    }

    removeHistoryItem(index) {
        this.scanHistory.splice(index, 1);
        this.saveHistory();
        this.displayHistory();
    }

    clearHistory() {
        if (confirm('Clear all scan history?')) {
            this.scanHistory = [];
            this.saveHistory();
            this.displayHistory();
        }
    }

    saveHistory() {
        localStorage.setItem('scanHistory', JSON.stringify(this.scanHistory));
    }

    loadHistory() {
        const saved = localStorage.getItem('scanHistory');
        if (saved) {
            this.scanHistory = JSON.parse(saved);
            this.displayHistory();
        }
    }

    showNoResults() {
        this.resultsDiv.innerHTML = `
            <div class="no-results">
                <p>No barcode detected yet</p>
                <p class="hint">Start camera and scan a barcode</p>
            </div>
        `;
    }

    showError(message) {
        this.resultsDiv.innerHTML = `
            <div class="result-card error">
                <div class="result-icon">❌</div>
                <div class="result-text">${message}</div>
            </div>
        `;
    }

    getFormatName(format) {
        const formats = {
            0: 'AZTEC',
            1: 'CODABAR',
            2: 'CODE_39',
            3: 'CODE_93',
            4: 'CODE_128',
            5: 'DATA_MATRIX',
            6: 'EAN_8',
            7: 'EAN_13',
            8: 'ITF',
            9: 'MAXICODE',
            10: 'PDF_417',
            11: 'QR_CODE',
            12: 'RSS_14',
            13: 'RSS_EXPANDED',
            14: 'UPC_A',
            15: 'UPC_E',
            16: 'UPC_EAN_EXTENSION'
        };
        return formats[format] || 'UNKNOWN';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    playBeep() {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

// Initialize scanner when DOM is ready
let scanner;
document.addEventListener('DOMContentLoaded', () => {
    scanner = new BarcodeScanner();
});
