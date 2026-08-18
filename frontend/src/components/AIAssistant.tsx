/** AI助手悬浮窗组件 - 简化版本，优先保证页面正常运行 */

import React, { useState, useEffect, useRef } from "react";
import { Card, Space, Button, Typography, Avatar, Badge, Input, message, Spin } from "antd";
const { Text } = Typography;
import { RobotOutlined, CloseOutlined, DownOutlined, UpOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import { apiClient } from "../services/api";

interface AIMessage {
  id: string;
  type: "user" | "assistant" | "greeting" | "export_prompt" | "info" | "question";
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  isLoading?: boolean;
}

interface AIAssistantProps {
  querySuccess?: boolean;
  rowCount?: number;
  onExport?: (format: "csv" | "json") => void;
  onDismiss?: () => void;
  databaseName?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  querySuccess = false,
  rowCount = 0,
  onExport,
  onDismiss,
  databaseName,
}) => {
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [showBadge, setShowBadge] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 默认问候消息
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMessage: AIMessage = {
        id: "greeting",
        type: "greeting",
        content: "需要我为您做什么？您可以问我关于数据库表、字段、SQL查询等问题。",
        timestamp: new Date(),
      };
      setMessages([greetingMessage]);
    }
  }, [messages.length]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [expanded, messages]);

  // 查询成功时显示导出询问
  useEffect(() => {
    if (querySuccess && rowCount > 0 && expanded) {
      const exportMessage: AIMessage = {
        id: `export_${Date.now()}`,
        type: "export_prompt",
        content: `查询完成！发现 ${rowCount} 行数据。需要将这次查询结果导出为 CSV 或 JSON 文件吗？`,
        timestamp: new Date(),
        actions: [
          {
            label: "导出 CSV",
            onClick: () => {
              setMessages(prev => prev.filter(msg => msg.id !== exportMessage.id));
              onExport?.("csv");
            },
          },
          {
            label: "导出 JSON",
            onClick: () => {
              setMessages(prev => prev.filter(msg => msg.id !== exportMessage.id));
              onExport?.("json");
            },
          },
        ],
      };
      setMessages(prev => [...prev, exportMessage]);
      setShowBadge(true);
    }
  }, [querySuccess, rowCount, expanded, onExport]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !databaseName) {
      if (!databaseName) {
        message.warning("请先选择数据库");
      }
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");

    // 添加用户消息
    const userMessageObj: AIMessage = {
      id: `user_${Date.now()}`,
      type: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessageObj]);

    // 添加AI加载消息
    const loadingMessageId = `assistant_${Date.now()}`;
    const loadingMessageObj: AIMessage = {
      id: loadingMessageId,
      type: "assistant",
      content: "正在思考...",
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessageObj]);

    setLoading(true);
    try {
      // 调用后端AI接口
      const response = await fetch(`http://localhost:8000/api/v1/dbs/${databaseName}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // 移除加载消息，添加真实回答
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      const assistantMessageObj: AIMessage = {
        id: `assistant_${Date.now()}`,
        type: "assistant",
        content: data.answer || "抱歉，我暂时无法回答这个问题。",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessageObj]);
    } catch (error: any) {
      const errorMessage = error.message || "AI服务暂时不可用";

      // 移除加载消息，添加错误消息
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      const errorMessageObj: AIMessage = {
        id: `assistant_${Date.now()}`,
        type: "assistant",
        content: `抱歉，我遇到了一些问题：${errorMessage}。请稍后再试。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessageObj]);

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = () => {
    setExpanded(prev => !prev);
    if (!expanded && showBadge) {
      setShowBadge(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    onDismiss?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 1000,
      }}
    >
      {/* 最小化状态 */}
      {!expanded && (
        <Badge dot={showBadge} offset={[-5, 5]}>
          <Card
            size="small"
            style={{
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              cursor: "pointer",
              backgroundColor: "#f0f8ff",
              border: "2px solid #1890ff",
            }}
            onClick={toggleExpanded}
            hoverable
          >
            <Space>
              <Avatar
                icon={<RobotOutlined />}
                style={{
                  backgroundColor: "#1890ff",
                }}
                size={32}
              />
              <div>
                <Text strong style={{ fontSize: 14, color: "#1890ff" }}>
                  AI 助手
                </Text>
                {messages.length > 0 && messages[messages.length - 1].content && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {messages[messages.length - 1].content.substring(0, 20)}...
                    </Text>
                  </div>
                )}
              </div>
              <UpOutlined style={{ fontSize: 12, color: "#1890ff" }} />
            </Space>
          </Card>
        </Badge>
      )}

      {/* 展开状态 */}
      {expanded && (
        <Card
          size="small"
          style={{
            width: 400,
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            backgroundColor: "#f0f8ff",
            border: "2px solid #1890ff",
          }}
          title={
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space>
                <Avatar
                  icon={<RobotOutlined />}
                  style={{
                    backgroundColor: "#1890ff",
                  }}
                  size={24}
                />
                <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
                  AI 助手
                </Text>
              </Space>
              <Space size={4}>
                <Button
                  type="text"
                  size="small"
                  icon={<DownOutlined />}
                  onClick={toggleExpanded}
                  style={{ color: "#1890ff" }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleClose}
                  style={{ color: "#ff4d4f" }}
                />
              </Space>
            </Space>
          }
          bodyStyle={{
            padding: "12px",
            height: "360px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 消息列表 */}
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {messages.slice().reverse().map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    flexDirection: message.type === "user" ? "row-reverse" : "row",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {/* 消息气泡 */}
                  <div
                    style={{
                      maxWidth: message.type === "user" ? "80%" : "85%",
                      backgroundColor: "#ffffff",
                      borderRadius: 12,
                      padding: "12px",
                      borderLeft: `3px solid ${
                        message.type === "user"
                          ? "#52c41a"
                          : message.type === "export_prompt"
                          ? "#52c41a"
                          : message.type === "greeting"
                          ? "#1890ff"
                          : "#faad14"
                      }`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#8c8c8c",
                          display: "block",
                        }}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          marginBottom: 6,
                          color: "#262626",
                          wordBreak: "break-word",
                        }}
                      >
                        {message.content}
                      </Text>
                      {message.isLoading && (
                        <Space>
                          <Spin size="small" />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            AI正在思考...
                          </Text>
                        </Space>
                      )}
                      {message.actions && (
                        <Space wrap size={4}>
                          {message.actions.map((action, index) => (
                            <Button
                              key={index}
                              type="primary"
                              size="small"
                              onClick={() => {
                                action.onClick();
                                // 移除该操作按钮
                                setMessages((prev) =>
                                  prev.filter((msg) => msg.id !== message.id)
                                );
                              }}
                              style={{
                                fontSize: 11,
                                height: 24,
                                fontWeight: 600,
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </Space>
                      )}
                    </Space>
                  </div>

                  {/* 头像 */}
                  <Avatar
                    icon={
                      message.type === "user" ? <UserOutlined /> : <RobotOutlined />
                    }
                    style={{
                      backgroundColor: message.type === "user" ? "#52c41a" : "#1890ff",
                      flexShrink: 0,
                    }}
                    size={28}
                  />
                </div>
              ))}
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    暂无消息
                  </Text>
                </div>
              )}
              <div ref={messagesEndRef} />
            </Space>
          </div>

          {/* 输入区域 */}
          <div
            style={{
              borderTop: "1px solid #d9d9d9",
              paddingTop: "12px",
              paddingBottom: "8px",
              marginTop: "auto",
            }}
          >
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder="问我关于数据库的问题..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!databaseName || loading}
                size="small"
                maxLength={500}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={loading}
                disabled={!inputValue.trim() || !databaseName || loading}
                size="small"
              >
                发送
              </Button>
            </Space.Compact>
            {!databaseName && (
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  display: "block",
                  marginTop: 4,
                }}
              >
                💡 提示：请先选择数据库才能进行对话
              </Text>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};