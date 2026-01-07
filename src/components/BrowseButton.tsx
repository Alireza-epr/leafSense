import { useEffect, useRef, useState } from "react";
import browseButtonStyle from "./BrowseButton.module.scss";
import { log } from "../utils/generalUtils";
import { ELogLevel } from "../types/generalTypes";
import { TImportedROI } from "./Coordinates";

export interface IBrowseButtonProps {
  title: string;
  onFileSelect: (a_JSON: TImportedROI[]) => void;
  disabled?: boolean;
  help?: string[];
}

const BrowseButton = (props: IBrowseButtonProps) => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const helpRef = useRef<HTMLSpanElement>(null);

  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSelectFile = () => {
    setLoading(true);
    if (props.disabled) return;
    inputFileRef.current?.click();
  };

  const onInputChange = async () => {
    setLoading(false);
    if (!inputFileRef.current?.files?.length) {
      log("Failed to select file", "Selected File Length 0", ELogLevel.warning);
      return;
    }

    const file = inputFileRef.current.files[0];
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      inputFileRef.current.value = ''
      props.onFileSelect(json);
    } catch (err) {
      log("Invalid JSON file", err, ELogLevel.error);
    }
  };

  const handleLeaveHelp = () => {
    setShowHelp(false);
  };

  const handleOverHelp = () => {
    setShowHelp(true);
  };

  const handleCancelInput = () =>{
    setLoading(false)
    if(!inputFileRef.current) return 
    inputFileRef.current.value = ''
  }

  useEffect(() => {
    const help = helpRef.current;
    if (help) {
      help.addEventListener("mouseover", handleOverHelp);
      help.addEventListener("mouseleave", handleLeaveHelp);
    }

    if(inputFileRef.current){
      inputFileRef.current.addEventListener("cancel", handleCancelInput)
    }

    return () => {
      if (help) {
        help.removeEventListener("cancel", handleOverHelp);
        help.removeEventListener("mouseleave", handleLeaveHelp);
      }
      if(inputFileRef.current) inputFileRef.current.removeEventListener("cancel", handleCancelInput);
    };
  }, []);

  return (
    <div
      className={` ${browseButtonStyle.wrapper}`}
      style={{
        backgroundColor: props.disabled
          ? "grey"
          : loading
            ? "rgb(28, 215, 206)"
            : "",
        color: props.disabled ? "darkgray" : "",
      }}
      tabIndex={props.disabled ? -1 : 0}
      aria-label={props.title} // screen reader label
      aria-disabled={props.disabled ?? false} // disabled state
      role="button"
    >
      <div 
        onClick={onSelectFile}
        onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            onSelectFile();
          }
        }}
      >
        {props.help && props.help.length > 0 ? (
          <>
            <span className={` ${browseButtonStyle.help}`} ref={helpRef}>
              ?
            </span>
            {showHelp ? (
              <pre
                className={` ${browseButtonStyle.helpContent}`}
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  margin: 0,
                }}
              >
                {props.help.join("\n")}
              </pre>
            ) : (
              <></>
            )}
          </>
        ) : (
          <></>
        )}
        {loading ? "Import..." : props.title}
      </div>
      <input
        type="file"
        style={{ display: "none" }}
        ref={inputFileRef}
        onChange={onInputChange}
        accept=".json"
      />
    </div>
  );
};

export default BrowseButton;
