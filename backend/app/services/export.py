"""Export service for converting query results to different formats."""

import csv
import json
from io import StringIO, BytesIO
from typing import List, Dict, Any, Literal
from fastapi import HTTPException
import pandas as pd


class ExportService:
    """Service for exporting query results to CSV, JSON, or Excel format."""

    @staticmethod
    def export_to_csv(
        columns: List[str],
        rows: List[Dict[str, Any]],
        max_rows: int
    ) -> tuple[str, str]:
        """
        Export query results to CSV format.

        Args:
            columns: List of column names
            rows: List of result rows
            max_rows: Maximum rows to export

        Returns:
            Tuple of (filename, content)

        Raises:
            HTTPException: If export fails
        """
        try:
            # Limit rows to max_rows
            export_rows = rows[:max_rows]

            # Create CSV in memory
            output = StringIO()
            writer = csv.DictWriter(output, fieldnames=columns)
            writer.writeheader()
            writer.writerows(export_rows)

            content = output.getvalue()
            output.close()

            return "query_results.csv", content

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to export CSV: {str(e)}"
            )

    @staticmethod
    def export_to_json(
        columns: List[str],
        rows: List[Dict[str, Any]],
        max_rows: int
    ) -> tuple[str, str]:
        """
        Export query results to JSON format.

        Args:
            columns: List of column names
            rows: List of result rows
            max_rows: Maximum rows to export

        Returns:
            Tuple of (filename, content)

        Raises:
            HTTPException: If export fails
        """
        try:
            # Limit rows to max_rows
            export_rows = rows[:max_rows]

            # Create JSON structure
            data = {
                "columns": columns,
                "rows": export_rows,
                "total_rows": len(rows),
                "exported_rows": len(export_rows)
            }

            content = json.dumps(data, indent=2, default=str)
            return "query_results.json", content

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to export JSON: {str(e)}"
            )

    @staticmethod
    def export_to_excel(
        columns: List[str],
        rows: List[Dict[str, Any]],
        max_rows: int
    ) -> tuple[str, BytesIO]:
        """
        Export query results to Excel format.

        Args:
            columns: List of column names
            rows: List of result rows
            max_rows: Maximum rows to export

        Returns:
            Tuple of (filename, bytes_content)

        Raises:
            HTTPException: If export fails
        """
        try:
            # Limit rows to max_rows
            export_rows = rows[:max_rows]

            # Create DataFrame
            df = pd.DataFrame(export_rows, columns=columns)

            # Create Excel file in memory
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Query Results', index=False)

            output.seek(0)
            return "query_results.xlsx", output

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to export Excel: {str(e)}"
            )

    @staticmethod
    def export(
        format: Literal["csv", "json", "excel"],
        columns: List[str],
        rows: List[Dict[str, Any]],
        max_rows: int
    ) -> tuple[str, any, str]:
        """
        Export query results to specified format.

        Args:
            format: Export format (csv, json, excel)
            columns: List of column names
            rows: List of result rows
            max_rows: Maximum rows to export

        Returns:
            Tuple of (filename, content, media_type)

        Raises:
            HTTPException: If format is invalid or export fails
        """
        media_types = {
            "csv": "text/csv",
            "json": "application/json",
            "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }

        if format not in media_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format: {format}. Must be csv, json, or excel"
            )

        media_type = media_types[format]

        if format == "csv":
            filename, content = ExportService.export_to_csv(columns, rows, max_rows)
        elif format == "json":
            filename, content = ExportService.export_to_json(columns, rows, max_rows)
        elif format == "excel":
            filename, content = ExportService.export_to_excel(columns, rows, max_rows)

        return filename, content, media_type


# Create singleton instance
export_service = ExportService()