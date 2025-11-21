export const getLocaleISOString = (a_Date: Date) => {
    const localeTimeISO = a_Date.toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
    const localeDateISO = a_Date.toLocaleDateString("sv-SE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })

    return `${localeDateISO}T${localeTimeISO}`
}