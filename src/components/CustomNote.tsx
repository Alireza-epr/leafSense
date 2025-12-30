import customNoteStyle from "./CustomNote.module.scss";

export interface CustomNoteProps {
  x?: number;
  y?: number;
  value?: string;
}

const MAX_WIDTH = 140;
const MAX_HEIGHT = 60;

const CustomNote = ({ x, y, value }: CustomNoteProps) => {
  if (!value || x == null || y == null) return null;

  return (
    <g>
      <foreignObject
        x={x + 10}
        y={y - MAX_HEIGHT - 10}
        width={MAX_WIDTH}
        height={MAX_HEIGHT}
      >
        <div
          className={customNoteStyle.note}
          title={value}
        >
          {value}
        </div>
      </foreignObject>
    </g>
  );
};

export default CustomNote;
