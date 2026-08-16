# Contributing to Database Query Tool

Thank you for your interest in contributing to the Database Query Tool! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Create a new issue with:
   - Clear title describing the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Python version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case / problem it solves
   - Possible implementation approach (if known)

### Submitting Code Changes

#### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/db-query-tool.git
   cd db-query-tool
   ```

3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Install dependencies:
   ```bash
   make install
   ```

5. Make your changes

6. Test your changes:
   ```bash
   make test
   make lint
   ```

7. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

8. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

9. Create a Pull Request

## 📝 Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints where appropriate
- Write docstrings for functions and classes
- Keep functions focused and modular
- Use meaningful variable and function names

### TypeScript/React (Frontend)

- Follow Airbnb JavaScript/TypeScript style guide
- Use functional components with hooks
- Use TypeScript for type safety
- Follow React best practices
- Component names should be PascalCase

## 🧪 Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting
- Test on both frontend and backend
- Consider edge cases and error handling

## 📖 Commit Messages

Follow conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat: add export to Excel functionality
fix: resolve database connection timeout issue
docs: update installation instructions
```

## 🔍 Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README if you've changed functionality
4. Create a clear PR description:
   - What problem does this PR solve?
   - What changes did you make?
   - How should this be tested?
5. Link related issues

## 📋 Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

## 🎯 Development Priorities

Check the project issues to see current priorities and what needs help.

## 💬 Questions?

Feel free to open an issue for questions or discussions about the project.

Thanks for contributing! 🚀