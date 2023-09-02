import React from "react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import ReactJson from "react-json-view";
import { CopyToClipboard } from "react-copy-to-clipboard";
import "./styles.css";
// import axios from "axios";

function App() {
  const [jsonData, setJsonData] = React.useState([]);
  const [copied, setCopied] = React.useState(false);
  const [inputCode, setInputCode] = React.useState("");

  const onDrop = async (acceptedFiles) => {
    try {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const binaryString = e.target.result;

        // Load the XLSX file
        const workbook = XLSX.read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert XLSX data to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Transform data structure
        const transformedData = jsonData.map((entry) => {
          const transformedEntry = {
            postal_code: entry.postcode,
            administrative_division: {},
          };

          // Loop through the keys in the entry and create the nested structure
          for (const key in entry) {
            if (key.includes(" [")) {
              const [property, language] = key.split(" [");
              const langCode = language.slice(0, -1);
              if (!transformedEntry.administrative_division[property]) {
                transformedEntry.administrative_division[property] = {};
              }
              transformedEntry.administrative_division[property][langCode] =
                entry[key];
            } else if (key !== "postcode") {
              transformedEntry.administrative_division[key] = String(
                entry[key]
              );
            }
          }

          return transformedEntry;
        });
        const finalData = {
          code: inputCode,
          postal_codes: transformedData,
        };
        setJsonData(finalData);
        setCopied(false);

        // const apiUrl = "";

        // const response = await axios.post(apiUrl, finalData);

        // console.log("API Response:", response.data);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  };

  const handleCopyClick = () => {
    setCopied(true);
  };
  const handleCodeChange = (e) => {
    const value = e.target.value;
    if (value.length <= 3) {
      setInputCode(value);
    }
  };
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
  });

  return (
    <div className="App">
      <div className="code-input">
        <label>
          Enter Code:{" "}
          <input
            type="text"
            value={inputCode}
            onChange={handleCodeChange}
            placeholder="Enter ISO Alpha-3 code (e.g. THA)"
            maxLength={3}
          />
        </label>
      </div>

      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        Drag and drop a file here, or click to select a file
      </div>

      <div>
        {jsonData &&
          jsonData.postal_codes &&
          jsonData.postal_codes.length > 0 && (
            <>
              <div className="json-container">
                <CopyToClipboard text={JSON.stringify(jsonData, null, 2)}>
                  <button
                    className={`copy-button ${copied ? "copied" : ""}`}
                    onClick={handleCopyClick}
                  >
                    {copied ? "Copied!" : "Copy All"}
                  </button>
                </CopyToClipboard>
                <ReactJson src={jsonData} indentWidth={2} />
              </div>
            </>
          )}
      </div>
    </div>
  );
}

export default App;
