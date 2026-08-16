# Database Query Tool

A modern web-based tool for managing PostgreSQL database connections, viewing metadata, and executing SQL queries with natural language support and data export capabilities.

## 🌟 Features

- **Database Management**: Connect and manage multiple PostgreSQL databases
- **SQL Query Execution**: Execute SQL queries with syntax highlighting and validation
- **Natural Language Support**: Convert natural language to SQL using AI
- **Metadata Exploration**: Browse database schemas, tables, and columns
- **Query History**: Track and replay previous queries
- **Data Export**: Export query results to CSV, JSON, or Excel formats
- **Real-time Results**: View query results with execution time and row counts

## 🏗️ Project Structure

```
w2/db_query/
├── backend/          # FastAPI backend (Python 3.12+)
├── frontend/         # React frontend (TypeScript, Refine 5)
├── fixtures/         # REST Client test files
│   ├── test.rest     # API test requests
│   └── README.md     # Testing guide
└── Makefile          # Development commands
```

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.104+ (Python 3.12+)
- **Database**: SQLite (internal), PostgreSQL (target databases)
- **Async**: asyncpg for PostgreSQL connections
- **Validation**: Pydantic v2
- **Data Export**: pandas, openpyxl for Excel generation

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Ant Design 5
- **Admin Framework**: Refine 5
- **Code Editor**: Monaco Editor
- **Build Tool**: Vite
- **State Management**: React Hooks

## 📦 Installation

### Prerequisites

- Python 3.12 or higher
- Node.js 18 or higher
- npm or yarn
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/db-query-tool.git
cd db-query-tool

# Install all dependencies
make install

# Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY

# Start development servers
make dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🚀 Development

### Development Commands

```bash
# View all available commands
make help

# Start backend only
make dev-backend

# Start frontend only
make dev-frontend

# Run tests
make test

# Format code
make format

# Run linters
make lint
```

## API Testing

### Using REST Client (VSCode)

1. Install [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
2. Open `fixtures/test.rest`
3. Click "Send Request" above any HTTP request
4. View responses in VSCode panel

See `fixtures/README.md` for detailed testing guide.

### Using Makefile

```bash
# Check if backend is running
make health

# Open API documentation
make docs
```

## Phase 1 Status

✅ **Phase 1 Complete**: All setup and foundation tasks completed.

- Backend project structure initialized
- Frontend project structure initialized
- Core infrastructure (FastAPI, database, models) ready
- Data models defined with camelCase API convention
- Makefile with common development tasks
- REST Client test file for API testing

## Next Steps

Proceed to Phase 2 for core feature implementation (US1 + US2).
