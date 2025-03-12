import { useState } from "react";

interface NFCReaderProps {
  onBack: () => void;
}

const NFCReader: React.FC<NFCReaderProps> = ({ onBack }) => {
  const [nfcData, setNfcData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to read NFC tag
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
        };
      } else {
        setError("Web NFC is not supported on this device.");
      }
    } catch (err) {
      setError("Error reading NFC tag: " + (err as Error).message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4  rounded-lg ">
      <h2 className="text-xl font-bold">NFC Reader & Writer</h2>

      {/* Read NFC */}
      <button className="px-4 py-2 bg-green-500 text-white rounded-lg" onClick={startNFCScan}>
        Aktifkan Start NFC Scan
      </button>
      {nfcData && <p className="text-lg text-green-700">NFC Data: {nfcData}</p>}

      {/* Error Message */}
      {error && <p className="text-lg text-red-500">{error}</p>}

      <button className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg w-full" onClick={onBack}>
        Back
      </button>
    </div>
  );
};

export default NFCReader;
