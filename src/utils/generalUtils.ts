import {
  ESTACCollections,
  ITokenCollection,
  spatialItems,
} from "../types/apiTypes";
import {
  EMarkerType,
  ERequestContext,
  INDVISample,
  IPolygon,
  TChangePoint,
  TFetchFeature,
  TLatency,
  TSample,
} from "../types";
import { getLocaleISOString } from "./dateUtils";
import {
  EAggregationMethod,
  ELogLevel,
  ESampleStatus,
  EURLParams,
  IAnnotationItem,
  IChangePoint,
  IChartPoint,
  IFetchItem,
  IRejection,
} from "../types/generalTypes";
import { getFeatureToken, getMean, isTokenExpired } from "./calculationUtils";

export const toFirstLetterUppercase = (a_String: string | null) => {
  if (!a_String) return;

  const firstLetter = a_String[0];
  const allLetters = a_String.split("");
  allLetters[0] = firstLetter.toUpperCase();
  return allLetters.join("");
};

export const jsonToCsv = (
  a_Title: string,
  a_NDVISamples: INDVISample[],
  a_ChangePoints: IChangePoint[],
  a_Annotations: IAnnotationItem[],
) => {
  if (!a_NDVISamples.length) return "";

  const excludedSamples = a_NDVISamples.map(
    ({ ndviArray, preview, ...rest }) => {
      const not_valid_fraction = getRejectionInfo(
        rest.not_valid_fraction,
      ).trim();
      let exportedSample = {
        ...rest,
        valid_fraction: rest.valid_fraction.toFixed(2) + "%",
        filter_fraction: rest.filter_fraction.toFixed(2) + "%",
        not_valid_fraction:
          not_valid_fraction.length !== 0 ? not_valid_fraction : "0%",
      };
      const changePoint = a_ChangePoints.find((p) => p.id === rest.id);
      const annotation = a_Annotations.find(
        (a) => a.featureId === rest.featureId,
      );

      return {
        ...exportedSample,
        "Change point": !!changePoint,
        "Z-Score": changePoint
          ? changePoint.z >= 0
            ? `+${changePoint.z.toFixed(2)}`
            : changePoint.z.toFixed(2)
          : "N/A",
        Annotation:
          annotation && annotation.note.length > 0 ? annotation.note : "N/A",
        Status:
          rest.meanNDVI !== null
            ? ESampleStatus.Included
            : ESampleStatus.Excluded,
      };
    },
  );

  const headers = Object.keys(excludedSamples[0]);

  const delimiter = ";";

  const csvRows = [
    `### ${a_Title} ###`,
    headers.join(delimiter), // header row
    ...excludedSamples.map((sample) =>
      headers
        .map((header) => {
          const value = sample[header];
          // handle null / undefined safely
          return value === null || value === undefined
            ? "N/A"
            : `"${String(value).replace(/"/g, '""')}"`; //If a value itself contains a double quote ("), CSV requires it to be escaped by doubling it.
        })
        .join(delimiter),
    ),
  ];

  return csvRows.join("\n");
};

export const downloadCSV = (
  a_AllMainSamples: INDVISample[],
  a_AllComparisonSamples: INDVISample[],
  a_ChangePoints: TChangePoint,
  a_Annotations: IAnnotationItem[],
) => {
  const sections: string[] = [];

  sections.push(
    jsonToCsv(
      "MAIN SAMPLES",
      a_AllMainSamples,
      a_ChangePoints.main,
      a_Annotations,
    ),
  );

  if (a_AllComparisonSamples.length > 0) {
    sections.push(""); // blank line
    sections.push(""); // blank line

    sections.push(
      jsonToCsv(
        "COMPARISON SAMPLES",
        a_AllComparisonSamples,
        a_ChangePoints.comparison,
        a_Annotations,
      ),
    );
  }

  const csvString = sections.join("\n");

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const fileName = `exportedScenes_${getLocaleISOString(new Date(Date.now()))}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const handleCopyProvenance = (
  a_AllMainSamples: INDVISample[],
  a_AllComparisonSamples: INDVISample[],
) => {
  const sections: string[] = [];

  // --- Main samples section ---
  if (a_AllMainSamples.length > 0) {
    sections.push("=== Main Samples ===");
    const mainHeader = ["ItemID", "Date"];
    const mainRows = a_AllMainSamples.map((i) => [i.featureId, i.datetime]);
    const mainCsv = [mainHeader, ...mainRows]
      .map((r) => r.join(","))
      .join("\n");
    sections.push(mainCsv);
  }

  // --- Comparison samples section ---
  if (a_AllComparisonSamples.length > 0) {
    sections.push("=== Comparison Samples ===");
    const compHeader = ["ItemID", "Date"];
    const compRows = a_AllComparisonSamples.map((i) => [
      i.featureId,
      i.datetime,
    ]);
    const compCsv = [compHeader, ...compRows]
      .map((r) => r.join(","))
      .join("\n");
    sections.push(compCsv);
  }

  // Join sections with double newlines for readability
  const finalText = sections.join("\n\n");

  // Copy to clipboard
  navigator.clipboard.writeText(finalText);

  alert("Copied scene list to clipboard!"); // optional toast/tooltip
};

export const isROIValid = (a_ROI: string, a_Marker: EMarkerType) => {
  let roi: any;

  try {
    roi = JSON.parse(a_ROI);
  } catch {
    return false;
  }

  switch (a_Marker) {
    case EMarkerType.point: {
      // Expected: [[lng, lat], radius]
      if (!Array.isArray(roi) || roi.length !== 2) return false;

      const [center, radius] = roi;
      if (!Array.isArray(center) || center.length !== 2) return false;
      for (const c of center) {
        if (isNaN(Number(c))) return false;
      }

      if (isNaN(Number(radius)) || Number(radius) <= 0) return false;

      return true;
    }
    case EMarkerType.polygon: {
      // Expected: [[lng, lat], [lng, lat], ...]
      if (!Array.isArray(roi) && roi.length < 4) return false;

      for (const coordinate of roi) {
        if (!Array.isArray(coordinate) || coordinate.length !== 2) return false;
        for (const l of coordinate) {
          if (isNaN(Number(l))) return false;
        }
      }
      return true;
    }
    default:
      return false;
  }
};

export const isDateValid = (a_Datetime: string) => {
  // Expected: 2025-12-12T09:48:12
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  return regex.test(a_Datetime);
};

export const isOperatorValid = (
  a_Op: string,
  a_Items: { title: string; value: string }[],
) => {
  return (
    a_Items.findIndex((i) => i.title.toLowerCase() == a_Op.toLowerCase()) !== -1
  );
};

export const isValidRange = (a_num: string, a_Min: number, a_Max: number) => {
  const number = Number(a_num);
  return !isNaN(number) && number >= a_Min && number <= a_Max;
};

export const isValidFilter = (a_Filter: string) => {
  return ["none", "z-score", "IQR"]
    .map((i) => i.toLowerCase())
    .includes(a_Filter.toLowerCase());
};

export const isValidBoolean = (a_Boolean: string) => {
  return ["false", "true"]
    .map((i) => i.toLowerCase())
    .includes(a_Boolean.toLowerCase());
};

export const isValidAnnotation = (a_Annotaions: string) => {
  let annotations: unknown;

  try {
    annotations = JSON.parse(a_Annotaions);
  } catch {
    return false;
  }

  if (!Array.isArray(annotations) || annotations.length === 0) {
    return false;
  }

  return annotations.every((a) => {
    if (
      typeof a !== "object" ||
      a === null ||
      typeof (a as any).featureId !== "string" ||
      typeof (a as any).datetime !== "string" ||
      typeof (a as any).note !== "string"
    ) {
      return false;
    }

    const { featureId, datetime, note } = a as any;

    return (
      featureId.trim().length > 0 &&
      datetime.trim().length > 0 &&
      note.trim().length > 0 &&
      note.length <= 120
    );
  });
};

export const getGapValue = (a_AllSamples: INDVISample[]) => {
  let lastValid: number | null = null;

  return a_AllSamples.map((s) => {
    if (s.meanNDVI != null) {
      lastValid = s.meanNDVI;
      return { ...s, meanNDVI_gap: null };
    }

    return {
      ...s,
      meanNDVI_gap: lastValid,
    };
  });
};

export const withGapIndicator = (
  points: IChartPoint[],
  key: keyof IChartPoint,
  gapKey: keyof IChartPoint,
): IChartPoint[] => {
  let lastValid: number | null = null;

  return points.map((p) => {
    const value = p[key] as number | null;

    if (value != null) {
      lastValid = value;
      return { ...p, [gapKey]: null };
    }

    return {
      ...p,
      [gapKey]: lastValid,
    };
  });
};

export const getAllSamples = (
  a_ValidSamples: INDVISample[],
  a_NotValidSamples: INDVISample[],
) => {
  const allSamples = [...a_ValidSamples, ...a_NotValidSamples].sort(
    (a, b) => a.id - b.id,
  );
  return allSamples;
};

export const getChartPoints = (
  a_ValidSamples: TSample,
  a_NotValidSamples: TSample,
  a_AnnotationItems: IAnnotationItem[],
  a_StartIndex?: number,
  a_EndIndex?: number,
): IChartPoint[] => {
  const mainSamples = getAllSamples(
    a_ValidSamples[ERequestContext.main],
    a_NotValidSamples[ERequestContext.main],
  );

  const comparisonSamples = getAllSamples(
    a_ValidSamples[ERequestContext.comparison],
    a_NotValidSamples[ERequestContext.comparison],
  );

  const hasComparison = comparisonSamples.length > 0;

  const comparisonByDatetime = new Map<string, INDVISample[]>();
  const annotations = new Map<string, IAnnotationItem>(
    a_AnnotationItems.map((a) => [a.featureId, a]),
  );
  for (const c of comparisonSamples) {
    const list = comparisonByDatetime.get(c.datetime) ?? [];
    list.push(c);
    comparisonByDatetime.set(c.datetime, list);
  }

  let points: IChartPoint[] = mainSamples.map((main) => {
    const list = comparisonByDatetime.get(main.datetime);
    const comparison = list?.shift();
    let note: string | null = null;
    const annotation = annotations.get(main.featureId);
    if (annotation) {
      note = annotation.note;
    }

    return {
      ...main,

      // main
      main_meanNDVI: main.meanNDVI,
      main_meanNDVISmoothed: main.meanNDVISmoothed,
      main_medianNDVI: main.medianNDVI,
      main_medianNDVISmoothed: main.medianNDVISmoothed,
      main_meanNDVI_gap: null,
      main_medianNDVI_gap: null,

      // comparison
      ...(hasComparison && {
        comparison_meanNDVI: comparison?.meanNDVI ?? null,
        comparison_meanNDVISmoothed: comparison?.meanNDVISmoothed ?? null,
        comparison_medianNDVI: comparison?.medianNDVI ?? null,
        comparison_medianNDVISmoothed: comparison?.medianNDVISmoothed ?? null,
        comparison_meanNDVI_gap: null,
        comparison_medianNDVI_gap: null,
        comparison_id: comparison?.id,
      }),

      note: note,
    };
  });

  points = withGapIndicator(points, "main_meanNDVI", "main_meanNDVI_gap");
  points = withGapIndicator(points, "main_medianNDVI", "main_medianNDVI_gap");
  if (hasComparison) {
    points = withGapIndicator(
      points,
      "comparison_meanNDVI",
      "comparison_meanNDVI_gap",
    );
    points = withGapIndicator(
      points,
      "comparison_medianNDVI",
      "comparison_medianNDVI_gap",
    );
  }
  /* log(
    "Chart Points",
    points.slice(a_StartIndex, a_EndIndex ? a_EndIndex + 1 : undefined),
  ); */
  return points.slice(a_StartIndex, a_EndIndex ? a_EndIndex + 1 : undefined);
};

export const getChartDataKey = (
  a_Context: ERequestContext,
  a_YAxis: EAggregationMethod,
  a_SmoothingWindow: string,
) => {
  const isSmoothed = a_SmoothingWindow !== "1";

  if (a_YAxis === EAggregationMethod.Mean) {
    return isSmoothed
      ? `${a_Context}_meanNDVISmoothed`
      : `${a_Context}_meanNDVI`;
  }

  return isSmoothed
    ? `${a_Context}_medianNDVISmoothed`
    : `${a_Context}_medianNDVI`;
};

export const getGapDataKey = (
  a_Context: ERequestContext,
  a_YAxis: EAggregationMethod,
) => {
  return `${getChartDataKey(a_Context, a_YAxis, "1")}_gap`;
};

export const getMergedSamples = (a_AllSamples: INDVISample[]) => {
  const map = new Map<string, INDVISample[]>();

  for (const s of a_AllSamples) {
    if (!map.has(s.datetime)) {
      map.set(s.datetime, []);
    }
    map.get(s.datetime)!.push(s);
  }

  return Array.from(map.entries()).map(([datetime, group]) => {
    const base = group[0];

    return {
      ...base,
      meanNDVI: getMean(group.map((s) => s.meanNDVI)),
      medianNDVI: getMean(group.map((s) => s.medianNDVI)),
      meanNDVISmoothed: getMean(group.map((s) => s.meanNDVISmoothed)),
      medianNDVISmoothed: getMean(group.map((s) => s.medianNDVISmoothed)),
    };
  });
};

export const formatTimestamp = (a_Date?: Date): string => {
  const now = a_Date ?? new Date();
  const timestamp = now.toISOString().replace("T", " ").replace("Z", "");
  return timestamp.substring(0, 23);
};

export const log = (
  a_Title: string,
  a_Message: any,
  a_Type: ELogLevel = ELogLevel.message,
): void => {
  const formattedMessage = `[${formatTimestamp()}] ${a_Title}`;
  const params = new URLSearchParams(window.location.search);
  const logLevel = params.get(EURLParams.loglevel);
  if (logLevel && logLevel === "3") {
    switch (a_Type) {
      case ELogLevel.message:
        console.log(formattedMessage, a_Message);
        break;
      case ELogLevel.warning:
        console.warn(formattedMessage, a_Message);
        break;
      case ELogLevel.error:
        console.error(formattedMessage, a_Message);
        break;
    }
  }
};

export const getSummaryInfo = (a_Samples: INDVISample[]) => {
  const allSamples = a_Samples;
  if (a_Samples.length === 0)
    return {
      totalUsed: "-",
      averageValidPixels: "-",
      firstDate: "-",
      lastDate: "-",
    };
  const validSamples = a_Samples.filter((s) => s.meanNDVI !== null);
  // Total / Used Scenes
  const validsLen = validSamples.length;
  const totalUsed = `${validsLen} / ${allSamples.length}`;

  // Average Valid Pixels
  const sumValidPixels = validSamples
    .map((s) => s.valid_fraction)
    .reduce((a, b) => a + b, 0);
  const averageValidPixels =
    validsLen !== 0 ? (sumValidPixels / validsLen).toFixed(2) : "-";

  // First / Last Date
  const sortedValids = validSamples.sort((a, b) => a.id - b.id);

  const firstDate = validsLen !== 0 ? sortedValids[0].datetime : "-";
  const lastDate = validsLen !== 0 ? sortedValids[validsLen - 1].datetime : "-";

  return { totalUsed, averageValidPixels, firstDate, lastDate };
};

export const getLatency = (
  a_RequestContext: ERequestContext,
  a_Latency: TLatency,
) => {
  if (a_RequestContext === ERequestContext.main) {
    return a_Latency.main ? `${(a_Latency.main / 1000).toFixed(2)} s` : "-";
  } else {
    return a_Latency.comparison
      ? `${(a_Latency.comparison / 1000).toFixed(2)} s`
      : "-";
  }
};

export const getValidity = (
  a_ValidSamples: number,
  a_AllSamples: number | undefined,
) => {
  return a_AllSamples ? `${a_ValidSamples}/${a_AllSamples}` : "-";
};

export const getMainItem = (a_FetchFeature: TFetchFeature) => {
  if (!a_FetchFeature.main) return null;
  return a_FetchFeature.main;
};

export const getComparisonItem = (a_FetchFeature: TFetchFeature) => {
  if (!a_FetchFeature.comparison) return null;
  return a_FetchFeature.comparison;
};

export const mapPolygonOptions = (polygons: IPolygon[]) =>
  polygons.map((p) => ({
    id: p.id,
    title: `Zonal ${p.id}`,
    value: `Zonal ${p.id}`,
  }));

export const getRejectionInfo = (a_NotValidFractions: IRejection) => {
  const text = Object.entries(a_NotValidFractions).reduce((acc, cur) => {
    if (cur[1] === 0) return acc;
    return acc + "\r\n" + `${cur[0]}: ${cur[1].toFixed(2)}%`;
  }, ``);
  return text;
};

export const wrapText = (a_Text: string, a_MaxChars: number) => {
  const words = a_Text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  const pushLine = () => {
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
      currentLine = "";
    }
  };

  words.forEach((word) => {
    if (word.length > a_MaxChars) {
      pushLine();

      for (let i = 0; i < word.length; i += a_MaxChars) {
        lines.push(word.slice(i, i + a_MaxChars));
      }
      return;
    }

    if ((currentLine + word).length > a_MaxChars) {
      pushLine();
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  });

  pushLine();
  return lines;
};
