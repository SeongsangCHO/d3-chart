import { useEffect, useRef, useState } from "react";
import { ScatterPlot } from "./charts/scatter-plots";
import { RDKitModule } from "@rdkit/rdkit";

interface AppProps {
  rdkit: RDKitModule;
}

interface TaskPayload {
  smiles: string;
  index: number;
}

interface DataPoint {
  x: number;
  y: number;
  label: string;
  smiles: string;
  img?: HTMLImageElement;
}

class Task {
  id: string;
  payload: TaskPayload;

  constructor(id: string, payload: TaskPayload) {
    this.id = id;
    this.payload = payload;
  }
}

const WORKER_COUNT = 16;
const DATA_COUNT = 100;

const MOCK_DATA: DataPoint[] = Array.from({ length: DATA_COUNT }, (_, j) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  label: `Pt ${j}`,
  smiles:
    "CC(C)CC(NC(=O)C1CCCN1C(=O)C(CC(C)C)NC(=O)C(Cc1ccc(cc1)O)NC(=O)C(C(C)C)NC(=O)C(C(C)C)NC(=O)C(C(C)C)NC(=O)C(Cc2ccc(cc2)O)NC(=O)C(C(C)C)NC(=O)C(C(C)C)NC(=O)C(C(C)C)NC(=O)C(CC(C)C)NC(=O)C(N)Cc3ccc(cc3)O)C(=O)N",
}));

interface WorkerHistory {
  workerId: number;
  taskId: string;
  startTime: number;
  endTime?: number;
  status: "completed" | "processing";
}

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  totalTasks: number;
  completedTasks: number;
  averageTime?: number;
}

function WorkerDashboard({
  taskQueue,
  workerStatus,
  results,
  workerHistory,
  performanceMetrics,
}: {
  taskQueue: Task[];
  workerStatus: (string | null)[];
  results: (string | null)[];
  workerHistory: WorkerHistory[];
  performanceMetrics: PerformanceMetrics;
}) {
  const totalTime = performanceMetrics.endTime
    ? performanceMetrics.endTime - performanceMetrics.startTime
    : Date.now() - performanceMetrics.startTime;

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(2)}초`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds.toFixed(0)}초`;
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        marginBottom: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        color: "#fff",
      }}
    >
      <h3 style={{ color: "#fff", marginTop: 0 }}>워커 풀 상태</h3>
      <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
        <div>
          <strong>남은 태스크:</strong> {taskQueue.length}
        </div>
        <div>
          <strong>완료된 태스크:</strong>{" "}
          {results.filter((r) => r !== null).length}
        </div>
        <div>
          <strong>총 소요시간:</strong> {formatTime(totalTime)}
        </div>
        {performanceMetrics.averageTime && (
          <div>
            <strong>평균 처리시간:</strong>{" "}
            {formatTime(performanceMetrics.averageTime)}
          </div>
        )}
        <div>
          <strong>진행률:</strong>{" "}
          {(
            (results.filter((r) => r !== null).length / MOCK_DATA.length) *
            100
          ).toFixed(1)}
          %
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {workerStatus.map((status, idx) => (
          <div
            key={idx}
            style={{
              padding: "10px",
              backgroundColor: "#2a2a2a",
              borderRadius: "4px",
              minWidth: "100px",
              textAlign: "center",
              border: "1px solid #404040",
            }}
          >
            <div>워커 {idx + 1}</div>
            <div
              style={{
                fontSize: "12px",
                color: status ? "#64b5f6" : "#9e9e9e",
              }}
            >
              {status ? `태스크 ${status} 처리중` : "대기중"}
            </div>
          </div>
        ))}
      </div>
      <div>
        <h4 style={{ color: "#fff", marginTop: 0 }}>현재 작업</h4>
        <div
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            border: "1px solid #404040",
            borderRadius: "4px",
            padding: "10px",
            backgroundColor: "#2a2a2a",
          }}
        >
          {workerHistory.map((history, idx) => (
            <div
              key={idx}
              style={{
                padding: "8px",
                borderBottom: "1px solid #404040",
                fontSize: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>워커 {history.workerId + 1}</span>
                <span style={{ color: "#64b5f6" }}>처리중</span>
              </div>
              <div style={{ fontSize: "12px", color: "#9e9e9e" }}>
                태스크 {history.taskId}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MainThreadDashboard({
  data,
  performanceMetrics,
}: {
  data: DataPoint[];
  performanceMetrics: PerformanceMetrics;
}) {
  const totalTime = performanceMetrics.endTime
    ? performanceMetrics.endTime - performanceMetrics.startTime
    : Date.now() - performanceMetrics.startTime;

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(2)}초`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds.toFixed(0)}초`;
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        marginBottom: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        color: "#fff",
      }}
    >
      <h3 style={{ color: "#fff", marginTop: 0 }}>메인 스레드 처리</h3>
      <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
        <div>
          <strong>총 소요시간:</strong> {formatTime(totalTime)}
        </div>
        <div>
          <strong>처리된 분자:</strong> {data.filter((d) => d.img).length}
        </div>
        <div>
          <strong>진행률:</strong>{" "}
          {(
            (data.filter((d) => d.img).length / MOCK_DATA.length) *
            100
          ).toFixed(1)}
          %
        </div>
      </div>
    </div>
  );
}

function App({ rdkit }: AppProps) {
  const [data, setData] = useState(MOCK_DATA);
  const taskQueueRef = useRef<Task[]>([]);
  const workerStatusRef = useRef<(string | null)[]>([]);
  const resultsRef = useRef<(string | null)[]>([]);
  const [taskQueue, setTaskQueue] = useState<Task[]>([]);
  const [workerStatus, setWorkerStatus] = useState<(string | null)[]>([]);
  const [results, setResults] = useState<(string | null)[]>([]);
  const [workerHistory, setWorkerHistory] = useState<WorkerHistory[]>([]);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics>({
      startTime: 0,
      totalTasks: MOCK_DATA.length,
      completedTasks: 0,
    });

  const [mainThreadData, setMainThreadData] = useState(MOCK_DATA);
  const [mainThreadMetrics, setMainThreadMetrics] =
    useState<PerformanceMetrics>({
      startTime: 0,
      totalTasks: MOCK_DATA.length,
      completedTasks: 0,
    });

  useEffect(() => {
    if (!rdkit) {
      return;
    }

    const startTime = Date.now();
    const newData = [...MOCK_DATA];

    newData.forEach((d) => {
      const mol = rdkit.get_mol(d.smiles);
      const svg = mol.get_svg();

      // svg to image
      const img = new Image();
      img.src = "data:image/svg+xml;base64," + btoa(svg);
      d.img = img;

      mol.delete();
    });

    const endTime = Date.now();
    setMainThreadData(newData);
    setMainThreadMetrics({
      startTime,
      endTime,
      totalTasks: MOCK_DATA.length,
      completedTasks: MOCK_DATA.length,
    });
  }, [rdkit]);

  useEffect(() => {
    // 워커 풀 생성
    const workers = Array.from(
      { length: WORKER_COUNT },
      () => new Worker(new URL("./worker/rdkit.worker.ts", import.meta.url))
    );

    // 태스크 큐 초기화
    taskQueueRef.current = MOCK_DATA.map(
      (data, index) =>
        new Task(index.toString(), { smiles: data.smiles, index })
    );
    setTaskQueue(taskQueueRef.current);
    setPerformanceMetrics((prev) => ({ ...prev, startTime: Date.now() }));

    // 워커 상태 초기화
    workerStatusRef.current = Array(WORKER_COUNT).fill(null);
    setWorkerStatus(workerStatusRef.current);
    resultsRef.current = Array(MOCK_DATA.length).fill(null);
    setResults(resultsRef.current);

    // 태스크 할당 함수
    const assignTaskToWorker = (workerIdx: number) => {
      if (taskQueueRef.current.length === 0) return;
      if (workerStatusRef.current[workerIdx] !== null) return;

      const task = taskQueueRef.current.shift();
      if (!task) return;

      workerStatusRef.current[workerIdx] = task.id;
      setWorkerStatus([...workerStatusRef.current]);
      setTaskQueue([...taskQueueRef.current]);

      setWorkerHistory((prev) => [
        ...prev,
        {
          workerId: workerIdx,
          taskId: task.id,
          startTime: Date.now(),
          status: "processing",
        },
      ]);

      workers[workerIdx].postMessage(task);
    };

    // 워커별 메시지 핸들러
    workers.forEach((worker, idx) => {
      worker.onmessage = (e) => {
        const { id, svg, processingTime } = e.data;
        resultsRef.current[Number(id)] = svg;
        setResults([...resultsRef.current]);
        workerStatusRef.current[idx] = null;
        setWorkerStatus([...workerStatusRef.current]);

        // 완료된 작업은 히스토리에서 제거
        setWorkerHistory((prev) =>
          prev.filter((h) => !(h.workerId === idx && h.taskId === id))
        );

        // 성능 메트릭스 업데이트
        const completedCount = resultsRef.current.filter(
          (r) => r !== null
        ).length;
        const currentTime = Date.now();

        setPerformanceMetrics((prev) => ({
          ...prev,
          completedTasks: completedCount,
          endTime:
            completedCount === MOCK_DATA.length ? currentTime : undefined,
          averageTime: processingTime || 0,
        }));

        // 결과가 있으면 데이터 업데이트
        const newData = MOCK_DATA.map((d, i) => {
          const svg = resultsRef.current[i];
          if (!svg) return d;

          const img = new Image();
          img.src = "data:image/svg+xml;base64," + btoa(svg);
          return { ...d, img };
        });
        setData(newData);

        // 다음 태스크 할당
        assignTaskToWorker(idx);
      };

      // 최초 태스크 할당
      assignTaskToWorker(idx);
    });

    // 클린업
    return () => {
      workers.forEach((w) => w.terminate());
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "20px",
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        <div style={{ flex: 1 }}>
          <WorkerDashboard
            taskQueue={taskQueue}
            workerStatus={workerStatus}
            results={results}
            workerHistory={workerHistory}
            performanceMetrics={performanceMetrics}
          />
          <ScatterPlot width={300} height={300} data={data} />
        </div>
        <div style={{ flex: 1 }}>
          <MainThreadDashboard
            data={mainThreadData}
            performanceMetrics={mainThreadMetrics}
          />
          <ScatterPlot width={300} height={300} data={mainThreadData} />
        </div>
      </div>
    </div>
  );
}

export default App;
