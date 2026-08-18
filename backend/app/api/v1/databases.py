"""Database connection management API endpoints."""

import logging
import httpx
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Dict
from app.database import get_session
from app.models.database import DatabaseConnection, ConnectionStatus, DatabaseType
from app.utils.db_parser import detect_database_type
from app.models.schemas import (
    DatabaseConnectionInput,
    DatabaseConnectionResponse,
    DatabaseMetadataResponse,
    TableMetadata,
)
from app.services.database_service import database_service
from app.services.metadata import fetch_metadata, get_cached_metadata
from app.config import settings
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dbs", tags=["databases"])


def to_response(conn: DatabaseConnection) -> DatabaseConnectionResponse:
    """Convert DatabaseConnection to response schema."""
    return DatabaseConnectionResponse(
        name=conn.name,
        url=conn.url,
        db_type=conn.db_type.value,
        description=conn.description,
        created_at=conn.created_at,
        updated_at=conn.updated_at,
        last_connected_at=conn.last_connected_at,
        status=conn.status.value,
    )


@router.put("/{name}", response_model=DatabaseConnectionResponse)
async def create_or_update_database(
    name: str,
    input_data: DatabaseConnectionInput,
    session: Session = Depends(get_session),
) -> DatabaseConnectionResponse:
    """
    Create or update a database connection.

    Args:
        name: Database connection name
        input_data: Connection input data
        session: Database session

    Returns:
        Created/updated database connection
    """
    # Validate name format
    if not name.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name must contain only alphanumeric characters, hyphens, and underscores",
        )

    # Detect or validate database type
    try:
        if input_data.db_type:
            # Validate provided db_type
            db_type = DatabaseType(input_data.db_type.lower())
            # Also verify it matches URL
            detected_type = detect_database_type(input_data.url)
            if db_type != detected_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Database type mismatch: provided '{db_type.value}' but URL indicates '{detected_type.value}'",
                )
        else:
            # Auto-detect from URL
            db_type = detect_database_type(input_data.url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Test connection
    success, error_message = await database_service.test_connection(db_type, input_data.url)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection test failed: {error_message}",
        )

    # Check if connection exists
    statement = select(DatabaseConnection).where(
        DatabaseConnection.name == name
    )
    existing = session.exec(statement).first()

    if existing:
        # Update existing connection
        existing.url = input_data.url
        existing.db_type = db_type
        existing.description = input_data.description
        existing.updated_at = datetime.now(timezone.utc)
        existing.last_connected_at = datetime.now(timezone.utc)
        existing.status = ConnectionStatus.ACTIVE
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return to_response(existing)
    else:
        # Create new connection
        new_conn = DatabaseConnection(
            name=name,
            url=input_data.url,
            db_type=db_type,
            description=input_data.description,
            status=ConnectionStatus.ACTIVE,
            last_connected_at=datetime.now(timezone.utc),
        )
        session.add(new_conn)
        session.commit()
        session.refresh(new_conn)
        return to_response(new_conn)


@router.get("", response_model=List[DatabaseConnectionResponse])
async def list_databases(
    session: Session = Depends(get_session),
) -> List[DatabaseConnectionResponse]:
    """
    List all database connections.

    Args:
        session: Database session

    Returns:
        List of database connections
    """
    statement = select(DatabaseConnection)
    connections = session.exec(statement).all()
    return [to_response(conn) for conn in connections]


@router.get("/{name}", response_model=DatabaseMetadataResponse)
async def get_database_metadata(
    name: str,
    refresh: bool = False,
    session: Session = Depends(get_session),
) -> DatabaseMetadataResponse:
    """
    Get database metadata (tables, views, columns).

    Args:
        name: Database connection name
        refresh: Force refresh metadata
        session: Database session

    Returns:
        Database metadata
    """
    # Get connection
    statement = select(DatabaseConnection).where(
        DatabaseConnection.name == name
    )
    connection = session.exec(statement).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Database connection '{name}' not found",
        )

    # Fetch metadata
    metadata_dict = await fetch_metadata(
        session, name, connection.db_type, connection.url, force_refresh=refresh
    )

    # Parse metadata
    tables = [
        TableMetadata(**table) for table in metadata_dict.get("tables", [])
    ]
    views = [
        TableMetadata(**view) for view in metadata_dict.get("views", [])
    ]

    # Get cache info
    from app.services.metadata import get_cached_metadata

    cached = await get_cached_metadata(session, name)
    fetched_at = cached.fetched_at if cached else datetime.now(timezone.utc)
    is_stale = cached.is_stale if cached else False

    return DatabaseMetadataResponse(
        databaseName=name,
        tables=tables,
        views=views,
        fetchedAt=fetched_at,
        isStale=is_stale,
    )


@router.delete("/{name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_database(
    name: str,
    session: Session = Depends(get_session),
) -> None:
    """
    Delete a database connection.

    Args:
        name: Database connection name
        session: Database session
    """
    # Get connection
    statement = select(DatabaseConnection).where(
        DatabaseConnection.name == name
    )
    connection = session.exec(statement).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Database connection '{name}' not found",
        )

    # Close connection pool
    await database_service.close_connection(connection.db_type, name)

    # Delete connection
    session.delete(connection)
    session.commit()


@router.post("/{name}/refresh", response_model=DatabaseMetadataResponse)
async def refresh_database_metadata(
    name: str,
    session: Session = Depends(get_session),
) -> DatabaseMetadataResponse:
    """
    Refresh database metadata cache.

    Args:
        name: Database connection name
        session: Database session

    Returns:
        Refreshed database metadata
    """
    # Get connection
    statement = select(DatabaseConnection).where(
        DatabaseConnection.name == name
    )
    connection = session.exec(statement).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Database connection '{name}' not found",
        )

    # Force refresh metadata
    metadata_dict = await fetch_metadata(
        session, name, connection.db_type, connection.url, force_refresh=True
    )

    # Parse metadata
    tables = [
        TableMetadata(**table) for table in metadata_dict.get("tables", [])
    ]
    views = [
        TableMetadata(**view) for view in metadata_dict.get("views", [])
    ]

    # Get cache info
    from app.services.metadata import get_cached_metadata

    cached = await get_cached_metadata(session, name)
    fetched_at = cached.fetched_at if cached else datetime.now(timezone.utc)
    is_stale = False  # Just refreshed

    return DatabaseMetadataResponse(
        databaseName=name,
        tables=tables,
        views=views,
        fetchedAt=fetched_at,
        isStale=is_stale,
    )


@router.post("/{name}/ai/chat")
async def ai_chat(
    name: str,
    chat_data: Dict[str, str],
    session: Session = Depends(get_session),
):
    """
    AI chat endpoint for answering database-related questions.

    Args:
        name: Database connection name
        chat_data: Chat data with 'question' field
        session: Database session

    Returns:
        Dict with 'answer' field containing AI response
    """
    # Get connection
    statement = select(DatabaseConnection).where(
        DatabaseConnection.name == name
    )
    connection = session.exec(statement).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Database connection '{name}' not found",
        )

    # Get metadata for context
    try:
        metadata_obj = await get_cached_metadata(session, connection.name)
        if not metadata_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Metadata not found for database '{name}'. Please refresh metadata first.",
            )
        metadata = json.loads(metadata_obj.metadata_json)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load metadata: {str(e)}",
        )

    # Prepare system prompt for database assistance
    system_message = f"""You are a database assistant helping users understand and query the database.

Database Name: {name}
Database Type: {connection.db_type.value}

Database Schema:
"""

    # Build schema context
    for table in metadata.get("tables", []):
        table_info = f"Table: {table['schemaName']}.{table['name']}"
        if table.get("rowCount"):
            table_info += f" ({table['rowCount']} rows)"

        columns_info = []
        for col in table.get("columns", []):
            col_desc = f" - {col['name']} ({col['dataType']})"
            if col.get("primaryKey"):
                col_desc += " PRIMARY KEY"
            if not col.get("nullable", True):
                col_desc += " NOT NULL"
            if col.get("unique"):
                col_desc += " UNIQUE"
            columns_info.append(col_desc)

        table_info += "\n" + "\n".join(columns_info)
        system_message += table_info + "\n\n"

    for view in metadata.get("views", []):
        view_info = f"View: {view['schemaName']}.{view['name']}"
        columns_info = [f"  - {col['name']} ({col['dataType']})" for col in view.get("columns", [])]
        view_info += "\n" + "\n".join(columns_info)
        system_message += view_info + "\n\n"

    system_message += """Rules:
1. Help users understand database structure and suggest SQL queries
2. Be friendly and provide clear, helpful responses in Chinese
3. When suggesting SQL queries, provide explanations
4. If users ask to execute a query, tell them to use the Query Editor
5. Focus on providing useful information about tables, columns, and relationships
6. Be concise but thorough in your answers

Output format:
Provide clear, friendly responses in Chinese. No code blocks unless specifically asked for SQL queries."""

    # Call DashScope AI API
    try:
        headers = {
            "Authorization": f"Bearer {settings.dashscope_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": settings.ai_model,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": chat_data.get("question", "")},
            ],
            "temperature": settings.ai_temperature,
            "max_tokens": settings.ai_max_tokens,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.dashscope_api_url}/chat/completions",
                headers=headers,
                json=payload
            )

        if response.status_code != 200:
            error_msg = response.text
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"DashScope API error: {response.status_code} - {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI service temporarily unavailable"
            )

        result = response.json()
        ai_answer = result["choices"][0]["message"]["content"].strip()

        logger.info(f"AI chat response for database {name}: {ai_answer[:50]}...")

        return {"answer": ai_answer}

    except httpx.TimeoutException:
        import logging
        logger = logging.getLogger(__name__)
        logger.error("DashScope API timeout")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI service timeout"
        )
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to call AI chat: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI response: {str(e)}"
        )
