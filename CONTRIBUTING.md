# Contributing to BlockX

Thank you for your interest in contributing to BlockX! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Check if the issue already exists
2. Use the issue templates provided
3. Provide clear reproduction steps
4. Include relevant logs and screenshots

### Suggesting Enhancements

We welcome suggestions for new features and improvements. Please:
1. Check existing feature requests
2. Provide a clear description of the enhancement
3. Explain the use case and benefits
4. Consider implementation complexity

## 🚀 Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Git
- Arduino IDE (for ESP32 development)

### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/BlockX-Hackathon.git
   cd BlockX-Hackathon
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies
   npm install
   
   # Backend dependencies
   cd backend && npm install
   
   # Frontend dependencies
   cd ../frontend && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   # Backend (from backend directory)
   npm run dev
   
   # Frontend (from frontend directory)
   npm run dev
   ```

## 📝 Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer const over let, avoid var

### React Components
- Use functional components with hooks
- Follow the existing component structure
- Use TypeScript interfaces for props
- Implement proper error boundaries

### Backend API
- Follow RESTful conventions
- Use proper HTTP status codes
- Implement input validation
- Add comprehensive error handling
- Write unit tests for new features

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run all tests
npm run test:all
```

### Writing Tests
- Write unit tests for new features
- Test both success and error cases
- Maintain good test coverage
- Use descriptive test names

## 📋 Pull Request Process

### Before Submitting
1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

### Pull Request Guidelines
- Use clear, descriptive titles
- Provide detailed descriptions
- Link related issues
- Include screenshots for UI changes
- Ensure all checks pass

### Commit Message Format
We follow conventional commits:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

## 🏗️ Project Structure

### Backend (`/backend`)
```
src/
├── controllers/     # Route handlers
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── middleware/     # Express middleware
├── utils/          # Utility functions
└── types/          # TypeScript types
```

### Frontend (`/frontend`)
```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── services/       # API services
├── store/          # State management
├── hooks/          # Custom hooks
├── utils/          # Utility functions
└── types/          # TypeScript types
```

### ESP32 Code (`/esp32Code`)
```
ESP32_EC200U_Backend_TCP/
├── ESP32_EC200U_Backend_TCP.ino  # Main Arduino sketch
└── libraries/                    # Required libraries
```

## 🔍 Code Review Process

### For Contributors
- Address all review comments
- Make requested changes
- Respond to feedback constructively
- Keep PRs focused and manageable

### For Reviewers
- Be constructive and helpful
- Focus on code quality and functionality
- Check for security issues
- Ensure tests are adequate

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or error messages

## 💡 Feature Requests

For new features, please provide:
- Clear description of the feature
- Use case and benefits
- Implementation considerations
- Mockups or examples if applicable

## 📚 Documentation

- Update README.md for significant changes
- Add JSDoc comments for new APIs
- Update API documentation
- Include setup instructions for new features

## 🚫 What Not to Contribute

- Code that doesn't follow our style guidelines
- Features that don't align with project goals
- Changes without proper testing
- Code with security vulnerabilities
- Duplicate functionality

## 🎯 Areas for Contribution

### High Priority
- Bug fixes and performance improvements
- Security enhancements
- Test coverage improvements
- Documentation updates

### Medium Priority
- New features aligned with project goals
- UI/UX improvements
- API enhancements
- IoT device integration improvements

### Low Priority
- Cosmetic changes
- Minor refactoring
- Additional examples
- Non-essential features

## 📞 Getting Help

- Check existing issues and discussions
- Join our community discussions
- Contact maintainers for guidance
- Use GitHub discussions for questions

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation
- Community acknowledgments

## 📄 License

By contributing to BlockX, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to BlockX! 🚀
