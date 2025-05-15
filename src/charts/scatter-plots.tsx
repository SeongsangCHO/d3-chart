import { useEffect, useRef, useState } from "react";
import { ChartProps, Data } from "../types";

interface ExtendedData extends Data {
  img?: HTMLImageElement;
}

const padding = 50;
const fontSize = 12;
const imageSize = 40; // 이미지 크기 설정

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
}: Omit<ChartProps, "data"> & { data: ExtendedData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { minX, maxX, minY, maxY } = getMinMaxData(data as Data[]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const scaleX = (x: number) =>
    ((x - minX) / (maxX - minX || 1)) * (width - padding * 2) + padding;
  const scaleY = (y: number) =>
    height -
    padding -
    ((y - minY) / (maxY - minY || 1)) * (height - padding * 2);

  // 라벨과 이미지 위치 상태
  const [labels, setLabels] = useState(() =>
    data.map((d) => ({
      x: scaleX(d.x) + 10,
      y: scaleY(d.y) - fontSize - imageSize - 5, // 이미지 크기만큼 위로 올림
      imageX: scaleX(d.x) + 10,
      imageY: scaleY(d.y) - imageSize - 5,
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

    const drawImage = (x: number, y: number, img: HTMLImageElement) => {
      ctx.drawImage(img, x, y, imageSize, imageSize);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      drawAxis();

      // 데이터 포인트와 마커 그리기
      data.forEach((d) => {
        drawMarker(scaleX(d.x), scaleY(d.y));
      });

      // 라벨과 이미지 그리기
      labelsRef.current.forEach((label, i) => {
        const text = data[i].label;
        const textWidth = ctx.measureText(text).width;

        // 이미지 그리기
        if (data[i].img) {
          drawImage(label.imageX, label.imageY, data[i].img);
        }

        // 텍스트 라벨 그리기
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
      ctx.textBaseline = "top";

      for (let i = labelsRef.current.length - 1; i >= 0; i--) {
        const label = labelsRef.current[i];
        const text = data[i].label;
        const w = ctx.measureText(text).width;
        const h = fontSize;

        // 라벨 영역 체크
        const withinLabelX = mx >= label.x && mx <= label.x + w;
        const withinLabelY = my >= label.y && my <= label.y + h;

        // 이미지 영역 체크
        const withinImageX =
          mx >= label.imageX && mx <= label.imageX + imageSize;
        const withinImageY =
          my >= label.imageY && my <= label.imageY + imageSize;

        if ((withinLabelX && withinLabelY) || (withinImageX && withinImageY)) {
          setDragIndex(i);
          console.log(mx, label, i);
          // 항상 이미지 위치를 기준으로 offset 계산
          setOffset({ x: mx - label.imageX, y: my - label.imageY });
          break;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (dragIndex === null) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const updated = [...labelsRef.current];
      // 이미지 위치를 기준으로 전체 그룹 이동
      const newImageX = mx - offset.x;
      const newImageY = my - offset.y;

      updated[dragIndex] = {
        imageX: newImageX,
        imageY: newImageY,
        x: newImageX,
        y: newImageY - fontSize, // 이미지 위에 라벨 위치
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
