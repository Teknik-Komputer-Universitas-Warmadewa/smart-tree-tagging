import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { TreeData, TreeType } from "../../types";
import { useProject } from "../../hook/useProject";
import { useUser } from "../../context/UserContext";
import { db } from "../../firebase";

interface NFCReaderProps {
  onBack: () => void;
}

const NFCReader: React.FC<NFCReaderProps> = ({ onBack }) => {
  const [nfcData, setNfcData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Input states
  const [remark, setRemark] = useState("");
  const [type, setType] = useState<TreeType | null>(null);
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

  // Log state for displaying recorded tree data
  const [treeLog, setTreeLog] = useState<{ [id: string]: TreeData[] }>({});

  const { selectedProject } = useProject();
  const { user, loading: userLoading } = useUser();

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

  useEffect(() => {
    if (isScanning) {
      startNFCScan();
    }
  }, [isScanning]);

  const handleRecord = async () => {
    if (userLoading) {
      setError("Waiting for authentication...");
      return;
    }
    if (!user) {
      setError("Please login to record tree data");
      return;
    }
    if (!selectedProject) {
      setError("No project selected");
      return;
    }
    if (!nfcData) {
      setError("No NFC data to record");
      return;
    }

    console.log("User UID:", user.uid);
    console.log("Selected Project ID:", selectedProject.id);
    console.log("Project userId:", selectedProject.userId);

    const updatedAt = new Date().toISOString();
    const treeData: TreeData = {
      id: nfcData,
      remark: updateAll || updateRemark ? remark : "",
      type: updateAll || updateType ? type : null,
      age: updateAll || updateAge ? parseInt(age) || 0 : 0,
      fertilizationDate: updateAll || updateFertilization ? fertilizationDate : "",
      pesticideDate: updateAll || updatePesticide ? pesticideDate : "",
      wateringDate: updateAll || updateWatering ? wateringDate : "",
      updatedAt,
    };

    try {
      const docRef = doc(db, "projects", selectedProject.id, "trees", nfcData);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          logs: arrayUnion(treeData),
        });
      } else {
        await setDoc(docRef, {
          id: nfcData,
          logs: [treeData],
        });
      }

      setTreeLog((prevLog) => {
        const previousEntries = prevLog[nfcData] || [];
        return {
          ...prevLog,
          [nfcData]: [...previousEntries, treeData].sort((a, b) =>
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
    setNfcData(null);
    setError(null);
    setRemark("");
    setType(null);
    setAge("");
    setFertilizationDate("");
    setPesticideDate("");
    setWateringDate("");
    setUpdateAll(true);
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

  if (userLoading) {
    return (
      <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100">
        <p>Loading user...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-4 max-w-lg w-full text-center">
        <div className="flex flex-col justify-center items-center mb-4">
          <h2 className="text-xl font-bold">NFC Reader & Writer</h2>

          {/* Read NFC */}
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg mt-4"
            onClick={() => setIsScanning(true)}
          >
            Aktifkan Start NFC Scan
          </button>

          {/* Refresh Button */}
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg mt-2"
            onClick={handleRefresh}
          >
            Refresh
          </button>

          {error && <p className="text-lg text-red-500 mt-2">{error}</p>}

          {nfcData && (
            <div className="mt-4">
              <p className="text-lg text-green-700">NFC Data: {nfcData}</p>

              {/* Input Fields */}
              <div className="space-y-4 mt-4">
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
                    value={type ?? ""}
                    onChange={(e) => setType(e.target.value as TreeType)}
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
                disabled={userLoading}
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
