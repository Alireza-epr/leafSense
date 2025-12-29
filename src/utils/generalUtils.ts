import { ESTACCollections, ITokenCollection, spatialItems } from "../types/apiTypes";
import { EMarkerType, ERequestContext, INDVISample, TChangePoint, TLatency, TSample } from "../store/mapStore";
import { getLocaleISOString } from "./dateUtils";
import { EAggregationMethod, ELogLevel, EURLParams, IChangePoint, IChartPoint } from "../types/generalTypes";
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
) => {
  if (!a_NDVISamples.length) return "";

  const excludedSamples = a_NDVISamples.map(
    ({ ndviArray, preview, ...rest }) => {
      let exportedSample = {
        ...rest,
        valid_fraction: rest.valid_fraction.toFixed(2) + "%",
        filter_fraction: rest.filter_fraction.toFixed(2) + "%",
      };
      const changePoint = a_ChangePoints.find((p) => p.id === rest.id);
      return {
        ...exportedSample,
        "change point": !!changePoint,
        "Z-Score": changePoint
          ? changePoint.z >= 0
            ? `+${changePoint.z.toFixed(2)}`
            : changePoint.z.toFixed(2)
          : "N/A",
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
) => {
  const sections: string[] = [];

  sections.push(
    jsonToCsv("MAIN SAMPLES", a_AllMainSamples, a_ChangePoints.main)
  );

  if (a_AllComparisonSamples.length > 0) {
    sections.push(""); // blank line
    sections.push(""); // blank line

    sections.push(
      jsonToCsv(
        "COMPARISON SAMPLES",
        a_AllComparisonSamples,
        a_ChangePoints.comparison
      )
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
  gapKey: keyof IChartPoint
): IChartPoint[] => {
  let lastValid: number | null = null;

  return points.map(p => {
    const value = p[key] as number | null;

    if (value != null) {
      lastValid = value;
      return { ...p, [gapKey]: null };
    }

    return {
      ...p,
      [gapKey]: lastValid
    };
  });
};

export const getAllSamples = (a_ValidSamples: INDVISample[], a_NotValidSamples: INDVISample[]) => {
  const allSamples = [...a_ValidSamples, ...a_NotValidSamples].sort(
    (a, b) => a.id - b.id,
  );
  return allSamples;
}

export const cloneSample = (s: INDVISample): IChartPoint => ({
  ...s,
  // is mutable, Spread does NOT clone it
  ndviArray: s.ndviArray ? new Float32Array(s.ndviArray) : null,
});

export const getChartPoints = (
  a_ValidSamples: TSample,
  a_NotValidSamples: TSample
): IChartPoint[] => {

  const mainSamples = getAllSamples(
    a_ValidSamples[ERequestContext.main],
    a_NotValidSamples[ERequestContext.main]
  );

  const comparisonSamples = getAllSamples(
    a_ValidSamples[ERequestContext.comparison],
    a_NotValidSamples[ERequestContext.comparison]
  );

  const hasComparison = comparisonSamples.length > 0;

  const comparisonByDatetime = new Map<string, INDVISample[]>();
  for (const c of comparisonSamples) {
    const list = comparisonByDatetime.get(c.datetime) ?? [];
    list.push(c);
    comparisonByDatetime.set(c.datetime, list);
  }

  let points: IChartPoint[] = mainSamples.map(main => {
    const list = comparisonByDatetime.get(main.datetime);
    const comparison = list?.shift(); 

    return {
      ...main,

      // main
      main_meanNDVI: main.meanNDVI,
      main_meanNDVISmoothed: main.meanNDVISmoothed,
      main_medianNDVI: main.medianNDVI,
      main_medianNDVISmoothed: main.medianNDVISmoothed,
      main_meanNDVI_gap: null,

      // comparison
      ...(hasComparison && {
        comparison_meanNDVI: comparison?.meanNDVI ?? null,
        comparison_meanNDVISmoothed: comparison?.meanNDVISmoothed ?? null,
        comparison_medianNDVI: comparison?.medianNDVI ?? null,
        comparison_medianNDVISmoothed: comparison?.medianNDVISmoothed ?? null,
        comparison_meanNDVI_gap: null,
        comparison_id: comparison?.id
      }),
    };
  });

  points = withGapIndicator(points, "main_meanNDVI", "main_meanNDVI_gap");
  if (hasComparison) {
    points = withGapIndicator(
      points,
      "comparison_meanNDVI",
      "comparison_meanNDVI_gap"
    );
  }

  return points;
};


export const getChartPoints2 = (a_ValidSamples: TSample, a_NotValidSamples: TSample): IChartPoint[] => {
  const map = new Map<string, IChartPoint>()
  const mainSamples = getAllSamples(a_ValidSamples[ERequestContext.main], a_NotValidSamples[ERequestContext.main])
  const comparisonSamples = getAllSamples(a_ValidSamples[ERequestContext.comparison], a_NotValidSamples[ERequestContext.comparison])
  const applyExtension = (a_NDVISample: INDVISample, a_Context: ERequestContext) => {
    const existing = map.get(a_NDVISample.datetime) ?? cloneSample(a_NDVISample);

    const next: IChartPoint = {
      ...existing,
      [`${a_Context}_meanNDVI`]: a_NDVISample.meanNDVI,
      [`${a_Context}_meanNDVISmoothed`]: a_NDVISample.meanNDVISmoothed,
      [`${a_Context}_medianNDVI`]: a_NDVISample.medianNDVI,
      [`${a_Context}_medianNDVISmoothed`]: a_NDVISample.medianNDVISmoothed,
    };

    map.set( a_NDVISample.datetime, next )
  }

  mainSamples.forEach(s => {
    applyExtension(s, ERequestContext.main)
  });
  comparisonSamples.forEach(s => {
    applyExtension(s, ERequestContext.comparison)
  });

  let points = Array.from(map.values()).sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );


  // Apply gaps AFTER merge
  points = withGapIndicator(
    points,
    "main_meanNDVI",
    "main_meanNDVI_gap"
  );

  points = withGapIndicator(
    points,
    "comparison_meanNDVI",
    "comparison_meanNDVI_gap"
  );

  return points;
}

export const getChartDataKey = (a_Context: ERequestContext, a_YAxis: EAggregationMethod, a_SmoothingWindow: string) => {
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

export const getGapDataKey = (a_Context: ERequestContext, a_YAxis: EAggregationMethod) => {
  return `${getChartDataKey(a_Context, a_YAxis, "1")}_gap`;
}

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
      meanNDVI: getMean(group.map(s => s.meanNDVI)),
      medianNDVI: getMean(group.map(s => s.medianNDVI)),
      meanNDVISmoothed: getMean(group.map(s => s.meanNDVISmoothed)),
      medianNDVISmoothed: getMean(group.map(s => s.medianNDVISmoothed)),
    };
  });
}

export const formatTimestamp = (a_Date?: Date): string => {
  const now = a_Date ?? new Date();
  const timestamp = now.toISOString().replace('T', ' ').replace('Z', '');
  return timestamp.substring(0, 23);
};

export const log = (a_Title: string, a_Message: any, a_Type: ELogLevel = ELogLevel.message): void => {
  const formattedMessage = `[${formatTimestamp()}] ${a_Title}`;
  const params = new URLSearchParams(window.location.search);
  const logLevel = params.get( EURLParams.loglevel )
  if (logLevel && logLevel === "3") {
    switch(a_Type){
      case ELogLevel.message: console.log(formattedMessage, a_Message);break;
      case ELogLevel.warning: console.warn(formattedMessage, a_Message);break;
      case ELogLevel.error: console.error(formattedMessage, a_Message);break;
    }
  }
};


export const getSummaryInfo = (a_Samples: INDVISample[]) => {

  const allSamples = a_Samples
  if(a_Samples.length === 0) return { totalUsed: "-" , averageValidPixels: "-", firstDate: "-", lastDate: "-" }
  const validSamples = a_Samples.filter( s => s.meanNDVI !== null )
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
  const sortedValids = validSamples
    .sort((a, b) => a.id - b.id);

  const firstDate = validsLen !== 0 ? sortedValids[0].datetime : "-";
  const lastDate = validsLen !== 0 ? sortedValids[validsLen - 1].datetime : "-";

  return { totalUsed, averageValidPixels, firstDate, lastDate }
}

export const getLatency = (a_RequestContext: ERequestContext, a_Latency: TLatency) =>{
  if(a_RequestContext === ERequestContext.main){
    return a_Latency.main ? `${(a_Latency.main / 1000).toFixed(2)} s` : "-"
  } else {
    return a_Latency.comparison ? `${(a_Latency.comparison / 1000).toFixed(2)} s` : "-"
  }
} 

export const getValidity = (a_ValidSamples: number, a_AllSamples: number | undefined) => {
  return a_AllSamples ? `${a_ValidSamples}/${a_AllSamples}` : "-";
};




