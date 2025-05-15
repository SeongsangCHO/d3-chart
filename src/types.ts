export interface Data {
  x: number;
  y: number;
  label: string;
  smiles: string;
  img?: HTMLImageElement;
}

export interface ChartProps {
  data: Data[];
  width: number;
  height: number;
  pointRadius?: number;
}
