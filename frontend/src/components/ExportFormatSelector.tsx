/** Export format selector modal component. */

import React from "react";
import { Modal, Radio, Typography } from "antd";

const { Text } = Typography;

interface ExportFormatSelectorProps {
  visible: boolean;
  onConfirm: (format: "csv" | "json" | "excel") => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({
  visible,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [selectedFormat, setSelectedFormat] = React.useState<"csv" | "json" | "excel">("csv");

  const handleConfirm = () => {
    onConfirm(selectedFormat);
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFormat(e.target.value as "csv" | "json" | "excel");
  };

  const formatDescriptions: Record<"csv" | "json" | "excel", string> = {
    csv: "Comma-separated values, compatible with spreadsheet applications",
    json: "Structured data format, useful for programmatic processing",
    excel: "Microsoft Excel format with proper formatting",
  };

  return (
    <Modal
      title="Export Query Results"
      open={visible}
      onOk={handleConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Export"
      cancelText="Cancel"
    >
      <div style={{ padding: "16px 0" }}>
        <Text strong>Select Export Format:</Text>
        <div style={{ marginTop: "16px" }}>
          <Radio.Group
            value={selectedFormat}
            onChange={handleFormatChange}
            style={{ width: "100%" }}
          >
            <div style={{ marginBottom: "8px" }}>
              <Radio value="csv">CSV</Radio>
              <Text type="secondary" style={{ marginLeft: "8px", fontSize: "12px" }}>
                {formatDescriptions.csv}
              </Text>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <Radio value="json">JSON</Radio>
              <Text type="secondary" style={{ marginLeft: "8px", fontSize: "12px" }}>
                {formatDescriptions.json}
              </Text>
            </div>
            <div>
              <Radio value="excel">Excel</Radio>
              <Text type="secondary" style={{ marginLeft: "8px", fontSize: "12px" }}>
                {formatDescriptions.excel}
              </Text>
            </div>
          </Radio.Group>
        </div>
        <div style={{ marginTop: "16px", padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Note: Maximum 1000 rows will be exported
          </Text>
        </div>
      </div>
    </Modal>
  );
};