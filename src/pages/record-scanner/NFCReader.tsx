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

  const [remark, setRemark] = useState("");
  const [type, setType] = useState<TreeType | null>(null);
  const [age, setAge] = useState("");
  const [fertilizationDate, setFertilizationDate] = useState("");
  const [pesticideDate, setPesticideDate] = useState("");
  const [wateringDate, setWateringDate] = useState("");

  const [updateAll, setUpdateAll] = useState(true);
  const [updateRemark, setUpdateRemark] = useState(true);
  const [updateType, setUpdateType] = useState(true);
  const [updateAge, setUpdateAge] = useState(true);
  const [updateFertilization, setUpdateFertilization] = useState(true);
  const [updatePesticide, setUpdatePesticide] = useState(true);
  const [updateWatering, setUpdateWatering] = useState(true);

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
    if (isScanning) startNFCScan();
  }, [isScanning]);

  const handleRecord = async () => {
    if (userLoading) return setError("Waiting for authentication...");
    if (!user) return setError("Please login to record tree data");
    if (!selectedProject) return setError("No project selected");
    if (!nfcData) return setError("No NFC data to record");

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
        await updateDoc(docRef, { logs: arrayUnion(treeData) });
      } else {
        await setDoc(docRef, { id: nfcData, logs: [treeData] });
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

  return (
    <div className="flex flex-col items-center min-h-screen max-h-screen overflow-y-auto p-4 bg-gray-900 text-white">
      <div className="bg-gray-800 shadow-lg rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-200">NFC Reader</h2>
          <div className="flex space-x-2">
            <button
              className="text-blue-400 hover:text-blue-500"
              onClick={() => setIsScanning(true)}
            >
              Scan
            </button>
            <button className="text-blue-400 hover:text-blue-500" onClick={handleRefresh}>
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <p
            className={`text-sm mb-2 ${
              error.includes("successfully") ? "text-green-400" : "text-red-400"
            }`}
          >
            {error}
          </p>
        )}

        {nfcData && (
          <div className="mb-4">
            <p className="text-green-400 font-medium mb-4">Scanned NFC: {nfcData}</p>

            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={updateAll}
                onChange={(e) => handleUpdateAllChange(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
              />
              <span className="ml-2 text-sm font-semibold text-gray-300">Perbarui Semua</span>
            </label>

            {[
              {
                label: "Remark",
                value: remark,
                setValue: setRemark,
                checked: updateRemark,
                setChecked: setUpdateRemark,
              },
              {
                label: "Type",
                value: type ?? "",
                setValue: setType,
                checked: updateType,
                setChecked: setUpdateType,
              },
              {
                label: "Age",
                value: age,
                setValue: setAge,
                checked: updateAge,
                setChecked: setUpdateAge,
              },
              {
                label: "Pemupukan",
                value: fertilizationDate,
                setValue: setFertilizationDate,
                checked: updateFertilization,
                setChecked: setUpdateFertilization,
              },
              {
                label: "Pestisida",
                value: pesticideDate,
                setValue: setPesticideDate,
                checked: updatePesticide,
                setChecked: setUpdatePesticide,
              },
              {
                label: "Penyiraman",
                value: wateringDate,
                setValue: setWateringDate,
                checked: updateWatering,
                setChecked: setUpdateWatering,
              },
            ].map(({ label, value, setValue, checked, setChecked }) => (
              <div key={label}>
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={updateAll || checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    disabled={updateAll}
                    className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-300">{label}</span>
                </label>
                <input
                  type={label === "Age" ? "number" : label.includes("Tanggal") ? "date" : "text"}
                  value={value}
                  onChange={(e) => setValue(e.target.value as TreeType)}
                  placeholder={label}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <button
              className="mt-4 px-4 py-2 w-full rounded-lg text-white bg-green-500 hover:bg-green-600"
              onClick={handleRecord}
            >
              Record Tree
            </button>
          </div>
        )}

        {Object.keys(treeLog).length > 0 && (
          <div className="mt-4 max-h-60 overflow-y-auto bg-gray-700 rounded-lg p-2">
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
                    <strong>Type:</strong> {entry.type || "-"}
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
                    <strong>Updated At:</strong> {entry.updatedAt || "-"}
                  </p>
                </div>
              ))
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

export default NFCReader;
