"""Natural Language to SQL conversion service using DashScope."""

import httpx
from app.config import settings
from app.models.database import DatabaseType
import logging

logger = logging.getLogger(__name__)


class NaturalLanguageToSQLService:
    """Service for converting natural language to SQL using DashScope."""

    def __init__(self):
        """Initialize DashScope client."""
        self.api_url = settings.dashscope_api_url
        self.api_key = settings.dashscope_api_key
        self.model = settings.ai_model
        self.temperature = settings.ai_temperature
        self.max_tokens = settings.ai_max_tokens

    def _build_prompt(
        self, user_prompt: str, metadata: dict, db_type: DatabaseType = DatabaseType.POSTGRESQL
    ) -> str:
        """Build the prompt for DashScope with database metadata context.

        Args:
            user_prompt: Natural language query from user
            metadata: Database schema metadata dictionary
            db_type: Database type (PostgreSQL or MySQL)

        Returns:
            System prompt with database schema context
        """
        # Build schema context
        schema_context = []
        for table in metadata.get("tables", []):
            columns_info = []
            for col in table.get("columns", []):
                col_desc = f"  - {col['name']} ({col['dataType']})"
                if col.get("primaryKey"):
                    col_desc += " PRIMARY KEY"
                if not col.get("nullable", True):
                    col_desc += " NOT NULL"
                if col.get("unique"):
                    col_desc += " UNIQUE"
                columns_info.append(col_desc)

            row_count = table.get("rowCount", "unknown")
            table_info = f"Table: {table['schemaName']}.{table['name']} ({row_count} rows)\n"
            table_info += "\n".join(columns_info)
            schema_context.append(table_info)

        for view in metadata.get("views", []):
            columns_info = [f"  - {col['name']} ({col['dataType']})" for col in view.get("columns", [])]
            view_info = f"View: {view['schemaName']}.{view['name']}\n"
            view_info += "\n".join(columns_info)
            schema_context.append(view_info)

        schema_text = "\n\n".join(schema_context)

        # Build database-specific rules
        if db_type == DatabaseType.MYSQL:
            db_name = "MySQL"
            syntax_rules = """3. Use backticks for identifiers (e.g., `table_name`, `column_name`)
4. Return valid MySQL syntax
5. Use MySQL LIMIT syntax (LIMIT n)
6. Be aware of MySQL-specific features like AUTO_INCREMENT"""
        else:
            db_name = "PostgreSQL"
            syntax_rules = """3. Use proper schema qualification (schema.table)
4. Return valid PostgreSQL syntax
5. Use double quotes for identifiers if needed"""

        system_message = f"""You are an expert SQL query generator for {db_name} databases.

Database Schema:
{schema_text}

Rules:
1. Generate ONLY SELECT queries (no INSERT/UPDATE/DELETE/DROP)
2. Always include LIMIT clause (max 1000 rows)
{syntax_rules}
7. Handle both English and Chinese natural language
8. Be concise - return just the SQL query

Output format:
Return ONLY the SQL query, nothing else. No explanations, no markdown, just the SQL."""

        return system_message

    async def generate_sql(
        self, user_prompt: str, metadata: dict, db_type: DatabaseType = DatabaseType.POSTGRESQL
    ) -> dict[str, str]:
        """Convert natural language to SQL query.

        Args:
            user_prompt: Natural language query
            metadata: Database schema metadata dictionary
            db_type: Database type (PostgreSQL or MySQL)

        Returns:
            Dict with 'sql' and 'explanation' keys

        Raises:
            Exception: If DashScope API call fails
        """
        try:
            system_prompt = self._build_prompt(user_prompt, metadata, db_type)

            # Call DashScope API using OpenAI-compatible interface
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

            if response.status_code != 200:
                error_msg = response.text
                logger.error(f"DashScope API error: {response.status_code} - {error_msg}")
                raise Exception(f"DashScope API error: {error_msg}")

            result = response.json()
            generated_sql = result["choices"][0]["message"]["content"].strip()

            # Clean up the response (remove markdown code blocks if present)
            if generated_sql.startswith("```sql"):
                generated_sql = generated_sql.replace("```sql", "").replace("```", "").strip()
            elif generated_sql.startswith("```"):
                generated_sql = generated_sql.replace("```", "").strip()

            # Generate explanation
            explanation = f"Generated SQL from: {user_prompt}"

            logger.info(f"Generated SQL for prompt: {user_prompt[:50]}...")

            return {"sql": generated_sql, "explanation": explanation}

        except httpx.TimeoutException:
            logger.error("DashScope API timeout")
            raise Exception("DashScope API timeout")
        except Exception as e:
            logger.error(f"Failed to generate SQL: {str(e)}")
            raise Exception(f"Failed to generate SQL: {str(e)}")


# Global instance
nl2sql_service = NaturalLanguageToSQLService()