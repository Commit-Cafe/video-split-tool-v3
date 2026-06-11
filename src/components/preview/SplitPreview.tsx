/**
 * 分割预览组件
 * 右侧 280x180 固定画布，比例滑杆（画布上的可拖动虚线 + 圆形手柄）+ 数字滑块 + 数字输入 三联动
 */
import { useRef, useEffect, useCallback } from 'react';
import { Typography, Space, Segmented, Slider, InputNumber } from 'antd';
import { useMergeSettingsStore, useTemplateStore } from '@/store';

const { Text } = Typography;

const PREVIEW_W = 280;
const PREVIEW_H = 180;
const HANDLE_R = 6; // 拖动手柄半径

export default function SplitPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameImg = useRef<HTMLImageElement | null>(null);

  const { frameUrl } = useTemplateStore();
  const { splitMode, splitRatio, setSplitRatio } = useMergeSettingsStore();

  /** 加载预览帧图片 */
  useEffect(() => {
    if (!frameUrl) {
      frameImg.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      frameImg.current = img;
      draw();
    };
    img.src = frameUrl.startsWith('/')
      ? `http://localhost:${window.__BACKEND_PORT__ || 18000}${frameUrl}`
      : frameUrl;
  }, [frameUrl]);

  /** 把 (0..1) 比例转成画布上分割线像素位置 */
  const ratioToLinePos = useCallback((ratio: number, drawW: number, drawH: number, offsetX: number, offsetY: number) => {
    return splitMode === 'horizontal'
      ? offsetX + drawW * ratio
      : offsetY + drawH * ratio;
  }, [splitMode]);

  /** 绘制预览 */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;

    // 背景：温暖米色画布
    ctx.fillStyle = '#F0EBE0';
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    if (frameImg.current) {
      const img = frameImg.current;
      const scale = Math.min(PREVIEW_W / img.width, PREVIEW_H / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (PREVIEW_W - drawW) / 2;
      const offsetY = (PREVIEW_H - drawH) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // === 滑杆：虚线分割线 ===
      const linePos = ratioToLinePos(splitRatio, drawW, drawH, offsetX, offsetY);
      ctx.strokeStyle = '#C8553D';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      if (splitMode === 'horizontal') {
        ctx.moveTo(linePos, offsetY);
        ctx.lineTo(linePos, offsetY + drawH);
      } else {
        ctx.moveTo(offsetX, linePos);
        ctx.lineTo(offsetX + drawW, linePos);
      }
      ctx.stroke();

      // 滑杆两端的"手柄"（让用户一眼看出这里可拖）
      ctx.setLineDash([]);
      ctx.fillStyle = '#C8553D';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      const drawHandle = (cx: number, cy: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, HANDLE_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      };
      if (splitMode === 'horizontal') {
        drawHandle(linePos, offsetY + HANDLE_R + 2);
        drawHandle(linePos, offsetY + drawH - HANDLE_R - 2);
      } else {
        drawHandle(offsetX + HANDLE_R + 2, linePos);
        drawHandle(offsetX + drawW - HANDLE_R - 2, linePos);
      }

      // === 区域标注 A / B ===
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';

      // A 区域 - 青绿
      ctx.fillStyle = 'rgba(88, 139, 139, 0.95)';
      ctx.fillRect(offsetX + 2, offsetY + 2, 16, 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('A', offsetX + 6, offsetY + 14);

      // B 区域 - 琥珀
      if (splitMode === 'horizontal') {
        ctx.fillStyle = 'rgba(212, 162, 76, 0.95)';
        ctx.fillRect(linePos + 2, offsetY + 2, 16, 16);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('B', linePos + 6, offsetY + 14);
      } else {
        ctx.fillStyle = 'rgba(212, 162, 76, 0.95)';
        ctx.fillRect(offsetX + 2, linePos + 2, 16, 16);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('B', offsetX + 6, linePos + 14);
      }
    } else {
      // 无预览帧时的占位
      ctx.fillStyle = '#8A8580';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('选择模板视频后显示预览', PREVIEW_W / 2, PREVIEW_H / 2);
    }
  }, [splitMode, splitRatio, ratioToLinePos]);

  useEffect(() => {
    draw();
  }, [draw]);

  /**
   * 滑杆（画布上）拖动：把鼠标位置映射成比例
   * 鼠标在已加载的图片区域内才生效，否则不响应
   */
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !frameImg.current) return;

      const updateRatio = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        if (splitMode === 'horizontal') {
          setSplitRatio(Math.max(0, Math.min(1, x)));
        } else {
          setSplitRatio(Math.max(0, Math.min(1, y)));
        }
      };

      const handleMouseMove = (ev: MouseEvent) => updateRatio(ev.clientX, ev.clientY);
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      updateRatio(e.nativeEvent.clientX, e.nativeEvent.clientY);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [splitMode, setSplitRatio]
  );

  return (
    <div>
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Space size={6} align="center">
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>分割方式</Text>
          <Segmented
            size="small"
            value={splitMode}
            onChange={(v) => useMergeSettingsStore.getState().setSplitMode(v as string)}
            options={[
              { label: '左右', value: 'horizontal' },
              { label: '上下', value: 'vertical' },
            ]}
          />
        </Space>

        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 6,
            overflow: 'hidden',
            cursor: 'ew-resize', // 暗示可拖动
            display: 'inline-block',
            background: '#F0EBE0',
            boxShadow: 'var(--shadow-sm)',
            width: PREVIEW_W,
            height: PREVIEW_H,
          }}
        >
          <canvas
            ref={canvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            onMouseDown={handleCanvasMouseDown}
            style={{ display: 'block' }}
          />
        </div>

        {/* 比例控制：滑块 + 数字输入（双控件） */}
        <Space size={6} style={{ width: PREVIEW_W }} align="center">
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 36, whiteSpace: 'nowrap' }}>
            比例
          </Text>
          <Slider
            min={0}
            max={100}
            step={1}
            value={Math.round(splitRatio * 100)}
            onChange={(v) => setSplitRatio(v / 100)}
            style={{ flex: 1, margin: 0 }}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
          <InputNumber
            min={0}
            max={100}
            step={1}
            size="small"
            value={Math.round(splitRatio * 100)}
            onChange={(v) => {
              if (v === null || v === undefined) return;
              setSplitRatio(Math.max(0, Math.min(1, v / 100)));
            }}
            formatter={(v) => `${v}%`}
            parser={(v) => parseInt((v || '').replace('%', ''), 10) || 0}
            style={{ width: 64 }}
          />
        </Space>
      </Space>
    </div>
  );
}
