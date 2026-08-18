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
  onShow?: () => void;
  databaseName?: string;
  visible?: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  querySuccess = false,
  rowCount = 0,
  onExport,
  onDismiss,
  onShow,
  databaseName,
  visible: propVisible = true,
}) => {
  const [visible, setVisible] = useState(propVisible);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [showBadge, setShowBadge] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastQuerySuccess, setLastQuerySuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 拖动和调整大小状态
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 24 }); // 改为右上角位置
  const [size, setSize] = useState({ width: 400, height: 500 }); // 增加初始高度
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  // 同步外部visible状态到内部状态
  useEffect(() => {
    setVisible(propVisible);
    if (propVisible) {
      // 当显示时，如果有未读消息，自动展开
      if (showBadge) {
        setExpanded(true);
      }
    }
  }, [propVisible, showBadge]);

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
    // 只在查询成功状态变化时触发一次
    if (querySuccess && !lastQuerySuccess && rowCount > 0) {
      // 如果助手是折叠状态，自动展开
      if (!expanded) {
        setExpanded(true);
        console.log('AI assistant auto-expanded for query result');
      }

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
  }, [querySuccess, rowCount, lastQuerySuccess, onExport]);

  // 更新最后查询成功状态
  useEffect(() => {
    setLastQuerySuccess(querySuccess);
  }, [querySuccess]);

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

  // 拖动处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只允许左键拖动

    e.stopPropagation(); // 防止事件冒泡
    e.preventDefault();

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });

    console.log('Drag started at position:', position);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newPosition = {
        x: moveEvent.clientX - dragStart.x,
        y: moveEvent.clientY - dragStart.y
      };

      // 限制在窗口范围内
      const maxX = window.innerWidth - size.width; // 根据当前窗口宽度限制
      const maxY = window.innerHeight - 50; // 留出底部空间
      const clampedPosition = {
        x: Math.max(0, Math.min(newPosition.x, maxX)),
        y: Math.max(0, Math.min(newPosition.y, maxY))
      };

      console.log('Drag constraints:', {
        maxX, maxY,
        newPosition, clampedPosition,
        currentSize: size,
        windowSize: { width: window.innerWidth, height: window.innerHeight }
      });

      setPosition(clampedPosition);
    };

    const handleMouseUp = () => {
      console.log('Drag ended at position:', position);
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 调整大小处理
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    console.log('Resize started at size:', size);

    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStart.x;
      const deltaY = moveEvent.clientY - dragStart.y;

      // 设置最小和最大尺寸限制
      const minWidth = 300;
      const minHeight = 400;
      const maxWidth = window.innerWidth - 40; // 增加最大宽度限制
      const maxHeight = window.innerHeight - 40; // 增加最大高度限制

      const newSize = {
        width: Math.min(maxWidth, Math.max(minWidth, size.width + deltaX)),
        height: Math.min(maxHeight, Math.max(minHeight, size.height + deltaY))
      };

      console.log('Resize constraints:', {
        minWidth, minHeight, maxWidth, maxHeight,
        currentSize: size,
        newSize,
        windowSize: { width: window.innerWidth, height: window.innerHeight },
        delta: { x: deltaX, y: deltaY }
      });

      setSize(newSize);

      setDragStart({
        x: moveEvent.clientX,
        y: moveEvent.clientY
      });
    };

    const handleResizeUp = () => {
      console.log('Resize ended at size:', size);
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeUp);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeUp);
  };

  if (!visible) return null;

  return (
    <div
      ref={dragRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        bottom: "auto",
        right: "auto",
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
              cursor: isDragging ? "grabbing" : "grab",
              backgroundColor: "#f0f8ff",
              border: "2px solid #1890ff",
              userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
              e.stopPropagation(); // 防止拖动时触发点击展开
              toggleExpanded();
            }}
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
            width: size.width,
            height: size.height,
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            backgroundColor: "#f0f8ff",
            border: "2px solid #1890ff",
            position: "relative",
            resize: "none", // 禁用原生resize，使用自定义实现
            overflow: "hidden",
            maxWidth: "none", // 移除最大宽度限制
            maxHeight: "none", // 移除最大高度限制
          }}
          title={
            <div
              style={{
                width: "100%",
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
              }}
              onMouseDown={handleMouseDown}
            >
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
            </div>
          }
          bodyStyle={{
            padding: "12px",
            height: size.height - 100, // 减去头部和底部区域的高度
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 300, // 确保内容区域有最小高度
            maxHeight: size.height - 100, // 确保不超过窗口高度
          }}
        >
          {/* 消息列表 */}
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, display: 'flex', flexDirection: 'column' }}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {messages.map((message) => (
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

          {/* 调整大小手柄 */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              cursor: "nwse-resize",
              zIndex: 10,
              background: "linear-gradient(135deg, transparent 50%, rgba(24, 144, 255, 0.3) 50%)",
              borderRadius: "0 0 0 8px",
              border: "1px solid transparent",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#1890ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
            }}
            onMouseDown={handleResizeMouseDown}
            title="拖动调整大小"
          />
        </Card>
      )}
    </div>
  );
};