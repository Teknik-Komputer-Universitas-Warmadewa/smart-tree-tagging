import { BrowserMultiFormatReader } from "@zxing/library";
import { onAuthStateChanged, User } from "firebase/auth";
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { auth, db } from "../../firebase";
import { TreeData } from "../../types";

interface BarcodeScannerProps {
  onBack: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Input states
  const [remark, setRemark] = useState("");
  const [type, setType] = useState("");
  const [age, setAge] = useState("");
  const [fertilizationDate, setFertilizationDate] = useState("");
  const [pesticideDate, setPesticideDate] = useState("");
  const [wateringDate, setWateringDate] = useState("");

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
    if (!result) return;

    const updatedAt = new Date().toISOString();
    const treeData: TreeData = {
      id: result,
      location: location ? { latitude: location.lat, longitude: location.lng } : null,
      remark: updateAll || updateRemark ? remark : "",
      type: updateAll || updateType ? type : "",
      age: updateAll || updateAge ? parseInt(age) || 0 : 0,
      fertilizationDate: updateAll || updateFertilization ? fertilizationDate : "",
      pesticideDate: updateAll || updatePesticide ? pesticideDate : "",
      wateringDate: updateAll || updateWatering ? wateringDate : "",
      updatedAt,
    };

    try {
      const docRef = doc(db, "trees", result);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Document exists, update it
        await updateDoc(docRef, {
          logs: arrayUnion(treeData), // Append log to the logs array
        });
      } else {
        // Document does NOT exist, create it with an initial logs array
        await setDoc(docRef, {
          id: result,
          logs: [treeData], // Create an array with the first log entry
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

      console.log("Tree data recorded:", treeData);
      setError("Tree data saved successfully");
    } catch (err) {
      setError("Error saving to Firebase: " + (err as Error).message);
    }
  };

  const handleRefresh = () => {
    setResult(null);
    setError(null);
    setRemark("");
    setType("");
    setAge("");
    setFertilizationDate("");
    setPesticideDate("");
    setWateringDate("");
    setUpdateAll(true);
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
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-4 max-w-lg w-full text-center">
        <div className="flex justify-between mb-4">
          <button className="text-blue-500 hover:text-blue-700" onClick={handleRefresh}>
            Refresh
          </button>
          <button className="text-blue-500 hover:text-blue-700" onClick={switchCamera}>
            <FiRefreshCw size={24} />
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-700">Barcode Scanner</h2>
        <div className="relative mt-4">
          <video ref={videoRef} className="w-full rounded-lg shadow-md" />
        </div>

        {location && (
          <p className="text-gray-600 mt-2">
            Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        )}
        {error && <p className="text-red-500 mt-2">{error}</p>}

        {result && (
          <div className="mt-4">
            <p className="text-green-600 font-medium mb-4">Scanned ID: {result}</p>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Remark"
                  className="w-full p-2 border rounded"
                />
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateRemark}
                    onChange={(e) => setUpdateRemark(e.target.checked)}
                    disabled={updateAll}
                  />
                  <span className="ml-2 text-sm">Update Remark</span>
                </label>
              </div>

              <div>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="Type"
                  className="w-full p-2 border rounded"
                />
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateType}
                    onChange={(e) => setUpdateType(e.target.checked)}
                    disabled={updateAll}
                  />
                  <span className="ml-2 text-sm">Update Type</span>
                </label>
              </div>

              <div>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  className="w-full p-2 border rounded"
                />
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateAge}
                    onChange={(e) => setUpdateAge(e.target.checked)}
                    disabled={updateAll}
                  />
                  <span className="ml-2 text-sm">Update Age</span>
                </label>
              </div>

              <div>
                <input
                  type="date"
                  value={fertilizationDate}
                  onChange={(e) => setFertilizationDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateFertilization}
                    onChange={(e) => setUpdateFertilization(e.target.checked)}
                    disabled={updateAll}
                  />
                  <span className="ml-2 text-sm">Update Fertilization Date</span>
                </label>
              </div>

              <div>
                <input
                  type="date"
                  value={pesticideDate}
                  onChange={(e) => setPesticideDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updatePesticide}
                    onChange={(e) => setUpdatePesticide(e.target.checked)}
                    disabled={updateAll}
                  />
                  <span className="ml-2 text-sm">Update Pesticide Date</span>
                </label>
              </div>

              <div>
                <input
                  type="date"
                  value={wateringDate}
                  onChange={(e) => setWateringDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || updateWatering}
                    onChange={(e) => setUpdateWatering(e.target.checked)}
                    disabled={updateAll}
                  />
                  <span className="ml-2 text-sm">Update Watering Date</span>
                </label>
              </div>

              <label className="flex items-center mt-4">
                <input
                  type="checkbox"
                  checked={updateAll}
                  onChange={(e) => handleUpdateAllChange(e.target.checked)}
                />
                <span className="ml-2 text-sm font-semibold">Update All Fields</span>
              </label>
            </div>

            <button
              className="mt-6 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              onClick={handleRecord}
            >
              Record Tree
            </button>
          </div>
        )}

        {/* Tree Log Display */}
        {Object.keys(treeLog).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700">Tree Log</h3>
            <div className="mt-2 max-h-60 overflow-y-auto">
              {Object.entries(treeLog).map(([id, entries]) =>
                entries.map((entry, index) => (
                  <div key={`${id}-${index}`} className="border-b py-2 text-left text-sm">
                    <p>
                      <strong>ID:</strong> {entry.id}
                    </p>
                    {entry.location && (
                      <p>
                        <strong>Location:</strong> {entry.location.latitude.toFixed(4)},{" "}
                        {entry.location.longitude.toFixed(4)}
                      </p>
                    )}
                    <p>
                      <strong>Remark:</strong> {entry.remark || "-"}
                    </p>
                    <p>
                      <strong>Type:</strong> {entry.type || "-"}
                    </p>
                    <p>
                      <strong>Age:</strong> {entry.age || 0}
                    </p>
                    <p>
                      <strong>Fertilization:</strong> {entry.fertilizationDate || "-"}
                    </p>
                    <p>
                      <strong>Pesticide:</strong> {entry.pesticideDate || "-"}
                    </p>
                    <p>
                      <strong>Watering:</strong> {entry.wateringDate || "-"}
                    </p>
                    <p>
                      <strong>Updated At:</strong> {entry.updatedAt || "-"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
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
