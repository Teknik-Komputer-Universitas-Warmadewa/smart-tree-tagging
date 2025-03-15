import { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";
import NFCReader from "./NFCReader";
import styled from "styled-components";

const Container = styled.div`
  color: white;
  width: calc(100% - 240px);
  position: relative;

  @media only screen and (max-width: 600px) {
    width: calc(100% - 40px);
  }
`;

const RecordScanner: React.FC = () => {
  const [mode, setMode] = useState<"barcode" | "nfc" | null>("barcode");

  return (
    <Container>
      <h1 className="text-2xl font-bold text-center text-gray-800">Smart Tree Tagging</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 b">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
          <li className="me-2">
            <button
              onClick={() => setMode("barcode")}
              className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                mode === "barcode"
                  ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              }`}
            >
              <svg
                className={`w-4 h-4 me-2 ${
                  mode === "barcode"
                    ? "text-blue-600 dark:text-blue-500"
                    : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300"
                }`}
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 18"
              >
                <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Z" />
              </svg>
              Scan Barcode
            </button>
          </li>
          <li className="me-2">
            <button
              onClick={() => setMode("nfc")}
              className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                mode === "nfc"
                  ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
              }`}
            >
              <svg
                className={`w-4 h-4 me-2 ${
                  mode === "nfc"
                    ? "text-blue-600 dark:text-blue-500"
                    : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300"
                }`}
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 11.424V1a1 1 0 1 0-2 0v10.424a3.228 3.228 0 0 0 0 6.152V19a1 1 0 1 0 2 0v-1.424a3.228 3.228 0 0 0 0-6.152ZM19.25 14.5A3.243 3.243 0 0 0 17 11.424V1a1 1 0 0 0-2 0v10.424a3.227 3.227 0 0 0 0 6.152V19a1 1 0 1 0 2 0v-1.424a3.243 3.243 0 0 0 2.25-3.076Z" />
              </svg>
              Scan NFC
            </button>
          </li>
        </ul>
      </div>

      {/* Content based on selected tab */}
      <div className="mt-4">
        {mode === "barcode" && <BarcodeScanner onBack={() => setMode(null)} />}
        {mode === "nfc" && <NFCReader onBack={() => setMode(null)} />}
      </div>
    </Container>
  );
};

export default RecordScanner;
