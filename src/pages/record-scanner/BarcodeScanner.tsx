import { BrowserMultiFormatReader } from "@zxing/library";
import { onAuthStateChanged, User } from "firebase/auth";
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import { auth, db } from "../../firebase";
import { useProject } from "../../hook/useProject";
import { AnimalData, TreeData, TreeType } from "../../types";
import { getAnimalDetails, parseTreeId } from "../../utils/treeUtils";

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
  const [tagType, setTagType] = useState<"tree" | "animal" | null>(null);

  // Input states for TreeData
  const [treeRemark, setTreeRemark] = useState("");
  const [treeType, setTreeType] = useState<TreeType | null>(null);
  const [treeAge, setTreeAge] = useState("");
  const [fertilizationDate, setFertilizationDate] = useState(new Date().toISOString());
  const [pesticideDate, setPesticideDate] = useState(new Date().toISOString());
  const [wateringDate, setWateringDate] = useState(new Date().toISOString());

  // Input states for AnimalData
  const [animalGender, setAnimalGender] = useState<"Jantan" | "Betina" | "">("");
  const [animalBirthDate, setAnimalBirthDate] = useState("");
  const [animalWeight, setAnimalWeight] = useState("");
  const [animalVaccinationDate, setAnimalVaccinationDate] = useState("");
  const [animalProduction, setAnimalProduction] = useState("");

  // Checkbox states for TreeData
  const [updateAll, setUpdateAll] = useState(true);
  const [updateTreeRemark, setUpdateTreeRemark] = useState(true);
  const [updateTreeType, setUpdateTreeType] = useState(true);
  const [updateTreeAge, setUpdateTreeAge] = useState(true);
  const [updateFertilization, setUpdateFertilization] = useState(true);
  const [updatePesticide, setUpdatePesticide] = useState(true);
  const [updateWatering, setUpdateWatering] = useState(true);

  // Checkbox states for AnimalData
  const [updateAnimalGender, setUpdateAnimalGender] = useState(true);
  const [updateAnimalBirthDate, setUpdateAnimalBirthDate] = useState(true);
  const [updateAnimalWeight, setUpdateAnimalWeight] = useState(true);
  const [updateAnimalVaccination, setUpdateAnimalVaccination] = useState(true);
  const [updateAnimalProduction, setUpdateAnimalProduction] = useState(true);

  // Log state as an object with arrays (union of TreeData and AnimalData)
  const [tagLog, setTagLog] = useState<{ [id: string]: (TreeData | AnimalData)[] }>({});

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Get geolocation
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

  // Determine tag type and fetch existing logs when a barcode is scanned
  useEffect(() => {
    const fetchTagLogs = async () => {
      if (!result || !selectedProject) return;

      const parsedId = parseTreeId(result);
      const isTreeTag = parsedId.deviceType === "ST";
      setTagType(isTreeTag ? "tree" : "animal");

      try {
        const collectionName = isTreeTag ? "trees" : "animals";
        const docRef = doc(db, "projects", selectedProject.id, collectionName, result);
        console.log(collectionName, isTreeTag, parsedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as { logs: (TreeData | AnimalData)[] };
          if (data.logs?.length) {
            // Sort logs by updatedAt to get the latest entry
            const sortedLogs = data.logs.sort((a, b) =>
              (b.updatedAt || "").localeCompare(a.updatedAt || "")
            );
            const latestLog = sortedLogs[0];

            // Pre-fill input fields with the latest log data
            if (isTreeTag) {
              const treeLog = latestLog as TreeData;
              setTreeRemark(treeLog.remark || "");
              setTreeType(treeLog.type || null);
              setTreeAge(treeLog.age ? treeLog.age.toString() : "");
              setFertilizationDate(treeLog.fertilizationDate || "");
              setPesticideDate(treeLog.pesticideDate || "");
              setWateringDate(treeLog.wateringDate || "");
            } else {
              const animalLog = latestLog as AnimalData;
              setAnimalGender(animalLog.gender || "");
              setAnimalBirthDate(animalLog.birthDate || "");
              setAnimalWeight(animalLog.weight ? animalLog.weight.toString() : "");
              setAnimalVaccinationDate(animalLog.vaccinationDate || "");
              setAnimalProduction(animalLog.production ? animalLog.production.toString() : "");
            }

            // Update tagLog state to display all logs
            setTagLog((prevLog) => ({
              ...prevLog,
              [result]: sortedLogs,
            }));
          }
        }
      } catch (err) {
        setError("Error fetching logs: " + (err as Error).message);
      }
    };

    fetchTagLogs();
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
      setError("Please login to record data");
      return;
    }
    if (!selectedProject) {
      setError("No project selected");
      return;
    }
    if (!result || !tagType) return;

    setIsLoading(true);
    setError(null);

    const updatedAt = new Date().toISOString();
    const currentDate = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format

    const collectionName = tagType === "tree" ? "trees" : "animals";
    const docRef = doc(db, "projects", selectedProject.id, collectionName, result);
    const docSnap = await getDoc(docRef);
    let latestLog: TreeData | AnimalData | null = null;

    if (docSnap.exists()) {
      const data = docSnap.data() as { logs: (TreeData | AnimalData)[] };
      if (data.logs?.length) {
        latestLog = data.logs.sort((a, b) =>
          (b.updatedAt || "").localeCompare(a.updatedAt || "")
        )[0];
      }
    }

    let tagData: TreeData | AnimalData;
    if (tagType === "tree") {
      tagData = {
        id: result,
        remark: updateAll || updateTreeRemark ? treeRemark : (latestLog as TreeData)?.remark || "",
        type: updateAll || updateTreeType ? treeType : (latestLog as TreeData)?.type || null,
        age:
          updateAll || updateTreeAge ? parseInt(treeAge) || 0 : (latestLog as TreeData)?.age || 0,
        fertilizationDate:
          updateAll || updateFertilization
            ? currentDate
            : (latestLog as TreeData)?.fertilizationDate || "",
        pesticideDate:
          updateAll || updatePesticide ? currentDate : (latestLog as TreeData)?.pesticideDate || "",
        wateringDate:
          updateAll || updateWatering ? currentDate : (latestLog as TreeData)?.wateringDate || "",
        updatedAt,
      };
    } else {
      tagData = {
        id: result,
        type: (getAnimalDetails(result).type as string) || "Unknown",

        healthStatus: (latestLog as AnimalData)?.healthStatus || "Healthy", // Default to Healthy if new
        gender:
          updateAll || updateAnimalGender
            ? (animalGender as "Jantan" | "Betina")
            : (latestLog as AnimalData)?.gender || "Jantan",
        birthDate:
          updateAll || updateAnimalBirthDate
            ? animalBirthDate
            : (latestLog as AnimalData)?.birthDate || "",
        weight:
          updateAll || updateAnimalWeight
            ? parseFloat(animalWeight) || 0
            : (latestLog as AnimalData)?.weight || 0,
        vaccinationDate:
          updateAll || updateAnimalVaccination
            ? animalVaccinationDate
            : (latestLog as AnimalData)?.vaccinationDate || "",
        production:
          updateAll || updateAnimalProduction
            ? parseFloat(animalProduction) || 0
            : (latestLog as AnimalData)?.production || 0,
        updatedAt,
      };
    }

    try {
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          logs: arrayUnion(tagData),
        });
      } else {
        await setDoc(docRef, {
          id: result,
          logs: [tagData],
        });
      }

      // Update local tag log state
      setTagLog((prevLog) => {
        const previousEntries = prevLog[result] || [];
        return {
          ...prevLog,
          [result]: [...previousEntries, tagData].sort((a, b) =>
            (b.updatedAt || "").localeCompare(a.updatedAt || "")
          ),
        };
      });

      setError("Data saved successfully");
    } catch (err) {
      setError("Error saving to Firebase: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setResult(null);
    setError(null);
    setTagType(null);
    // Reset TreeData inputs
    setTreeRemark("");
    setTreeType(null);
    setTreeAge("");
    setFertilizationDate("");
    setPesticideDate("");
    setWateringDate("");
    // Reset AnimalData inputs
    setAnimalGender("");
    setAnimalBirthDate("");
    setAnimalWeight("");
    setAnimalVaccinationDate("");
    setAnimalProduction("");
    // Reset checkboxes
    setUpdateAll(true);
    setUpdateTreeRemark(true);
    setUpdateTreeType(true);
    setUpdateTreeAge(true);
    setUpdateFertilization(true);
    setUpdatePesticide(true);
    setUpdateWatering(true);
    setUpdateAnimalGender(true);
    setUpdateAnimalBirthDate(true);
    setUpdateAnimalWeight(true);
    setUpdateAnimalVaccination(true);
    setUpdateAnimalProduction(true);
    setTagLog({});
  };

  const switchCamera = () => {
    if (devices.length > 1) {
      setCurrentDeviceIndex((prevIndex) => (prevIndex + 1) % devices.length);
    }
  };

  const handleUpdateAllChange = (checked: boolean) => {
    setUpdateAll(checked);
    if (checked) {
      if (tagType === "tree") {
        setUpdateTreeRemark(true);
        setUpdateTreeType(true);
        setUpdateTreeAge(true);
        setUpdateFertilization(true);
        setUpdatePesticide(true);
        setUpdateWatering(true);
      } else if (tagType === "animal") {
        setUpdateAnimalGender(true);
        setUpdateAnimalBirthDate(true);
        setUpdateAnimalWeight(true);
        setUpdateAnimalVaccination(true);
        setUpdateAnimalProduction(true);
      }
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen max-h-screen overflow-y-auto p-4 bg-gray-900 text-white">
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

        {result && tagType && (
          <div className="mb-4 ">
            <p className="text-green-400 font-medium mb-4">
              Scanned ID: {result} ({tagType === "tree" ? "Smart Tree Tag" : "Smart Farm Tag"})
            </p>

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

              {tagType === "tree" ? (
                <>
                  <div>
                    <label className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={updateAll || updateTreeRemark}
                        onChange={(e) => setUpdateTreeRemark(e.target.checked)}
                        disabled={updateAll}
                        className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-300">Keterangan</span>
                    </label>
                    <input
                      type="text"
                      value={treeRemark}
                      onChange={(e) => setTreeRemark(e.target.value)}
                      placeholder="Keterangan"
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={updateAll || updateTreeType}
                        onChange={(e) => setUpdateTreeType(e.target.checked)}
                        disabled={updateAll}
                        className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-300">Tipe</span>
                    </label>
                    <input
                      type="text"
                      value={treeType ?? ""}
                      onChange={(e) => setTreeType(e.target.value as TreeType)}
                      placeholder="Type"
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={updateAll || updateTreeAge}
                        onChange={(e) => setUpdateTreeAge(e.target.checked)}
                        disabled={updateAll}
                        className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-300">Usia</span>
                    </label>
                    <input
                      type="number"
                      value={treeAge}
                      onChange={(e) => setTreeAge(e.target.value)}
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
                </>
              ) : (
                <>
                  <div>
                    <label className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={updateAll || updateAnimalGender}
                        onChange={(e) => setUpdateAnimalGender(e.target.checked)}
                        disabled={updateAll}
                        className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-300">Kelamin</span>
                    </label>
                    <select
                      value={animalGender}
                      onChange={(e) => setAnimalGender(e.target.value as "Jantan" | "Betina")}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Kelamin</option>
                      <option value="Jantan">Jantan</option>
                      <option value="Betina">Betina</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={updateAll || updateAnimalBirthDate}
                        onChange={(e) => setUpdateAnimalBirthDate(e.target.checked)}
                        disabled={updateAll}
                        className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-300">Tanggal Lahir</span>
                    </label>
                    <input
                      type="date"
                      value={animalBirthDate}
                      onChange={(e) => setAnimalBirthDate(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={updateAll || updateAnimalWeight}
                        onChange={(e) => setUpdateAnimalWeight(e.target.checked)}
                        disabled={updateAll}
                        className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-300">Berat Badan (kg)</span>
                    </label>
                    <input
                      type="number"
                      value={animalWeight}
                      onChange={(e) => setAnimalWeight(e.target.value)}
                      placeholder="Berat Badan"
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={updateAll || updateAnimalVaccination}
                        onChange={(e) => setUpdateAnimalVaccination(e.target.checked)}
                        disabled={updateAll}
                        className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-300">Tanggal Vaksinasi</span>
                    </label>
                    <input
                      type="date"
                      value={animalVaccinationDate}
                      onChange={(e) => setAnimalVaccinationDate(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={updateAll || updateAnimalProduction}
                        onChange={(e) => setUpdateAnimalProduction(e.target.checked)}
                        disabled={updateAll}
                        className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-300">
                        Produksi (telur/liter susu)
                      </span>
                    </label>
                    <input
                      type="number"
                      value={animalProduction}
                      onChange={(e) => setAnimalProduction(e.target.value)}
                      placeholder="Produksi"
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              className={`mt-4 px-4 py-2 w-full rounded-lg text-white ${
                isLoading ? "bg-green-600 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
              }`}
              onClick={handleRecord}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : `Record ${tagType === "tree" ? "Tree" : "Animal"}`}
            </button>
          </div>
        )}

        {/* Tag Log Display */}
        {Object.keys(tagLog).length > 0 && (
          <div className="mt-4">
            <button
              className="flex items-center justify-between w-full p-2 bg-gray-700 rounded-lg"
              onClick={() => setIsLogVisible(!isLogVisible)}
            >
              <h3 className="text-lg font-semibold text-gray-200">Tag Log</h3>
              {isLogVisible ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
            </button>
            {isLogVisible && (
              <div className="mt-2 max-h-60 overflow-y-auto bg-gray-700 rounded-lg p-2">
                {Object.entries(tagLog).map(([id, entries]) =>
                  entries.map((entry, index) => {
                    const isTreeLog = "remark" in entry; // Determine if the log is for a tree
                    return (
                      <div
                        key={`${id}-${index}`}
                        className="border-b border-gray-600 py-2 text-left text-sm"
                      >
                        <p>
                          <strong>ID:</strong> {entry.id}
                        </p>
                        {isTreeLog ? (
                          <>
                            <p>
                              <strong>Type:</strong> Smart Tree Tag
                            </p>
                            <p>
                              <strong>Remark:</strong> {(entry as TreeData).remark || "-"}
                            </p>
                            <p>
                              <strong>Tipe:</strong> {(entry as TreeData).type || "-"}
                            </p>
                            <p>
                              <strong>Age:</strong> {(entry as TreeData).age || 0}
                            </p>
                            <p>
                              <strong>Pemupukan:</strong>{" "}
                              {(entry as TreeData).fertilizationDate || "-"}
                            </p>
                            <p>
                              <strong>Pestisida:</strong> {(entry as TreeData).pesticideDate || "-"}
                            </p>
                            <p>
                              <strong>Penyiraman:</strong> {(entry as TreeData).wateringDate || "-"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              <strong>Type:</strong> Smart Farm Tag
                            </p>
                            <p>
                              <strong>Tipe:</strong> {(entry as AnimalData).type || "-"}
                            </p>
                            <p>
                              <strong>Kelamin:</strong> {(entry as AnimalData).gender || "-"}
                            </p>
                            <p>
                              <strong>Tanggal Lahir:</strong>{" "}
                              {(entry as AnimalData).birthDate
                                ? new Date((entry as AnimalData).birthDate).toLocaleDateString()
                                : "-"}
                            </p>
                            <p>
                              <strong>Berat Badan:</strong> {(entry as AnimalData).weight || 0} kg
                            </p>
                            <p>
                              <strong>Vaksinasi:</strong>{" "}
                              {(entry as AnimalData).vaccinationDate
                                ? new Date(
                                    (entry as AnimalData).vaccinationDate as string
                                  ).toLocaleDateString()
                                : "-"}
                            </p>
                            <p>
                              <strong>Produksi:</strong> {(entry as AnimalData).production || 0}{" "}
                              {(entry as AnimalData).type === "Ayam Petelur"
                                ? "telur"
                                : "liter susu"}
                            </p>
                          </>
                        )}
                        <p>
                          <strong>Updated At:</strong>{" "}
                          {new Date(entry.updatedAt).toLocaleString() || "-"}
                        </p>
                      </div>
                    );
                  })
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
