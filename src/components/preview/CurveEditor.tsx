/**
 * 曲线编辑器组件
 * HTML5 Canvas + 可拖拽控制点 + Catmull-Rom 样条插值
 * 移植自 DividerMixin._calculate_bezier_curve
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import { Typography } from 'antd';
import { useDividerSettingsStore, useMergeSettingsStore } from '@/store';

const { Text } = Typography;

interface CurveEditorProps {
  width?: number;
  height?: number;
}

/** Catmull-Rom 样条插值（TypeScript 移植） */
function catmullRomSpline(
  points: [number, number][],
  width: number,
  height: number,
  numSegments: number = 100
): [number, number][] {
  if (points.length === 0) return [];

  // 归一化坐标 → 像素坐标
  const actual: [number, number][] = points.map(([px, py]) => [
    Math.round(px * width),
    Math.round(py * height),
  ]);

  if (actual.length === 2) {
    const [p0, p1] = actual;
    const result: [number, number][] = [];
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      result.push([
        Math.round(p0[0] + (p1[0] - p0[0]) * t),
        Math.round(p0[1] + (p1[1] - p0[1]) * t),
      ]);
    }
    return result;
  }

  // 扩展首尾点
  const extended: [number, number][] = [actual[0], ...actual, actual[actual.length - 1]];
  const segmentsPerSpan = Math.max(10, Math.floor(numSegments / (actual.length - 1)));

  const result: [number, number][] = [];
  for (let i = 1; i < extended.length - 2; i++) {
    const [p0, p1, p2, p3] = [extended[i - 1], extended[i], extended[i + 1], extended[i + 2]];
    for (let j = 0; j < segmentsPerSpan; j++) {
      const t = j / segmentsPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;

      const x = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
      );
      const y = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
      );
      result.push([Math.round(x), Math.round(y)]);
    }
  }

  result.push(actual[actual.length - 1]);
  return result;
}

export default function CurveEditor({ width = 280, height = 180 }: CurveEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragIndex = useRef<number | null>(null);

  const curvePoints = useDividerSettingsStore((s) => s.curvePoints);
  const splitMode = useMergeSettingsStore((s) => s.splitMode);
  const dividerWidth = useDividerSettingsStore((s) => s.width);
  const dividerColor = useDividerSettingsStore((s) => s.color);
  const setCurvePoints = useDividerSettingsStore((s) => s.setCurvePoints);

  /** 绘制曲线编辑器 */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // 背景 - 温暖米色
    ctx.fillStyle = '#F0EBE0';
    ctx.fillRect(0, 0, width, height);

    // 网格线 - 浅棕
    ctx.strokeStyle = '#D6CFC1';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (curvePoints.length === 0) return;

    // 计算 Catmull-Rom 曲线
    const curvePixels = catmullRomSpline(curvePoints, width, height);

    // 绘制蒙版区域 - 砖红半透明
    ctx.fillStyle = 'rgba(200, 85, 61, 0.12)';
    ctx.beginPath();
    if (splitMode === 'horizontal') {
      ctx.moveTo(0, 0);
      curvePixels.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(0, height);
    } else {
      ctx.moveTo(0, 0);
      curvePixels.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(width, 0);
    }
    ctx.closePath();
    ctx.fill();

    // 绘制曲线
    if (curvePixels.length >= 2) {
      ctx.strokeStyle = dividerColor || '#C8553D';
      ctx.lineWidth = Math.max(1, dividerWidth);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(curvePixels[0][0], curvePixels[0][1]);
      curvePixels.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.stroke();
    }

    // 绘制控制点 - 砖红外圈+白边
    curvePoints.forEach(([px, py], index) => {
      const x = px * width;
      const y = py * height;

      // 控制点外圈
      ctx.fillStyle = '#C8553D';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 序号
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), x, y);
    });
  }, [width, height, curvePoints, splitMode, dividerWidth, dividerColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  /** 鼠标拖拽控制点 */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;

      // 检测是否点击到控制点（距离阈值 15px）
      const threshold = 15 / Math.max(rect.width, rect.height);
      for (let i = 0; i < curvePoints.length; i++) {
        const dx = mx - curvePoints[i][0];
        const dy = my - curvePoints[i][1];
        if (Math.sqrt(dx * dx + dy * dy) < threshold) {
          dragIndex.current = i;
          return;
        }
      }
    },
    [curvePoints]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dragIndex.current === null) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const my = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      const newPoints = [...curvePoints] as [number, number][];
      newPoints[dragIndex.current] = [mx, my];
      setCurvePoints(newPoints);
    },
    [curvePoints, setCurvePoints]
  );

  const handleMouseUp = useCallback(() => {
    dragIndex.current = null;
  }, []);

  /** 双击添加控制点 */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;

      // 在最近的线段中插入新点
      const newPoints = [...curvePoints] as [number, number][];
      if (newPoints.length < 10) {
        // 简单策略：按 x/y 排序后插入
        const sortBy = splitMode === 'horizontal' ? 1 : 0;
        newPoints.push([mx, my]);
        newPoints.sort((a, b) => a[sortBy] - b[sortBy]);
        setCurvePoints(newPoints);
      }
    },
    [curvePoints, splitMode, setCurvePoints]
  );

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          border: '1px solid var(--border)',
          borderRadius: 6,
          cursor: 'crosshair',
          display: 'block',
          background: '#F0EBE0',
          boxShadow: 'var(--shadow-sm)',
        }}
      />
      <Text style={{ color: 'var(--text-tertiary)', fontSize: 11, display: 'block', marginTop: 6, lineHeight: 1.5 }}>
        <div>拖拽控制点调整曲线 · 双击添加控制点 · 当前共 {curvePoints.length} 个点</div>
        <div style={{ marginTop: 2 }}>用于在模板与列表之间绘制不规则分界线，关闭后回退到直线分割。</div>
      </Text>
    </div>
  );
}
