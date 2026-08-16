# Changelog

All notable changes to the Database Query Tool project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Data export functionality (CSV, JSON, Excel formats)
- Export format selector modal with user-friendly interface
- Streaming file download support
- Query result export with configurable row limits
- Export service with pandas-based Excel generation

### Changed
- Enhanced query execution page with export button
- Updated type definitions for export functionality
- Improved error handling for export operations

### Fixed
- Database connection issues with special characters in passwords
- URL encoding for connection parameters

## [0.1.0] - Initial Release

### Added
- Initial project setup and architecture
- FastAPI backend with PostgreSQL support
- React frontend with Ant Design UI
- Database connection management
- SQL query execution with syntax highlighting
- Natural language to SQL conversion
- Database metadata browsing
- Query history and replay
- Makefile for development tasks
- REST Client testing setup
- Comprehensive documentation

### Features
- Multi-database connection management
- Real-time query execution with results
- Schema exploration (tables, views, columns)
- Query history with success/failure tracking
- Natural language query processing
- Monaco Code Editor integration
- Responsive UI design

### Documentation
- README with installation and usage guide
- API documentation via FastAPI
- Development setup instructions
- Testing guide with REST Client examples

---

## Version Format

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

## Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes