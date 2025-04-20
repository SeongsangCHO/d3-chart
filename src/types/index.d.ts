import React from "react";

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartProps {
  data: Data[];
  width: number;
  height: number;
  // margin?: ChartMargin;
  // xAxis?: AxisOptions;
  // yAxis?: AxisOptions;
  // tooltip?: TooltipOptions;
  pointRadius?: number;
}
export interface Data {
  x: number;
  y: number;
  label: string;
}

export interface AxisOptions {
  tickFormat?: (value: number) => string;
  tickCount?: number;
  tickSize?: number;
  tickPadding?: number;
  label?: React.ReactNode;
  // labelOffset?: number;
  // labelPosition?: "top" | "bottom" | "left" | "right";
}

export interface TooltipOptions {
  enabled?: boolean;
  format?: (d: Data) => string;
  offsetX?: number;
  offsetY?: number;
}
