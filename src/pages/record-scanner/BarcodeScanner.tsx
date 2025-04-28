import { BrowserMultiFormatReader } from "@zxing/library";
import { onAuthStateChanged, User } from "firebase/auth";
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { auth, db } from "../../firebase";
import { useProject } from "../../hook/useProject";
import { TreeData, TreeType } from "../../types";

interface BarcodeScannerProps {
  onBack: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { selectedProject } = useProject();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(true);

  // Input states
  const [remark, setRemark] = useState("");
  const [type, setType] = useState<TreeType | null>(null);
  const [age, setAge] = useState("");
  const [fertilizationDate, setFertilizationDate] = useState(new Date().toISOString());
  const [pesticideDate, setPesticideDate] = useState(new Date().toISOString());
  const [wateringDate, setWateringDate] = useState(new Date().toISOString());

  // Checkbox states (default true for all)
  const [updateAll, setUpdateAll] = useState(true);
  const [updateRemark, setUpdateRemark] = useState(true);
  const [updateType, setUpdateType] = useState(true);
  const [updateAge, setUpdateAge] = useState(true);
  const [updateFertilization, setUpdateFertilization] = useState(true);
  const [updatePesticide, setUpdatePesticide] = useState(true);
  const [updateWatering, setUpdateWatering] = useState(true);

  // Log state as an object with arrays
  const [treeLog, setTreeLog] = useState<{ [id: string]: TreeData[] }>({});

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Get geolocation (optional)
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.log("Geolocation not allowed or failed: " + err.message);
      }
    );
  }, []);

  // Fetch existing logs and pre-fill inputs when a barcode is scanned
  useEffect(() => {
    const fetchTreeLogs = async () => {
      if (!result || !selectedProject) return;

      try {
        const docRef = doc(db, "projects", selectedProject.id, "trees", result);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as { logs: TreeData[] };
          if (data.logs?.length) {
            // Sort logs by updatedAt to get the latest entry
            const sortedLogs = data.logs.sort((a, b) =>
              (b.updatedAt || "").localeCompare(a.updatedAt || "")
            );
            const latestLog = sortedLogs[0];

            // Pre-fill input fields with the latest log data
            setRemark(latestLog.remark || "");
            setType(latestLog.type || null);
            setAge(latestLog.age ? latestLog.age.toString() : "");
            setFertilizationDate(latestLog.fertilizationDate || "");
            setPesticideDate(latestLog.pesticideDate || "");
            setWateringDate(latestLog.wateringDate || "");

            // Update treeLog state to display all logs
            setTreeLog((prevLog) => ({
              ...prevLog,
              [result]: sortedLogs,
            }));
          }
        }
      } catch (err) {
        setError("Error fetching tree logs: " + (err as Error).message);
      }
    };

    fetchTreeLogs();
  }, [result, selectedProject]);

  // Initialize the barcode scanner
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

  const handleRecord = async () => {
    if (!user) {
      setError("Please login to record tree data");
      return;
    }
    if (!selectedProject) {
      setError("No project selected");
      return;
    }
    if (!result) return;

    setIsLoading(true);
    setError(null);

    const updatedAt = new Date().toISOString();
    const currentDate = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format

    // Fetch the latest log to use as the base for non-date fields
    const docRef = doc(db, "projects", selectedProject.id, "trees", result);
    const docSnap = await getDoc(docRef);
    let latestLog: TreeData | null = null;

    if (docSnap.exists()) {
      const data = docSnap.data() as { logs: TreeData[] };
      if (data.logs?.length) {
        latestLog = data.logs.sort((a, b) =>
          (b.updatedAt || "").localeCompare(a.updatedAt || "")
        )[0];
      }
    }

    const treeData: TreeData = {
      id: result,
      remark: updateAll || updateRemark ? remark : latestLog?.remark || "",
      type: updateAll || updateType ? type : latestLog?.type || null,
      age: updateAll || updateAge ? parseInt(age) || 0 : latestLog?.age || 0,
      fertilizationDate:
        updateAll || updateFertilization ? currentDate : latestLog?.fertilizationDate || "",
      pesticideDate: updateAll || updatePesticide ? currentDate : latestLog?.pesticideDate || "",
      wateringDate: updateAll || updateWatering ? currentDate : latestLog?.wateringDate || "",
      updatedAt,
    };

    try {
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          logs: arrayUnion(treeData),
        });
      } else {
        await setDoc(docRef, {
          id: result,
          logs: [treeData],
        });
      }

      // Update local tree log state
      setTreeLog((prevLog) => {
        const previousEntries = prevLog[result] || [];
        return {
          ...prevLog,
          [result]: [...previousEntries, treeData].sort((a, b) =>
            (b.updatedAt || "").localeCompare(a.updatedAt || "")
          ),
        };
      });

      setError("Tree data saved successfully");
    } catch (err) {
      setError("Error saving to Firebase: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setResult(null);
    setError(null);
    setRemark("");
    setType(null);
    setAge("");
    setFertilizationDate("");
    setPesticideDate("");
    setWateringDate("");
    setUpdateAll(true);
    setTreeLog({});
  };

  const switchCamera = () => {
    if (devices.length > 1) {
      setCurrentDeviceIndex((prevIndex) => (prevIndex + 1) % devices.length);
    }
  };

  const handleUpdateAllChange = (checked: boolean) => {
    setUpdateAll(checked);
    if (checked) {
      setUpdateRemark(true);
      setUpdateType(true);
      setUpdateAge(true);
      setUpdateFertilization(true);
      setUpdatePesticide(true);
      setUpdateWatering(true);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-900 text-white">
      <div className="bg-gray-800 shadow-lg rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-200">Barcode Scanner</h2>
          <div className="flex space-x-2">
            <button
              className="text-blue-400 hover:text-blue-500 flex items-center"
              onClick={handleRefresh}
            >
              Refresh
            </button>
            <button className="text-blue-400 hover:text-blue-500" onClick={switchCamera}>
              <FiRefreshCw size={24} />
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <video ref={videoRef} className="w-full rounded-lg shadow-md border-2 border-gray-700" />
        </div>

        {location && (
          <p className="text-gray-400 text-sm mb-2">
            Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        )}
        {error && (
          <p
            className={`text-sm mb-2 ${
              error.includes("successfully") ? "text-green-400" : "text-red-400"
            }`}
          >
            {error}
          </p>
        )}

        {result && (
          <div className="mb-4">
            <p className="text-green-400 font-medium mb-4">Scanned ID: {result}</p>

            {/* Input Fields */}
            <div className="space-y-4">
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={updateAll}
                  onChange={(e) => handleUpdateAllChange(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                />
                <span className="ml-2 text-sm font-semibold text-gray-300">Perbarui Semua</span>
              </label>
              <div>
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateRemark}
                    onChange={(e) => setUpdateRemark(e.target.checked)}
                    disabled={updateAll}
                    className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-300">Keterangan</span>
                </label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Keterangan"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateType}
                    onChange={(e) => setUpdateType(e.target.checked)}
                    disabled={updateAll}
                    className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-300">Tipe</span>
                </label>
                <input
                  type="text"
                  value={type ?? ""}
                  onChange={(e) => setType(e.target.value as TreeType)}
                  placeholder="Type"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateAge}
                    onChange={(e) => setUpdateAge(e.target.checked)}
                    disabled={updateAll}
                    className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-300">Usia</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Usia"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateFertilization}
                    onChange={(e) => setUpdateFertilization(e.target.checked)}
                    disabled={updateAll}
                    className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-300">Tanggal Pemupukan</span>
                </label>
                <input
                  type="date"
                  value={fertilizationDate}
                  onChange={(e) => setFertilizationDate(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updatePesticide}
                    onChange={(e) => setUpdatePesticide(e.target.checked)}
                    disabled={updateAll}
                    className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-300">Tanggal Pestisida</span>
                </label>
                <input
                  type="date"
                  value={pesticideDate}
                  onChange={(e) => setPesticideDate(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateWatering}
                    onChange={(e) => setUpdateWatering(e.target.checked)}
                    disabled={updateAll}
                    className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-300">Tanggal Penyiraman</span>
                </label>
                <input
                  type="date"
                  value={wateringDate}
                  onChange={(e) => setWateringDate(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              className={`mt-4 px-4 py-2 w-full rounded-lg text-white ${
                isLoading ? "bg-green-600 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
              }`}
              onClick={handleRecord}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Record Tree"}
            </button>
          </div>
        )}

        {/* Tree Log Display */}
        {Object.keys(treeLog).length > 0 && (
          <div className="mt-4">
            <button
              className="flex items-center justify-between w-full p-2 bg-gray-700 rounded-lg"
              onClick={() => setIsLogVisible(!isLogVisible)}
            >
              <h3 className="text-lg font-semibold text-gray-200">Tree Log</h3>
              {isLogVisible ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
            </button>
            {isLogVisible && (
              <div className="mt-2 max-h-60 overflow-y-auto bg-gray-700 rounded-lg p-2">
                {Object.entries(treeLog).map(([id, entries]) =>
                  entries.map((entry, index) => (
                    <div
                      key={`${id}-${index}`}
                      className="border-b border-gray-600 py-2 text-left text-sm"
                    >
                      <p>
                        <strong>ID:</strong> {entry.id}
                      </p>
                      <p>
                        <strong>Remark:</strong> {entry.remark || "-"}
                      </p>
                      <p>
                        <strong>Tipe:</strong> {entry.type || "-"}
                      </p>
                      <p>
                        <strong>Age:</strong> {entry.age || 0}
                      </p>
                      <p>
                        <strong>Pemupukan:</strong> {entry.fertilizationDate || "-"}
                      </p>
                      <p>
                        <strong>Pestisida:</strong> {entry.pesticideDate || "-"}
                      </p>
                      <p>
                        <strong>Penyiraman:</strong> {entry.wateringDate || "-"}
                      </p>
                      <p>
                        <strong>Updated At:</strong>{" "}
                        {new Date(entry.updatedAt).toLocaleString() || "-"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <button
          className="mt-4 px-4 py-2 w-full bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
