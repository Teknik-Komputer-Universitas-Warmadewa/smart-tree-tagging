import { BrowserMultiFormatReader } from "@zxing/library";
import { useEffect, useRef, useState } from "react";
import { FiRefreshCw, FiCamera } from "react-icons/fi";

interface BarcodeScannerProps {
  onBack: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .listVideoInputDevices()
      .then((videoInputDevices) => {
        setDevices(videoInputDevices);
        if (videoInputDevices.length > 0) {
          startScanner(videoInputDevices[currentDeviceIndex].deviceId);
        } else {
          setError("No camera found");
        }
      })
      .catch((err) => {
        setError(err.message);
      });

    return () => {
      codeReader.reset();
    };
  }, [currentDeviceIndex]);

  const startScanner = (deviceId: string) => {
    const codeReader = new BrowserMultiFormatReader();
    codeReader.decodeFromVideoDevice(deviceId, videoRef.current!, (result, err) => {
      if (result) {
        setResult(result.getText());
      }
      if (err) {
        setError("Scanning...");
      }
    });
  };

  const handleRecord = () => {
    console.log("Recording result: ", result);
  };

  const handleRefresh = () => {
    setResult(null);
    setError(null);
  };

  const switchCamera = () => {
    if (devices.length > 1) {
      setCurrentDeviceIndex((prevIndex) => (prevIndex + 1) % devices.length);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-4 max-w-lg w-full text-center">
        <div className="flex justify-between mb-4">
          <button className="text-blue-500 hover:text-blue-700" onClick={handleRefresh}>
            <FiRefreshCw size={24} />
          </button>
          <button className="text-blue-500 hover:text-blue-700" onClick={switchCamera}>
            <FiCamera size={24} />
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-700">Barcode Scanner</h2>
        <div className="relative mt-4">
          <video ref={videoRef} className="w-full rounded-lg shadow-md" />
        </div>

        {error && <p className="text-red-500 mt-2">{error}</p>}
        {result && (
          <>
            <p className="text-green-600 font-medium mt-4">Scanned: {result}</p>
            <button
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              onClick={handleRecord}
            >
              Record
            </button>
          </>
        )}
        <button
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg w-full"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
