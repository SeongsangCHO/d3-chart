import { useEffect, useRef, useState } from "react";
import { ChartProps, Data } from "../types";

const padding = 50;
const fontSize = 12;

function getMinMaxData(data: Data[]) {
  const minX = Math.min(...data.map((d) => d.x));
  const maxX = Math.max(...data.map((d) => d.x));
  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));

  return { minX, maxX, minY, maxY };
}

export function ScatterPlot({
  data,
  width,
  height,
  pointRadius = 5,
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { minX, maxX, minY, maxY } = getMinMaxData(data);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const scaleX = (x: number) =>
    ((x - minX) / (maxX - minX || 1)) * (width - padding * 2) + padding;
  const scaleY = (y: number) =>
    height -
    padding -
    ((y - minY) / (maxY - minY || 1)) * (height - padding * 2);

  // 라벨 좌상단 기준 위치
  const [labels, setLabels] = useState(() =>
    data.map((d) => ({
      x: scaleX(d.x) + 10,
      y: scaleY(d.y) - fontSize,
    }))
  );
  const labelsRef = useRef(labels);
  useEffect(() => {
    labelsRef.current = labels;
  }, [labels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    let frameId: number;

    const drawAxis = () => {
      // axis
      ctx.font = `${fontSize}px sans-serif`;
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // tick + label
      const xTicks = 5;
      const yTicks = 5;
      ctx.fillStyle = "#666";
      ctx.textAlign = "center";

      for (let i = 0; i <= xTicks; i++) {
        const t = i / xTicks;
        const val = minX + (maxX - minX) * t;
        const x = scaleX(val);
        ctx.beginPath();
        ctx.moveTo(x, height - padding);
        ctx.lineTo(x, height - padding + 4);
        ctx.stroke();
        ctx.fillText(val.toFixed(0), x, height - padding + 16);
      }

      ctx.textAlign = "right";
      for (let i = 0; i <= yTicks; i++) {
        const t = i / yTicks;
        const val = minY + (maxY - minY) * t;
        const y = scaleY(val);
        ctx.beginPath();
        ctx.moveTo(padding - 4, y);
        ctx.lineTo(padding, y);
        ctx.stroke();
        ctx.fillText(val.toFixed(0), padding - 8, y + 4);
      }
    };

    const drawMarker = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = "steelblue";
      ctx.fill();
    };

    const drawLabel = (x: number, y: number, text: string) => {
      ctx.fillStyle = "#000";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(text, x, y);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      drawAxis();
      data.forEach((d) => {
        drawMarker(scaleX(d.x), scaleY(d.y));
      });

      labelsRef.current.forEach((label, i) => {
        const text = data[i].label;
        const textWidth = ctx.measureText(text).width;

        drawLabel(label.x, label.y, text);

        ctx.fillStyle = "rgba(255, 200, 0, 0.55)";
        ctx.fillRect(label.x, label.y, textWidth, fontSize);
      });

      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [data, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textBaseline = "top"; //
      for (let i = 0; i < labelsRef.current.length; i++) {
        const label = labelsRef.current[i];
        const text = data[i].label;
        const w = ctx.measureText(text).width;
        const h = fontSize;

        const withinX = mx >= label.x && mx <= label.x + w;
        const withinY = my >= label.y && my <= label.y + h;

        if (withinX && withinY) {
          setDragIndex(i);
          setOffset({ x: mx - label.x, y: my - label.y });
          break;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (dragIndex === null) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const updated = [...labelsRef.current];
      updated[dragIndex] = {
        x: mx - offset.x,
        y: my - offset.y,
      };

      labelsRef.current = updated;
      setLabels(updated);
    };

    const handleMouseUp = () => {
      setDragIndex(null);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragIndex, offset]);

  return <canvas ref={canvasRef} width={width} height={height} />;
}
