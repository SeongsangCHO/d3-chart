/// <reference lib="webworker" />

self.importScripts("/RDKit_minimal.js");

let RDKit: unknown = null;
let isReady = false;

self.onmessage = async (e) => {
  if (!isReady) {
    RDKit = await (self as unknown).initRDKitModule({
      locateFile: (file: string) => "/rdkit/" + file,
    });
    isReady = true;
  }
  const { id, payload } = e.data;

  const startTime = performance.now();

  try {
    const mol = (RDKit as unknown).get_mol(payload.smiles);
    const svg = mol.get_svg();
    mol.delete();

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    self.postMessage({
      id,
      svg,
      processingTime,
    });
  } catch (error) {
    console.error("Error processing molecule:", error);
    self.postMessage({
      id,
      error: "Failed to process molecule",
    });
  }
};
