# Database Query Tool

A modern web-based tool for managing PostgreSQL database connections, viewing metadata, and executing SQL queries with natural language support and data export capabilities.

## 🌟 Features

- **Database Management**: Connect and manage multiple PostgreSQL databases
- **SQL Query Execution**: Execute SQL queries with syntax highlighting and validation
- **Natural Language Support**: Convert natural language to SQL using AI
- **Metadata Exploration**: Browse database schemas, tables, and columns
- **Query History**: Track and replay previous queries
- **Smart Data Export**: Intelligent export functionality with auto-prompts and one-click operations
  - **Multiple Formats**: Export to CSV, JSON, or Excel
  - **Auto-Prompts**: Query success automatically asks if you want to export
  - **One-Click Export**: "Execute & Export" button for instant results
  - **Format Memory**: Remember your preferred export format
  - **CLI Tools**: Command-line automation for batch operations
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
- **AI Service**: DashScope (通义千问) for natural language to SQL conversion

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

## 🚀 Smart Export Features

### Enhanced Export Experience

The project includes intelligent export functionality designed for efficiency and user convenience:

#### 🎯 One-Click Export
- **Execute & Export** button with dropdown menu
- Choose format (CSV/JSON/Excel) and execute in one step
- Perfect for quick data extraction workflows

#### 💡 Smart Prompts
- Automatic export suggestion after successful queries
- Quick format selection with visual icons
- Optional "Remember my choice" for future queries

#### 🛠️ Command-Line Tools
- **query_export_cli.py**: Python CLI for automated exports
- **query_export.bat**: Windows batch file wrapper
- **test_export_automation.py**: Automated testing script

```bash
# Example: Export query results via CLI
python query_export_cli.py --db mydb --sql "SELECT * FROM users LIMIT 100" --format csv

# Example: Use Windows batch file
query_export.bat --db mydb --file query.sql --format json --output results.json
```

#### 📊 Format Comparison
| Format | Best For | File Size | Features |
|--------|----------|-----------|----------|
| **CSV** | Excel analysis, data exchange | Small | Universal compatibility |
| **JSON** | API integration, programmatic use | Medium | Structured with metadata |
| **Excel** | Reports, formatted data | Large | Rich formatting support |

### Documentation

- **[Enhanced Export Guide](ENHANCED_EXPORT_GUIDE.md)** - Complete feature documentation
- **[Quick Start Export](QUICK_START_EXPORT.md)** - Quick reference and examples
- **[Project Summary](PROJECT_SUMMARY.md)** - Implementation details and status

## Phase 1 Status

✅ **Phase 1 Complete**: All setup and foundation tasks completed.

- Backend project structure initialized
- Frontend project structure initialized
- Core infrastructure (FastAPI, database, models) ready
- Data models defined with camelCase API convention
- Makefile with common development tasks
- REST Client test file for API testing
- Enhanced export functionality implemented
- Smart user interaction features added
- Command-line automation tools created

## Next Steps

Proceed to Phase 2 for core feature implementation (US1 + US2).

**Recent Enhancements:**
- ✅ Smart export prompts after query execution
- ✅ One-click "Execute & Export" functionality
- ✅ Format memory for user preferences
- ✅ CLI tools for automated exports
- ✅ Comprehensive documentation
