# 🏆 BlockX - Reinventing Vehicle Trust with Blockchain
## Colosseum Cyberpunk Hackathon Submission

[![Deploy Backend](https://img.shields.io/badge/Deploy-Backend-blue)](https://block-x-two.vercel.app)
[![Deploy Frontend](https://img.shields.io/badge/Deploy-Frontend-green)](https://trivexachain.netlify.app)
[![Blockchain](https://img.shields.io/badge/Blockchain-Solana-purple)](https://explorer.solana.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 Project Overview

**BlockX** is a revolutionary blockchain-powered vehicle marketplace that prevents odometer fraud and ensures vehicle authenticity through immutable blockchain records and IoT device integration.

### 🏅 Hackathon Category
**Cyberpunk Track** - Building the future of decentralized vehicle commerce with anti-fraud technology

### 🌟 Key Innovation
- **Real-time fraud detection** using blockchain and IoT sensors
- **Immutable vehicle history** on Solana blockchain
- **Decentralized document storage** on Arweave
- **Multi-role ecosystem** for all vehicle stakeholders

---

## 🚀 Live Demo

| Service | URL | Status |
|---------|-----|--------|
| Frontend | [trivexachain.netlify.app](https://trivexachain.netlify.app) | ✅ Live |
| Backend API | [block-x-two.vercel.app](https://block-x-two.vercel.app) | ✅ Live |
| Blockchain | [Solana Explorer](https://explorer.solana.com) | ✅ Live |

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB
- **Blockchain**: Solana
- **Storage**: Arweave
- **IoT**: ESP32 + EC200U
- **Deployment**: Vercel (Backend) + Netlify (Frontend)

### System Components
1. **Web Application** - React-based frontend for user interactions
2. **REST API** - Node.js backend for business logic
3. **Blockchain Integration** - Solana for immutable records
4. **IoT Device** - ESP32 for real-time data collection
5. **Document Storage** - Arweave for decentralized file storage

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/BlockX-Hackathon.git
   cd BlockX-Hackathon
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend environment
   cd ../frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the application**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm run dev
   ```

### ESP32 Setup
1. Open `esp32Code/ESP32_EC200U_Backend_TCP/ESP32_EC200U_Backend_TCP.ino` in Arduino IDE
2. Install required libraries
3. Configure WiFi and server settings
4. Upload to ESP32

---

## 📁 Project Structure

```
BlockX-Hackathon/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── middleware/         # Express middleware
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── store/          # State management
├── esp32Code/              # IoT device code
│   └── ESP32_EC200U_Backend_TCP/
└── ODOCHAIN/              # Documentation and diagrams
```

---

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### ESP32 Development
1. Install Arduino IDE
2. Install ESP32 board package
3. Install required libraries:
   - WiFi
   - HTTPClient
   - ArduinoJson
4. Configure and upload code

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Vehicle Endpoints
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Create new vehicle
- `GET /api/vehicles/:id` - Get vehicle by ID
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Blockchain Endpoints
- `POST /api/blockchain/record` - Record data on blockchain
- `GET /api/blockchain/verify` - Verify blockchain data

For detailed API documentation, see [CURL_EXAMPLES.md](backend/src/docs/CURL_EXAMPLES.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🏆 Hackathon Details

**Event**: Colosseum Cyberpunk Hackathon  
**Track**: Cyberpunk  
**Team**: [Your Team Name]  
**Submission Date**: [Date]  

### Problem Statement
Vehicle odometer fraud is a major issue in the automotive industry, costing billions annually. Traditional methods of tracking vehicle history are easily manipulated.

### Solution
BlockX leverages blockchain technology and IoT devices to create an immutable, tamper-proof vehicle history system that prevents fraud and builds trust in the marketplace.

### Key Features Implemented
- ✅ Blockchain-based vehicle history
- ✅ IoT device integration
- ✅ Real-time fraud detection
- ✅ Decentralized document storage
- ✅ Multi-role user system
- ✅ Mobile-responsive web interface

---

## 🔗 Links

- [Live Demo](https://trivexachain.netlify.app)
- [Backend API](https://block-x-two.vercel.app)
- [GitHub Repository](https://github.com/yourusername/BlockX-Hackathon)
- [Hackathon Submission](https://hackathon-link.com)

---

## 📞 Contact

- **Team**: [Your Team Name]
- **Email**: [your-email@example.com]
- **GitHub**: [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- Solana Foundation for blockchain infrastructure
- Arweave for decentralized storage
- ESP32 community for IoT development resources
- React and Node.js communities for excellent documentation
