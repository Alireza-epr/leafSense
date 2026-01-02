import { wrapText } from "../utils/generalUtils";

export interface CustomNoteProps {
  x?: number;
  y?: number;
  value?: string;
  index?: number;
}

const MAX_CHARS_PER_LINE = 18;
const LINE_HEIGHT = 14;
const PADDING_X = 8;
const PADDING_Y = 6;
const OFFSET = 10; // distance from the line

const CustomNote = (props: CustomNoteProps) => {
  if (!props.value || props.x == null || props.y == null) return null;

  const lines = wrapText(props.value, MAX_CHARS_PER_LINE);
  const boxHeight = lines.length * LINE_HEIGHT + PADDING_Y * 2 + LINE_HEIGHT;
  const boxWidth = 140;

  const startX = props.x;
  let startY =
    props.index != null && props.index % 2 === 0
      ? props.y - boxHeight - OFFSET // above line
      : props.y + OFFSET; // below line
  if (startY < 0) {
    startY = 0 + OFFSET;
  }
  return (
    <g>
      <rect
        x={startX}
        y={startY}
        width={boxWidth}
        height={boxHeight}
        rx={6}
        ry={6}
        fill="#fff7a8"
        stroke="#333"
      />
      <text
        x={startX + PADDING_X}
        y={startY + PADDING_Y + LINE_HEIGHT}
        fontSize={12}
        fill="#333"
      >
        <tspan x={startX + PADDING_X} dy={0}>
          {`[${(props.index as number) + 1}]`}
        </tspan>
        {lines.map((line, i) => (
          <tspan key={i} x={startX + PADDING_X} dy={LINE_HEIGHT}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

export default CustomNote;
