import { useState, useEffect } from "react";

interface NFCReaderProps {
  onBack: () => void;
}

const NFCReader: React.FC<NFCReaderProps> = ({ onBack }) => {
  const [nfcData, setNfcData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    if (isScanning) {
      startNFCScan();
    }
  }, [isScanning]);

  const startNFCScan = async () => {
    try {
      if ("NDEFReader" in window) {
        const ndef = new NDEFReader();
        await ndef.scan();

        ndef.onreading = (event) => {
          const decoder = new TextDecoder();
          let tagContent = "";
          for (const record of event.message.records) {
            tagContent += decoder.decode(record.data);
          }

          setNfcData(tagContent);
          setIsScanning(false);
        };
      } else {
        setError("Web NFC is not supported on this device.");
        setIsScanning(false);
      }
    } catch (err) {
      setError("Error reading NFC tag: " + (err as Error).message);
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-4 max-w-lg w-full text-center">
        <div className="flex flex-col justify-center items-center mb-4">
          <h2 className="text-xl font-bold">NFC Reader & Writer</h2>

          {/* Read NFC */}
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg"
            onClick={() => setIsScanning(true)}
          >
            Aktifkan Start NFC Scan
          </button>
          {nfcData && <p className="text-lg text-green-700">NFC Data: {nfcData}</p>}

          {/* Error Message */}
          {error && <p className="text-lg text-red-500">{error}</p>}

          <button
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg w-28"
            onClick={onBack}
          >
            Back
          </button>
        </div>
      </div>

      {/* Modal Scanning */}
      {isScanning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center flex-col flex justify-center items-center">
            <h3 className="text-lg font-semibold">Scanning NFC...</h3>
            <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin mt-4"></div>
            <p className="mt-2 text-gray-600">Tempelkan NFC tag ke perangkat Anda</p>
            <button
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
              onClick={() => setIsScanning(false)}
            >
              Batalkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFCReader;
