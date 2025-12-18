import { useEffect, useRef, useState } from "react";
import browseButtonStyle from "./BrowseButton.module.scss";

export interface IBrowseButtonProps {
  title: string;
  onFileSelect: (a_JSON: Record<string, any>) => void;
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
      console.warn("Selected File Length 0");
      return;
    }

    const file = inputFileRef.current.files[0];
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      props.onFileSelect(json);
    } catch (err) {
      console.error("Invalid JSON file", err);
    }
  };

  const handleLeaveHelp = () => {
    setShowHelp(false);
  };

  const handleOverHelp = () => {
    setShowHelp(true);
  };

  useEffect(() => {
    const help = helpRef.current;
    if (help) {
      help.addEventListener("mouseover", handleOverHelp);
      help.addEventListener("mouseleave", handleLeaveHelp);
    }

    return () => {
      if (help) {
        help.removeEventListener("cancel", handleOverHelp);
        help.addEventListener("mouseleave", handleLeaveHelp);
      }
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
    >
      <div onClick={onSelectFile}>
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
