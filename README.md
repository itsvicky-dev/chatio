# 🚀 Convo - Advanced Real-Time Chat Application

<div align="center">

![Convo Logo](https://via.placeholder.com/150x150/6366f1/ffffff?text=CONVO)

**The most beautiful and feature-rich chat application built with modern web technologies**

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.8.5-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)

</div>

## ✨ Features

### 🎯 **Core Features**
- **Real-time messaging** with instant delivery
- **Voice messages** with audio recording
- **File sharing** (images, videos, documents)
- **Group chats** with admin controls
- **Stories/Status** updates like Instagram
- **Message reactions** and replies
- **Typing indicators** and read receipts
- **Search functionality** across messages and contacts

### 🎨 **UI/UX Excellence**
- **Beautiful modern design** with Tailwind CSS
- **Smooth animations** powered by Framer Motion
- **Dark/Light theme** with auto-detection
- **Mobile-responsive** design
- **Collapsible sidebar** for better UX
- **Glass morphism** effects
- **Custom gradients** and animations

### 🔧 **Technical Features**
- **WebRTC support** for video/audio calls
- **JWT authentication** with secure sessions
- **File upload** with Cloudinary integration
- **Real-time notifications** with toast messages
- **State management** with Zustand
- **Type-safe** development with TypeScript
- **Performance optimized** with virtual scrolling

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (18+ recommended)
- **MongoDB** (local or cloud)
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd convo
```

### 2. Install Dependencies

**Server Dependencies:**
```bash
cd server
npm install
```

**Client Dependencies:**
```bash
cd ../client
npm install --legacy-peer-deps
```

### 3. Environment Configuration

**Server Environment (.env):**
```bash
# Copy example environment file
cd server
cp .env.example .env
```

Edit the `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/convo-chat
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

**Client Environment (.env):**
```bash
# Copy example environment file
cd ../client
cp .env.example .env
```

Edit the `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

### 4. Start the Applications

**Start the Server:**
```bash
cd server
npm run dev
```

**Start the Client:**
```bash
cd ../client
npm run dev
```

Visit `http://localhost:5173` to see the application! 🎉

## 📁 Project Structure

```
convo/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # React Components
│   │   │   ├── auth/       # Authentication
│   │   │   ├── chat/       # Chat Interface
│   │   │   ├── layout/     # Layout Components
│   │   │   ├── stories/    # Stories Feature
│   │   │   └── ui/         # UI Components
│   │   ├── providers/      # Context Providers
│   │   ├── store/          # State Management
│   │   └── hooks/          # Custom Hooks
│   ├── public/             # Static Assets
│   └── package.json
│
├── server/                 # Node.js Backend
│   ├── models/             # Database Models
│   ├── routes/             # API Routes
│   ├── middleware/         # Express Middleware
│   ├── socket/             # Socket.io Handlers
│   └── package.json
│
└── README.md
```

## 🚀 Features in Detail

### 💬 **Real-Time Messaging**
- Instant message delivery with Socket.io
- Message status indicators (sent, delivered, read)
- Message editing and deletion
- Reply to messages
- Message reactions with emojis

### 🎤 **Voice Messages**
- Record voice messages with WebRTC
- Audio playback with waveform visualization
- Compress audio for efficient transfer

### 📸 **Media Sharing**
- Upload images, videos, and documents
- Image preview and compression
- Cloudinary integration for cloud storage
- Drag and drop file upload

### 👥 **Group Chats**
- Create and manage group chats
- Admin controls and permissions
- Group member management
- Group settings and customization

### 📱 **Stories Feature**
- Share temporary status updates
- Image and video stories
- Story viewers tracking
- Auto-expiration after 24 hours

### 🔍 **Search Functionality**
- Search across all messages
- Filter by chat or contact
- Recent searches history
- Real-time search results

### 🎨 **Theming System**
- Beautiful dark and light themes
- Auto theme detection based on system preferences
- Smooth theme transitions
- Custom color schemes

## 🔧 Development

### Available Scripts

**Server:**
```bash
npm run dev        # Start development server with nodemon
npm start          # Start production server
npm run seed       # Seed database with sample data
```

**Client:**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks

## 📱 Mobile Support

The application is fully responsive and works beautifully on:
- 📱 Mobile phones (iOS/Android)
- 📟 Tablets
- 💻 Desktop computers
- 🖥️ Large screens

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Socket.io** for real-time communication
- **Tailwind CSS** for beautiful styling
- **Framer Motion** for smooth animations
- **Heroicons** for beautiful icons

## 📞 Support

If you need help or have questions:
- 📧 Email: support@convo.app
- 💬 Discord: [Join our community](https://discord.gg/convo)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

<div align="center">

**Made with ❤️ by the Convo Team**

[Website](https://convo.app) • [Documentation](https://docs.convo.app) • [Community](https://discord.gg/convo)

</div>