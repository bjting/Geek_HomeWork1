# Export Functionality - Usage Guide

## Overview
The export functionality has been successfully implemented and is ready for testing. This guide covers how to use the export feature.

## Prerequisites

### Backend Dependencies (Already Verified)
- pandas >= 2.0.0 ✅
- openpyxl >= 3.0.0 ✅
- fastapi >= 0.121.0 ✅
- sqlmodel >= 0.0.27 (install in venv if needed)

### Frontend Dependencies (Verified)
- antd >= 5.28.1 ✅
- axios >= 1.13.2 ✅
- All required components created ✅

## How to Use

### 1. Start Development Servers

**Backend:**
```bash
cd backend
# Make sure dependencies are installed
pip install -e .
# Start server
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend  
npm install
npm run dev
```

### 2. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3. Execute a Query
1. Navigate to the query execution page
2. Select a database from the sidebar
3. Enter a SQL query in the editor
4. Click "Execute" button
5. View results in the Query Results table

### 4. Export Results
1. After executing a query with results, look for the "Export" button in the Query Results card
2. Click the "Export" button (appears as a download icon)
3. A modal dialog will appear with three format options:
   - **CSV**: Comma-separated values for spreadsheet applications
   - **JSON**: Structured data format for programmatic processing  
   - **Excel**: Microsoft Excel format with proper formatting
4. Select your preferred format and click "Export"
5. The file will automatically download to your computer

## Export Features

### Supported Formats
- **CSV (.csv)** - Standard comma-separated values
- **JSON (.json)** - Structured data with metadata
- **Excel (.xlsx)** - Microsoft Excel format

### Limitations
- Maximum **1000 rows** per export
- Only SELECT query results can be exported
- Automatic filename generation: `query_results.{format}`

### User Experience
- One-click export from query results
- Format selection with clear descriptions
- Loading indicators during export
- Success/error messages
- Button disabled when no results available
- Clear row limit notification

## API Documentation

### Export Endpoint
```
POST /api/v1/dbs/{name}/export
Content-Type: application/json
Accept: */*
```

**Request Body:**
```json
{
  "format": "csv",
  "maxRows": 1000,
  "sql": "SELECT * FROM table_name"
}
```

**Parameters:**
- `name` (path parameter): Database connection name
- `format` (required): "csv", "json", or "excel"
- `maxRows` (optional): Number of rows to export (1-1000, default: 1000)
- `sql` (required): SQL query to execute

**Response:**
- Content-Type: Depends on format
- Content-Disposition: attachment; filename=query_results.{extension}
- StreamingResponse with file content

**Example Response Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename=query_results.csv
Access-Control-Expose-Headers: Content-Disposition
```

## Testing Scenarios

### 1. Basic Export Test
```sql
SELECT * FROM users LIMIT 10
```
- Execute query
- Click Export
- Select CSV format
- Verify file download

### 2. Different Formats Test
```sql
SELECT name, email, created_at FROM users WHERE active = true LIMIT 50
```
- Export as CSV
- Export as JSON  
- Export as Excel
- Verify all formats work correctly

### 3. Row Limit Test
```sql
SELECT * FROM large_table
```
- Execute query (assume returns >1000 rows)
- Export and verify only 1000 rows included
- Check JSON export includes metadata about row count

### 4. Edge Cases
- Empty result sets
- NULL values in data
- Various data types (dates, numbers, text)
- Special characters in data

## Troubleshooting

### Common Issues

**Issue: Export button doesn't appear**
- Ensure query has executed successfully
- Check that results are displayed in the table
- Verify result count > 0

**Issue: File doesn't download**
- Check browser console for errors
- Verify backend is running on correct port
- Check network tab for failed requests

**Issue: Export fails with error**
- Check query syntax is valid
- Ensure database connection is active
- Verify SQL query produces results

**Issue: Excel file won't open**
- Ensure openpyxl is installed on backend
- Check file extension is .xlsx
- Verify file downloaded completely

### Debug Mode

Enable detailed error logging:
```bash
# Backend
uvicorn app.main:app --reload --log-level debug

# Frontend  
# Check browser console for detailed errors
```

## Implementation Details

### Backend Components
- `app/models/schemas.py` - ExportRequest schema
- `app/services/export.py` - Export service with format handlers
- `app/api/v1/queries.py` - Export API endpoint
- `backend/pyproject.toml` - Updated dependencies

### Frontend Components
- `src/types/query.ts` - ExportRequest interface
- `src/services/export.ts` - Export API service
- `src/components/ExportFormatSelector.tsx` - Format selector modal
- `src/pages/queries/execute.tsx` - Integrated export functionality

## Next Steps for Testing

1. **Manual Testing**
   - Test each export format with real data
   - Verify downloaded file contents match query results
   - Test with different data types and edge cases

2. **Integration Testing**
   - Test export endpoint via API docs
   - Verify file download in different browsers
   - Test with PostgreSQL and MySQL databases

3. **Performance Testing**
   - Test export with maximum 1000 rows
   - Verify export speed is acceptable
   - Check memory usage during export

## Verification Script

Run the verification script to check implementation:
```bash
python verify_export.py
```

This will verify:
- Backend components and functionality
- Required dependencies
- Frontend component files
- Integration status

## Support

If you encounter any issues:
1. Check the verification script output
2. Review browser console for frontend errors
3. Check backend logs for API errors
4. Verify all dependencies are installed correctly

---

**Status**: Export functionality is fully implemented and ready for testing!