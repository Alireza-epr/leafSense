import { INDVISample } from "src/store/mapStore"
import { getLocaleISOString } from "./dateUtils"

export const toFirstLetterUppercase = (a_String: string | null) => {
    if(!a_String) return 

    const firstLetter = a_String[0]
    const allLetters = a_String.split("")
    allLetters[0] = firstLetter.toUpperCase()
    return allLetters.join("")
}

export const jsonToCsv = (a_NDVISamples: INDVISample[]) => {
    if (!a_NDVISamples.length) return "";

    const excludedSamples = a_NDVISamples.map(({ndviArray, preview, ...rest})=> rest)

    const headers = Object.keys(excludedSamples[0]);

    const delimiter = ";";

    const csvRows = [
        headers.join(delimiter), // header row
        ...excludedSamples.map(sample =>
        headers.map(header => {
            const value = sample[header];
            // handle null / undefined safely
            return value === null || value === undefined
            ? "N/A" 
            : `"${String(value).replace(/"/g, '""')}"`; //If a value itself contains a double quote ("), CSV requires it to be escaped by doubling it.
        }).join(delimiter)
        )
    ];


    return csvRows.join("\n");
};

export const downloadCSV = (a_NDVISamples: INDVISample[]) => {
    const csvString = jsonToCsv(a_NDVISamples)

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