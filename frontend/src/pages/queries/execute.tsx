/** Query execution page with SQL editor and result table. */

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Space, Spin, Alert, List, Typography, message, Dropdown } from "antd";
import { PlayCircleOutlined, ReloadOutlined, DownloadOutlined, ThunderboltOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { apiClient } from "../../services/api";
import { exportService } from "../../services/export";
import { QueryResult, QueryHistoryEntry, QueryInput } from "../../types/query";
import { SqlEditor } from "../../components/SqlEditor";
import { ResultTable } from "../../components/ResultTable";
import { ExportFormatSelector } from "../../components/ExportFormatSelector";
import { ExportPromptModal } from "../../components/ExportPromptModal";

const { Text } = Typography;

export const QueryExecute: React.FC = () => {
  const { databaseName } = useParams<{ databaseName: string }>();
  const [sql, setSql] = useState("SELECT * FROM ");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [autoExportPromptVisible, setAutoExportPromptVisible] = useState(false);
  const [defaultExportFormat, setDefaultExportFormat] = useState<"csv" | "json" | "excel" | null>(null);

  useEffect(() => {
    if (databaseName) {
      loadHistory();
    }
  }, [databaseName]);

  const loadHistory = async () => {
    if (!databaseName) return;

    setLoadingHistory(true);
    try {
      const response = await apiClient.get<QueryHistoryEntry[]>(
        `/api/v1/dbs/${databaseName}/history`
      );
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleExecute = async () => {
    if (!databaseName || !sql.trim()) {
      setError("Please enter a SQL query");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input: QueryInput = { sql: sql.trim() };
      const response = await apiClient.post<QueryResult>(
        `/api/v1/dbs/${databaseName}/query`,
        input
      );
      setResult(response.data);
      // Reload history after successful query
      await loadHistory();

      // Show auto export prompt if results exist and no default format is set
      if (response.data.rowCount > 0 && defaultExportFormat) {
        // Auto export with default format
        await handleAutoExport(defaultExportFormat);
      } else if (response.data.rowCount > 0) {
        // Show prompt dialog
        setAutoExportPromptVisible(true);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Query execution failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoExport = async (format: "csv" | "json" | "excel") => {
    if (!databaseName || !sql.trim()) {
      message.error("No query to export");
      return;
    }

    setExporting(true);
    try {
      await exportService.exportResults(databaseName, {
        format,
        maxRows: 1000,
        sql: sql.trim(),
      });
      message.success(`Successfully exported to ${format.toUpperCase()}`);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Export failed";
      message.error(errorMessage);
    } finally {
      setExporting(false);
      setAutoExportPromptVisible(false);
    }
  };

  const handleHistoryClick = (historyItem: QueryHistoryEntry) => {
    setSql(historyItem.sqlText);
    setError(null);
    setResult(null);
  };

  const handleExecuteAndExport = async (format: "csv" | "json" | "excel") => {
    if (!databaseName || !sql.trim()) {
      setError("Please enter a SQL query");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input: QueryInput = { sql: sql.trim() };
      const response = await apiClient.post<QueryResult>(
        `/api/v1/dbs/${databaseName}/query`,
        input
      );
      setResult(response.data);

      if (response.data.rowCount > 0) {
        await handleAutoExport(format);
      } else {
        message.info("No results to export");
      }

      await loadHistory();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Query execution failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const executeAndExportMenuItems: MenuProps['items'] = [
    {
      key: 'csv',
      label: 'Export as CSV',
      onClick: () => handleExecuteAndExport('csv'),
    },
    {
      key: 'json',
      label: 'Export as JSON',
      onClick: () => handleExecuteAndExport('json'),
    },
    {
      key: 'excel',
      label: 'Export as Excel',
      onClick: () => handleExecuteAndExport('excel'),
    },
  ];

  const handleExportClick = () => {
    if (!result || result.rowCount === 0) {
      message.warning("No results to export");
      return;
    }
    setExportModalVisible(true);
  };

  const handleExportConfirm = async (format: "csv" | "json" | "excel") => {
    if (!databaseName || !sql.trim()) {
      message.error("No query to export");
      return;
    }

    setExporting(true);
    try {
      await exportService.exportResults(databaseName, {
        format,
        maxRows: 1000,
        sql: sql.trim(),
      });
      message.success(`Successfully exported to ${format.toUpperCase()}`);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Export failed";
      message.error(errorMessage);
    } finally {
      setExporting(false);
      setExportModalVisible(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`Execute Query - ${databaseName}`}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleExecute}
              loading={loading}
            >
              Execute
            </Button>
            <Dropdown
              menu={{ items: executeAndExportMenuItems }}
              trigger={['click']}
            >
              <Button
                icon={<ThunderboltOutlined />}
                loading={loading}
              >
                Execute & Export
              </Button>
            </Dropdown>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadHistory}
              loading={loadingHistory}
            >
              Refresh History
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Card title="SQL Editor" size="small">
              <SqlEditor value={sql} onChange={(val) => setSql(val || "")} height="200px" />
            </Card>
          </div>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          )}

          {result && (
            <Card
              title="Query Results"
              size="small"
              extra={
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportClick}
                  disabled={result.rowCount === 0}
                >
                  Export
                </Button>
              }
            >
              <ResultTable result={result} loading={loading} />
            </Card>
          )}
        </Space>
      </Card>

      <Card title="Query History" style={{ marginTop: 16 }}>
        {loadingHistory ? (
          <Spin />
        ) : (
          <List
            dataSource={history}
            renderItem={(item) => (
              <List.Item
                style={{
                  cursor: "pointer",
                  backgroundColor: item.success ? "transparent" : "#fff2f0",
                }}
                onClick={() => handleHistoryClick(item)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text
                        code
                        style={{
                          maxWidth: "600px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "inline-block",
                        }}
                      >
                        {item.sqlText}
                      </Text>
                      {item.success ? (
                        <Text type="success">
                          ✓ {item.rowCount} rows in {item.executionTimeMs}ms
                        </Text>
                      ) : (
                        <Text type="danger">✗ Failed</Text>
                      )}
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      {new Date(item.executedAt).toLocaleString()}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <ExportFormatSelector
        visible={exportModalVisible}
        onConfirm={handleExportConfirm}
        onCancel={() => setExportModalVisible(false)}
        loading={exporting}
      />

      <ExportPromptModal
        visible={autoExportPromptVisible}
        rowCount={result?.rowCount || 0}
        onExport={(format, remember) => {
          if (remember) {
            setDefaultExportFormat(format);
          }
          handleAutoExport(format);
        }}
        onSkip={() => setAutoExportPromptVisible(false)}
        onDismiss={() => setAutoExportPromptVisible(false)}
      />
    </div>
  );
};
